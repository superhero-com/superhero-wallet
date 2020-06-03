<template>
  <div class="account-info">
    <div class="title">
      <div class="account-name" data-cy="account-name">
        <UserAvatar :address="account.publicKey" :name="account.name" class="avatar" size="small" />
        <template v-if="activeAccountName.includes('.chain')">{{ activeAccountName }}</template>
        <router-link to="/names" v-else>{{ $t('pages.account.claim-name') }} </router-link>
      </div>
      <div class="copied-alert" v-if="copied">{{ $t('pages.account.copied') }}</div>
      <button data-cy="copy" @click="copy" v-clipboard:copy="account.publicKey">
        {{ $t('pages.account.copy') }}
      </button>
    </div>
    <div class="ae-address">{{ account.publicKey }}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import UserAvatar from './UserAvatar';

export default {
  components: { UserAvatar },
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
      margin-right: auto;
      display: flex;
      align-items: center;
      justify-content: start;

      .avatar {
        margin-right: 10px;
      }
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
