/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import * as moment from 'moment';
import { baseOperators } from '../../client/contants/operators';

export class ProductFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a HubSpot Product';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on hubspot product (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Product's ID",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  },
  {
    field: 'expectation',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
    optionality: FieldDefinition.Optionality.OPTIONAL,
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
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectation = stepData.expectation;
    const id = stepData.id;
    const field = stepData.field;
    const operator = stepData.operator || 'be';

    try {
      const product = await this.client.getProductById(id, [field]);

      if (!product.properties.hasOwnProperty(field)) {
        return this.error('Product does not have the property %s', [field]);
      }
      const actual = this.client.isDate(product.properties[field].value) ?
          this.client.toDate(product.properties[field].value) : product.properties[field].value;

      product['id'] = id;
      const record = this.createRecord(product);
      const result = this.assert(operator, actual, expectation, field);

      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the product field: %s', [e.message]);
      }

      return this.error('There was an error checking the product field: %s', [e.toString()]);
    }
  }

  public createRecord(product): StepRecord {
    const obj = {};
    obj['id'] = product.objectId;
    Object.keys(product.properties).forEach(key => obj[key] = product.properties[key].value);
    const record = this.keyValue('product', 'Checked Product', obj);
    return record;
  }
}

export { ProductFieldEquals as Step };
