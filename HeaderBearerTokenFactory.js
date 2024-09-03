import {AbstractTokenFactory} from "./AbstractTokenFactory.js";

/**
 * @description
 * @author Robert R Murrell
 */
export class HeaderBearerTokenFactory extends AbstractTokenFactory {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/HeaderBearerTokenFactory"}};
    constructor(pluginConfig) {
        super(pluginConfig);
    }

    get header() {}

    /**
     * @description
     * @param {import('express').Request} request
     * @returns {Promise<string>}
     */
    async getToken(request) {
        let _token = request.headers["authorization"];
    }
}