
import _ from "lodash";
import {Issuer} from 'openid-client';
import jwt from 'jsonwebtoken';
import {APPLICATION_LOG} from "./ApplicationLog.js";
import {ApplicationError, RestRequest} from "./Global.js";
import {AbstractPlugin} from "./AbstractPlugin.js";
import {AbstractRoleFactory} from "./AbstractRoleFactory.js";
import {AbstractTokenFactory} from "./AbstractTokenFactory.js";
import {JwtSubject} from "./Subject.js";
import {ApplicationContext} from "./ApplicationContext.js";
import {PluginManager} from "./PluginManager.js";

/**
 * @typedef IssuerConfig
 * @property {Issuer} issuer
 * @property {string} [tenant]
 * @property {string} discoveryUrl
 * @property {string} issuerUrl
 * @property {string} audiance
 * @property {number} [skew]
 * @property {Array<string>} defaultRoles
 */

/**
 * @description
 */
export class JwtValidator {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/JwtValidator"}};
    /**
     * @param {ApplicationLog} log
     * @param {Object} issuers
     * @param {AbstractRoleFactory} roleFactory
     * @param {AbstractTokenFactory} tokenFactory
     */
    constructor(log, issuers, roleFactory, tokenFactory) {
        this._issuers = issuers;
        this._roleFactory = roleFactory;
        this._tokenFactory = tokenFactory;
        this._log = log.child(this.constructor.name);
    }

    /**@returns{ApplicationLog}*/get log() {return this._log;}

    /**
     * @param {string} token
     * @returns {{payload: any, signature: *, header: *}}
     */
    decodeToken(token) {
        let _decoded = jwt.decode(token, {complete: true});
        if(!_decoded) {
            this.log.threat("Invalid token, unable to decode.");
            throw ApplicationError.NotAuthorizedError();
        }
        return _decoded;
    }

    /**
     *
     * @param {string} issuer
     * @returns {IssuerConfig}
     */
    getIssuer(issuer) {
        let _issuer = this._issuers[issuer];
        if(!_issuer) {
            this.log.threat(`No issuer found for ${issuer}, not authorized.`);
            throw ApplicationError.NotAuthorizedError();
        }
    }

    /**
     * @description Verifies an Open-ID token
     * @param token
     * @returns {Promise<JwtSubject>}
     */
    async validate(token) {
        try {
            let _decoded = this.decodeToken(token);
            let _config = this.getIssuer(_decoded.payload.iss);
            let _skew = _config.skew || 5;

            this.log.info(`Authorizing subject ${_decoded.payload.sub} for issuer ${_decoded.payload.iss} using audience ${_decoded.payload.iss}.`)

            const _client = new _config.issuer.Client({
                client_id: _config.audiance,
            });

            // Now fully validate the token using the issuer's public keys
            const verifiedToken = await _client.validateJWT(token, {
                clockTolerance: _skew,
            });

            // Example checks for audience and other claims can be added here
            if(verifiedToken.aud !== _config.audiance) {
                this.log.threat(`Invalid audience ${verifiedToken.aud}, forbidden.`);
                throw ApplicationError.ForbiddenError();
            }

            let _roles = _config.defaultRoles;

            return new JwtSubject(verifiedToken, await this._roleFactory.getRoles(verifiedToken, _roles));
        }
        catch(error) {
            this.log.threat(`Error validating JWT token.`, error);
            throw ApplicationError.NotAuthorizedError("Not Authorized", error);
        }
    }
}

/**
 * @description
 * @author Robert R Murrell
 */
export class JwtPlugin extends AbstractPlugin {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/JwtPlugin"}};

    static ATTRIBUTE_NAME = "attributeName";
    static ATTRIBUTE_SUBJECT = "subject";
    static ATTRIBUTE_STRICT = "strict";

    constructor(context) {
        super(context);
        /**@type{JwtValidator}*/this._validator = null;
        /**@type{AbstractTokenFactory}*/this._tokenFactory = null;
    }

    /**@returns{JwtValidator}*/get validator() {return this._validator;}

    async getAttributeName(options = {}) {
        if(options && options[JwtPlugin.ATTRIBUTE_NAME]) return options[JwtPlugin.ATTRIBUTE_NAME];
        return this.properties.getProperty(JwtPlugin.ATTRIBUTE_NAME, "jwt");
    }

    async getSubjectAttributeName(options = {}) {
        if(options && options[JwtPlugin.ATTRIBUTE_SUBJECT]) return options[JwtPlugin.ATTRIBUTE_SUBJECT];
        return this.properties.getProperty(JwtPlugin.ATTRIBUTE_SUBJECT, "subject");
    }

    async getStrict(options = {}) {
        if(options && options[JwtPlugin.ATTRIBUTE_STRICT]) return options[JwtPlugin.ATTRIBUTE_STRICT];
        return this.properties.getProperty(JwtPlugin.ATTRIBUTE_STRICT, true);
    }

    get hasMiddleware() {return true;}

    async _initialize() {
        //
    }

    get middleware() {
        let _this = this;
        return async (/**@type{import('express').Request}*/req, /**@type{import('express').Response}*/res, next) => {
            try {
                let _attribute = await _this.getAttributeName();
                req[_attribute] = _this.validator;
                res[_attribute] = _this.validator;
                next();
            }
            catch(error) {
                next(ApplicationError.fromError(error));
            }
        };
    }

    /**@returns{AbstractTokenFactory}*/get tokenFactory() {return this._tokenFactory;}
}

/**
 * @abstract
 */
export class AbstractMatchType {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/AbstractMatchType"}};
    constructor(link = null) {
        this.link = link;
    }

    /**
     * @param {Array<string>} source
     * @param {Array<string>} target
     * @returns {boolean}
     */
    match(source = [], target = []) {
        if(this._match(source, target))
            return (this.link)? this.link.match(source, target) : true;
        return false;
    }

    /**
     * @param {Array<string>} source
     * @param {Array<string>} target
     * @returns {boolean}
     * @private
     * @abstract
     */
    _match(source, target) {return false;}

    /**
     * @param {(null|AbstractMatchType)} [link]
     * @returns AbstractMatchType
     * @abstract
     */
    static create(link) {
        throw ApplicationError.NotImplementedError();
    }
}

/**
 * @description Tests the source matches any string element in target
 */
export class MatchAny extends AbstractMatchType {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/MatchAny"}};
    constructor(link = null) {
        super(link);
    }
    _match(source, target) {
        if(!_.isEmpty(_.intersection(source, target)))
            return this.link ? this.link(source, target) : true;
        return false;
    }
    static create(link = null) {
        return new MatchAny(link);
    }
}

/**
 * @description Tests the source matches all string elements in target,without regard for ordering.
 */
export class MatchAll extends AbstractMatchType {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/MatchAll"}};
    constructor(link = null) {
        super(link);
    }
    _match(source, target) {
        if(_.isEqual(_.sortBy(source), _.sortBy(target)))
            return this.link ? this.link(source, target) : true;
        return false;
    }
    static create(link = null) {
        return new MatchAll(link);
    }
}

/**
 * @description Tests the source matches all string elements in target,without regard for ordering.
 */
export class MatchNone extends AbstractMatchType {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/MatchNone"}};
    constructor(link = null) {
        super(link);
    }
    _match(source, target) {
        if(!_.isEmpty(_.intersection(source, target)))
            return false;
        return this.link ? this.link(source, target) : true;
    }
    static create(link = null) {
        return new MatchNone(link);
    }
}

/**
 * @description
 * @param {Array<string>} roles
 * @param {AbstractMatchType} [match]
 * @param {Object} [options]
 * @returns {(function(import('express').Request, import('express').Response, function(*)): Promise<*>)|*}
 */
export function secure(roles = [], match = MatchAny.create(), options = {}) {
    return async (/**@type{import('express').Request}*/req, /**@type{import('express').Response}*/res, next) => {
        try {
            /**@type{ApplicationContext}*/let _context = /**@type{ApplicationContext}*/req.app.get(ApplicationContext.name);
            if(!_context)
                next(ApplicationError.NotAuthorizedError("Application Context not found."));
            else {
                /**@type{PluginManager}*/let _pluginManager = /**@type{PluginManager}*/_context.getManager(PluginManager);
                if(!_pluginManager)
                    next(ApplicationError.NotAuthorizedError("Plugin Manager not found."));
                else {
                    /**@type{JwtPlugin}*/let _jwtPlugin = /**@type{JwtPlugin}*/_pluginManager.getPlugin(JwtPlugin);
                    if(!_jwtPlugin)
                        next(ApplicationError.NotAuthorizedError("JWT Plugin not found."));
                    else {
                        let _subjectAttributeName = await _jwtPlugin.getAttributeName(options);
                        let _strict = await _jwtPlugin.getStrict(options);

                        /**@type{JwtSubject}*/let _subject = /**@type{JwtSubject}*/req[_subjectAttributeName];
                        if(!_subject) {
                            let _jwtValidator = _jwtPlugin.validator;
                            _subject = await _jwtValidator.validate(_jwtPlugin.tokenFactory.getToken(req));
                            req[_subjectAttributeName] = _subject;
                        }

                        if(_subject.isExpired && _strict)
                            next(ApplicationError.NotAuthorizedError(`Subject ${_subject.subject} token expired and strict is enabled.`));
                        else if(!match.match(_subject.roles, roles))
                            next(ApplicationError.ForbiddenError(`Subject ${_subject.subject} failed to match roles, forbidden.`));
                        else
                            next();
                    }
                }
            }
        }
        catch(error) {
            next(ApplicationError.fromError(error));
        }
    }
}

/**
 * @description Factory Method for creating an instance of JwtPlugin
 * @param {ApplicationContext} context
 * @returns {Promise<JwtPlugin>}
 */
export async function create(context) {
    return new JwtPlugin(context);
}