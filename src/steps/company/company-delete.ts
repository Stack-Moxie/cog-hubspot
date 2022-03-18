/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../../proto/cog_pb';

export class DeleteCompanyStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a HubSpot company';
  protected stepExpression: string = 'delete the hubspot company with id (?<id>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Company\'s ID',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'company',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;

    try {
      await this.client.deleteCompanyById(id);
      return this.pass('Successfully deleted HubSpot company %s', [id]);
    } catch (e) {
      return this.error('There was an error deleting the HubSpot company: %s', [
        e.toString(),
      ]);
    }
  }
}

export { DeleteCompanyStep as Step };
