/* eslint import/prefer-default-export: "off" */

/**
 * Prefixes the supplied column name with the given alias. If no alias is
 * provided, the column is returned unaltered.
 *
 * @param {String} column - The column name to prefix
 * @param {String} alias - The alias to prepend to the column name
 * @returns {String} - The alias and column as an identifier
 */
export function prefixAlias(column, alias) {
    if (!alias) {
        return column;
    }
    return alias + '.' + column;
}