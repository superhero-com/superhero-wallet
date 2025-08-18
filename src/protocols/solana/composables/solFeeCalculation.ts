import {
  computed, ref, Ref, ComputedRef,
} from 'vue';
import BigNumber from 'bignumber.js';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import type { IFeeItem } from '@/types';
import { tg } from '@/popup/plugins/i18n';
import { useNetworks } from '@/composables/networks';

export function useSolFeeCalculation(
  // eslint-disable-next-line default-param-last
  recipientsCount: Ref<number> | ComputedRef<number> = ref(1),
  fromAddress?: string,
) {
  const { activeNetwork } = useNetworks();

  const feeSelectedIndex = ref(0);
  const baseFeeInSol = ref(new BigNumber(0));

  const feeList = computed((): IFeeItem[] => [
    {
      fee: baseFeeInSol.value.multipliedBy(recipientsCount.value),
      time: 60,
      label: tg('common.transferSpeed.medium'),
    },
  ]);

  const fee = computed(() => feeList.value[feeSelectedIndex.value].fee);
  const maxFee = fee;

  async function updateFeeList() {
    try {
      const { nodeUrl } = activeNetwork.value.protocols.solana;
      const conn = new Connection(nodeUrl, 'confirmed');
      const fromPubkey = new PublicKey(fromAddress || '11111111111111111111111111111111');
      const toPubkey = fromPubkey;
      const { blockhash } = await conn.getLatestBlockhash('finalized');
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey });
      tx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports: 0 }));
      let feeLamports = 5000; // fallback
      try {
        const message = tx.compileMessage();
        const feeForMessage = await conn.getFeeForMessage(message, 'confirmed');
        feeLamports = Number(feeForMessage?.value || feeLamports);
      } catch (_) {
        // NOOP
      }
      baseFeeInSol.value = new BigNumber(feeLamports / LAMPORTS_PER_SOL);
    } catch (e) {
      baseFeeInSol.value = new BigNumber(0.000005);
    }
  }

  return {
    fee,
    feeList,
    feeSelectedIndex,
    maxFee,
    updateFeeList,
  };
}
