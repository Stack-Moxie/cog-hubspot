import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/deal/deal-create';

chai.use(sinonChai);

describe('CreateDealStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.createDeal = sinon.stub();
    clientWrapperStub.getDealById = sinon.stub();
    clientWrapperStub.toEpoch = sinon.stub();
    clientWrapperStub.toEpoch.returns(new Date().valueOf());
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateDealStep');
      expect(stepDef.getName()).to.equal('Create a HubSpot deal');
      expect(stepDef.getExpression()).to.equal('create a hubspot deal');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('deal');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call createDeal with expected dealId and deal', async () => {
        const expectedDeal = {
          properties: [{
            name: 'anyKey',
            value: 'anyValue'
          }],
        };
        
        protoStep.setData(Struct.fromJavaScript({
          deal: {
            anyKey: 'anyValue'
          }
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.createDeal).to.have.been.calledWith(expectedDeal);
      });
    });

    describe('Deal successfully created', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          deal: {
            anyKey: 'anyValue'
          }
        }));
        clientWrapperStub.createDeal.resolves({
          dealId: 123123,
          properties: {
            anyKey: {
              value: 'anyValue'
            }
          }
        });
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Deal not created', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          deal: {
            anyKey: 'anyValue'
          }
        }));
        clientWrapperStub.createDeal.returns(Promise.resolve(undefined));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          deal: {
            anyKey: 'anyValue'
          }
        }));
        clientWrapperStub.createDeal.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
