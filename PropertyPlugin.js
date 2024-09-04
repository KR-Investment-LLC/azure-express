/*
 * Copyright (c) 2024, KRI, LLC. All rights reserved
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

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
    static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/PropertyPlugin"}};

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