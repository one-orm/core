/* eslint no-unused-expressions: "off" */
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import session, { Client, User, adapterSpy } from '../complete-domain-example';

chai.use(chaiAsPromised);

describe('Session', () => {
    beforeEach(() => {
        session.adapter = adapterSpy();
    });

    describe('create()', () => {
        describe('Without inheritance', () => {
            it('Can create', () => {
                const now = new Date();
                const user = new User();
                user.firstName = 'Jason';
                user.username = 'jkillworthy';
                user.email = 'jkillworthy@example.org';
                user.registered = now;
                user.role = 'client';
                session.create(user);
                expect(session.adapter.create.getCall(0).args[0])
                    .to.deep.equal([
                        {
                            'into': 'users',
                            'values': {
                                'email': 'jkillworthy@example.org',
                                'firstName': 'Jason',
                                'register_date': now,
                                'role': 'client',
                                'username': 'jkillworthy'
                            }
                        }
                    ]);
            });

            it('Fails to create existing record', () => {
                const user = new User();
                user._instanceMeta.isNew = false;
                return expect(session.create(user)).to.eventually.be.rejectedWith('Cannot create an existing record. Use update() instead.');
            });
        });

        describe('With inheritance', () => {
            it('Can create', () => {
                const now = new Date();
                const client = new Client();
                client.firstName = 'Jason';
                client.lastName = 'Killworthy';
                client.username = 'jkillworthy';
                client.email = 'jkillworthy@example.org';
                client.registered = now;
                client.role = 'client';
                client.clientNum = 562;
                client.representative = 'Markus Dorval';

                session.create(client);

                expect(session.adapter.create.getCall(0).args[0])
                    .to.deep.equal([
                        {
                            'into': 'users',
                            'values': {
                                'firstName': 'Jason',
                                'lastName': 'Killworthy',
                                'email': 'jkillworthy@example.org',
                                'register_date': now,
                                'role': 'client',
                                'username': 'jkillworthy'
                            }
                        }, {
                            'into': 'clients',
                            'values': {
                                'clientNum': 562,
                                'representative': 'Markus Dorval'
                            }
                        }
                    ]);
            });

            it('Fails to update non-existing record', () => {
                const user = new User();
                return expect(session.update(user)).to.eventually.be.rejectedWith('Cannot update a non-existing record. Use create() instead.');
            });
        });
    });

    describe('update()', () => {

    });

    describe('upsert()', () => {

    });
});