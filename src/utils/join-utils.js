/* eslint import/prefer-default-export: "off" */

import * as ModelUtils from './model-utils';
import * as IdentUtils from './identifier-utils';

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