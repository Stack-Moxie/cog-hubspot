import * as hubspot from 'hubspot';

export class AssociationAwareMixin {
  clientReady: Promise<boolean>;
  client: hubspot.default;

  public async getAssociationsById(id: string, fromObjectType: string, toObjectType: string): Promise<Object> {
    await this.clientReady;

    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'POST',
        path: `/crm/v3/associations/${fromObjectType}/${toObjectType}/batch/read`,
        body: {
          inputs: [
            {
              id,
            },
          ],
        },
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }
}
