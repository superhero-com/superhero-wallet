import { Encoded } from '@aeternity/aepp-sdk';
import { UR, UREncoder } from '@ngraveio/bc-ur';
import bs58check from 'bs58check';
import type { AccountShareResponse } from 'airgap-coin-lib';
import type {
  IACMessageDefinitionObjectV3,
  SerializerV3 as SerializerV3Instance,
} from '@airgap/serializer';

import type { IAccountRaw } from '@/types';
import { handleUnknownError } from '@/utils';
import { ACCOUNT_TYPES, MOBILE_SCHEMA, PROTOCOLS } from '@/constants';

// Set the chunk sizes for single-chunk and multi-chunk encoding.
const SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE = 500;
const SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE = 250;

/**
 * The AirGap libraries drag in a ~1.5 MB dependency tree (airgap-coin-lib,
 * @polkadot/wasm-crypto, libsodium, moment …). They are imported on demand so
 * that tree stays out of the initial bundle and only loads when an AirGap flow
 * is actually used. The promises memoise the dynamic imports.
 */
let aeternityModulePromise: Promise<typeof import('@airgap/aeternity')>;
const loadAeternityModule = () => {
  if (!aeternityModulePromise) {
    aeternityModulePromise = import('@airgap/aeternity');
  }
  return aeternityModulePromise;
};

let coinLibPromise: Promise<typeof import('airgap-coin-lib')>;
const loadCoinLib = () => {
  if (!coinLibPromise) {
    coinLibPromise = import('airgap-coin-lib');
  }
  return coinLibPromise;
};

let serializerModulePromise: Promise<typeof import('@airgap/serializer')>;
const loadSerializerModule = () => {
  if (!serializerModulePromise) {
    serializerModulePromise = import('@airgap/serializer');
  }
  return serializerModulePromise;
};

// Memoises the whole init — including schema registration — as a single
// promise. Guarding on the resolved `serializer` value instead left a window,
// while the lazy chunk above is loading, where two concurrent callers both
// ran `SerializerV3.addSchema` and the second threw SCHEMA_ALREADY_EXISTS.
let serializerPromise: Promise<SerializerV3Instance> | undefined;

export function useAirGap() {
  async function getSerializer(): Promise<SerializerV3Instance> {
    if (!serializerPromise) {
      serializerPromise = (async () => {
        const [{ AeternityModule }, { SerializerV3 }, { MainProtocolSymbols }] = await Promise.all([
          loadAeternityModule(),
          loadSerializerModule(),
          loadCoinLib(),
        ]);
        const serializerV3Companion = await new AeternityModule().createV3SerializerCompanion();
        serializerV3Companion.schemas.forEach((schema) => {
          SerializerV3.addSchema(schema.type, schema.schema, MainProtocolSymbols.AE);
        });
        return SerializerV3.getInstance();
      })();
      // Don't cache a rejected init — clear it so a later call can retry
      // instead of returning the same failed promise for the rest of the session.
      serializerPromise.catch(() => { serializerPromise = undefined; });
    }
    return serializerPromise;
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

  async function deserializeData(data: string): Promise<IACMessageDefinitionObjectV3[]> {
    const localSerializer = await getSerializer();
    // Since @airgap/serializer 0.13.4x, `deserialize` resolves to
    // `{ deserialize, skippedPayload }` where each entry is a `Result`
    // (`{ ok: true, value } | { ok: false, error }`). Unwrap the successful
    // messages and silently drop any payloads that failed to deserialize.
    const { deserialize } = await localSerializer.deserialize(data);
    return deserialize.flatMap((result) => (result.ok ? [result.value] : []));
  }

  /**
   * Extracts shared accounts from deserialized data.
   */
  async function extractAccountShareResponseData(
    data: IACMessageDefinitionObjectV3[] = [],
  ): Promise<IAccountRaw[]> {
    const { IACMessageType, AeternityProtocol } = await loadCoinLib();
    return Promise.all(
      data
        .filter((item) => item.type === IACMessageType.AccountShareResponse)
        .map(async (item) => {
          const aeProtocol = new AeternityProtocol();
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
    const { IACMessageType } = await loadCoinLib();
    return (data.find(
      (item) => item.type === IACMessageType.TransactionSignResponse,
    )?.payload as any)?.transaction;
  }

  async function generateTransactionURDataFragments(
    publicKey: Uint8Array,
    transaction: string,
    networkId: string,
  ): Promise<string[]> {
    const { MainProtocolSymbols, IACMessageType } = await loadCoinLib();
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
