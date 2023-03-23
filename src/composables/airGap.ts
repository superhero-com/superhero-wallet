import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import { UR, URDecoder, UREncoder } from '@ngraveio/bc-ur';
import bs58check from 'bs58check';
import { IACMessageType, SerializerV3, TransactionSignRequest } from '@airgap/serializer';
import type {
  AccountShareResponse,
  IACMessageDefinitionObjectV3,
} from '@airgap/serializer';
import { AeternityAddress } from '@airgap/aeternity';
import { MainProtocolSymbols } from '@airgap/coinlib-core';
import type { IAccount, IDefaultComposableOptions } from '../types';
import { ACCOUNT_AIR_GAP_WALLET } from '../popup/utils';

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
   * Encodes an array of IAC message definition objects into a Uniform Resource (UR) format.
   */
  async function encodeIACMessageDefinitionObjects(data: IACMessageDefinitionObjectV3[]) {
    const serializer = SerializerV3.getInstance();
    const serializedData = await serializer.serialize(data);

    const buffer = await bs58check.decode(serializedData);
    const ur = UR.fromBuffer(buffer);

    const SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE = 500;
    const SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE = 250;
    const encoder = new UREncoder(
      ur,
      SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE,
    );

    if (encoder.fragmentsLength !== 1) {
      return new UREncoder(
        ur,
        SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE,
      );
    }

    return encoder;
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

  async function extractSignedTransactionResponseData(
    serializedData: string,
  ): Promise<any[]> {
    const decodedData = await decodeURSerializedData(serializedData);

    if (!decodedData) {
      return [];
    }

    return decodedData
      .filter((item) => item.type === IACMessageType.TransactionSignResponse)
      .map((item) => {
        console.info('========================');
        console.info('extractSignedTransactionResponseData item ::', item);
        console.info('========================');
        return item;
        // const address = AeternityAddress.from(
        //   (item.payload as AccountShareResponse).publicKey,
        // ).asString();
        // const publicKey = Buffer.from(decode(address, 'ak'));

        // return {
        //   address,
        //   publicKey,
        //   name: '',
        //   showed: true,
        //   type: ACCOUNT_AIR_GAP_WALLET,
        //   airGapPublicKey: (item.payload as AccountShareResponse).publicKey,
        // } as IAccount;
      });
  }

  function getRandomInt(_min: number, _max: number) {
    const min = Math.ceil(_min);
    const max = Math.floor(_max);
    return Math.floor(Math.random() * (max - min) + min);
  }

  async function generateTransactionSignRequestUR(
    publicKey: string,
    transaction: string,
    networkId: string,
  ) {
    const encodedUR = await encodeIACMessageDefinitionObjects([
      {
        id: getRandomInt(10000000, 99999999),
        payload: {
          callbackURL: 'superhero://?d=',
          publicKey,
          transaction: {
            networkId,
            transaction,
          },
        } as TransactionSignRequest,
        protocol: MainProtocolSymbols.AE,
        type: IACMessageType.TransactionSignRequest,
      },
    ]);

    return encodedUR;
  }

  return {
    decodeURSerializedData,
    encodeIACMessageDefinitionObjects,
    extractAccountShareResponseData,
    generateTransactionSignRequestUR,
    extractSignedTransactionResponseData,
  };
}
