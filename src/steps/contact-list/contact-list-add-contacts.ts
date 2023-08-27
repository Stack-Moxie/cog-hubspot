/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as assertValid from 'assert';

export class AddContactsToContactListStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Add a list of imported HubSpot contacts to contact list by email';
  protected stepExpression: string = 'add a list of hubspot contacts to contact list by email';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['add'];
  protected targetObject: string = 'Contacts to Contact List';

  protected expectedFields: Field[] = [{
    field: 'importedContacts',
    type: FieldDefinition.Type.STRING,
    description: 'List of Successfully Imported Contacts',
  }, {
    field: 'listId',
    type: FieldDefinition.Type.STRING,
    description: "Contact List's Id",
  }, {
    field: 'expectation',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Expected minimal error threshhold',
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contactList',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'The Contact Record Which Was Added To The Contact List',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const listId: string = stepData.listId;
    const importedContacts: any[] = stepData.importedContacts ? JSON.parse(stepData.importedContacts) : [];
    console.log('importedContacts: ', importedContacts);
    const expectation = stepData.expectation | 0;
    try {
      assertValid(listId, 'List ID is required');
      assertValid(importedContacts, 'Imported Contact List is Required');
      assertValid(importedContacts.length > 0, 'Imported Contact List must not be empty');

      const contactList = await this.client.getContactListById(listId);

      // HubSpot API only allows 500 contacts to be added to a list at a time
      const chunkSize = 500;
      const invalidEmails = [];
      for (let i = 0; i < importedContacts.length; i += chunkSize) {
        const chunk = importedContacts.slice(i, i + chunkSize);
        const emails = chunk.map(contact => contact['email']);
        console.log('Adding contacts to contact list: %s', emails);
        const response = await this.client.addContactsToContactList(contactList['listId'], emails);
        invalidEmails.push(...response['invalidEmails']);
      }

      const result = this.assert('be', invalidEmails.length.toString(), expectation.toString(), 'invalidEmails', stepData['__piiSuppressionLevel']);
      const contactsAddedToContactList = importedContacts.filter(item => !invalidEmails.includes(item.email));

      const records = this.createRecords(invalidEmails.length, contactsAddedToContactList, contactList['name'], stepData['__stepOrder']);

      return result.valid ? this.pass(result.message, [], records)
        : this.fail(result.message, [], records);
    } catch (e) {
      return this.error('There was an error adding contacts to contact list in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecords(invalidEmails, contactsAddedToContactList, contactListName, stepOrder = 4): StepRecord[] {
    const records = [];
    // Base Record
    records.push(this.keyValue('contactList', `Added ${contactsAddedToContactList.length} Hubspot contacts to ${contactListName} with ${invalidEmails} invalid emails`, contactsAddedToContactList));
    // Ordered Record
    records.push(this.keyValue(`contactList.${stepOrder}`, `Added ${contactsAddedToContactList.length} Hubspot contacts to ${contactListName} with ${invalidEmails} invalid emails from Step ${stepOrder}`, contactsAddedToContactList));
    return records;
  }
}

export { AddContactsToContactListStep as Step };
