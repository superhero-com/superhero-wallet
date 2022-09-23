<template>
  <div class="account-details-names">
    <nav class="navigation">
      <BtnPill
        :to="{ name: 'account-details-names' }"
        :text="$t('pages.names.tabs.my-names')"
        exact
      />
      <BtnPill
        :to="{ name: 'account-details-names-auctions' }"
        :text="$t('pages.names.tabs.auctions')"
      />
      <BtnPill
        :to="{ name: 'account-details-names-claim' }"
        :text="$t('pages.names.tabs.register')"
      />
    </nav>

    <transition
      name="fade-transition"
      mode="out-in"
    >
      <RouterView />
    </transition>
  </div>
</template>

<script>
import BtnPill from '../components/buttons/BtnPill.vue';

export default {
  components: {
    BtnPill,
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/mixins';

.account-details-names {
  --header-height: 126px;

  .navigation {
    @include mixins.flex(flex-start, center, row);

    position: sticky;
    top: calc(var(--header-height) + env(safe-area-inset-top));
    z-index: 2;
    gap: var(--gap);
    padding-top: 2px;
    padding-bottom: 10px;
    background-color: var(--screen-bg-color);
  }
}
</style>
