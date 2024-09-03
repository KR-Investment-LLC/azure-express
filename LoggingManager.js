import { createLogger, format, transports} from 'winston';
import "winston-daily-rotate-file";
import {AbstractManager} from "./AbstractManager.js";
import {APPLICATION_LOG, ApplicationLog, LOGGING_LEVELS} from "./ApplicationLog.js";
const { combine, timestamp, json } = format;

export class LoggingManager extends AbstractManager {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/LoggingManager"}};

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
