import './utils/object-values-polyfill';
import './utils/object-foreach-polyfill';
import * as Utils from './utils/model-utils';
import Model from './Model';
import FindQueryBuilder from './query/FindQueryBuilder';

/**
 * The Session class is the core and root of the One ORM core library. The
 * session accepts an adapter which provides the connection to the underlying
 * datastore, and datastore-specific operations. The Session class itself
 * provides the core data-mapper functionality.
 */
export default class Session {
    /**
     * Builds a new instance of the Session class.

     * @param {Adapter} adapter - The datastore adapter.
     * @param {Object} [options] - A map of options governing the operation of
     *         the ORM.
     */
    constructor(adapter, options) {
        this.adapter = adapter;
        this.options = Object.assign({
            'promise': Promise
        }, options);
        this.models = {};
    }

    /**
     * Defines a new model representation and registers it for use.
     *
     * @param {String} name - The name of the new model
     * @param {Object} fields - A map of field definitions, keyed by field name
     * @param {Object} [options] - Additional options governing the use of the
     *         model.
     * @returns {Model} - The new model class
     */
    model(name, fields, options) {
        options = options || {};
        if (options.extend && !options.extend._modelMeta) {
            throw new Error('Model must extend another model');
        }

        const obj = Model.extend(name, fields, options);
        delete obj.prototype.super;
        this.models[name] = obj;
        return obj;
    }

    /**
     * Retrieves the model identified by the supplied name, or undefined if it
     * does not exist.
     *
     * @param {String} name - The name of the model to retrieve
     * @returns {Model} - The model requested
     */
    get(name) {
        return this.models[name];
    }

    /** ************************************************************************
     * Datastore Interactions
     *
     * The following methods represent those used to retrieve or manipulate the
     * contents of the datastore, as performed by the consuming application.
     ************************************************************************ */
    /**
     * Retrieves a list of matching entities.
     *
     * @param {Model} cls - The model representation to find
     * @param {Object} query - Any query conditions that must be met for a
     *         record to be found
     * @param {Object} options - Options governing the query run
     * @param {Number} options.skip - The number of records at the beginning of
     *         the recordset to discard
     * @param {Number} options.limit - The maximum number of records to return
     *         in the resulting dataset
     * @returns {Promise} - A promise to be fulfilled with the result
     */
    findAll(cls, query, options) {
        return this._find(cls, query, options);
    }

    /**
     * Retrieves the first matching entity. No guarantees are made about which
     * entity will be returned first unless an ordering clause is used.
     *
     * @param {Model} cls - The model representation to find
     * @param {Object} query - Any query conditions that must be met for a
     *         record to be found
     * @param {Object} options - Options governing the query run
     * @returns {Promise} - A promise to be fulfilled with the result
     */
    findOne(cls, query, options) {
        return this._find(cls, query, Object.assign({}, options, {
            'skip': 0,
            'limit': 1
        }));
    }

    /**
     * Retrieves the only entity that matches the given query. If more than one
     * matching entity is found, an error is thrown.
     *
     * @param {Model} cls - The model representation to find
     * @param {Object} query - Any query conditions that must be met for a
     *         record to be found
     * @param {Object} options - Options governing the query run
     * @returns {Promise} - A promise to be fulfilled with the result
     */
    findOnly(cls, query, options) {
        return this
            ._find(cls, query, Object.assign({}, options, {
                'skip': 0,
                'limit': 2
            }))
            .then((result) => {
                if (result && result.length > 1) {
                    return this.options.promise.reject('More than one result found');
                }
                return result;
            });
    }

    /**
     * Persist the supplied new model instance to the underlying datastore.
     *
     * @param {Model} instance - The model instance to be persisted
     * @returns {Promise} - A promise representing the future operation status.
     */
    create(instance) {
        if (!instance._instanceMeta.isNew) {
            return this.options.promise.reject(
                'Cannot create an existing record. Use update() instead.'
            );
        }

        return this.options.promise.resolve(
            this.adapter.create(this._mutate(instance))
        );
    }

    /**
     * Persist changes to the supplied model instance to the existing record in
     * the underlying datastore.
     *
     * @param {Model} instance - The model instance to be persisted
     * @returns {Promise} - A promise representing the future operation status
     */
    update(instance) {
        if (instance._instanceMeta.isNew) {
            return this.options.promise.reject(
                'Cannot update a non-existing record. Use create() instead.'
            );
        }

        return this.options.promise.resolve(
            this.adapter.update(this._mutate(instance))
        );
    }

    /**
     * Persists the entity, either by creating a new record or updating an
     * existing one.
     *
     * The concurrency semantics of SQL:2003's MERGE statement are poorly
     * defined. It basically requires that you lock the table first. It is far
     * preferrable that you use vendor-specific offerings in order to implement
     * this functionality, for example MySQL's `ON DUPLICATE KEY UPDATE` or
     * Postgres' `ON CONFLICT UPDATE` clauses. Otherwise, for generic use, we
     * just fall back to inserting, catching the unique constraint violation and
     * then updating.
     *
     * @param {Model} instance - The model instance to be persisted
     * @returns {Promise} - A promise representing the future operation status
     */
    upsert(instance) {
        return this.options.promise.resolve(
            this.adapter.upsert(this._mutate(instance))
        );
    }

    /**
     * Removes the record, represented by the supplied instance, from the
     * underlying datastore.
     *
     * @param {Model} instance - The model instance to be removed
     * @returns {Promise} - A promise representing the future operation status
     */
    remove(instance) {
        if (instance._instanceMeta.isNew) {
            return this.options.promise.reject(
                'Cannot remove a non-existing record.'
            );
        }

        const ancestors = Utils.getAncestors(instance, this);

        const buildRemoveQuery = function (entity) {
            entity = Utils.getModel(entity);
            let fields = Utils.getPrimaryKeyFields(entity);
            if (!fields || !~Object.keys(fields)) {
                fields = Utils.getPrimaryKeyFields(ancestors[0]);
            }
            fields = fields.reduce((result, field) => {
                result[field.column] = instance[field.name];
                return result;
            }, {});
            return {
                'from': entity._modelMeta.table,
                'where': fields
            };
        };

        const query = ancestors
            .map(buildRemoveQuery)
            .concat(buildRemoveQuery(instance));

        return this.options.promise.resolve(
            this.adapter.remove(query)
        );
    }

    /** ************************************************************************
     * Interaction Utilities
     ************************************************************************ */

    /**
     * Common implementation details for select-oriented queries. All select-
     * oriented queries are slightly different permutations of the same concept,
     * often differing by as little as a `limit` condition. We therefore build
     * all those queries representations in one place, and allow the specific
     * find implementation to alter the query as needed.
     *
     * @private
     * @param {Model} cls - The model class to retrieve
     * @param {Object} conditions - Map of conditions imposed on the query
     * @param {Object} options - Map of additional query options
     * @returns {Promise} - A promise fulfilled by the result of the query
     */
    _find(cls, conditions, options) {
        const query = new FindQueryBuilder(cls, conditions, options, this);
        return Promise.resolve(this.adapter.find(query.toQueryObject()));
    }

    /**
     * Common implementation details for mutation-oriented queries. All mutation
     * queries work off of an understanding of what changed in the model, but
     * all those calls go to different places, so we'll provide the query
     * representation and allow the implementors to do with it as they please.
     *
     * @private
     * @param {Object} instance - The instance to mutate
     * @returns {Object} - A query representation
     */
    _mutate(instance) {
        const changedFields = Utils.getChangedFields(instance);

        const getInsertForModel = function (model) {
            return {
                'into': model._modelMeta.table,
                'values': changedFields.reduce((values, field) => {
                    if (!model._modelMeta.fields[field]) {
                        return values;
                    }
                    values[model._modelMeta.fields[field].column] = instance[field];
                    return values;
                }, {})
            };
        };

        return Utils
            .getAncestors(instance)
            .map(getInsertForModel)
            .concat(getInsertForModel(instance.constructor));
    }

}