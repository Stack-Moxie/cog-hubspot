// tslint:disable:max-line-length
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact-list/contact-list-member-count';

chai.use(sinonChai);

describe('ContactListMemberCountStep', () => {
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
      expect(stepDef.getStepId()).to.equal('ContactListMemberCountStep');
      expect(stepDef.getName()).to.equal('Check the number of a Hubspot Contact List Members');
      expect(stepDef.getExpression()).to.equal('the number of members from hubspot contact list (?<listId>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('listId');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('operator');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[2].key).to.equal('expectation');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[2].type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call getContactsInContactListById with listId', async () => {
        const expectedlistId: string = '321';
        protoStep.setData(Struct.fromJavaScript({
          listId: expectedlistId,
          operator: 'be',
          expectation: '2',
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.getContactsInContactListById).to.have.been.calledWith(expectedlistId, null);
      });
    });

    describe('Contact list Member Count is same as expected', () => {
      beforeEach(() => {
        const expectedlistId: string = '321';
        protoStep.setData(Struct.fromJavaScript({
          listId: expectedlistId,
          operator: 'be',
          expectation: '2',
        }));
        clientWrapperStub.getContactsInContactListById.returns(Promise.resolve({
          contacts: [{
            vid: '123',
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          }, {
            vid: '123',
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

    describe('Contact list Member Count is not same as expected', () => {
      beforeEach(() => {
        const expectedlistId: string = '321';
        protoStep.setData(Struct.fromJavaScript({
          listId: expectedlistId,
          operator: 'be',
          expectation: '3',
        }));
        clientWrapperStub.getContactsInContactListById.returns(Promise.resolve({
          contacts: [{
            vid: '123',
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          }, {
            vid: '123',
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
        const expectedlistId: string = '321';
        protoStep.setData(Struct.fromJavaScript({
          listId: expectedlistId,
          operator: 'be',
          expectation: '3',
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
