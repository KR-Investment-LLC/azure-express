import {AbstractPlugin} from "./AbstractPlugin.js";
import {ApplicationError} from "./Global.js";

/**
 * @typedef {Object} PropertyPluginConfig
 * @property {string} attributeName
 *
 */

/**
 * @description
 * @author Robert R Murrell
 */
export class PropertyPlugin extends AbstractPlugin {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/PropertyPlugin"}};

    static ATTRIBUTE_NAME = "attributeName";

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        super(context);
    }

    get hasMiddleware() {return true;}

    async getAttributeName(options = {}) {
        if(options && options[PropertyPlugin.ATTRIBUTE_NAME]) return options[PropertyPlugin.ATTRIBUTE_NAME];
        return this.properties.getProperty(PropertyPlugin.ATTRIBUTE_NAME, "properties");
    }

    get middleware() {
        let _this = this;
        return async (/**@type{import('express').Request}*/req, /**@type{import('express').Response}*/res, next) => {
            try {
                let _attribute = await _this.getAttributeName();
                let _properties = _this.properties;
                req[_attribute] = _properties;
                res[_attribute] = _properties;
                next();
            }
            catch(error) {
                next(ApplicationError.fromError(error));
            }
        };
    }
}

/**
 * @description Factory Method for creating an instance of PropertyPlugin
 * @param {ApplicationContext} context
 * @returns {Promise<PropertyPlugin>}
 */
export async function create(context) {
    return new PropertyPlugin(context);
}