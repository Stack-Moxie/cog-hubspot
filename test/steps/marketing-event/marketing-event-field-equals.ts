import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/marketing-event/marketing-event-field-equals';

chai.use(sinonChai);

describe('MarketingEventFieldEquals', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getMarketingEventById = sinon.stub();
    clientWrapperStub.isDate = sinon.stub();
    clientWrapperStub.isDate.returns(false);
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('MarketingEventFieldEquals');
      expect(stepDef.getName()).to.equal('Check a field on a HubSpot Marketing Event');
      expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_-]+) field on hubspot marketing external event id (?<id>.+\@.+\..+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('externalEventId');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('externalAccountId');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[2].key).to.equal('field');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[3].key).to.equal('operator');
      expect(fields[3].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[3].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[4].key).to.equal('expectation');
      expect(fields[4].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[4].type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call getMarketingEventById with expected externalEventId', async () => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          expectation: 'doe',
          field: 'lastname',
        }
        protoStep.setData(Struct.fromJavaScript(input));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.getMarketingEventById).to.have.been.calledWith(input.externalEventId, input.externalAccountId);
      });
    });

    describe('Expected field not found', () => {
      beforeEach(() => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          expectation: 'anyValue',
          field: 'anyKey',
        }
        protoStep.setData(Struct.fromJavaScript(input));
        clientWrapperStub.getMarketingEventById.resolves({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
        });
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('MarketingEvent expected field value equals expectation', () => {
      beforeEach(() => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          expectation: 'anyValue',
          field: 'anyKey',
        }
        protoStep.setData(Struct.fromJavaScript(input));
        clientWrapperStub.getMarketingEventById.resolves({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          anyKey: 'anyValue'
        });
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });

      describe('Util errors', () => {
        it('should respond with error when invalid operator was provided', async () => {
          const input = {
            externalEventId: 'anyId',
            externalAccountId: 'anyId',
            expectation: 'anyValue',
            operator: 'unknown operator',
            field: 'anyKey',
          }
          protoStep.setData(Struct.fromJavaScript(input));
          clientWrapperStub.getMarketingEventById.resolves({
            externalEventId: 'anyId',
            externalAccountId: 'anyId',
            anyKey: 'anyValue'
          });

          const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });

        it('should respond with error when actual and expected values are compared with different types', async () => {
          const input = {
            externalEventId: 'anyId',
            externalAccountId: 'anyId',
            expectation: 'nonNumeric',
            field: 'anyKey',
            operator: 'be greater than',
          }
          protoStep.setData(Struct.fromJavaScript(input));
          clientWrapperStub.getMarketingEventById.resolves({
            externalEventId: 'anyId',
            externalAccountId: 'anyId',
            anyKey: 'anyValue'
          });

          const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });
      });
    });

    describe('MarketingEvent expected field value not equal expectation', () => {
      beforeEach(() => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          expectation: 'not anyValue',
          field: 'anyKey',
          operator: 'be',
        }
        protoStep.setData(Struct.fromJavaScript(input));
        clientWrapperStub.getMarketingEventById.resolves({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          anyKey: 'anyValue'
        });
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          expectation: 'not anyValue',
          field: 'anyKey',
          operator: 'be',
        }
        protoStep.setData(Struct.fromJavaScript(input));
        clientWrapperStub.getMarketingEventById.throws('error');
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
