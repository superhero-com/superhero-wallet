<template>
  <div :class="['account-info', { edit, copied }]">
    <div class="account-buttons">
      <button v-if="idx !== 0 && $route.path === '/accounts'" class="remove" @click="remove">
        <Remove />
      </button>
      <RouterLink v-if="$route.path !== '/accounts'" to="/accounts"><Settings /></RouterLink>
      <button v-if="idx === 0" @click="createAccount">
        <Add />
      </button>
      <button data-cy="copy" @click="copy" v-clipboard:copy="accounts[idx].address">
        <Copy />
      </button>
    </div>
    <div class="title">
      <Avatar :address="accounts[idx].address" :name="accounts[idx].name" />
      <div class="account-name" data-cy="account-name">
        <TruncateMid v-if="accounts[idx].name" :str="accounts[idx].name" class="chainname" />
        <router-link v-else to="/names" data-cy="claim-name" class="claim-chainname">
          {{ $t('pages.account.claim-name') }}
        </router-link>
        <div class="account-type-name">
          <template v-if="!edit">
            <span class="text-ellipsis">
              {{ accounts[idx].localName }}
            </span>
            <button v-if="idx !== 0 && $route.path === '/accounts'" @click="editLocalName">
              <Edit />
            </button>
          </template>
          <template v-else>
            <input v-model="customAccountName" :maxlength="maxCustomNameLength" type="text" />
            <button class="save" @click="saveLocalName(customAccountName)"><Save /></button>
          </template>
        </div>
        <!-- eslint-disable-next-line vue-i18n/no-raw-text-->
        <label v-if="edit">{{ customAccountName.length }}/{{ maxCustomNameLength }}</label>
      </div>
    </div>
    <a v-if="!copied" class="ae-address">{{ accounts[idx].address }}</a>
    <div v-else class="copied">
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
  components: { Avatar, Add, Copy, Settings, Remove, Edit, Save, TruncateMid },
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  data: () => ({
    copied: false,
    edit: false,
    customAccountName: '',
    maxCustomNameLength: 22,
  }),
  computed: {
    ...mapState(['accountCount', 'accountSelectedIdx']),
    ...mapGetters(['accounts']),
    idx() {
      return this.accountIdx === -1 ? this.accountSelectedIdx : this.accountIdx;
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
@import '../../../styles/typography';

.account-info {
  padding: 20px 20px 0 20px;
  text-align: left;
  margin-bottom: 4px;

  &.copied {
    margin-bottom: 2px;
  }

  &.edit {
    margin-bottom: -2px;

    .title {
      margin-bottom: 0;

      .account-name .account-type-name {
        border-bottom: 1px solid $color-blue;
      }
    }
  }

  .account-buttons {
    height: 8px;

    a,
    button {
      color: $color-white;
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
        color: $color-green;

        &.remove {
          color: $color-error;
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
      color: $color-white;
      margin-right: auto;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;

      .chainname {
        @extend %face-sans-17-medium;

        max-width: 150px;
        line-height: 16px;
      }

      a {
        text-decoration: none;
        max-width: 150px;

        &:hover {
          text-decoration: underline;
        }
      }

      .claim-chainname {
        @extend %face-sans-14-medium;

        line-height: 16px;
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
          padding: 0;
          color: $color-white;
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
            color: $color-blue;
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
    text-decoration: none;
    color: $color-light-grey;
    letter-spacing: -0.4px;

    @extend %face-sans-10-medium;

    &:hover {
      color: $color-white;
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
        border-bottom: 1px dashed $color-blue;
        margin: 0 8px;
      }

      &.text {
        white-space: nowrap;
        color: $color-blue;

        @extend %face-sans-14-regular;
      }
    }
  }
}
</style>
