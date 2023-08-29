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
    description: 'Expected minimal error threshhold',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  },
  {
    field: 'contacts',
    type: FieldDefinition.Type.STRING,
    description: 'A finalized list of contacts',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'passedContacts',
    type: RecordDefinition.Type.TABLE,
    fields: [{
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'Email of Hubspot Contact',
    }],
  }, {
    id: 'failedContacts',
    type: RecordDefinition.Type.TABLE,
    fields: [{
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'Email of Hubspot Contact',
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const id = stepData.id;
    const contacts = JSON.parse(stepData.contacts);
    const expectation = stepData.expectation | 0;
    try {
      assertValid(id, 'Imports ID is required');
      assertValid(typeof Number(id) === 'number', 'Imports ID must be a number');
      assertValid(contacts, 'Finalized Contact List is required');

      const errorsById = await this.client.getImportErrors(id);
      const numErrors = errorsById.results.length;
      const result = this.assert('be', numErrors.toString(), expectation.toString(), 'errors', stepData['__piiSuppressionLevel']);

      const passedContacts = [];
      const failedContacts = [];
      const finalizedContacts = Object.values(contacts);

      const errorRecordSet = new Set();
      errorsById.results.forEach((errorRecord) => {
        if (!errorRecord.sourceData || !errorRecord.sourceData.lineNumber) {
          errorRecordSet.add(-1);
          return;
        }
        errorRecordSet.add(errorRecord.sourceData.lineNumber);
      });

      let lineNumber = 1;
      finalizedContacts.forEach((contact) => {
        if (errorRecordSet.has(lineNumber)) {
          failedContacts.push(contact);
        } else {
          passedContacts.push(contact);
        }
        lineNumber += 1;
      });

      const records = [];
      records.push(this.createTable('passedContacts', 'Contacts Created or Updated', passedContacts));
      records.push(this.createTable('failedContacts', 'Contacts Failed', failedContacts));

      return result.valid ? this.pass('Successfully imported %d contacts', [passedContacts.length], records)
        : this.fail('Failed to create or update %d contacts', [failedContacts.length], records);

    } catch (e) {
      return this.error('There was an error checking the import errors: %s', [e.toString()]);
    }
  }

  private createTable(id, name, contacts) {
    const headers = {};
    const headerKeys = Object.keys(contacts[0] || {});
    headerKeys.forEach((key: string) => {
      headers[key] = key;
    });
    return this.table(id, name, headers, contacts);
  }
}

export { ImportErrors as Step };
