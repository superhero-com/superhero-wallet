<template>
  <div class="transfer">
    <Plate>
      <AccountSwitcher />
      <Tabs slot="bottom">
        <RouterLink
          :to="{ name: 'transfer-send' }"
          exact-path
        >
          <SendIcon /> {{ $t('pages.titles.send') }}
        </RouterLink>
        <RouterLink :to="{ name: 'transfer-receive' }">
          <ReceiveIcon /> {{ $t('pages.titles.receive') }}
        </RouterLink>
      </Tabs>
    </Plate>
    <RouterView />
  </div>
</template>

<script>
import Plate from '../components/Plate.vue';
import AccountSwitcher from '../components/AccountSwitcher.vue';
import Tabs from '../components/Tabs.vue';
import SendIcon from '../../../icons/send.svg?vue-component';
import ReceiveIcon from '../../../icons/receive.svg?vue-component';

export default {
  components: {
    Plate,
    AccountSwitcher,
    Tabs,
    SendIcon,
    ReceiveIcon,
  },
};
</script>
