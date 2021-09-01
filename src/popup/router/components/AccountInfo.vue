<template>
  <div :class="['account-info', { edit }]">
    <div class="buttons">
      <ButtonPlain
        class="minify"
        @click="$store.commit('toggleMinifiedCard')"
      >
        <Component
          :is="cardMinified ? 'Expand' : 'Collapse'"
        />
      </ButtonPlain>
      <div>
        <ButtonPlain
          v-clipboard:copy="accounts[idx].address"
          data-cy="copy"
          @click="copy"
        >
          <Copy />
        </ButtonPlain>
        <ButtonPlain
          v-if="UNFINISHED_FEATURES && idx === 0"
          @click="createAccount"
        >
          <Add />
        </ButtonPlain>
        <ButtonPlain
          v-if="idx !== 0 && $route.path === '/accounts'"
          class="remove"
          @click="remove"
        >
          <Remove />
        </ButtonPlain>
        <RouterLink
          v-if="UNFINISHED_FEATURES && $route.path !== '/accounts'"
          to="/accounts"
        >
          <Settings />
        </RouterLink>
      </div>
    </div>
    <div class="title">
      <Avatar
        :address="accounts[idx].address"
        :name="accounts[idx].name"
      />
      <div
        class="account-name"
        data-cy="account-name"
      >
        <a
          v-if="accounts[idx].name"
          :href="explorerUrl"
          target="_blank"
        >
          <Truncate :str="accounts[idx].name" />
        </a>
        <router-link
          v-else
          :to="{ name: 'name-claim' }"
          data-cy="claim-name"
          class="claim-chainname"
        >
          {{ $t('pages.account.claim-name') }}
        </router-link>
        <InputField
          v-model="customAccountName"
          :maxlength="maxCustomNameLength"
          :readonly="idx === 0 || $route.path !== '/accounts' || !edit"
          plain
        >
          <template slot="right">
            <ButtonPlain
              v-show="idx !== 0 && $route.path === '/accounts' && !edit"
              @click="editLocalName"
            >
              <Edit />
            </ButtonPlain>
            <ButtonPlain
              v-show="edit"
              @click="saveLocalName"
            >
              <Save />
            </ButtonPlain>
          </template>
        </InputField>
        <label v-if="edit">{{ `${customAccountName.length}/${maxCustomNameLength}` }}</label>
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
import { mapState, mapGetters, mapActions } from 'vuex';
import Avatar from './Avatar';
import Truncate from './Truncate';
import InputField from './InputField';
import ButtonPlain from './ButtonPlain';
import Collapse from '../../../icons/account-card/collapse.svg?vue-component';
import Expand from '../../../icons/account-card/expand.svg?vue-component';
import Add from '../../../icons/account-card/btn-add-subaccount.svg?vue-component';
import Copy from '../../../icons/account-card/btn-copy-address.svg?vue-component';
import Settings from '../../../icons/settings.svg?vue-component';
import Remove from '../../../icons/account-card/btn-remove.svg?vue-component';
import Edit from '../../../icons/account-card/btn-edit.svg?vue-component';
import Save from '../../../icons/account-card/btn-save.svg?vue-component';

export default {
  components: {
    Avatar,
    Collapse,
    Expand,
    Add,
    Copy,
    Settings,
    Remove,
    Edit,
    Save,
    Truncate,
    InputField,
    ButtonPlain,
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
    ...mapState('accounts', ['activeIdx']),
    ...mapState(['cardMinified']),
    ...mapGetters(['accounts', 'activeNetwork']),
    idx() {
      return this.accountIdx === -1 ? this.activeIdx : this.accountIdx;
    },
    explorerUrl() {
      const { address } = this.accounts[this.idx];
      return `${this.activeNetwork.explorerUrl}/account/transactions/${address}`;
    },
  },
  mounted() {
    const polling = setInterval(() => this.updateBalances(), 10000);

    this.$once('hook:destroyed', () => {
      clearInterval(polling);
    });
    this.customAccountName = this.accounts[this.idx].localName;
  },
  methods: {
    ...mapActions({ createAccount: 'accounts/hdWallet/create' }),
    editLocalName() {
      this.customAccountName = this.accounts[this.idx].localName;
      this.edit = true;
    },
    updateBalances() {
      this.$store.dispatch('fungibleTokens/getAvailableTokens');
      this.$store.dispatch('fungibleTokens/loadTokenBalances');
    },
    saveLocalName() {
      this.$store.commit('accounts/setLocalName', { name: this.customAccountName, idx: this.idx });
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
        icon: 'critical',
        title: this.$t('modals.removeSubaccount.title'),
        msg: this.$t('modals.removeSubaccount.msg'),
      });
      this.$store.commit('accounts/remove', this.idx);
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

  .buttons {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 24px;

    svg {
      width: 24px;
      height: 24px;
    }

    a,
    .button-plain,
    .minify {
      color: variables.$color-light-grey;
    }

    a,
    .button-plain {
      &:not(:first-child) {
        margin-left: 8px;
      }

      &:hover {
        color: variables.$color-green;

        &.remove {
          color: variables.$color-error;
        }
      }
    }

    .minify:hover {
      color: variables.$color-blue;
    }
  }

  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    margin-bottom: 6px;
    line-height: 21px;

    @extend %face-sans-14-medium;

    line-height: 16px;

    .avatar {
      align-self: flex-start;
      margin-right: 8px;
      overflow: visible;
    }

    .account-name {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;

      a {
        color: variables.$color-white;
        text-decoration: none;
        max-width: 250px;

        &:hover {
          text-decoration: underline;
        }
      }

      .claim-chainname {
        color: variables.$color-green;
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
    text-align: center;
    color: variables.$color-light-grey;

    @extend %face-mono-10-medium;

    font-size: 9px;

    &:hover {
      color: variables.$color-white;
    }
  }

  .copied {
    display: flex;
    align-items: center;

    span {
      width: 100%;

      &:not(.text) {
        border-bottom: 1px dashed variables.$color-blue;
        margin: 0 8px;
      }

      &.text {
        white-space: nowrap;
        color: variables.$color-blue;

        @extend %face-sans-14-regular;

        line-height: 16px;
      }
    }
  }
}
</style>
