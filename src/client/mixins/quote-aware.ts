import * as hubspot from 'hubspot';

export class QuoteAwareMixin {
  clientReady: Promise<boolean>;
  client: hubspot.default;

  public async getQuoteById(id: string): Promise<Object> {
    await this.clientReady;

    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'GET',
        path: `/crm/v3/objects/quotes/${id}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }
}
