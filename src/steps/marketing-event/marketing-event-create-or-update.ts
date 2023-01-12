/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as moment from 'moment';

export class CreateOrUpdateMarketingEventStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create or update a HubSpot marketing event';
  protected stepExpression: string = 'create or update a hubspot marketing event';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create', 'update'];
  protected targetObject: string = 'Marketing Event';

  protected expectedFields: Field[] = [{
    field: 'externalEventId',
    type: FieldDefinition.Type.STRING,
    description: "Marketing Event's External Event ID",
  }, {
    field: 'externalAccountId',
    type: FieldDefinition.Type.STRING,
    description: "Marketing Event's External Account ID",
    optionality: FieldDefinition.Optionality.OPTIONAL,
  }, {
    field: 'marketingEvent',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'marketingEvent',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'externalEventId',
      type: FieldDefinition.Type.STRING,
      description: "Marketing Event's External Event ID",
    }, {
      field: 'createdate',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Marketing Event\'s Create Date',
    }, {
      field: 'lastmodifieddate',
      type: FieldDefinition.Type.DATETIME,
      description: 'The MarketingEvent\'s Last Modified Date',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const externalEventId: string = stepData.externalEventId;
    const externalAccountId: string = stepData.externalAccountId;
    const marketingEvent: Object = stepData.marketingEvent;

    try {
      // Hubspot marketing event still requires this in the body despite it being
      // in the query and path params
      marketingEvent['externalEventId'] = externalEventId;
      marketingEvent['externalAccountId'] = externalAccountId;

      // Hubspot only accepts UTC
      const dateTokenFormat = /\d{4}-\d{2}-\d{2}(?:.?\d{2}:\d{2}:\d{2})?/;
      for (const key in stepData.marketingEvent) {
        if (dateTokenFormat.test(stepData.marketingEvent[key])) {
          stepData.marketingEvent[key] = `${stepData.marketingEvent[key]}Z`;
        }
      }

      const data = await this.client.createOrUpdateMarketingEvent(marketingEvent, externalEventId, externalAccountId);
      if (data) {
        const record = this.createRecord(data);
        const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);
        return this.pass('Successfully created or updated HubSpot marketing event %s', [externalEventId], [record, orderedRecord]);
      } else {
        return this.fail('Unable to create or update HubSpot marketing event');
      }
    } catch (e) {
      return this.error('There was an error creating or updating the marketing event in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(marketingEvent): StepRecord {
    const obj = {};
    Object.keys(marketingEvent).forEach(key => obj[key] = marketingEvent[key]);
    const record = this.keyValue('marketingEvent', 'Created or Updated Marketing Event', obj);
    return record;
  }

  public createOrderedRecord(marketingEvent, stepOrder = 1): StepRecord {
    const obj = {};
    Object.keys(marketingEvent).forEach(key => obj[key] = marketingEvent[key]);
    const record = this.keyValue(`marketingEvent.${stepOrder}`, `Created or Updated Marketing Event from Step ${stepOrder}`, obj);
    return record;
  }
}

export { CreateOrUpdateMarketingEventStep as Step };
