/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class UpdateContactListStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Update a HubSpot Contact List';
  protected stepExpression: string = 'update a hubspot contact list';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Contact List\'s ID',
  }, {
    field: 'name',
    type: FieldDefinition.Type.STRING,
    description: 'Contact List\'s Name',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contactList',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
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
    const id: string = stepData.id;
    const name: string = stepData.name;

    try {
      const data = await this.client.updateContactListById(id, {
        name
      });
      const record = this.createRecord(data);
      return this.pass('Successfully updated HubSpot contact list %s', [id], [record]);
    } catch (e) {
      return this.error('There was an error updating the contact list in HubSpot: %s', [
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
    const record = this.keyValue('contactList', 'Updated Contact List', obj);
    return record;
  }
}

export { UpdateContactListStep as Step };
