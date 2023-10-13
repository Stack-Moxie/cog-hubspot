/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import * as moment from 'moment';
import { baseOperators } from '../../client/contants/operators';

export class ContactFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a HubSpot contact';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on hubspot (contact (?<email>.+\@.+\..+)|list import contacts) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Contact';
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
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

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'hs_object_id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'The Contact\'s ID',
    }, {
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'The Contact\'s Email',
    }, {
      field: 'createdate',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Contact\'s Create Date',
    }, {
      field: 'lastmodifieddate',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Contact\'s Last Modified Date',
    }],
    dynamicFields: true,
  }, {
    id: 'passedContacts',
    type: RecordDefinition.Type.TABLE,
    fields: [{
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'Email of Hubspot Contact',
    }, {
      field: 'message',
      type: FieldDefinition.Type.STRING,
      description: 'Message for explanation of pass',
    }],
  }, {
    id: 'failedContacts',
    type: RecordDefinition.Type.TABLE,
    fields: [{
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'Email of Hubspot Contact',
    }, {
      field: 'message',
      type: FieldDefinition.Type.STRING,
      description: 'Message for explanation of fail',
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectation = stepData.expectation;
    const email = stepData.email;
    const field = stepData.field;
    const operator = stepData.operator || 'be';

    try {
      // support for checking errors when {{ hubspot.passedContacts.3.x.email }} token is used
      if (stepData.importedEmails) {
        stepData.multiple_contacts = JSON.parse(stepData.importedEmails);
      }
      if (stepData.multiple_contacts && Array.isArray(stepData.multiple_contacts) && stepData.multiple_contacts.length > 0) {
        const contacts = await this.client.bulkGetContactsByEmail(stepData.multiple_contacts);

        const passedContacts = [];
        const failedContacts = [];

        contacts.forEach((contact) => {
          const value = contact.properties[field] ? contact.properties[field].value : null;
          const expectations = JSON.parse(expectation);
          let pass = false;
          expectations.forEach((expectItem) => {
            const result = this.assert(operator, value, expectItem[field], field, stepData['__piiSuppressionLevel']);
            console.log('result ', result);
            pass = pass || result.valid;
          });

          if (pass) {
            passedContacts.push({ email: contact.properties['email'], message: `Passed: ${field} ${operator} ${expectation}` });
          } else {
            failedContacts.push({ email: contact.properties['email'], message: `Failed: ${field} ${operator} ${expectation}` });
          }
        });
        const records = [];
        // Build tables for passed and failed contacts
        records.push(this.createTable('passedContacts', 'Passed Contacts', passedContacts));
        records.push(this.createTable('failedContacts', 'Failed Contacts', failedContacts));

        // Return appropriate response based on the results
        if (failedContacts.length === 0) {
          return this.pass('Successfully validated %d contacts', [passedContacts.length], records);
        } else {
          return this.fail('Failed to validate %d out of %d contacts', [failedContacts.length, stepData.multiple_contacts.length], records);
        }
      } else {
        const contact = await this.client.getContactByEmail(email);

        // Since empty fields are not being returned by the API, default to undefined
        // so that checks that are expected to fail will behave as expected
        const value = contact.properties[field]
          ? contact.properties[field].value : null;

        const actual = this.client.isDate(value) ? this.client.toDate(value) : value;

        const records = this.createRecords(contact, stepData['__stepOrder']);
        const result = this.assert(operator, actual, expectation, field, stepData['__piiSuppressionLevel']);

        return result.valid ? this.pass(result.message, [], records)
          : this.fail(result.message, [], records);
      }

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the contact field: %s', [e.message]);
      }

      return this.error('There was an error checking the contact field: %s', [e.toString()]);
    }
  }

  public createRecords(contact, stepOrder = 1): StepRecord[] {
    const obj = {};
    Object.keys(contact.properties).forEach(key => obj[key] = contact.properties[key].value);
    obj['createdate'] = this.client.toDate(obj['createdate']);
    obj['lastmodifieddate'] = this.client.toDate(obj['lastmodifieddate']);

    const records = [];
    // Base Record
    records.push(this.keyValue('contact', 'Checked Contact', obj));
    // Ordered Record
    records.push(this.keyValue(`contact.${stepOrder}`, `Checked Contact from Step ${stepOrder}`, obj));
    return records;
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

export { ContactFieldEquals as Step };
