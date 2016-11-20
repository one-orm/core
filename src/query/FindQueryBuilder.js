import * as ModelUtils from '../utils/model-utils';
import * as JoinUtils from '../utils/join-utils';
import * as GraphUtils from '../utils/graph-utils';
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

            // Priorities:
            // 1) Explicit exclude
            // 2) Explicit include
            // 3) Model exclude
            const _graph = graph + '.' + key;
            if (this.options.exclude.indexOf(_graph) !== -1
                    || (field.exclude && this.options.include.indexOf(_graph) === -1)) {
                return;
            }

            // If this is a relational field
            if (field.ref && (field.eager
                    || this.options.include.indexOf(_graph) !== -1)) {
                this.join(_graph);
                return;
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

        const nodes = GraphUtils.resolveGraph(graph, this._root);

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

            // TODO We want to join on the current graph
            const alias = this.tableAlias(node.ref.name);
            this._joins.push({
                'table': node.ref._modelMeta.options.table,
                'as': alias,
                'on': JoinUtils.getJoinColumns(lastNode.ref, node.key, lastAlias, alias),
                'from': currentGraph
            });
            lastGraph = currentGraph;
            lastNode = node;
            lastAlias = alias;

            this.addFields(lastGraph, lastAlias, ModelUtils.getFields(lastNode.ref));
            this.joinParent(lastNode.ref, lastAlias);
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