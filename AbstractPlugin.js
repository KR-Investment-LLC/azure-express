import {LoggingManager} from "./LoggingManager.js";
import {PropertyManager} from "./PropertyManager.js";
import {LocalCredentialManager} from "./CredentialManager.js";

/**
 * A plugin is a means to adding foundational capabilities to CouchClubhouse. Plugins are loaded and cached
 * @abstract
 */
export class AbstractPlugin {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/AbstractPlugin"}};

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        /**@type{ApplicationContext}*/this._context = context;
        this._initialized = false;
        this._log = context.getManager(LoggingManager).child(this.constructor.name);
        this._properties = context.getManager(PropertyManager).namespace(this.constructor.name);
        this._credentials = /**@type{LocalCredentialManager}*/context.getManager(LocalCredentialManager);
    }

    /**@returns{boolean}*/get initialized() {return this._initialized;}
    /**@returns{boolean}*/get hasMiddleware() {return false;}
    /**@returns{ApplicationContext}*/get context() {return this._context;}
    /**@returns{ApplicationLog}*/get log() {return this._log;}
    /**@returns{ApplicationProperties}*/get properties() {return this._properties;}
    /**@returns{LocalCredentialManager}*/get credentials() {return this._credentials;}

    /**
     * @description Initializes this plugin.
     * @return {Promise<void>}
     */
    async initialize() {
        await this._initialize();
        this._initialized = true;
    }

    /**
     * @description Private lifecycle function to handle initialization.
     * @return {Promise<void>}
     * @private
     */
    async _initialize() {
        // do nothing
    }

    /**
     * @return {null|function(Object, Object, function())}
     */
    get middleware() {return (req, res, next) => {next();};}
}