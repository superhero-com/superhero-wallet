<template>
  <Modal
    show
    has-close-button
    class="ledger-sign"
    @close="reject()"
  >
    <div class="top-icon-wrapper">
      <IconBoxed
        icon-padded
        bg-colored
        outline-colored
      >
        <LedgerIcon class="icon" />
      </IconBoxed>
    </div>

    <h2
      class="text-heading-4 text-center title"
      v-text="$t('ledger.sign.title')"
    />

    <span
      class="subtitle"
      v-text="$t('ledger.sign.subtitle')"
    />

    <div class="info">
      <p v-text="$t('ledger.sign.confirm')" />
      <p v-text="$t('ledger.sign.unlock')" />
    </div>

    <template #footer>
      <BtnMain
        :text="$t('common.ok')"
        @click="resolve()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { ResolveCallback } from '@/types';

import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';
import Modal from '@/popup/components/Modal.vue';

import LedgerIcon from '@/icons/ledger.svg?vue-component';

export default defineComponent({
  components: {
    BtnMain,
    IconBoxed,
    Modal,
    LedgerIcon,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<ResolveCallback>, required: true },
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.ledger-sign {
  .top-icon-wrapper {
    margin-bottom: 20px;
    text-align: center;
    color: $color-grey-medium;

    .icon {
      color: rgba($color-white, 0.75);
    }
  }

  .subtitle {
    @extend %face-sans-16-medium;

    line-height: 24px;
    text-align: center;
  }

  .info {
    margin-top: 16px;
    text-align: center;
  }
}
</style>
