<template>
  <Modal
    show
    full-screen
    class="message-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-labels="[
        ...(isUnknownDapp ? [$t('common.unknown')] : []),
        $t('pages.popupMessageSign.title'),
      ]"
      :sender="sender"
      :recipient="selectedAccount"
      :first-label-warning="isUnknownDapp"
    />
    <NoOriginWarning
      v-if="isUnknownDapp"
      :action="$t('unknownDapp.signMessageAction')"
      :warning="$t('unknownDapp.signMessageWarning')"
    />
    <div
      v-else
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ sender.name }}</span>
      ({{ sender.address }}) {{ $t('pages.popupMessageSign.heading') }}
    </div>

    <SignAccountSelect
      :account="selectedAccount"
      :protocol="protocol"
      :label="$t('modals.signAccountSelect.label')"
      class="sign-account-select"
      @select="selectedAccount = $event"
    />

    <DetailsItem
      :label="$t('pages.popupMessageSign.message')"
      data-cy="message"
      class="message-text"
    >
      <template #value>
        <CopyText :value="popupProps?.message" />
      </template>
    </DetailsItem>

    <template #footer>
      <BtnMain
        variant="muted"
        data-cy="deny"
        extra-padded
        :text="$t('pages.signTransaction.reject')"
        @click="cancel()"
      />
      <BtnMain
        data-cy="accept"
        :text="$t('common.confirm')"
        @click="approve()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, onUnmounted, ref } from 'vue';
import {
  ACCOUNT_TYPES,
  MODAL_LEDGER_SIGN,
  PROTOCOLS,
  RUNNING_IN_POPUP,
} from '@/constants';
import type { IAccount, ISignModalResolution } from '@/types';
import { RejectedByUserError } from '@/lib/errors';
import { useAccounts, usePopupProps, useModals } from '@/composables';

import NoOriginWarning from '@/popup/components/NoOriginWarning.vue';
import SignAccountSelect from '@/popup/components/SignAccountSelect.vue';
import Modal from '../../components/Modal.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import TransactionInfo from '../../components/TransactionInfo.vue';
import DetailsItem from '../../components/DetailsItem.vue';
import CopyText from '../../components/CopyText.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    TransactionInfo,
    DetailsItem,
    CopyText,
    NoOriginWarning,
    SignAccountSelect,
  },
  setup() {
    const { getLastActiveProtocolAccount, setActiveAccountByAddressAndProtocol } = useAccounts();
    const {
      isUnknownDapp,
      popupProps,
      sender,
      setPopupProps,
    } = usePopupProps();

    const protocol = popupProps.value?.protocol || PROTOCOLS.aeternity;
    const selectedAccount = ref<IAccount | undefined>(getLastActiveProtocolAccount(protocol));

    async function approve() {
      const { openModal } = useModals();
      if (selectedAccount.value) {
        setActiveAccountByAddressAndProtocol(
          selectedAccount.value.address!,
          selectedAccount.value.protocol,
        );
      }
      if (RUNNING_IN_POPUP && selectedAccount.value?.type === ACCOUNT_TYPES.ledger) {
        await openModal(MODAL_LEDGER_SIGN);
      }
      const modalResolution: ISignModalResolution = {
        selectedAddress: selectedAccount.value?.address,
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
      protocol,
      selectedAccount,
      isUnknownDapp,
      popupProps,
      sender,
      approve,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.message-sign {
  .subtitle {
    @extend %face-sans-15-medium;

    margin-top: 28px;
    margin-bottom: 16px;
    color: $color-grey-light;
    text-align: center;

    .app-name {
      color: $color-white;
    }
  }

  .message-text {
    margin-top: 16px;
  }
}
</style>
