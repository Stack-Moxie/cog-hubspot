import * as hubspot from 'hubspot';

export class ContactAwareMixin {
  clientReady: Promise<boolean>;
  client: hubspot.default;

  public async getContactByEmail(email: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.contacts.getByEmail(email).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public chunkArrayHelper(leadArray) {
    // Chunk the leads array into subarrays with length 300 or less
    const chunkedLeads = [];
    const leadArrayCopy = [...leadArray];
    let chunkIndex = 0;
    while (leadArrayCopy.length) {
      chunkedLeads[chunkIndex] = leadArrayCopy.splice(0, 300);
      chunkIndex += 1;
    }
    return chunkedLeads;
  }

  public async bulkGetContactsByEmail(emails: string[]): Promise<Object[]> {
    const emailChunks = this.chunkArrayHelper(emails);

    // Store all the promises for each chunk
    const chunkPromises = emailChunks.map(async (chunk) => {
      // Map getContactByEmail to each email in the chunk
      const contactsPromises = chunk.map(email => this.getContactByEmail(email));
      // Resolve all the promises for this chunk and return the results
      return Promise.all(contactsPromises);
    });
    // Resolve all the promises for all chunks
    const chunkResults = await Promise.all(chunkPromises);
    // Flatten the array of chunk results into a single array
    const flatResults = [].concat(...chunkResults);
    return flatResults;
  }

  public async getContactById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.contacts.getById(id).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error.message);
      });
    });
  }

  public async createOrUpdateContact(email: string, contact: Object): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.contacts.createOrUpdate(email, contact).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  public async updateContactById(id: string, contact: Object): Promise<Object> {
    await this.clientReady;
    return new Promise((resolve, reject) => {
      this.client.contacts.update(+id, contact).then((result) => {
        resolve(result);
      }, (error) => {
        reject(error);
      });
    });
  }

  public async deleteContactByEmail(email: string): Promise<Object> {
    await this.clientReady;
    return new Promise(async (resolve, reject) => {
      try {
        const contact = await this.client.contacts.getByEmail(email);
        const result = await this.client.contacts.delete(contact['vid']);
        resolve({ result, contact });
      } catch (e) {
        reject(e.message);
      }
    });
  }

  public async deleteContactById(id: string): Promise<Object> {
    await this.clientReady;
    return new Promise(async (resolve, reject) => {
      try {
        const contact = await this.client.contacts.getById(id);
        const result = await this.client.contacts.delete(contact['vid']);
        resolve({ result, contact });
      } catch (e) {
        reject(e.message);
      }
    });
  }
}
