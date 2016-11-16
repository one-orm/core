/**
 * Given either a model or an instance of a model, returns the model class. Used
 * often to normalize arguments when we need a model class but could be given
 * either the class or an instance thereof.
 *
 * @param {Object} model - The model or instance
 * @returns {Model} - The model class
 */
export function getModel(model) {
    if (!model) {
        throw new Error('Invalid entity ' + model);
    }

    if (model._modelMeta) {
        return model;
    }

    if (model._instanceMeta) {
        return model.constructor;
    }

    throw new Error('Invalid entity ' + model);
}

/**
 * Returns the model class that is the direct parent to the provided model or
 * instance.
 *
 * @param {Object} model - The model or instance
 * @returns {Model} - The parent model, or null if does not exist
 */
export function getParent(model) {
    return getModel(model)._modelMeta.options.extends;
}

/**
 * Returns a list of the models that are part of the given model or instance's
 * inheritance chain. Parent, grandparent, great-grandparent, etc.
 *
 * @param {Object} model - The model or instance
 * @returns {Model[]} - The list of models in the inheritance chain
 */
export function getAncestors(model) {
    const parent = getParent(model);
    if (!parent) {
        return [];
    }
    const ancestors = [parent];
    do {
        const ancestor = getParent(ancestors[ancestors.length - 1]);
        if (!ancestor) {
            break;
        }
        ancestors.push(ancestor);
    } while (true);
    return ancestors;
}

/**
 * Retrieves the fields configured on the model, as an object keyed by field
 * name.
 *
 * @param {Object} model - The model or instance
 * @returns {Object} - The map of field definitions
 */
export function getFields(model) {
    return getModel(model)._modelMeta.fields;
}

/**
 * Retrieves the fields configured on the model, as well as all fields
 * configured on any ancestral models, as an object keyed by field name.
 *
 * @param {Object} model - The model or instance
 * @returns {Object} - The map of field definitions
 */
export function getAllFields(model) {
    return getAncestors(model).reduce((result, ancestor) => {
        result = Object.assign({}, result, getFields(ancestor));
        return result;
    }, getFields(model));
}

/**
 * Retrieves a map of fields that have changed on the model, keyed by field
 * name. Does not return fields of ancestral models.
 *
 * TODO Should return an array of field names
 * @param {Object} instance - The instance that has changed
 * @returns {Object} - The map of changed fields
 */
export function getChangedFields(instance) {
    const allKeys = []
            .concat(Object.keys(instance._instanceMeta.originalData || {}))
            .concat(Object.keys(getAllFields(instance)));
    return Object.keys(allKeys.reduce((result, key) => {
        if (instance[key] !== instance._instanceMeta.originalData[key]) {
            result[key] = true;
        }
        return result;
    }, {}));
}

/**
 * Retrieves a list of columns as they are represented in the datastore.
 *
 * @param {Object} model - The model or instance
 * @returns {String[]} - The list of column names
 */
export function getColumns(model) {
    return Object.keys(model._modelMeta.fields).map((fieldName) => {
        const field = model._modelMeta.fields[fieldName];
        return field.column || fieldName;
    });
}

/**
 * Retrieves a list of columns that have changed on the model.
 *
 * @deprecated
 * @uses getChangedFields
 * @param {Object} instance - The instance that has changed
 * @returns {String[]} - The list of columns that have changed
 */
export function getChangedColumns(instance) {
    return getChangedFields(instance).map((fieldName) => {
        return instance.constructor._modelMeta.fields[fieldName].column || fieldName;
    });
}

/**
 * Retrieves a list of all primary key field names for the given model.
 *
 * @param {Object} model - The model or instance
 * @returns {String[]} - The list of primary key field names
 */
export function getPrimaryKeys(model) {
    const allFields = getAllFields(model);
    return Object.keys(allFields).filter((key) => {
        return allFields[key].primary;
    });
}

/**
 * Retrieves a list of all primary key fields for the given model.
 *
 * @param {Object} model - The model or instance
 * @returns {Object[]} - The list of primary key fields
 */
export function getPrimaryKeyFields(model) {
    const allFields = getAllFields(model);
    return getPrimaryKeys(model)
        .map((key) => {
            return allFields[key];
        });
}