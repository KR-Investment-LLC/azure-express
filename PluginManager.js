import {isInstanceOf, ApplicationError, isTypeOf} from "./Global.js";
import {AbstractApplicationManager} from "./AbstractApplicationManager.js";
import {AbstractPlugin} from "./AbstractPlugin.js";
import {AbstractManager} from "./AbstractManager.js";

export class PluginManager extends AbstractApplicationManager {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/PluginManager"}};

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        super(context);
        this._plugins = {};
    }

    async _initialize() {
        // initialize all the plugins.
        // TODO: re-order them based on dependency...
    }

    /**
     * @description
     * @param {Class<AbstractPlugin>} plugin
     * @returns {AbstractPlugin}
     */
    getPlugin(plugin) {
        if(!isTypeOf(plugin, AbstractPlugin))
            throw ApplicationError.fromError("Parameter 'plugin' must be an instance of AbstractPlugin.");
        let _localPlugin = this._plugins[plugin.name];
        if(!_localPlugin)
            throw ApplicationError.fromError(`Plugin '${plugin.name}' not found.`);
        return _localPlugin;
    }

    addPlugin(plugin) {
        if(!isInstanceOf(AbstractPlugin, plugin))
            throw ApplicationError.fromError("Parameter 'plugin' must be an instance of AbstractPlugin.");
        this._plugins[plugin.constructor.name] = plugin;
    }

    /**
     *
     * @param plugin
     * @return {Promise<AbstractPlugin>}
     */
    async loadPlugin(plugin) {
        if(!plugin.hasOwnProperty("$object"))
            throw ApplicationError.fromError("Attribute '$object' is required for plugin configuration.");
        if(typeof plugin.$object.type !== "string" ||  plugin.$object.type.trim().length === 0)
            throw ApplicationError.fromError("Attribute 'type' is required for $object and cannot be 0 length.");
        if(!plugin.hasOwnProperty("path"))
            throw ApplicationError.fromError("Attribute 'path' is required for plugin configuration.");
        this.log.info(`Loading plugin ${plugin.$object.type} from ${plugin.path}.`);
        let _dynamicPlugin = await import(plugin.path);
        return _dynamicPlugin.create(this._context);
    }

    async start(pluginConfig) {
        if(!pluginConfig.hasOwnProperty("plugins"))
            throw ApplicationError.fromError("Attribute 'plugins' is required for plugin configuration.");

        if(pluginConfig.plugins.length > 0) {
            /**@Array<Promise<AbstractPlugin>>*/let _promises = [];
            for(let _plugin of pluginConfig.plugins) {
                _promises.push(this.loadPlugin(_plugin));
            }
            await Promise.all(_promises);

            // now add each plugin to the plugin manager
            for(let _plugin of /**@type{Array<AbstractPlugin>}*/_promises) {
                this.addPlugin(_plugin);
            }

            // Now initialize
        }
        else this.log.info("No plugins found.");
    }

    get plugins() {return this._plugins;}
}
