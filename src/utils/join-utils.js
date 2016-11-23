import * as ModelUtils from './model-utils';
import * as IdentUtils from './identifier-utils';
import * as FieldUtils from './field-utils';

/**
 * Builds a map of foreign key to primary key columns between the supplied child
 * model and its parent model. The map is keyed by the child foreign key
 * columns.
 *
 * @param {Model} child - The child to find join columns for
 * @param {String} [childAlias] - The alias that refers to the child entity in
 *         the query this is to be used for
 * @param {String} [parentAlias] - The alias that refers to the parent entity in
 *         the query this is to be used for
 * @returns {Object} - The map of child foreign key columns to parent primary
 *         key columns
 */
export function getJoinColumnsFromChildToParent(child, childAlias, parentAlias) {
    let childPrimaries = ModelUtils.getPrimaryFields(child);
    const parentPrimaries = ModelUtils.getPrimaryFields(ModelUtils.getParent(child));

	// If the child hasn't specified any primary keys, we inherit the identifier
	// definition from the parent
    if (childPrimaries.length === 0) {
        childPrimaries = parentPrimaries.slice();
    }

    if (childPrimaries.length !== parentPrimaries.length) {
        throw new Error('Primary key count mismatch between ' + ModelUtils.getName(child) + ' and parent ' + ModelUtils.getName(ModelUtils.getParent(child)));
    }

    if (childPrimaries.length === 1) {
        const childName = IdentUtils.prefixAlias(childPrimaries[0].name, childAlias);
        const parentName = IdentUtils.prefixAlias(parentPrimaries[0].name, parentAlias);
        return { [childName]: parentName };
    }
}

/**
 * Builds a map of foreign key to primary key columns between the supplied model
 * and the model indicated by the given field.
 *
 * @param {Model} model - The model to join from
 * @param {String} fieldName - The name of the field that points to the target
 *         model
 * @param {String} [sourceAlias] - The alias of the source entity
 * @param {String} [targetAlias] - The alias of the target entity
 * @returns {Object} - An object map keyed by source columns, pointing to target
 *         columns
 */
export function getJoinColumns(model, fieldName, sourceAlias, targetAlias) {
    // TODO Composite key support

    const field = ModelUtils.getField(model, fieldName);
    if (!field.ref) {
        throw new Error('Cannot join on a field that does not refer to another model');
    }
    const target = FieldUtils.getRef(field);

    if (field.relation === 'one-to-one' || field.relation === 'many-to-one') {
        // Get the primary key of the target entity
        const targetPrimaryFields = ModelUtils.getPrimaryFields(target);
        if (targetPrimaryFields.length > 1) {
            throw new Error('Composite keys are not yet supported');
        }

        return {
            [IdentUtils.prefixAlias(field.column, sourceAlias)]: IdentUtils.prefixAlias(targetPrimaryFields[0].column, targetAlias)
        };
    }

    if (field.relation === 'one-to-many') {
        const targetField = ModelUtils.getField(target, field.mappedBy);
        const ownerPrimaryFields = ModelUtils.getPrimaryFields(field.owningModel);
        if (ownerPrimaryFields.length > 1) {
            throw new Error('Composite keys are not yet supported');
        }
        return {
            [IdentUtils.prefixAlias(ownerPrimaryFields[0].column, sourceAlias)]: IdentUtils.prefixAlias(targetField.column, targetAlias)
        };
    }
}