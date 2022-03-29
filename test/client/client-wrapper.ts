import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
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

  describe('ContactAware', () => {
    beforeEach(() => {
      hubspotClientStub = {
        contacts: {
          getByEmail: sinon.stub(),
          getById: sinon.stub(),
          createOrUpdate: sinon.stub(),
          update: sinon.stub(),
          delete: sinon.stub(),
        },
        apiRequest: sinon.stub(),
      };
      hubspotClientStub.apiRequest.returns(Promise.resolve());
      hubspotClientStub.apiRequest.then = sinon.stub()
      hubspotClientStub.apiRequest.then.resolves();
      hubspotConstructorStub.returns(hubspotClientStub)
    });

    it('getContactByEmail', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const sampleEmail = 'anyEmail@any.com';
      hubspotClientStub.contacts.getByEmail.resolves({
        email: sampleEmail
      });
      await clientWrapperUnderTest.getContactByEmail(sampleEmail);
      expect(hubspotClientStub.contacts.getByEmail).to.have.been.calledWith(sampleEmail);
    });

    it('getContactById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const sampleId = '123123123';
      hubspotClientStub.contacts.getById.resolves({
        email: sampleId
      });
      await clientWrapperUnderTest.getContactById(sampleId);
      expect(hubspotClientStub.contacts.getById).to.have.been.calledWith(sampleId);
    });

    it('getContactListById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const sampleId = '123123123';
      await clientWrapperUnderTest.getContactListById(sampleId);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'GET',
        path: `/contacts/v1/lists/${sampleId}/contacts/all?count=100`,
      });
    });

    it('createOrUpdateContact', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const sampleEmail = 'anyEmail@any.com';
      const sampleContact = {
        email: sampleEmail
      };
      hubspotClientStub.contacts.createOrUpdate.resolves({});
      await clientWrapperUnderTest.createOrUpdateContact(sampleEmail, sampleContact);
      expect(hubspotClientStub.contacts.createOrUpdate).to.have.been.calledWith(sampleEmail, sampleContact);
    });

    it('updateContactById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const sampleId = '123123123';
      const sampleContact = {
        id: sampleId
      };
      hubspotClientStub.contacts.update.resolves({});
      await clientWrapperUnderTest.updateContactById(sampleId, sampleContact);
      expect(hubspotClientStub.contacts.update).to.have.been.calledWith(+sampleId, sampleContact);
    });

    it('deleteContactByEmail', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const sampleEmail = 'anyEmail@any.com';
      const sampleId = 'anyId';
      hubspotClientStub.contacts.getByEmail.resolves({sampleEmail, vid: sampleId});
      hubspotClientStub.contacts.delete.resolves({});
      await clientWrapperUnderTest.deleteContactByEmail(sampleEmail);
      expect(hubspotClientStub.contacts.getByEmail).to.have.been.calledWith(sampleEmail);
      expect(hubspotClientStub.contacts.delete).to.have.been.calledWith(sampleId);
    });
    
    it('deleteContactById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const sampleEmail = 'anyEmail@any.com';
      const sampleId = 'anyId';
      hubspotClientStub.contacts.getById.resolves({sampleEmail, vid: sampleId});
      hubspotClientStub.contacts.delete.resolves({});
      await clientWrapperUnderTest.deleteContactById(sampleId);
      expect(hubspotClientStub.contacts.getById).to.have.been.calledWith(sampleId);
      expect(hubspotClientStub.contacts.delete).to.have.been.calledWith(sampleId);
    });
  })

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

  describe('MarketingEventAware', () => {
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

    it('createOrUpdateMarketingEvent', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        externalEventId: 'anyValue',
        externalAccountId: 'anyValue',
        marketingEvent: {anyKey: 'anyValue'}
      };
      await clientWrapperUnderTest.createOrUpdateMarketingEvent(input.marketingEvent, input.externalEventId, input.externalAccountId);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'PUT',
        path: `/marketing/v3/marketing-events/events/${input.externalEventId}?externalAccountId=${input.externalAccountId}`,
        body: input.marketingEvent,
      });
    });

    it('deleteMarketingEventById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        externalEventId: 'anyValue',
        externalAccountId: 'anyValue',
      };
      await clientWrapperUnderTest.deleteMarketingEventById(input.externalEventId, input.externalAccountId);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'DELETE',
        path: `/marketing/v3/marketing-events/events/${input.externalEventId}?externalAccountId=${input.externalAccountId}`,
      });
    });

    it('getMarketingEventById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        externalEventId: 'anyValue',
        externalAccountId: 'anyValue',
      };
      await clientWrapperUnderTest.getMarketingEventById(input.externalEventId, input.externalAccountId);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'GET',
        path: `/marketing/v3/marketing-events/events/${input.externalEventId}?externalAccountId=${input.externalAccountId}`,
      });
    });
  });

  describe('ProductAware', () => {
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

    it('createProduct', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      await clientWrapperUnderTest.createProduct([]);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'POST',
        path: '/crm-objects/v1/objects/products',
        body: [],
      });
    });

    it('updateProductById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        id: 'id',
        product: {anyKey: 'anyValue'}
      };
      await clientWrapperUnderTest.updateProductById(input.id, []);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'PUT',
        path: `/crm-objects/v1/objects/products/${+input.id}`,
        body: [],
      });
    });

    it('deleteProductById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        id: '1',
      };
      await clientWrapperUnderTest.deleteProductById(input.id);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'DELETE',
        path: `/crm-objects/v1/objects/products/${+input.id}`,
      });
    });

    it('getProductById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        id: '1',
      };
      await clientWrapperUnderTest.getProductById(input.id);
      expect(hubspotClientStub.apiRequest).to.have.been.calledWith({
        method: 'GET',
        path: `/crm-objects/v1/objects/products/${+input.id}?properties=`,
      });
    });
  });


  describe('CompanyAware', () => {
    beforeEach(() => {
      hubspotClientStub = {
        companies: sinon.stub(),
      };
      hubspotClientStub.companies.create = sinon.stub();
      hubspotClientStub.companies.update = sinon.stub();
      hubspotClientStub.companies.delete = sinon.stub();
      hubspotClientStub.companies.getById = sinon.stub();
      hubspotConstructorStub = sinon.stub();
      hubspotConstructorStub.returns(hubspotClientStub)
    });

    it('getCompanyById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        id: '1',
      }
      hubspotClientStub.companies.getById.resolves({});
      await clientWrapperUnderTest.getCompanyById(input.id);
      expect(hubspotClientStub.companies.getById).to.have.been.calledWith(+input.id);
    });

    it('createCompany', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        company: {
          anyKey: 'anyValue',
        }
      }
      hubspotClientStub.companies.create.resolves({});
      await clientWrapperUnderTest.createCompany(input.company);
      expect(hubspotClientStub.companies.create).to.have.been.calledWith(input.company);
    });

    it('updateCompanyById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        id: '1',
        company: {
          anyKey: 'anyValue',
        }
      }
      hubspotClientStub.companies.update.resolves({});
      await clientWrapperUnderTest.updateCompanyById(input.id, input.company);
      expect(hubspotClientStub.companies.update).to.have.been.calledWith(+input.id, input.company);
    });

    it('deleteCompanyById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        id: '1',
      }
      hubspotClientStub.companies.delete.resolves({});
      await clientWrapperUnderTest.deleteCompanyById(input.id);
      expect(hubspotClientStub.companies.delete).to.have.been.calledWith(+input.id);
    });
  });

  describe('DealAware', () => {
    beforeEach(() => {
      hubspotClientStub = {
        deals: sinon.stub(),
      };
      hubspotClientStub.deals.create = sinon.stub();
      hubspotClientStub.deals.updateById = sinon.stub();
      hubspotClientStub.deals.deleteById = sinon.stub();
      hubspotClientStub.deals.getById = sinon.stub();
      hubspotConstructorStub = sinon.stub();
      hubspotConstructorStub.returns(hubspotClientStub)
    });

    it('getDealById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        id: '1',
      }
      hubspotClientStub.deals.getById.resolves({});
      await clientWrapperUnderTest.getDealById(input.id);
      expect(hubspotClientStub.deals.getById).to.have.been.calledWith(+input.id);
    });

    it('createDeal', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        deal: {
          anyKey: 'anyValue',
        }
      }
      hubspotClientStub.deals.create.resolves({});
      await clientWrapperUnderTest.createDeal(input.deal);
      expect(hubspotClientStub.deals.create).to.have.been.calledWith(input.deal);
    });

    it('updateDealById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        id: '1',
        deal: {
          anyKey: 'anyValue',
        }
      }
      hubspotClientStub.deals.updateById.resolves({});
      await clientWrapperUnderTest.updateDealById(input.id, input.deal);
      expect(hubspotClientStub.deals.updateById).to.have.been.calledWith(+input.id, input.deal);
    });

    it('deleteDealById', async () => {
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      const input = {
        id: '1',
      }
      hubspotClientStub.deals.deleteById.resolves({});
      await clientWrapperUnderTest.deleteDealById(input.id);
      expect(hubspotClientStub.deals.deleteById).to.have.been.calledWith(+input.id);
    });
  });

  describe('WorkflowAware', () => {
    beforeEach(() => {
      hubspotClientStub = {
        workflows: sinon.stub(),
      };
      hubspotClientStub.workflows = {
        enroll: sinon.stub(),
        getAll: sinon.stub(),
        current: sinon.stub(),
      };

      hubspotConstructorStub = sinon.stub();
      hubspotConstructorStub.returns(hubspotClientStub)
    });

    it('enrollContactToWorkflow', async () => {
      const sampleEmail = '123123'
      const sampleWorkflow = { anyKey: 'anyValue' };
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      hubspotClientStub.workflows.enroll.resolves();
      await clientWrapperUnderTest.enrollContactToWorkflow(sampleWorkflow, sampleEmail);
      expect(hubspotClientStub.workflows.enroll).to.have.been.calledWith(sampleWorkflow, sampleEmail);
    });

    it('findWorkflowByName', async () => {
      const sampleName = '123123'
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      hubspotClientStub.workflows.getAll.resolves({
        workflows: [{
          name: sampleName,
        }]
      });
      await clientWrapperUnderTest.findWorkflowByName(sampleName);
      expect(hubspotClientStub.workflows.getAll).to.have.been.calledWith();
    });

    it('currentContactWorkflows', async () => {
      const sampleId = '123123'
      clientWrapperUnderTest = new ClientWrapper(metadata, hubspotConstructorStub);
      hubspotClientStub.workflows.current.resolves({});
      await clientWrapperUnderTest.currentContactWorkflows(sampleId);
      expect(hubspotClientStub.workflows.current).to.have.been.calledWith(sampleId);
    });
  });
});
