<template>
  <Modal
    full-screen
    class="confirm-raw-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-title="$t('modals.confirm-raw-sign.title')"
      :sender="{ name: app.name, address: app.host, url: app.url }"
      :recipient="fromAccount || account"
    />

    <div
      class="warning"
      data-cy="warning"
    >
      <span class="title">
        <Warning class="icon" />
        {{ $t('modals.confirm-raw-sign.warning.title') }}
      </span>
      <i18n
        path="modals.confirm-raw-sign.warning.content"
        tag="span"
        class="content"
      >
        <br>
      </i18n>
    </div>

    <DetailsItem
      :label="$t('modals.confirmTransactionSign.data-sign')"
      :value="dataAsString"
      data-cy="data"
    >
      <template #value>
        <CopyText :value="dataAsString" />
      </template>
    </DetailsItem>

    <template #footer>
      <BtnMain
        variant="muted"
        third
        extra-padded
        :text="$t('modals.cancel')"
        @click="cancel"
      />
      <BtnMain
        third
        :text="$t('modals.confirm')"
        @click="confirm"
      />
    </template>
  </Modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Modal from '../Modal.vue';
import TransactionInfo from '../TransactionInfo.vue';
import BtnMain from '../buttons/BtnMain.vue';
import DetailsItem from '../DetailsItem.vue';
import Warning from '../../../icons/warning.svg?vue-component';
import CopyText from '../CopyText.vue';

export default {
  components: {
    Modal,
    TransactionInfo,
    BtnMain,
    DetailsItem,
    Warning,
    CopyText,
  },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    data: { type: [String, Uint8Array], required: true },
    app: { type: Object, required: true },
    fromAccount: { type: String, default: undefined },
  },
  computed: {
    ...mapGetters(['getExplorerPath']),
    ...mapState({
      account(_, { account }) {
        return {
          ...account,
          label: this.$t('transaction.overview.accountAddress'),
          url: this.getExplorerPath(account.address),
        };
      },
    }),
    dataAsString() {
      if (typeof this.data === 'string') return this.data;
      return Buffer.from(this.data).toString('hex');
    },
  },
  methods: {
    confirm() {
      this.resolve();
    },
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.confirm-raw-sign {
  .overview {
    margin: 16px;
  }

  .warning {
    margin: 16px;
    text-align: left;

    .title {
      @extend %face-sans-15-medium;

      display: flex;
      align-items: center;
      margin-bottom: 4px;
      color: variables.$color-warning;

      .icon {
        width: 24px;
        height: 24px;
        padding-right: 4px;
      }
    }

    .content {
      @extend %face-sans-15-regular;

      color: variables.$color-white;
    }
  }

  .details-item {
    margin: 24px 16px 16px;
    text-align: left;
  }
}
</style>
