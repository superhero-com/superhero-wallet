import {
  Contract,
  Encoded,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk';

import SuperheroIdsACI from '@/protocols/aeternity/aci/SuperheroIdsACI.json';
import type { ContractInitializeOptions } from '@/protocols/aeternity/types';
import { useAeSdk } from '@/composables/aeSdk';
import { useAccounts } from '@/composables/accounts';
import { encrypt, decrypt, importAesKeyFromSecret } from '@/utils/crypto';

export type SuperheroIdsContract = Contract<{
  set_id: (who: Encoded.AccountAddress, id: string) => Promise<void>;
  get_id: (who: Encoded.AccountAddress) => Promise<{ decodedResult: string | undefined }>;
  has_id: (who: Encoded.AccountAddress) => Promise<{ decodedResult: boolean }>;
}>;

export class SuperheroIDService {
  private contractId?: Encoded.ContractAddress;

  constructor(contractId?: Encoded.ContractAddress) {
    this.contractId = contractId;
  }

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

  async setId(forAddress: Encoded.AccountAddress, id: string) {
    const contract = await this.getContractInstance();
    const { getAccountByAddress } = useAccounts();
    const account = getAccountByAddress(forAddress as any);
    if (!account?.secretKey) throw new Error('Missing secret key for encryption');
    const key = await importAesKeyFromSecret(account.secretKey);
    const ciphertext = await encrypt(key, id);
    await contract.set_id(forAddress, ciphertext);
  }

  async getId(forAddress: Encoded.AccountAddress): Promise<string | undefined> {
    const contract = await this.getContractInstance();
    const { decodedResult } = await contract.get_id(forAddress);
    if (!decodedResult) return undefined;
    const { getAccountByAddress } = useAccounts();
    const account = getAccountByAddress(forAddress as any);
    if (!account?.secretKey) return decodedResult; // fallback if no key
    const key = await importAesKeyFromSecret(account.secretKey);
    try {
      return await decrypt(key, decodedResult);
    } catch {
      return decodedResult;
    }
  }

  async estimateSetIdFee(forAddress: Encoded.AccountAddress, id: string): Promise<string> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const contract = await this.getContractInstance();
    const { getAccountByAddress } = useAccounts();
    const account = getAccountByAddress(forAddress as any);
    if (!account?.secretKey) throw new Error('Missing secret key for encryption');
    const key = await importAesKeyFromSecret(account.secretKey);
    const ciphertext = await encrypt(key, id);

    // estimate gas
    const gasLimit = await (contract as any)._estimateGas('set_id', [forAddress, ciphertext], {
      senderId: forAddress,
    });
    // build tx to compute fee
    const callData = (contract as any)._calldata.encode((contract as any)._name, 'set_id', [forAddress, ciphertext]);
    const built = await aeSdk.buildTx({
      tag: Tag.ContractCallTx,
      callerId: forAddress,
      contractId: this.contractId!,
      abiVersion: 3,
      amount: 0,
      callData,
      gasLimit,
    } as any);
    const tx = unpackTx(built, Tag.ContractCallTx);
    return (tx.fee as any).toString();
  }

  async buildSetIdTx(forAddress: Encoded.AccountAddress, id: string): Promise<string> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const contract = await this.getContractInstance();
    const { getAccountByAddress } = useAccounts();
    const account = getAccountByAddress(forAddress as any);
    if (!account?.secretKey) throw new Error('Missing secret key for encryption');
    const key = await importAesKeyFromSecret(account.secretKey);
    const ciphertext = await encrypt(key, id);
    const gasLimit = await (contract as any)._estimateGas('set_id', [forAddress, ciphertext], {
      senderId: forAddress,
    });
    const callData = (contract as any)._calldata.encode((contract as any)._name, 'set_id', [forAddress, ciphertext]);
    const built = await aeSdk.buildTx({
      tag: Tag.ContractCallTx,
      callerId: forAddress,
      contractId: this.contractId!,
      abiVersion: 3,
      amount: 0,
      callData,
      gasLimit,
    } as any);
    return built;
  }

  async hasId(forAddress: Encoded.AccountAddress): Promise<boolean> {
    const contract = await this.getContractInstance();
    const { decodedResult } = await contract.has_id(forAddress);
    return decodedResult;
  }

  async deployContract(bytecode: Encoded.ContractBytearray): Promise<Encoded.ContractAddress> {
    const { getAeSdk } = useAeSdk();
    const aeSdk = await getAeSdk();
    const instance = await Contract.initialize({
      ...aeSdk.getContext(),
      aci: SuperheroIdsACI as any,
      bytecode,
    }) as any;

    // init has no args; calling it deploys the contract when bytecode is provided
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
