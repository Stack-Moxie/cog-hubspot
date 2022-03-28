/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import * as moment from 'moment';
import { baseOperators } from '../../client/contants/operators';

export class MarketingEventFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a HubSpot Marketing Event';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on hubspot marketing external event id (?<externalEventId>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
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
    id: 'marketingEvent',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'externalEventId',
      type: FieldDefinition.Type.STRING,
      description: "Marketing Event's External Event ID",
    }, {
      field: 'externalAccountId',
      type: FieldDefinition.Type.STRING,
      description: "Marketing Event's External Account ID",
      optionality: FieldDefinition.Optionality.OPTIONAL,
    }, {
      field: 'createdate',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Marketing Event\'s Create Date',
    }, {
      field: 'lastmodifieddate',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Marketing Event\'s Last Modified Date',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectation = stepData.expectation;
    const externalEventId = stepData.externalEventId;
    const externalAccountId = stepData.externalAccountId;
    const field = stepData.field;
    const operator = stepData.operator || 'be';

    try {
      const marketingEvent = await this.client.getMarketingEventById(externalEventId, externalAccountId);

      if (!marketingEvent) {
        return this.fail('Marketing Event with external event ID %s does not exist', [
          externalEventId,
        ]);
      }

      if (!marketingEvent.hasOwnProperty(field)) {
        return this.error('Marketing Event does not have the property %s', [field]);
      }

      // Since empty fields are not being returned by the API, default to undefined
      // so that checks that are expected to fail will behave as expected
      const value = marketingEvent[field];

      let actual = value;

      // Hubspot only returns UTC ISO
      const dateTokenFormat = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)((-(\d{2}):(\d{2})|Z)?)$/;
      if (dateTokenFormat.test(actual)) {
        actual = actual.split('Z')[0];
      }
      const record = this.createRecord(marketingEvent);
      const result = this.assert(operator, actual, expectation, field);

      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the marketing event field: %s', [e.message]);
      }

      return this.error('There was an error checking the marketing event field: %s', [e.toString()]);
    }
  }

  public createRecord(marketingEvent): StepRecord {
    const obj = {};
    Object.keys(marketingEvent).forEach(key => obj[key] = marketingEvent[key]);
    const record = this.keyValue('marketingEvent', 'Checked Marketing Event', obj);
    return record;
  }
}

export { MarketingEventFieldEquals as Step };
