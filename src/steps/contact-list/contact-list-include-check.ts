/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class ContactListIncludeStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check if Hubspot contact is included in Hubspot contact list';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the contact with id (?<contactId>.+) should be included in contact list with id (?<listId>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Contact List';
  protected expectedFields: Field[] = [{
    field: 'contactId',
    type: FieldDefinition.Type.STRING,
    description: "Contact's Id",
  }, {
    field: 'listId',
    type: FieldDefinition.Type.STRING,
    description: "Contact List's Id",
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
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const contactId = stepData.contactId;
    const listId = stepData.listId;

    let contactFound = false;
    let hasMore = true;
    let vidOffset = null;

    try {
      while (!contactFound && hasMore) {
        const response = await this.client.getContactsInContactListById(listId, vidOffset);
        contactFound = response.contacts.map(c => c.vid).some(c => +c === +contactId);
        hasMore = response['has-more'];
        vidOffset = response['vid-offset'];
      }

      if (contactFound) {
        return this.pass('Contact %s was included in contact list %s', [contactId, listId]);
      } else {
        return this.fail('Contact %s was not included in contact list %s', [contactId, listId]);
      }
    } catch (e) {
      return this.error('There was an error checking the contact field: %s', [e.toString()]);
    }
  }
}

export { ContactListIncludeStep as Step };
