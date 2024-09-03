import {ApplicationError} from "./Global.js";
import {APPLICATION_LOG} from "./ApplicationLog.js";

export function PageNotFoundHandler(req, res, next) {
    APPLICATION_LOG.debug("PageNotFoundHandler: Enter.");
    let _error = ApplicationError.NotFoundError();
    _error.path = req.path;
    _error.method = req.method;
    next(_error);
    APPLICATION_LOG.debug("PageNotFoundHandler: Exit.");
}