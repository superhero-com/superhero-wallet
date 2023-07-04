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
        :class="{disabled: isAccountAlreadyImported(account)}"
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
import { computed, defineComponent, PropType } from '@vue/composition-api';
import type { IAccount } from '../../../types';
import { useState } from '../../../composables/vuex';

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
      // eslint-disable-next-line no-unused-vars
      type: Function as PropType<(selectedAccounts: IAccount[]) => void>,
      required: true,
    },
    reject: { type: Function as PropType<() => void>, required: true },
    accounts: { type: Array as PropType<IAccount[]>, required: true },
  },
  setup(props) {
    const importedAccounts = useState<IAccount[]>('accounts', 'list');
    const canImportAccounts = computed(() => props.accounts.length > 0);

    function isAccountAlreadyImported(account: IAccount) {
      return importedAccounts.value.some((acc) => acc.address === account.address);
    }

    function confirm() {
      props.resolve(props.accounts.filter((account) => !isAccountAlreadyImported(account)));
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
