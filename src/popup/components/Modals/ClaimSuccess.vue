<template>
  <Modal
    has-close-button
    centered
    @close="resolve"
  >
    <CheckIcon class="check-icon" />
    <span>
      <b>{{ $t('pages.claim.url') }}:</b>
      {{ url }}
    </span>
    <span>
      <b>{{ $t('pages.claim.tipsOnUrl') }}:</b>
      {{ claimAmount }}
      {{ $t('pages.claim.ae') }}
    </span>
    <span class="claimed">{{ $t('pages.claim.claimed') }}</span>

    <template #footer>
      <BtnMain @click="resolve">
        {{ $t('common.ok') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ResolveCallback } from '../../../types';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import CheckIcon from '../../../icons/check-icon.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    CheckIcon,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    url: { type: String, required: true },
    claimAmount: { type: Number, required: true },
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.check-icon {
  align-self: center;
  margin-bottom: 8px;
}

.claimed {
  color: variables.$color-primary;
}
</style>
