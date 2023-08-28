import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact-list/contact-list-add-contacts';

chai.use(sinonChai);

describe('AddContactsToContactListStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getContactListById = sinon.stub();
    clientWrapperStub.addContactsToContactList = sinon.stub();

    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('AddContactsToContactListStep');
      expect(stepDef.getName()).to.equal('Add a list of imported HubSpot contacts to contact list by email');
      expect(stepDef.getExpression()).to.equal('add a list of hubspot contacts to contact list by email');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('importedContacts');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('listId');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[2].key).to.equal('expectation');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[2].type).to.equal(FieldDefinition.Type.NUMERIC);
    });
  });

  describe('ExecuteStep', () => {
    const listId = '123123123';
    const importedContacts = JSON.stringify([{
      email: 'test1@example.com',
    }, {
      email: 'test2@example.com',
    }]);
    const expectation = 0;

    describe('Contacts successfully added to list', () => {
      beforeEach(() => {
        clientWrapperStub.getContactListById.resolves({ listId, name: 'anyName' });
        clientWrapperStub.addContactsToContactList.resolves({ invalidEmails: [] });

        protoStep.setData(Struct.fromJavaScript({
          importedContacts,
          listId,
          expectation,
        }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Imported contacts are not provided', () => {
      beforeEach(() => {
        clientWrapperStub.getContactListById.resolves({ listId, name: 'anyName' });
        clientWrapperStub.addContactsToContactList.resolves({ invalidEmails: [] });

        protoStep.setData(Struct.fromJavaScript({
          listId,
          expectation,
        }));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        clientWrapperStub.getContactListById.throws(new Error());

        protoStep.setData(Struct.fromJavaScript({
          importedContacts,
          listId,
          expectation,
        }));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Invalid emails found', () => {
      beforeEach(() => {
        clientWrapperStub.getContactListById.resolves({ listId, name: 'anyName' });
        clientWrapperStub.addContactsToContactList.resolves({ invalidEmails: ['test2@example.com'] });

        protoStep.setData(Struct.fromJavaScript({
          importedContacts,
          listId,
          expectation,
        }));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });
  });
});
