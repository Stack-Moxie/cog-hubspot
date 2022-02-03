// tslint:disable:max-line-length
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/contact/contact-delete-by-id';

chai.use(sinonChai);

describe('DeleteContactByIdStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.deleteContactById = sinon.stub();
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('DeleteContactByIdStep');
      expect(stepDef.getName()).to.equal('Delete a HubSpot contact by Id');
      expect(stepDef.getExpression()).to.equal('delete the hubspot contact with id (?<id>.+)');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('id');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call deleteContactById with expected id', async () => {
        const expectedId: string = '123123123';
        protoStep.setData(Struct.fromJavaScript({
          id: expectedId,
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.deleteContactById).to.have.been.calledWith(expectedId);
      });
    });

    describe('Contact successfully deleted', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          id: '123123123',
        }));
        clientWrapperStub.deleteContactById.returns(Promise.resolve({
          result: {
            deleted: true,
            reason: 'OK',
          },
          contact: {
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          },
        }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Contact not deleted', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          id: '123123123',
        }));
        clientWrapperStub.deleteContactById.returns(Promise.resolve({
          result: {
            deleted: false,
            reason: 'OK',
          },
          contact: {
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          },
        }));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          id: '123123123',
        }));
        clientWrapperStub.deleteContactById.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
