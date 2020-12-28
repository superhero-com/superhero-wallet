<template>
  <Modal @close="resolve" close>
    <template slot="header">
      {{ $t('modals.error-log.title') }}
    </template>

    <!--eslint-disable-next-line vue-i18n/no-raw-text-->
    <div class="error-msg">{{ message }}...</div>
    <div>
      <span>{{ $t('modals.error-log.sub-title') }}</span>
      {{ $t('modals.error-log.content') }}
    </div>

    <template slot="footer">
      <Button dark @click="cancel">
        {{ $t('modals.cancel') }}
      </Button>
      <Button @click="createReport">
        {{ $t('modals.error-log.create-report') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import Modal from '../Modal';
import Button from '../Button';

export default {
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    entry: { type: Object, required: true },
  },
  components: { Modal, Button },
  computed: {
    message() {
      const { message = '' } = this.entry.error;
      return message.substr(0, 150);
    },
  },
  methods: {
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
    createReport() {
      this.resolve(true);
      this.$router.push({ name: 'donate-error', params: { entry: this.entry } });
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../styles/variables';

.error-msg {
  color: $error-color;
  margin-bottom: 30px;
}

span {
  display: block;
  font-weight: bold;
}
</style>
