import * as grpc from 'grpc';
import * as Hubspot from 'hubspot';
import { Client } from '@hubspot/api-client';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import {
  AssociationAwareMixin,
  CompanyAwareMixin,
  ContactAwareMixin,
  ContactListAwareMixin,
  CustomEventAwareMixin,
  DateAwareMixin,
  DealAwareMixin,
  MarketingEventAwareMixin,
  ProductAwareMixin,
  QuoteAwareMixin,
  TicketAwareMixin,
  WorkflowAwareMixin,
  ImportsAwareMixinV3,
  StatsAwareMixinV3,
} from './mixins';

class ClientWrapper {
  public static expectedAuthFields: Field[] = [{
    field: 'accessToken',
    type: FieldDefinition.Type.STRING,
    description: 'Access Token',
  }];

  client: Hubspot.default;
  clientV3: Client;
  clientReady: Promise<boolean>;
  auth: grpc.Metadata;

  connectToV3 = async () => {
    if (this.auth.get('refreshToken').toString()) {
      this.clientV3 = new Client();
      const result = await this.clientV3.oauth.tokensApi.create(
        'refresh_token',
        undefined,
        this.auth.get('redirectUri').toString(),
        this.auth.get('clientId').toString(),
        this.auth.get('clientSecret').toString(),
        this.auth.get('refreshToken').toString(),
      );
      console.log('Updated refresh token', result);
      // this assigns the accessToken to the client, so your client is ready
      // to use
      this.clientV3.setAccessToken(result.accessToken);
      return;
    }
    // Fallback to Private App Api Token
    this.clientV3 = new Client({
      accessToken: this.auth.get('accessToken').toString(),
    });
  }

  constructor(auth: grpc.Metadata, clientConstructor = Hubspot.default) {
    this.auth = auth;
    // Support OAuth-based authentication under the hood.
    if (auth.get('refreshToken').toString()) {
      this.client = new clientConstructor({
        clientId: auth.get('clientId').toString(),
        clientSecret: auth.get('clientSecret').toString(),
        redirectUri: auth.get('redirectUri').toString(),
        refreshToken: auth.get('refreshToken').toString(),
      });
      this.clientReady = new Promise((resolve, reject) => {
        // @todo use normal method call once this issue is resolved:
        // https://github.com/MadKudu/node-hubspot/issues/193
        this.client['refreshAccessToken']()
          .then(() => resolve(true))
          .catch(e => reject(Error(`Authentication error, unable to refresh access token: ${e.toString()}`)));
      });
    } else {
      // Fallback to Private App Api Token
      this.client = new clientConstructor({
        accessToken: auth.get('accessToken').toString(),
      });
      this.clientReady = Promise.resolve(true);
    }
  }
}

interface ClientWrapper extends
  ContactAwareMixin,
  WorkflowAwareMixin,
  DateAwareMixin,
  TicketAwareMixin,
  CompanyAwareMixin,
  DealAwareMixin,
  ProductAwareMixin,
  MarketingEventAwareMixin,
  QuoteAwareMixin,
  AssociationAwareMixin,
  ContactListAwareMixin,
  ImportsAwareMixinV3,
  StatsAwareMixinV3,
  CustomEventAwareMixin { }

applyMixins(ClientWrapper, [
  ContactAwareMixin,
  WorkflowAwareMixin,
  DateAwareMixin,
  TicketAwareMixin,
  CompanyAwareMixin,
  DealAwareMixin,
  ProductAwareMixin,
  MarketingEventAwareMixin,
  QuoteAwareMixin,
  AssociationAwareMixin,
  ContactListAwareMixin,
  ImportsAwareMixinV3,
  StatsAwareMixinV3,
  CustomEventAwareMixin,
]);

function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      // tslint:disable-next-line:max-line-length
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
    });
  });
}

export { ClientWrapper as ClientWrapper };
