/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../../proto/cog_pb';

export class DeleteContactStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a HubSpot contact';
  protected stepExpression: string = 'delete the (?<email>.+) hubspot contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['delete'];
  protected targetObject: string = 'Contact';

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Contact\'s email address',
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
    const email: string = stepData.email;

    try {
      const data = await this.client.deleteContactByEmail(email);

      if (data.result.deleted) {
        const record = this.createRecord(data.contact);
        return this.pass('Successfully deleted HubSpot contact %s', [email], [record]);
      } else {
        return this.fail('Unable to delete HubSpot contact: %s', [
          data.result.reason,
        ]);
      }
    } catch (e) {
      return this.error('There was an error deleting the HubSpot contact: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(contact): StepRecord {
    const obj = {};
    Object.keys(contact.properties).forEach(key => obj[key] = contact.properties[key].value);
    obj['createdate'] = this.client.toDate(obj['createdate']);
    obj['lastmodifieddate'] = this.client.toDate(obj['lastmodifieddate']);
    const record = this.keyValue('contact', 'Deleted Contact', obj);
    return record;
  }
}

export { DeleteContactStep as Step };
