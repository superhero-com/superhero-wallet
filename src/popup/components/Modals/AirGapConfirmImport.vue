<template>
  <Modal
    full-screen
    has-close-button
    dense
    class="air-gap-confirm-import"
    @close="cancel()"
  >
    <div>
      <div class="title">
        {{ $t('modals.importAirGapAccount.importConfirmDialog.title') }}
      </div>
      <div
        v-if="accounts.length"
        class="description"
      >
        {{ $t('modals.importAirGapAccount.importConfirmDialog.description') }}
      </div>
      <div
        v-else
        class="message"
      >
        {{ $t('modals.importAirGapAccount.importConfirmDialog.noAccountsFound') }}
      </div>
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
import { computed, defineComponent, PropType } from 'vue';

import { useAccounts } from '@/composables';
import type { IAccount } from '@/types';
<<<<<<< Updated upstream
=======
import { parseCodeToBytes } from '@/utils';
>>>>>>> Stashed changes

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AccountImportRow from '../AccountImportRow.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    AccountImportRow,
  },
  props: {
    resolve: {
      type: Function as PropType<(selectedAccounts: IAccount[]) => void>,
      required: true,
    },
    reject: { type: Function as PropType<() => void>, required: true },
    accounts: { type: Array as PropType<IAccount[]>, required: true },
  },
  setup(props) {
    // TODO AIRGAP: implement multiple accounts selection
    const { aeAccounts } = useAccounts();
    function isAccountAlreadyImported(account: IAccount) {
      return aeAccounts.value.some((acc) => acc.address === account.address);
    }

    const selectedAccounts = computed(
      () => props.accounts.filter((account) => !isAccountAlreadyImported(account)),
    );
    const canImportAccounts = computed(() => selectedAccounts.value.length > 0);

    function confirm() {
      props.resolve(selectedAccounts.value);
    }

    function cancel() {
      props.reject();
    }

    return {
      confirm,
      cancel,
      isAccountAlreadyImported,
      canImportAccounts,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.air-gap-confirm-import {
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

  .account-row {
    @include mixins.flex(flex-start, center, row);

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
