/* eslint max-nested-callbacks: ['error', 5] */

import { expect } from 'chai';
import session, { User, Client, adapterSpy } from '../complete-domain-example';

describe('Session', () => {
    beforeEach(() => {
        session.adapter = adapterSpy();
    });

    // Any tests for the _find common implementation likely go here
    describe('findAll()', () => {
        it('Can make basic query', () => {
            session.findAll(User, null);
            expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                'columns': [
                    ['User.id', 'User_id'],
                    ['User.firstName', 'User_firstName'],
                    ['User.lastName', 'User_lastName'],
                    ['User.username', 'User_username'],
                    ['User.email', 'User_email'],
                    ['User.register_date', 'User_register_date'],
                    ['User.role', 'User_role']
                ],
                'from': 'users',
                'as': 'User'
            });
        });

        it('Can query inheritance hierarchy', () => {
            session.findAll(Client);
            expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                'columns': [
                    ['Client.clientNum', 'Client_clientNum'],
                    ['Client.representative', 'Client_representative'],
                    ['User0.id', 'User0_id'],
                    ['User0.firstName', 'User0_firstName'],
                    ['User0.lastName', 'User0_lastName'],
                    ['User0.username', 'User0_username'],
                    ['User0.email', 'User0_email'],
                    ['User0.register_date', 'User0_register_date'],
                    ['User0.role', 'User0_role']
                ],
                'from': 'clients',
                'as': 'Client',
                'join': [{
                    'to': 'users',
                    'as': 'User0',
                    'on': { 'Client.id': 'User0.id' }
                }]
            });
        });

        it('Can include additional attributes', () => {
            session.findAll(Client, null, {
                'include': ['Client.password']
            });
            expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                'columns': [
                    ['Client.clientNum', 'Client_clientNum'],
                    ['Client.representative', 'Client_representative'],
                    ['User0.id', 'User0_id'],
                    ['User0.firstName', 'User0_firstName'],
                    ['User0.lastName', 'User0_lastName'],
                    ['User0.username', 'User0_username'],
                    ['User0.email', 'User0_email'],
                    ['User0.register_date', 'User0_register_date'],
                    ['User0.role', 'User0_role'],
                    ['User0.password', 'User0_password']
                ],
                'from': 'clients',
                'as': 'Client',
                'join': [{
                    'to': 'users',
                    'as': 'User0',
                    'on': { 'Client.id': 'User0.id' }
                }]
            });
        });

        it('Can exclude attributes', () => {
            session.findAll(Client, null, {
                'exclude': ['Client.email']
            });
            expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                'columns': [
                    ['Client.clientNum', 'Client_clientNum'],
                    ['Client.representative', 'Client_representative'],
                    ['User0.id', 'User0_id'],
                    ['User0.firstName', 'User0_firstName'],
                    ['User0.lastName', 'User0_lastName'],
                    ['User0.username', 'User0_username'],
                    ['User0.register_date', 'User0_register_date'],
                    ['User0.role', 'User0_role']
                ],
                'from': 'clients',
                'as': 'Client',
                'join': [{
                    'to': 'users',
                    'as': 'User0',
                    'on': { 'Client.id': 'User0.id' }
                }]
            });
        });

        it('Exclude takes priority', () => {
            session.findAll(Client, null, {
                'include': ['Client.email'],
                'exclude': ['Client.email']
            });
            expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                'columns': [
                    ['Client.clientNum', 'Client_clientNum'],
                    ['Client.representative', 'Client_representative'],
                    ['User0.id', 'User0_id'],
                    ['User0.firstName', 'User0_firstName'],
                    ['User0.lastName', 'User0_lastName'],
                    ['User0.username', 'User0_username'],
                    ['User0.register_date', 'User0_register_date'],
                    ['User0.role', 'User0_role']
                ],
                'from': 'clients',
                'as': 'Client',
                'join': [{
                    'to': 'users',
                    'as': 'User0',
                    'on': { 'Client.id': 'User0.id' }
                }]
            });
        });
    });

    describe('findOne()', () => {
        it('Adds limit of one to query', () => {
            session.findOne(User);
            expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                'columns': [
                    ['User.id', 'User_id'],
                    ['User.firstName', 'User_firstName'],
                    ['User.lastName', 'User_lastName'],
                    ['User.username', 'User_username'],
                    ['User.email', 'User_email'],
                    ['User.register_date', 'User_register_date'],
                    ['User.role', 'User_role']
                ],
                'from': 'users',
                'as': 'User',
                'limit': 1
            });
        });
    });

    describe('findOnly()', () => {
        it('Adds limit of two to query', () => {
            session.findOnly(User);
            expect(session.adapter.find.getCall(0).args[0]).to.deep.equal({
                'columns': [
                    ['User.id', 'User_id'],
                    ['User.firstName', 'User_firstName'],
                    ['User.lastName', 'User_lastName'],
                    ['User.username', 'User_username'],
                    ['User.email', 'User_email'],
                    ['User.register_date', 'User_register_date'],
                    ['User.role', 'User_role']
                ],
                'from': 'users',
                'as': 'User',
                'limit': 2
            });
        });
    });
});