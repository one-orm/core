import { expect } from 'chai';
import * as IdentUtils from '../../../src/utils/identifier-utils';

describe('Identifier Utilities tests', () => {
    describe('prefixAlias()', () => {
        it('Prepends alias', () => {
            const result = IdentUtils.prefixAlias('name', 'Client0');
            expect(result).to.equal('Client0.name');
        });
        it('Returns column if no alias given', () => {
            const result = IdentUtils.prefixAlias('name');
            expect(result).to.equal('name');
        });
    });
});