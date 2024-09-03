import {ApplicationContext} from "./ApplicationContext.js";
import {AbstractManager} from "./AbstractManager.js";
import {LoggingManager} from "./LoggingManager.js";
import {ApplicationLog} from "./ApplicationLog.js";

/**
 *
 */
export class AbstractApplicationManager extends AbstractManager {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/AbstractApplicationManager"}};

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        super();
        /**@type{ApplicationContext}*/this._context = context;
        /**@type{ApplicationLog}*/this._log = context.getManager(LoggingManager).child(this.constructor.name);
    }

    /**@returns{ApplicationContext}*/get context() {return this._context;}
    /**@returns{ApplicationLog}*/get log() {return this._log;}
}
