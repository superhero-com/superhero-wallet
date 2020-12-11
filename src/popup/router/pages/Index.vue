<template>
  <div class="index">
    <img v-if="IN_FRAME" src="../../../icons/iframe/sendAndReceive.svg" />
    <div v-else class="not-iframe">
      <Component :is="IS_WEB ? 'SuperheroLogo' : 'Logo'" :class="{ logo: !IS_WEB }" />
      <span :class="{ blue: IS_WEB }">
        {{ $t('pages.index.heading') }}
      </span>
      <template v-if="IS_WEB">
        <Platforms>
          {{ $t('pages.index.platforms.heading') }}
        </Platforms>
        <span>{{ $t('pages.index.webVersion') }}</span>
      </template>
    </div>

    <CheckBox v-model="termsAgreed" data-cy="checkbox">
      <span>
        {{ $t('pages.index.term1') }}
        <RouterLink to="/about/termsOfService" data-cy="terms">
          {{ $t('pages.index.termsAndConditions') }}
        </RouterLink>
      </span>
    </CheckBox>

    <Button @click="$router.push('/intro')" :disabled="!termsAgreed" data-cy="generate-wallet">
      {{ $t('pages.index.generateWallet') }}
    </Button>
    <Button
      @click="$router.push('/import-account')"
      :disabled="!termsAgreed"
      data-cy="import-wallet"
    >
      {{ $t('pages.index.importWallet') }}
    </Button>
  </div>
</template>

<script>
import { IN_FRAME } from '../../utils/helper';
import Logo from '../../../icons/logo.svg?vue-component';
import SuperheroLogo from '../../../icons/superhero-logo.svg?vue-component';
import CheckBox from '../components/CheckBox';
import Button from '../components/Button';
import Platforms from '../components/Platforms';

export default {
  components: { Logo, SuperheroLogo, CheckBox, Button, Platforms },
  data: () => ({
    termsAgreed: false,
    IS_WEB: process.env.PLATFORM === 'web',
    IN_FRAME,
  }),
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.index {
  .checkbox-container {
    margin: 0 auto 25px auto;
    max-width: 282px;
    font-size: 15px;

    ::v-deep .checkmark {
      margin-right: 5px;
    }
  }

  .primary-button {
    width: 282px;
    font-weight: 600;

    &:hover {
      background: #4aabff;
    }

    &:first-of-type {
      margin-bottom: 20px;
    }
  }

  .not-iframe {
    font-size: 16px;
    width: 312px;
    margin: 0 auto;
    text-align: center;

    span {
      margin: 15px 0;
      display: block;
      font-weight: 600;

      &.blue {
        margin-top: 0;
        color: $button-color;
      }
    }

    .platforms {
      border-radius: 10px;
    }
  }
}
</style>
