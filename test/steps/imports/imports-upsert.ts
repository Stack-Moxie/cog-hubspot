import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../../src/proto/cog_pb';
import { Step as ImportsUpsertStep } from '../../../src/steps/imports/imports-upsert';

chai.use(sinonChai);

describe('ImportsUpsertStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: ImportsUpsertStep;
  let clientStub: any;

  beforeEach(() => {
    protoStep = new ProtoStep();
    clientStub = sinon.stub();
    clientStub.postImports = sinon.stub();
    stepUnderTest = new ImportsUpsertStep(clientStub);
  });

  describe('Metadata', () => {
    it('should return expected step metadata', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      expect(stepDef.getStepId()).to.equal('Start Hubspot Lead Import');
      expect(stepDef.getName()).to.equal('Start hubspot lead import');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].field).to.equal('columnsToProperties');
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);
      expect(fields[1].field).to.equal('idColumn');
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);
      expect(fields[2].field).to.equal('csvArray');
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);
    });
  });

  describe('ExecuteStep', () => {
    describe('Import successfully started', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          columnsToProperties: JSON.stringify({ column1: 'prop1' }),
          idColumn: 'id',
          csvArray: JSON.stringify([['value1', 'value2']]),
        }));
        clientStub.postImports.resolves({
          id: 12345,
        });
      });

      it('should call postImports with expected parameters', async () => {
        const columnsToProperties = { column1: 'prop1' };
        const idColumn = 'id';
        const csvArray = [['value1', 'value2']];
        const csvString = csvArray.map(row => row.join(',')).join('\n');

        await stepUnderTest.executeStep(protoStep);
        expect(clientStub.postImports).to.have.been.calledWith(csvString, columnsToProperties, idColumn);
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          columnsToProperties: JSON.stringify({ column1: 'prop1' }),
          idColumn: 'id',
          csvArray: JSON.stringify([['value1', 'value2']]),
        }));
        clientStub.postImports.returns(Promise.reject('Error'));
      });

      it('should respond with error', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
      });
    });
  });
});
