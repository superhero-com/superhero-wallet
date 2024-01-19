<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="transaction-details">
        <template v-if="transaction && !transaction.incomplete">
          <TransactionDetailsBase
            :amount="getTxAmountTotal(transaction, TX_DIRECTION.received)"
            :transaction="transaction"
            :coin-symbol="AE_SYMBOL"
            :transaction-fee="+aettosToAe(transactionFee)"
            :token-symbol="getTxSymbol(transaction)"
            :total-amount="getTxAmountTotal(transaction, direction)"
            :is-error-transaction="isErrorTransaction"
            :is-transaction-aex9="isTransactionAex9(transaction)"
            :payload="getTransactionPayload(transaction)"
            :explorer-url="explorerUrl || ''"
            :is-local-account-address="isLocalAccountAddress"
            :contract-id="contractId"
            :show-header="!isDexAllowance"
            :hide-amount="isDex || isDexAllowance || isMultisig"
            :hash="hash"
            :protocol="PROTOCOL_AETERNITY"
          >
            <template #tokens>
              <TransactionTokens
                :transaction="transaction"
                :direction="direction"
                :is-allowance="isDexAllowance"
                :error="isErrorTransaction"
                :reversed="isPool"
                icon-size="md"
                :is-rounded="false"
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
                :direction="direction"
                :tx-function="transaction.tx.function"
                :is-allowance="isDexAllowance"
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
                    :protocol="PROTOCOL_AETERNITY"
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
import { merge } from 'lodash-es';
import { useRoute, useRouter } from 'vue-router';
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import { IonContent, IonPage } from '@ionic/vue';
import type { ITransaction, TxFunctionRaw } from '@/types';
import {
  useAccounts,
  useFungibleTokens,
  useMiddleware,
  useMultisigAccounts,
  useTransactionList,
  useTransactionTx,
  useUi,
} from '@/composables';
import { PROTOCOL_AETERNITY, TX_DIRECTION } from '@/constants';
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
import SwapRates from '@/popup/components/SwapRates.vue';
import SwapRoute from '@/popup/components/SwapRoute.vue';
import TransactionDetailsPoolTokens from '@/popup/components/TransactionDetailsPoolTokens.vue';
import DialogBox from '@/popup/components/DialogBox.vue';
import Avatar from '@/popup/components/Avatar.vue';
import TransactionTokens from '@/popup/components/TransactionTokenRows.vue';
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
    TransactionTokens,
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
    const router = useRouter();
    const route = useRoute();

    const { aeActiveNetworkSettings, aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();
    const { getMiddleware } = useMiddleware();
    const { activeMultisigAccountId } = useMultisigAccounts({ pollOnce: true });
    const { activeAccount, isLocalAccountAddress } = useAccounts();
    const { setLoaderVisible } = useUi();
    const { getTxAmountTotal, getTxSymbol } = useFungibleTokens();

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
      externalAddress: externalAddress.value,
    });

    const {
      fetchAllPendingTransactions,
      updateAccountTransaction,
      getTransactionByHash,
    } = useTransactionList();

    const transaction = ref<ITransaction>();
    const multisigContractId = ref<string>();

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

      // Claim transactions have missing data that needs to be fetched from the middleware
      if (!rawTransaction || rawTransaction.incomplete || rawTransaction.claim) {
        const middleware = await getMiddleware();
        try {
          rawTransaction = merge(rawTransaction, await middleware.getTx(hash));
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
      PROTOCOL_AETERNITY,
      TX_DIRECTION,
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

<style lang="scss" scoped>
@use '@/styles/variables';
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
