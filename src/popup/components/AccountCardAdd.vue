<template>
  <AccountCardBase
    class="account-card-add"
    data-cy="account-card-add"
    :selected="selected"
    @click="openCreateAccountModal()"
  >
    <template #top>
      <div class="title">
        <PlusCircleIcon class="plus-icon" />
        {{
          isMultisig
            ? $t('pages.vaults.addVault')
            : $t('pages.accounts.addAccount')
        }}
      </div>
    </template>

    <template #middle>
      <div class="description">
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
import { MODAL_ACCOUNT_CREATE, MODAL_AE_ACCOUNT_CREATE } from '@/constants';
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

    function openCreateAccountModal() {
      if (props.isMultisig) {
        openModal(MODAL_AE_ACCOUNT_CREATE, { isMultisig: props.isMultisig });
      } else {
        openModal(MODAL_ACCOUNT_CREATE);
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
    @extend %face-sans-20-bold;

    display: flex;
    align-items: center;
    padding-bottom: 12px;
    color: $color-white;
    font-weight: 500;

    .plus-icon {
      width: 48px;
      height: 48px;
      margin-right: 8px;
    }
  }

  .description {
    @extend %face-sans-16-medium;

    padding-left: 12px;
    color: rgba($color-white, 0.85);
    line-height: 22px;
  }
}
</style>
