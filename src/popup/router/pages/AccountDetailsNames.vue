<template>
  <div>
    <Tabs three>
      <RouterLink
        :to="{ name: 'account-details-names' }"
        exact-path
      >
        {{ $t('pages.names.tabs.my-names') }}
      </RouterLink>

      <RouterLink
        :to="{ name: 'account-details-names-auctions' }"
      >
        {{ $t('pages.names.tabs.auctions') }}
      </RouterLink>

      <RouterLink
        :to="{ name: 'account-details-names-claim' }"
      >
        {{ $t('pages.names.tabs.register') }}
      </RouterLink>
    </Tabs>

    <transition
      name="fade-transition"
      mode="out-in"
    >
      <RouterView />
    </transition>
  </div>
</template>

<script>
import Tabs from '../components/Tabs.vue';

export default {
  components: {
    Tabs,
  },
};
</script>
