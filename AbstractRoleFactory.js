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
 *
 * @abstract
 */
export class AbstractRoleFactory {
    static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/AbstractRoleFactory"}};

    /**
     * @param {ApplicationContext} context
     * @param {AbstractRoleFactory} link
     */
    constructor(context, link = null) {
        this._context = context;
        /**@type{AbstractRoleFactory}*/this._link = link;
    }

    /**@returns{ApplicationContext}*/get context() {return this._context;}

    addLink(link) {
        if(this._link) this._link.addLink(link);
        else this._link = link;
    }

    async getRoles(claims, roles = []) {
        return _.union(
            roles,
            await this._getRoles(claims),
            this._link ? await this._link.getRoles(claims) : []
        );
    }

    /**
     * @description
     * @param claims
     * @returns {Promise<*[]>}
     * @private
     * @abstract
     */
    async _getRoles(claims) {return [];}
}