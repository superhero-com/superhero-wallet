<template>
  <Modal
    has-close-button
    centered
    @close="resolve"
  >
    <CheckIcon /> <br>
    <b>{{ $t('pages.claim.url') }}:</b> {{ url }} <br>
    <b>{{ $t('pages.claim.tipsOnUrl') }}:</b> {{ claimAmount }} {{ $t('pages.claim.ae') }} <br>
    <span class="claimed">{{ $t('pages.claim.claimed') }}</span>

    <Button
      slot="footer"
      @click="resolve"
    >
      {{ $t('ok') }}
    </Button>
  </Modal>
</template>

<script>
import Modal from '../Modal.vue';
import Button from '../Button.vue';
import CheckIcon from '../../../../icons/check-icon.svg?vue-component';

export default {
  components: { Modal, Button, CheckIcon },
  props: {
    resolve: { type: Function, required: true },
    url: { type: String, required: true },
    claimAmount: { type: Number, required: true },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';

.claimed {
  color: variables.$color-blue;
}
</style>
