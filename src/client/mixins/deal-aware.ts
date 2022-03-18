import * as hubspot from 'hubspot';

export class DealAwareMixin {
  clientReady: Promise<boolean>;
  client: hubspot.default;

  public async getDealById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.deals.getById(+id).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async createDeal(deal: Object): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.deals.create(deal).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  public async updateDealById(id: string, deal: Object): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.deals.updateById(+id, deal).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  public async deleteDealById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.deals.deleteById(+id);
        resolve({ result });
      } catch (e) {
        reject(e.message);
      }
    });
  }
}
