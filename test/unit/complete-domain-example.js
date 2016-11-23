//
// The contents of this source file are intended to represent the full extent of
// mapping options with regard to the operation of the One ORM library.
//
// The first usage of any feature should be noted.
//
import Session from '../../src/Session';
import { adapterSpy } from './utils';

const session = new Session();
export default session;

const User = session.model('User', {
    'id': {
        'type': Number, // Type definition
        'primary': true // Primary key definition
    },
    'firstName': {
        'type': String,
        'nullable': true // Define field as nullable
    },
    'lastName': {
        'type': String,
        'nullable': true
    },
    'username': {
        'type': String,
        'unique': true // Define field as unique
    },
    'email': {
        'type': String,
        'unique': true
    },
    'registered': {
        'type': Date,
        'column': 'register_date' // Define custom column name
    },
    'role': {
        'type': String
    },
    'password': {
        'type': String,
        'exclude': true
    }
}, {
    'table': 'users'
});

const Client = session.model('Client', {
    'clientNum': {
        'type': Number
    },
    'representative': {
        'type': String
    }
}, {
    'extends': User,
    'table': 'clients'
});

const Post = session.model('Post', {
    'id': {
        'type': Number,
        'primary': true
    },
    'title': {
        'type': String
    },
    'content': {
        'type': String
    },
    'author': {
        'ref': 'User', // Foreign key to another table/model
        'relation': 'one-to-one', // Type of the relationship
        'column': 'author_id'
    },
    'editor': {
        'ref': 'User',
        'relation': 'one-to-one',
        'column': 'editor_id'
    },
    'created': {
        'type': Date
    }
}, {
    'table': 'posts'
});
export { User, Client, Post };

export { adapterSpy };