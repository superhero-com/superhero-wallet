import {
  Contract,
  ContractMethodsBase,
  Encoded,
  Tag,
} from '@aeternity/aepp-sdk';

import SuperheroIdsACI from '@/protocols/aeternity/aci/SuperheroIdsACI.json';
import type { ContractInitializeOptions } from '@/protocols/aeternity/types';
import { useAeSdk } from '@/composables/aeSdk';
import { useAccounts } from '@/composables/accounts';
import { encrypt, decrypt, importAesKeyFromSecret } from '@/utils/crypto';
import type { IAccount } from '@/types';

interface SuperheroIdsContractMethods extends ContractMethodsBase {
  set_data: (key: string, value: string) => void;
  get_data: (key: string) => string | undefined;
  has_data: () => boolean;
  has_key: (key: string) => boolean;
  delete_key: (key: string) => void;
}

export type SuperheroIdsContract = Contract<SuperheroIdsContractMethods>;

export class SuperheroIDService {
  private contractId = 'ct_2jY8Z8ePCjLSq3Twgxc3Pgsa2pVwEtB4nPnEyuH6WSwwaSoK5Z' as const;

  private async getContractInstance(options?: Partial<ContractInitializeOptions>):
    Promise<SuperheroIdsContract> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    return Contract.initialize<SuperheroIdsContractMethods>({
      ...aeSdk.getContext(),
      ...options,
      aci: SuperheroIdsACI,
      address: this.contractId,
    });
  }

  private static getCallerAccount(): IAccount {
    const { aeAccounts } = useAccounts();
    const acc = aeAccounts.value?.[0];
    if (!acc?.address) throw new Error('No æternity account available');
    return acc as IAccount;
  }

  async setData(keyName: string, value: string) {
    const account = SuperheroIDService.getCallerAccount();
    const contract = await this.getContractInstance();
    if (!account?.secretKey) throw new Error('Missing secret key for encryption');
    const aesKey = await importAesKeyFromSecret(account.secretKey);
    const ciphertext = await encrypt(aesKey, value);
    await contract.set_data(keyName, ciphertext);
  }

  async getData(keyName: string): Promise<string | undefined> {
    const account = SuperheroIDService.getCallerAccount();
    const contract = await this.getContractInstance();
    const { decodedResult } = await contract.get_data(keyName);
    if (!decodedResult) return undefined;
    if (!account?.secretKey) return decodedResult; // fallback if no key
    const aesKey = await importAesKeyFromSecret(account.secretKey);
    try {
      return await decrypt(aesKey, decodedResult);
    } catch {
      return decodedResult;
    }
  }

  async hasAnyData(): Promise<boolean> {
    const contract = await this.getContractInstance();
    const { decodedResult } = await contract.has_data();
    return decodedResult;
  }

  async hasKey(keyName: string): Promise<boolean> {
    const contract = await this.getContractInstance();
    const { decodedResult } = await contract.has_key(keyName);
    return decodedResult;
  }

  async deleteKey(keyName: string): Promise<void> {
    const contract = await this.getContractInstance();
    await contract.delete_key(keyName);
  }

  async buildSetDataTx(keyName: string, value: string): Promise<string> {
    const account = SuperheroIDService.getCallerAccount();
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const contract = await this.getContractInstance();
    if (!account?.secretKey) throw new Error('Missing secret key for encryption');
    const aesKey = await importAesKeyFromSecret(account.secretKey);
    const ciphertext = await encrypt(aesKey, value);
    const gasLimit = await contract._estimateGas('set_data', [keyName, ciphertext], {
      senderId: account.address as Encoded.AccountAddress,
    });
    const callData = contract._calldata.encode(contract._name, 'set_data', [keyName, ciphertext]);
    return aeSdk.buildTx({
      tag: Tag.ContractCallTx,
      callerId: account.address as Encoded.AccountAddress,
      contractId: this.contractId,
      abiVersion: 3,
      amount: 0,
      callData,
      gasLimit,
    });
  }

  async deployContract(bytecode: Encoded.ContractBytearray): Promise<Encoded.ContractAddress> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const instance = await Contract.initialize<SuperheroIdsContract>({
      ...aeSdk.getContext(),
      aci: SuperheroIdsACI,
      bytecode,
    });

    await instance.init();
    const { address } = instance.$options;
    this.contractId = address;
    return address;
  }

  async deployFromSource(sourceCode: string): Promise<Encoded.ContractAddress> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const instance = await Contract.initialize<SuperheroIdsContract>({
      ...aeSdk.getContext(),
      aci: SuperheroIdsACI,
      sourceCode,
    });
    await instance.init();
    const { address } = instance.$options;
    this.contractId = address;
    return address;
  }
}
