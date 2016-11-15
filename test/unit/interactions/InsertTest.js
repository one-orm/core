import { expect } from 'chai';
import session, { Client, adapterSpy } from '../complete-domain-example';

describe('Session.insert()', () => {
    beforeEach(() => {
        session.adapter = adapterSpy();
    });

    // describe('Without inheritance', function() {
    //  it('Can create', function() {
    //      let now = new Date();
    //      let user = new User();
    //      user.first_name = 'Jason';
    //      user.username = 'jkillworthy';
    //      user.email = 'jkillworthy@example.org';
    //      user.registered = now;
    //      user.role = 'client';
    //      expect(user.create())
    //          .to.deep.equal({
    //              columns: [
    //                'first_name',
    //                'username',
    //                'email',
    //                'register_date',
    //                'role'
    //              ],
    //              'into': 'users',
    //              'values': [
    //                'Jason',
    //                'jkillworthy',
    //                'jkillworthy@example.org',
    //                now,
    //                'client'
    //              ]
 //                 });
    //  });
    // });

    // describe.only('Inheritance testing', function() {
    //  it('Inheritance testing', function() {

    //      Function.prototype.extends = function(parent) {
    //          let child = this;
    //          child.prototype = Object.create(parent.prototype);
    //          child.prototype.super = parent.prototype;
    //          child.prototype.constructor = child;
    //      };

    //      // Base model
    //      let Model = function() {}
    //      Model.prototype.create = function(data) {
    //          return this._create(this);
    //      }
    //      Model.prototype._create = function(data) {
    //          // Need to call parent first
    //          if (this.super) {
    //              console.log('Call super: ', this.super);
    //              this.super._create(data);
    //          }

    //          let values = this.constructor.fields.map((field) => {
    //              return data[field];
    //          });
    //          console.log('INSERT INTO model(' + this.constructor.fields.join(', ') + ') VALUES (' + values.join(',') + ')');
    //      }

    //      // Basic User
    //      let User = function() {
    //          Model.call(this, Array.prototype.slice(arguments));
    //      }
    //      User.fields = [ 'username', 'email' ];
    //      User.extends(Model);
    //      delete User.prototype.super;

    //      // Client user
    //      let Client = function() {
    //          User.call(this, Array.prototype.slice(arguments));
    //      };
    //      Client.fields = [ 'client_no', 'representative' ];
    //      Client.extends(User);

    //      let c = new Client();
    //      c.username = 'jkillworthy';
    //      c.email = 'jkillworthy@example.com';
    //      c.client_no = 453382;
    //      c.representative = 'Jason Bourne';
    //      c.create();

    //  });
    // });

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
    });
});