import { expect } from 'chai';
import { Session, adapterSpy } from '../utils';

const session = new Session();

// THOUGHTS
//
// There are two types of many-to-many relationship structures:
// 1) The association/bridge/join entity that corresponds with the underlying
//    table is structured automatically. This is expected to be thee typical
//    usage of many-to-many relationships. The developer has the opportunity to
//    specify the join and inverse join columns used on the association table,
//    assuming they name them differently in the db, specify the join table
//    name, and bidirectionality. In this case, no `through` property is
//    specified, merely the `ref`, `relation` (many-to-many), and the optional
//    `joinColumns`, `inverseJoinColumns`, `joinTable`, and `bidirectional`
//    attributes.
// 2) The association/bridge/join entity is crafted by the developer. In this
//    case, the entity that represents the association table must have two sets
//    of foreign keys as `many-to-one` relationships: one set of keys that point
//    to the owner of the relationship, and one set that points to the owned
//    entity. Arbitrary other fields may be specified, but the foreign keys must
//    perform a complete join. Generally speaking, exclusions and lazy/eager
//    specification don't have much of an effect, as the contents of the table
//    will never be retrieved. The association entity must be specified as the
//    `through` attribute of the field definition, in addition to the `ref` and
//    `relation` fields. `joinColumn` must be specified if the association is
//    self-referential, otherwise the mapper won't understand which foreign keys
//    belong to the owning side of the relationship. `inverseJoinColumns` may be
//    explicitly specified, but can be divined automatically. Lastly, the
//    `bidirectional` attribute may be set to `true` in order to permit lookups
//    from both sides of the relation to populate the field.

let Author = null;
const Book = session.model('Book', {
    'id': {
        'type': Number,
        'primary': true
    },
    'authors': {
        'ref': () => {
            return Author;
        },
        'relation': 'many-to-many'
    }
}, {
    'table': 'books'
});

Author = session.model('Author', {
    'id': {
        'type': Number,
        'primary': true
    },
    'books': {
        'ref': Book,
        'relation': 'many-to-many',
        'mappedBy': 'authors'
    }
}, {
    'table': 'authors'
});

let Author2 = null;
const Book2 = session.model('Book2', {
    'id': {
        'type': Number,
        'primary': true
    },
    'authors': {
        'ref': () => {
            return Author2;
        },
        'relation': 'many-to-many',
        'joinTable': 'books_authors',
        'joinColumns': [{ 'name': 'author_id', 'referencedField': 'id' }],
        'inverseJoinColumns': [{ 'name': 'book_id', 'referencedField': 'id' }]
    }
}, {
    'table': 'books'
});

Author2 = session.model('Author2', {
    'id': {
        'type': Number,
        'primary': true
    },
    'books': {
        'ref': Book2,
        'relation': 'many-to-many',
        'mappedBy': 'authors'
    }
}, {
    'table': 'authors'
});

describe('Many-To-Many Relationships', () => {
    beforeEach(() => {
        session.adapter = adapterSpy();
    });

    it('Basic join', () => {
        session.findAll(Author, null, {
            'include': ['Author.books']
        });
        expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
            'columns': [
                ['Author.id', 'Author_id'],
                ['Book0.id', 'Book0_id']
            ],
            'from': 'authors',
            'as': 'Author',
            'join': [
                {
                    'to': 'Book_Author',
                    'as': 'BookAuthor0',
                    'on': {
                        'BookAuthor0.authors': 'Author.id'
                    }
                }, {
                    'to': 'books',
                    'as': 'Book0',
                    'on': {
                        'BookAuthor0.books': 'Book0.id'
                    }
                }
            ]
        });
    });

    it('Will not join lazy-loaded relations', () => {
        session.findAll(Author);
        expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
            'columns': [
                ['Author.id', 'Author_id']
            ],
            'from': 'authors',
            'as': 'Author'
        });
    });

    it('Can customize field and table names', () => {
        session.findAll(Author2, null, {
            // TODO Just realized that we should start the graph without the
            //      entity name
            'include': ['Author2.books']
        });
        expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
            'columns': [
                ['Author2.id', 'Author2_id'],
                ['Book20.id', 'Book20_id']
            ],
            'from': 'authors',
            'as': 'Author2',
            'join': [
                {
                    'to': 'books_authors',
                    'as': 'Book2Author20',
                    'on': {
                        'Book2Author20.author_id': 'Author2.id'
                    }
                }, {
                    'to': 'books',
                    'as': 'Book20',
                    'on': {
                        'Book2Author20.book_id': 'Book20.id'
                    }
                }
            ]
        });
    });
});