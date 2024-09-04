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

/**
 * @abstract
 */
export class AbstractPropertyFactory {
    static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/AbstractPropertyFactory"}};

    /**
     * @description
     * @param {AbstractPropertyFactory} [link]
     * @param {import('./ApplicationContext.js').ApplicationContext} context
     * @param {import('./LoggingManager.js').ApplicationLog}log
     */
    constructor(context, log, link = null) {
        /**@type{AbstractPropertyFactory}*/this.link = null;
        /**@type{import('./ApplicationContext.js').ApplicationContext}*/this._context = context;
        /**@type{import('./LoggingManager.js').ApplicationLog}*/this._log = log;
    }

    /**
     * @description Adds a link to the chain
     * @param {AbstractPropertyFactory} link
     */
    addLink(link) {
        if(!this._link) this._link = link;
        else this._link.addLink(link);
    }

    /**@return{import('./ApplicationContext.js').ApplicationContext}*/get context() {return this._context;}
    /**@return{import('./LoggingManager.js').ApplicationLog}*/get log() {return this._log;}

    async getProperty(name) {
        let _prop = await this._getProperty(name);
        if(!_prop) {
            if(this._link) return this._link.getProperty(name);
            else return null;
        }
        else return _prop;
    }

    /**
     * @description
     * @param {string} name
     * @returns {Promise<*>}
     * @private
     */
    async _getProperty(name) {throw new Error("Not Implemented.");}
}
