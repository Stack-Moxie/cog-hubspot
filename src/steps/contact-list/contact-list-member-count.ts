/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/contants/operators';

export class ContactListMemberCountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check the number of a Hubspot Contact List Members';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the number of members from hubspot contact list (?<listId>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'listId',
    type: FieldDefinition.Type.STRING,
    description: "Contact List's Id",
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectation',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Expected field value',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contactList',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'listId',
      type: FieldDefinition.Type.STRING,
      description: "Contact List's ID",
    }, {
      field: 'listMemberCount',
      type: FieldDefinition.Type.STRING,
      description: "Contact List's Member Count",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const listId = stepData.listId;
    const operator = stepData.operator || 'be';
    const expectation = stepData.expectation;

    let contacts = [];
    let hasMore = true;
    let vidOffset = null;

    try {
      while (hasMore) {
        const response = await this.client.getContactsInContactListById(listId, vidOffset);
        console.log(response);
        contacts = contacts.concat(response.contacts);
        hasMore = response['has-more'];
        vidOffset = response['vid-offset'];
      }

      const record = this.createRecord(listId, contacts.length);
      const result = this.assert(operator, contacts.length.toString(), expectation, 'member count');

      result.message = result.message.replace(' field', '');
      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

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

  createRecord(id: string, count: number) {
    const record = {
      listId: id,
      listMemberCount: count,
    };
    return this.keyValue('contactList', 'Checked Contact List Member Count', record);
  }
}

export { ContactListMemberCountStep as Step };
