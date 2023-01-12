/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../../proto/cog_pb';

export class DeleteProductStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a HubSpot product';
  protected stepExpression: string = 'delete the hubspot product with id (?<id>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['delete'];
  protected targetObject: string = 'Product';

  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Product\'s ID',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'product',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const id: string = stepData.id;

    try {
      await this.client.deleteProductById(id);
      return this.pass('Successfully deleted HubSpot product %s', [id]);
    } catch (e) {
      return this.error('There was an error deleting the HubSpot product: %s', [
        e.toString(),
      ]);
    }
  }
}

export { DeleteProductStep as Step };
