import * as hubspot from 'hubspot';

export class MarketingEventAwareMixin {
  clientReady: Promise<boolean>;
  client: hubspot.default;

  public async createOrUpdateMarketingEvent(marketingEvent: Object, externalEventId: string, externalAccountId: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'PUT',
        path: `/marketing/v3/marketing-events/events/${externalEventId}?externalAccountId=${externalAccountId}`,
        body: marketingEvent,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        console.log(error);
        reject(error.message);
      });
    });
  }

  public async deleteMarketingEventById(externalEventId: string, externalAccountId: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'DELETE',
        path: `/marketing/v3/marketing-events/events/${externalEventId}?externalAccountId=${externalAccountId}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async getMarketingEventById(externalEventId: string, externalAccountId: string): Promise<Object> {
    await this.clientReady;

    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'GET',
        path: `/marketing/v3/marketing-events/events/${externalEventId}?externalAccountId=${externalAccountId}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }
}
