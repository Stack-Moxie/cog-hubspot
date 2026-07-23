import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/custom-event/custom-event-field-equals';

chai.use(sinonChai);

describe('CustomEventFieldEquals', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getContactByEmail = sinon.stub();
    clientWrapperStub.getEventOccurrences = sinon.stub();
    clientWrapperStub.occurredAfterFromMinutes = sinon.stub().returns('2026-07-22T00:00:00.000Z');
    clientWrapperStub.isDate = sinon.stub().returns(false);
    stepUnderTest = new Step(clientWrapperStub);
    // Provide assert via prototype used by BaseStep
    (stepUnderTest as any).assert = (operator, actual, expectation) => {
      if (operator === 'be') {
        return { valid: String(actual) === String(expectation), message: '' };
      }
      return { valid: false, message: 'fail' };
    };
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CustomEventFieldEquals');
      expect(stepDef.getName()).to.equal('Check a HubSpot custom event on a contact');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
      expect(stepDef.getTargetObject()).to.equal('Custom Event');
    });

    it('should return expected fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => field.toObject());
      expect(fields[0].key).to.equal('email');
      expect(fields[1].key).to.equal('eventType');
      expect(fields.find(f => f.key === 'properties')).to.exist;
    });
  });

  describe('ExecuteStep', () => {
    beforeEach(() => {
      clientWrapperStub.getContactByEmail.resolves({
        vid: 12345,
        properties: { email: { value: 'a@b.com' }, hs_object_id: { value: '12345' } },
      });
    });

    it('passes when occurrence exists', async () => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'a@b.com',
        eventType: 'pe1_response_event',
        includes: 'be',
        minutes: 60,
      }));
      clientWrapperStub.getEventOccurrences.resolves([{
        eventType: 'pe1_response_event',
        occurredAt: '2026-07-22T12:00:00.000Z',
        properties: {
          response_type: 'Member Created',
          asset_id: 'A1',
          tactic_id: 'T1',
          source_system: 'SFDC',
        },
      }]);

      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getMessageFormat(), response.getMessageFormat()).to.not.match(/error checking/i);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      expect(clientWrapperStub.getEventOccurrences).to.have.been.called;
    });

    it('fails when occurrence missing', async () => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'a@b.com',
        eventType: 'pe1_response_event',
        includes: 'be',
      }));
      clientWrapperStub.getEventOccurrences.resolves([]);

      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    });

    it('passes negative check when no occurrence', async () => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'a@b.com',
        eventType: 'pe1_response_event',
        includes: 'not be',
      }));
      clientWrapperStub.getEventOccurrences.resolves([]);

      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    });

    it('fails when property mismatch', async () => {
      protoStep.setData(Struct.fromJavaScript({
        email: 'a@b.com',
        eventType: 'pe1_response_event',
        includes: 'be',
        properties: { tactic_id: 'EXPECTED' },
        operator: 'be',
      }));
      clientWrapperStub.getEventOccurrences.resolves([{
        occurredAt: '2026-07-22T12:00:00.000Z',
        properties: { tactic_id: 'OTHER' },
      }]);

      const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
      expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
    });
  });
});
