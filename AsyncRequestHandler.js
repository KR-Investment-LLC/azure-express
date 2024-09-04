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

import {ApplicationError, MiddlewareStallError} from "./Global.js";
import {APPLICATION_LOG} from "./ApplicationLog.js";

/**
 * @description This function returns an async request handler for express that safely handles errors/exceptions and
 *              also hanging requests or middleware stalls.
 * @param {import('express').RequestHandler} requestHandler
 * @param {{logAttributeName:string,handleMiddlewareStall:boolean}} [options]
 * @returns {(function(*, *, *): Promise<void>)|*}
 */
export function wrap(requestHandler, options = {}) {
    let _attribute = options.logAttributeName || "log";
    let _handleMiddlewareStall = options.handleMiddlewareStall || true;

    return async (req, res, next) => {
        let _logger = req[_attribute];
        if(!_logger) _logger = APPLICATION_LOG;
        let _next = next;

        if(_handleMiddlewareStall) _next = (...args) => { //
            next(...args);
            this.nextInvoked = true;
        }

        try {
            await requestHandler(req, res, _next);
            if(_handleMiddlewareStall) { // Do we check for idle handler?
                if(!res.headersSent && !_next.nextInvoked) { // Checking to see if we responded to request or called next...
                    _logger.warn("Middleware stall detected. No reply sent to caller and no next method invocation detected.");
                    next(new MiddlewareStallError(req.method, req.url));
                }
            }
        }
        catch(error) {
            _logger.error("Unhandled error encountered.", error);
            next(ApplicationError.fromError(error));
        }
    }
}