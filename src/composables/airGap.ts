import { Encoded } from '@aeternity/aepp-sdk';
import { UR, UREncoder } from '@ngraveio/bc-ur';
import bs58check from 'bs58check';
import { AeternityModule } from '@airgap/aeternity';
import {
  MainProtocolSymbols,
  IACMessageType,
  type AccountShareResponse,
} from 'airgap-coin-lib';
import { SerializerV3, IACMessageDefinitionObjectV3 } from '@airgap/serializer';

import type { IAccountRaw } from '@/types';
import { handleUnknownError } from '@/utils';
import { ACCOUNT_TYPES, MOBILE_SCHEMA, PROTOCOLS } from '@/constants';

// Set the chunk sizes for single-chunk and multi-chunk encoding.
const SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE = 500;
const SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE = 250;

let serializer: SerializerV3;

export function useAirGap() {
  async function getSerializer(): Promise<SerializerV3> {
    if (!serializer) {
      const serializerV3Companion = await new AeternityModule().createV3SerializerCompanion();
      serializerV3Companion.schemas.forEach((schema) => {
        SerializerV3.addSchema(schema.type, schema.schema, MainProtocolSymbols.AE);
      });
      serializer = SerializerV3.getInstance();
    }
    return serializer;
  }
  /**
   * Encodes an array of IACMessageDefinitionObjectV3 objects into a UR string.
   */
  async function encodeIACMessageDefinitionObjects(
    data: IACMessageDefinitionObjectV3[],
  ): Promise<string[]> {
    try {
      const localSerializer = await getSerializer();
      const serializedData = await localSerializer.serialize(data);

      const dataUint8Array = bs58check.decode(serializedData!);
      const ur = UR.fromBuffer(Buffer.from(dataUint8Array));

      // Create a UR encoder for single-chunk encoding.
      const singleEncoder = new UREncoder(
        ur,
        SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE,
      );
      // If the UR requires multi-chunk encoding,
      // create a new UR encoder with the appropriate chunk size.
      if (singleEncoder.fragmentsLength !== 1) {
        const multiEncoder = new UREncoder(
          ur,
          SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE,
        );

        return [...Array(multiEncoder.fragmentsLength)].map(() => multiEncoder.nextPart());
      }

      // Encode the UR and return the UR string in upper case.
      return [singleEncoder.nextPart().toUpperCase()];
    } catch (error) {
      handleUnknownError(error);
      return [];
    }
  }

  async function deserializeData(data: string) {
    const localSerializer = await getSerializer();
    return localSerializer.deserialize(data);
  }

  /**
   * Extracts shared accounts from deserialized data.
   */
  async function extractAccountShareResponseData(
    data: IACMessageDefinitionObjectV3[] = [],
  ): Promise<IAccountRaw[]> {
    const { AeternityProtocol } = await import(/* webpackChunkName: "airgap-coin-lib" */ 'airgap-coin-lib');
    const aeProtocol = new AeternityProtocol();

    return Promise.all(
      data
        .filter((item) => item.type === IACMessageType.AccountShareResponse)
        .map(async (item) => {
          const address = await aeProtocol.getAddressFromPublicKey(
            (item.payload as AccountShareResponse).publicKey,
          ) as Encoded.AccountAddress;

          return {
            address,
            type: ACCOUNT_TYPES.airGap,
            publicKey: (item.payload as AccountShareResponse).publicKey,
            protocol: PROTOCOLS.aeternity,
            isRestored: false,
          };
        }),
    );
  }

  /**
   * Extracts the signed transaction response data from deserialized data
   * and returns the transaction object.
   */
  async function extractSignedTransactionResponseData(
    data: IACMessageDefinitionObjectV3[] = [],
  ): Promise<string | null> {
    return (data.find(
      (item) => item.type === IACMessageType.TransactionSignResponse,
    )?.payload as any)?.transaction;
  }

  async function generateTransactionURDataFragments(
    publicKey: Uint8Array,
    transaction: string,
    networkId: string,
  ): Promise<string[]> {
    const id = Math.floor(Math.random() * 90000000 + 10000000);
    const callbackURL = `${MOBILE_SCHEMA}?d=`;
    const payload = {
      callbackURL,
      publicKey: Buffer.from(publicKey).toString('hex'),
      transaction: {
        networkId,
        transaction,
      },
    };
    const messageDefinitionObject: IACMessageDefinitionObjectV3 = {
      id,
      payload,
      protocol: MainProtocolSymbols.AE,
      type: IACMessageType.TransactionSignRequest,
    };

    return encodeIACMessageDefinitionObjects([messageDefinitionObject]);
  }

  return {
    getSerializer,
    deserializeData,
    encodeIACMessageDefinitionObjects,
    extractAccountShareResponseData,
    generateTransactionURDataFragments,
    extractSignedTransactionResponseData,
  };
}
