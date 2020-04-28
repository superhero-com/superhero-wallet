<template>
  <Modal @close="resolve">
    <template slot="header">
      <template v-if="status === 'verified'">{{ $t('modals.verified.title') }}</template>
      <template v-else-if="status === 'not-supported'">{{
        $t('modals.not-supported.title')
      }}</template>
      <template v-else-if="status === 'blacklisted'">{{ $t('modals.blacklisted.title') }}</template>
    </template>
    <div slot="body">
      <template v-if="status === 'verified'">{{ $t('modals.verified.msg') }}</template>
      <template v-else-if="status === 'not-supported'">{{
        $t('modals.not-supported.msg')
      }}</template>
      <template v-else-if="status === 'blacklisted'">{{ $t('modals.blacklisted.msg') }}</template>
    </div>
    <div slot="footer">
      <Button class="ok-button" @click="resolve">{{ $t('modals.ok') }}</Button>
    </div>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';

export default {
  props: {
    resolve: { type: Function, required: true },
    status: { type: String, required: true },
  },
  components: { Modal, Button },
};
</script>

<style lang="scss" scoped>
.ok-button {
  width: 120px !important;
}
</style>
