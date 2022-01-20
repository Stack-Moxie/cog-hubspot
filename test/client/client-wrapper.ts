import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import * as justForIdeTypeHinting from 'chai-as-promised';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);
chai.use(require('chai-as-promised'));

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let hubspotClientStub: any;
  let hubspotConstructorStub: any;
  let metadata: Metadata;
  let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    hubspotClientStub = {
      refreshAccessToken: sinon.stub(),
      apiRequest: sinon.spy(),
    };
    hubspotConstructorStub = sinon.stub();
    hubspotConstructorStub.returns(hubspotClientStub)
  });

  it('authenticates with api key', () => {
    // Construct grpc metadata and assert the client was authenticated.
    const expectedCallArgs = {
      apiKey: 'some-api-key',
    };
    metadata = new Metadata();
    metadata.add('apiKey', expectedCallArgs.apiKey);

    // Assert that the underlying API client was authenticated correctly.
    clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
    expect(hubspotConstructorStub).to.have.been.calledWith(expectedCallArgs);
    expect(clientWrapperUnderTest.clientReady).to.eventually.equal(true);
  });

  it('authenticates with oauth details', () => {
    // Construct grpc metadata and assert the client was authenticated.
    const expectedCallArgs = {
      clientId: 'a-client-id',
      clientSecret: 'a-client-secret',
      refreshToken: 'a-refresh-token',
      redirectUri: 'https://example.com/oauth-callback'
    };
    metadata = new Metadata();
    metadata.add('clientId', expectedCallArgs.clientId);
    metadata.add('clientSecret', expectedCallArgs.clientSecret);
    metadata.add('refreshToken', expectedCallArgs.refreshToken);
    metadata.add('redirectUri', expectedCallArgs.redirectUri);

    // Set the refresh access token method to resolve.
    hubspotClientStub.refreshAccessToken.resolves();

    // Assert that the underlying API client was authenticated correctly.
    clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
    expect(hubspotConstructorStub).to.have.been.calledWith(expectedCallArgs);
    expect(clientWrapperUnderTest.clientReady).to.eventually.equal(true);
  });

  it('aborts client readiness when auth token refresh fails', () => {
    // Construct grpc metadata and assert the client was authenticated.
    const expectedCallArgs = {
      clientId: 'a-client-id',
      clientSecret: 'a-client-secret',
      refreshToken: 'a-refresh-token',
      redirectUri: 'https://example.com/oauth-callback'
    };
    metadata = new Metadata();
    metadata.add('clientId', expectedCallArgs.clientId);
    metadata.add('clientSecret', expectedCallArgs.clientSecret);
    metadata.add('refreshToken', expectedCallArgs.refreshToken);
    metadata.add('redirectUri', expectedCallArgs.redirectUri);

    // Set the refresh access token method to reject.
    hubspotClientStub.refreshAccessToken.rejects();

    // Assert that the underlying API client was authenticated correctly.
    clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
    expect(clientWrapperUnderTest.clientReady).to.eventually.be.rejected;
  });

  it('should identify date values', () => {
    const validEpochMs = 1589245171000;
    metadata = new Metadata();
    clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
    expect(clientWrapperUnderTest.isDate(validEpochMs)).to.equal(true);
  });

  it('should not identify regular numbers as date values', () => {
    const oneBillionIsh = 1678900000;
    metadata = new Metadata();
    clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
    expect(clientWrapperUnderTest.isDate(oneBillionIsh)).to.equal(false);
  });

  it('should convert epoch dates to ISO format', () => {
    const validEpochMs = 1579245603000;
    metadata = new Metadata();
    clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
    expect(clientWrapperUnderTest.toDate(validEpochMs)).to.equal('2020-01-17T07:20:03.000Z');
  });

  describe('TicketAware', () => {
    beforeEach(() => {
      hubspotClientStub = {
        apiRequest: sinon.stub(),
      };
      hubspotClientStub.apiRequest.returns(Promise.resolve());
      hubspotClientStub.apiRequest.then = sinon.stub()
      hubspotClientStub.apiRequest.then.resolves();
      hubspotConstructorStub = sinon.stub();
      hubspotConstructorStub.returns(hubspotClientStub)
    });

    it('createTicket', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const sampleTicket = {
        anyKey: 'anyValue'
      };
      await clientWrapperUnderTest.createTicket(sampleTicket);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'POST',
        path: '/crm/v3/objects/tickets',
        body: {
          properties: sampleTicket
        },
      });
    });

    it('updateTicket', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const sampleId = '123123'
      const sampleTicket = {
        anyKey: 'anyValue'
      };
      await clientWrapperUnderTest.updateTicket(sampleId, sampleTicket);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'PATCH',
        path: `/crm/v3/objects/tickets/${+sampleId}`,
        body: {
          properties: sampleTicket
        },
      });
    });

    it('deleteTicketById', async () => {
      const sampleId = '123123'
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      await clientWrapperUnderTest.deleteTicketById(sampleId);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'DELETE',
        path: `/crm/v3/objects/tickets/${+sampleId}`,
      });
    });

    it('getTicketById', async () => {
      const sampleId = '123123'
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      await clientWrapperUnderTest.getTicketById(sampleId);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'GET',
        path: `/crm/v3/objects/tickets/${+sampleId}?properties=`,
      });
    });
  });
});
