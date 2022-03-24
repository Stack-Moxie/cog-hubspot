import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/marketing-event/marketing-event-create-or-update';

chai.use(sinonChai);

describe('CreateOrUpdateMarketingEventStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.createOrUpdateMarketingEvent = sinon.stub();
    clientWrapperStub.getMarketingEventById = sinon.stub();
    clientWrapperStub.toEpoch = sinon.stub();
    clientWrapperStub.toEpoch.returns(new Date().valueOf());
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateOrUpdateMarketingEventStep');
      expect(stepDef.getName()).to.equal('Create or update a HubSpot marketing event');
      expect(stepDef.getExpression()).to.equal('create or update a hubspot marketing event');
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

      expect(fields[2].key).to.equal('marketingEvent');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[2].type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call createOrUpdateMarketingEvent with expected email and marketingEvent', async () => {
        const input = {
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          marketingEvent:  { anyKey: 'anyValue',  externalEventId: 'anyId', externalAccountId: 'anyId'},
        }
        protoStep.setData(Struct.fromJavaScript(input));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.createOrUpdateMarketingEvent).to.have.been.calledWith(
          input.marketingEvent, input.externalEventId, input.externalAccountId);
      });
    });

    describe('MarketingEvent successfully created or updated', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          marketingEvent:  { anyKey: 'anyValue' },
        }));
        clientWrapperStub.createOrUpdateMarketingEvent.resolves({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          anyKey: 'anyValue',
        });
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('MarketingEvent not created nor updated', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          marketingEvent:  { anyKey: 'anyValue' },
        }));
        clientWrapperStub.createOrUpdateMarketingEvent.resolves(undefined);
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          externalEventId: 'anyId',
          externalAccountId: 'anyId',
          marketingEvent:  { anyKey: 'anyValue' },
        }));
        clientWrapperStub.createOrUpdateMarketingEvent.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
