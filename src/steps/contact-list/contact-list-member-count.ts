/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/contants/operators';

export class ContactListMemberCountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Count a HubSpot list';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'check the number of members from hubspot contact list (?<listId>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Contact List Count';
  protected expectedFields: Field[] = [{
    field: 'listId',
    type: FieldDefinition.Type.STRING,
    description: "Contact List's Id",
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

    let contacts = [];
    let hasMore = true;
    let vidOffset = null;

    try {
      while (hasMore) {
        const response = await this.client.getContactsInContactListById(listId, vidOffset);
        contacts = contacts.concat(response.contacts);
        hasMore = response['has-more'];
        vidOffset = response['vid-offset'];
      }

      const record = this.createRecord(listId, contacts.length);
      const orderedRecord = this.createOrderedRecord(listId, contacts.length, stepData['__stepOrder']);
      return this.pass('Contact List %s has %s members', [listId, contacts.length.toString()], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was an error checking the contact member count: %s', [e.toString()]);
    }
  }

  createRecord(id: string, count: number) {
    const record = {
      listId: id,
      listMemberCount: count,
    };
    return this.keyValue('contactList', 'Checked Contact List Member Count', record);
  }

  createOrderedRecord(id: string, count: number, stepOrder = 1) {
    const record = {
      listId: id,
      listMemberCount: count,
    };
    return this.keyValue(`contactList.${stepOrder}`, `Checked Contact List Member Count from Step ${stepOrder}`, record);
  }
}

export { ContactListMemberCountStep as Step };
