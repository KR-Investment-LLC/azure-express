import {AbstractPropertyFactory} from "./AbstractPropertyFactory.js";

export class EnvironmentPropertyFactory extends AbstractPropertyFactory {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/EnvironmentPropertyFactory"}};

    /**
     * @description
     * @param {import('./ApplicationContext.js').ApplicationContext} context
     * @param {import('./LoggingManager.js').ApplicationLog}log
     * @param {AbstractPropertyFactory} [link]
     */
    constructor(context, log, link = null) {
        super(context, log, link);
    }

    /**
     * @description
     * @param {string} name
     * @returns {null|string}
     */
    async _getProperty(name) {
        return process.env[name];
    }
}