<template>
  <Modal
    full-screen
    class="connect"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :title="$t('pages.connectConfirm.title')"
      :sender="{ name: appName, address: app.host, url: app.url }"
      :recipient="account"
    />

    <div
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ appName }}</span>
      ({{ app.host }}) {{ $t('pages.connectConfirm.websiteRequestconnect') }}
    </div>

    <div class="permissions">
      <template v-if="access.includes(POPUP_CONNECT_ADDRESS_PERMISSION)">
        <span class="title">
          <CheckMark class="icon" /> {{ $t('pages.connectConfirm.addressLabel') }}
        </span>
        <span class="description">
          {{ $t('pages.connectConfirm.addressRequest') }}
        </span>
      </template>
      <template v-if="access.includes(POPUP_CONNECT_TRANSACTIONS_PERMISSION)">
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
        variant="muted"
        data-cy="deny"
        extra-padded
        :text="$t('pages.connectConfirm.cancelButton')"
        @click="cancel()"
      />
      <BtnMain
        data-cy="accept"
        :text="$t('pages.connectConfirm.confirmButton')"
        :disabled="!isConnected"
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import {
  POPUP_CONNECT_ADDRESS_PERMISSION,
  POPUP_CONNECT_TRANSACTIONS_PERMISSION,
} from '../../utils';
import mixin from './mixin';
import Modal from '../../components/Modal.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import TransactionInfo from '../../components/TransactionInfo.vue';
import CheckMark from '../../../icons/check-mark.svg?vue-component';

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
    access: {
      type: Array,
      default: () => ([
        POPUP_CONNECT_ADDRESS_PERMISSION,
        POPUP_CONNECT_TRANSACTIONS_PERMISSION,
      ]),
    },
  },
  data() {
    return {
      POPUP_CONNECT_ADDRESS_PERMISSION,
      POPUP_CONNECT_TRANSACTIONS_PERMISSION,
    };
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
      permission(state) {
        return state.permissions[this.app.host];
      },
    }),
    appName() {
      return this.permission?.name || this.app.name;
    },
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
        ...this.permission,
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
