<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="transaction-details">
        <template v-if="transaction && !transaction.incomplete">
          <TransactionDetailsBase
            :transaction="transaction"
            :amount="amount"
            :amount-total="amountTotal"
            :fee="transactionFee"
            :is-error-transaction="isErrorTransaction"
            :payload="getTransactionPayload(transaction)!"
            :show-header="!isDexAllowance"
            :hide-amount-total="(
              isDex
              || isDexAllowance
              || isTransactionAex9(transaction)
            )"
            :hide-fiat="isTransactionAex9(transaction)"
            :hash="hash"
            :protocol="PROTOCOLS.aeternity"
          >
            <template #tokens>
              <TransactionAssetRows
                :assets="transactionAssets"
                :error="isErrorTransaction"
                :is-reversed="isPool"
                :protocol="PROTOCOLS.aeternity"
                icon-size="rg"
                multiple-rows
              />
            </template>

            <template
              v-if="isSwap"
              #swap-data
            >
              <SwapRates :transaction="transaction" />
              <SwapRoute :transaction="transaction" />
            </template>

            <template #additional-content>
              <TransactionDetailsPoolTokens
                v-if="(isPool || isDexAllowance)"
                :transaction="transaction"
                :tokens="transactionAssets"
                :reversed="isPool"
              />

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

            <template #multisig-content>
              <DetailsItem
                v-if="multisigTransactionFeePaidBy"
                :label="$t('pages.transactionDetails.feePaidBy')"
                small
              >
                <div class="row payer-id">
                  <Avatar
                    :address="multisigTransactionFeePaidBy"
                    size="sm"
                  />
                  <div>
                    <DialogBox
                      v-if="isLocalAccountAddress(multisigTransactionFeePaidBy)"
                      class="dialog-box"
                      dense
                      position="bottom"
                    >
                      {{ $t('common.you') }}
                    </DialogBox>
                    <CopyText
                      hide-icon
                      :value="multisigTransactionFeePaidBy"
                      :copied-text="$t('common.addressCopied')"
                    >
                      <span class="text-address">
                        {{ splitAddress(multisigTransactionFeePaidBy) }}
                      </span>
                    </CopyText>
                  </div>
                </div>
              </DetailsItem>

              <DetailsItem
                v-if="multisigContractId"
                :label="$t('pages.transactionDetails.vaultContractId')"
                small
              >
                <div class="row">
                  <Avatar
                    :address="multisigContractId"
                    size="sm"
                  />
                  <CopyText
                    hide-icon
                    :value="multisigContractId"
                    :copied-text="$t('common.addressCopied')"
                  >
                    <span class="text-address">
                      {{ splitAddress(multisigContractId) }}
                    </span>
                  </CopyText>
                </div>
              </DetailsItem>
            </template>

            <template #gas>
              <DetailsItem
                v-if="gasPrice"
                :label="$t('pages.transactionDetails.gasPrice')"
                data-cy="gas-price"
              >
                <template #value>
                  <TokenAmount
                    :amount="+aettosToAe(gasPrice)"
                    :symbol="AE_SYMBOL"
                    :protocol="PROTOCOLS.aeternity"
                    hide-fiat
                  />
                </template>
              </DetailsItem>
              <DetailsItem
                v-if="gasUsed"
                :value="gasUsed"
                :label="$t('pages.transactionDetails.gasUsed')"
                data-cy="gas"
              />
            </template>
          </TransactionDetailsBase>
        </template>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onMounted,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import { IonContent, IonPage } from '@ionic/vue';
import type { ITransaction, ITx, TxFunctionRaw } from '@/types';
import { PROTOCOLS, TX_DIRECTION } from '@/constants';
import {
  fetchJson,
  handleUnknownError,
  splitAddress,
  watchUntilTruthy,
} from '@/utils';
import {
  useAccounts,
  useFungibleTokens,
  useMultisigAccounts,
  useTransactionData,
  useTransactionList,
  useUi,
} from '@/composables';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
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

import TransactionDetailsBase from '@/popup/components/TransactionDetailsBase.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import LinkButton from '@/popup/components/LinkButton.vue';
import Truncate from '@/popup/components/Truncate.vue';
import CopyText from '@/popup/components/CopyText.vue';
import SwapRates from '@/popup/components/SwapRates.vue';
import SwapRoute from '@/popup/components/SwapRoute.vue';
import TransactionDetailsPoolTokens from '@/popup/components/TransactionDetailsPoolTokens.vue';
import DialogBox from '@/popup/components/DialogBox.vue';
import Avatar from '@/popup/components/Avatar.vue';
import TransactionAssetRows from '@/popup/components/TransactionAssetRows.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';

export default defineComponent({
  components: {
    TokenAmount,
    Avatar,
    DialogBox,
    SwapRoute,
    SwapRates,
    TransactionDetailsBase,
    TransactionDetailsPoolTokens,
    TransactionAssetRows,
    DetailsItem,
    CopyText,
    LinkButton,
    Truncate,
    IonContent,
    IonPage,
  },
  props: {
    multisigDashboard: Boolean,
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();

    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    const { activeMultisigAccountId } = useMultisigAccounts({ pollOnce: true });
    const { activeAccount, isLocalAccountAddress } = useAccounts();
    const { setLoaderVisible } = useUi();
    const { getTxAmountTotal } = useFungibleTokens();

    const hash = route.params.hash as string;
    const transactionOwner = route.params.transactionOwner as Encoded.AccountAddress;

    const externalAddress = computed((): Encoded.AccountAddress => (
      transactionOwner
      || (
        props.multisigDashboard
          ? activeMultisigAccountId.value
          : activeAccount.value.address
      )));

    const { transactionsLoaded } = useTransactionList({
      accountAddress: externalAddress.value,
      protocol: PROTOCOLS.aeternity,
    });

    const {
      setExternalAddress,
      setActiveTransaction,
      direction,
      isErrorTransaction,
      isDex,
      isDexAllowance,
      outerTxTag,
      transactionAssets,
    } = useTransactionData({
      externalAddress: externalAddress.value,
      showDetailedAllowanceInfo: true,
    });

    const transaction = ref<ITransaction>();
    const multisigContractId = ref<string>();

    const amount = computed((): number => transaction.value
      ? getTxAmountTotal(transaction.value, TX_DIRECTION.received)
      : 0);
    const amountTotal = computed((): number => transaction.value
      ? getTxAmountTotal(transaction.value, direction.value)
      : 0);
    const tipUrl = computed(() => transaction.value ? getTransactionTipUrl(transaction.value) : '');
    const txFunction = computed(() => transaction.value?.tx?.function as TxFunctionRaw | undefined);
    const isSwap = computed(() => isDex.value && isTxFunctionDexSwap(txFunction.value));
    const isPool = computed(() => isDex.value && isTxFunctionDexPool(txFunction.value));
    const tipLink = computed(() => /^http[s]*:\/\//.test(tipUrl.value) ? tipUrl.value : `http://${tipUrl.value}`);

    const gasPrice = computed(() => (
      (transaction.value?.tx?.tx?.tx as ITx)?.gasPrice
      || transaction.value?.tx?.gasPrice
    ));

    const gasUsed = computed(() => (
      (transaction.value?.tx?.tx?.tx as ITx)?.gasUsed
      || transaction.value?.tx?.gasUsed
    ));

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
      return +aettosToAe(fee + extraFee);
    });

    onMounted(async () => {
      let rawTransaction: ITransaction | undefined = transactionsLoaded.value
        .find((tx) => tx.hash === hash) as ITransaction;

      // Claim transactions have missing data that needs to be fetched from the middleware
      if (!rawTransaction || rawTransaction.incomplete || rawTransaction.claim) {
        const adapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity);

        try {
          rawTransaction = {
            ...(rawTransaction || {}), // Claim transaction data
            ...await adapter.fetchTransactionByHash(hash, externalAddress.value),
            incomplete: false,
          };
        } catch (e) {
          // Pending transactions are not returned from the middleware.
          const pendingTransactions = await adapter
            .fetchPendingTransactions?.(externalAddress.value);

          rawTransaction = pendingTransactions?.find((val) => val.hash === hash);

          if (!rawTransaction) {
            router.push({ name: ROUTE_NOT_FOUND });
            return;
          }
        } finally {
          setLoaderVisible(false);
        }
      }

      if (rawTransaction?.tx) {
        if (props.multisigDashboard) {
          await watchUntilTruthy(() => activeMultisigAccountId.value);
        } else {
          await watchUntilTruthy(() => activeAccount.value);
        }

        transaction.value = {
          ...rawTransaction,
          transactionOwner: externalAddress.value,
        };

        setExternalAddress(externalAddress.value);
        setActiveTransaction(transaction.value);
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

    watch(
      transaction,
      (value) => {
        const loading = !!(!value || value.incomplete);
        setLoaderVisible(loading);
      },
      { immediate: true, deep: true },
    );

    return {
      AE_SYMBOL,
      PROTOCOLS,
      TX_DIRECTION,
      transaction,
      amount,
      amountTotal,
      isSwap,
      isPool,
      isErrorTransaction,
      isDexAllowance,
      isDex,
      isTransactionAex9,
      getTransactionPayload,
      tipUrl,
      tipLink,
      direction,
      hash,
      splitAddress,
      aettosToAe,
      isLocalAccountAddress,
      gasPrice,
      gasUsed,
      multisigTransactionFeePaidBy,
      multisigContractId,
      transactionFee,
      transactionAssets,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';
@use '@/styles/mixins';

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

  .row {
    @include mixins.flex(flex-start, center, row);

    gap: 8px;
  }

  .payer-id {
    position: relative;

    .dialog-box {
      width: 30px;
      height: 20px;
      position: absolute;
      right: 15px;
      top: -28px;
    }
  }
}
</style>
