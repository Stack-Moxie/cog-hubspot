import { Client } from '@hubspot/api-client';
import * as grpc from 'grpc';

export class StatsAwareMixinV3 {
  clientV3: Client;
  connectToV3: () => Promise<void>;
  auth: grpc.Metadata;

  public async getApiUsage() {
    // Get the daily API limit and limit remaining for a HubSpot Access Token.
    //
    // Oauth connections have unlimited daily API calls. This function will
    // return 'unlimited' for the limit if an oauth connection is used.
    //
    // Private apps connected with an access token will return their api usage.
    // The api usage values are pulled from the response headers when we make a
    // do nothing request to GET /integrations/v1/me
    //
    // The https://api.hubapi.com/account-info/v3/api-usage/daily endpoint doesn't work.
    // See: https://community.hubspot.com/t5/APIs-Integrations/Daily-API-Usage-data-get-API/m-p/797324

    if (this.auth.get('refreshToken').toString()) {
      return {
        limit: 'unlimited',
        remaining: 'unlimited',
      };
    }

    try {
      await this.connectToV3();
      const response = await this.clientV3.apiRequest({
        method: 'GET',
        path: '/integrations/v1/me',
      });

      const limit = Number(response.headers.get('x-hubspot-ratelimit-daily'));
      const remaining = Number(response.headers.get('x-hubspot-ratelimit-daily-remaining'));
      return {
        limit,
        remaining,
      };
    } catch (e) {
      throw new Error(`Error calling GET /integrations/v1/me: ${e.message}`);
    }
  }
}
