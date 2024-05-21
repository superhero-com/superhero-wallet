<template>
  <Modal
    from-bottom
    has-close-button
    dense
    class="air-gap-import-accounts"
    @close="cancel()"
  >
    <div>
      <ModalHeader
        no-padding
        :title="$t('modals.importAirGapAccount.importConfirmDialog.title')"
        :subtitle="$t('modals.importAirGapAccount.importConfirmDialog.description')"
      />

      <FormInputWithQr
        v-model="syncCode"
        class="sync-code-input"
        qr-icon="critical"
        :label="$t('modals.airGapSyncCode.inputLabel')"
        :placeholder="$t('modals.airGapSyncCode.inputPlaceholder')"
        :qr-title="$t('modals.importAirGapAccount.scanDescription')"
        @update:model-value="throttledHandleInput"
      />

      <div
        v-for="account in accounts"
        :key="account.address"
        class="account-row"
        :class="{ disabled: isAccountAlreadyImported(account) }"
      >
        <AccountImportRow :account="account" />
      </div>
    </div>
    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('common.cancel')"
        @click="cancel()"
      />
      <BtnMain
        extra-padded
        :text="$t('modals.importAirGapAccount.importConfirmDialog.importAccount')"
        :disabled="!canImportAccounts"
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed, defineComponent, PropType, ref,
} from 'vue';
import { throttle } from 'lodash-es';

import { useAccounts, useAirGap } from '@/composables';
import type { IAccount } from '@/types';
import { parseCodeToBytes } from '@/utils';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AccountImportRow from '../AccountImportRow.vue';
import FormInputWithQr from '../form/FormInputWithQr.vue';
import ModalHeader from '../ModalHeader.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    AccountImportRow,
    FormInputWithQr,
    ModalHeader,
  },
  props: {
    resolve: {
      type: Function as PropType<(selectedAccounts: IAccount[]) => void>,
      required: true,
    },
    reject: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    // TODO AIRGAP: implement multiple accounts selection
    const syncCode = ref('');
    const accounts = ref<IAccount[] | null>(null);

    const { deserializeData, extractAccountShareResponseData } = useAirGap();
    const { aeAccounts } = useAccounts();

    function isAccountAlreadyImported(account: IAccount) {
      return aeAccounts.value.some((acc) => acc.address === account.address);
    }

    const selectedAccounts = computed(
      () => accounts.value?.filter((account) => !isAccountAlreadyImported(account)),
    );
    const canImportAccounts = computed(() => selectedAccounts.value?.length);

    async function handleInput() {
      if (!syncCode.value) {
        return;
      }
      let parsedCode;
      try {
        // Codes copied from AirGap need to be parsed
        parsedCode = await parseCodeToBytes(syncCode.value);
      } catch (e) {
        parsedCode = syncCode.value;
      }
      try {
        const deserializedData = await deserializeData(parsedCode!);
        accounts.value = (
          await extractAccountShareResponseData(deserializedData) || []
        ) as IAccount[];
      } catch (error) {} // eslint-disable-line no-empty
    }

    const throttledHandleInput = throttle(handleInput, 100);

    function confirm() {
      props.resolve(selectedAccounts.value!);
    }

    function cancel() {
      props.reject();
    }

    return {
      syncCode,
      canImportAccounts,
      accounts,
      throttledHandleInput,
      confirm,
      cancel,
      isAccountAlreadyImported,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
@use '@/styles/typography';
@use '@/styles/mixins';

.air-gap-import-accounts {
  .title {
    @extend %face-sans-18-bold;

    color: variables.$color-white;
    text-align: center;
    padding: 12px;
  }

  .description {
    @extend %face-sans-16-regular;

    color: variables.$color-white;
    line-height: 24px;
    text-align: center;
    padding: 12px;
    margin-bottom: 20px;
  }

  .sync-code-input {
    padding: 0 16px;
    margin-bottom: 18px;
  }

  .account-row {
    @include mixins.flex(flex-start, center, row);
    padding: 0 8px;
    padding-bottom: 8px;

    .account-import-row {
      flex: 1;
    }

    &.disabled {
      opacity: 0.5;
    }
  }

  .message {
    @extend %face-sans-15-medium;

    color: variables.$color-grey-light;
    text-align: center;
    padding: 48px 64px 0;
  }
}
</style>
