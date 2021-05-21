<template>
  <div :class="['account-info', { edit, copied }]">
    <div class="account-buttons">
      <button
        v-if="idx !== 0 && $route.path === '/accounts'"
        class="remove"
        @click="remove"
      >
        <Remove />
      </button>
      <RouterLink
        v-if="UNFINISHED_FEATURES && $route.path !== '/accounts'"
        to="/accounts"
      >
        <Settings />
      </RouterLink>
      <button
        v-if="UNFINISHED_FEATURES && idx === 0"
        @click="createAccount"
      >
        <Add />
      </button>
      <button
        v-clipboard:copy="accounts[idx].address"
        data-cy="copy"
        @click="copy"
      >
        <Copy />
      </button>
    </div>
    <div class="title">
      <Avatar
        :address="accounts[idx].address"
        :name="accounts[idx].name"
      />
      <div
        class="account-name"
        :class="{ long: !UNFINISHED_FEATURES }"
        data-cy="account-name"
      >
        <a
          v-if="accounts[idx].name"
          :href="explorerUrl"
          target="_blank"
        >
          <TruncateMid
            :str="accounts[idx].name"
            class="chainname"
          />
        </a>
        <router-link
          v-else
          to="/names"
          data-cy="claim-name"
          class="claim-chainname"
        >
          {{ $t('pages.account.claim-name') }}
        </router-link>
        <div class="account-type-name">
          <template v-if="!edit">
            <span class="text-ellipsis">
              {{ accounts[idx].localName }}
            </span>
            <button
              v-if="idx !== 0 && $route.path === '/accounts'"
              @click="editLocalName"
            >
              <Edit />
            </button>
          </template>
          <template v-else>
            <input
              v-model="customAccountName"
              :maxlength="maxCustomNameLength"
              type="text"
            >
            <button
              class="save"
              @click="saveLocalName(customAccountName)"
            >
              <Save />
            </button>
          </template>
        </div>
        <!-- eslint-disable-next-line vue-i18n/no-raw-text-->
        <label v-if="edit">{{ customAccountName.length }}/{{ maxCustomNameLength }}</label>
      </div>
    </div>
    <a
      v-if="!copied"
      :href="explorerUrl"
      target="_blank"
      class="ae-address"
    >
      {{ accounts[idx].address }}
    </a>
    <div
      v-else
      class="copied"
    >
      <span />
      <span class="text">{{ $t('pages.account.address-copied') }}</span>
      <span />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex';
import Avatar from './Avatar';
import TruncateMid from './TruncateMid';
import Add from '../../../icons/account-card/btn-add-subaccount.svg?vue-component';
import Copy from '../../../icons/account-card/btn-copy-address.svg?vue-component';
import Settings from '../../../icons/settings.svg?vue-component';
import Remove from '../../../icons/account-card/btn-remove.svg?vue-component';
import Edit from '../../../icons/account-card/btn-edit.svg?vue-component';
import Save from '../../../icons/account-card/btn-save.svg?vue-component';

export default {
  components: {
    Avatar, Add, Copy, Settings, Remove, Edit, Save, TruncateMid,
  },
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  data: () => ({
    copied: false,
    edit: false,
    customAccountName: '',
    maxCustomNameLength: 22,
    UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
  }),
  computed: {
    ...mapState(['accountCount', 'accountSelectedIdx']),
    ...mapGetters(['accounts']),
    idx() {
      return this.accountIdx === -1 ? this.accountSelectedIdx : this.accountIdx;
    },
    explorerUrl() {
      const { address } = this.accounts[this.idx];
      return `https://explorer.aeternity.io/account/transactions/${address}`;
    },
  },
  methods: {
    ...mapMutations(['createAccount', 'deleteAccount']),
    editLocalName() {
      this.customAccountName = this.accounts[this.idx].localName;
      this.edit = true;
    },
    saveLocalName(name) {
      this.$store.commit('setAccountLocalName', { name, idx: this.idx });
      this.edit = false;
    },
    copy() {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 1000);
    },
    async remove() {
      await this.$store.dispatch('modals/open', {
        name: 'confirm',
        title: this.$t('modals.removeSubaccount.title'),
        msg: this.$t('modals.removeSubaccount.msg'),
      });
      this.deleteAccount(this.idx);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.account-info {
  padding: 20px 20px 0 20px;
  text-align: left;
  margin-bottom: 4px;

  &.edit {
    margin-bottom: -2px;

    .title {
      margin-bottom: 0;

      .account-name .account-type-name {
        border-bottom: 1px solid variables.$color-blue;
      }
    }
  }

  .account-buttons {
    height: 8px;

    a,
    button {
      color: variables.$color-white;
      opacity: 0.7;
      float: right;
      padding: 0;
      margin-left: 8px;
      cursor: pointer;

      svg {
        width: 24px;
        height: 24px;
      }

      &:hover {
        opacity: 1;
        color: variables.$color-green;

        &.remove {
          color: variables.$color-error;
        }
      }
    }
  }

  .title {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    line-height: 21px;

    .avatar {
      align-self: flex-start;
      margin-right: 8px;
      overflow: visible;
    }

    .account-name {
      color: variables.$color-white;
      margin-right: auto;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;

      a .chainname {
        @extend %face-sans-17-medium;

        max-width: 150px;
        line-height: 16px;
        color: variables.$color-white;

        &:hover {
          &::before,
          &::after {
            text-decoration: underline;
          }
        }
      }

      a {
        text-decoration: none;
        max-width: 150px;

        &:hover {
          text-decoration: underline;
        }
      }

      &.long {
        a .chainname,
        a {
          max-width: 220px;
        }
      }

      .claim-chainname {
        @extend %face-sans-14-medium;

        line-height: 21px;
      }

      .account-type-name {
        display: flex;
        border-bottom: 1px solid transparent;

        @extend %face-sans-14-medium;

        span {
          white-space: nowrap;
          opacity: 0.5;
          max-width: 150px;
        }

        input {
          border: none;
          background: transparent;
          padding: 0;
          color: variables.$color-white;
          height: initial;

          @extend %face-sans-14-medium;

          line-height: 24px;

          &:focus {
            outline: 0;
            border: 0;
          }
        }

        button {
          height: 24px;
          margin-left: 8px;
          padding: 0;
          cursor: pointer;

          svg {
            width: 24px;
            height: 24px;
          }

          &:hover {
            opacity: 1;
            color: variables.$color-blue;
          }
        }
      }

      label {
        font-size: 10px;
        line-height: 12px;
        opacity: 0.5;
        align-self: flex-end;
      }
    }
  }

  .ae-address {
    display: block;
    text-decoration: none;
    color: variables.$color-light-grey;
    letter-spacing: -0.4px;

    @extend %face-sans-10-medium;

    &:hover {
      color: variables.$color-white;
    }
  }

  .copied {
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      width: 100%;

      &:not(.text) {
        height: 0;
        border-bottom: 1px dashed variables.$color-blue;
        margin: 0 8px;
      }

      &.text {
        white-space: nowrap;
        text-align: center;
        color: variables.$color-blue;

        @extend %face-sans-14-regular;

        line-height: 16px;
      }
    }
  }
}
</style>
