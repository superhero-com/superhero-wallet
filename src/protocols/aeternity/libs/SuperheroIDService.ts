import {
  Contract,
  Encoded,
  Tag,
} from '@aeternity/aepp-sdk';

import SuperheroIdsACI from '@/protocols/aeternity/aci/SuperheroIdsACI.json';
import type { ContractInitializeOptions } from '@/protocols/aeternity/types';
import { useAeSdk } from '@/composables/aeSdk';
import { useAccounts } from '@/composables/accounts';
import { encrypt, decrypt, importAesKeyFromSecret } from '@/utils/crypto';
import { PROTOCOLS } from '@/constants';
import type { IAccount } from '@/types';

export type SuperheroIdsContract = Contract<{
  set_id: (id: string) => Promise<void>;
  get_id: () => Promise<{ decodedResult: string | undefined }>;
  has_id: () => Promise<{ decodedResult: boolean }>;
}>;

export class SuperheroIDService {
  private contractId: Encoded.ContractAddress = 'ct_kaUS1K6qFXn2wP2phR26WLWXEKu5YsgA2gq4RWvkB69KY2gYF';

  private async getContractInstance(options?: Partial<ContractInitializeOptions>):
    Promise<SuperheroIdsContract> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    return Contract.initialize({
      ...aeSdk.getContext(),
      ...(options || {}),
      aci: SuperheroIdsACI as any,
      address: this.contractId,
    }) as unknown as SuperheroIdsContract;
  }

  private static getCallerAccount(): IAccount {
    const { getLastActiveProtocolAccount } = useAccounts();
    const acc = getLastActiveProtocolAccount(PROTOCOLS.aeternity);
    if (!acc?.address) throw new Error('No active æternity account');
    return acc;
  }

  async setId(id: string) {
    const account = SuperheroIDService.getCallerAccount();
    const contract = await this.getContractInstance();
    if (!account?.secretKey) throw new Error('Missing secret key for encryption');
    const key = await importAesKeyFromSecret(account.secretKey);
    const ciphertext = await encrypt(key, id);
    await (contract as any)
      .set_id(ciphertext, { fromAccount: account.address as Encoded.AccountAddress });
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
    const gasLimit = await (contract as any)._estimateGas('set_id', [ciphertext], {
      senderId: account.address as Encoded.AccountAddress,
    });
    const callData = (contract as any)._calldata.encode((contract as any)._name, 'set_id', [ciphertext]);
    const built = await aeSdk.buildTx({
      tag: Tag.ContractCallTx,
      callerId: account.address as Encoded.AccountAddress,
      contractId: this.contractId!,
      abiVersion: 3,
      amount: 0,
      callData,
      gasLimit,
    } as any);
    return built;
  }

  async deployContract(bytecode: Encoded.ContractBytearray): Promise<Encoded.ContractAddress> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const instance = await Contract.initialize({
      ...aeSdk.getContext(),
      aci: SuperheroIdsACI as any,
      bytecode,
    }) as any;

    await instance.init();
    const address = instance.$options.address as Encoded.ContractAddress;
    this.contractId = address;
    return address;
  }

  async deployFromSource(sourceCode: string): Promise<Encoded.ContractAddress> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const instance = await Contract.initialize({
      ...aeSdk.getContext(),
      aci: SuperheroIdsACI as any,
      sourceCode,
    }) as any;
    await instance.init();
    const address = instance.$options.address as Encoded.ContractAddress;
    this.contractId = address;
    return address;
  }
}
