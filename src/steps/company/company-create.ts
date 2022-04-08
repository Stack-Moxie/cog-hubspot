/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateCompanyStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a HubSpot company';
  protected stepExpression: string = 'create a hubspot company';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;

  protected expectedFields: Field[] = [{
    field: 'company',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'company',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.STRING,
      description: 'The Company\'s ID',
    }, {
      field: 'name',
      type: FieldDefinition.Type.STRING,
      description: 'The Company\'s Name',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const company: Object = {
      properties: [],
    };
    const dateTokenFormat = /\d{4}-\d{2}-\d{2}(?:.?\d{2}:\d{2}:\d{2})?/;
    for (const key in stepData.company) {
      if (dateTokenFormat.test(stepData.company[key])) {
        stepData.company[key] = this.client.toEpoch(new Date(stepData.company[key]));
      }
    }

    try {
      Object.keys(stepData.company).forEach((key) => {
        company['properties'].push({
          name: key,
          value: stepData.company[key],
        });
      });

      const data = await this.client.createCompany(company);
      const record = this.createRecord(data);
      return this.pass('Successfully created HubSpot company', [], [record]);
    } catch (e) {
      return this.error('There was an error creating the company in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public createRecord(company): StepRecord {
    const obj = {};
    obj['id'] = company.companyId;
    Object.keys(company.properties).forEach(key => obj[key] = company.properties[key].value);
    const record = this.keyValue('company', 'Created Company', obj);

    return record;
  }

  public createOrderedRecord(company, stepOrder = 1): StepRecord {
    const obj = {};
    obj['id'] = company.companyId;
    Object.keys(company.properties).forEach(key => obj[key] = company.properties[key].value);
    const record = this.keyValue(`company.${stepOrder}`, `Created Company from Step ${stepOrder}`, obj);

    return record;
  }

}

export { CreateCompanyStep as Step };
