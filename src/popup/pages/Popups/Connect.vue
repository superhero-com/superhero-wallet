<template>
  <Modal
    full-screen
    class="connect"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :title="$t('pages.connectConfirm.title')"
      :sender="{ name: app.name, address: app.host, url: app.url }"
      :recipient="account"
    />

    <div
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ app.name }}</span>
      ({{ app.host }}) {{ $t('pages.connectConfirm.websiteRequestconnect') }}
    </div>

    <div class="permissions">
      <template v-if="permissions.includes('address')">
        <span class="title">
          <CheckMark class="icon" /> {{ $t('pages.connectConfirm.addressLabel') }}
        </span>
        <span class="description">
          {{ $t('pages.connectConfirm.addressRequest') }}
        </span>
      </template>
      <template v-if="permissions.includes('transactions')">
        <span class="title">
          <CheckMark class="icon" /> {{ $t('pages.connectConfirm.transactionLabel') }}
        </span>
        <span class="description">
          {{ $t('pages.connectConfirm.transactionRequest') }}
        </span>
      </template>
    </div>

    <template #footer>
      <BtnMain
        variant="secondary"
        data-cy="deny"
        @click="cancel()"
      >
        {{ $t('pages.connectConfirm.cancelButton') }}
      </BtnMain>
      <BtnMain
        data-cy="accept"
        @click="confirm()"
      >
        {{ $t('pages.connectConfirm.confirmButton') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Modal from '../../components/Modal.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import TransactionInfo from '../../components/TransactionInfo.vue';
import CheckMark from '../../../icons/check-mark.svg?vue-component';
import mixin from './mixin';

export default {
  components: {
    Modal,
    BtnMain,
    TransactionInfo,
    CheckMark,
  },
  mixins: [mixin],
  props: {
    app: { type: Object, required: true },
    permissions: { type: Array, default: () => (['address', 'transactions']) },
  },
  computed: {
    ...mapGetters([
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
  methods: {
    confirm() {
      this.$store.commit('permissions/addPermission', {
        address: false,
        messageSign: false,
        transactionSignLimit: 0,
        transactionSignLimitLeft: 0,
        transactionSignFirstAskedOn: null,
        ...this.app,
      });
      this.resolve();
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.connect {
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

  .permissions {
    margin: 16px 0;

    .title {
      @extend %face-sans-15-medium;

      display: flex;
      align-items: center;
      padding-bottom: 4px;
      color: variables.$color-grey-dark;

      .icon {
        width: 24px;
        height: 24px;
        color: variables.$color-success;
        padding-right: 4px;
      }
    }

    .description {
      @extend %face-sans-15-regular;

      display: block;
      padding-bottom: 16px;
      color: variables.$color-white;
      text-align: left;
    }
  }
}
</style>
