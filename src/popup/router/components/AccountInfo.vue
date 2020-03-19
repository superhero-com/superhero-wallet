<template>
  <div class="account-info">
    <div class="title">
      <img src="../../../icons/account-name-icon.png" />
      <div class="account-name" data-cy="account-name">
        <template v-if="activeAccountName.includes('.chain')">{{ activeAccountName }}</template>
        <router-link to="/names" v-else>Claim your .chain name</router-link>
      </div>

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

export default {
  components: { Copyicon },
  data: () => ({
    copied: false,
  }),
  computed: mapGetters(['account', 'activeAccountName']),
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
  margin: 32px 20px 0 20px;
  text-align: left;

  .title {
    display: flex;
    align-items: center;
    margin-bottom: 4px;

    img {
      margin-right: 5px;
    }

    .account-name {
      flex-grow: 1;
      font-weight: 500;
    }

    .copied-alert {
      color: $button-color;
      margin-right: 5px;
    }

    button {
      padding: 0;
    }
  }

  .ae-address {
    color: $text-color;
    font-size: 10px;
    letter-spacing: -0.1px;
  }
}
</style>
