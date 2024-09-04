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

import {AppConfigurationClient} from "@azure/app-configuration";
import {SecretClient} from "@azure/keyvault-secrets";
import {AbstractPropertyFactory} from "./AbstractPropertyFactory.js";
import {isInstanceOf} from "./Global.js";

export class AppConfigPropertyFactory extends AbstractPropertyFactory {
    static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/AppConfigPropertyFactory"}};

    /**
     * @description
     * @param context
     * @param log
     */
    constructor(context, log) {
        super(context, log);
        /**@type{Array<AppConfigurationClient>}*/this._appConfigClients = [];
        /**@type{SecretClient}*/this._keyVaultClient = null;
    }

    setKeyVaultSecretClient(client) {
        if(!isInstanceOf(SecretClient, client))
            throw CouchClubhouseError.fromError("Parameter 'client' must be instance of SecretClient.");
        this._keyVaultClient = client;
    }

    addAppConfigClient(client) {
        if(!isInstanceOf(AppConfigurationClient, client))
            throw CouchClubhouseError.fromError("Parameter 'client' must be instance of AppConfigurationClient.");
        this._appConfigClients.push(client);
    }

    /**
     * @description
     * @param {string} name
     * @returns {null|string}
     */
    async _getProperty(name) {
        let _value = null;
        for(/**@type{AppConfigurationClient}*/let client of this._appConfigClients) {
            try {
                // Try to get the configuration value
                const response = await client.getConfigurationSetting(
                    {key: name, label: this.context.environment});
                // Check if the response has a value
                if(response?.value) {
                    this.log.debug(`Found configuration value for key "${name}": ${response.value}`);
                    // Check if the value is a Key Vault reference
                    if(response.contentType === 'application/vnd.microsoft.appconfig.keyvaultref+json;charset=utf-8' && this._keyVaultClient) {
                        const kvReference = JSON.parse(response.value);
                        const secretUri = kvReference.uri;

                        this.log.debug(`The configuration value is a Key Vault reference. Fetching secret from: ${secretUri}`);
                        // Fetch the secret value from Key Vault
                        const secret = await this._keyVaultClient.getSecret(secretUri);
                        _value = secret.value;
                    }
                    else _value = response.value;
                }
            }
            catch(error) {
                this.log.info(`Error getting config ${name} from client.`, error);
                // Continue to the next client
            }
        }

        if(!_value)
            this.log.info(`Config ${name} not found.`);

        return _value;
    }
}