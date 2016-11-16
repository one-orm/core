/* eslint no-unused-vars: 0, valid-jsdoc: ["error", { "requireReturn": true }] */

/**
 * The Adapter encapsulates the specifics of a particular datastore. The adapter
 * provides a basic implementation of all core functionality, but this
 * implementation may be overridden on a case-by-case basis. For example, the
 * Postgres adapter might consider overriding select/insert/update/delete
 * functionality in order to support `INHERITS` functionality, thus bypassing
 * the larger number of queries that would otherwise be generated.
 *
 * @interface
 */
export default class Adapter {
	/**
	 * Perform the connection to the underlying datastore.
     * @returns {Boolean} - True if connected, false otherwise
	 */
    connect() {}

    /**
     * Retrieve a set of records from the datastore.
     *
     * @param {Object} query - The object representation of the query
     * @param {Object} options - Any additional query options
     * @returns {Promise} - A promise fulfilled by the result
     */
    find(query, options) {}
    /**
     * Persist a record to the datastore.
     *
     * @param {Object} query - The object representation of the query
     * @param {Object} options - Any additional query options
     * @returns {Promise} - A promise fulfilled by the result
     */
    create(query, options) {}
    /**
     * Persist changes to a record to the datastore.
     *
     * @param {Object} query - The object representation of the query
     * @param {Object} options - Any additional query options
     * @returns {Promise} - A promise fulfilled by the result
     */
    update(query, options) {}
    /**
     * Persist a new record, or update an existing record, in the datastore
     *
     * @param {Object} query - The object representation of the query
     * @param {Object} options - Any additional query options
     * @returns {Promise} - A promise fulfilled by the result
     */
    upsert(query, options) {}
    /**
     * Remove a record from the datastore
     *
     * @param {Object} query - The object representation of the query
     * @param {Object} options - Any additional query options
     * @returns {Promise} - A promise fulfilled by the result
     */
    remove(query, options) {}
}