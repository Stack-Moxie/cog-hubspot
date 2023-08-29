import * as hubspot from 'hubspot';

export class ContactListAwareMixin {
  clientReady: Promise<boolean>;
  client: hubspot.default;

  public async getContactsInContactListById(id: string, offSet: string = null): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'GET',
        path: `/contacts/v1/lists/${id}/contacts/all?count=100${offSet ? `$vidOffset=${offSet}` : ''}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async createContactList(data: Record<string, any>): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'POST',
        path: '/contacts/v1/lists',
        body: data,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async updateContactListById(id: string, data: Record<string, any>): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'POST',
        path: `/contacts/v1/lists/${id}`,
        body: data,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async deleteContactListById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'DELETE',
        path: `/contacts/v1/lists/${id}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async getContactListById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'GET',
        path: `/contacts/v1/lists/${id}`,
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async addContactToContactList(listId: string, contactId: string, contactEmail: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'POST',
        path: `/contacts/v1/lists/${listId}/add`,
        body: {
          vids: [
            +contactId,
          ],
          emails: [
            contactEmail,
          ],
        },
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async addContactsToContactList(listId: string, contactEmails: [string]): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'POST',
        path: `/contacts/v1/lists/${listId}/add`,
        body: {
          emails: contactEmails,
        },
      }).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async removeContactToContactList(listId: string, contactId: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.apiRequest({
        method: 'POST',
        path: `/contacts/v1/lists/${listId}/remove`,
        body: {
          vids: [
            +contactId,
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
