/* eslint import/prefer-default-export: "off" */

import * as ModelUtils from './model-utils';
import * as FieldUtils from './field-utils';

/**
 * Breaks down the supplied entity graph and returns an array of objects, where
 * each object in the array represents a single node in the graph. Each node
 * representation may present the following properties:
 *   - key: The path segment that textually represents the node. For example,
 *         in the case of `Post.author.name`, you'd receive an array with three
 *         elements, each with the keys `Post`, `author`, and `name`
 *         respectively.
 *   - type: The data type of the node. If the node is referential, it will not
 *         have a `type`, but will have a `ref` instead.
 *   - ref: If the node points to an entity, the ref property will be set to the
 *         name of that entity.
 *
 * An example result from a call for the path `author.name` on the `Post` root,
 * might look something like:
 *
 * ```
 * [{
 *     key: 'Post',
 *     ref: 'Post',
 * }, {
 *     key: 'author',
 *     ref: 'User'
 * }, {
 *     key: 'name',
 *     type: String
 * }]
 * ```
 *
 * @param {Model} from - The root entity of the graph. Using the root entity
 *         rather than a session allows us to support multiple sessions.
 * @param {String} graph - The textual graph representation to resolve
 * @returns {Object[]|null} - A list of node representations or null if graph is
 *         invalid
 */
export function resolveGraph(from, graph) {
    if (!from || !graph || !graph.substr || graph.length === 0) {
        return null;
    }

    const buildNode = function (key, field) {
        const node = {
            key
        };
        if (field.ref) {
            node.ref = FieldUtils.getRef(field);
        } else {
            node.type = field.type;
        }
        return node;
    };

	// If the graph is a single segment
    if (graph.indexOf('.') === -1) {
        const field = ModelUtils.getField(from, graph);
        if (!field) {
            return null;
        }
        const result = [{
            'key': from.name,
            'ref': from
        }];
        result.push(buildNode(graph, field));
        return result;
    }

	// If the graph is more than one segment
    const parts = graph.split('.');
    let result = [];
    let previousEntity = from;
    result.push({
        'key': from.name,
        'ref': from
    });

    parts.forEach((part) => {
        if (result === null) {
            return;
        }

        const field = ModelUtils.getField(previousEntity, part);
        if (!field) {
            result = null;
            return;
        }
        const node = buildNode(part, field);
        result.push(node);

        if (field.ref) {
            previousEntity = node.ref;
        }
    });
    return result;
}