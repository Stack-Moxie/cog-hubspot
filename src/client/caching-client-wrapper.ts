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

  public async createOrUpdateContact(email, contact) {
    await this.clearCache();
    return await this.client.createOrUpdateContact(email, contact);
  }

  public async deleteContactByEmail(email: string) {
    await this.clearCache();
    return await this.client.deleteContactByEmail(email);
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

  public async getTicketById(id): Promise<Record<string, any>> {
    const cachekey = `HubSpot|Ticket|${name}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getTicketById(id);
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
