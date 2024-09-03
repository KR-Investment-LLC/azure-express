
/**
 *
 * @abstract
 */
export class AbstractRoleFactory {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/AbstractRoleFactory"}};

    /**
     * @param {ApplicationContext} context
     * @param {AbstractRoleFactory} link
     */
    constructor(context, link = null) {
        this._context = context;
        /**@type{AbstractRoleFactory}*/this._link = link;
    }

    /**@returns{ApplicationContext}*/get context() {return this._context;}

    addLink(link) {
        if(this._link) this._link.addLink(link);
        else this._link = link;
    }

    async getRoles(claims, roles = []) {
        return _.union(
            roles,
            await this._getRoles(claims),
            this._link ? await this._link.getRoles(claims) : []
        );
    }

    /**
     * @description
     * @param claims
     * @returns {Promise<*[]>}
     * @private
     * @abstract
     */
    async _getRoles(claims) {return [];}
}