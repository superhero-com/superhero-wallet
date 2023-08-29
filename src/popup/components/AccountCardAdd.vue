<template>
  <BtnBase
    class="account-card-add"
    @click="openCreateAccountModal()"
  >
    <span class="title">
      <PlusCircle />
      {{
        isMultisig
          ? $t('pages.vaults.addVault')
          : $t('pages.accounts.addAccount')
      }}
    </span>
    <span class="description">
      {{
        isMultisig
          ? $t('pages.vaults.addVaultDescription')
          : $t('pages.accounts.addAccountDescription')
      }}
    </span>
  </BtnBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { MODAL_ACCOUNT_CREATE } from '@/constants';
import { useModals } from '@/composables';

import BtnBase from '@/popup/components/buttons/BtnBase.vue';
import PlusCircle from '../../icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  components: {
    BtnBase,
    PlusCircle,
  },
  props: {
    isMultisig: Boolean,
  },
  setup(props) {
    const { openModal } = useModals();

    function openCreateAccountModal() {
      openModal(MODAL_ACCOUNT_CREATE, {
        isMultisig: props.isMultisig,
      });
    }

    return {
      openCreateAccountModal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.account-card-add {
  display: flex;
  flex-direction: column;
  border-radius: variables.$border-radius-card;
  background: variables.$color-bg-6;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  width: 100%;
  height: 192px;

  .title {
    display: inline-flex;
    align-items: center;
    padding-bottom: 12px;
    color: variables.$color-white;
    font-weight: 500;

    @extend %face-sans-20-bold;

    svg {
      width: 48px;
      height: 48px;
      margin-right: 8px;
    }
  }

  .description {
    text-align: center;
    padding: 0 4px 0 12px;
    color: rgba(variables.$color-white, 0.85);
    line-height: 22px;

    @extend %face-sans-16-regular;
  }
}
</style>
