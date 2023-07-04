import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import { UR, UREncoder } from '@ngraveio/bc-ur';
import bs58check from 'bs58check';
import { IACMessageType, SerializerV3 } from '@airgap/serializer';
import type {
  AccountShareResponse,
  IACMessageDefinitionObjectV3,
  TransactionSignResponse,
  TransactionSignRequest,
} from '@airgap/serializer';
import { AeternityAddress } from '@airgap/aeternity';
import { MainProtocolSymbols } from '@airgap/coinlib-core';
import type { IAccount } from '../types';
import { ACCOUNT_AIR_GAP_WALLET, MOBILE_SCHEMA, handleUnknownError } from '../popup/utils';

export function useAirGap() {
  /**
   * Encodes an array of IACMessageDefinitionObjectV3 objects into a UR string.
   * @param data - The array of IACMessageDefinitionObjectV3 objects to encode.
   * @returns The UR string or null if an error occurs.
   */
  async function encodeIACMessageDefinitionObjects(data: IACMessageDefinitionObjectV3[]) {
    try {
      const serializer = SerializerV3.getInstance();
      const serializedData = await serializer.serialize(data);

      const buffer = await bs58check.decode(serializedData);
      const ur = UR.fromBuffer(buffer);

      // Set the chunk sizes for single-chunk and multi-chunk encoding.
      const SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE = 500;
      const SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE = 250;

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
        const fragments = [];

        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (
          // eslint-disable-next-line  @typescript-eslint/no-unused-vars
          const _index in [...Array(multiEncoder.fragmentsLength)]
        ) {
          // eslint-disable-next-line no-await-in-loop
          fragments.push(await multiEncoder.nextPart());
        }
        return fragments;
      }

      // Encode the UR and return the UR string in upper case.
      return [(await singleEncoder.nextPart()).toUpperCase()];
    } catch (error) {
      handleUnknownError(error);
      return [];
    }
  }

  /**
   * Extracts shared addresses groups from encoded UR Data.
   * @param serializedData
   * @returns IAccount[]
   */
  async function extractAccountShareResponseData(
    data: IACMessageDefinitionObjectV3[] = [],
  ): Promise<IAccount[]> {
    return data
      .filter((item) => item.type === IACMessageType.AccountShareResponse)
      .map((item) => {
        const address = AeternityAddress.from(
          (item.payload as AccountShareResponse).publicKey,
        ).asString();
        const publicKey = Buffer.from(decode(address, 'ak'));

        return {
          address,
          publicKey,
          name: '',
          showed: true,
          type: ACCOUNT_AIR_GAP_WALLET,
          airGapPublicKey: (item.payload as AccountShareResponse).publicKey,
        } as IAccount;
      });
  }

  /**
   * Extracts the signed transaction response data from a serialized string
   * and returns the transaction object.
   * @param serializedData - The serialized string to extract data from.
   * @returns The transaction object or null if no transaction object is found.
   */
  async function extractSignedTransactionResponseData(
    data: IACMessageDefinitionObjectV3[] = [],
  ): Promise<string | null> {
    const payload = data.find(
      (item) => item.type === IACMessageType.TransactionSignResponse,
    )?.payload as TransactionSignResponse;

    return payload?.transaction || null;
  }

  async function generateTransactionURDataFragments(
    publicKey: string,
    transaction: string,
    networkId: string,
  ): Promise<string[]> {
    const id = Math.floor(Math.random() * 90000000 + 10000000);
    const callbackURL = `${MOBILE_SCHEMA}?d=`;
    const payload: TransactionSignRequest = {
      callbackURL,
      publicKey,
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
    encodeIACMessageDefinitionObjects,
    extractAccountShareResponseData,
    generateTransactionURDataFragments,
    extractSignedTransactionResponseData,
  };
}
