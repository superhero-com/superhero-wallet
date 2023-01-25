import { ref } from '@vue/composition-api';
import multisigContract from '@aeternity/ga-multisig-contract/SimpleGAMultiSig.aes';
import type { Store } from 'vuex';
import type {
  ITransaction,
} from '../types';
import { useSdk } from './sdk';

export interface UseMultisigContractOptions {
  store: Store<any>
}

export function useMultisigContract({
  store,
}: UseMultisigContractOptions) {
  const { getSdk } = useSdk({ store });
  // need to be fetched from multisig backend
  const receivingAddress = ref('ak_RECIEPJ3sGVhtzNq6n3QZNWYvBixT9TbUgqU9bGLovdNU1FehsF');
  const proposedBy = ref('ak_PropsJ3sGVhtzNq6n3QZNWYvBixT9TbUgqU9bGLovdNU1FehsF');
  const signers = ref<string[]>([]);
  const confirmedBy = ref<string[]>([]);
  const confirmationsRequired = ref<number>(2);
  const consensus = ref<any>(null);

  async function loadMultisigContract(transaction: ITransaction) {
    if (!transaction.tx?.tx?.tx?.contractId) return;
    const multisigTx = transaction.tx.tx.tx;
    const sdk = await getSdk();
    const contractInstance = await sdk.getContractInstance({
      source: multisigContract,
      contractAddress: multisigTx.contractId,
    });

    const [
      signersResult,
      consensusResult,
    ] = await Promise.all([
      contractInstance.methods.get_signers(),
      contractInstance.methods.get_consensus_info(),
    ]);

    signers.value = signersResult.decodedResult;
    consensus.value = consensusResult.decodedResult;
    confirmedBy.value = consensus.value.confirmed_by;
    confirmationsRequired.value = Number(consensus.value.confirmations_required);

    console.info('========================');
    console.info('contractInstance ::', contractInstance);
    console.info('signers.value ::', signers.value);
    console.info('consensus.value ::', consensus.value);
    console.info('========================');
  }

  return {
    loadMultisigContract,
    receivingAddress,
    proposedBy,
    signers,
    confirmedBy,
    confirmationsRequired,
    consensus, // remove
  };
}
