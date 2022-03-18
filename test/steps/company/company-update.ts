import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/company/company-update';

chai.use(sinonChai);

describe('UpdateCompanyStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.updateCompanyById = sinon.stub();
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
      expect(stepDef.getStepId()).to.equal('UpdateCompanyStep');
      expect(stepDef.getName()).to.equal('Update a HubSpot company');
      expect(stepDef.getExpression()).to.equal('update a hubspot company');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('id');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);

      expect(fields[1].key).to.equal('company');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.MAP);
    });
  });

  describe('ExecuteStep', () => {
    describe('Expected Parameters', () => {
      it('should call updateCompanyById with expected id and company', async () => {
        const expectedId: string = '123123';
        const expectedCompany = {
          properties: [{
            name: 'anyKey',          
            value: 'anyValue'
          }]
        };
        protoStep.setData(Struct.fromJavaScript({
          id: expectedId,
          company: {
            anyKey: 'anyValue'
          },
        }));

        await stepUnderTest.executeStep(protoStep);
        expect(clientWrapperStub.updateCompanyById).to.have.been.calledWith(expectedId, expectedCompany);
      });
    });

    describe('Company successfully updated', () => {
      beforeEach(() => {
        const expectedId: string = '123123';
        const expectedCompany = {
          properties: [{
            name: 'anyKey',          
            value: 'anyValue'
          }]
        };
        protoStep.setData(Struct.fromJavaScript({
          id: expectedId,
          company: {
            anyKey: 'anyValue',
          },
        }));
        clientWrapperStub.updateCompanyById.returns(Promise.resolve({
          companyId: expectedId,
          properties: {
            anyKey: {
              value: 'anyValue'
            }
          }
        }));
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Company not updated', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          company:  {
            id: '123123',
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          },
        }));
        clientWrapperStub.updateCompanyById.returns(Promise.resolve(undefined));
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          // tslint:disable-next-line:max-line-length
          company:  {
            id: '123123',
            properties: {
              createdate: { value: new Date().valueOf() },
              lastmodifieddate: { value: new Date().valueOf() },
            },
          },
        }));
        clientWrapperStub.updateCompanyById.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
