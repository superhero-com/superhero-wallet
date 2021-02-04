<template>
  <div class="account-info">
    <div class="title">
      <div class="account-name" data-cy="account-name">
        <Avatar :address="account.publicKey" :name="account.name" class="avatar" size="small" />
        <span class="chainname" v-if="activeAccountName.includes('.chain')">{{
          ellipseStringMid(activeAccountName, 30)
        }}</span>
        <router-link class="claim-chainname" to="/names" v-else
          >{{ $t('pages.account.claim-name') }}
        </router-link>
      </div>
      <div class="copied-alert" v-if="copied">{{ $t('pages.account.copied') }}</div>
      <button v-show="!copied" data-cy="copy" @click="copy" v-clipboard:copy="account.publicKey">
        {{ $t('pages.account.copy') }}
      </button>
    </div>
    <div class="ae-address">{{ account.publicKey }}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { ellipseStringMid } from '../../utils/helper';
import Avatar from './Avatar';

export default {
  components: { Avatar },
  data: () => ({
    copied: false,
  }),
  computed: mapGetters(['account', 'activeAccountName']),
  methods: {
    ellipseStringMid,
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
@import '../../../styles/variables';

.account-info {
  padding: 20px 20px 0 20px;
  text-align: left;

  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
    line-height: 21px;

    img {
      margin-right: 5px;
    }

    .account-name {
      font-weight: 400;
      color: #fff;
      line-height: 21px;
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: start;
      overflow: hidden;

      ::-webkit-scrollbar {
        display: none;
      }

      .chainname {
        overflow: scroll;
        scrollbar-width: none;
      }

      .avatar {
        margin-right: 10px;
      }
    }

    .help-icon {
      margin-left: 10px;
      margin-right: auto;
    }

    .copied-alert,
    button {
      font-size: 13px;
      font-weight: 600;
    }

    .copied-alert {
      color: $button-color;
      margin-left: auto;
    }

    button {
      font-family: inherit;
      padding: 0;
    }
  }

  .ae-address {
    color: $text-color;
    font-size: 10px;
    letter-spacing: -0.2px;
  }

  .claim-chainname {
    color: $white-1;
  }
}
</style>
