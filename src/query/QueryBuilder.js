/**
 * The QueryBuilder class contains implementation details common to all
 * implementations. QueryBuilder implementations take incoming information such
 * as the root entity of the query, includes/excludes, conditions, and other
 * infomration and build a query representation out of that information which
 * can then be passed to an Adapter in order to manipulate information in the
 * underlying datastore.
 *
 * @abstract
 */
export default class QueryBuilder {
    /**
     * Build a new instance of the QueryBuilder.
     */
    constructor() {
        this._counters = {};
        this._entities = {};
    }

    /**
     * Build a table alias to use in a query. Just takes the given name and
     * appends a number to it, then increments the number for that name so that,
     * should the name ever appear again, a new number will be given.
     * @param {String} name - The name of the table or model to alias
     * @returns {String} - The new, unique alias
     */
    tableAlias(name) {
        if (typeof this._counters[name] === 'undefined') {
            this._counters[name] = 0;
        } else {
            this._counters[name] += 1;
        }
        return name + this._counters[name];
    }
}