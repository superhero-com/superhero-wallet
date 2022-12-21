<template>
  <Modal
    full-screen
    class="message-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :title="$t('pages.popupMessageSign.title')"
      :sender="{ name: app.name, address: app.host, url: app.url }"
      :recipient="account"
    />

    <div
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ app.name }}</span>
      ({{ app.host }}) {{ $t('pages.popupMessageSign.heading') }}
    </div>

    <DetailsItem
      :label="$t('pages.popupMessageSign.message')"
      data-cy="message"
    >
      <template #value>
        <CopyText :value="message" />
      </template>
    </DetailsItem>

    <template #footer>
      <BtnMain
        variant="secondary"
        data-cy="deny"
        @click="cancel()"
      >
        {{ $t('pages.signTransaction.reject') }}
      </BtnMain>
      <BtnMain
        data-cy="accept"
        :disabled="!isConnected"
        @click="resolve()"
      >
        {{ $t('pages.signTransaction.confirm') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Modal from '../../components/Modal.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import TransactionInfo from '../../components/TransactionInfo.vue';
import DetailsItem from '../../components/DetailsItem.vue';
import CopyText from '../../components/CopyText.vue';
import mixin from './mixin';

export default {
  components: {
    Modal,
    BtnMain,
    TransactionInfo,
    DetailsItem,
    CopyText,
  },
  mixins: [mixin],
  props: {
    message: { type: String, required: true },
    app: { type: Object, required: true },
  },
  computed: {
    ...mapGetters([
      'isConnected',
      'getExplorerPath',
    ]),
    ...mapState({
      account(_, { account }) {
        return {
          ...account,
          label: this.$t('transaction.overview.accountAddress'),
          url: this.getExplorerPath(account.address),
        };
      },
    }),
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.message-sign {
  .transaction-info {
    margin-bottom: 16px;
  }

  .subtitle {
    @extend %face-sans-15-medium;

    margin-top: 24px;
    margin-bottom: 16px;
    color: variables.$color-grey-light;
    text-align: center;

    .app-name {
      color: variables.$color-white;
    }
  }

  .details-item {
    margin: 16px;
    text-align: left;
  }
}
</style>
