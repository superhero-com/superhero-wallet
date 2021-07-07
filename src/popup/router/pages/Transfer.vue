<template>
  <div class="transfer">
    <AccountInfo />
    <BalanceInfo />
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
import AccountInfo from '../components/AccountInfo';
import BalanceInfo from '../components/BalanceInfo';
import Tabs from '../components/Tabs';
import SendIcon from '../../../icons/send.svg?vue-component';
import ReceiveIcon from '../../../icons/receive.svg?vue-component';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    Tabs,
    SendIcon,
    ReceiveIcon,
  },
};
</script>
