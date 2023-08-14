/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/contants/operators';
import * as assertValid from 'assert';

export class ImportErrors extends BaseStep implements StepInterface {

  protected stepName: string = 'Check errors for a HubSpot import';
  protected stepExpression: string = 'number of errors for hubspot imports with id (?<id>.+) should (be) ?(?<expectation>.+)?';
  // tslint:disable-next-line:max-line-length
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Imports';
  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Imports Id',
  },
  {
    field: 'expectation',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Expected field value',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  },
  {
    field: 'csvArray',
    type: FieldDefinition.Type.STRING,
    description: 'A 2D array of the CSV data',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'imports',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'errorType',
      type: FieldDefinition.Type.STRING,
      description: 'Imports Error Type',
    }, {
      field: 'sourceData',
      type: FieldDefinition.Type.ANYNONSCALAR,
      description: 'Imports Error Source Data including lineNumber',
    }, {
      field: 'createdAt',
      type: FieldDefinition.Type.NUMERIC,
      description: 'Imports Error Created Datetime',
    }, {
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: 'The Imports Error unique identifier',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const id = stepData.id;
    const csvArray = JSON.parse(stepData.csvArray);
    const csvArrayLength = csvArray.length;
    const expectation = stepData.expectation | 0;
    try {
      assertValid(id, 'Imports ID is required');
      assertValid(typeof Number(id) === 'number', 'Imports ID must be a number');
      assertValid(Array.isArray(csvArray), 'csvArray must be an array');
      assertValid(csvArrayLength > 0, 'csvArray must not be empty');

      const errorsById = await this.client.getImportErrors(id);
      const numErrors = errorsById.results.length;

      const result = this.assert('be', numErrors.toString(), expectation.toString(), 'errors', stepData['__piiSuppressionLevel']);
      const records = this.createRecords(errorsById.results, stepData['__stepOrder']);

      return result.valid ? this.pass(result.message, [], records)
        : this.fail(result.message, [], records);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the imports field: %s', [e.message]);
      }

      return this.error('There was an error checking the imports field: %s', [e.toString()]);
    }
  }

  public createRecords(errorsById, stepOrder = 1): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('imports', 'Checked Errors', errorsById));
    // Ordered Record
    records.push(this.keyValue(`imports.${stepOrder}`, `Checked Errors from Step ${stepOrder}`, errorsById));
    return records;
  }
}

export { ImportErrors as Step };
