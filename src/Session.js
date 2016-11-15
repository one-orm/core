import './utils/object-values-polyfill';
import './utils/object-foreach-polyfill';
import * as Utils from './utils/model-utils';
import Model from './Model';

// function getParent(child) {
//     return Object.getPrototypeOf(Object.getPrototypeOf(child)).constructor;
// }

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

    model(name, fields, options) {
        options = options || {};
        options.instance = this;

        const obj = Model.extend(name, fields, options);
        delete obj.prototype.super;
        return obj;
    }

    register(name, model) {
        this.models[name] = model;
        return model;
    }

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
    findAll(cls, query, options = {}) {
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
    findOne(cls, query, options = {}) {
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
    findOnly(cls, query, options = {}) {
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

        const ancestors = Utils.getAncestors(instance);

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
     * Common implementation details for select-oriented queries
     * @private
     * @returns {Promise}
     */
    _find(cls, conditions, options = {}) {
        const ast = {
            'columns': this.buildColumnsForQuery(cls, options),
            'from': cls._modelMeta.table,
            'as': cls.name
        };

        // Handle joins
        const _joins = this.buildJoinsForQuery(cls);
        if (_joins) {
            ast.join = _joins;
        }
        // Build conditions
        const _conditions = this.buildConditionsForQuery(cls, conditions);
        if (_conditions) {
            ast.where = _conditions;
        }
        // Skip
        if (options.skip) {
            ast.skip = options.skip;
        }
        // Limit
        if (options.limit) {
            ast.limit = options.limit;
        }

        return Promise.resolve(this.adapter.find(ast));
    }

    /**
     * Common implementation details for mutation-oriented queries.
     * @private
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

    /** ************************************************************************
     * Low-level utilities
     ************************************************************************ */
    /**
     * @param options.include {Array}
     * @param options.exclude {Array}
     * @private
     */
    buildColumnsForQuery(cls, options) {
        const _options = Object.assign({
            'include': [],
            'exclude': []
        }, options);

        const fields = Utils.getAncestors(cls)
            .concat(cls)
            .reduce((result, entity) => {
                result = Object.assign({}, result, Utils.getFields(entity));
                return result;
            }, {});

        const columns = Object.values(fields)
            .filter((field) => {
                // Handle inclusions and exclusions
                return _options.exclude.indexOf(field.name) === -1
                        || _options.include.indexOf(field.name) !== -1;
            })
            .map((field) => {
                return field.owningModel + '.' + field.column;
            });
        _options.include.forEach((includeName) => {
            if (!(includeName in fields)) {
                columns.push(includeName);
            }
        });
        return columns;
    }

    /**
     * @private
     */
    buildConditionsForQuery(cls, conditions) {
        if (!conditions || Object.keys(conditions).length === 0) {
            return;
        }

        const fields = Utils.getAllFields(cls);
        const result = {};

        Object.forEach(conditions, (condition, key) => {
            if (key.indexOf('.') === -1) {
                const field = fields[key];
                result[field.owningModel + '.' + field.column] = condition;
            } else {
                result[key] = condition;
            }
        });
        return result;
    }

    /**
     * @private
     */
    buildJoinsForQuery(cls) {
        if (cls._modelMeta.options.extends) {
            const parent = Utils.getParent(cls);
            return [{
                'to': parent._modelMeta.options.table,
                'as': parent.name,
                'on': this.relatePrimaryKeys(cls)
            }];
        }
    }

    /**
     * @private
     */
    relatePrimaryKeys(cls) {
        const localFields = Utils.getFields(cls);
        let localPrimaries = Object.keys(localFields)
            .filter((fieldName) => {
                return localFields[fieldName].primary;
            })
            .map((fieldName) => {
                return localFields[fieldName];
            });
        const parentFields = Utils.getFields(Utils.getParent(cls));
        const parentPrimaries = Object.keys(parentFields)
            .filter((fieldName) => {
                return parentFields[fieldName].primary;
            })
            .map((fieldName) => {
                return parentFields[fieldName];
            });

        // We just assume that the dev has added identical primary keys to the
        // child table
        if (localPrimaries.length === 0) {
            localPrimaries = parentPrimaries.slice();
        }

        if (localPrimaries.length !== parentPrimaries.length) {
            throw new Error('Primary key count mismatch between ' + this._modelMeta.name + ' and parent ' + this._modelMeta.options.extends._modelMeta.name);
        }

        if (localPrimaries.length === 1) {
            return { [localPrimaries[0].name]: parentPrimaries[0].name };
        }
    }

}