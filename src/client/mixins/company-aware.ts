import * as hubspot from 'hubspot';

export class CompanyAwareMixin {
  clientReady: Promise<boolean>;
  client: hubspot.default;

  public async getCompanyById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.companies.getById(+id).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async createCompany(company: Object): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.companies.create(company).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  public async updateCompanyById(id: string, company: Object): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.companies.update(+id, company).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  public async deleteCompanyById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.client.companies.delete(+id);
        resolve({ result });
      } catch (e) {
        reject(e.message);
      }
    });
  }
}
