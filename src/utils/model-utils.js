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
        return null;
    }

    if (model._modelMeta) {
        return model;
    }

    if (model._instanceMeta) {
        return model.constructor;
    }

    return null;
}

/**
 * Returns the class name of the given model or instance.
 *
 * @param {Object} model - The model or instance
 * @returns {String} - The name of the model class
 */
export function getName(model) {
    return getModel(model).name;
}

/**
 * Returns the model class that is the direct parent to the provided model or
 * instance.
 *
 * @param {Object} model - The model or instance
 * @returns {Model} - The parent model, or null if does not exist
 */
export function getParent(model) {
    const _model = getModel(model);
    if (!_model) {
        return null;
    }
    return _model._modelMeta.options.extends || null;
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
 * Retrieves the field definition for the field with the given name from the
 * supplied model or instance.
 *
 * @param {Object} model - The model or instance
 * @param {String} field - The field name
 * @returns {Object} - The field definition, or null if not found
 */
export function getField(model, field) {
    return getModel(model)._modelMeta.fields[field] || null;
}

/**
 * Retrieves the fields configured on the model, as an object keyed by field
 * name. Does not return fields of ancestral models.
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
        return Object.assign({}, result, getFields(ancestor));
    }, getFields(model));
}

/**
 * Retrieves a map of fields that have changed on the model, keyed by field
 * name. Includes ancestral fields.
 *
 * @param {Object} instance - The instance that has changed
 * @returns {Object} - The map of changed fields
 */
export function getChangedFields(instance) {
    const allKeys = []
            .concat(Object.keys(instance._instanceMeta.originalData))
            .concat(Object.keys(getAllFields(instance)));
    return Object.keys(allKeys.reduce((result, key) => {
        if (instance[key] !== instance._instanceMeta.originalData[key]) {
            result[key] = true;
        }
        return result;
    }, {}));
}

/**
 * Retrieves a list of all primary key field names for the given model.
 *
 * @deprecated in favour of getPrimaryFields
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
 * @deprecated in favour of getPrimaryFields
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

/**
 * Retrieves a list of all primary key fields for the given model.
 *
 * @param {Object} obj - The model or instance to find primary keys for.
 * @returns {Object[]} - The list of primary key fields
 */
export function getPrimaryFields(obj) {
    const allFields = getAllFields(obj);
    return Object.keys(allFields)
        .filter((key) => {
            return allFields[key].primary;
        })
        .map((key) => (allFields[key]));
}