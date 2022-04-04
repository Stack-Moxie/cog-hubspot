import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';
​​
class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.scenarioId}${this.idMap.requestorId}`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Contact aware methods
  // -------------------------------------------------------------------

  public async getContactByEmail(email: string) {
    const cachekey = `HubSpot|Contact|${email}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getContactByEmail(email);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async getContactById(id: string) {
    const cachekey = `HubSpot|Contact|${id}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getContactById(id);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async createOrUpdateContact(email, contact) {
    await this.clearCache();
    return await this.client.createOrUpdateContact(email, contact);
  }

  public async updateContactById(id, contact) {
    await this.clearCache();
    return await this.client.updateContactById(id, contact);
  }

  public async deleteContactByEmail(email: string) {
    await this.clearCache();
    return await this.client.deleteContactByEmail(email);
  }

  public async deleteContactById(id: string) {
    await this.clearCache();
    return await this.client.deleteContactById(id);
  }

  // Workflow aware methods
  // -------------------------------------------------------------------

  public async findWorkflowByName(name: string): Promise<Record<string, any>> {
    const cachekey = `HubSpot|Workflow|${name}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.findWorkflowByName(name);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async enrollContactToWorkflow(workflow, email) {
    await this.clearCache();
    return await this.client.enrollContactToWorkflow(workflow, email);
  }

  public async currentContactWorkflows(contactId) {
    await this.clearCache();
    return await this.client.currentContactWorkflows(contactId);
  }

  // Ticket aware methods
  // -------------------------------------------------------------------

  public async getTicketById(id, property = []): Promise<Record<string, any>> {
    const cachekey = `HubSpot|Ticket|${id}|${property.join(',')}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getTicketById(id, property);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async createTicket(ticket) {
    await this.clearCache();
    return await this.client.createTicket(ticket);
  }

  public async updateTicket(id, ticket) {
    await this.clearCache();
    return await this.client.updateTicket(id, ticket);
  }

  public async deleteTicketById(id) {
    await this.clearCache();
    return await this.client.deleteTicketById(id);
  }

  public async getCompanyById(id, property = []): Promise<Record<string, any>> {
    const cachekey = `HubSpot|Company|${id}|${property.join(',')}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getCompanyById(id);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async createCompany(company) {
    await this.clearCache();
    return await this.client.createCompany(company);
  }

  public async updateCompanyById(id, company) {
    await this.clearCache();
    return await this.client.updateCompanyById(id, company);
  }

  public async deleteCompanyById(id) {
    await this.clearCache();
    return await this.client.deleteCompanyById(id);
  }

  public async getDealById(id, property = []): Promise<Record<string, any>> {
    const cachekey = `HubSpot|Deal|${id}|${property.join(',')}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getDealById(id);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async createDeal(company) {
    await this.clearCache();
    return await this.client.createDeal(company);
  }

  public async updateDealById(id, company) {
    await this.clearCache();
    return await this.client.updateDealById(id, company);
  }

  public async deleteDealById(id) {
    await this.clearCache();
    return await this.client.deleteDealById(id);
  }

  public async getProductById(id, properties = []): Promise<Record<string, any>> {
    const cachekey = `HubSpot|Product|${id}|${properties.join(',')}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getProductById(id, properties);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async createProduct(company) {
    await this.clearCache();
    return await this.client.createProduct(company);
  }

  public async updateProductById(id, company) {
    await this.clearCache();
    return await this.client.updateProductById(id, company);
  }

  public async deleteProductById(id) {
    await this.clearCache();
    return await this.client.deleteProductById(id);
  }

  public async createOrUpdateMarketingEvent(marketingEvent: Object, externalEventId: string, externalAccountId: string): Promise<Object> {
    await this.clearCache();
    return await this.client.createOrUpdateMarketingEvent(marketingEvent, externalEventId, externalAccountId);
  }

  public async deleteMarketingEventById(externalEventId: string = '', externalAccountId: string = ''): Promise<Object> {
    await this.clearCache();
    return await this.client.deleteMarketingEventById(externalEventId, externalAccountId);
  }

  public async getMarketingEventById(externalEventId: string = '', externalAccountId: string = ''): Promise<Object> {
    const cachekey = `HubSpot|Product|${externalEventId}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getMarketingEventById(externalEventId, externalAccountId);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async getQuoteById(id: string): Promise<Object> {
    const cachekey = `HubSpot|Quote|${id}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getQuoteById(id);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async getAssociationById(id, string, fromObjectType: string, toObjectType: string): Promise<Object> {
    const cachekey = `HubSpot|Association|${fromObjectType}|${toObjectType}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getAssociationById(id, fromObjectType, toObjectType);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async getContactsInContactListById(id: string, offSet: string = null) {
    const cachekey = `HubSpot|ContactList|${id}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getContactsInContactListById(id, offSet);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async createContactList(data: Record<string, any>): Promise<Object> {
    await this.clearCache();
    return await this.client.createContactList(data);
  }

  public async updateContactListById(id: string, data: Record<string, any>): Promise<Object> {
    await this.clearCache();
    return await this.client.updateContactListById(id, data);
  }

  public async deleteContactListById(id: string): Promise<Object> {
    await this.clearCache();
    return await this.client.deleteContactListById(id);
  }

  public async getContactListById(id: string): Promise<Object> {
    await this.clearCache();
    return await this.client.getContactListById(id);
  }
  public async addContactToContactList(listId: string, contactId: string, contactEmail: string): Promise<Object> {
    await this.clearCache();
    return await this.client.addContactToContactList(listId, contactId, contactEmail);
  }

  public async removeContactToContactList(listId: string, contactId: string): Promise<Object> {
    await this.clearCache();
    return await this.client.removeContactToContactList(listId, contactId);
  }

  // all non-cached methods, just referencing the original function
  // -------------------------------------------------------------------

  public isDate(value) {
    return this.client.isDate(value);
  }

  public toDate(epoch: number) {
    return this.client.toDate(epoch);
  }

  public toEpoch(date: Date) {
    return this.client.toEpoch(date);
  }

  // Redis methods for get, set, and delete
  // -------------------------------------------------------------------

  // Async getter/setter
  public getAsync = promisify(this.redisClient.get).bind(this.redisClient);
  public setAsync = promisify(this.redisClient.setex).bind(this.redisClient);
  public delAsync = promisify(this.redisClient.del).bind(this.redisClient);

  public async getCache(key: string) {
    try {
      const stored = await this.getAsync(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (err) {
      console.log(err);
    }
  }

  public async setCache(key: string, value: any) {
    try {
      // arrOfKeys will store an array of all cache keys used in this scenario run
      // so it can be cleared easily
      const arrOfKeys = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 55, JSON.stringify(value));
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, JSON.stringify(arrOfKeys));
    } catch (err) {
      console.log(err);
    }
  }

  public async delCache(key: string) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(err);
    }
  }

  public async clearCache() {
    try {
      // clears all the cachekeys used in this scenario run
      const keysToDelete = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      if (keysToDelete.length) {
        keysToDelete.forEach(async (key: string) => await this.delAsync(key));
      }
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, '[]');
    } catch (err) {
      console.log(err);
    }
  }

}
​
export { CachingClientWrapper as CachingClientWrapper };
