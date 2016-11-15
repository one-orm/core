/* eslint no-unused-expressions: 'off' */
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import session, { Client, User, adapterSpy } from '../complete-domain-example';

chai.use(chaiAsPromised);

describe('Session', () => {
    beforeEach(() => {
        session.adapter = adapterSpy();
    });

    describe('remove()', () => {
        describe('Without inheritance', () => {
            it('Can remove', () => {
                const now = new Date();
                const user = new User();
                user._instanceMeta.isNew = false;
                user.id = 81;
                user.firstName = 'Jason';
                user.username = 'jkillworthy';
                user.email = 'jkillworthy@example.org';
                user.registered = now;
                user.role = 'client';
                session.remove(user);
                expect(session.adapter.remove.getCall(0).args[0])
                    .to.deep.equal([
                        {
                            'from': 'users',
                            'where': {
                                'id': 81
                            }
                        }
                    ]);
            });

            it('Fails to remove non-existing record', () => {
                const user = new User();
                user._instanceMeta.isNew = true;
                return expect(session.remove(user)).to.eventually.be.rejectedWith('Cannot remove a non-existing record.');
            });
        });

        describe('With inheritance', () => {
            it('Can remove', () => {
                const now = new Date();
                const client = new Client();
                client._instanceMeta.isNew = false;
                client.id = 81;
                client.firstName = 'Jason';
                client.lastName = 'Killworthy';
                client.username = 'jkillworthy';
                client.email = 'jkillworthy@example.org';
                client.registered = now;
                client.role = 'client';
                client.clientNum = 562;
                client.representative = 'Markus Dorval';

                session.remove(client);

                expect(session.adapter.remove.getCall(0).args[0])
                    .to.deep.equal([
                        {
                            'from': 'users',
                            'where': {
                                'id': 81
                            }
                        }, {
                            'from': 'clients',
                            'where': {
                                'id': 81
                            }
                        }
                    ]);
            });
        });
    });
});