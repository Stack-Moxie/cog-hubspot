/*tslint:disable:no-else-after-return*/
/*tslint:disable:max-line-length*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class EnrollContactToWorkflowStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Enroll a HubSpot contact into a workflow';
  protected stepExpression: string = 'enroll the (?<email>.+) hubspot contact into workflow (?<workflow>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['add'];
  protected targetObject: string = 'Contact to Workflow';

  protected expectedFields: Field[] = [{
    field: 'workflow',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Workflow\'s Name or ID',
  }, {
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Contact\'s email address',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'workflow',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'The Workflow\'s ID',
    }, {
      field: 'name',
      type: FieldDefinition.Type.STRING,
      description: 'The Workflow\'s Name',
    }, {
      field: 'type',
      type: FieldDefinition.Type.STRING,
      description: 'The Workflow\'s Type',
    }, {
      field: 'description',
      type: FieldDefinition.Type.STRING,
      description: 'The Workflow\'s Description',
    }],
    dynamicFields: false,
  }, {
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'hs_object_id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'The contact\'s ID',
    }, {
      field: 'createdate',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Contact\'s Create Date',
    }, {
      field: 'lastmodifieddate',
      type: FieldDefinition.Type.DATETIME,
      description: 'The Contact\'s Last Modified Date',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    let workflow = stepData.workflow;

    try {
      const contact = await this.client.getContactByEmail(email);

      if (!contact) {
        return this.fail(
          'Can\'t enroll %s into %s: contact not found.',
          [email, stepData.workflow],
        );
      }

      const contactRecord = this.createContactRecord(contact);
      let workflowRecord;
      if (isNaN(workflow)) {
        const workflows = await this.client.findWorkflowByName(workflow);

        if (workflows.length > 1) {
          const headers = { name: 'Name', id: 'Id', type: 'Type', description: 'Description' };

          const table = workflows.map((workflow) => {
            return {
              id: workflow.id,
              type: workflow.type,
              name: workflow.name,
              description: workflow.description,
            };
          });
          const workflowRecords = this.table('matchedWorkflows', 'Matched Workflows', headers, table);
          return this.fail(
            'Can\'t enroll %s into %s: found more than one workflow with that name.',
            [email, workflow],
            [workflowRecords, contactRecord],
          );
        }

        if (workflows[0]) {
          workflow = workflows[0].id;
        }

        workflowRecord = this.createWorkflowRecord(workflows[0]);
      }

      await this.client.enrollContactToWorkflow(workflow, email);

      return this.pass(
        'The contact %s was successfully enrolled to workflow %s',
        [email, stepData.workflow],
        [workflowRecord, contactRecord],
      );
    } catch (e) {
      return this.error('There was an error enrolling the HubSpot contact to workflow: %s', [e.toString()]);
    }
  }

  createContactRecord(contact): StepRecord {
    const obj = {};
    Object.keys(contact.properties).forEach(key => obj[key] = contact.properties[key].value);
    obj['createdate'] = this.client.toDate(obj['createdate']);
    obj['lastmodifieddate'] = this.client.toDate(obj['lastmodifieddate']);
    const record = this.keyValue('contact', 'Contact Enrollment Candidate', obj);
    return record;
  }

  createWorkflowRecord(workflow) {
    const obj = {
      id: workflow.id,
      type: workflow.type,
      name: workflow.name,
      description: workflow.description,
    };

    return this.keyValue('workflow', 'Workflow Enrollment Candidate', obj);
  }
}

export { EnrollContactToWorkflowStep as Step };
