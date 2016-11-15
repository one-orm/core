/* eslint no-unused-expressions: "off" */

import { expect } from 'chai';
import Session from '../../src/Session';
import { getParent, getFields, getAllFields } from '../../src/utils/model-utils';

describe('Model tests', () => {
    describe('Definition', () => {
        let session = null;

        before(() => {
            session = new Session();
        });

        it('Can define basic model', () => {
            const User = session.model('User', {
                'id': {
                    'type': Number,
                    'primaryKey': true
                }
            });
            expect(User).to.not.be.null;
            expect(User.name).to.equal('User');
            expect(User._modelMeta.table).to.equal('User');
        });

        it('Can define a model subclass', () => {
            const User = session.model('User', {
                'id': {
                    'type': Number,
                    'primaryKey': true
                }
            });
            const Client = session.model('Client', {
                'email': {
                    'type': String,
                    'primaryKey': true
                }
            }, {
                'extends': User
            });
            expect(Client).to.not.be.null;
            expect(Client.name).to.equal('Client');
            expect(getParent(Client)).to.equal(User);
            expect(getFields(Client)).to.deep.equal({
                'email': {
                    'column': 'email',
                    'name': 'email',
                    'owningModel': 'Client',
                    'primaryKey': true,
                    'type': String
                }
            });
            expect(getAllFields(Client)).to.deep.equal({
                'id': {
                    'column': 'id',
                    'name': 'id',
                    'owningModel': 'User',
                    'primaryKey': true,
                    'type': Number
                },
                'email': {
                    'column': 'email',
                    'name': 'email',
                    'owningModel': 'Client',
                    'primaryKey': true,
                    'type': String
                }
            });
        });

        it('Can specify table name', () => {
            const User = session.model('User', {
                'id': {
                    'type': Number,
                    'primaryKey': true
                }
            }, {
                'table': 'users'
            });
            expect(User._modelMeta.options.table).to.equal('users');
        });
    });
});