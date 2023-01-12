import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/deal/deal-field-equals';

chai.use(sinonChai);

describe('DealFieldEquals', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getDealById = sinon.stub();
    clientWrapperStub.isDate = sinon.stub();
    clientWrapperStub.isDate.returns(false);
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('DealFieldEquals');
      expect(stepDef.getName()).to.equal('Check a field on a HubSpot deal');
      expect(stepDef.getExpression()).to.equal('the (?<field>[a-zA-Z0-9_-]+) field on hubspot deal (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('id');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('field');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[2].key).to.equal('operator');
      expect(fields[2].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[3].key).to.equal('expectation');
      expect(fields[3].optionality).to.equal(FieldDefinition.Optionality.OPTIONAL);
      expect(fields[3].type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call getDealById with expected id', async () => {
        const expectedId: string = '123123';
        protoStep.setData(Struct.fromJavaScript({
          id: expectedId,
          expectation: 'doe',
          field: 'lastname',
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.getDealById).to.have.been.calledWith(expectedId);
      });
    });

    describe('Expected field not found', () => {
      beforeEach(() => {
        const expectedId: string = '123123';
        protoStep.setData(Struct.fromJavaScript({
          id: expectedId,
          expectation: 'doe',
          field: 'nonexistentfield',
        }));
        clientWrapperStub.getDealById.resolves({
          dealId: 3123123,
          properties: {
            subject: {
              value: 'anySubject'
            },
          },
        });
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Deal expected field value equals expectation', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          id: '123123',
          expectation: 'anySubject',
          field: 'subject',
          operator: 'be',
        }));
        clientWrapperStub.getDealById.resolves({
          dealId: 3123123,
          properties: {
            subject: {
              value: 'anySubject'
            },
          },
        });
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });

      describe('Util errors', () => {
        it('should respond with error when invalid operator was provided', async () => {
          protoStep.setData(Struct.fromJavaScript({
            id: '123123',
            expectation: 'doe',
            field: 'age',
            operator: 'unknown operator',
          }));

          const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });

        it('should respond with error when actual and expected values are compared with different types', async () => {
          protoStep.setData(Struct.fromJavaScript({
            id: '123123',
            expectation: 'nonNumeric',
            field: 'age',
            operator: 'be greater than',
          }));

          const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
          expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
        });
      });
    });

    describe('Deal expected field value not equal expectation', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          dealId: '123123',
          expectation: 'wrong expectation',
          field: 'subject',
          operator: 'be',
        }));
        clientWrapperStub.getDealById.resolves({
          dealId: 3123123,
          properties: {
            subject: {
              value: 'anySubject'
            },
          },
        });
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          dealId: '123123',
        }));
        clientWrapperStub.getDealById.throws('error');
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
