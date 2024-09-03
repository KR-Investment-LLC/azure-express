import {ApplicationError} from "./Global.js";
import {APPLICATION_LOG} from "./ApplicationLog.js";

/**
 * @description
 * @param {import('express').RequestHandler} requestHandler
 * @param {object} [options]
 * @returns {(function(*, *, *): Promise<void>)|*}
 */
export function wrap(requestHandler, options = {}) {
    let _attribute = options.attributeName || "log";
    return async (req, res, next) => {
        let _logger = req[_attribute];
        if(!_logger) _logger = APPLICATION_LOG;

        try {
            _logger.debug(`wrap: Async Request - Enter`);
            await requestHandler(req, res, next);
            _logger.debug(`wrap: Async Request - Exit`);
        }
        catch(error) {
            _logger.error("wrap: Unhandled error encountered - Error", error);
            next(ApplicationError.fromError(error));
        }
    }
}