<template>
  <ion-page>
    <ion-content
      class="ion-padding"
    >
      <div class="transaction-details">
        <Loader v-if="!transaction || transaction.incomplete" />
        <template v-else>
          <TransactionDetailsBase
            :transaction="transaction"
            :coin-symbol="AE_SYMBOL"
            :transaction-fee="+aettosToAe(transactionFee)"
            :is-swap="isSwap"
            :is-pool="isPool"
            :token-symbol="getTxSymbol(transaction)"
            :total-amount="getTxAmountTotal(transaction, direction)"
            :is-error-transaction="isErrorTransaction"
            :is-dex-allowance="isDexAllowance"
            :is-dex="isDex"
            :is-transaction-aex9="isTransactionAex9(transaction)"
            :payload="getTransactionPayload(transaction)"
            :is-multisig="isMultisig"
            :direction="direction"
            :explorer-url="explorerUrl || ''"
            :is-local-account-address="isLocalAccountAddress"
            :gas-price="gasPrice ? +aettosToAe(gasPrice) : 0"
            :gas-used="gasUsed"
            :contract-id="contractId"
            :multisig-transaction-fee-paid-by="multisigTransactionFeePaidBy"
            :multisig-contract-id="multisigContractId"
            :hash="hash"
          >
            <template #tip-url>
              <DetailsItem
                v-if="tipUrl"
                :label="$t('pages.transactionDetails.tipUrl')"
                class="tip-url"
                data-cy="tip-url"
              >
                <template #value>
                  <CopyText :value="tipUrl">
                    <LinkButton :to="tipLink">
                      <Truncate
                        :str="tipUrl"
                        fixed
                      />
                    </LinkButton>
                  </CopyText>
                </template>
              </DetailsItem>
            </template>
          </TransactionDetailsBase>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onMounted,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import { IonContent, IonPage } from '@ionic/vue';
import type { ITransaction, TxFunctionRaw } from '@/types';
import {
  useAccounts,
  useMiddleware,
  useMultisigAccounts,
  useTransactionList,
  useTransactionTx,
} from '@/composables';
import {
  fetchJson,
  handleUnknownError,
  splitAddress,
  watchUntilTruthy,
} from '@/utils';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
import {
  aettosToAe,
  getTransactionPayload,
  getTransactionTipUrl,
  isTransactionAex9,
  isTxFunctionDexSwap,
  isTxFunctionDexPool,
} from '@/protocols/aeternity/helpers';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';

import TransactionDetailsBase from '@/popup/components/TransactionDetailsBase.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import LinkButton from '@/popup/components/LinkButton.vue';
import Truncate from '@/popup/components/Truncate.vue';
import CopyText from '@/popup/components/CopyText.vue';

export default defineComponent({
  components: {
    TransactionDetailsBase,
    DetailsItem,
    CopyText,
    LinkButton,
    Truncate,
    IonContent,
    IonPage,
  },
  props: {
    multisigDashboard: { type: Boolean },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    const { aeActiveNetworkSettings, aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();
    const { getMiddleware } = useMiddleware();
    const { activeMultisigAccountId } = useMultisigAccounts({ store, pollOnce: true });
    const { activeAccount, isLocalAccountAddress } = useAccounts({ store });

    const hash = route.params.hash as string;
    const transactionOwner = route.params.transactionOwner as Encoded.AccountAddress;

    const externalAddress = computed((): Encoded.AccountAddress => (
      transactionOwner
      || (
        props.multisigDashboard
          ? activeMultisigAccountId.value
          : activeAccount.value.address
      )));

    const {
      setExternalAddress,
      setTransactionTx,
      direction,
      isErrorTransaction,
      isDex,
      isDexAllowance,
      isMultisig,
      outerTxTag,
    } = useTransactionTx({
      store,
      externalAddress: externalAddress.value,
    });

    const {
      fetchAllPendingTransactions,
      updateAccountTransaction,
      getTransactionByHash,
    } = useTransactionList({ store });

    const transaction = ref<ITransaction>();
    const multisigContractId = ref<string>();

    const getTxSymbol = computed(() => store.getters.getTxSymbol);
    const getTxAmountTotal = computed(() => store.getters.getTxAmountTotal);

    const tipUrl = computed(() => transaction.value ? getTransactionTipUrl(transaction.value) : '');
    const contractId = computed(() => transaction.value?.tx.contractId);
    const txFunction = computed(() => transaction.value?.tx?.function as TxFunctionRaw | undefined);
    const isSwap = computed(() => isTxFunctionDexSwap(txFunction.value));
    const isPool = computed(() => isTxFunctionDexPool(txFunction.value));
    const tipLink = computed(() => /^http[s]*:\/\//.test(tipUrl.value) ? tipUrl.value : `http://${tipUrl.value}`);
    const explorerUrl = computed(
      () => (new AeScan(aeActiveNetworkPredefinedSettings.value.explorerUrl!))
        .prepareUrlByHash(hash),
    );

    const gasPrice = computed(() => {
      if (transaction.value?.tx?.tx?.tx && 'gasPrice' in transaction.value?.tx?.tx?.tx) {
        return transaction.value.tx.tx.tx.gasPrice;
      }
      return transaction.value?.tx?.gasPrice;
    });

    const gasUsed = computed(() => {
      if (transaction.value?.tx?.tx?.tx && 'gasUsed' in transaction.value.tx.tx.tx) {
        return transaction.value.tx.tx.tx.gasUsed;
      }
      return transaction.value?.tx?.gasUsed;
    });

    const multisigTransactionFeePaidBy = computed((): string | null => {
      if (outerTxTag.value !== Tag.PayingForTx) return null;
      return transaction.value?.tx?.payerId ?? null;
    });

    /**
     * Computes the total transaction fee, which is the sum of the fee of the main transaction
     * and any additional fee from nested transactions.
     * @returns {number} The total transaction fee.
     */
    const transactionFee = computed((): number => {
      const { tx } = transaction.value ?? {};
      const fee = tx?.fee ?? 0;
      const extraFee = tx?.tx?.tx?.fee ?? 0;
      return fee + extraFee;
    });

    onMounted(async () => {
      let rawTransaction = getTransactionByHash(activeAccount.value.address, hash);

      if (!rawTransaction || rawTransaction.incomplete) {
        const middleware = await getMiddleware();
        try {
          rawTransaction = await middleware.getTx(hash);
        } catch (e) {
          // This case is for pending transaction
          await fetchAllPendingTransactions();

          rawTransaction = getTransactionByHash(activeAccount.value.address, hash);

          if (!rawTransaction) {
            router.push({ name: ROUTE_NOT_FOUND });
            return;
          }
        }

        if (rawTransaction?.tx) {
          if (props.multisigDashboard) {
            await watchUntilTruthy(() => activeMultisigAccountId.value);
          } else {
            await watchUntilTruthy(() => activeAccount.value);
          }
          setExternalAddress(externalAddress.value);
          transaction.value = {
            ...rawTransaction,
            transactionOwner: externalAddress.value,
          };
          updateAccountTransaction(activeAccount.value.address, transaction.value!);
        }
      } else {
        transaction.value = rawTransaction;
      }
      if (transaction.value?.tx) {
        setTransactionTx(transaction.value.tx);
      }

      if (outerTxTag.value === Tag.GaMetaTx) {
        try {
          const { contract_id: contractIdForMultisig = null } = await fetchJson(
            `${aeActiveNetworkSettings.value.nodeUrl}/v3/accounts/${transaction.value?.tx?.gaId}`,
          );
          multisigContractId.value = contractIdForMultisig;
        } catch (e) {
          handleUnknownError(e);
        }
      }
    });

    return {
      AE_SYMBOL,
      transaction,
      isSwap,
      isPool,
      getTxSymbol,
      getTxAmountTotal,
      isErrorTransaction,
      isDexAllowance,
      isDex,
      isTransactionAex9,
      getTransactionPayload,
      isMultisig,
      tipUrl,
      tipLink,
      direction,
      explorerUrl,
      hash,
      splitAddress,
      aettosToAe,
      isLocalAccountAddress,
      gasPrice,
      gasUsed,
      contractId,
      multisigTransactionFeePaidBy,
      multisigContractId,
      transactionFee,
    };
  },
});
</script>

<style lang="scss" scope>
.transaction-details {
  .tip-url {
    width: 100%;

    .copy-text {
      width: 100%;
    }

    .link-button {
      display: block;
    }
  }
}
</style>
