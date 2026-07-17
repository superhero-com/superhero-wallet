<template>
  <Modal
    show
    full-screen
    class="confirm-raw-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-labels="[
        ...(isUnknownDapp ? [$t('common.unknown')] : []),
        $t('modals.confirm-raw-sign.title'),
      ]"
      :sender="sender"
      :recipient="selectedAccount!"
      :first-label-warning="isUnknownDapp"
    />

    <NoOriginWarning
      v-if="isUnknownDapp"
      :action="$t('unknownDapp.signDataAction')"
      :warning="$t('unknownDapp.signDataWarning')"
    />

    <SignAccountSelect
      :account="selectedAccount"
      :protocol="protocol"
      :label="$t('modals.signAccountSelect.label')"
      :original-address="originalSignerAddress"
      :signer-account-missing="isSignerAccountMissing"
      class="sign-account-select"
      @select="selectedAccount = $event"
    />

    <CheckBox
      v-if="isSignerReplaceable"
      v-model="rebuildForSelectedAccount"
      class="rebuild-for-signer"
      data-cy="rebuild-for-signer"
    >
      {{ $t('modals.signAccountSelect.rebuildForSelectedAccount') }}
    </CheckBox>

    <div
      class="warning"
      data-cy="warning"
    >
      <span class="title">
        <Warning class="icon" />
        {{ $t('modals.confirm-raw-sign.warning.title') }}
      </span>
      <i18n-t
        keypath="modals.confirm-raw-sign.warning.content"
        tag="span"
        class="content"
        scope="global"
      >
        <br>
      </i18n-t>
    </div>

    <DetailsItem
      :label="$t('modals.confirmTransactionSign.data-sign')"
      data-cy="data"
    >
      <template #value>
        <CopyText :value="dataAsString" />
      </template>
    </DetailsItem>

    <template #footer>
      <BtnMain
        variant="muted"
        third
        extra-padded
        :text="$t('common.cancel')"
        @click="cancel"
      />
      <BtnMain
        third
        :text="$t('common.confirm')"
        :disabled="!canSignWithSelectedAccount"
        @click="confirm"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onUnmounted,
  ref,
} from 'vue';
import { getTransactionSignerAddress, type Encoded } from '@aeternity/aepp-sdk';
import {
  ACCOUNT_TYPES,
  AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
  MODAL_SIGN_AIR_GAP_TRANSACTION,
  PROTOCOLS,
  RUNNING_IN_POPUP,
} from '@/constants';
import type { IAccount, ISignModalResolution } from '@/types';
import { RejectedByUserError } from '@/lib/errors';
import {
  useAccounts, useAeSdk, useModals, usePopupProps,
} from '@/composables';
import {
  canRebuildTransactionForSigner,
  rebuildTransactionForSigner,
} from '@/protocols/aeternity/helpers';

import { type SignAirGapTransactionResolvedVal } from './SignAirGapTransaction.vue';

import Modal from '../Modal.vue';
import TransactionInfo from '../TransactionInfo.vue';
import BtnMain from '../buttons/BtnMain.vue';
import DetailsItem from '../DetailsItem.vue';
import CopyText from '../CopyText.vue';
import SignAccountSelect from '../SignAccountSelect.vue';
import CheckBox from '../CheckBox.vue';

import Warning from '../../../icons/warning.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    TransactionInfo,
    BtnMain,
    DetailsItem,
    Warning,
    CopyText,
    SignAccountSelect,
    CheckBox,
  },
  setup() {
    const {
      isUnknownDapp,
      popupProps,
      sender,
      setPopupProps,
    } = usePopupProps();
    const {
      getLastActiveProtocolAccount,
      getAccountByProtocolAndAddress,
      setActiveAccountByAddressAndProtocol,
    } = useAccounts();
    const { getAeSdk } = useAeSdk();
    const { openModal } = useModals();

    const protocol = popupProps.value?.protocol || PROTOCOLS.aeternity;
    const activeAccount = getLastActiveProtocolAccount(protocol);

    /**
     * Some raw-sign payloads are still a valid (just AEX-2-unsupported) tx, e.g.
     * a NameRevokeTx or an OracleRegisterTx, so the same "is this account even
     * able to sign it" question applies here as in `ConfirmTransactionSign`.
     */
    const originalSignerAddress = computed((): string | undefined => {
      try {
        if (popupProps.value?.txBase64 && protocol === PROTOCOLS.aeternity) {
          return getTransactionSignerAddress(popupProps.value.txBase64);
        }
      } catch {
        // Fall through to the best-effort values below.
      }
      return (
        popupProps.value?.fromAccount
        || (popupProps.value?.tx?.senderId as string | undefined)
        || activeAccount?.address
      );
    });

    const originalSignerAccount = computed((): IAccount | undefined => (
      originalSignerAddress.value
        ? getAccountByProtocolAndAddress(protocol, originalSignerAddress.value)
        : undefined
    ));

    const selectedAccount = ref<IAccount | undefined>(
      originalSignerAccount.value ?? activeAccount,
    );

    const isSignerAccountMissing = computed(() => !originalSignerAccount.value);

    const rebuildForSelectedAccount = ref(false);

    const isSigningWithOtherAccount = computed(() => (
      !!selectedAccount.value?.address
      && !!originalSignerAddress.value
      && selectedAccount.value.address !== originalSignerAddress.value
    ));

    const isSignerReplaceable = computed(() => (
      isSigningWithOtherAccount.value
      // A payload whose signer this wallet does not hold is a co-sign request
      // (multisig GA, a state-channel tx naming the counterparty, an already
      // `SignedTx`): the exact bytes have to be signed as-is, never re-pointed.
      && !isSignerAccountMissing.value
      && protocol === PROTOCOLS.aeternity
      && !!popupProps.value?.txBase64
      && canRebuildTransactionForSigner(popupProps.value.txBase64 as Encoded.Transaction)
    ));

    const canSignWithSelectedAccount = computed(() => (
      !isSigningWithOtherAccount.value
      // Co-sign case: the signer is outside this wallet, so there is nothing to
      // rebuild - sign the raw bytes with the selected account, as v2.10.2 did.
      || isSignerAccountMissing.value
      || (isSignerReplaceable.value && rebuildForSelectedAccount.value)
    ));

    const dataAsString = computed((): string => popupProps.value?.txBase64?.toString() || '');

    /**
     * The Air Gap device signs whatever this modal hands it directly - nothing
     * downstream rebuilds for it - so it needs the re-pointed transaction when
     * the user opted into signing with another account.
     */
    async function getTransactionToSign(): Promise<Encoded.Transaction | undefined> {
      const txBase64 = popupProps.value?.txBase64 as Encoded.Transaction | undefined;
      if (
        !txBase64
        || !rebuildForSelectedAccount.value
        || !isSignerReplaceable.value
        || !selectedAccount.value?.address
      ) {
        return txBase64;
      }
      const aeSdk = await getAeSdk();
      return rebuildTransactionForSigner(
        txBase64,
        selectedAccount.value.address as Encoded.AccountAddress,
        async (address) => (await aeSdk.api.getAccountNextNonce(address)).nextNonce,
      );
    }

    async function confirm() {
      if (selectedAccount.value) {
        setActiveAccountByAddressAndProtocol(
          selectedAccount.value.address!,
          selectedAccount.value.protocol,
        );
      }
      if (RUNNING_IN_POPUP && selectedAccount.value?.type === ACCOUNT_TYPES.airGap) {
        const signedTransaction = await openModal<SignAirGapTransactionResolvedVal>(
          MODAL_SIGN_AIR_GAP_TRANSACTION,
          { txRaw: await getTransactionToSign() },
        );
        if (signedTransaction) {
          browser.runtime.sendMessage({
            type: AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
            payload: signedTransaction,
            target: 'offscreen',
          });
        }
      }
      const modalResolution: ISignModalResolution = {
        selectedAddress: selectedAccount.value?.address,
        rebuildForSelectedAccount: rebuildForSelectedAccount.value,
      };
      popupProps.value?.resolve(modalResolution);
    }

    function cancel() {
      popupProps.value?.reject(new RejectedByUserError());
    }

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      confirm,
      cancel,
      protocol,
      selectedAccount,
      originalSignerAddress,
      isSignerAccountMissing,
      isSignerReplaceable,
      rebuildForSelectedAccount,
      canSignWithSelectedAccount,
      dataAsString,
      isUnknownDapp,
      sender,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.confirm-raw-sign {
  .overview {
    margin: 16px;
  }

  .rebuild-for-signer {
    @extend %face-sans-15-medium;

    margin-top: 8px;
  }

  .warning {
    margin-block: 16px;
    text-align: left;

    .title {
      @extend %face-sans-15-medium;

      display: flex;
      align-items: center;
      margin-bottom: 4px;
      color: $color-warning;

      .icon {
        width: 24px;
        height: 24px;
        padding-right: 4px;
      }
    }

    .content {
      @extend %face-sans-15-regular;

      color: $color-white;
    }
  }

  .details-item {
    margin-top: 24px;
    text-align: left;
  }
}
</style>
