/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../../proto/cog_pb';

export class DeleteDealStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a HubSpot deal';
  protected stepExpression: string = 'delete the hubspot deal with id (?<id>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Deal\'s ID',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'deal',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;

    try {
      await this.client.deleteDealById(id);
      return this.pass('Successfully deleted HubSpot deal %s', [id]);
    } catch (e) {
      return this.error('There was an error deleting the HubSpot deal: %s', [
        e.toString(),
      ]);
    }
  }
}

export { DeleteDealStep as Step };
