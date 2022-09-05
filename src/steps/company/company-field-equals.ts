/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import * as moment from 'moment';
import { baseOperators } from '../../client/contants/operators';

export class CompanyFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a HubSpot Company';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_-]+) field on hubspot company (?<id>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectation>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Company's ID",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  },
  {
    field: 'expectation',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
    optionality: FieldDefinition.Optionality.OPTIONAL,
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
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const expectation = stepData.expectation;
    const id = stepData.id;
    const field = stepData.field;
    const operator = stepData.operator || 'be';

    try {
      const company = await this.client.getCompanyById(id, [field]);

      if (!company.properties.hasOwnProperty(field)) {
        return this.error('Company does not have the property %s', [field]);
      }
      const actual = this.client.isDate(company.properties[field]) ?
          this.client.toDate(company.properties[field]) : company.properties[field];

      company['id'] = id;
      const records = this.createRecords(company, stepData['__stepOrder']);
      const result = this.assert(operator, actual.value, expectation, field);

      return result.valid ? this.pass(result.message, [], records)
        : this.fail(result.message, [], records);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error checking the company field: %s', [e.message]);
      }

      return this.error('There was an error checking the company field: %s', [e.toString()]);
    }
  }

  public createRecords(company, stepOrder = 1): StepRecord[] {
    const obj = {};
    obj['id'] = company.companyId;
    Object.keys(company.properties).forEach(key => obj[key] = company.properties[key].value);
    const record = this.keyValue('company', 'Checked Company', obj);

    const records = [];
    // Base Record
    records.push(this.keyValue('company', 'Checked Company', obj));
    // Ordered Record
    records.push(this.keyValue(`company.${stepOrder}`, `Checked Company from Step ${stepOrder}`, obj));
    return records;
  }
}

export { CompanyFieldEquals as Step };
