<template>
  <div class="center how-to-url">
    <Button data-cy="how-to-claim-button" :style="styling" @click="openHowToClaimURL"
      ><Claim class="mr-5" /> {{ $t('pages.account.howToClaim') }}</Button
    >
  </div>
</template>

<script>
import Button from './Button';
import Claim from '../../../icons/claim.svg?vue-component';
import openUrl from '../../utils/openUrl';
import { AGGREGATOR_URL } from '../../utils/constants';

export default {
  props: ['styling'],
  components: {
    Button,
    Claim,
  },
  methods: {
    openHowToClaimURL() {
      openUrl(`${AGGREGATOR_URL}create-profile`, true);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.how-to-url button {
  background: $button-color;
  color: $text-color;
  font-size: 18px;
  border-radius: 5px;
  width: 270px;
  line-height: 38px;
}

.how-to-url svg {
  vertical-align: middle;
}
</style>
