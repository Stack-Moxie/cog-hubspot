import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/workflow/workflow-enroll';

chai.use(sinonChai);

describe('EnrollContactToWorkflowStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.findWorkflowByName = sinon.stub();
    clientWrapperStub.enrollContactToWorkflow = sinon.stub();
    clientWrapperStub.getContactByEmail = sinon.stub();
    clientWrapperStub.getContactByEmail.returns(Promise.resolve({
      properties: {
        createdate: { value: new Date().valueOf() },
        lastmodifieddate: { value: new Date().valueOf() },
      },
    }));
    clientWrapperStub.toDate = sinon.stub();
    clientWrapperStub.toDate.returns(new Date().toISOString());
    stepUnderTest = new Step(clientWrapperStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('EnrollContactToWorkflowStep');
      expect(stepDef.getName()).to.equal('Enroll a HubSpot contact into a workflow');
      expect(stepDef.getExpression()).to.equal('enroll the (?<email>.+) hubspot contact into workflow (?<workflow>.+)');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[1].key).to.equal('email');
      expect(fields[1].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[1].type).to.equal(FieldDefinition.Type.EMAIL);

      expect(fields[0].key).to.equal('workflow');
      expect(fields[0].optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
      expect(fields[0].type).to.equal(FieldDefinition.Type.ANYSCALAR);
    });
  });

  describe('ExecuteStep', () => {
    describe('Multiple workflow matched by name', () => {
      const workflowName = 'Email Workflow';

      beforeEach(() => {
        clientWrapperStub.findWorkflowByName.returns(Promise.resolve([
          {
            id: 1,
            name: workflowName,
          }, {
            id: 2,
            name: workflowName,
          },
        ]));

        protoStep.setData(Struct.fromJavaScript({
          workflow: workflowName,
          email: 'test@automatoninc.com',
        }));
      });

      it('should respond with error', async () => {
        const result = await stepUnderTest.executeStep(protoStep);
        expect(result.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });

    describe('Contact successfully enrolled', () => {
      const workflow = 'Email Workflow';
      beforeEach(() => {
        clientWrapperStub.findWorkflowByName.returns(Promise.resolve([
          {
            id: 1,
            name: workflow,
            type: 'Default',
            description: 'Default',
          },
        ]));
        clientWrapperStub.enrollContactToWorkflow.returns(Promise.resolve());

        protoStep.setData(Struct.fromJavaScript({
          workflow,
          email: 'test@automatoninc.com',
        }));
      });

      it('should respond with pass', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Error occurred', () => {
      const workflow = 12345;
      beforeEach(() => {
        clientWrapperStub.enrollContactToWorkflow.returns(Promise.reject(new Error()));

        protoStep.setData(Struct.fromJavaScript({
          workflow,
          email: 'test@automatoninc.com',
        }));
      });

      it('should respond with error', async () => {
        const response = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
