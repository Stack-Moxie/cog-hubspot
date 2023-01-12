/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class UpdateTicketStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Update a HubSpot ticket';
  protected stepExpression: string = 'update a hubspot ticket';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['update'];
  protected targetObject: string = 'Ticket';

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Ticket\'s ID',
  }, {
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
    const id: string = stepData.id;
    const ticket: string = stepData.ticket;

    try {
      Object.keys(ticket).forEach((field) => {
        if (this.dateFields.includes(field)) {
          ticket[field] = this.client.toEpoch(new Date(ticket[field]));
        }
      });
      const data = await this.client.updateTicket(id, ticket);
      const record = this.createRecord(data);
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);

      return this.pass('Successfully updated HubSpot ticket %s', [id], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was an error updating the ticket in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(ticket): StepRecord {
    const obj = {};
    obj['id'] = ticket.id;
    Object.keys(ticket.properties).forEach(key => obj[key] = ticket.properties[key]);
    const record = this.keyValue('ticket', 'Updated Ticket', obj);
    return record;
  }

  public createOrderedRecord(ticket, stepOrder = 1): StepRecord {
    const obj = {};
    obj['id'] = ticket.id;
    Object.keys(ticket.properties).forEach(key => obj[key] = ticket.properties[key]);
    const record = this.keyValue(`ticket.${stepOrder}`, `Updated Ticket from Step ${stepOrder}`, obj);
    return record;
  }
}

export { UpdateTicketStep as Step };
