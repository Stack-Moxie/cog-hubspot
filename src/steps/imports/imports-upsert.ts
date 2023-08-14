/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as assertValid from 'assert';

export class ImportsUpsertStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Start Hubspot Lead Import';
  protected stepExpression: string = 'start hubspot lead import';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create'];
  protected targetObject: string = 'Imports';
  protected expectedFields: Field[] = [
    {
      field: 'columnsToProperties',
      type: FieldDefinition.Type.STRING,
      description: 'A map of spreadsheet column names to Hubspot properties',
    },
    {
      field: 'idColumn',
      type: FieldDefinition.Type.STRING,
      description: 'A name of the column that contains the unique ID for each row',
    },
    {
      field: 'csvArray',
      type: FieldDefinition.Type.STRING,
      description: 'A 2D array of the CSV data to import',
    },
  ];
  protected expectedRecord: ExpectedRecord = {
    id: 'importStatus',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'state',
      type: FieldDefinition.Type.STRING,
      description: 'State of Hubspot Import',
    }, {
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'ID of Hubspot Import',
    }, {
      field: 'createdAt',
      type: FieldDefinition.Type.NUMERIC,
      description: 'Timestamp of Hubspot Import Creation',
    }],
    dynamicFields: false,
  };

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const columnsToProperties = JSON.parse(stepData.columnsToProperties);
    const idColumn = stepData.idColumn;
    const csvArray = JSON.parse(stepData.csvArray);
    const csvArrayLength = csvArray.length;

    try {
      assertValid(columnsToProperties, 'No columnsToProperties provided');
      assertValid(idColumn, 'No idColumn provided');
      assertValid(csvArray, 'No csvArray provided');
      assertValid(Array.isArray(csvArray), 'csvArray must be an array');
      assertValid(csvArrayLength > 0, 'csvArray must not be empty');

      const postImports = await this.client.postImports(columnsToProperties, idColumn, csvArray);
      const records = this.createRecords(csvArrayLength, postImports, stepData['__stepOrder']);

      const result = this.assert('be set', postImports['id'], 'numeric', 'id', stepData['__piiSuppressionLevel']);
      return result.valid ? this.pass(result.message, [], records)
        : this.fail(result.message, [], records);

    } catch (e) {
      return this.error('There was an error creating or updating leads in Hubspot: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecords(csvArrayLength, postImports, stepOrder = 1): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('imports', `Created New Import for ${csvArrayLength} rows`, postImports));
    // Ordered Record
    records.push(this.keyValue(`imports.${stepOrder}`, `Created New Import for ${csvArrayLength} rows from Step ${stepOrder}`, postImports));
    return records;
  }
}

export { ImportsUpsertStep as Step };
