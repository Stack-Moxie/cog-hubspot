import { Client } from '@hubspot/api-client';
import * as grpc from 'grpc';
import * as moment from 'moment';

export interface EventOccurrenceQuery {
  eventType: string;
  objectId?: string;
  email?: string;
  occurredAfter?: string;
  occurredBefore?: string;
  propertyFilters?: Record<string, string>;
  limit?: number;
}

/**
 * Reads HubSpot custom behavioral event occurrences (not Marketing Events)
 * via GET /events/event-occurrences/2026-03.
 */
export class CustomEventAwareMixin {
  clientV3: Client;
  connectToV3: () => Promise<void>;
  auth: grpc.Metadata;

  public async getEventOccurrences(query: EventOccurrenceQuery): Promise<any[]> {
    await this.connectToV3();

    const params = new URLSearchParams();
    params.set('eventType', query.eventType);
    params.set('objectType', 'contact');
    if (query.objectId) {
      params.set('objectId', String(query.objectId));
    }
    if (query.email) {
      params.set('objectProperty.email', query.email);
    }
    if (query.occurredAfter) {
      params.set('occurredAfter', query.occurredAfter);
    }
    if (query.occurredBefore) {
      params.set('occurredBefore', query.occurredBefore);
    }
    if (query.limit) {
      params.set('limit', String(query.limit));
    }
    if (query.propertyFilters) {
      Object.keys(query.propertyFilters).forEach((key) => {
        const value = query.propertyFilters[key];
        if (value !== undefined && value !== null && value !== '') {
          params.set(`property.${key}`, String(value));
        }
      });
    }

    const path = `/events/event-occurrences/2026-03?${params.toString()}`;
    try {
      const response = await this.clientV3.apiRequest({
        path,
        method: 'GET',
      });
      const body = await response.json();
      if (Array.isArray(body)) {
        return body;
      }
      if (body && Array.isArray(body.results)) {
        return body.results;
      }
      return [];
    } catch (e) {
      throw new Error(`Error calling GET ${path}: ${e.message || e}`);
    }
  }

  public async listEventTypes(): Promise<any[]> {
    await this.connectToV3();
    const path = '/events/event-occurrences/2026-03/event-types';
    try {
      const response = await this.clientV3.apiRequest({
        path,
        method: 'GET',
      });
      const body = await response.json();
      if (Array.isArray(body)) {
        return body;
      }
      if (body && Array.isArray(body.results)) {
        return body.results;
      }
      return [];
    } catch (e) {
      throw new Error(`Error calling GET ${path}: ${e.message || e}`);
    }
  }

  public occurredAfterFromMinutes(minutes: number): string {
    return moment().subtract(minutes, 'minutes').utc().toISOString();
  }
}
