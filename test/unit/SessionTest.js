/* eslint no-unused-expressions: "off" */

import { expect } from 'chai';
import Session from '../../src/Session';
import Model from '../../src/Model';

describe('Session', () => {
    let session = null;

    beforeEach(() => {
        session = new Session();
    });

    describe('model()', () => {
        it('Model is registered with the session', () => {
            session.model('User', {
                'id': {
                    'type': Number,
                    'primary': true
                }
            });
            expect(Object.keys(session.models)).to.have.length(1);
        });
        it('Passes arbitrary options to model', () => {
            const User = session.model('User', {
                'id': {
                    'type': Number,
                    'primary': true
                }
            }, {
                'arbitrary': 'tester'
            });
            expect(User._modelMeta.options).to.have.key('arbitrary');
            expect(User._modelMeta.options.arbitrary).to.equal('tester');
        });
        it('Accepts valid extend option', () => {
            const _Parent = session.model('Parent', {
                'id': {
                    'type': Number,
                    'primary': true
                }
            });
            console.log('Parent: ', _Parent instanceof Model); // eslint-disable-line no-console
            console.log('Parent prototype: ', _Parent.prototype);  // eslint-disable-line no-console
            console.log('Parent constructor: ', _Parent.prototype.constructor); // eslint-disable-line no-console
            const User = session.model('User', {
                'id': {
                    'type': Number,
                    'primary': true
                }
            }, {
                'extend': _Parent // Needed for coverage to work
            });
            console.log('User: ', User); // eslint-disable-line no-console
        });
        it('Errors on invalid extend option', () => {
            expect(() => {
                session.model('User', {
                    'id': {
                        'type': Number,
                        'primary': true
                    }
                }, {
                    'extend': 'invalid'
                });
            }).to.throw();
        });
    });

    describe('get()', () => {
        it('Can get a registered model', () => {
            session.model('User', {
                'id': {
                    'type': Number,
                    'primary': true
                }
            });
            expect(session.get('User')).to.be.defined;
        });
        it('Returns undefined on unregistered model', () => {
            expect(session.get('User')).to.be.undefined;
        });
    });
});