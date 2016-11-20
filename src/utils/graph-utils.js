/* eslint import/prefer-default-export: "off" */

import * as ModelUtils from './model-utils';

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
 * An example result from a call for the path `Post.author.name` might look
 * something like:
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
 * @param {String} path - The textual graph representation to resolve
 * @param {Model} root - The root entity of the graph. Using the root entity
 *         rather than a session allows us to support multiple sessions.
 * @returns {Object[]|null} - A list of node representations or null if graph is
 *         invalid
 */
export function resolveGraph(path, root) {
    if (!root || !path || !path.substr || path.length === 0) {
        return null;
    }

	// If the graph is a single segment
    if (path.indexOf('.') === -1) {
        if (root.name !== path) {
            return null;
        }
        return [{
            'key': path,
            'ref': root
        }];
    }

	// If the graph is more than one segment
    let result = [];
    const parts = path.split('.');
    const previousKey = parts.shift();
    if (root.name !== previousKey) {
        return null;
    }

    let previousEntity = root;
    if (!previousEntity) {
        return null;
    }
    result.push({
        'key': previousKey,
        'ref': previousEntity
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

        const node = {
            'key': part
        };
        if (field.ref) {
            node.ref = field.ref;
            previousEntity = field.ref;
        } else {
            node.type = field.type;
        }
        result.push(node);
    });
    return result;
}