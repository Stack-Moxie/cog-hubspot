import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step } from '../../../src/steps/stats/check-api-usage';

chai.use(sinonChai);

describe('CheckHubspotApiUsageStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let clientWrapperStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientWrapperStub = sinon.stub();
    clientWrapperStub.getApiUsage = sinon.stub();
    stepUnderTest = new Step(clientWrapperStub);
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CheckHubspotApiUsageStep');
    expect(stepDef.getName()).to.equal('Check daily HubSpot API usage');
    expect(stepDef.getExpression()).to.equal('there should be less than 90% usage of your daily HubSpot API limit');
    expect(stepDef.getType()).to.equal(StepDefinition.Type.VALIDATION);
  });

  it('should respond with success if the api calls are less than 90% of the daily limit', async () => {
    clientWrapperStub.getApiUsage.returns(Promise.resolve({
      limit: 250000,
      remaining: 200000,
    }));
    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with success if the api calls are unlimited', async () => {
    clientWrapperStub.getApiUsage.returns(Promise.resolve({
      limit: 'unlimited',
      remaining: 'unlimited',
    }));
    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
  });

  it('should respond with a failure if the api calls are more than 90% of the daily limit', async () => {
    clientWrapperStub.getApiUsage.returns(Promise.resolve({
      limit: 250000,
      remaining: 1000,
    }));
    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with an error if no usage is found', async () => {
    clientWrapperStub.getApiUsage.returns(Promise.resolve({
      success: true,
    }));
    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

  it('should respond with an error if the marketo client throws an error', async () => {
    // Cause the client to throw an error, and execute the step.
    clientWrapperStub.getApiUsage.throws('any error');
    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });
});
