/* eslint no-unused-expressions: "off" */

import { expect } from 'chai';
import { Session } from '../utils';
import * as ModelUtils from '../../../src/utils/model-utils';

const session = new Session();
const Vehicle = session.model('Vehicle', {});
const Car = session.model('Car', {}, {
    'extends': Vehicle
});
const Sedan = session.model('Sedan', {
    'numDoors': {
        'type': Number
    }
}, {
    'extends': Car
});

describe('Model Utilities tests', () => {
    describe('getModel()', () => {
        it('Fails when no argument given', () => {
            const result = ModelUtils.getModel();
            expect(result).to.be.null;
        });
        it('Fails when given non-model', () => {
            const result = ModelUtils.getModel({});
            expect(result).to.be.null;
        });
        it('Returns model class given', () => {
            const result = ModelUtils.getModel(Car);
            expect(result).to.equal(Car);
        });
        it('Returns model class for instance', () => {
            const car = new Car();
            const result = ModelUtils.getModel(car);
            expect(result).to.not.equal(car);
            expect(result).to.equal(Car);
        });
    });

    describe('getName()', () => {
        it('Returns name for model class', () => {
            const result = ModelUtils.getName(Car);
            expect(result).to.equal('Car');
        });
        it('Returns name for model instance', () => {
            const result = ModelUtils.getName(new Car());
            expect(result).to.equal('Car');
        });
    });

    describe('getParent()', () => {
        it('Returns parent for model class', () => {
            const result = ModelUtils.getParent(Sedan);
            expect(result).to.equal(Car);
        });
        it('Returns parent for model instance', () => {
            const result = ModelUtils.getParent(new Sedan());
            expect(result).to.equal(Car);
        });
        it('Returns null if given model is root', () => {
            const result = ModelUtils.getParent(Vehicle);
            expect(result).to.be.null;
        });
        it('Returns null if argument missing', () => {
            const result = ModelUtils.getParent();
            expect(result).to.be.null;
        });
    });

    describe('getAncestors()', () => {
        it('Returns ancestors for model class', () => {
            const result = ModelUtils.getAncestors(Sedan, session);
            expect(result).to.deep.equal([Car, Vehicle]);
        });
        it('Returns ancestors for model instance', () => {
            const result = ModelUtils.getAncestors(new Sedan(), session);
            expect(result).to.deep.equal([Car, Vehicle]);
        });
    });

    describe('getField()', () => {
        it('Returns field for model class', () => {
            const result = ModelUtils.getField(Sedan, 'numDoors');
            expect(result).to.deep.equal({
                'column': 'numDoors',
                'name': 'numDoors',
                'type': Number,
                'owningModel': Sedan
            });
        });
        it('Returns field for model instance', () => {
            const result = ModelUtils.getField(new Sedan(), 'numDoors');
            expect(result).to.deep.equal({
                'column': 'numDoors',
                'name': 'numDoors',
                'type': Number,
                'owningModel': Sedan
            });
        });
    });

    describe('getFields()', () => {
        it('Returns fields for model class', () => {
            const result = ModelUtils.getFields(Sedan);
            expect(result).to.deep.equal({
                'numDoors': {
                    'column': 'numDoors',
                    'name': 'numDoors',
                    'owningModel': Sedan,
                    'type': Number
                }
            });
        });
        it('Returns fields for model instance', () => {
            const result = ModelUtils.getFields(new Sedan());
            expect(result).to.deep.equal({
                'numDoors': {
                    'column': 'numDoors',
                    'name': 'numDoors',
                    'owningModel': Sedan,
                    'type': Number
                }
            });
        });
    });

    describe('getAllFields()', () => {
        it('Returns fields for model class', () => {
            const result = ModelUtils.getAllFields(Sedan, session);
            expect(result).to.deep.equal({
                'numDoors': {
                    'column': 'numDoors',
                    'name': 'numDoors',
                    'owningModel': Sedan,
                    'type': Number
                }
            });
        });
        it('Returns fields for model instance', () => {
            const result = ModelUtils.getAllFields(new Sedan(), session);
            expect(result).to.deep.equal({
                'numDoors': {
                    'column': 'numDoors',
                    'name': 'numDoors',
                    'owningModel': Sedan,
                    'type': Number
                }
            });
        });
    });

    describe('getChangedFields', () => {
        it('Returns array of field names for model instance', () => {
            const sedan = new Sedan({
                'numDoors': 4,
                'numWheels': 4,
                'numWindows': 6
            });
            const result = ModelUtils.getChangedFields(sedan, session);
            expect(result).to.deep.equal(['numDoors']);
        });
    });
});