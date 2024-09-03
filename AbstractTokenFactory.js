import {ApplicationLog} from "./ApplicationLog.js";

/**
 * @abstract
 */
export class AbstractTokenFactory {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/AbstractTokenFactory"}};

    constructor(pluginConfig, logger) {
        this._pluginConfig = pluginConfig;
        this._logger = logger;
    }

    /**@returns{Object}*/get pluginConfig() {return this._pluginConfig;}
    /**@returns{ApplicationLog}*/get log() {return this._logger;}

    /**
     *
     * @param {import('express').Request} request
     * @returns {Promise<string>}
     * @abstarct
     */
    async getToken(request) {
        throw CouchClubhouseError.NotImplementedError();
    }
}