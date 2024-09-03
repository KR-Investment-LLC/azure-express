import {ApplicationError, ErrorResponse, isInstanceOf, RestResponse} from "./Global.js";

const _DEFAULT_PAYLOAD_TYPE = "https://api.krinvestentsllc.com/v1.0.0/Object";
const _PRIMITIVE_PAYLOAD_TYPE = "https://api.krinvestentsllc.com/v1.0.0/Primative";

export function fromError(error, req, res, code) {
    return null
}

export function fromResponse(reply, req, res, code) {
    if(isInstanceOf(RestResponse, reply)) // are we ResResponse?
        return reply;
    if(isInstanceOf(ApplicationError, reply) || reply instanceof Error) // are we an error?
        return fromError(reply, req, res, 500);
    if(reply && typeof reply === "object") // are we just a pol?
        return new RestResponse();
    else // anything else
        return new RestResponse();
}

/**
 *
 * @param {RestResponse} reply
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {number} [code]
 */
export function reply(reply, req, res, code = 200) {
    let _reply = fromResponse(reply, req, res, code);

    if(_reply.header.status === 204)
        res.status(204).send(""); // sent no-content response.
    else {
        let _bodyType =  _DEFAULT_PAYLOAD_TYPE;

        if(!_reply.payload)
            _reply.payload = {};
        else if(typeof _reply.payload === "object" && _reply.payload.constructor.$object)
            _bodyType = _reply.payload.constructor.$object;
        else
            _bodyType = _PRIMITIVE_PAYLOAD_TYPE;

        res.status(_reply.header.status).json({
            $object: _reply.constructor.$object,
            header: _reply.header,
            payload: {
                $object: {
                    type: _bodyType
                },
                body: _reply.payload
            }
        });
    }
}

export function ReplyHandler(req, res, next) {
    res.reply = (reply, code = 200) => {
        reply(reply, req, res, code);
    };
    next();
}