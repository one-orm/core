/**
 * The Adapter encapsulates the specifics of a particular datastore. The adapter
 * provides a basic implementation of all core functionality, but this
 * implementation may be overridden on a case-by-case basis. For example, the
 * Postgres adapter might consider overriding select/insert/update/delete
 * functionality in order to support `INHERITS` functionality, thus bypassing
 * the larger number of queries that would otherwise be generated.
 */
export default class Adapter {
    connect() {}

    select(model, options) {} // eslint-disable-line no-unused-vars
    insert(model, values, options) {} // eslint-disable-line no-unused-vars
    update(model, values, options) {} // eslint-disable-line no-unused-vars
    delete() {}
}