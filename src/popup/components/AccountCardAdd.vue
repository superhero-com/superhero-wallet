<template>
  <AccountCardBase
    class="account-card-add"
    data-cy="account-card-add"
    :selected="selected"
    @click="openCreateAccountModal()"
  >
    <template #top>
      <div class="title text-heading-2">
        <PlusCircleIcon class="plus-icon" />
        <strong>
          {{
            isMultisig
              ? $t('pages.vaults.addVault')
              : $t('pages.accounts.addAccount')
          }}
        </strong>
      </div>
    </template>

    <template #middle>
      <div class="text-caption caption">
        {{
          isMultisig
            ? $t('pages.vaults.addVaultDescription')
            : $t('pages.accounts.addAccountDescription')
        }}
      </div>
    </template>
  </AccountCardBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';

import type { Protocol } from '@/types';
import { MODAL_PROTOCOL_SELECT, MODAL_ACCOUNT_CREATE, PROTOCOLS } from '@/constants';
import { useModals } from '@/composables';

import AccountCardBase, { accountCardBaseCommonProps } from '@/popup/components/AccountCardBase.vue';
import PlusCircleIcon from '../../icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  components: {
    AccountCardBase,
    PlusCircleIcon,
  },
  props: {
    isMultisig: Boolean,
    ...accountCardBaseCommonProps,
  },
  setup(props) {
    const { openModal } = useModals();
    const { t } = useI18n();

    async function openCreateAccountModal() {
      if (props.isMultisig) {
        openModal(MODAL_ACCOUNT_CREATE, {
          protocol: PROTOCOLS.aeternity,
          isMultisig: props.isMultisig,
        });
      } else {
        const selectedProtocol = await openModal<Protocol>(MODAL_PROTOCOL_SELECT, {
          title: t('modals.createAccount.title'),
          subtitle: t('modals.createAccount.generateOrImport'),
          resolve: (protocol: Protocol) => protocol,
        });
        openModal(MODAL_ACCOUNT_CREATE, { protocol: selectedProtocol });
      }
    }

    return {
      openCreateAccountModal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.account-card-add {
  .title {
    display: flex;
    align-items: center;
    padding-bottom: 12px;
    color: $color-white;

    .plus-icon {
      width: 48px;
      height: 48px;
      margin-right: 8px;
    }
  }

  .caption {
    padding-left: 12px;
    color: rgba($color-white, 0.85);
  }
}
</style>
