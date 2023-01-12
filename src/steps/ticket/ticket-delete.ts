/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../../proto/cog_pb';

export class DeleteTicketStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a HubSpot ticket';
  protected stepExpression: string = 'delete the hubspot ticket with id (?<id>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['delete'];
  protected targetObject: string = 'Ticket';

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Ticket\'s ID',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'ticket',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;

    try {
      await this.client.deleteTicketById(id);
      return this.pass('Successfully deleted HubSpot ticket %s', [id]);
    } catch (e) {
      return this.error('There was an error deleting the HubSpot ticket: %s', [
        e.toString(),
      ]);
    }
  }
}

export { DeleteTicketStep as Step };
