/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class UpdateDealStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Update a HubSpot deal';
  protected stepExpression: string = 'update a hubspot deal';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Deal\'s ID',
  }, {
    field: 'deal',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'deal',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: 'The Deal\'s ID',
    }, {
      field: 'name',
      type: FieldDefinition.Type.STRING,
      description: 'The Deal\'s Name',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;
    const deal: Object = {
      properties: [],
    };
    const dateTokenFormat = /\d{4}-\d{2}-\d{2}(?:.?\d{2}:\d{2}:\d{2})?/;
    for (const key in stepData.deal) {
      if (dateTokenFormat.test(stepData.deal[key])) {
        stepData.deal[key] = this.client.toEpoch(new Date(stepData.deal[key]));
      }
    }

    try {
      Object.keys(stepData.deal).forEach((key) => {
        deal['properties'].push({
          name: key,
          value: stepData.deal[key],
        });
      });
      const data = await this.client.updateDeal(id, deal);
      const record = this.createRecord(data);

      return this.pass('Successfully updated HubSpot deal %s', [id], [record]);
    } catch (e) {
      return this.error('There was an error updating the deal in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(deal): StepRecord {
    const obj = {};
    obj['id'] = deal.dealId;
    Object.keys(deal.properties).forEach(key => obj[key] = deal.properties[key].value);
    const record = this.keyValue('deal', 'Updated Deal', obj);
    return record;
  }
}

export { UpdateDealStep as Step };
