/*tslint:disable:no-else-after-return*/
/*tslint:disable:max-line-length*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/contants/operators';

/**
 * Assert that a HubSpot custom behavioral event (e.g. Response Event) occurred
 * on a contact within a lookback window, optionally matching event properties.
 * Analogous to Marketo CheckLeadActivityStep. Not a Marketing Event step.
 */
export class CustomEventFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a HubSpot custom event on a contact';
  protected stepExpression: string = 'there should (?<includes>be|not be) a hubspot custom event (?<eventType>.+) for contact (?<email>.+@.+\..+)(?: in the last (?<minutes>\\d+) minutes?)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Custom Event';
  protected stepHelp: string = 'Reads HubSpot Custom Behavioral Events (event occurrences), not Marketing Events. Use the internal eventType name (e.g. pe{portalId}_response_event).';

  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
    bulksupport: true,
  }, {
    field: 'eventType',
    type: FieldDefinition.Type.STRING,
    description: 'Internal custom event name (e.g. pe123_response_event)',
  }, {
    field: 'includes',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Existence check: be or not be (default be)',
  }, {
    field: 'minutes',
    type: FieldDefinition.Type.NUMERIC,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Lookback window in minutes (default 60). Ignored if occurredAfter is set.',
  }, {
    field: 'occurredAfter',
    type: FieldDefinition.Type.DATETIME,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Absolute ISO timestamp lower bound (alternative to minutes)',
  }, {
    field: 'properties',
    type: FieldDefinition.Type.MAP,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Map of event property names to expected values (e.g. response_type, asset_id, tactic_id, source_system)',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Per-property check logic (be, not be, contain, not contain, be greater than, be less than). Default be.',
  }];

  protected expectedRecords: ExpectedRecord[] = [{
    id: 'customEvent',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'email',
      type: FieldDefinition.Type.EMAIL,
      description: 'Contact email',
    }, {
      field: 'contactId',
      type: FieldDefinition.Type.STRING,
      description: 'Contact hs_object_id',
    }, {
      field: 'eventType',
      type: FieldDefinition.Type.STRING,
      description: 'Custom event type',
    }, {
      field: 'occurredAt',
      type: FieldDefinition.Type.DATETIME,
      description: 'Occurrence timestamp',
    }, {
      field: 'response_type',
      type: FieldDefinition.Type.STRING,
      description: 'Response Type property',
    }, {
      field: 'asset_id',
      type: FieldDefinition.Type.STRING,
      description: 'Asset ID property',
    }, {
      field: 'tactic_id',
      type: FieldDefinition.Type.STRING,
      description: 'Tactic ID property',
    }, {
      field: 'source_system',
      type: FieldDefinition.Type.STRING,
      description: 'Source System property',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step) {
    const stepData: any = step.getData() ? step.getData().toJavaScript() : {};
    const email: string = stepData.email;
    const eventType: string = stepData.eventType;
    const includes: boolean = stepData.includes ? stepData.includes === 'be' : true;
    const minutes: number = stepData.minutes !== undefined && stepData.minutes !== null && stepData.minutes !== ''
      ? Number(stepData.minutes) : 60;
    const occurredAfter: string = stepData.occurredAfter
      || this.client.occurredAfterFromMinutes(minutes);
    const properties: Record<string, any> = stepData.properties || {};
    const operator: string = stepData.operator || 'be';

    const propSummary = (props: Record<string, any>) => {
      const responseType = props.response_type !== undefined ? props.response_type : '(missing)';
      const assetId = props.asset_id !== undefined ? props.asset_id : '(missing)';
      const sourceSystem = props.source_system !== undefined ? props.source_system : '(missing)';
      return `Email Address: ${email}; Response Type: ${responseType}; Asset ID: ${assetId}; Asset: Source System: ${sourceSystem}`;
    };

    try {
      if (!email || !eventType) {
        return this.error('email and eventType are required');
      }

      const contact: any = await this.client.getContactByEmail(email);
      const contactId = contact.vid
        || (contact.properties && contact.properties.hs_object_id && contact.properties.hs_object_id.value)
        || contact.id;

      if (!contactId) {
        return this.error(
          'Could not resolve HubSpot contact for %s — verify the contact exists before asserting custom events',
          [email],
        );
      }

      // Prefer server-side property filters when asserting existence with exact "be" matches
      const serverFilters = (includes && operator === 'be' && Object.keys(properties).length > 0)
        ? properties
        : undefined;

      const occurrences: any[] = await this.client.getEventOccurrences({
        eventType,
        email,
        occurredAfter,
        objectId: String(contactId),
        propertyFilters: serverFilters,
        limit: 100,
      });

      const normalized = occurrences.map(occ => this.normalizeOccurrence(occ));

      let match = null;
      if (Object.keys(properties).length === 0) {
        match = normalized.length > 0 ? normalized[0] : null;
      } else {
        match = normalized.find(occ => this.propertiesMatch(occ, properties, operator, stepData['__piiSuppressionLevel']));
      }

      const expectedPropsForMessage = {
        response_type: properties.response_type,
        asset_id: properties.asset_id,
        tactic_id: properties.tactic_id,
        source_system: properties.source_system,
      };

      if (includes && !match) {
        const hint = Object.keys(properties).length
          ? 'Event found but required properties did not match — check Asset Member fields (tactic_id, asset_id, source_system, response_type) and custom-code payload'
          : `No Response Event / custom event in lookback since ${occurredAfter} — check SFDC→HS Asset Member sync and custom code token HUBSPOT_ACCESS_TOKEN_CUSTOM_EVENTS`;
        return this.fail(
          '%s. eventType=%s. %s. %s',
          [propSummary(expectedPropsForMessage), eventType, hint, `Lookback from ${occurredAfter}`],
        );
      }

      if (!includes && match) {
        return this.fail(
          '%s. Unexpected custom event %s occurred at %s — expected no event in lookback since %s',
          [propSummary(this.pickKeyProps(match)), eventType, match.occurredAt || '(unknown)', occurredAfter],
          this.buildRecords(email, contactId, eventType, match),
        );
      }

      if (!includes && !match) {
        return this.pass(
          'Confirmed no HubSpot custom event %s for %s since %s',
          [eventType, email, occurredAfter],
        );
      }

      const records = this.buildRecords(email, contactId, eventType, match);
      return this.pass(
        'Found HubSpot custom event %s for %s at %s. %s',
        [eventType, email, match.occurredAt || '(unknown)', propSummary(this.pickKeyProps(match))],
        records,
      );
    } catch (e) {
      if (e && (e.statusCode === 404 || e.status === 404 || String(e).includes('404') || String(e).includes('contact does not exist') || String(e).includes('Not Found'))) {
        return this.error(
          'Contact %s not found in HubSpot — cannot assert custom event %s. %s',
          [email, eventType, propSummary(properties)],
        );
      }
      return this.error('There was an error checking HubSpot custom event: %s. %s', [
        e.message || String(e),
        propSummary(properties),
      ]);
    }
  }

  private normalizeOccurrence(occ: any): Record<string, any> {
    const props = occ.properties || occ.eventProperties || {};
    const flat: Record<string, any> = {};
    Object.keys(props).forEach((key) => {
      const val = props[key];
      flat[key] = (val && typeof val === 'object' && val.value !== undefined) ? val.value : val;
    });
    return {
      ...flat,
      eventType: occ.eventType || occ.eventName || flat.eventType,
      occurredAt: occ.occurredAt || occ.occurred_at || occ.timestamp || flat.occurredAt || flat.hs_timestamp,
      objectId: occ.objectId || occ.object_id || flat.objectId,
    };
  }

  private pickKeyProps(occ: Record<string, any>): Record<string, any> {
    return {
      response_type: occ.response_type,
      asset_id: occ.asset_id,
      tactic_id: occ.tactic_id,
      source_system: occ.source_system,
    };
  }

  private propertiesMatch(
    occ: Record<string, any>,
    expected: Record<string, any>,
    operator: string,
    piiSuppressionLevel: any,
  ): boolean {
    return Object.keys(expected).every((key) => {
      const actual = occ[key] !== undefined ? occ[key] : null;
      const expectation = expected[key];
      try {
        const result = this.assert(operator, actual, expectation, key, piiSuppressionLevel);
        return result && result.valid;
      } catch (e) {
        // Fall back to strict equality if assert rejects operator
        if (operator === 'be set') {
          return actual !== null && actual !== undefined && actual !== '';
        }
        if (operator === 'not be set') {
          return actual === null || actual === undefined || actual === '';
        }
        return String(actual) === String(expectation);
      }
    });
  }

  private buildRecords(email: string, contactId: any, eventType: string, match: Record<string, any>): StepRecord[] {
    const obj = {
      email,
      eventType,
      contactId: String(contactId),
      occurredAt: match.occurredAt,
      response_type: match.response_type,
      asset_id: match.asset_id,
      tactic_id: match.tactic_id,
      source_system: match.source_system,
      ...match,
    };
    return [this.keyValue('customEvent', 'Checked Custom Event', obj)];
  }
}

export { CustomEventFieldEquals as Step };
