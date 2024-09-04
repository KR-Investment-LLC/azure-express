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

import {AbstractManager} from "./AbstractManager.js";
import {isInstanceOf, isTypeOf, ApplicationError, loadJsonFromFile} from "./Global.js";

/**
 * @description
 * @author Robert R Murrell
 */
export class ApplicationContext {
    static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/ApplicationContext"}};
    constructor(prefix = "api-") {
        this._prefix = prefix;
        this._managers = {};
    }

    static get name() {
        return "api.couchclubhouse.live.ApplicationContext"
    }

    /**@returns{string}*/get environment() {
        return this.getEnvironmentProperty("environment", "development");
    }
    /**@returns{boolean}*/get local() {return this.environment === "local";}
    /**@returns{string}*/get configPath() {return this.getEnvironmentProperty("configPath", "./")}

    /**
     * @description Adds a manager to this context.
     * @param {AbstractManager} manager
     */
    addManager(manager) {
        if(!isInstanceOf(AbstractManager, manager))
            throw ApplicationError.fromError("Parameter 'manager' must be an instance of AbstractManager.");
        this._managers[manager.constructor.name] = manager;
    }

    /**
     * @description Gets a manager from this context.
     * @param {Class} manager
     * @return {AbstractManager}
     */
    getManager(manager) {
        if(!isTypeOf(manager, AbstractManager))
            throw ApplicationError.fromError("Parameter 'manager' must be an instance of AbstractManager.");
        let _localManager = this._managers[manager.name];
        if(!_localManager)
            throw ApplicationError.fromError(`Manager '${manager.name}' not found.`);
        return _localManager;
    }

    /**
     *
     * @param name
     * @param defaultValue
     * @returns {null|string}
     */
    getEnvironmentProperty(name, defaultValue = null) {
        let _value = process.env[this._prefix + name];
        return (_value === undefined)? defaultValue : _value;
    }

    async getManagerConfig(manager) {
        if(!isTypeOf(manager, AbstractManager))
            throw ApplicationError.fromError("Parameter 'manager' must be an instance of AbstractManager.");
        return loadJsonFromFile(this.getEnvironmentProperty(manager.name,
            `${this.configPath}${manager.name}.json`));
    }

    setEnvironmentProperty(name, value) {
        process.env[this._prefix + name] = value;
    }

    isTrue(name, defaultValue = false) {
        return this.getEnvironmentProperty(name) === "true";
    }
}
