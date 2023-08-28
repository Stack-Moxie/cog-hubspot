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
      expect(stepDef.getStepId()).to.equal('ImportsUpsertStep');
      expect(stepDef.getName()).to.equal('Start Hubspot Lead Import');
      expect(stepDef.getType()).to.equal(StepDefinition.Type.ACTION);
    });

    it('should return expected step fields', () => {
      const stepDef: StepDefinition = stepUnderTest.getDefinition();
      const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
        return field.toObject();
      });

      expect(fields[0].key).to.equal('columnMap');
      expect(fields[0].type).to.equal(FieldDefinition.Type.STRING);
      expect(fields[1].key).to.equal('contacts');
      expect(fields[1].type).to.equal(FieldDefinition.Type.STRING);
      expect(fields[2].key).to.equal('idColumn');
      expect(fields[2].type).to.equal(FieldDefinition.Type.STRING);
      expect(fields[3].key).to.equal('csvArray');
      expect(fields[3].type).to.equal(FieldDefinition.Type.STRING);
    });
  });

  describe('ExecuteStep', () => {
    describe('Import successfully started', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          columnMap: JSON.stringify({ column1: 'prop1' }),
          contacts: JSON.stringify({ contact1: 'contact1' }),
          idColumn: 'id',
          csvArray: JSON.stringify([['value1', 'value2']]),
        }));
        clientStub.postImports.resolves({
          id: 12345,
        });
      });

      it('should call postImports with expected parameters', async () => {
        const columnMap = { column1: 'prop1' };
        const contacts = { contact1: 'contact1' };
        const idColumn = 'id';

        await stepUnderTest.executeStep(protoStep);
        expect(clientStub.postImports).to.have.been.calledWith(columnMap, contacts, idColumn);
      });

      it('should respond with pass', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
      });
    });

    describe('Import response missing id', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          columnMap: JSON.stringify({ column1: 'prop1' }),
          contacts: JSON.stringify({ contact1: 'contact1' }),
          idColumn: 'id',
          csvArray: JSON.stringify([['value1', 'value2']]),
        }));
        clientStub.postImports.resolves({});
      });

      it('should respond with fail', async () => {
        const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
        expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
      });
    });

    describe('Error occurred', () => {
      beforeEach(() => {
        protoStep.setData(Struct.fromJavaScript({
          columnMap: JSON.stringify({ column1: 'prop1' }),
          contacts: JSON.stringify({ contact1: 'contact1' }),
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
