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

import { createLogger, format, transports} from 'winston';
import winston from 'winston';
import "winston-daily-rotate-file";

export const LOGGING_LEVELS = {
    levels: {
        threat: 0,  // Highest priority
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    },
    colors: {
        threat: 'magenta', // Custom color for the threat level
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        verbose: 'cyan',
        debug: 'blue',
        silly: 'gray',
    },
};

winston.addColors(LOGGING_LEVELS.colors);

export class ApplicationLog {
    static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/ApplicationLog"}};
    /**
     * @param {winston.Logger} log
     */
    constructor(log) {
        /**@type{winston.Logger}*/this._logger = log;
    }

    /**@returns{winston.Logger}*/get logger() {return this._logger;}

    /**
     * @param {winston.Logger} log
     * @return {winston.Logger}
     */
    swap(log) {
        this._logger.info("swapping out logger...");
        let _old = this._logger;
        this._logger = log;
        this._logger.info("New logger swapped in, returning old logger to caller.");
        return _old;
    }

    silly(message, ...args) {
        this._logger.silly(message, args);
    }

    debug(message, ...args) {
        this._logger.debug(message, args);
    }

    verbose(message, ...args) {
        this._logger.verbose(message, args);
    }

    info(message, ...args) {
        this._logger.info(message, args);
    }

    warn(message, ...args) {
        this._logger.warn(message, args);
    }

    error(message, ...args) {
        this._logger.error(message, args);
    }

    threat(message, ...args) {
        this._logger.threat(message, args);
    }

    /**
     *
     * @param {string} name
     * @param {Object} [metaData]
     * @return {ApplicationLog}
     */
    child(name, metaData = {}) {
        return new ApplicationLog(this._logger.child({...metaData, ...{feature: name}}));
    }
}

/**
 * @description default logger.
 * @type {ApplicationLog}
 */
export const APPLICATION_LOG = new ApplicationLog(createLogger({
    levels: LOGGING_LEVELS.levels,
    level: "silly", // Set the logging level
    format: format.combine(
        format.errors({ stack: true }),
        format.colorize(),
        format.timestamp(), // Add a timestamp to the logs
        format.json() // Format the logs as JSON
    ),
    transports: [
        new transports.Console()
    ],
    defaultMeta: {context: "api"},
}));