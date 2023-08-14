/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/contants/operators';
import * as assertValid from 'assert';

export class ImportFieldEqualsById extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a HubSpot imports by ID';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on hubspot imports with id (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Imports';
  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Imports Id',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  },
  {
    field: 'expectation',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }];

  protected expectedRecord: ExpectedRecord = {
    id: 'imports',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'state',
      type: FieldDefinition.Type.STRING,
      description: 'Imports State',
    }, {
      field: 'importRequestJson',
      type: FieldDefinition.Type.ANYNONSCALAR,
      description: 'Imports File Metadata',
    }, {
      field: 'importName',
      type: FieldDefinition.Type.STRING,
      description: 'Imports Name',
    }, {
      field: 'updatedAt',
      type: FieldDefinition.Type.NUMERIC,
      description: 'Imports Updated Datetime',
    }, {
      field: 'optOutImport',
      type: FieldDefinition.Type.BOOLEAN,
      description: 'Imports Opt Out Status',
    }, {
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: 'The Imports unique identifier',
    }],
    dynamicFields: true,
  };

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectation = stepData.expectation;
    const id = stepData.id;
    const field = stepData.field;
    const operator = stepData.operator || 'be';

    try {
      assertValid(id, 'Imports ID is required');
      assertValid(typeof Number(id) === 'number', 'Imports ID must be a number');
      assertValid(field, 'Field is required');
      assertValid(operator, 'Operator is required');
      assertValid(expectation !== undefined, 'Expectation is required');

      const importsById = await this.client.getImportDetails(id);
      const actual = importsById[field];

      const result = this.assert(operator, actual, expectation, field, stepData['__piiSuppressionLevel']);
      const records = this.createRecords(importsById, stepData['__stepOrder']);

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

  public createRecords(importsById, stepOrder = 1): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('imports', 'Checked Imports', importsById));
    // Ordered Record
    records.push(this.keyValue(`imports.${stepOrder}`, `Checked Imports from Step ${stepOrder}`, importsById));
    return records;
  }
}

export { ImportFieldEqualsById as Step };
