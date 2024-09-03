import {AbstractPlugin} from "./AbstractPlugin.js";
import {JSON} from "mocha/lib/reporters/index.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import {ApplicationError, RestRequest} from "./Global.js";
import {ApplicationContext} from "./ApplicationContext.js";
import {APPLICATION_LOG} from "./ApplicationLog.js";
import {PluginManager} from "./PluginManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} SchemaPluginConfig
 * @property {string} directory
 * @property {boolean} requireSchema
 * @property {string} attributeName
 */

/**
 * @description
 * @author Robert R Murrell
 */
export class SchemaPlugin extends AbstractPlugin {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/SchemaPlugin"}};

    static ATTRIBUTE_NAME = "attributeName";
    static ATTRIBUTE_SCHEMA_PATH = "attributeName";
    static ATTRIBUTE_REQUIRED = "requireSchema";

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        super(context);
        this._ajv = null;
    }

    async getAttributeName(options = {}) {
        if(options && options[SchemaPlugin.ATTRIBUTE_NAME]) return options[SchemaPlugin.ATTRIBUTE_NAME];
        return this.properties.getProperty(SchemaPlugin.ATTRIBUTE_NAME, "schema");
    }

    async getSchemaPath(options) {
        if(options && options[SchemaPlugin.ATTRIBUTE_SCHEMA_PATH]) return options[SchemaPlugin.ATTRIBUTE_SCHEMA_PATH];
        return this.properties.getProperty(SchemaPlugin.ATTRIBUTE_SCHEMA_PATH, "./schemas");
    }

    async getRequireSchema(options) {
        if(options && options[SchemaPlugin.ATTRIBUTE_REQUIRED]) return options[SchemaPlugin.ATTRIBUTE_REQUIRED];
        return this.properties.getProperty(SchemaPlugin.ATTRIBUTE_REQUIRED, true);
    }

    get hasMiddleware() {return true;}
    /**@returns{Ajv}*/get validator() {return this._ajv;}

    async _initialize() {
        this._ajv = new Ajv({ allErrors: true, strict: false });
        let _path = await this.getSchemaPath();
        fs.readdirSync(_path).forEach(file => {
            if(path.extname(file) === '.json') {
                const schema = JSON.parse(fs.readFileSync(path.join(_path, file), 'utf-8'));
                this._ajv.addSchema(schema, schema.$id || schema.title || file);
            }
        });
    }

    get middleware() {
        let _this = this;
        return async (/**@type{import('express').Request}*/req, /**@type{import('express').Response}*/res, next) => {
            try {
                let _attributeName = await _this.getAttributeName();
                req[_attributeName] = _this;
                res[_attributeName] = _this;
                next();
            }
            catch(error) {
                next(ApplicationError.fromError(error));
            }
        }
    }
}

function validSchema(validator, value, schema, options = {requireSchema: true}) {
    let _schema = validator.getSchema(schema);
    let _valid;

    if(_schema) {
        _valid = _schema(value);
        if(!_valid) options.errors = _schema.errors;
    }
    else {
        if(!(_valid = !options.requireSchema))
            throw ApplicationError.BadRequestError(`Schema ${schema} not found.`);
    }

    return _valid;
}

/**
 *
 * @param options
 * @returns {(function(*, *, *): (*|undefined))|*}
 */
export function validate(options = {attributeName: "schema", requireSchema: true}) {
    return async (/**@type{import('express').Request}*/req, /**@type{import('express').Response}*/res, next) => {
        try {
            /**@type{ApplicationContext}*/let _context = /**@type{ApplicationContext}*/req.app.get(ApplicationContext.name);
            if(!_context)
                next(ApplicationError.InternalServerError("Application Context not found."));
            else {
                /**@type{PluginManager}*/let _pluginManager = /**@type{PluginManager}*/_context.getManager(PluginManager);
                if(!_pluginManager)
                    next(ApplicationError.InternalServerError("Plugin Manager not found."));
                else {
                    /**@type{SchemaPlugin}*/let _schemaPlugin = /**@type{SchemaPlugin}*/_pluginManager.getPlugin(SchemaPlugin);
                    if(!_schemaPlugin)
                        next(ApplicationError.InternalServerError("Schema Plugin not found."));
                    else {
                        options.requireSchema = await _schemaPlugin.getRequireSchema(options);
                        /**@type{Ajv}*/let _validator = _schemaPlugin.validator;
                        if(validSchema(_validator, req.body, RestRequest.$object.type, options)) {
                            if (validSchema(_validator, req.body.payload, req.body.payload.$object.type, options))
                                next();
                            else
                                next(ApplicationError.BadRequestError(options.errors));
                        }
                        else
                            next(ApplicationError.BadRequestError(options.errors));
                    }
                }
            }
        }
        catch(error) {
            next(ApplicationError.fromError(error));
        }
    };
}

/**
 * @description Factory Method for creating an instance of SchemaPlugin
 * @param {ApplicationContext} context
 * @returns {Promise<SchemaPlugin>}
 */
export async function create(context) {
    return new SchemaPlugin(context);
}