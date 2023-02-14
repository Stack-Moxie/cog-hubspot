/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateProductStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a HubSpot product';
  protected stepExpression: string = 'create a hubspot product';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create'];
  protected targetObject: string = 'Product';

  protected expectedFields: Field[] = [{
    field: 'product',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'product',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: 'The Product\'s ID',
    }, {
      field: 'name',
      type: FieldDefinition.Type.STRING,
      description: 'The Product\'s Name',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const product: Object[] = [];

    const dateTokenFormat = /\d{4}-\d{2}-\d{2}(?:.?\d{2}:\d{2}:\d{2})?/;
    for (const key in stepData.product) {
      if (dateTokenFormat.test(stepData.product[key])) {
        stepData.product[key] = this.client.toEpoch(new Date(stepData.product[key]));
      }
    }

    try {
      Object.keys(stepData.product).forEach((key) => {
        product.push({
          name: key,
          value: stepData.product[key],
        });
      });

      const data = await this.client.createProduct(product);

      const record = this.createRecord(data);
      const passingRecord = this.createPassingRecord(data, Object.keys(stepData.product));
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);

      return this.pass('Successfully created HubSpot product', [], [record, passingRecord, orderedRecord]);
    } catch (e) {
      return this.error('There was an error creating the product in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public getObjectMap(data): Object {
    const obj = {};
    obj['id'] = data.objectId;
    Object.keys(data.properties).forEach(key => obj[key] = data.properties[key].value);
    return obj;
  }

  public createRecord(product): StepRecord {
    const obj = this.getObjectMap(product);
    const record = this.keyValue('product', 'Created Product', obj);
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
    return this.keyValue('exposeOnPass:product', 'Created Product', filteredData);
  }

  public createOrderedRecord(product, stepOrder = 1): StepRecord {
    const obj = this.getObjectMap(product);
    const record = this.keyValue(`product.${stepOrder}`, `Created Product from Step ${stepOrder}`, obj);
    return record;
  }
}

export { CreateProductStep as Step };
