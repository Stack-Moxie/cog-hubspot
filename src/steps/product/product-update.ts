/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class UpdateProductStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Update a HubSpot product';
  protected stepExpression: string = 'update a hubspot product';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['update'];
  protected targetObject: string = 'Product';

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Product\'s ID',
  }, {
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
    const id: string = stepData.id;
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

      const data = await this.client.updateProductById(id, product);
      const record = this.createRecord(data);
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);

      return this.pass('Successfully updated HubSpot product %s', [id], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was an error updating the product in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(product): StepRecord {
    const obj = {};
    obj['id'] = product.objectId;
    Object.keys(product.properties).forEach(key => obj[key] = product.properties[key].value);
    const record = this.keyValue('product', 'Updated Product', obj);
    return record;
  }

  public createOrderedRecord(product, stepOrder = 1): StepRecord {
    const obj = {};
    obj['id'] = product.objectId;
    Object.keys(product.properties).forEach(key => obj[key] = product.properties[key].value);
    const record = this.keyValue(`product.${stepOrder}`, `Updated Product from Step ${stepOrder}`, obj);
    return record;
  }
}

export { UpdateProductStep as Step };
