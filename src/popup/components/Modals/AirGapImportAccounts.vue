<template>
  <Modal
    from-bottom
    has-close-button
    class="air-gap-import-accounts"
    @close="cancel()"
  >
    <ModalHeader
      no-padding
      :title="$t('airGap.importAccount.importConfirmDialog.title')"
      :subtitle="$t('airGap.importAccount.importConfirmDialog.description')"
    />

    <FormScanQrResult
      v-model="syncCode"
      class="sync-code-input"
      :label="$t('airGap.syncCode.inputLabel')"
      :placeholder="$t('airGap.syncCode.inputPlaceholder')"
      :qr-title="$t('airGap.importAccount.scanDescription')"
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
    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('common.cancel')"
        @click="cancel()"
      />
      <BtnMain
        extra-padded
        :text="$t('airGap.importAccount.importConfirmDialog.importAccount')"
        :disabled="!canImportAccounts"
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from 'vue';
import { throttle } from 'lodash-es';

import { useAccounts, useAirGap } from '@/composables';
import type { IAccount, RejectCallback } from '@/types';
import { parseCodeToBytes } from '@/utils';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AccountImportRow from '../AccountImportRow.vue';
import FormScanQrResult from '../form/FormScanQrResult.vue';
import ModalHeader from '../ModalHeader.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    AccountImportRow,
    FormScanQrResult,
    ModalHeader,
  },
  props: {
    resolve: {
      type: Function as PropType<(selectedAccounts: IAccount[]) => void>,
      required: true,
    },
    reject: { type: Function as PropType<RejectCallback>, required: true },
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
        ) as unknown as IAccount[];
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
@use '@/styles/variables' as *;
@use '@/styles/typography';

.air-gap-import-accounts {
  .sync-code-input {
    margin-bottom: 18px;
  }

  .account-row {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-flow: row;
    padding: 0 8px;
    padding-bottom: 8px;

    .account-import-row {
      flex: 1;
    }

    &.disabled {
      opacity: 0.5;
    }
  }
}
</style>
