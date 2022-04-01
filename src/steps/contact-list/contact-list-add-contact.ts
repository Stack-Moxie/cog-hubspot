/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class AddContactToContactListStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Add a HubSpot Contact to Contact List';
  protected stepExpression: string = 'add a hubspot contact to contact list';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

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
    id: 'contactList',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'listId',
      type: FieldDefinition.Type.STRING,
      description: 'The Contact List\'s ID',
    }, {
      field: 'name',
      type: FieldDefinition.Type.STRING,
      description: 'The Contact List\'s Name',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const contactId: string = stepData.contactId;
    const listId: string = stepData.listId;

    try {

      const contact = await this.client.getContactById(contactId); 

      const contactList = await this.client.getContactListById(listId);

      await this.client.createContactList(contactList['listId'], contact['vid'], contact.properties['email'].value);

      return this.pass('Successfully added HubSpot contact %s to %s', [contact.properties['email'].value, contactList['name']]);
    } catch (e) {
      console.log(e);
      return this.error('There was an error adding contact to contact list in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }
}

export { AddContactToContactListStep as Step };
