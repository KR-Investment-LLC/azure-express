import express from "express";
import {ApplicationContext} from "./ApplicationContext.js";
import {LoggingManager} from "./LoggingManager.js";
import {LocalCredentialManager} from "./CredentialManager.js";
import {PropertyManager} from "./PropertyManager.js";
import {PluginManager} from "./PluginManager.js";
import {APPLICATION_LOG} from "./ApplicationLog.js"
import {GlobalErrorHandler} from "./GlobalErrorHandler.js";
import {PageNotFoundHandler} from "./PageNotFoundHandler.js";
import {ReplyHandler} from "./ReplyHandler.js";

/**
 * @typedef {ApplicationContext} ApplicationLogContext
 * @property {import('./ApplicationLog.js').ApplicationLog} log
 */

/**
 * @author Robert R Murrell
 */
export class AzureExpress {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/AzureExpress"}};
    constructor(defaultPath = "/", name = "api", delimiter = "-") {
        this._app = express();
        this._name = name;
        this._path = defaultPath;
        this._prefix = `${name}${delimiter}`;
        this._router = express.Router();
        /**@type{ApplicationLogContext}*/this._context = /**@type{ApplicationLogContext}*/new ApplicationContext(this._prefix);
        /**@type{null||http.Server}*/this._server = null;
    }

    /**
     * @description
     * @param {import('express').ApplicationRequestHandler} middleware
     */
    use(middleware) {
        this._app.use(middleware);
    }

    /**@returns{express.Router}*/get defaultRouter() {return this._router;}
    /**@returns{string}*/get name() {return this._name;}
    /**@returns{Express}*/get app() {return this._app;}
    /**@returns{ApplicationContext}*/get context() {return this._context;}
    /**@returns{http.Server}*/get server() {return this._server;}

    /**
     * @return {Promise<void>}
     * @private
     */
    async _initializeLoggingManager() {
        console.log("Initializing Logging Manager...");
        let _logManager = new LoggingManager(/**@type{ApplicationContext}*/this._context);
        this._context.addManager(_logManager);
        this._context.log = _logManager.logger;
        this._app.use(_logManager.loggingMiddleware);
        APPLICATION_LOG.info("Logging Manager initialized. All future logging will be in JSON format through Winston.");
    }

    /**
     * @return {Promise<void>}
     * @private
     */
    async _initializeLocalCredentialsManager() {
        this._context.log.info("Initializing Local Credential Manager...");
        let _credentialManager = new LocalCredentialManager(/**@type{ApplicationContext}*/this._context);
        this._context.addManager(_credentialManager);
        this._context.log.info("Local Credential Manager initialized.");
    }

    /**
     * @return {Promise<void>}
     * @private
     */
    async _initializePropertiesManager() {
        this._context.log.info("Initializing Property Manager...");
        this._context.log.info("Loading property configuration...");
        let _propManager = new PropertyManager(/**@type{ApplicationContext}*/this._context);
        await _propManager.start(await this._context.getManagerConfig(PropertyManager),
            /**@type{LocalCredentialManager}*/this._context.getManager(LocalCredentialManager));
        this._context.addManager(_propManager);
        this._context.log.info("Property Manager initialized.");
    }

    /**
     * @return {Promise<void>}
     * @private
     */
    async _initializePluginManager() {
        this._context.log.info("Initializing Plugin Manager...");
        let _pluginManager = new PluginManager(/**@type{ApplicationContext}*/this._context);
        await _pluginManager.start(await this._context.getManagerConfig(PluginManager),
            /**@type{LocalCredentialManager}*/this._context.getManager(LocalCredentialManager));
        this._context.addManager(_pluginManager);
        this._context.log.info("Plugin Manager initialized.");
    }

    /**
     * @return {Promise<void>}
     * @private
     */
    async _initialize() {
        APPLICATION_LOG.info("Express JSON middleware added.");
        this._app.use(express.json()); // Set it up for JSON

        await this._initializeLoggingManager();
        await this._initializeLocalCredentialsManager();
        await this._initializePropertiesManager();
        await this._initializePluginManager();

        this._context.log.info("Reply Handler middleware added.");
        this._app.use(ReplyHandler); // Add the structured reply
    }

    /**
     *
     * @param {() => void} callback
     * @param {null|number} port
     * @returns {Promise<http.Server>}
     */
    async start(callback = null, port = null) {
        let _port = port ||this._context.getEnvironmentProperty("PORT") || process.env.PORT  || 3000;
        console.log("  ___                     _____");
        console.log(" / _ \\                   |  ___|");
        console.log("/ /_\\ \\_____   _ _ __ ___| |____  ___ __  _ __ ___  ___ ___ ");
        console.log("|  _  |_  / | | | '__/ _ \\  __\\ \\/ / '_ \\| '__/ _ \\/ __/ __|");
        console.log("| | | |/ /| |_| | | |  __/ |___>  <| |_) | | |  __/\\__ \\__ \\");
        console.log("\\_| |_/___|\\__,_|_|  \\___\\____/_/\\_\\ .__/|_|  \\___||___/___/");
        console.log("                                   | |");
        console.log("                                   |_|");
        console.log();
        console.log("Copyright (c) 2024 KRI, LLC. All Rights reserved.");
        console.log(`Starting AzureExpress application '${this._name}' on port ${_port}...`);

        // Do all the initialization stuffs.
        await this._initialize();

        this._context.log.info(`Adding default router to path '${this._path}'.`);
        this._app.use(this._path, this._router);
        this._context.log.info("Default router added, adding default 404 and global error handlers.");
        this._app.use(PageNotFoundHandler);
        this._app.use(GlobalErrorHandler);
        this._context.log.info("Default 404 and global error handlers added.");

        this._context.log.info(`Application starting on port ${_port}.`);
        this._server = this._app.listen(_port, callback);
        return this._server;
    }
}