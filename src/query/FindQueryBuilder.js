import * as ModelUtils from '../utils/model-utils';
import * as JoinUtils from '../utils/join-utils';
import * as GraphUtils from '../utils/graph-utils';
import * as FieldUtils from '../utils/field-utils';
import QueryBuilder from './QueryBuilder';

/**
 * The FindQueryBuilder is responsible for generating a query representation
 * that may be used to effect a `find` operation on the underlying datastore.
 * This involves keeping track of fields/columns requested, entities joined on,
 * conditions to be applied, and other SQL-esque bits of info.
 */
export default class FindQueryBuilder extends QueryBuilder {
    /**
     * Build a new instance of the FindQueryBuilder.
     *
     * @param {Model} model - The root model to be queried upon
     * @param {Object} [conditions] - Any conditions to be applied to the query
     * @param {Object} [options] - Any additional options governing the query
     */
    constructor(model, conditions, options) {
        super();

        this.options = Object.assign({
            'include': [],
            'exclude': []
        }, options);

        this._fields = [];
        this._joins = [];
        this._joinFromLookup = [];

		// Add the model and fields
        this._root = model;
        this._from = model._modelMeta.options.table;
        this._as = model.name;

        // Process the root's fields
        this.addFields(this._as, this._as, ModelUtils.getFields(this._root));

        // Process the root's hierarchy where applicable
        this.joinParent(this._root, this._as);

        // TODO Implement condition handling
        // TODO Validate conditions
    }

    /**
     * Produces a plain-object representation of the query that should be run
     * by the dialect implementation.
     *
     * @returns {Object} - The plain-object query representation
     */
    toQueryObject() {
        const result = {};
        result.columns = this._fields.map((f) => {
            return [f.column, f.column.replace('.', '_')];
        });
        result.from = this._from;
        result.as = this._as;
        if (this._joins.length > 0) {
            result.join = this._joins.map((j) => {
                return {
                    'to': j.table,
                    'as': j.as,
                    'on': j.on
                };
            });
        }
        if (this.options.skip) {
            result.skip = this.options.skip;
        }
        if (this.options.limit) {
            result.limit = this.options.limit;
        }
        return result;
    }

	//
	// Utilities
	//
    /**
     * Adds fields from the supplied list to the list of fields that will be
     * retrieved from the underlying datastore. Performs field inclusion and
     * exclusion based on the graph of the entity to which the fields belong.
     *
     * @private
     * @param {String} graph - The entity graph, terminating at the owner of the
     *         fields provided
     * @param {String} alias - The alias of the owner of the fields provided
     * @param {Object} fields - The map of fields to potentially add, keyed by
     *         field name
     * @returns {undefined} - Returns nothing
     */
    addFields(graph, alias, fields) {
        if (!fields || !~Object.keys(fields).length) {
            return;
        }
        Object.keys(fields).forEach((key) => {
            const field = fields[key];
            const _graph = graph + '.' + key;

            // 1) Explicit exclude takes priority over includes
            if (this.options.exclude.indexOf(_graph) !== -1) {
                return;
            }

            // 2) Explicit include overrides model exclude
            if (field.exclude && this.options.include.indexOf(_graph) === -1) {
                return;
            }

            // If this is a relational field
            if (field.ref) {
                if (field.eager || this.options.include.indexOf(_graph) !== -1) {
                    this.join(_graph);
                    return;
                }
                if (field.relation === 'one-to-many' || field.relation === 'many-to-many') {
                    return;
                }
            }

            this._fields.push({
                'column': alias + '.' + field.column,
                field
            });
        });
    }

    /**
     * Assuming the supplied entity graph has not yet been fully joined in the
     * query, traverses the entity graph and joins each node where required,
     * pulling in all fields for each node along the way, except where
     * specified.
     *
     * @param {String} graph - The entity graph path to the field to join on
     * @returns {String} - The alias of the newly joined table
     */
    join(graph) {
        // Parse the supplied entity graph
        const first = graph.indexOf('.');
        if (first === -1) {
            throw new Error('Cannot join on a single-segment graph');
        }
        if (graph.substr(0, first) !== this._root.name) {
            throw new Error('Join graphs must be relative to the query root');
        }

        const nodes = GraphUtils.resolveGraph(this._root, graph.substr(graph.indexOf('.') + 1));

        let lastNode = nodes.shift();
        let lastGraph = lastNode.key;
        let lastAlias = this._as;
        nodes.forEach((node) => {
            const currentGraph = lastGraph + '.' + node.key;
            const existingAlias = this._joinFromLookup[currentGraph];

            if (existingAlias) {
                lastGraph = currentGraph;
                lastNode = node;
                lastAlias = existingAlias;
                return;
            }

            const sourceField = ModelUtils.getField(lastNode.ref, node.key);
            const target = FieldUtils.getRef(node);
            const targetAlias = this.tableAlias(target.name);

            if (sourceField.relation === 'many-to-many') {
                const startField = sourceField;
                const endField = JoinUtils.getOtherSide(sourceField);
                const endAlias = targetAlias;
                const associationEntity = endField.through;
                const associationAlias = this.tableAlias(associationEntity.name);

                this._joins.push({
                    'table': associationEntity._modelMeta.options.table,
                    'as': associationAlias,
                    'on': JoinUtils.getJoinColumns(JoinUtils.getFieldReferringTo(startField.through, startField.owningModel), associationAlias, lastAlias)
                });

                this._joins.push({
                    'table': endField.owningModel._modelMeta.options.table,
                    'as': endAlias,
                    'on': JoinUtils.getJoinColumns(JoinUtils.getFieldReferringTo(endField.through, endField.owningModel), associationAlias, endAlias)
                });
            } else {
                this._joins.push({
                    'table': target._modelMeta.options.table,
                    'as': targetAlias,
                    'on': JoinUtils.getJoinColumns(sourceField, lastAlias, targetAlias),
                    'from': currentGraph
                });
            }

            this.addFields(currentGraph, targetAlias, ModelUtils.getFields(ModelUtils.getModel(node.ref)));
            this.joinParent(FieldUtils.getRef(node), targetAlias);

            lastGraph = currentGraph;
            lastNode = node;
            lastAlias = targetAlias;
        });
        return lastAlias;
    }

    /**
     * Builds the join from the given child to it's parent, adding the join
     * clause and all but the excluded fields configured on that parent model.
     *
     * @private
     * @param {Model} child - The child model to find and join with the parent
     * @param {String} childAlias - The child's alias used in the query, for
     *         determining field and table identifiers
     */
    joinParent(child, childAlias) {
        const parent = ModelUtils.getParent(child);
        if (!parent) {
            return;
        }

        const parentAlias = this.tableAlias(parent.name);
        this._joins.push({
            'table': parent._modelMeta.options.table,
            'as': parentAlias,
            'on': JoinUtils.getJoinColumnsFromChildToParent(child, childAlias, parentAlias),
            'from': childAlias
        });

        // Add fields
        const fields = ModelUtils.getFields(parent);
        this.addFields(this._as, parentAlias, fields);

        this.joinParent(parent, parentAlias);
    }
}