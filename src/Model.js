import { buildAssociationEntity } from './utils/join-utils';

/**
 * Because ES6 doesn't support true OOP inheritance, nor does it support
 * instance property definitions, the Model class bridges that gap by providing
 * a place where we can store instance and class metadata about a model,
 * primarily fields and options. It is not to be used directly, but rather will
 * be extended and instantiated by the Session instance where required.
 *
 * The Model class should never be instantiated directly, but should be extended
 * by an actual model representation. Each model representation:
 * 1) When instantiated or uninstantiated, provides a place to store class
 *    metadata, such as the fields and options the govern the interaction with
 *    the underlying datastore
 * 2) When instantiated, provides a place to store the information that is
 *    persisted to or read from the database.
 */
export default class Model {

    /**
     * ES6 doesn't support instance variables in the classical sense of OOP.
     * That is to say, we can't define our acceptable instance variables ahead
     * of time like we could with Java for example, and thus we can't inspect
     * them. We therefore need to store our field information elsewhere. This
     * leads to some funkiness when handling inheritance. We thus need to add an
     * explicit `extend` class method to allow for this.
     *
     * @param {String} name - The name of the new model
     * @param {Object} fields - A set of field definitions
     * @param {Object} [options] - Additional options that affect the new model
     * @param {Object} [options.table] - The name of the represented table
     * @returns {Model} - A new Model representation descended from the current
     *         representation
     */
    static extend(name, fields, options) {
        options = options || {};
        const parent = this;

        const obj = function () {
            parent.apply(this, Array.prototype.slice.call(arguments));
        };
        Object.defineProperty(obj, 'name', { 'value': name });

        obj.prototype = Object.create(parent.prototype);
        obj.prototype.constructor = obj;
        obj.prototype.super = parent.prototype;

        Object.getOwnPropertyNames(parent).forEach((name) => {
            if (['name', 'length', 'prototype', 'caller', 'arguments', '_modelMeta'].indexOf(name) !== -1) {
                return;
            }

            if (typeof parent[name] === 'function') {
                obj[name] = parent[name].bind(obj);
            } else {
                obj[name] = parent[name];
            }
        });

        obj.initialize = Model.initialize.bind(obj);
        obj.extend = Model.extend.bind(obj);

        obj.initialize(fields, options);
        // Model.initialize.call(obj, fields, options);
        return obj;
    }

    /**
     * Given the fields and options associated with the model implementation,
     * creates some metadata which governs the interaction with the underlying
     * datastore.
     * @param {Object} fields - A set of field definitions, keyed by field name
     * @param {Object} [options] - Additional options that affect the new model
     * @returns {Model} - The Model representation to which the method belongs
     */
    static initialize(fields, options) {
        this._modelMeta = {
            'table': options.table || this.name,
            fields,
            options
        };

        Object.keys(this._modelMeta.fields).forEach((fieldName) => {
            const field = this._modelMeta.fields[fieldName];
            if (!field.name) {
                field.name = fieldName;
            }
            if (!field.column) {
                field.column = fieldName;
            }
            if (!field.owningModel) {
                field.owningModel = this;
            }
            if (field.relation === 'many-to-many') {
                buildAssociationEntity(field, Model);
            }
        });
        return this;
    }

    /**
     * Produce a pretty representation of the Model class.
     * @returns {String} The human-readable class representation
     */
    static inspect() {
        return 'Model<' + this.name + '>';
    }

    /**
     * Create a new instance of the Model.
     * @param {Object} [data] - An initial data payload to be merged into the
     *         model instance
     */
    constructor(data) {
        this._instanceMeta = {
            'isNew': true,
            'originalData': {}
        };
        if (data) {
            Object.keys(data).forEach((key) => {
                this[key] = data[key];
            });
        }
    }

    /**
     * Produce a pretty Object representation of the Model instance.
     * @returns {String} The human-readable instance representation
     */
    inspect() {
        const fields = Object.keys(this.constructor._modelMeta.fields).reduce((result, key) => {
            if (this[key]) {
                result[key] = key;
            }
            return result;
        }, {});
        return this.constructor.name + ' ' + JSON.stringify(fields, null, 2);
    }
}