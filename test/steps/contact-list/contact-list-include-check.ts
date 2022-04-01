// tslint:disable:max-line-length
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact-list/contact-list-include-check';

chai.use(sinonChai);

describe('ContactListIncludeStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getContactsInContactListById = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('ContactListIncludeStep');
      expect(stepDef.getName()).to.equal('Check if Hubspot Contact is included in Hubspot Contact List');
      expect(stepDef.getExpression()).to.equal('the contact with id (?<contactId>.+) should be included in contact list with id (?<listId>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('contactId');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('listId');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call getContactsInContactListById with listId', async () => {
        const expectedlistId: string = '321';
        protoStep.setData(Struct.fromJavaScript({
          contactId: '123',
          listId: expectedlistId,
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.getContactsInContactListById).to.have.been.calledWith(expectedlistId);
      });
    });

    describe('Contact successfully found in list', () => {
      beforeEach(() => {
        const expectedContactId = '123';
        const expectedlistId = '321';
        protoStep.setData(Struct.fromJavaScript({
          contactId: expectedContactId,
          listId: expectedlistId,
        }));
        clientWrapperStub.getContactsInContactListById.returns(Promise.resolve({
          contacts: [{
            vid: expectedContactId,
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          }],
        }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Contact not found in list', () => {
      beforeEach(() => {
        const expectedContactId = '123';
        const expectedlistId = '321';
        protoStep.setData(Struct.fromJavaScript({
          contactId: expectedContactId,
          listId: expectedlistId,
        }));
        clientWrapperStub.getContactsInContactListById.returns(Promise.resolve({
          contacts: [{
            vid: '123123',
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          }],
        }));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        const expectedContactId = '123';
        const expectedlistId = '321';
        protoStep.setData(Struct.fromJavaScript({
          contactId: expectedContactId,
          listId: expectedlistId,
        }));
        clientWrapperStub.getContactsInContactListById.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
