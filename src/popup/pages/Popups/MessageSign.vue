<template>
  <Modal
    full-screen
    class="message-sign"
    data-cy="popup-aex2"
  >
    <Overview
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
      :value="message"
      data-cy="message"
    >
      <template #label>
        <BtnCopy
          :value="message"
          :message="$t('copied')"
        />
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
import BtnCopy from '../../components/buttons/BtnCopy.vue';
import Overview from '../../components/Overview.vue';
import DetailsItem from '../../components/DetailsItem.vue';
import mixin from './mixin';

export default {
  components: {
    Modal,
    BtnMain,
    Overview,
    DetailsItem,
    BtnCopy,
  },
  mixins: [mixin],
  props: {
    message: { type: String, required: true },
    app: { type: Object, required: true },
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
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.message-sign {
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

  .details-item {
    margin: 16px;
    text-align: left;
  }
}
</style>
