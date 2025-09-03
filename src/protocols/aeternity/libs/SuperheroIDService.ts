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
  set_id: (id: string) => void;
  get_id: () => string | undefined;
  has_id: () => boolean;
}

export type SuperheroIdsContract = Contract<SuperheroIdsContractMethods>;

export class SuperheroIDService {
  private contractId = 'ct_kaUS1K6qFXn2wP2phR26WLWXEKu5YsgA2gq4RWvkB69KY2gYF' as const;

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

  async setId(id: string) {
    const account = SuperheroIDService.getCallerAccount();
    const contract = await this.getContractInstance();
    if (!account?.secretKey) throw new Error('Missing secret key for encryption');
    const key = await importAesKeyFromSecret(account.secretKey);
    const ciphertext = await encrypt(key, id);
    await contract.set_id(ciphertext);
  }

  async getId(): Promise<string | undefined> {
    const account = SuperheroIDService.getCallerAccount();
    const contract = await this.getContractInstance();
    const { decodedResult } = await contract.get_id();
    if (!decodedResult) return undefined;
    if (!account?.secretKey) return decodedResult; // fallback if no key
    const key = await importAesKeyFromSecret(account.secretKey);
    try {
      return await decrypt(key, decodedResult);
    } catch {
      return decodedResult;
    }
  }

  async hasId(): Promise<boolean> {
    const contract = await this.getContractInstance();
    const { decodedResult } = await contract.has_id();
    return decodedResult;
  }

  async buildSetIdTx(id: string): Promise<string> {
    const account = SuperheroIDService.getCallerAccount();
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const contract = await this.getContractInstance();
    if (!account?.secretKey) throw new Error('Missing secret key for encryption');
    const key = await importAesKeyFromSecret(account.secretKey);
    const ciphertext = await encrypt(key, id);
    const gasLimit = await contract._estimateGas('set_id', [ciphertext], {
      senderId: account.address as Encoded.AccountAddress,
    });
    const callData = contract._calldata.encode(contract._name, 'set_id', [ciphertext]);
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
