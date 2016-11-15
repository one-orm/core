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

export function getParent(model) {
    return getModel(model)._modelMeta.options.extends;
}

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

export function getFields(model) {
    // TODO Needs to support both instances as well as model classes
    return getModel(model)._modelMeta.fields;
}

export function getAllFields(model) {
    // TODO Needs to support both instances as well as model classes
    return getAncestors(model).reduce((result, ancestor) => {
        result = Object.assign({}, result, getFields(ancestor));
        return result;
    }, getFields(model));
}

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

export function getColumns(model) {
    return Object.keys(model._modelMeta.fields).map((fieldName) => {
        const field = model._modelMeta.fields[fieldName];
        return field.column || fieldName;
    });
}

export function getChangedColumns(instance) {
    return getChangedFields(instance).map((fieldName) => {
        return instance.constructor._modelMeta.fields[fieldName].column || fieldName;
    });
}

export function getPrimaryKeys(obj) {
    const allFields = getAllFields(obj);
    return Object.keys(allFields).filter((key) => {
        return allFields[key].primary;
    });
}

export function getPrimaryKeyFields(obj) {
    const allFields = getAllFields(obj);
    return getPrimaryKeys(obj)
        .map((key) => {
            return allFields[key];
        });
}