import * as hubspot from 'hubspot';

export class ProductAwareMixin {
  clientReady: Promise<boolean>;
  client: hubspot.default;

  public async createProduct(product: Object[]): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'POST',
        path: '/crm-objects/v1/objects/products',
        body: product,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async updateProductById(id: string, product: Object[]): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'PATCH',
        path: `/crm-objects/v1/objects/products/${+id}`,
        body: product,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async deleteProductById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'DELETE',
        path: `/crm-objects/v1/objects/products/${+id}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async getProductById(id: string, properties: string[] = []): Promise<Object> {
    await this.clientReady;
    const propertiesParam = properties.join(',');

    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'GET',
        path: `/crm-objects/v1/objects/products/${+id}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }
}
