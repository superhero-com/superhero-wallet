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
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { IFeeItem } from '@/types';
import { tg } from '@/popup/plugins/i18n';
import { useNetworks } from '@/composables/networks';
import { SOL_CONTRACT_ID } from '@/protocols/solana/config';

export function useSolFeeCalculation(
  // eslint-disable-next-line default-param-last
  recipientsCount: Ref<number> | ComputedRef<number> = ref(1),
  fromAddress?: string,
  options?: {
    recipients?: Ref<string[]> | ComputedRef<string[]>;
    selectedAssetContractId?: Ref<string | undefined> | string | undefined;
  },
) {
  const { activeNetwork } = useNetworks();

  const feeSelectedIndex = ref(0);
  const baseFeeInSol = ref(new BigNumber(0));

  const feeList = computed((): IFeeItem[] => [
    {
      // Base fee represents a single transaction containing multiple transfer instructions.
      // It is calculated in updateFeeList() using a message with recipientsCount instructions.
      fee: baseFeeInSol.value,
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
      const { blockhash } = await conn.getLatestBlockhash('finalized');
      const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey });
      // Build a message approximating the batch transaction with N transfers.
      // Using 0-lamport self-transfers to keep it lightweight while reflecting message size.
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < (recipientsCount.value || 1); i++) {
        tx.add(SystemProgram.transfer({ fromPubkey, toPubkey: fromPubkey, lamports: 0 }));
      }
      let feeLamports = 5000; // fallback for message fee
      try {
        const message = tx.compileMessage();
        const feeForMessage = await conn.getFeeForMessage(message, 'confirmed');
        feeLamports = Number(feeForMessage?.value || feeLamports);
      } catch (_) {
        // NOOP
      }
      // If sending tokens (not SOL), include potential rent for creating missing ATAs.
      try {
        const selected = (typeof options?.selectedAssetContractId === 'string')
          ? options?.selectedAssetContractId
          : options?.selectedAssetContractId?.value;
        if (selected && selected !== SOL_CONTRACT_ID) {
          const recipients = options?.recipients?.value || [];
          const count = recipients.length || recipientsCount.value || 1;
          // Compute expected ATA addresses and check which are missing in batch
          const mintPk = new PublicKey(selected);
          const ataPubkeys = await Promise.all(
            (recipients.length ? recipients : Array.from({ length: count }).map((_, i) => i))
              .map(async (r: any) => {
                const recipient = typeof r === 'string' ? r : fromPubkey.toBase58();
                const recipientPk = new PublicKey(recipient);
                return getAssociatedTokenAddress(
                  mintPk,
                  recipientPk,
                  false,
                  SPL_TOKEN_PROGRAM_ID,
                  ASSOCIATED_TOKEN_PROGRAM_ID,
                );
              }),
          );
          const accountsInfo = await conn.getMultipleAccountsInfo(ataPubkeys);
          const missingCount = accountsInfo.filter((a) => a == null).length;
          if (missingCount > 0) {
            // Associated token account size is 165 bytes
            const rentPerAta = await conn.getMinimumBalanceForRentExemption(165);
            feeLamports += missingCount * rentPerAta;
          }
        }
      } catch (_) {
        // If any error occurs, fall back to base fee only
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
