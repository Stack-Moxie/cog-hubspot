/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateContactListStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a HubSpot Contact List';
  protected stepExpression: string = 'create a hubspot contact list';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'name',
    type: FieldDefinition.Type.STRING,
    description: 'Contact List\'s Name',
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
    const name: string = stepData.name;

    try {
      const data = await this.client.createContactList({
        name
      });

      const record = this.createRecord(data);
      return this.pass('Successfully created HubSpot contact list', [], [record]);
    } catch (e) {
      return this.error('There was an error creating the contact list in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(contactList): StepRecord {
    const obj = {};
    obj['id'] = contactList.listId;
    Object.keys(contactList).forEach(key => obj[key] = contactList[key]);
    obj['createdAt'] = this.client.toDate(obj['createdAt']);
    obj['updatedAt'] = this.client.toDate(obj['updatedAt']);
    const record = this.keyValue('contactList', 'Created Contact List', obj);

    return record;
  }

}

export { CreateContactListStep as Step };
