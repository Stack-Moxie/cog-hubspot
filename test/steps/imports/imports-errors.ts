import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { ImportErrors as StepUnderTest } from '../../../src/steps/imports/imports-errors';
import { default as sinon } from 'ts-sinon';
import { expect } from 'chai';

describe('ImportErrors', () => {
  let protoStep: ProtoStep;
  let stepUnderTest: StepUnderTest;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getImportErrors = sinon.stub();
    stepUnderTest = new StepUnderTest(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();

      expect(stepDef.getStepId()).to.equal('ImportErrors');
      expect(stepDef.getName()).to.equal('Check errors for a HubSpot import');
      expect(stepDef.getExpression()).to.equal('number of errors for hubspot imports with id (?<id>.+) should (be) ?(?<expectation>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);

      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => field.toObject());

      expect(fields[0].key).to.equal('id');
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('expectation');
      expect(fields[1].type).to.equal(FieldDefinition.Type.NUMERIC);

      expect(fields[2].key).to.equal('contacts');
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);
    });
  });

  describe('ExecuteStep', () => {
    describe('Field successfully validated', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          id: '123',
          expectation: '0',
          contacts: '[]',
        }));
        clientWrapperStub.getImportErrors.resolves({ results: [] });
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Field validation failed', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          id: '123',
          expectation: '0',
          contacts: '[]',
        }));
        clientWrapperStub.getImportErrors.resolves({ results: [{ error: 'Error' }] });
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          id: '123',
          expectation: '0',
          contacts: '[]',
        }));
        clientWrapperStub.getImportErrors.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
