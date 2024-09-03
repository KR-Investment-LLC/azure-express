import {ManagedIdentityCredential} from "@azure/identity";
import {AbstractApplicationManager} from "./AbstractApplicationManager.js";

export class LocalCredentialManager extends AbstractApplicationManager {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/LocalCredentialManager"}};

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
