import { Client } from '@hubspot/api-client';

export class ImportsAwareMixinV3 {
  clientV3: Client;
  connectToV3: () => Promise<void>;

  public async getImportDetails(id) {
    // Get a complete summary of an import record
    // GET /crm/v3/imports/:importId
    // https://developers.hubspot.com/docs/api/crm/imports

    await this.connectToV3();
    console.log('Calling hubspotClient.crm.imports.coreApi.getById. Retrieve a import details by id:', id);
    const importResponse = await this.clientV3.crm.imports.coreApi.getById(id);
    console.log('Import Response:', importResponse);
    return importResponse;
  }
}
