// tslint:disable:max-line-length
import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/marketing-event/marketing-event-delete';

chai.use(sinonChai);

describe('MarketingEventDeleteStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getMarketingEventById = sinon.stub();
    clientWrapperStub.deleteMarketingEventById = sinon.stub();
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('DeleteMarketingEventStep');
      expect(stepDef.getName()).to.equal('Delete a HubSpot marketing event');
      expect(stepDef.getExpression()).to.equal('delete the (?<externalEventId>.+) hubspot marketing event');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
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
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call deleteMarketingEventById with expected externalEventId', async () => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
        }

        clientWrapperStub.getMarketingEventById.resolves({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          anyKey: 'anyValue',
        });

        protoStep.setData(Struct.fromJavaScript(input));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.deleteMarketingEventById).to.have.been.calledWith(input.externalEventId, input.externalAccountId);
      });
    });

    describe('MarketingEvent successfully deleted', () => {
      beforeEach(() => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
        } 

        protoStep.setData(Struct.fromJavaScript(input));

        clientWrapperStub.getMarketingEventById.resolves({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          anyKey: 'anyValue',
        });

        clientWrapperStub.deleteMarketingEventById.resolves({});
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('MarketingEvent does not exist', () => {
      beforeEach(() => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
        } 

        protoStep.setData(Struct.fromJavaScript(input));

        clientWrapperStub.getMarketingEventById.resolves(undefined);
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
        }

        clientWrapperStub.getMarketingEventById.resolves({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          anyKey: 'anyValue',
        });

        protoStep.setData(Struct.fromJavaScript(input));
        clientWrapperStub.deleteMarketingEventById.throws(new Error());
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
