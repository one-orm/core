/* eslint import/prefer-default-export: "off" */

/**
 * Retrieves the model to which the supplied field refers.
 *
 * @param {Object} field - The field definition to determine the ref for
 * @returns {Model} - The model to which the field refers
 */
export function getRef(field) {
    if (!field.ref) {
        return null;
    }

    if (field.ref._modelMeta) {
        return field.ref;
    }
    if (Object.prototype.toString.call(field.ref) === '[object Function]') {
        return field.ref();
    }
    return field.ref;
}