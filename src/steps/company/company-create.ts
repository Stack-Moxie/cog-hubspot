/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateCompanyStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a HubSpot company';
  protected stepExpression: string = 'create a hubspot company';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create'];
  protected targetObject: string = 'Company';

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
      const passingRecord = this.createPassingRecord(data, Object.keys(stepData.company));
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);
      return this.pass('Successfully created HubSpot company', [], [record, passingRecord, orderedRecord]);
    } catch (e) {
      return this.error('There was an error creating the company in HubSpot: %s', [
        e.toString(),
      ]);
    }
  }

  public getObjectMap(data): Object {
    const obj = {};
    obj['id'] = data.companyId;
    Object.keys(data.properties).forEach(key => obj[key] = data.properties[key].value);
    return obj;
  }

  public createRecord(company): StepRecord {
    const obj = this.getObjectMap(company);
    const record = this.keyValue('company', 'Created Company', obj);
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
    return this.keyValue('exposeOnPass:company', 'Created Company', filteredData);
  }

  public createOrderedRecord(company, stepOrder = 1): StepRecord {
    const obj = this.getObjectMap(company);
    const record = this.keyValue(`company.${stepOrder}`, `Created Company from Step ${stepOrder}`, obj);
    return record;
  }

}

export { CreateCompanyStep as Step };
