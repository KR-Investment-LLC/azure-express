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

import {ManagedIdentityCredential} from "@azure/identity";
import {AbstractApplicationManager} from "./AbstractApplicationManager.js";

export class LocalCredentialManager extends AbstractApplicationManager {
    static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/LocalCredentialManager"}};

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        super(context);
        this._credentials = {};
    }

    /**
     * @description Creates a new ManagedIdentityCredential for the specified identity.
     * @param identity
     * @return {import('@azure/identity').TokenCredential}
     */
    createIdentityCredential(identity) {
        return new ManagedIdentityCredential(identity);
    }

    /**
     * @description Returns the ManagedIdentityCredential for the managed identity specified.
     * @param {string} identity
     * @return {ManagedIdentityCredential}
     */
    getIdentityCredential(identity) {
        this.log.debug(`Getting identity credential for identity ${identity}.`);
        let _credential = /**@type{ManagedIdentityCredential}*/this._credentials[identity];
        if(!_credential) {
            _credential = /**@type{ManagedIdentityCredential}*/this.createIdentityCredential(identity);
            this._credentials[identity] = _credential;
        }
        return _credential;
    }

    /**
     * @description Returns an access token for the specified identity and resource.
     * @param {string} identity
     * @param {string} resourceUrl
     * @return {Promise<AccessToken>}
     */
    async getToken(identity, resourceUrl) {
        let _credential = this.getIdentityCredential(identity);
        resourceUrl = resourceUrl.replace(/\/.default$/, '');
        return await _credential.getToken(resourceUrl);
    }

    /**
     * @description Returns a token credential for the specified identity.
     * @param {string} identity
     * @return {import('@azure/identity').TokenCredential}
     */
    getTokenCredential(identity) {
        let _identity = this.getIdentityCredential(identity);
        return /**@type{import('@azure/identity').TokenCredential}*/{
            getToken: async (scopes) => {
                let scopeArray = Array.isArray(scopes) ? scopes : [scopes];
                let resourceUrl = scopeArray[0].replace(/\/.default$/, '');
                return _identity.getToken(identity, resourceUrl);
            },
        };
    }
}
