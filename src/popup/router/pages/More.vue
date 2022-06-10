<template>
  <div class="more">
    <!-- TODO: remove after Plate + AccountSwitcher will be extracted-->
    <Plate>
      <AccountSwitcher />
    </Plate>
    <div class="navigation">
      <BoxButton to="/invite">
        <Invites /> {{ $t('pages.titles.invite') }}
      </BoxButton>
      <BoxButton
        to="/settings"
        data-cy="settings"
      >
        <Settings /> {{ $t('pages.titles.settings') }}
      </BoxButton>
      <BoxButton
        to="/about"
        data-cy="about"
      >
        <About /> {{ $t('pages.titles.about') }}
      </BoxButton>
      <BoxButton
        :to="SIMPLEX_URL"
        fill="alternative"
        is-external-link
      >
        <Buy />{{ $t('pages.fungible-tokens.buyAe') }}
      </BoxButton>
      <BoxButton
        v-if="UNFINISHED_FEATURES"
        to="/more"
      >
        <Dex /> {{ $t('pages.more.dex') }}
      </BoxButton>
    </div>
  </div>
</template>

<script>
import Plate from '../components/Plate.vue';
import AccountSwitcher from '../components/AccountSwitcher.vue';
import BoxButton from '../components/BoxButton.vue';
import Invites from '../../../icons/invites.svg?vue-component';
import Settings from '../../../icons/settings.svg?vue-component';
import About from '../../../icons/circle-i.svg?vue-component';
import Buy from '../../../icons/buy.svg?vue-component';
import Dex from '../../../icons/dex.svg?vue-component';
import { SIMPLEX_URL } from '../../utils/constants';

export default {
  components: {
    Plate, AccountSwitcher, BoxButton, Invites, Settings, About, Buy, Dex,
  },
  data: () => ({
    UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
    SIMPLEX_URL,
  }),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.more {
  width: variables.$extension-width;
  margin: 0 auto;

  .navigation {
    padding: 12px;
    display: flex;
    flex-wrap: wrap;

    .box-button {
      margin: 12px;
    }
  }
}
</style>
