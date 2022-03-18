import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/company/company-create';

chai.use(sinonChai);

describe('CreateCompanyStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.createCompany = sinon.stub();
    clientWrapperStub.getCompanyById = sinon.stub();
    clientWrapperStub.toEpoch = sinon.stub();
    clientWrapperStub.toEpoch.returns(new Date().valueOf());
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('CreateCompanyStep');
      expect(stepDef.getName()).to.equal('Create a HubSpot company');
      expect(stepDef.getExpression()).to.equal('create a hubspot company');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('company');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call createCompany with expected companyId and company', async () => {
        const expectedCompany = {
          anyKey: {
            value: 'anyValue'
          },
        };
        
        protoStep.setData(Struct.fromJavaScript({
          company: expectedCompany
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.createCompany).to.have.been.calledWith(expectedCompany);
      });
    });

    describe('Company successfully created', () => {
      beforeEach(() => {
        const expectedCompany = {
          anyKey: {
            value: 'anyValue'
          },
        };
        protoStep.setData(Struct.fromJavaScript({
          company:  expectedCompany,
        }));
        clientWrapperStub.createCompany.resolves({
          companyId: 123123,
          properties: expectedCompany
        });
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Company not created', () => {
      beforeEach(() => {
        const expectedCompany = {
          anyKey: {
            value: 'anyValue'
          },
        };
        protoStep.setData(Struct.fromJavaScript({
          company:  expectedCompany,
        }));
        clientWrapperStub.createCompany.returns(Promise.resolve(undefined));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        const expectedCompany = {
          anyKey: {
            value: 'anyValue'
          },
        };
        protoStep.setData(Struct.fromJavaScript({
          company:  expectedCompany,
        }));
        clientWrapperStub.createCompany.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
