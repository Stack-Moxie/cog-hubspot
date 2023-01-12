import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact-list/contact-list-add-contact';

chai.use(sinonChai);

describe('AddContactToContactListStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getContactById = sinon.stub();
    clientWrapperStub.getContactListById = sinon.stub();
    clientWrapperStub.addContactToContactList = sinon.stub();
    clientWrapperStub.toEpoch = sinon.stub();
    clientWrapperStub.toEpoch.returns(new Date().valueOf());
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());

    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('AddContactToContactListStep');
      expect(stepDef.getName()).to.equal('Add a HubSpot contact to contact list');
      expect(stepDef.getExpression()).to.equal('add a hubspot contact to contact list');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
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
    describe('ContactList successfully created', () => {
      beforeEach(() => {
        clientWrapperStub.getContactById.resolves({
          vid: '123123123',
          properties: {
            anyKey: {
              value: 'anyValue',
            },
            email: {
              value: 'anyEmail'
            }
          },
        });
        clientWrapperStub.getContactListById.resolves({
          listId: '12312312',
          name: 'anyName',
        });

        clientWrapperStub.addContactToContactList.resolves({});
        
        protoStep.setData(Struct.fromJavaScript({
          contactId: '123123123', 
          listId: '123123123',
        }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          contactList: {
            anyKey: 'anyValue'
          }
        }));
        clientWrapperStub.getContactById.throws(new Error());
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
