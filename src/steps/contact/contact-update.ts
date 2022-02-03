/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class UpdateContactStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Update a HubSpot contact';
  protected stepExpression: string = 'update a hubspot contact with id (?<id>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Contact Id',
  }, {
    field: 'contact',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'hs_object_id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'The contact\'s ID',
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
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;
    const contact: Object = {
      properties: [],
    };
    const dateTokenFormat = /\d{4}-\d{2}-\d{2}(?:.?\d{2}:\d{2}:\d{2})?/;
    for (const key in stepData.contact) {
      if (dateTokenFormat.test(stepData.contact[key])) {
        stepData.contact[key] = this.client.toEpoch(new Date(stepData.contact[key]));
      }
    }

    try {
      Object.keys(stepData.contact).forEach((key) => {
        contact['properties'].push({
          property: key,
          value: stepData.contact[key],
        });
      });

      await this.client.updateContactById(id, contact);
      const createdContact = await this.client.getContactById(id);
      const record = this.createRecord(createdContact);

      return this.pass('Successfully updated HubSpot contact %s', [id], [record]);
    } catch (e) {
      return this.error('There was an error updating the contact in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(contact): StepRecord {
    const obj = {};
    Object.keys(contact.properties).forEach(key => obj[key] = contact.properties[key].value);
    obj['createdate'] = this.client.toDate(obj['createdate']);
    obj['lastmodifieddate'] = this.client.toDate(obj['lastmodifieddate']);
    const record = this.keyValue('contact', 'Created Contact', obj);
    return record;
  }
}

export { UpdateContactStep as Step };
