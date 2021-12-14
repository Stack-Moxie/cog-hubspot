import * as hubspot from 'hubspot';

export class TicketAwareMixin {
  clientReady: Promise<boolean>;
  client: hubspot.default;

  public async createTicket(ticket: Object): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'POST',
        path: '/crm/v3/objects/tickets',
        body: {
          properties: ticket,
        },
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async updateTicket(id: string, data: {}): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'PATCH',
        path: `/crm/v3/objects/tickets/${+id}`,
        body: {
          properties: data,
        },
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async deleteTicketById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'DELETE',
        path: `/crm/v3/objects/tickets/${+id}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async getTicketById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'GET',
        path: `/crm/v3/objects/tickets/${+id}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }
}
