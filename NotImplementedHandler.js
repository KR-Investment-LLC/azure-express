import {NotImplementedError} from "./Global.js";
import { match } from 'path-to-regexp';

function getPathDepth(path) {
    return path.split('/').filter(Boolean).length;
}

function findRoutes(stack, requestedPath, requestedPathDepth) {
    let _allowedMethods = [];

    stack.forEach(layer => {
        if(layer.route) {
            let _depth = getPathDepth(layer.route.path);

            // Match the route using path-to-regexp
            let isMatch = match(layer.route.path, { decode: decodeURIComponent });

            // Match routes with the same path depth and check if the path matches
            if(_depth === requestedPathDepth && isMatch(requestedPath))
                _allowedMethods.push(...Object.keys(layer.route.methods));
        }
        else if(layer.name === 'router' && layer.handle.stack)
            _allowedMethods.push(...findRoutes(layer.handle.stack, requestedPath, requestedPathDepth));
    });

    return _allowedMethods;
}

export function NotImplementedHandler(req, res, next) {
    let _allowedMethods = findRoutes(req.app._router.stack, req.path, getPathDepth(req.path));

    // If we found allowed methods, but the current method is not implemented
    if(_allowedMethods.length > 0 && !_allowedMethods.includes(req.method.toLowerCase()))
        next(new NotImplementedError(req.method, req.url));  // Pass the error to the global error handler
    else
        next();  // Continue to the next middleware or route handler if no issues
}