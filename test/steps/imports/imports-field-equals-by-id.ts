import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import { expect } from 'chai';
import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { default as sinon } from 'ts-sinon';
import { ImportFieldEqualsById as Step } from '../../../src/steps/imports/imports-field-equals-by-id';

describe('ImportFieldEqualsById', () => {
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getImportDetails = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('ImportFieldEqualsById');
      expect(stepDef.getName()).to.equal('Check a field on a HubSpot imports by ID');
      expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_-]+) field on hubspot imports with id (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => field.toObject());

      expect(fields[0].key).to.equal('id');
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      // Other fields assertions here...
    });
  });

  describe('ExecuteStep', () => {
    describe('Field successfully validated', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          id: '37329449',
          field: 'state',
          operator: 'be',
          expectation: 'DONE',
        }));
        clientWrapperStub.getImportDetails.resolves({ state: 'DONE' });
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
          field: 'state',
          operator: 'be',
          expectation: 'DONE',
        }));
        clientWrapperStub.getImportDetails.resolves({ state: 'NOT DONE' });
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
          field: 'state',
          operator: 'be',
        }));
        clientWrapperStub.getImportDetails.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
