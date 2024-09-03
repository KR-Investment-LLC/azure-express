import {AbstractPlugin} from "./AbstractPlugin.js";
import {LocalCredentialManager} from "./CredentialManager.js";

/**
 * @description
 * @author Robert R Murrell
 */
export class LocalCredentialsPlugin extends AbstractPlugin {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/LocalCredentialsPlugin"}};

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        super(context);
    }

    get hasMiddleware() {return true;}

    get attributeName() {
        let _name = this.pluginConfig.attributeName | "credentials";
    }

    get middleware() {
        let _attribute = this.attributeName;
        let _credManager = /**@type{LocalCredentialManager}*/this.context.getManager(LocalCredentialManager);

        return (/**@type{import('express').Request}*/req, /**@type{import('express').Response}*/res, next) => {
            req[_attribute] = _credManager;
            res[_attribute] = _credManager;
            next();
        };
    }
}

/**
 * @description Factory Method for creating an instance of LoggingPluginConfig
 * @param {ApplicationContext} context
 * @returns {Promise<LocalCredentialsPlugin>}
 */
export async function create(context) {
    return new LocalCredentialsPlugin(context);
}