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

import {ApplicationError, isInstanceOf} from "./Global.js";

/**
 *
 * @param {*} response
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {number} [code]
 * @param {string} [message]
 */
export function reply(response = {}, code = 200, message = "OK", req, res) {
    if(response === undefined || response === null || response === "")
        code = 204;
    if(code === 204)
        res.status(code).send(); // sent no-content response.
    else if(!response)
        res.status(code).send(message);
    else
        res.status(code).json(response);
}

export function ReplyHandler(req, res, next) {
    res.reply = (response, code = 200, message = "OK") => {
        reply(response, code, message, req, res);
    };
    next();
}