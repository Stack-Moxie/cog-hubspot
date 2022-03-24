/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../../proto/cog_pb';

export class DeleteMarketingEventStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a HubSpot marketing event';
  protected stepExpression: string = 'delete the (?<externalEventId>.+) hubspot marketing event';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'externalEventId',
    type: FieldDefinition.Type.STRING,
    description: `Marketing Event's External Event ID`,
  }, {
    field: 'externalAccountId',
    type: FieldDefinition.Type.STRING,
    description: `Marketing Event's External Account ID`,
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'marketingEvent',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'externalEventId',
      type: FieldDefinition.Type.STRING,
      description: `Marketing Event's External Event ID`,
    }, {
      field: 'createdAt',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Contact\'s Create Date',
    }, {
      field: 'updatedAt',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Contact\'s Last Modified Date',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const externalEventId: string = stepData.externalEventId;
    const externalAccountId: string = stepData.externalAccountId;

    try {
      const existingEvent = await this.client.getMarketingEventById(externalEventId, externalAccountId);

      const record = this.createRecord(existingEvent);
      if (!existingEvent) {
        return this.fail('Marketing Event with external event ID %s does not exist', [
          externalEventId,
        ]);
      }

      await this.client.deleteMarketingEventById(externalEventId, externalAccountId);
      return this.pass('Successfully deleted HubSpot with external event id %s', [externalEventId], [record]);
    } catch (e) {
      return this.error('There was an error deleting the HubSpot marketing event: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(marketingEvent): StepRecord {
    const obj = {};
    Object.keys(marketingEvent).forEach(key => obj[key] = marketingEvent[key]);
    obj['createdAt'] = this.client.toDate(obj['createdAt']);
    obj['updatedAt'] = this.client.toDate(obj['updatedAt']);
    const record = this.keyValue('marketingEvent', 'Deleted Marketing Event', obj);
    return record;
  }
}

export { DeleteMarketingEventStep as Step };
