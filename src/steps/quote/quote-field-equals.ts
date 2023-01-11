/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import * as moment from 'moment';
import { baseOperators } from '../../client/contants/operators';

export class QuoteFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a HubSpot quote';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on hubspot quote (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Quote';
  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Quote's ID",
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
    id: 'quote',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: 'The Quote\'s ID',
    }, {
      field: 'hs_createdate',
      type: FieldDefinition.Type.STRING,
      description: 'The Quote\'s Create Date',
    }, {
      field: 'hs_expiration_date',
      type: FieldDefinition.Type.STRING,
      description: 'The Quote\'s Expiration Date',
    }, {
      field: 'hubspot_owner_id',
      type: FieldDefinition.Type.STRING,
      description: 'The Quote\'s Owner ID',
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
      const quote = await this.client.getQuoteById(id);

      if (!quote.properties.hasOwnProperty(field)) {
        return this.error('Quote does not have the property %s', [field]);
      }
      const actual = this.client.isDate(quote.properties[field]) ?
          this.client.toDate(quote.properties[field]) : quote.properties[field];

      quote['id'] = id;
      const records = this.createRecords(quote, stepData['__stepOrder']);
      const result = this.assert(operator, actual, expectation, field, stepData['__piiSuppressionLevel']);

      return result.valid ? this.pass(result.message, [], records)
        : this.fail(result.message, [], records);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the quote field: %s', [e.message]);
      }

      return this.error('There was an error checking the quote field: %s', [e.toString()]);
    }
  }

  public createRecords(quote, stepOrder = 1): StepRecord[] {
    const obj = {};
    obj['id'] = quote.id;
    Object.keys(quote.properties).forEach(key => obj[key] = quote.properties[key]);

    const records = [];
    // Base Record
    records.push(this.keyValue('quote', 'Checked Quote', obj));
    // Ordered Record
    records.push(this.keyValue(`quote.${stepOrder}`, `Checked Quote from Step ${stepOrder}`, obj));
    return records;
  }
}

export { QuoteFieldEquals as Step };
