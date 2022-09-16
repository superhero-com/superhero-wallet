<template>
  <Modal
    full-screen
    class="connect"
    data-cy="popup-aex2"
  >
    <Overview
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
      <span class="title">
        <CheckMark class="icon" /> {{ $t('pages.connectConfirm.addressLabel') }}
      </span>
      <span class="description">
        {{ $t('pages.connectConfirm.addressRequest') }}
      </span>
      <span class="title">
        <CheckMark class="icon" /> {{ $t('pages.connectConfirm.transactionLabel') }}
      </span>
      <span class="description">
        {{ $t('pages.connectConfirm.transactionRequest') }}
      </span>
    </div>

    <template slot="footer">
      <BtnMain
        variant="secondary"
        data-cy="deny"
        @click="cancel()"
      >
        {{ $t('pages.connectConfirm.cancelButton') }}
      </BtnMain>
      <BtnMain
        data-cy="accept"
        @click="resolve()"
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
import Overview from '../../components/Overview.vue';
import CheckMark from '../../../icons/check-mark.svg?vue-component';
import mixin from './mixin';

export default {
  components: {
    Modal,
    BtnMain,
    Overview,
    CheckMark,
  },
  mixins: [mixin],
  props: { app: { type: Object, required: true } },
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
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.connect {
  .overview {
    margin: 16px;
  }

  .subtitle {
    margin: 24px 16px 16px;

    @extend %face-sans-15-medium;

    color: variables.$color-light-grey;
    text-align: center;

    .app-name {
      color: variables.$color-white;
    }
  }

  .permissions {
    margin: 16px;

    .title {
      display: flex;
      align-items: center;
      padding-bottom: 4px;

      @extend %face-sans-15-medium;

      color: variables.$color-dark-grey;

      .icon {
        width: 24px;
        height: 24px;
        color: variables.$color-green;
        padding-right: 4px;
      }
    }

    .description {
      display: block;
      padding-bottom: 16px;

      @extend %face-sans-15-regular;

      color: variables.$color-white;
      text-align: left;
    }
  }
}
</style>
