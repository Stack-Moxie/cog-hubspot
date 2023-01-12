/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../../proto/cog_pb';

export class DeleteContactListStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a HubSpot contact list';
  protected stepExpression: string = 'delete the hubspot contact list with id (?<id>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['delete'];
  protected targetObject: string = 'Contact List';

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Contact List\'s ID',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contactList',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;

    try {
      await this.client.deleteContactListById(id);
      return this.pass('Successfully deleted HubSpot contact list %s', [id]);
    } catch (e) {
      return this.error('There was an error deleting the HubSpot contact list: %s', [
        e.toString(),
      ]);
    }
  }
}

export { DeleteContactListStep as Step };
