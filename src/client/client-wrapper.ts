import * as grpc from 'grpc';
import * as Hubspot from 'hubspot';
import { Field } from '../core/base-step';
import { FieldDefinition } from '../proto/cog_pb';
import {
  AssociationAwareMixin,
  CompanyAwareMixin,
  ContactAwareMixin,
  ContactListAwareMixin,
  DateAwareMixin,
  DealAwareMixin,
  MarketingEventAwareMixin,
  ProductAwareMixin,
  QuoteAwareMixin,
  TicketAwareMixin,
  WorkflowAwareMixin,
} from './mixins';

class ClientWrapper {
  public static expectedAuthFields: Field[] = [{
    field: 'apiKey',
    type: FieldDefinition.Type.STRING,
    description: 'API Key',
  }];

  client: Hubspot.default;
  clientReady: Promise<boolean>;

  constructor(auth: grpc.Metadata, clientConstructor = Hubspot.default) {
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
      // But fallback to API Key-based authentication, which is what is
      // officially supported.
      this.client = new clientConstructor({
        apiKey: auth.get('apiKey').toString(),
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
  ContactListAwareMixin { }

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
