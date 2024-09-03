import moment from "moment";

export class Subject {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/Subject"}};
    /**
     *
     * @param {Object} claims
     * @param {Array<string>} [roles]
     */
    constructor(claims, roles = []) {
        this._claims = claims;
        this._roles = roles;
    }

    /**@returns{Object}*/get claims() {return this._claims;}
    /**@returns{Array<string>}*/get roles() {}

    /**
     * @param {string} role
     * @returns boolean
     */
    isInRole(role) {
        return false;
    }
}

export class JwtSubject extends Subject {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/JwtSubject"}};
    constructor(claims, roles = []) {
        super(claims, roles);
        // Convert the date claims to moments.
        this._claims.iat = claims.iat ? moment.unix(claims.iat) : null;
        this._claims.exp = claims.exp ? moment.unix(claims.exp) : null;
        this._claims.nbf = claims.nbf ? moment.unix(claims.nbf) : null;
    }

    get objectId() {return this._claims.oid || this._claims.sub;}
    get issuer() {return this._claims.iss || null;}
    get subject() {return this._claims.sub || null;}
    get audience() {return this._claims.aud || null;}
    get issuedAt() {return this._claims.iat;}
    get expiresAt() {return this._claims.exp;}
    get notBefore() {return this._claims.nbf;}

    get isExpired() {
        let _now = moment();
        if(this._claims.nbf && _now.isSameOrBefore(this._claims.nbf))
            return true;
        return _now.isSameOrAfter(this._claims.exp);
    }
}