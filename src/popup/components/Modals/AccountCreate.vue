<template>
  <Modal
    class="account-create"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <h2 class="text-heading-2">
      {{ $t('modals.createAccount.title') }}
    </h2>

    <p class="message">
      {{ $t('modals.createAccount.msg') }}
    </p>

    <BtnSubheader
      :header="$t('modals.createAccount.btnText')"
      :subheader="$t('modals.createAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      @click="createAccount()"
    />

    <Loader v-if="loading" />
  </Modal>
</template>

<script>
import BtnSubheader from '../buttons/BtnSubheader.vue';
import Modal from '../Modal.vue';
import PlusCircleIcon from '../../../icons/plus-circle-fill.svg?vue-component';
import Loader from '../Loader.vue';

export default {
  components: {
    Modal,
    BtnSubheader,
    Loader,
  },
  props: {
    resolve: { type: Function, required: true },
  },
  data: () => ({
    PlusCircleIcon,
    loading: false,
  }),
  methods: {
    async createAccount() {
      this.loading = true;
      await this.$store.dispatch('accounts/hdWallet/create');
      this.loading = false;
      this.resolve();
    },
  },
};
</script>

<style lang="scss" scoped>
.account-create {
  .message {
    max-width: 280px;
    margin: 0 auto 36px;
  }
}
</style>
