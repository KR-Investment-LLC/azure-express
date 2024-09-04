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

import { promises as fs } from "fs";
import path from "path";

/**
 * @description
 * @param {Class} clazz
 * @param {*} obj
 * @returns {boolean}
 */
export function isInstanceOf(clazz, obj) {
  if (typeof obj !== 'object' || obj === null)
    return false;

  /**
   * @description
   * @param clazz
   * @param obj
   * @return {*|boolean}
   */
  function checkType(clazz, obj) {
    if(clazz.hasOwnProperty('$object') && obj.hasOwnProperty('$object')) {
      const classType = clazz.$object.type;
      return obj.$object && obj.$object.type === classType;
    }
    return false;
  }

  let currentClass = clazz;
  while(currentClass) {
    if(checkType(currentClass, obj))
      return true;
    currentClass = Object.getPrototypeOf(currentClass);
  }

  // Use normal instanceof check
  return obj instanceof clazz;
}

/**
 * @description
 * @param {Class} source
 * @param {Class} target
 * @returns {boolean}
 */
export function isTypeOf(source, target) {
  function getType(clazz) {
    return clazz.hasOwnProperty('$object') ? clazz.$object.type : null;
  }

  let currentClass = source;
  while(currentClass) {
    const currentType = getType(currentClass);
    const targetType = getType(target);
    if(currentType && targetType && currentType === targetType)
      return true;
    // Move up the prototype chain
    currentClass = Object.getPrototypeOf(currentClass);
  }

  return false;
}

export class ApplicationError extends Error {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/ApplicationError"}};

  /**
   * @param {string} message
   * @param {number} code
   * @param {*} cause
   */
  constructor(message = "Internal Server Error", code = 500, cause = null) {
    super(message);
    /**@type{number}*/this._code = code;
    /**@type{*}*/this._cause = cause;
  }

  /**@returns{number}*/get code() {return this._code;}
  /**@returns{*}*/get cause() {return this._cause;}

  safe() {
    return {
      code: this._code,
      message: this.message
    }
  }

  static fromError(error) {
    if(isInstanceOf(ApplicationError, error)) return error;
    else if(error instanceof Error) return new ApplicationError(error.message, 500, error);
    else if(typeof error === "object") return new ApplicationError(error.toString(), 500, error);
    else return new ApplicationError(String(error), 500, error);
  }
}

/**
 * @abstract
 */
export class AbstractRequestError extends ApplicationError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/AbstractRequestError"}};

  constructor(message = "Internal Server Error", code = 500, method, path,  cause = null, ) {
    super(message, code, cause);
    this._method = method;
    this._path = path;
  }

  get method() {return this._method;}
  get path() {return this._path;}

  safe() {
    let _safe = super.safe();
    _safe.method = this._method;
    _safe.path = this._path;
    return _safe;
  }
}

export class BadGatewayError extends AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/BadGatewayError"}};

  constructor(method, path, cause = null) {
    super("Bad Gateway", 502, method, path, cause);
  }
}

export class BadRequestError extends AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/BadRequestError"}};

  constructor(method, path, errors) {
    super("Bad Request", 400, method, errors);
    this._errors = errors;
  }

  get errors() {return this._errors;}

  safe() {
    let _safe = super.safe();
    _safe.errors = this._errors;
    return _safe;
  }
}

export class ConflictError extends AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/ConflictError"}};

  constructor(method, path, cause = null) {
    super("Conflict", 409, method, path, cause);
  }
}

export class ForbiddenError extends  ApplicationError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/ForbiddenError"}};

  constructor(subject = null, cause = null) {
    super("Forbidden", 403, cause);
    this._subject = subject;
  }

  /**@type{null|string}*/get subject() {return this._subject;}

  safe() {
    let _safe = super.safe();
    this._subject && (_safe.subject = this._subject);
    return _safe;
  }
}

export class GatewayTimeoutError extends  AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/GatewayTimeoutError"}};

  constructor(method, path, cause = null) {
    super("Gateway Timeout", 504, method, path, cause);
  }
}

export class MethodNotAllowedError extends  AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/MethodNotAllowedError"}};

  constructor(method, path, cause = null) {
    super("Method Not Allowed", 405, method, path, cause);
  }
}

export class MethodNotImplementedError extends  ApplicationError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/MethodNotImplementedError"}};

  constructor(cause = null) {
    super("Not Implemented", 501, cause);
  }
}

export class MiddlewareStallError extends AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/MiddlewareStallError"}};

  constructor(method, path, cause = null) {
    super("Middleware stall detected", 500, method, path, cause);
  }

  safe() {
    let _safe = super.safe();
    _safe.message = "Internal Server Error";
    return _safe;
  }
}

export class MovedPermanentlyError extends  AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/MovedPermanentlyError"}};

  constructor(method, path, cause = null) {
    super("Moved Permanently", 301, method, path, cause);
  }
}

export class NotAuthorizedError extends  ApplicationError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/NotAuthorizedError"}};

  constructor(subject = null, cause = null) {
    super("Not Authorized", 401, cause);
    this._subject = subject;
  }

  /**@type{null|string}*/get subject() {return this._subject;}

  safe() {
    let _safe = super.safe();
    this._subject && (_safe.subject = this._subject);
    return _safe;
  }
}

export class NotImplementedError extends  AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/NotImplementedError"}};

  constructor(method, path, cause = null) {
    super("Not Implemented", 501, method, path, cause);
  }
}

export class PageNotFoundError extends AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/PageNotFoundError"}};

  constructor(method, path, cause = null) {
    super("Not Found", 404, method, path, cause);
  }
}

export class ServiceUnavailableError extends AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/ServiceUnavailableError"}};

  constructor(method, path) {
    super("Service Unavailable", 503, method, path);
  }
}

export class UnprocessableEntityError extends AbstractRequestError {
  static get $object() {return {type: "https://api.azure-expressjs.com/v1.0.0/UnprocessableEntityError"}};

  constructor(method, path, cause = null) {
    super("Unprocessable Entity", 422, method, path, cause);
  }
}

/**
 * @description Loads a JSON file from disk.
 * @param {string} file
 * @param reviver
 * @returns {Promise<any>}
 */
export async function loadJsonFromFile(file, reviver = null) {
    const _path = path.resolve(file);
    const _contents = await fs.readFile(_path, 'utf-8');
    return JSON.parse(_contents, reviver);
}