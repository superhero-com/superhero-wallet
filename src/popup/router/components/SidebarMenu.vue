<template>
  <div
    class="sidebar-menu"
    data-cy="sidebar-menu"
  >
    <button
      data-cy="close-menu"
      @click="$emit('close')"
    >
      <Menu />
      <MenuHover class="hover" />
    </button>
    <div class="account">
      <Avatar
        :address="account.address"
        :name="account.name"
      />
      <div class="account-info">
        <div
          v-if="account.name"
          class="f-12"
          data-cy="chain-name"
        >
          <TruncateMid :str="account.name" />
        </div>
        <div class="account-type">
          {{ account.localName }}
        </div>
      </div>
    </div>
    <ul @click="$emit('close')">
      <li>
        <router-link to="/tokens">
          {{ $t('pages.titles.balances') }}
          <Balances />
        </router-link>
      </li>
      <li>
        <router-link to="/payments">
          {{ $t('pages.titles.payments') }}
          <Payments />
        </router-link>
      </li>
      <li>
        <router-link
          to="/tips"
          data-cy="tips"
        >
          {{ $t('pages.tipPage.tips') }}
          <Tips />
        </router-link>
      </li>
      <li>
        <router-link to="/tips/claim">
          {{ $t('pages.titles.claim-tips') }}
          <ClaimTips />
        </router-link>
      </li>
      <li>
        <router-link
          to="/transactions"
          data-cy="transactions"
        >
          {{ $t('pages.titles.tx-history') }}
          <TxHistory />
        </router-link>
      </li>
      <li>
        <router-link
          to="/names"
          data-cy="names"
        >
          {{ $t('pages.titles.names') }}
          <Names />
        </router-link>
      </li>
      <li>
        <router-link
          to="/invite"
          data-cy="invite"
        >
          {{ $t('pages.titles.invite') }}
          <Invite />
        </router-link>
      </li>
      <li>
        <router-link
          to="/settings"
          data-cy="settings"
        >
          {{ $t('pages.titles.settings') }}
          <Settings />
        </router-link>
      </li>
      <li>
        <router-link
          to="/about"
          data-cy="about"
        >
          {{ $t('pages.about.heading') }}
          <About />
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Menu from '../../../icons/menu.svg?vue-component';
import MenuHover from '../../../icons/menu-hover.svg?vue-component';
import Balances from '../../../icons/balances.svg?vue-component';
import Payments from '../../../icons/payments.svg?vue-component';
import Tips from '../../../icons/tips.svg?vue-component';
import ClaimTips from '../../../icons/claim-tips.svg?vue-component';
import TxHistory from '../../../icons/tx-history.svg?vue-component';
import Names from '../../../icons/names.svg?vue-component';
import Invite from '../../../icons/invite.svg?vue-component';
import Settings from '../../../icons/settings.svg?vue-component';
import About from '../../../icons/about.svg?vue-component';
import Avatar from './Avatar';
import TruncateMid from './TruncateMid';

export default {
  components: {
    Menu,
    MenuHover,
    Avatar,
    TruncateMid,
    Balances,
    Payments,
    Tips,
    ClaimTips,
    TxHistory,
    Names,
    Invite,
    Settings,
    About,
  },
  computed: mapGetters(['account']),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.sidebar-menu {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: variables.$color-bg-3;
  padding-top: env(safe-area-inset-top);
  box-shadow: -4px 0 6px rgba(variables.$color-black, 0.25);
  border-radius: 0 10px 10px 0;
  text-align: right;

  .account {
    margin: 12px 14px 24px 16px;
    display: flex;
    text-align: left;
    font-size: 14px;
    line-height: 14px;

    .avatar {
      margin-right: 8px;
      width: 32px;
      height: 32px;
    }

    .account-info {
      max-width: 110px;

      .name {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .account-type {
        opacity: 0.5;
      }
    }
  }

  & > button {
    margin: 4px 4px 0 0;
    height: 32px;
    width: 32px;
    color: white;
    cursor: pointer;

    svg {
      width: 24px;
      height: 24px;
      opacity: 0.7;
    }

    &:hover {
      svg {
        display: none;

        &.hover {
          opacity: 1;
          color: variables.$color-blue;
          display: inline;
        }
      }
    }

    &:active {
      svg {
        opacity: 1;
        color: variables.$color-blue;
        display: inline;

        &.hover {
          display: none;
        }
      }
    }

    .hover {
      display: none;
    }
  }

  ul {
    padding: 0;
    list-style: none;

    li {
      color: variables.$color-light-grey;

      &:hover {
        border-radius: 5px;
        background: variables.$color-bg-1;
        color: variables.$color-blue;
        border-radius: 12px;
        margin: 0px 5px;

        a svg {
          opacity: 1;
        }
      }

      &:active {
        border-radius: 5px;
        background: variables.$color-bg-1;
      }

      a {
        padding: 8px 18px 8px 16px;
        text-decoration: none;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: inherit;

        @extend %face-sans-12-regular;

        svg {
          width: 24px;
          height: 24px;
          opacity: 0.7;
        }
      }
    }
  }
}
</style>
