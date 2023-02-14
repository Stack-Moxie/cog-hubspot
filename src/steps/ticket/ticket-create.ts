/*tslint:disable:no-else-after-return*/

import { ITicket } from 'hubspot/lib/typescript/ticket';
import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateTicketStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a HubSpot ticket';
  protected stepExpression: string = 'create a hubspot ticket';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create'];
  protected targetObject: string = 'Ticket';

  protected expectedFields: Field[] = [{
    field: 'ticket',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
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

  dateFields = [
    'closed_date',
    'createdate',
  ];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const ticket: string = stepData.ticket;

    try {
      Object.keys(ticket).forEach((field) => {
        if (this.dateFields.includes(field)) {
          ticket[field] = this.client.toEpoch(new Date(ticket[field]));
        }
      });
      const data = await this.client.createTicket(ticket);
      const record = this.createRecord(data);
      const passingRecord = this.createPassingRecord(data, Object.keys(stepData.ticket));
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);

      return this.pass('Successfully created HubSpot ticket', [], [record, passingRecord, orderedRecord]);
    } catch (e) {
      return this.error('There was an error creating the ticket in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public getObjectMap(data): Object {
    const obj = {};
    obj['id'] = data.id;
    Object.keys(data.properties).forEach(key => obj[key] = data.properties[key]);
    return obj;
  }

  public createRecord(ticket): StepRecord {
    const obj = this.getObjectMap(ticket);
    const record = this.keyValue('ticket', 'Created Ticket', obj);
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
    return this.keyValue('exposeOnPass:ticket', 'Created Ticket', filteredData);
  }

  public createOrderedRecord(ticket, stepOrder = 1): StepRecord {
    const obj = this.getObjectMap(ticket);
    const record = this.keyValue(`ticket.${stepOrder}`, `Created Ticket from Step ${stepOrder}`, obj);
    return record;
  }

}

export { CreateTicketStep as Step };
