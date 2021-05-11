<template>
  <div class="payments">
    <AccountInfo />
    <BalanceInfo />
    <Tabs>
      <RouterLink
        :to="{ name: 'payments-send' }"
        exact-path
      >
        <SendIcon /> {{ $t('pages.titles.send') }}
      </RouterLink>
      <RouterLink :to="{ name: 'payments-receive' }">
        <ReceiveIcon /> {{ $t('pages.titles.receive') }}
      </RouterLink>
    </Tabs>
    <RouterView v-bind="$route.params" />
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
