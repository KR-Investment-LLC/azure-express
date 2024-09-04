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

import {
    ApplicationError,
    ForbiddenError,
    isInstanceOf,
    NotAuthorizedError,
    NotImplementedError,
    PageNotFoundError
} from "./Global.js";
import {APPLICATION_LOG} from "./ApplicationLog.js";

export function GlobalErrorHandler(error, req, res, next) {
    let _error = ApplicationError.fromError(error);

    if(isInstanceOf(PageNotFoundError, _error))
        APPLICATION_LOG.warn(_error.safe());
    else if(isInstanceOf(NotImplementedError, _error))
        APPLICATION_LOG.warn(_error.safe());
    else if(isInstanceOf(NotAuthorizedError, _error) || isInstanceOf(ForbiddenError, _error))
        APPLICATION_LOG.threat(_error.safe());
    else if(_error.code >= 300 && _error.code < 500)
        APPLICATION_LOG.warn(_error);
    else
        APPLICATION_LOG.error(_error);

    if(!res.headersSent) {
        res.status(_error.code).json(_error.safe());
    }
    else
        APPLICATION_LOG.error("Unable to send error response, headers already sent to caller.");
}