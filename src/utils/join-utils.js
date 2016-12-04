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
 * @param {Object} field - The field action as the source of the join
 * @param {String} [sourceAlias] - The alias of the source entity
 * @param {String} [targetAlias] - The alias of the target entity
 * @returns {Object} - An object map keyed by source columns, pointing to target
 *         columns
 */
export function getJoinColumns(field, sourceAlias, targetAlias) {
    // TODO Composite key support

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

    throw new Error('Invalid relation type: ' + field.relation);
}

/**
 * Given a field that represents a relationship, retrieves the field that
 * represents the owning side of the relationship. As the field given may in
 * fact be the owning side of the relationship, this may return the original
 * field given.
 *
 * @param {Object} field - The field from which we find ownership
 * @returns {Object} - The field that owns the relationship
 */
export function getOwningField(field) {
    if (!field.mappedBy) {
        return field;
    }

    return ModelUtils.getField(field.ref, field.mappedBy);
}

/**
 * Given a field that represents a relationship, retrieves the field that
 * represents the non-owning side of the relationship, usually indicated by
 *
 * @param {Object} field - The field from which we find the non-owner
 * @returns {Object} - The non-owning field in the relationship
 */
export function getNonOwningField(field) {
    if (field.mappedBy) {
        return field;
    }
    const ref = FieldUtils.getRef(field);
    if (!ref) {
        return null;
    }

    const fields = ModelUtils.getFields(ref);
    return fields.find((_field) => {
        return _field.owningModel === field.ref
                && _field.mappedBy === field.name;
    });
}

/**
 * Given a field that represents a many-to-many relationship, retrieves the
 * field on the association table that references the owner of the given field.
 * In reality, many-to-many relationships are actually just a pair of
 * many-to-one relationships, where the actual owner of both is the association
 * table. This function returns the many-to-one owner that refers to the given
 * field.
 *
 * @param {Object} field - The field to find the association table field for
 * @returns {Object} - The field of the association table
 */
export function getAssociationEntityField(field) {
    if (!field.through) {
        return null;
    }
}

/**
 * Builds the entity that represents an association table for a many-to-many
 * relationship.
 *
 * @param {Object} field - The field which represents one half of the
 *         relationship for which the association table will be built
 * @param {Model} Model - The base Model class. Passed in rather than included
 * @returns {undefined} - Nothing
 */
export function buildAssociationEntity(field, Model) {
    if (field.relation !== 'many-to-many' || field.through) {
        return;
    }

    let startField = getOwningField(field);
    if (!startField) {
        return;
    }
    let endField = getNonOwningField(field);
    if (!endField) {
        return;
    }
    if (startField.mappedBy) {
        const tmp = startField;
        startField = endField;
        endField = tmp;

        if (!startField) {
            return;
        }
        if (startField.through || endField.through) {
            startField.through = startField.through || endField.through;
            endField.through = startField.through || endField.through;
            return;
        }
    }

    const fields = {};
    fields[startField.name || startField.owningModel.name] = {
        'ref': startField.ref,
        'relation': 'many-to-one',
        'primary': true,
        'column': startField.joinColumns ? startField.joinColumns[0].name : undefined
    };
    fields[endField.name || endField.owningModel.name] = {
        'ref': endField.ref,
        'relation': 'many-to-one',
        'primary': true,
        'column': startField.inverseJoinColumns ? startField.inverseJoinColumns[0].name : undefined
    };

    const AssociationEntity = Model.extend(
        startField.owningModel.name + endField.owningModel.name,
        fields,
        {
            'table': startField.joinTable || (startField.owningModel.name + '_' + endField.owningModel.name)
        }
    );
    startField.through = AssociationEntity;
    endField.through = AssociationEntity;
}

/**
 * Retrieves the first field found on the owner that refers to the target. This
 * is not always the most desirable function to use, as in the example of a
 * self-referencing many-to-many relationship where the association table would
 * have two fields which both refer to the same target.
 *
 * @param {Object} owner - The owning entity to find a field on
 * @param {Object} target - The entity the matching field must reference
 * @returns {Object} - The field on the owner that refers to the target
 */
export function getFieldReferringTo(owner, target) {
    const fields = Object.values(ModelUtils.getFields(owner));
    return fields.find((field) => {
        return FieldUtils.getRef(field) === target;
    });
}

/**
 * Given a field that represents one side of a relationship, retrieves the field
 * that represents the other side of the relationship. If the field given is
 * the non-owning field in the relationship, there should always be a
 * corresponding field to return. If the field is the owning side, then it is
 * possible that there will not be a corresponding field if the developer didn't
 * create one when mapping their domain.
 *
 * @param {Object} field - The field find the other side for
 * @returns {Object} - The field representing the other side of the relationship
 */
export function getOtherSide(field) {
    if (!field || !field.ref) {
        return null;
    }

    if (field.mappedBy) {
        return ModelUtils.getField(field.ref, field.mappedBy);
    }

    return ModelUtils.getFields(field.ref).find((_field) => {
        return _field.ref === field.owningModel
                && _field.mappedBy === field.name;
    });
}