/* eslint no-unused-expressions: "off" */

import { expect } from 'chai';
import { Session } from '../utils';
import * as GraphUtils from '../../../src/utils/graph-utils';

const session = new Session();

const User = session.model('User', {
    'id': {
        'type': Number,
        'primary': true
    },
    'name': {
        'type': String
    }
}, {
    'table': 'users'
});

const Post = session.model('Post', {
    'id': {
        'type': Number,
        'primary': true
    },
    'author': {
        'ref': User,
        'relation': 'one-to-one',
        'column': 'author_id'
    },
    'editor': {
        'ref': User,
        'relation': 'one-to-one',
        'column': 'editor_id'
    }
}, {
    'table': 'posts'
});

const Comment = session.model('Comment', {
    'id': {
        'type': Number,
        'primary': true
    },
    'post': {
        'ref': Post,
        'relation': 'many-to-one',
        'column': 'post_id'
    },
    'author': {
        'ref': User,
        'relation': 'one-to-one',
        'column': 'author_id'
    }
}, {
    'table': 'comments'
});

describe('Graph Utilities tests', () => {
    describe('resolveGraph()', () => {
        it('Resolves single segment graph', () => {
            const GRAPH = 'Comment';
            const result = GraphUtils.resolveGraph(GRAPH, Comment);
            expect(result).to.deep.equal([
                { 'key': 'Comment', 'ref': Comment }
            ]);
        });

        it('Returns null on invalid single segment graph', () => {
            const GRAPH = 'NotAnEntity';
            const result = GraphUtils.resolveGraph(GRAPH, Comment);
            expect(result).to.be.null;
        });

        it('Resolves polysegmented graph', () => {
            const GRAPH = 'Comment.post.author';
            const result = GraphUtils.resolveGraph(GRAPH, Comment);
            expect(result).to.deep.equal([
                { 'key': 'Comment', 'ref': Comment },
                { 'key': 'post', 'ref': Post },
                { 'key': 'author', 'ref': User }
            ]);
        });

        it('Returns null on invalid polysegmented graph', () => {
            const GRAPH = 'Comment.post.invalid';
            const result = GraphUtils.resolveGraph(GRAPH, Comment);
            expect(result).to.be.null;
        });

        it('Resolves non-referential terminal field', () => {
            const GRAPH = 'Comment.post.author.name';
            const result = GraphUtils.resolveGraph(GRAPH, Comment);
            expect(result).to.deep.equal([
                { 'key': 'Comment', 'ref': Comment },
                { 'key': 'post', 'ref': Post },
                { 'key': 'author', 'ref': User },
                { 'key': 'name', 'type': String }
            ]);
        });
    });
});