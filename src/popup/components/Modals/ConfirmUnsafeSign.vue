<template>
  <Modal
    show
    full-screen
    class="confirm-unsafe-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-labels="[
        ...(isUnknownDapp ? [$t('common.unknown')] : []),
        ...(isAeppChatSuperhero)
          ? [$t('modals.confirmTransactionSign.superheroChat')]
          : [],
        $t('modals.confirmUnsafeSign.title'),
      ]"
      :sender="sender"
      :recipient="activeAccount"
      :first-label-warning="isUnknownDapp"
    />

    <NoOriginWarning
      v-if="isUnknownDapp"
      :action="$t('unknownDapp.signDataAction')"
      :warning="$t('unknownDapp.signDataWarning')"
    />

    <DetailsItem
      v-else
      :label="isAeppChatSuperhero ? $t('modals.confirmTransactionSign.superheroChat') : sender.name"
      class="sender"
      data-cy="aepp"
    >
      {{ sender.address }} {{ (isAeppChatSuperhero)
        ? $t('modals.confirmUnsafeSign.superheroChatJwtSign')
        : $t('modals.confirmUnsafeSign.heading') }}
    </DetailsItem>

    <span
      v-if="!isAeppChatSuperhero"
      class="warning"
      data-cy="warning"
    >
      {{ $t('modals.confirmUnsafeSign.warning') }}
    </span>

    <DetailsItem :label="$t('modals.confirmUnsafeSign.type')">
      <span
        v-text="(isJwt)
          ? $t('modals.confirmUnsafeSign.typeJwt')
          : $t('modals.confirmUnsafeSign.typeUnknown')
        "
      />
    </DetailsItem>

    <DetailsItem
      :label="$t('pages.popupMessageSign.message')"
      data-cy="message"
    >
      <template #value>
        <CopyText :value="messageToDisplay" />
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
        :text="$t('common.sign')"
        data-cy="accept"
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onUnmounted,
} from 'vue';

import {
  JWT_HEADER,
  PROTOCOLS,
  SUPERHERO_CHAT_URLS,
} from '@/constants';
import { fromBase64Url, handleUnknownError } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import { useAccounts, usePopupProps } from '@/composables';

import Modal from '../Modal.vue';
import TransactionInfo from '../TransactionInfo.vue';
import BtnMain from '../buttons/BtnMain.vue';
import DetailsItem from '../DetailsItem.vue';
import CopyText from '../CopyText.vue';
import NoOriginWarning from '../NoOriginWarning.vue';

export default defineComponent({
  components: {
    Modal,
    TransactionInfo,
    BtnMain,
    DetailsItem,
    CopyText,
    NoOriginWarning,
  },
  setup() {
    const {
      isUnknownDapp,
      popupProps,
      sender,
      setPopupProps,
    } = usePopupProps();
    const { getLastActiveProtocolAccount } = useAccounts();

    const isJwt = ref(false);
    const messageToDisplay = ref('');

    if (popupProps.value?.data) {
      messageToDisplay.value = Buffer.from(popupProps.value?.data as any).toString();

      if (Buffer.from(popupProps.value?.data as any).toString().startsWith(JWT_HEADER)) {
        try {
          const jwtToString = fromBase64Url(Buffer.from(popupProps.value?.data as any).toString().split('.')[1]).toString();
          JSON.parse(jwtToString);
          messageToDisplay.value = jwtToString;
          isJwt.value = true;
        } catch (e) {
          handleUnknownError(e);
        }
      }
    }

    const isAeppChatSuperhero = computed(
      () => SUPERHERO_CHAT_URLS
        .includes(`${popupProps.value?.app?.protocol}//${popupProps.value?.app?.name}`),
    );

    const activeAccount = getLastActiveProtocolAccount(PROTOCOLS.aeternity);

    function confirm() {
      popupProps.value?.resolve();
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
      activeAccount,
      isAeppChatSuperhero,
      isJwt,
      isUnknownDapp,
      messageToDisplay,
      sender,
      popupProps,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.confirm-unsafe-sign {
  .warning {
    @extend %face-sans-15-regular;

    margin-top: 8px;
    text-align: left;
    color: $color-warning;
  }

  .details-item {
    margin-top: 16px;
    text-align: left;

    &.sender :deep(.label) {
      color: $color-white;
    }
  }
}
</style>
