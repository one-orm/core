/* eslint no-unused-expressions: "off" */

import { expect } from 'chai';
import * as FieldUtils from '../../../src/utils/field-utils';

describe('Field Utilities tests', () => {
    describe('getRef()', () => {
        it('Returns null if no field given', () => {
            const result = FieldUtils.getRef();
            expect(result).to.be.null;
        });

        it('Returns null if field has no ref', () => {
            const result = FieldUtils.getRef({});
            expect(result).to.be.null;
        });

        it('Returns null if ref is incorrect type', () => {
            const result = FieldUtils.getRef({ 'ref': 'invalid' });
            expect(result).to.be.null;
        });

        it('Returns the ref if it\'s ref is a model', () => {
            const ref = {
                '_modelMeta': {}
            };
            const result = FieldUtils.getRef({ ref });
            expect(result).to.equal(ref);
        });

        it('Returns the ref if it\'s wrapped in a function', () => {
            const ref = {
                '_modelMeta': {}
            };
            const result = FieldUtils.getRef({
                'ref': () => {
                    return ref;
                }
            });
            expect(result).to.equal(ref);
        });
    });
});