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
        it('Returns null if no root given', () => {
            const result = GraphUtils.resolveGraph(null, 'Comment.post');
            expect(result).to.be.null;
        });

        it('Returns null if no graph given', () => {
            const result = GraphUtils.resolveGraph(Comment);
            expect(result).to.be.null;
        });

        it('Returns null if graph is not a string', () => {
            const result = GraphUtils.resolveGraph(Comment, Number);
            expect(result).to.be.null;
        });

        it('Returns null if graph is empty', () => {
            const result = GraphUtils.resolveGraph(Comment, '');
            expect(result).to.be.null;
        });

        it('Resolves single segment graph', () => {
            const GRAPH = 'post';
            const result = GraphUtils.resolveGraph(Comment, GRAPH);
            expect(result).to.deep.equal([
                { 'key': 'Comment', 'ref': Comment },
                { 'key': 'post', 'ref': Post }
            ]);
        });

        it('Returns null on invalid single segment graph', () => {
            const GRAPH = 'NotAnEntity';
            const result = GraphUtils.resolveGraph(Comment, GRAPH);
            expect(result).to.be.null;
        });

        it('Resolves polysegmented graph', () => {
            const GRAPH = 'post.author';
            const result = GraphUtils.resolveGraph(Comment, GRAPH);
            expect(result).to.deep.equal([
                { 'key': 'Comment', 'ref': Comment },
                { 'key': 'post', 'ref': Post },
                { 'key': 'author', 'ref': User }
            ]);
        });

        it('Returns null on invalid polysegmented graph', () => {
            const GRAPH = 'post.invalid';
            const result = GraphUtils.resolveGraph(Comment, GRAPH);
            expect(result).to.be.null;
        });

        it('Returns null on invalid interstitial node', () => {
            const GRAPH = 'invalid.author';
            const result = GraphUtils.resolveGraph(Comment, GRAPH);
            expect(result).to.be.null;
        });

        it('Resolves non-referential terminal field', () => {
            const GRAPH = 'post.author.name';
            const result = GraphUtils.resolveGraph(Comment, GRAPH);
            expect(result).to.deep.equal([
                { 'key': 'Comment', 'ref': Comment },
                { 'key': 'post', 'ref': Post },
                { 'key': 'author', 'ref': User },
                { 'key': 'name', 'type': String }
            ]);
        });
    });
});