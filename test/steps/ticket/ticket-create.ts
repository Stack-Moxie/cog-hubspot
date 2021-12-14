import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/ticket/ticket-create';

chai.use(sinonChai);

describe('CreateTicketStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.createTicket = sinon.stub();
    clientWrapperStub.getTicketById = sinon.stub();
    clientWrapperStub.toEpoch = sinon.stub();
    clientWrapperStub.toEpoch.returns(new Date().valueOf());
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateTicketStep');
      expect(stepDef.getName()).to.equal('Create a HubSpot ticket');
      expect(stepDef.getExpression()).to.equal('create a hubspot ticket');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('ticket');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call createTicket with expected id and ticket', async () => {
        const expectedTicket = {
          hs_pipeline: 0,
          hs_pipeline_stage: 1,
          hs_ticket_priority: 'anyPriority',
          hubspot_owner_id: 38138115,
          subject: 'anySubject',
        };
        
        protoStep.setData(Struct.fromJavaScript({
          ticket: expectedTicket
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.createTicket).to.have.been.calledWith(expectedTicket);
      });
    });

    describe('Ticket successfully createdd', () => {
      beforeEach(() => {
        const expectedTicket = {
          hs_pipeline: 0,
          hs_pipeline_stage: 1,
          hs_ticket_priority: 'anyPriority',
          hubspot_owner_id: 38138115,
          subject: 'anySubject',
        };
        protoStep.setData(Struct.fromJavaScript({
          ticket:  expectedTicket,
        }));
        clientWrapperStub.createTicket.returns(Promise.resolve({
          id: 123123,
          properties: expectedTicket
        }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Ticket not created', () => {
      beforeEach(() => {
        const expectedTicket = {
          hs_pipeline: 0,
          hs_pipeline_stage: 1,
          hs_ticket_priority: 'anyPriority',
          hubspot_owner_id: 38138115,
          subject: 'anySubject',
        };
        protoStep.setData(Struct.fromJavaScript({
          ticket:  expectedTicket,
        }));
        clientWrapperStub.createTicket.returns(Promise.resolve(undefined));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        const expectedTicket = {
          hs_pipeline: 0,
          hs_pipeline_stage: 1,
          hs_ticket_priority: 'anyPriority',
          hubspot_owner_id: 38138115,
          subject: 'anySubject',
        };
        protoStep.setData(Struct.fromJavaScript({
          ticket:  expectedTicket,
        }));
        clientWrapperStub.createTicket.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
