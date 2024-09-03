import {ApplicationError, ErrorResponse} from "./Global.js";
import {APPLICATION_LOG} from "./ApplicationLog.js";


export function GlobalErrorHandler(error, req, res, next) {
    APPLICATION_LOG.debug("GlobalErrorHandler: Enter.");
    let _error = ApplicationError.fromError(error);

    if (_error.code === 401 || _error.code === 403)
        APPLICATION_LOG.threat(_error);
    else if((_error.code >= 300 && _error.code < 500))
        APPLICATION_LOG.warn(_error);
    else
        APPLICATION_LOG.error(_error);

    res.status(_error.code).json(ErrorResponse.fromError(_error));

    APPLICATION_LOG.debug("GlobalErrorHandler: Exit.");
}