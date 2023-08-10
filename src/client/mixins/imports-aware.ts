import { Client } from '@hubspot/api-client';

export class ImportsAwareMixinV3 {
  clientV3: Client;
  connectToV3: () => Promise<void>;

  public async getImportDetails(id: number) {
    // Get a complete summary of an import record
    // GET /crm/v3/imports/:importId
    // https://developers.hubspot.com/docs/api/crm/imports

    try {
      await this.connectToV3();
      console.log('Calling hubspotClient.crm.imports.coreApi.getById. Retrieve a import details by id:', id);
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

    const fileName = `imports-${new Date().toISOString()}.csv`;
    // converting CSV to Buffer so we can send data as a file
    const file = {
      data: Buffer.from(fileBuffer, 'utf8'),
      name: fileName,
    };

    // Create the column mappings array based on the given columnsToProperties
    const columnMapArray = Object.keys(columnsToProperties).map((column) => {
      return {
        columnObjectTypeId: '0-1', // 0-1 is the object type id for contacts
        columnName: column,
        propertyName: columnsToProperties[column],

        // specify the identifier on the front end
        columnType: column.toLowerCase().includes(idColumn) ? 'HUBSPOT_ALTERNATE_ID' : undefined, // Special case for the ID column
      };
    });

  // Construct the fileMetadata object
    const fileMetadata = {
      name: fileName,
      importOperations: { '0-1': 'UPSERT' },
      dateFormat: 'DAY_MONTH_YEAR',
      files: [
        {
          fileName,
          fileFormat: 'CSV',
          fileImportPage: {
            hasHeader: true,
            columnMappings: columnMapArray,
          },
        },
      ],
    };

    try {
      await this.connectToV3();
      console.log('Calling hubspotClient.crm.imports.coreApi.create. Create or Update a new import:');
      const importResponse = await this.clientV3.crm.imports.coreApi.create(file, JSON.stringify(fileMetadata));
      console.log('Import Response:', importResponse);
      return importResponse;
    } catch (e) {
      console.error('Error calling hubspotClient.crm.imports.coreApi.create: ', e.message);
    }
  }
}
