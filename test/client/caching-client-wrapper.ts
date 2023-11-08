import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { CachingClientWrapper } from '../../src/client/caching-client-wrapper';

chai.use(sinonChai);

describe('CachingClientWrapper', () => {
  const expect = chai.expect;
  let cachingClientWrapperUnderTest: CachingClientWrapper;
  let clientWrapperStub: any;
  let redisClientStub: any;
  let idMap: any;

  beforeEach(() => {
    clientWrapperStub = {
      getContactByEmail: sinon.spy(),
      getContactById: sinon.spy(),
      getContactListById: sinon.spy(),
      getContactsInContactListById: sinon.spy(),
      deleteContactByEmail: sinon.spy(),
      deleteContactById: sinon.spy(),
      findWorkflowByName: sinon.spy(),
      createOrUpdateContact: sinon.spy(),
      updateContactById: sinon.spy(),
      enrollContactToWorkflow: sinon.spy(),
      currentContactWorkflows: sinon.spy(),
      getApiUsage: sinon.spy(),
      isDate: sinon.spy(),
      toDate: sinon.spy(),
      toEpoch: sinon.spy(),
    };

    redisClientStub = {
      get: sinon.spy(),
      setex: sinon.spy(),
      del: sinon.spy(),
    };

    idMap = {
      requestId: '1',
      scenarioId: '2',
      requestorId: '3',
    };
  });

  it('getContactByEmail using original function', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.getContactByEmail(expectedEmail);

    setTimeout(() => {
      expect(clientWrapperStub.getContactByEmail).to.have.been.calledWith(expectedEmail);
      done();
    });
  });

  it('getContactByEmail using cache', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.getContactByEmail(expectedEmail);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.getContactByEmail).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('getContactById using original function', (done) => {
    const expectedId = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.getContactById(expectedId);

    setTimeout(() => {
      expect(clientWrapperStub.getContactById).to.have.been.calledWith(expectedId);
      done();
    });
  });

  it('getContactById using cache', (done) => {
    const expectedId = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.getContactById(expectedId);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.getContactById).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('getContactsInContactListById using original function', (done) => {
    const expectedId = '123123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.getContactsInContactListById(expectedId);

    setTimeout(() => {
      expect(clientWrapperStub.getContactsInContactListById).to.have.been.calledWith(expectedId);
      done();
    });
  });

  it('getContactsInContactListById using cache', (done) => {
    const expectedId = '123123';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: string;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.getContactsInContactListById(expectedId);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.getContactsInContactListById).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('deleteContactByEmail', (done) => {
    const expectedEmail = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deleteContactByEmail(expectedEmail);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deleteContactByEmail).to.have.been.calledWith(expectedEmail);
      done();
    });
  });

  it('deleteContactById', (done) => {
    const expectedId = 'test@example.com';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.deleteContactById(expectedId);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.deleteContactById).to.have.been.calledWith(expectedId);
      done();
    });
  });

  it('findWorkflowByName using original function', (done) => {
    const name = 'anyName';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.findWorkflowByName(name);

    setTimeout(() => {
      expect(clientWrapperStub.findWorkflowByName).to.have.been.calledWith(name);
      done();
    });
  });

  it('findWorkflowByName using cache', (done) => {
    const name = 'anyName';
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns('"expectedCachedValue"');
    let actualCachedValue: any;
    (async () => {
      actualCachedValue = await cachingClientWrapperUnderTest.findWorkflowByName(name);
    })();

    setTimeout(() => {
      expect(clientWrapperStub.findWorkflowByName).to.not.have.been.called;
      expect(actualCachedValue).to.equal('expectedCachedValue');
      done();
    });
  });

  it('createOrUpdateContact using original function', (done) => {
    const exampleObj = {a: 1};
    const email = 'any@anyEmail.com'
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.createOrUpdateContact(email, exampleObj);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.createOrUpdateContact).to.have.been.calledWith(email, exampleObj);
      done();
    });
  })

  it('updateContactById using original function', (done) => {
    const exampleObj = {a: 1};
    const id = 'any@anyEmail.com'
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.clearCache = sinon.spy();
    cachingClientWrapperUnderTest.updateContactById(id, exampleObj);

    setTimeout(() => {
      expect(cachingClientWrapperUnderTest.clearCache).to.have.been.called;
      expect(clientWrapperStub.updateContactById).to.have.been.calledWith(id, exampleObj);
      done();
    });
  })

  it('getApiUsage using original function', (done) => {
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getAsync = sinon.stub().returns(false);
    cachingClientWrapperUnderTest.getApiUsage();

    setTimeout(() => {
      expect(clientWrapperStub.getApiUsage).to.have.been.calledWith();
      done();
    });
  });

  it('getCache', (done) => {
    redisClientStub.get = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getCache('expectedKey');

    setTimeout(() => {
      expect(redisClientStub.get).to.have.been.calledWith('expectedKey');
      done();
    });
  });

  it('setCache', (done) => {
    redisClientStub.setex = sinon.stub().yields(); 
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.getCache = sinon.stub().returns(null);
    cachingClientWrapperUnderTest.cachePrefix = 'testPrefix';
    cachingClientWrapperUnderTest.setCache('expectedKey', 'expectedValue');

    setTimeout(() => {
      expect(redisClientStub.setex).to.have.been.calledWith('expectedKey', 55, '"expectedValue"');
      expect(redisClientStub.setex).to.have.been.calledWith('cachekeys|testPrefix', 55, '["expectedKey"]');
      done();
    });
  });

  it('delCache', (done) => {
    redisClientStub.del = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.delCache('expectedKey');

    setTimeout(() => {
      expect(redisClientStub.del).to.have.been.calledWith('expectedKey');
      done();
    });
  });

  it('clearCache', (done) => {
    redisClientStub.del = sinon.stub().yields();
    cachingClientWrapperUnderTest = new CachingClientWrapper(clientWrapperStub, redisClientStub, idMap);
    cachingClientWrapperUnderTest.cachePrefix = 'testPrefix';
    cachingClientWrapperUnderTest.getCache = sinon.stub().returns(['testKey1', 'testKey2'])
    cachingClientWrapperUnderTest.clearCache();

    setTimeout(() => {
      expect(redisClientStub.del).to.have.been.calledWith('testKey1');
      expect(redisClientStub.del).to.have.been.calledWith('testKey2');
      expect(redisClientStub.setex).to.have.been.calledWith('cachekeys|testPrefix');
      done();
    });
  });

});