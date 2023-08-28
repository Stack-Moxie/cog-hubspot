import { Client } from '@hubspot/api-client';

export class ImportsAwareMixinV3 {
  clientV3: Client;
  connectToV3: () => Promise<void>;

  public async getImportErrors(id: string) {
    // Get a complete summary of an import record
    // GET /crm/v3/imports/:importId
    // https://developers.hubspot.com/docs/api/crm/imports

    try {
      await this.connectToV3();
      const importResponse = await this.clientV3.crm.imports.publicImportsApi.getErrors(Number(id));
      return importResponse;
    } catch (e) {
      console.error('Error calling hubspotClient.crm.imports.publicImportsApi.getErrors: ', e.message);
    }
  }

  public async getImportDetails(id: string) {
    // Get a complete summary of an import record
    // GET /crm/v3/imports/:importId
    // https://developers.hubspot.com/docs/api/crm/imports

    try {
      await this.connectToV3();
      const importResponse = await this.clientV3.crm.imports.coreApi.getById(Number(id));
      return importResponse;
    } catch (e) {
      console.error('Error calling hubspotClient.crm.imports.coreApi.getById: ', e.message);
    }
  }

  public async postImports(columnMap: {}, contacts: {}, idColumn: string) {
    // Create a new import
    // POST /crm/v3/imports
    // https://developers.hubspot.com/docs/api/crm/imports

    const fileName = `imports-${new Date().toISOString()}.csv`;
    const finalizedContacts = Object.values(contacts);
    const finalizedContactCsvArray = [];

    finalizedContacts.forEach((contact) => {
      const contactArray = Object.values(contact);
      finalizedContactCsvArray.push(contactArray.join(','));
    });

    const csvString = finalizedContactCsvArray.join('\n');
    // converting CSV to Buffer so we can send data as a file
    const file = {
      data: Buffer.from(csvString, 'utf8'),
      name: fileName,
    };

    // Create the column mappings array based on the given columnsToProperties
    const columnMapArray = Object.keys(columnMap).map((property) => {
      return {
        columnObjectTypeId: '0-1', // 0-1 is the object type id for contacts
        columnName: columnMap[property].csvColumn,
        propertyName: property,

        // specify the identifier on the front end
        columnType: property.toLowerCase().includes(idColumn) ? 'HUBSPOT_ALTERNATE_ID' : undefined, // Special case for the ID column
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
            hasHeader: false,
            columnMappings: columnMapArray,
          },
        },
      ],
    };

    try {
      await this.connectToV3();
      const importResponse = await this.clientV3.crm.imports.coreApi.create(file, JSON.stringify(fileMetadata));
      return importResponse;
    } catch (e) {
      console.error('Error calling hubspotClient.crm.imports.coreApi.create: ', e.message);
    }
  }
}
