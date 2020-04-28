<template>
  <div class="account-info">
    <div class="title">
      <div class="account-name" data-cy="account-name">
        <template v-if="chainName">{{ activeAccountName }}</template>
        <router-link to="/names" v-else>Claim your .chain name</router-link>
      </div>
      <Help class="help-icon" />
      <div class="copied-alert" v-if="copied">{{ $t('pages.account.copied') }}</div>
      <button data-cy="copy" @click="copy" v-clipboard:copy="account.publicKey">
        <Copyicon />
      </button>
    </div>

    <div class="ae-address">{{ account.publicKey }}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Copyicon from '../../../icons/copy.svg?vue-component';
import Help from '../../../icons/help-icon.svg?vue-component';

export default {
  components: { Copyicon, Help },
  data: () => ({
    copied: false,
  }),
  computed: {
    ...mapGetters(['account', 'activeAccountName']),
    chainName() {
      return this.activeAccountName.includes('.chain');
    },
  },
  methods: {
    copy() {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.account-info {
  padding: 20px 20px 0 20px;
  text-align: left;

  .title {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    line-height: 21px;

    img {
      margin-right: 5px;
    }

    .account-name {
      font-weight: 400;
      color: #fff;
      line-height: 21px;
    }

    .help-icon {
      margin-left: 10px;
      margin-right: auto;
    }

    .copied-alert {
      color: $button-color;
      margin-right: 7px;
      margin-left: auto;
    }

    button {
      padding: 0;
    }
  }

  .ae-address {
    color: $text-color;
    font-size: 10px;
    letter-spacing: -0.2px;
  }
}
</style>
