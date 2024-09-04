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
import "winston-daily-rotate-file";
import {AbstractManager} from "./AbstractManager.js";
import {APPLICATION_LOG, ApplicationLog, LOGGING_LEVELS} from "./ApplicationLog.js";
const { combine, timestamp, json } = format;

export class LoggingManager extends AbstractManager {
    static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/LoggingManager"}};

    static ATTRIBUTE_NAME = "logAttributeName";
    static DEFAULT_FEATURE_NAME = "api";

    /**
     * @description
     * @param {ApplicationContext} context
     */
    constructor(context) {
        super();
        /**@type{ApplicationContext}*/this._context = context;
        /**@type{ApplicationLog}*/this._logger = null;
        /**@type{Array<import("winston").Transport>}*/let _transports = [
            new transports.Console()
        ];
        if(context.local) {
            _transports.push(new transports.DailyRotateFile({
                filename: context.getEnvironmentProperty("logFile"),
                datePattern: 'YYYY-MM-DD',
                maxSize: '25m',
                maxFiles: '14d', // Keep log files for 14 days
                zippedArchive: true, // Optional: Compress log files
            }));
        }
        /**@type{ApplicationLog}*/this._logger = new ApplicationLog(createLogger({
            levels: LOGGING_LEVELS.levels,
            level: context.getEnvironmentProperty("logLevel", "silly"), // Set the logging level
            format: format.combine(
                format.errors({ stack: true }),
                format.colorize(),
                format.timestamp(), // Add a timestamp to the logs
                format.json() // Format the logs as JSON
            ),
            transports: _transports,
            defaultMeta: {context: `${context.environment}.${context.getEnvironmentProperty("logContext", "api")}`},
        }));
        APPLICATION_LOG.swap(this._logger.logger);
    }

    /**@returns{ApplicationContext}*/get context() {return this._context;}
    /**@returns{ApplicationLog}*/get logger() {return this._logger;}

    /**
     *
     * @param name
     * @return {ApplicationLog}
     */
    child(name) {
        return this._logger.child(name);
    }

    get loggingMiddleware() {
        let _this = this;
        let _attribute = _this.context.getEnvironmentProperty(LoggingManager.ATTRIBUTE_NAME, "log");
        return (req, res, next) => {
            let _logger = _this._logger.child(req.path,
                {
                    method: req.method,
                    xhr: req.xhr,
                    protocol: req.protocol,
                    secure: req.secure,
                    ip: req.ip
                });
            req[_attribute] = _logger;
            res[_attribute] = _logger;
            next();
        };
    }
}
