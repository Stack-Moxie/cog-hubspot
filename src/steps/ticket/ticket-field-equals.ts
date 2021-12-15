/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import * as moment from 'moment';
import { baseOperators } from '../../client/contants/operators';

export class TicketFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a HubSpot Ticket';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on hubspot ticket (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Ticket's ID",
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
    id: 'ticket',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: 'The Ticket\'s ID',
    }, {
      field: 'hs_pipeline_stage',
      type: FieldDefinition.Type.STRING,
      description: 'The Ticket\'s Pipeline Stage',
    }, {
      field: 'hs_pipeline',
      type: FieldDefinition.Type.STRING,
      description: 'The Ticket\'s Pipeline',
    }, {
      field: 'hubspot_owner_id',
      type: FieldDefinition.Type.STRING,
      description: 'The Ticket\'s Owner ID',
    }, {
      field: 'subject',
      type: FieldDefinition.Type.STRING,
      description: 'The Ticket\'s Subject',
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
      const ticket = await this.client.getTicketById(id, [field]);

      if (!ticket.properties.hasOwnProperty(field)) {
        return this.error('Ticket does not have the property %s', [field]);
      }
      const actual = ticket.properties[field];

      ticket['id'] = id;
      const record = this.createRecord(ticket);
      const result = this.assert(operator, actual, expectation, field);

      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the ticket field: %s', [e.message]);
      }

      return this.error('There was an error checking the ticket field: %s', [e.toString()]);
    }
  }

  public createRecord(ticket): StepRecord {
    const obj = {};
    obj['id'] = ticket.id;
    Object.keys(ticket.properties).forEach(key => obj[key] = ticket.properties[key]);
    const record = this.keyValue('ticket', 'Checked Ticket', obj);
    return record;
  }
}

export { TicketFieldEquals as Step };
