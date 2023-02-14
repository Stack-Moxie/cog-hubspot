/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateDealStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a HubSpot deal';
  protected stepExpression: string = 'create a hubspot deal';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create'];
  protected targetObject: string = 'Deal';

  protected expectedFields: Field[] = [{
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
      const data = await this.client.createDeal(deal);
      const record = this.createRecord(data);
      const passingRecord = this.createPassingRecord(data, Object.keys(stepData.deal));
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);

      return this.pass('Successfully created HubSpot deal', [], [record, passingRecord, orderedRecord]);
    } catch (e) {
      return this.error('There was an error creating the deal in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public getObjectMap(data): Object {
    const obj = {};
    obj['id'] = data.dealId;
    Object.keys(data.properties).forEach(key => obj[key] = data.properties[key].value);
    return obj;
  }

  public createRecord(deal): StepRecord {
    const obj = this.getObjectMap(deal);
    const record = this.keyValue('deal', 'Created Deal', obj);
    return record;
  }

  public createPassingRecord(data, fields): StepRecord {
    const obj = this.getObjectMap(data);

    const filteredData = {};
    if (obj) {
      Object.keys(obj).forEach((key) => {
        if (fields.includes(key)) {
          filteredData[key] = obj[key];
        }
      });
    }
    return this.keyValue('exposeOnPass:deal', 'Created or Updated Deal', filteredData);
  }

  public createOrderedRecord(deal, stepOrder = 1): StepRecord {
    const obj = this.getObjectMap(deal);
    const record = this.keyValue(`deal.${stepOrder}`, `Created Deal from Step ${stepOrder}`, obj);
    return record;
  }
}

export { CreateDealStep as Step };
