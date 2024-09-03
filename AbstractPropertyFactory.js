/**
 * @abstract
 */
export class AbstractPropertyFactory {
    static get $object() {return {type: "https://api.krinvestentsllc.com/v1.0.0/AbstractPropertyFactory"}};

    /**
     * @description
     * @param {AbstractPropertyFactory} [link]
     * @param {import('./ApplicationContext.js').ApplicationContext} context
     * @param {import('./LoggingManager.js').ApplicationLog}log
     */
    constructor(context, log, link = null) {
        /**@type{AbstractPropertyFactory}*/this.link = null;
        /**@type{import('./ApplicationContext.js').ApplicationContext}*/this._context = context;
        /**@type{import('./LoggingManager.js').ApplicationLog}*/this._log = log;
    }

    /**
     * @description Adds a link to the chain
     * @param {AbstractPropertyFactory} link
     */
    addLink(link) {
        if(!this._link) this._link = link;
        else this._link.addLink(link);
    }

    /**@return{import('./ApplicationContext.js').ApplicationContext}*/get context() {return this._context;}
    /**@return{import('./LoggingManager.js').ApplicationLog}*/get log() {return this._log;}

    async getProperty(name) {
        let _prop = await this._getProperty(name);
        if(!_prop) {
            if(this._link) return this._link.getProperty(name);
            else return null;
        }
        else return _prop;
    }

    /**
     * @description
     * @param {string} name
     * @returns {Promise<*>}
     * @private
     */
    async _getProperty(name) {throw new Error("Not Implemented.");}
}
