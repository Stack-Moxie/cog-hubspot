import { Client } from '@hubspot/api-client';

export class ImportsAwareMixinV3 {
  clientV3: Client;
  connectToV3: () => Promise<void>;

  public async getImportDetails(id: number) {
    // Get a complete summary of an import record
    // GET /crm/v3/imports/:importId
    // https://developers.hubspot.com/docs/api/crm/imports

    await this.connectToV3();
    console.log('Calling hubspotClient.crm.imports.coreApi.getById. Retrieve a import details by id:', id);

    try {
      const importResponse = await this.clientV3.crm.imports.coreApi.getById(id);
      console.log('Import Response:', importResponse);
      return importResponse;
    } catch (e) {
      console.error('Error calling hubspotClient.crm.imports.coreApi.getById: ', e.message);
    }
  }

  public async postImports(columnsToProperties: {}, idColumn: string, fileBuffer: string) {
    // Create a new import
    // POST /crm/v3/imports
    // https://developers.hubspot.com/docs/api/crm/imports

    await this.connectToV3();
    console.log('Calling hubspotClient.crm.imports.coreApi.create. Create or Update a new import:');
    const file = {
      data: Buffer.from(fileBuffer, 'utf8'),
      name: `imports-${new Date().toISOString()}.csv`,
    };

    // TODO: create file metadata
    const fileMetadata = {};

    try {
      const importResponse = await this.clientV3.crm.imports.coreApi.create(file, JSON.stringify(fileMetadata));
      console.log('Import Response:', importResponse);
      return importResponse;
    } catch (e) {
      console.error('Error calling hubspotClient.crm.imports.coreApi.create: ', e.message);
    }
  }
}
