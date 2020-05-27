<template>
  <Modal @close="resolve" class="default-modal">
    <template slot="header">
      {{ $t('modals.error-log.title') }}
    </template>
    <template slot="body">
      <!--eslint-disable-next-line vue-i18n/no-raw-text-->
      <div class="error-msg">{{ message }}...</div>
      <div>
        <span>{{ $t('modals.error-log.sub-title') }}</span>
        {{ $t('modals.error-log.content') }}
      </div>
    </template>
    <div class="modal-confirm-btns" slot="footer">
      <Button dark @click="cancel">
        {{ $t('modals.cancel') }}
      </Button>
      <Button @click="createReport">
        {{ $t('modals.error-log.create-report') }}
      </Button>
    </div>
  </Modal>
</template>

<script>
import Modal from '../Modal';

export default {
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    entry: { type: Object, required: true },
  },
  components: { Modal },
  computed: {
    message() {
      const { message = '' } = this.error;
      return message.substr(0, 150);
    },
    error() {
      return this.entry.error;
    },
  },
  methods: {
    cancel() {
      this.reject(new Error('reject'));
    },
    createReport() {
      this.resolve(true);
      this.$router.push({ name: 'donate-error', params: { entry: this.entry } });
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../common/variables';

.error-msg {
  color: $error-color;
  margin-bottom: 30px;
}

span {
  display: block;
  font-weight: bold;
}
</style>
