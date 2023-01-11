/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class DiscoverContact extends BaseStep implements StepInterface {

  protected stepName: string = 'Discover fields on a HubSpot contact';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'discover fields on hubspot contact (?<email>.+\@.+\..+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['discover'];
  protected targetObject: string = 'Contact';
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
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
    const email = stepData.email;

    try {
      const contact = await this.client.getContactByEmail(email);
      const record = this.createRecord(contact);
      return this.pass('Successfully discovered fields on contact', [], [record]);
    } catch (e) {
      if (e.toString().indexOf('404 - {"status":"error","message":"contact does not exist"') !== -1) {
        return this.fail('No contact found with email %s', [email]);
      }
      return this.error('There was an error checking the contact: %s', [e.toString()]);
    }
  }

  public createRecord(contact): StepRecord {
    const obj = {};
    Object.keys(contact.properties).forEach(key => obj[key] = contact.properties[key].value);
    obj['createdate'] = this.client.toDate(obj['createdate']);
    obj['lastmodifieddate'] = this.client.toDate(obj['lastmodifieddate']);
    const record = this.keyValue('discoverContact', 'Discovered Contact', obj);
    return record;
  }
}

export { DiscoverContact as Step };
