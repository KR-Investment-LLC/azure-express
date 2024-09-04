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

import {ApplicationContext} from "./ApplicationContext.js";
import {AbstractManager} from "./AbstractManager.js";
import {LoggingManager} from "./LoggingManager.js";
import {ApplicationLog} from "./ApplicationLog.js";

/**
 *
 */
export class AbstractApplicationManager extends AbstractManager {
    static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/AbstractApplicationManager"}};

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        super();
        /**@type{ApplicationContext}*/this._context = context;
        /**@type{ApplicationLog}*/this._log = context.getManager(LoggingManager).child(this.constructor.name);
    }

    /**@returns{ApplicationContext}*/get context() {return this._context;}
    /**@returns{ApplicationLog}*/get log() {return this._log;}
}
