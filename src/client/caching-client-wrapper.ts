import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';
​​
class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.requestId}${this.idMap.scenarioId}${this.idMap.requestorId}Salesforce`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Contact aware methods
  // -------------------------------------------------------------------

  public async getContactByEmail(email: string) {
    const cachekey = `${this.cachePrefix}Contact${email}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.getContactByEmail(email);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  public async deleteContactByEmail(email: string) {
    await this.delCache(`${this.cachePrefix}Contact${email}`);
    return await this.client.deleteContactByEmail(email);
  }

  // Account aware methods
  // -------------------------------------------------------------------

  public async findWorkflowByName(name: string): Promise<Record<string, any>> {
    const cachekey = `${this.cachePrefix}Workflow${name}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    } else {
      const result = await this.client.findWorkflowByName(name);
      if (result) {
        await this.setCache(cachekey, result);
      }
      return result;
    }
  }

  // all non-cached methods, just referencing the original function
  // -------------------------------------------------------------------

  public async createOrUpdateContact(email, contact) {
    return await this.client.createOrUpdateContact(email, contact);
  }

  public async isDate(value) {
    return await this.client.isDate(value);
  }

  public async toDate(epoch: number) {
    return await this.client.toDate(epoch);
  }

  public async toEpoch(date: Date) {
    return await this.client.toEpoch(date);
  }

  public async enrollContactToWorkflow(workflow, email) {
    return await this.client.enrollContactToWorkflow(workflow, email);
  }

  public async currentContactWorkflows(contactId) {
    return await this.client.currentContactWorkflows(contactId);
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
      // arrOfKeys will store an array of all cache keys used in this scenario run, so it can be cleared easily
      const arrOfKeys = await this.getCache(this.cachePrefix) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 600, JSON.stringify(value));
      await this.setAsync(this.cachePrefix, 600, JSON.stringify(arrOfKeys));
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
      const keysToDelete = await this.getCache(this.cachePrefix);
      if (keysToDelete.length) {
        keysToDelete.forEach((key: string) => this.delAsync(key));
      }
      this.setAsync(this.cachePrefix, 600, '[]');
    } catch (err) {
      console.log(err);
    }
  }

}
​
export { CachingClientWrapper as CachingClientWrapper };