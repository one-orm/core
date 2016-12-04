import { expect } from 'chai';
import { Session, adapterSpy } from '../utils';

const session = new Session();

const User = session.model('User', {
    'id': {
        'type': Number,
        'primary': true
    }
}, {
    'table': 'users'
});

const Client = session.model('Client', {
    'name': {
        'type': String
    }
}, {
    'extends': User,
    'table': 'clients'
});

const Representative = session.model('Representative', {
    'id': {
        'type': Number,
        'primary': true
    },
    'client': {
        'ref': Client,
        'relation': 'many-to-one',
        'column': 'client_id',
        'eager': true
    }
}, {
    'table': 'reps'
});

const Post = session.model('Post', {
    'id': {
        'type': Number,
        'primary': true
    },
    'author': {
        'ref': User,
        'relation': 'many-to-one',
        'column': 'author_id'
    },
    'editor': {
        'ref': User,
        'relation': 'many-to-one',
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
    'author': {
        'ref': User,
        'relation': 'many-to-one',
        'column': 'author_id',
        'eager': true
    }
}, {
    'table': 'comments'
});

describe('Many-To-One Relationships', () => {
    beforeEach(() => {
        session.adapter = adapterSpy();
    });

    it('Basic join', () => {
        session.findAll(Comment);
        expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
            'columns': [
                ['Comment.id', 'Comment_id'],
                ['User0.id', 'User0_id']
            ],
            'from': 'comments',
            'as': 'Comment',
            'join': [
                {
                    'to': 'users',
                    'as': 'User0',
                    'on': {
                        'Comment.author_id': 'User0.id'
                    }
                }
            ]
        });
    });

    it('Join with multiple refs to same model', () => {
        session.findAll(Post, null, {
            'include': ['Post.author', 'Post.editor']
        });
        expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
            'columns': [
                ['Post.id', 'Post_id'],
                ['User0.id', 'User0_id'],
                ['User1.id', 'User1_id']
            ],
            'from': 'posts',
            'as': 'Post',
            'join': [
                {
                    'to': 'users',
                    'as': 'User0',
                    'on': {
                        'Post.author_id': 'User0.id'
                    }
                }, {
                    'to': 'users',
                    'as': 'User1',
                    'on': {
                        'Post.editor_id': 'User1.id'
                    }
                }
            ]
        });
    });

    it('Will not join lazy-loaded relations', () => {
        session.findAll(Post);
        expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
            'columns': [
                ['Post.id', 'Post_id'],
                ['Post.author_id', 'Post_author_id'],
                ['Post.editor_id', 'Post_editor_id']
            ],
            'from': 'posts',
            'as': 'Post'
        });
    });

    it('Will join included lazy-load relations', () => {
        session.findAll(Post, null, {
            'include': ['Post.author']
        });
        expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
            'columns': [
                ['Post.id', 'Post_id'],
                ['User0.id', 'User0_id'],
                ['Post.editor_id', 'Post_editor_id']
            ],
            'from': 'posts',
            'as': 'Post',
            'join': [
                {
                    'to': 'users',
                    'as': 'User0',
                    'on': {
                        'Post.author_id': 'User0.id'
                    }
                }
            ]
        });
    });

    it('Will not join excluded eagerly-loaded relations', () => {
        session.findAll(Comment, null, {
            'exclude': ['Comment.author']
        });
        expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
            'columns': [
                ['Comment.id', 'Comment_id']
            ],
            'from': 'comments',
            'as': 'Comment'
        });
    });

    it('Automatically loads ancestors of relations', () => {
        session.findAll(Representative);
        expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
            'columns': [
                ['Representative.id', 'Representative_id'],
                ['Client0.name', 'Client0_name'],
                ['User0.id', 'User0_id']
            ],
            'from': 'reps',
            'as': 'Representative',
            'join': [
                {
                    'as': 'Client0',
                    'on': {
                        'Representative.client_id': 'Client0.id'
                    },
                    'to': 'clients'
                }, {
                    'as': 'User0',
                    'on': {
                        'Client0.id': 'User0.id'
                    },
                    'to': 'users'
                }
            ]
        });
    });
});