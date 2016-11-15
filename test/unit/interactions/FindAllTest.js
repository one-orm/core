import { expect } from 'chai';
import session, { User, Client, adapterSpy } from '../complete-domain-example';

describe('Session.findAll()', () => {
    beforeEach(() => {
        session.adapter = adapterSpy();
    });

    describe('Without inheritance', () => {
        describe('Attribute inclusion/exclusion', () => {
            it('Can include additional attributes', () => {
                session.findAll(User, null, {
                    'include': ['foobar']
                });
                expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                    'columns': [
                        'User.id',
                        'User.firstName',
                        'User.lastName',
                        'User.username',
                        'User.email',
                        'User.register_date',
                        'User.role',
                        'foobar'
                    ],
                    'from': 'users',
                    'as': 'User'
                });
            });
            it('Can exclude attributes', () => {
                session.findAll(User, null, {
                    'exclude': ['email']
                });
                expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                    'columns': [
                        'User.id',
                        'User.firstName',
                        'User.lastName',
                        'User.username',
                        'User.register_date',
                        'User.role'
                    ],
                    'from': 'users',
                    'as': 'User'
                });
            });
            it('Include takes priority', () => {
                session.findAll(User, null, {
                    'include': ['email'],
                    'exclude': ['email']
                });
                expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                    'columns': [
                        'User.id',
                        'User.firstName',
                        'User.lastName',
                        'User.username',
                        'User.email',
                        'User.register_date',
                        'User.role'
                    ],
                    'from': 'users',
                    'as': 'User'
                });
            });
        });

        describe('Handles conditions', () => {
            it('Handles conditions', () => {
                session.findAll(User, {
                    'role': 'admin'
                });
                expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                    'columns': [
                        'User.id',
                        'User.firstName',
                        'User.lastName',
                        'User.username',
                        'User.email',
                        'User.register_date',
                        'User.role'
                    ],
                    'from': 'users',
                    'as': 'User',
                    'where': {
                        'User.role': 'admin'
                    }
                });
            });
        });
    });

    describe('With inheritance', () => {
        describe('Attribute inclusion/exclusion', () => {
            it('Can include additional attributes', () => {
                session.findAll(Client, null, {
                    'include': ['foobar']
                });
                expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                    'columns': [
                        'User.id',
                        'User.firstName',
                        'User.lastName',
                        'User.username',
                        'User.email',
                        'User.register_date',
                        'User.role',
                        'Client.clientNum',
                        'Client.representative',
                        'foobar'
                    ],
                    'from': 'clients',
                    'as': 'Client',
                    'join': [{
                        'to': 'users',
                        'as': 'User',
                        'on': { 'id': 'id' }
                    }]
                });
            });

            it('Can exclude attributes', () => {
                session.findAll(Client, null, {
                    'exclude': ['email']
                });
                expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                    'columns': [
                        'User.id',
                        'User.firstName',
                        'User.lastName',
                        'User.username',
                        'User.register_date',
                        'User.role',
                        'Client.clientNum',
                        'Client.representative'
                    ],
                    'from': 'clients',
                    'as': 'Client',
                    'join': [{
                        'to': 'users',
                        'as': 'User',
                        'on': { 'id': 'id' }
                    }]
                });
            });

            it('Include takes priority', () => {
                session.findAll(Client, null, {
                    'include': ['email'],
                    'exclude': ['email']
                });
                expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                    'columns': [
                        'User.id',
                        'User.firstName',
                        'User.lastName',
                        'User.username',
                        'User.email',
                        'User.register_date',
                        'User.role',
                        'Client.clientNum',
                        'Client.representative'
                    ],
                    'from': 'clients',
                    'as': 'Client',
                    'join': [{
                        'to': 'users',
                        'as': 'User',
                        'on': { 'id': 'id' }
                    }]
                });
            });
        });

        describe('Handles conditions', () => {
            it('Handles conditions', () => {
                session.findAll(Client, {
                    'role': 'admin'
                });
                expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                    'columns': [
                        'User.id',
                        'User.firstName',
                        'User.lastName',
                        'User.username',
                        'User.email',
                        'User.register_date',
                        'User.role',
                        'Client.clientNum',
                        'Client.representative'
                    ],
                    'from': 'clients',
                    'as': 'Client',
                    'join': [{
                        'to': 'users',
                        'as': 'User',
                        'on': { 'id': 'id' }
                    }],
                    'where': {
                        'User.role': 'admin'
                    }
                });
            });
        });
    });
});