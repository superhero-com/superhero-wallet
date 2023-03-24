import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import { UR, URDecoder, UREncoder } from '@ngraveio/bc-ur';
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
import type { IAccount, IDefaultComposableOptions } from '../types';
import { ACCOUNT_AIR_GAP_WALLET, handleUnknownError } from '../popup/utils';

// eslint-disable-next-line no-unused-vars
export function useAirGap({ store }: IDefaultComposableOptions) {
  /**
   * Decodes a serialized data string that conforms to the "Uniform Resource" format (UR).
   * The function first decodes the UR string using the URDecoder class, then decodes the
   * resulting CBOR data, and finally deserializes the decoded data using a SerializerV3 instance.
   *
   * @param serializedData A string containing the serialized UR data to decode.
   *
   * @returns The deserialized data,
   * or null if the input data is not in the expected format or decoding fails.
   */
  async function decodeURSerializedData(
    serializedData: string,
  ): Promise<IACMessageDefinitionObjectV3[]> {
    if (!serializedData.toUpperCase().startsWith('UR:')) {
      return [];
    }

    const decoder = new URDecoder();
    decoder.receivePart(serializedData);

    if (!decoder.isComplete() || !decoder.isSuccess()) {
      return [];
    }

    const decoded = decoder.resultUR();
    const combinedData = decoded.decodeCBOR();
    const resultUr = bs58check.encode(combinedData);

    const serializer = SerializerV3.getInstance();
    const parsedData: IACMessageDefinitionObjectV3[] = await serializer.deserialize(resultUr);

    return parsedData;
  }

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

      // Create a UR encoder for single-chunk encoding.
      const singleEncoder = new UREncoder(
        ur,
        SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE,
      );
      // If the UR requires multi-chunk encoding,
      // create a new UR encoder with the appropriate chunk size.
      if (singleEncoder.fragmentsLength !== 1) {
        // TODO:: handle when it's multi fragments.
        // const SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE = 250;
        // const multiEncoder = new UREncoder(
        //   ur,
        //   SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE,
        // );
        return null;
      }

      // Encode the UR and return the UR string in upper case.
      const urString = await singleEncoder.nextPart();
      return urString.toUpperCase();
    } catch (error) {
      handleUnknownError(error);
      return null;
    }
  }

  /**
   * Extracts shared addresses groups from encoded UR Data.
   * @param serializedData
   * @returns IAccount[]
   */
  async function extractAccountShareResponseData(
    serializedData: string,
  ): Promise<IAccount[]> {
    const decodedData = await decodeURSerializedData(serializedData);

    if (!decodedData) {
      return [];
    }

    return decodedData
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
    serializedData: string,
  ): Promise<string | null> {
    const decodedData = await decodeURSerializedData(serializedData);

    if (!decodedData) {
      return null;
    }

    const payload = decodedData.find(
      (item) => item.type === IACMessageType.TransactionSignResponse,
    )?.payload as TransactionSignResponse;

    return payload?.transaction || null;
  }

  async function generateEncodedTransactionSignRequestUR(
    publicKey: string,
    transaction: string,
    networkId: string,
  ): Promise<string | null> {
    const id = Math.floor(Math.random() * (99999999 - 10000000 + 1) + 10000000);
    const callbackURL = 'superhero://?d=';
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
    const encodedUR = await encodeIACMessageDefinitionObjects([messageDefinitionObject]);

    return encodedUR || null;
  }

  return {
    decodeURSerializedData,
    encodeIACMessageDefinitionObjects,
    extractAccountShareResponseData,
    generateEncodedTransactionSignRequestUR,
    extractSignedTransactionResponseData,
  };
}
