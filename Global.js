import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
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
  static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/ApplicationError"}};

  /**
   * @param {string} message
   * @param {number} code
   * @param {null|Error|Object} cause
   */
  constructor(message = "Internal Server Error", code = 500, cause = null) {
    super(message);
    /**@type{number}*/this._code = code;
    this._cause = cause;
  }

  /**@returns{number}*/get code() {return this._code;}
  get cause() {return this._cause;}

  static fromError(error) {
    if(isInstanceOf(ApplicationError, error)) return error;
    else if(error instanceof Error) return new ApplicationError(error.message, 500, error);
    else if(typeof error === "object") return new ApplicationError(error.toString(), 500, error);
    else return new ApplicationError(String(error), 500, error);
  }

  static BadGatewayError(cause = null, message = "Bad Gateway") {
    return new ApplicationError(message, 502, cause);
  }

  static BadRequestError(cause = null, message = "Bad Request") {
    return new ApplicationError(message, 400, cause);
  }

  static ConflictError(cause = null, message = "Conflict") {
    return new ApplicationError(message, 409, cause);
  }

  static ForbiddenError(cause = null, message = "Forbidden") {
    return new ApplicationError(message, 403, cause);
  }

  static GatewayTimeoutError(cause = null, message = "Gateway Timeout") {
    return new ApplicationError(message, 504, cause);
  }

  static MethodNotAllowedError(cause = null, message = "Method Not Allowed") {
    return new ApplicationError(message, 405, cause);
  }

  static MovedPermanentlyError(cause = null, message = "Moved Permanently") {
    return new ApplicationError(message, 301, cause);
  }

  static NotAuthorizedError(cause = null, message = "Not Authorized") {
    return new ApplicationError(message, 401, cause);
  }

  static NotFoundError(cause = null, message = "Not Found") {
    return new ApplicationError(message, 404, cause);
  }

  static InternalServerError(cause = null, message = "Internal Server Error") {
    return new ApplicationError(message, 501, cause);
  }

  static NotImplementedError(cause = null, message = "Not Implemented") {
    return new ApplicationError(message, 501, cause);
  }

  static ServiceUnavailableError(cause = null, message = "Service Unavailable") {
    return new ApplicationError(message, 503, cause);
  }

  static UnprocessableEntityError(cause = null, message = "Unprocessable Entity") {
    return new ApplicationError(message, 422, cause);
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

export class TransactionHeader {
  static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/TransactionHeader"}};
  constructor(status = 200, message = "OK", txid = uuidv4(), corrid = uuidv4(),
              dateTime = moment()) {
    this._status = status;
    this._message = message;
    this._txid = txid;
    this._corrid = corrid;
    this._dateTime = dateTime;
  }

  pretty() {
    return {
      status: this._status,
      txid: this._txid,
      corrid: this._corrid,
      dateTime: this._dateTime
    };
  }
}

export class RestRequest {
  static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/RestRequest"}};
  constructor(header, payload) {
    this._header = header;
    this._payload = payload;
  }
}

export class RestResponse {
  static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/RestResponse"}};

  /**
   * @param {TransactionHeader} header
   * @param {*} payload
   */
  constructor(header, payload) {
    this._header = header;
    this._payload = payload;
  }

  get header() {return this._header;}
  get payload() {return this._payload;}
  set payload(payload) {this._payload = payload}
}

export class ErrorResponse extends RestResponse {
  static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/ErrorResponse"}};
  constructor(header, error) {
    super(header, error);
  }
}
