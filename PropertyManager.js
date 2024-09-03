import moment from "moment";
import _ from "lodash";
import {AbstractApplicationManager} from "./AbstractApplicationManager.js";
import {EnvironmentPropertyFactory} from "./EnvironmentPropertyFactory.js";
import {isInstanceOf, ApplicationError} from "./Global.js";
import {AbstractPropertyFactory} from "./AbstractPropertyFactory.js";
import {AppConfigPropertyFactory} from "./AppConfigPropertyFactory.js";
import {AppConfigurationClient} from "@azure/app-configuration";
import {SecretClient} from "@azure/keyvault-secrets";


/**
 * @typedef {Object} CacheControlOverride
 * @property {string} name
 * @property {boolean} cache
 * @property {string} maxAge
 */
/**
 * @typedef {Object} CacheControl
 * @property {boolean} cache
 * @property {string} maxAge
 * @property {Array<CacheControlOverride>} overrides
 */
/**
 * @typedef {Object} PropertyEndpoint
 * @property {string} url
 * @property {string} umi
 */
/**
 * @typedef {Object} KeyVaultConfig
 * @property {boolean} followKeyVaultReference
 * @property {PropertyEndpoint} endpoint
 */
/**
 * @typedef {Object} AppConfigPropertyFactoryConfig
 * @property {boolean} useAppConfig
 * @property {Array<PropertyEndpoint>} endpoints
 * @property {KeyVaultConfig} keyVault
 */
/**
 * @typedef {Object} PropertySettings
 * @property {AppConfigPropertyFactoryConfig} appConfig
 * @property {CacheControl} cacheControls
 */
/**
 * @typedef {Object} PropertyManagerConfig
 * @property {{type:string}} $object
 * @property {PropertySettings} settings
 */

/**
 *
 */
export class ApplicationProperties {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/ApplicationProperties"}};
    /**
     * @description
     * @param {import('ApplicationContext').ApplicationContext} context
     * @param {import('LoggingManager').ApplicationLog} log
     * @param {AbstractPropertyFactory} factory
     */
    constructor(context, log, factory) {
        this._context = context;
        this._log = log;
        this._factory = factory;
    }

    /**@returns{import('ApplicationContext').ApplicationContext}*/get context() {return this._context;}
    /**@returns{import('LoggingManager').ApplicationLog}*/get log() {return this._log;}
    /**@returns{AbstractPropertyFactory}*/get factory() {return this._factory;}

    /**
     * @description Adds a property factory to the chain of factories.
     * @param {AbstractPropertyFactory} factory
     */
    addPropertyFactory(factory) {
        if(!isInstanceOf(AbstractPropertyFactory, factory))
            throw new Error("Parameter 'factory' must be an instance of AbstractPropertyFactory.");
        this._factory.addLink(factory);
    }

    async getProperty(name, defaultValue = null) {
        if(_.isEmpty(name))
            throw ApplicationError.fromError("Parameter 'name' cannot be empty.");

        this._log.verbose(`Getting property ${name} from factory.`);
        let _prop = await this._factory.getProperty(name);
        return _prop || defaultValue;
    }

    /**
     * @description Gets an Object value from a JSON string property.
     * @param {string} name
     * @param {Object} [defaultValue]
     * @param {function(this: any, key: string, value: any):any} reviver
     * @returns {Promise<any|null>}
     */
    async getObject(name, defaultValue = null, reviver = null) {
        if(_.isEmpty(name))
            throw ApplicationError.fromError("Parameter 'name' cannot be empty.");

        let _prop = await this.getProperty(name, defaultValue);
        this._log.verbose(`Converting property ${name} to object.`);
        return (_prop)? JSON.parse(_prop, reviver) : null;
    }

    /**
     * @description Gets a moment.Moment in time from a time string
     * @param {string} name
     * @param {moment.Moment} [defaultValue]
     * @returns {Promise<moment.Moment>}
     */
    async getMoment(name, defaultValue = moment()) {
        if(_.isEmpty(name))
            throw ApplicationError.fromError("Parameter 'name' cannot be empty.");

        let _prop = await this.getProperty(name, defaultValue);
        this._log.verbose(`Converting property ${name} to moment.`);
        return (_prop)? moment(_prop) : defaultValue;
    }
}

export class CachedProperty {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/CachedProperty"}};
    constructor(cache = true, maxAge = "5m", value = null , raw = true) {
        this._cache = cache;
        this._maxAge = maxAge;
        this._value = value;
        this._raw = raw;
        this._expires = null;
    }

    /**@returns{*}*/get value() {return this._value;}
    /**
     * @description Sets th value for this cached property and updates the expiry value to the next interval.
     * @param {*} value
     */
    set value(value) {
        if(this._cache) {
            this._value = value;
            this._expires = moment().add(this._maxAge);
        }
    }
    /**
     * @description Sets th value for this cached property without updating the expiry.
     * @param {*} value
     */
    set update(value) {
        if(this._cache) this._value = value;
    }
    /**@return{boolean}*/get cache() {return this._cache;}
    /**@return{string}*/get maxAge() {return this._maxAge;}
    /**@return{boolean}*/get raw() {return this._raw;}
    /**@return{boolean}*/get isExpired() {
        if(!this._expires) return true;
        return moment().isSameOrAfter(this._expires);
    }
}

/**
 *
 */
export class NamespacedApplicationProperties extends ApplicationProperties {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/NamespacedApplicationProperties"}};
    /**
     * @description
     * @param {ApplicationProperties} source
     * @param {string} namespace
     * @param {string} [delimiter]
     */
    constructor(source, namespace, delimiter = "-") {
        super(source.context, source.log, source.factory);
        this._namespace = namespace;
        this._delimiter = delimiter;
        this._prefix = `${this._namespace}${this._delimiter}`;
    }

    /**@returns{string}*/get namespace() {return this._namespace;}
    /**@returns{string}*/get delimiter() {return this._delimiter;}

    async getProperty(name, defaultValue = null) {
        return super.getProperty(`${this._prefix}${name}`, defaultValue);
    }

    async getMoment(name, defaultValue = moment()) {
        return super.getMoment(`${this._prefix}${name}`, defaultValue);
    }

    /**
     * @description Gets an Object value from a JSON string property.
     * @param {string} name
     * @param {Object} [defaultValue]
     * @param {function(this: any, key: string, value: any):any} reviver
     * @returns {Promise<any|null>}
     */
    async getObject(name, defaultValue = null, reviver = null) {
        return super.getObject(`${this._prefix}${name}`, defaultValue, reviver);
    }
}

export class CachedApplicationProperties extends ApplicationProperties {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/CachedApplicationProperties"}};
    /**
     * @description
     * @param {ApplicationProperties} source
     * @param {string} maxAge
     */
    constructor(source, maxAge = "5m") {
        super(source.context, source.log, source.factory);
        this._cache = {};
        this._maxAge = maxAge;
        this._loadingCache = {};
    }

    setCache(name, value = null, cache = true, maxAge = this._maxAge, raw = true) {
        if(_.isEmpty(name))
            throw ApplicationError.fromError("Parameter 'name' cannot be empty.");
        this.log.debug(`Setting cache for property ${name}.`);
        this._cache[name] = new CachedProperty(cache, maxAge, value, raw);
    }

    /**
     * @description
     * @param {string} name
     * @returns {CachedProperty|null}
     */
    getCache(name) {
        this.log.debug(`Getting cache for property ${name}.`);
        return this._cache[name];
    }

    /**
     * @description
     * @param {string} name
     * @param {*} [defaultValue]
     * @returns {Promise<*>}
     */
    async getProperty(name, defaultValue = null) {
        if(!this._loadingCache[name]) { // Done to prevent race conditions in the tasks
            this.log.debug(`Loading property ${name} from cache.`);
            const _this = this;

            this._loadingCache[name] = (async () => {
                let _cached = _this.getCache(name);
                // Check to see if its there and not expired, if so get out quick.
                if(_cached && _cached.cache && !_cached.isExpired) {
                    _this.log.debug(`Cache found for property ${name}, origin hit deflected.`);
                    delete _this._loadingCache[name]; // clear the loading promise mutex
                    return _cached.value;
                }
                // Need to go to Origin now.
                try {
                    _this.log.debug(`Cache invalid, requesting property ${name} from origin.`);
                    let _origin = await super.getProperty(name, null); // Deliberately using null, not the default value
                    if(_origin) {
                      if(!_cached) // Not cached (lazy loaded) so we create it.
                          this.setCache(name, _origin, true, _this._maxAge, true);
                      else if(_cached.cache) // Cached already and enabled
                          _cached.value = _origin;
                      else this.log.debug(`Cache disabled for property ${name}, no cache.`);
                    }
                    else _origin = defaultValue; // Set it to the default value
                    delete _this._loadingCache[name]; // clear the loading promise mutex
                    return _origin;
                }
                catch(error) {
                    _this.log.error(`Error getting property ${name} from origin.`, error);
                    delete _this._loadingCache[name]; // clear the loading promise mutex
                    throw ApplicationError.fromError(error);
                }
            })();
        }
        return this._loadingCache[name];
    }

    /**
     * @description
     * @param {string} name
     * @param {Object} [defaultValue]
     * @param {function(this: any, key: string, value: any):any} reviver
     * @returns {Promise<any|null>}
     */
    async getObject(name, defaultValue = null, reviver = null) {
        let _name = `${name}-object`;
        if(!this._loadingCache[_name]) { // Done to prevent race conditions in the tasks
            this.log.debug(`Loading Object property ${name} from cache.`);
            const _this = this;

            this._loadingCache[_name] = (async () => {
                let _parsed = defaultValue;
                try {
                    let _prop = await _this.getProperty(name, null); // Call to ensure it loaded and cached if allowed.
                    let _cached = _this.getCache(_prop);

                    if(_prop) { // we got a property back...
                        if(_cached?.cache) {
                            if(_cached.raw)
                                _cached.update = JSON.parse(_prop, reviver);
                            _parsed = _cached.value;
                        }
                        else _parsed = JSON.parse(_prop, reviver);
                    }

                    delete _this._loadingCache[_name]; // clear the loading promise mutex
                    return _parsed;
                }
                catch(error) {
                    _this.log.error(`Error creating Object from property ${name}.`, error);
                    delete _this._loadingCache[_name]; // clear the loading promise mutex
                    throw ApplicationError.fromError(error);
                }
            })();
        }
        return this._loadingCache[_name];
    }

    /**
     * @description Gets a moment.Moment in time from a time string
     * @param {string} name
     * @param {moment.Moment} [defaultValue]
     * @returns {Promise<moment.Moment>}
     */
    async getMoment(name, defaultValue = moment()) {
        let _name = `${name}-moment`;
        if(!this._loadingCache[_name]) { // Done to prevent race conditions in the tasks
            this.log.debug(`Loading moment property ${name} from cache.`);
            const _this = this;

            this._loadingCache[_name] = (async () => {
                let _parsed = defaultValue;
                try {
                    let _prop = await _this.getProperty(name, null); // Call to ensure it loaded and cached if allowed.
                    let _cached = _this.getCache(_prop);

                    if(_prop) { // we got a property back...
                        if(_cached?.cache) {
                            if(_cached.raw)
                                _cached.update = moment(_prop);
                            _parsed = _cached.value;
                        }
                        else _parsed = moment(_prop);
                    }

                    delete _this._loadingCache[_name]; // clear the loading promise mutex
                    return _parsed;
                }
                catch(error) {
                    _this.log.error(`Error creating moment from property ${name}.`, error);
                    delete _this._loadingCache[_name]; // clear the loading promise mutex
                    throw ApplicationError.fromError(error);
                }
            })();
        }
        return this._loadingCache[_name];
    }
}

export class PropertyManager extends AbstractApplicationManager {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/PropertyManager"}};

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        super(context);
        /**@type{ApplicationProperties|CachedApplicationProperties}*/this._properties =
            new ApplicationProperties(context, this.log, new EnvironmentPropertyFactory(context, this.log));
    }

    /**
     * @description
     * @param {PropertyManagerConfig} propertyConfig
     * @param {LocalCredentialManager} credentialManager
     * @returns {Promise<void>}
     */
    async start(propertyConfig, credentialManager) {
        // Checking for the config in context
        if(this.context.local)
            this.log.debug("Running in local environment, only using EnvironmentPropertyFactory.");
        else if(propertyConfig) {
            if(propertyConfig.$object.type === PropertyManager.$object.type) {
                this.log.debug("Property manager configuration found, loading settings.");
                await this._loadCacheControls(propertyConfig.settings.cacheControls);
                await this._loadAppConfiguration(propertyConfig.settings.appConfig, credentialManager);
            }
            else ApplicationError.fromError(`Invalid configuration type, expecting ${PropertyManager.$object.type}.`);
        }
        else this.log.debug("No property manager configuration found, using defaults.");
    }

    /**
     * @description
     * @param {CacheControl} cacheControls
     * @returns {Promise<void>}
     * @private
     */
    async _loadCacheControls(cacheControls) {
        if(cacheControls) {
            if(cacheControls.cache) {
                this.log.debug("Caching enabled setting up cache controls.");
                this._properties = new CachedApplicationProperties(
                    this._properties, cacheControls.maxAge);
                // Are there any overrides
                if(cacheControls.overrides) {
                    // Add each override to the cache.
                    for(let override of cacheControls.overrides) {
                        this.log.debug(`Adding cache control override for property ${override.name}`);
                        this._properties.setCache(override.name, override.cache, override.maxAge);
                    }
                }
            }
            else this.log.debug("Caching disabled.");
        }
        else this.log.debug("No cache controls found, caching disabled.");
    }

    _loadAppConfigEndpoints(appConfigFactory, appConfig, credentialManager) {
        for(let endpoint of appConfig.endpoints) {
            this.log.debug(`Adding AppConfig endpoint ${endpoint.url}.`);
            appConfigFactory.addAppConfigClient(new AppConfigurationClient(endpoint.url,
                credentialManager.getIdentityCredential(endpoint.umi)));
        }
    }

    _loadKeyVaultEndpoint(appConfigFactory, appConfig, credentialManager) {
        if(appConfig.keyVault.followKeyVaultReference) {
            this.log.debug("Following KeyVault references in AppConfig.");
            if(appConfig.keyVault.endpoint) {
                this.log.debug(`Adding Key Vault endpoint ${appConfig.keyVault.endpoint.url}.`);
                appConfigFactory.setKeyVaultSecretClient(new SecretClient(appConfig.keyVault.endpoint.url,
                    credentialManager.getIdentityCredential(appConfig.keyVault.endpoint.umi)));
            }
        }
    }

    /**
     * @description
     * @param {AppConfigPropertyFactoryConfig} appConfig
     * @param {LocalCredentialManager} credentialManager
     * @returns {Promise<void>}
     * @private
     */
    async _loadAppConfiguration(appConfig, credentialManager) {
        if(appConfig?.useAppConfig) {
            let _appConfigFactory = new AppConfigPropertyFactory(this.context, this.log);

            this.log.debug("Using AppConfig for property configuration.");
            if(appConfig.endpoints) {
                this._loadAppConfigEndpoints(_appConfigFactory, appConfig, credentialManager);
                if(appConfig.endpoints.length > 0 && appConfig.keyVault) {
                    this.log.debug("Adding KeyVault support for AppConfig.");
                    this._loadKeyVaultEndpoint(_appConfigFactory, appConfig, credentialManager);
                }
                this._properties.addPropertyFactory(_appConfigFactory);
            }
            else this.log.debug("No AppConfig endpoints found.");
        }
    }

    /**
     * @description Adds a property factory to the chain of factories.
     * @param {AbstractPropertyFactory} factory
     */
    async addPropertyFactory(factory) {
        return this._properties.addPropertyFactory(factory);
    }

    /**
     * @description
     * @param {string} name
     * @param {string} delimiter
     * @returns {NamespacedApplicationProperties}
     */
    namespace(name, delimiter = "-") {
        return new NamespacedApplicationProperties(this.properties, name, delimiter);
    }

    /**@returns{ApplicationProperties}*/get properties() {return this._properties;}
}
