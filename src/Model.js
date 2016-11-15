class Model {

    /**
     * ES6 doesn't support instance variables in the classical sense of OOP.
     * That is to say, we can't define our acceptable instance variables ahead
     * of time like we could with Java for example, and thus we can't inspect
     * them. We therefore need to store our field information elsewhere. This
     * leads to some funkiness when handling inheritance. We thus need to add an
     * explicit `extend` class method to allow for this.
     */
    static extend(name, fields, options) {
        options = options || {};
        const parent = this;

        const obj = function () {
            parent.apply(this, Array.prototype.slice(arguments));
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
                field.owningModel = this.name;
            }
        });
        return this;
    }

    static inspect() {
        return 'Model<' + this.name + '>';
    }

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

export default Model;