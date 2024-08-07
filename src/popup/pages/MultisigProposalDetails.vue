<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="multisig-proposal-details">
        <AnimatedSpinner
          v-if="!activeMultisigAccount || !multisigTx"
          class="spinner"
        />
        <template v-else>
          <div class="header">
            <TransactionAssetRows
              v-if="multisigTx"
              :assets="transactionAssets"
              :protocol="PROTOCOLS.aeternity"
              icon-size="rg"
            />
          </div>
          <div class="content">
            <TransactionInfo
              v-if="multisigTx"
              class="transaction-overview"
              :sender="{
                label: $t('multisig.multisigVault'),
                address: activeMultisigAccount.gaAccountId,
                url: protocolExplorer.prepareUrlForAccount(activeMultisigAccount.gaAccountId),
              }"
              :recipient="{
                label: $t('common.smartContract'),
                address: activeMultisigAccount.contractId,
                url: activeMultisigAccountExplorerUrl,
              }"
              :transaction="transaction"
            />
            <div class="explorer">
              <LinkButton
                :text="$t('pages.transactionDetails.explorer')"
                :href="activeMultisigAccountExplorerUrl!"
                variant="muted"
                is-external
                underlined
              />
            </div>
            <div class="data-grid">
              <DetailsItem
                v-if="multisigTx && multisigTx.recipientId"
                :label="$t('pages.proposalDetails.receivingAddress')"
                small
              >
                <template #value>
                  <div class="receiving-address">
                    <Avatar
                      :address="multisigTx.recipientId"
                      size="sm"
                    />
                    <CopyText
                      hide-icon
                      :value="multisigTx.recipientId"
                      :copied-text="$t('common.addressCopied')"
                    >
                      <span class="text-address">{{ splitAddress(multisigTx.recipientId) }}</span>
                    </CopyText>
                  </div>
                </template>
              </DetailsItem>

              <DetailsItem
                v-if="activeMultisigAccount.proposedBy"
                :label="$t('pages.proposalDetails.proposedBy')"
                small
              >
                <template #value>
                  <div class="row">
                    <AccountItem
                      :address="activeMultisigAccount.proposedBy"
                      :protocol="PROTOCOLS.aeternity"
                    />
                    <DialogBox
                      v-if="isLocalAccountAddress(activeMultisigAccount.proposedBy)"
                      dense
                    >
                      {{ $t('common.you') }}
                    </DialogBox>
                  </div>
                </template>
              </DetailsItem>

              <MultisigProposalConsensus :proposal-completed="proposalCompleted" />

              <PayloadDetails
                v-if="transaction"
                :payload="getTransactionPayload(transaction)"
              />

              <div class="span-3-columns">
                <DetailsItem
                  v-if="activeMultisigAccount.expirationHeight"
                  :value="activeMultisigAccount.expirationHeight"
                  :label="$t('pages.proposalDetails.expiresAt')"
                  :secondary="expirationHeightToRelativeTime"
                />
                <DetailsItem
                  v-else-if="transaction?.blockHeight"
                  :value="transaction.blockHeight"
                  :label="$t('pages.transactionDetails.blockHeight')"
                />
                <DetailsItem
                  v-if="activeMultisigAccount.nonce"
                  :value="activeMultisigAccount.nonce"
                  :label="$t('pages.transactionDetails.nonce')"
                  data-cy="nonce"
                />
              </div>
              <DetailsItem
                v-if="multisigTx.gasPrice"
                :label="$t('pages.transactionDetails.gasPrice')"
                data-cy="gas-price"
              >
                <template #value>
                  <TokenAmount
                    :amount="+(aettosToAe(multisigTx.gasPrice))"
                    :protocol="PROTOCOLS.aeternity"
                    :symbol="AE_SYMBOL"
                    hide-fiat
                  />
                </template>
              </DetailsItem>

              <DetailsItem
                v-if="transaction?.tx?.gasPrice"
                :label="$t('pages.transactionDetails.gasPrice')"
              >
                <template #value>
                  <TokenAmount
                    :amount="+aettosToAe(transaction.tx.gasPrice)"
                    :symbol="AE_SYMBOL"
                    :protocol="PROTOCOLS.aeternity"
                  />
                </template>
              </DetailsItem>

              <DetailsItem
                v-if="transaction?.tx?.gas"
                :value="transaction.tx.gas"
                :label="$t('pages.transactionDetails.gasUsed')"
              />

              <DetailsItem
                v-if="multisigTx"
                :label="$t('modals.multisigTxProposal.fee')"
              >
                <template #value>
                  <TokenAmount
                    :amount="+aettosToAe(AE_GET_META_TX_FEE)"
                    :symbol="AE_SYMBOL"
                    :protocol="PROTOCOLS.aeternity"
                  />
                </template>
              </DetailsItem>
              <DetailsItem
                v-if="transaction"
                :label="$t('transaction.fee')"
                data-cy="fee"
              >
                <template #value>
                  <TokenAmount
                    :amount="+aettosToAe(transaction.tx.fee)"
                    :symbol="AE_SYMBOL"
                    :protocol="PROTOCOLS.aeternity"
                  />
                </template>
              </DetailsItem>

              <DetailsItem
                v-if="totalSpent"
                :label="$t('common.total')"
                data-cy="amount"
              >
                <template #value>
                  <TokenAmount
                    :amount="+aettosToAe(totalSpent)"
                    :symbol="AE_SYMBOL"
                    :protocol="PROTOCOLS.aeternity"
                    high-precision
                  />
                </template>
              </DetailsItem>
            </div>
            <div
              v-if="!proposalCompleted && activeMultisigAccount.txHash"
              class="bottom-buttons"
            >
              <div class="row">
                <BtnMain
                  variant="muted"
                  nowrap
                  extra-padded
                  :disabled="isLoaderVisible"
                  @click="dispatchProposalAction(
                    TX_FUNCTIONS_MULTISIG.refuse,
                    $t('pages.proposalDetails.refuse'),
                  )"
                >
                  {{ $t('pages.proposalDetails.refuse') }}
                </BtnMain>

                <BtnMain
                  v-if="pendingMultisigTxCanBeSent"
                  extend
                  nowrap
                  extra-padded
                  :disabled="isLoaderVisible || pendingMultisigTxExpired"
                  @click="processProposal()"
                >
                  {{ $t('common.send') }}
                </BtnMain>
                <BtnMain
                  v-else
                  extend
                  nowrap
                  extra-padded
                  :disabled="
                    isLoaderVisible
                      || pendingMultisigTxConfirmedByLocalSigners
                      || pendingMultisigTxExpired
                  "
                  @click="dispatchProposalAction(
                    TX_FUNCTIONS_MULTISIG.confirm,
                    $t('pages.proposalDetails.sign'),
                  )"
                >
                  {{ $t('pages.proposalDetails.sign') }}
                </BtnMain>
              </div>
              <BtnMain
                v-if="isLocalAccountAddress(activeMultisigAccount.proposedBy)"
                variant="muted"
                extend
                nowrap
                extra-padded
                :disabled="isLoaderVisible"
                @click="dispatchProposalAction(
                  TX_FUNCTIONS_MULTISIG.revoke,
                  $t('pages.proposalDetails.revoke'),
                )"
              >
                {{ $t('pages.proposalDetails.revokeTransaction') }}
              </BtnMain>
            </div>
          </div>
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
  watch,
} from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import { isEqual } from 'lodash-es';
import { useRouter } from 'vue-router';
import BigNumber from 'bignumber.js';
import { IonContent, IonPage, onIonViewWillLeave } from '@ionic/vue';

import type {
  IGAMetaTx,
  TxFunctionMultisig,
  ITransaction,
  ITx,
} from '@/types';
import {
  MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION,
  PROTOCOLS,
} from '@/constants';
import {
  blocksToRelativeTime,
  formatDate,
  formatTime,
  splitAddress,
} from '@/utils';
import {
  useAccounts,
  useAeSdk,
  useFungibleTokens,
  useModals,
  useMultisigAccounts,
  useMultisigTransactions,
  usePendingMultisigTransaction,
  useTransactionData,
  useUi,
} from '@/composables';
import { ROUTE_MULTISIG_ACCOUNT } from '@/popup/router/routeNames';
import { AE_SYMBOL, TX_FUNCTIONS_MULTISIG, AE_GET_META_TX_FEE } from '@/protocols/aeternity/config';
import {
  aettosToAe,
  getTransactionPayload,
  isInsufficientBalanceError,
} from '@/protocols/aeternity/helpers';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { AeAccountHdWallet } from '@/protocols/aeternity/libs/AeAccountHdWallet';

import { type MultisigProposalConfirmActionVal } from '@/popup/components/Modals/MultisigProposalConfirmActions.vue';

import TransactionInfo from '../components/TransactionInfo.vue';
import TokenAmount from '../components/TokenAmount.vue';
import DetailsItem from '../components/DetailsItem.vue';
import LinkButton from '../components/LinkButton.vue';
import AccountItem from '../components/AccountItem.vue';

import BtnMain from '../components/buttons/BtnMain.vue';
import CopyText from '../components/CopyText.vue';
import PayloadDetails from '../components/PayloadDetails.vue';
import DialogBox from '../components/DialogBox.vue';
import MultisigProposalConsensus from '../components/MultisigProposalConsensus.vue';
import Avatar from '../components/Avatar.vue';
import TransactionAssetRows from '../components/TransactionAssetRows.vue';

import AnimatedSpinner from '../../icons/animated-spinner.svg?vue-component';

export default defineComponent({
  components: {
    PayloadDetails,
    TransactionAssetRows,
    MultisigProposalConsensus,
    TransactionInfo,
    DialogBox,
    Avatar,
    TokenAmount,
    DetailsItem,
    LinkButton,
    AccountItem,
    BtnMain,
    CopyText,
    AnimatedSpinner,
    IonPage,
    IonContent,
  },
  setup() {
    const router = useRouter();
    const { t } = useI18n();

    const { openDefaultModal, openModal } = useModals();
    const { isLoaderVisible, setLoaderVisible } = useUi();
    const { activeAccount, isLocalAccountAddress } = useAccounts();
    const { getTxAssetSymbol } = useFungibleTokens();
    const { nodeNetworkId } = useAeSdk();

    const {
      activeMultisigAccount,
      activeMultisigAccountExplorerUrl,
      updateMultisigAccounts,
      fetchAdditionalInfo,
      stopFetchingAdditionalInfo,
    } = useMultisigAccounts();

    const {
      pendingMultisigTxExpired,
      pendingMultisigTxExpiresAt,
      pendingMultisigTxCanBeSent,
      pendingMultisigTxLocalSigners,
      pendingMultisigTxConfirmedByLocalSigners,
    } = usePendingMultisigTransaction();

    const {
      fetchActiveMultisigTx,
      fetchTransactionByHash,
      sendTx,
      callContractMethod,
    } = useMultisigTransactions();

    const protocolExplorer = ProtocolAdapterFactory.getAdapter(PROTOCOLS.aeternity).getExplorer();

    const multisigTx = ref<ITx | null>(null);
    const transaction = ref<ITransaction>();
    const proposalCompleted = ref<boolean>(false);

    const { transactionAssets } = useTransactionData({ transaction });

    const totalSpent = computed(() => {
      if (!proposalCompleted.value || !transaction.value) {
        return 0;
      }

      const { tx } = transaction.value;
      const multisigTransaction = tx.tx?.tx as IGAMetaTx;
      if (!multisigTransaction) return 0;

      return new BigNumber(multisigTransaction.amount)
        .plus(tx.fee)
        .plus(multisigTransaction.fee)
        .toString();
    });

    const expirationHeightToRelativeTime = computed(() => (
      pendingMultisigTxExpiresAt.value > 0
        ? `(≈${blocksToRelativeTime(pendingMultisigTxExpiresAt.value)})`
        : undefined
    ));

    async function getTransactionDetails() {
      const activeMultisigTx = await fetchActiveMultisigTx();

      if (!activeMultisigTx) {
        return;
      }

      multisigTx.value = {
        ...activeMultisigTx.tx,
        type: Tag[Tag.GaMetaTx],
        tag: Tag.GaMetaTx,
      } as any;
      // TODO: remove `any` by adding returned type from `unpackTx` aeSdk function to `ITx` type

      transaction.value = { tx: multisigTx.value } as ITransaction;
    }

    function handleInsufficientBalanceError(
      error: any,
      isVault: boolean,
      action?: string | TranslateResult,
    ) {
      if (error) {
        let title;
        let { message } = error;
        if (isInsufficientBalanceError(error)) {
          message = isVault
            ? t('modals.vaultLowBalance.msg')
            : t('modals.accountLowBalance.msg', { action });
          title = isVault
            ? t('modals.vaultLowBalance.title')
            : t('modals.accountLowBalance.title');
        }
        openDefaultModal({
          icon: 'warning',
          title,
          msg: message,
          textCenter: true,
        });
      }
    }

    /**
     * Utilized to open the confirmation modal for approving, disapproving, or revoking the proposal
     */
    async function dispatchProposalAction(
      action: TxFunctionMultisig,
      actionName: string | TranslateResult,
    ) {
      if (!activeMultisigAccount.value) {
        return;
      }

      setLoaderVisible(true);
      try {
        const chosenAddress = await openModal<MultisigProposalConfirmActionVal>(
          MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION,
          {
            action,
            signers: pendingMultisigTxLocalSigners.value,
          },
        );

        const { contractId, txHash } = activeMultisigAccount.value;
        const signingAccount = new AeAccountHdWallet(nodeNetworkId);
        await callContractMethod(
          action,
          contractId,
          txHash as string,
          (activeAccount.value.address !== chosenAddress)
            ? {
              onAccount: {
                address: chosenAddress,
                signTransaction: signingAccount.signTransaction.bind({
                  nodeNetworkId,
                  sign: signingAccount.sign,
                }),
              },
              fromAccount: chosenAddress as any,
            }
            : {},
        );
        await updateMultisigAccounts();

        if (!activeMultisigAccount.value?.txHash) {
          router.push({ name: ROUTE_MULTISIG_ACCOUNT });
        }
      } catch (error: any) {
        handleInsufficientBalanceError(error, false, actionName.toString().toLowerCase());
      } finally {
        setLoaderVisible(false);
      }
    }

    /**
     * Dispatch the proposal transaction if it has been signed by all necessary signatories.
     */
    async function processProposal() {
      if (!activeMultisigAccount.value || !pendingMultisigTxCanBeSent.value) {
        return;
      }

      setLoaderVisible(true);
      try {
        const { gaAccountId, txHash, nonce } = activeMultisigAccount.value;
        const rawTx = await fetchTransactionByHash(txHash as string);
        if (!rawTx) {
          throw Error('failed to load a transaction');
        }
        transaction.value = await sendTx(gaAccountId as Encoded.AccountAddress, rawTx.tx, nonce);

        await updateMultisigAccounts();

        proposalCompleted.value = true;
      } catch (error) {
        handleInsufficientBalanceError(error, true);
      }
      setLoaderVisible(false);
    }

    watch(
      () => activeMultisigAccount.value,
      (value, oldValue) => {
        if (value && !isEqual(value, oldValue)) {
          getTransactionDetails();
        }
      },
      { immediate: true },
    );

    watch(() => multisigTx.value, () => {
      fetchAdditionalInfo();
    });

    onIonViewWillLeave(() => {
      stopFetchingAdditionalInfo();
      setLoaderVisible(false);
    });

    return {
      AE_SYMBOL,
      AE_GET_META_TX_FEE,
      PROTOCOLS,
      TX_FUNCTIONS_MULTISIG,
      activeMultisigAccount,
      activeMultisigAccountExplorerUrl,
      multisigTx,
      transaction,
      transactionAssets,
      totalSpent,
      getTxAssetSymbol,
      getTransactionPayload,
      splitAddress,
      aettosToAe,
      formatDate,
      formatTime,
      isLocalAccountAddress,
      isLoaderVisible,
      pendingMultisigTxCanBeSent,
      pendingMultisigTxExpired,
      protocolExplorer,
      expirationHeightToRelativeTime,
      pendingMultisigTxConfirmedByLocalSigners,
      proposalCompleted,
      blocksToRelativeTime,
      dispatchProposalAction,
      processProposal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.multisig-proposal-details {
  display: flex;
  flex-direction: column;

  .spinner {
    align-self: center;
    width: 56px;
    height: 56px;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .pending-icon {
    width: 16px;
    height: 16px;
  }

  .header {
    @include mixins.flex(center, center, column);

    background-color: $color-bg-app;
    min-height: 42px;
    padding: 14px;
    position: sticky;
    top: 0;
    z-index: 3;

    @include mixins.mobile {
      width: 100%;
    }
  }

  .span-3-columns {
    @include mixins.flex(flex-start, flex-start);

    column-gap: 24px;
  }

  .content {
    background-color: $color-bg-4;
    padding-bottom: 120px;

    .transaction-overview {
      padding: 16px 12px 8px;
    }

    .receiving-address {
      @include mixins.flex(flex-start, center, row);

      gap: 8px;
    }

    .data-grid {
      @include mixins.flex(flex-start, flex-start, column);

      column-gap: 24px;
      row-gap: 8px;
      padding: 8px var(--screen-padding-x);

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

    .explorer {
      height: 38px;
      padding-inline: 16px;
      display: flex;
      align-items: center;
    }
  }

  .details-item:deep() {
    .label {
      white-space: nowrap;
    }
  }

  .reason:deep() {
    .value {
      color: $color-warning;
    }
  }

  .row {
    @include mixins.flex(flex-start, center, row);

    gap: 4px;
  }

  .bottom-buttons {
    padding: var(--screen-padding-x);
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background:
      linear-gradient(
        180deg,
        rgba($color-bg-4, 0) 0%,
        rgba($color-bg-4, 0.8) 43.08%,
        rgba($color-bg-4, 0.9) 90.79%
      );

    .row {
      gap: 8px;
      padding-bottom: 8px;
    }
  }
}
</style>
