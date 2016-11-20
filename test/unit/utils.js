import sinon from 'sinon';
import Session from '../../src/Session';

export const adapterSpy = function () {
    return {
        'find': sinon.spy(),
        'create': sinon.spy(),
        'update': sinon.spy(),
        'remove': sinon.spy()
    };
};

export { Session };