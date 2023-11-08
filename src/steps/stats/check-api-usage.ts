/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CheckHubspotApiUsageStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check daily HubSpot API usage';
  protected stepExpression: string = 'there should be less than 90% usage of your daily HubSpot API limit';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'API Usage';
  protected expectedFields: Field[] = [];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'requests',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'apiUsage',
      type: FieldDefinition.Type.NUMERIC,
      description: 'Daily API Requests',
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step) {
    try {
      const apiUsage = (await this.client.getApiUsage());

      if (apiUsage.limit && apiUsage.limit === 'unlimited') {
        return this.pass('You are using oauth 2.0 to connect to HubSpot and may make unlimited API calls through Stack Moxie.', [], []);
      }

      const apiRequestsMade = apiUsage.limit - apiUsage.remaining;
      const percentUsage = (apiRequestsMade / apiUsage.limit) * 100;

      if (apiRequestsMade < (0.9 * apiUsage.limit)) {
        return this.pass(
          'You have used %d of your %d HubSpot API calls for today, which is %d%% of your daily API limit.',
          [apiRequestsMade, apiUsage.limit, percentUsage],
          [this.keyValue('requests', 'Checked API Usage', { apiUsage: apiRequestsMade })],
        );
      }
      return this.fail(
        'You have used %d of your %d HubSpot API calls for today, which is %d%% of your daily API limit.',
        [apiRequestsMade, apiUsage.limit, percentUsage],
        [this.keyValue('requests', 'Checked API Usage', { apiUsage: apiRequestsMade })],
      );
    } catch (e) {
      return this.error('There was a problem checking the API Usage: %s', [e.toString()]);
    }
  }
}

export { CheckHubspotApiUsageStep as Step };
