<template>
  <div class="transfer">
    <AccountSwitcher />
    <Tabs>
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
    <RouterView />
  </div>
</template>

<script>
import AccountSwitcher from '../components/AccountSwitcher';
import Tabs from '../components/Tabs';
import SendIcon from '../../../icons/send.svg?vue-component';
import ReceiveIcon from '../../../icons/receive.svg?vue-component';

export default {
  components: {
    AccountSwitcher,
    Tabs,
    SendIcon,
    ReceiveIcon,
  },
};
</script>
