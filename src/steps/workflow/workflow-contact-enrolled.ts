/*tslint:disable:no-else-after-return*/
// tslint:disable:max-line-length

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, StepRecord, RecordDefinition } from '../../proto/cog_pb';

export class ContactEnrolledToWorkflowStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check current workflow enrollment of a HubSpot contact';
  protected stepExpression: string = 'the (?<email>.+) hubspot contact should currently be enrolled in workflow (?<workflow>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Workflow Enrollment';

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
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'The Contact\'s ID',
    }, {
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'The Contact\'s Email',
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
  }, {
    id: 'workflow',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'name',
      type: FieldDefinition.Type.STRING,
      description: 'The Workflow\'s Name',
    }, {
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'The Workflow\'s ID',
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
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const workflow = stepData.workflow;

    try {
      const contact = await this.client.getContactByEmail(email);

      if (!contact) {
        return this.fail(
          'Contact %s was not found',
          [email],
        );
      }

      // Contact found, return as structured data
      const contactRecord = this.createContactRecord(contact);
      let workflowRecord;

      const workflows = (await this.client.currentContactWorkflows(contact.properties['hs_object_id'].value)) || [];
      if (workflows.length === 0) {
        return this.fail(
          'Contact %s is currently not enrolled in any Workflow',
          [email],
          [contactRecord],
        );
      } else {
        const headers = { name: 'Name', id: 'Id', type: 'Type', description: 'Description' };
        if (workflows.length === 1) {
          workflowRecord = this.createWorkflowRecord(workflows[0]);
        } else {
          const table = workflows.map((workflow) => {
            return {
              id: workflow.id,
              type: workflow.type || null,
              name: workflow.name || null,
              description: workflow.description || null,
            };
          });
          workflowRecord = this.table('matchedWorkflows', 'Matched Workflows', headers, table);
        }
      }

      const property = isNaN(workflow) ? 'name' : 'id';
      // tslint:disable-next-line:triple-equals
      const isEnrolled = workflows.find(f => f[property] == workflow);

      if (!isEnrolled) {
        return this.fail(
          'The Contact %s is not enrolled in the given workflow %s. Contact is enrolled in: %s',
          [email, workflow, workflows.map(f => f[property]).join(', ')],
          [workflowRecord, contactRecord],
        );
      }

      return this.pass(
        'The contact %s was verified to be enrolled in workflow %s',
        [email, workflow],
        [workflowRecord, contactRecord],
      );
    } catch (e) {
      return this.error('There was an error checking workflow enrollments for contact: %s', [
        e.toString(),
      ]);
    }
  }

  createContactRecord(contact): StepRecord {
    const obj = {};
    Object.keys(contact.properties).forEach(key => obj[key] = contact.properties[key].value || null);
    obj['createdate'] = this.client.toDate(obj['createdate']);
    obj['lastmodifieddate'] = this.client.toDate(obj['lastmodifieddate']);
    const record = this.keyValue('contact', 'Checked Contact', obj);
    return record;
  }

  createWorkflowRecord(workflow) {
    const obj = {
      id: workflow.id,
      type: workflow.type || null,
      name: workflow.name || null,
      description: workflow.description || null,
    };

    return this.keyValue('workflow', 'Workflow Enrollment Candidate', obj);
  }
}

export { ContactEnrolledToWorkflowStep as Step };
