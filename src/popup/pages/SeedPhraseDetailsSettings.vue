<template>
  <div class="seed-phrase-details">
    <div class="title">
      {{ $t('pages.seed-phrase-settings.this-your-seed-phrase') }}
    </div>

    <div class="mnemonics">
      <p class="mnemonics-text">
        {{ mnemonic }}
      </p>
      <BtnMain
        has-icon
        variant="dark"
        class="copy-btn"
        @click="copy(mnemonic)"
      >
        <template v-if="!copied">
          <CopyOutlined class="copy-icon" />
          {{ $t('pages.seed-phrase-settings.copy') }}
        </template>

        <template v-else>
          <CheckSuccessCircle />
          {{ $t('addressCopied') }}
        </template>
      </BtnMain>
    </div>

    <i18n
      path="pages.seedPhrase.backUpYourSeedPhrase"
      tag="div"
      class="description"
    >
      <span>{{ $t('pages.seedPhrase.inCorrectOrder') }}</span>
    </i18n>
    <i18n
      path="pages.seedPhrase.toBeSureYouGotItRight"
      tag="div"
      class="description"
    >
      <span>{{ $t('pages.seedPhrase.verifyYourSeedPhrase') }}</span>
    </i18n>
    <BtnMain
      class="button"
      extend
      :to="{ name: 'settings-seed-phrase-verify' }"
    >
      {{ $t('pages.seedPhrase.verifySeed') }}
    </BtnMain>
    <BtnMain
      variant="secondary"
      extend
      @click="setBackedUpSeed"
    >
      {{ $t('pages.seedPhrase.doneThis') }}
    </BtnMain>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import BtnMain from '../components/buttons/BtnMain.vue';

import CopyOutlined from '../../icons/copy-outlined.svg?vue-component';
import CheckSuccessCircle from '../../icons/check-success-circle.svg?vue-component';
import { useCopy } from '../../composables';

export default defineComponent({
  components: {
    BtnMain,
    CopyOutlined,
    CheckSuccessCircle,
  },
  setup(props, { root }) {
    const { copy, copied } = useCopy();
    const mnemonic = computed(() => root.$store.state.mnemonic);

    function setBackedUpSeed() {
      root.$store.commit('setBackedUpSeed');
      root.$router.push({ name: 'account' });
    }

    return {
      copy,
      copied,
      mnemonic,
      setBackedUpSeed,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.seed-phrase-details {
  padding: var(--screen-padding-x);

  .title {
    @extend %face-sans-18-regular;

    color: rgba(variables.$color-white, 1);
    margin-bottom: 26px;
    text-align: center;
  }

  .description {
    color: rgba(variables.$color-white, 0.75);
    line-height: 22px;
    white-space: pre-line;
    text-align: center;
    padding-bottom: 12px;

    span {
      color: variables.$color-white;
    }

    @extend %face-sans-15-regular;
  }

  .mnemonics {
    background: rgba(variables.$color-white, 0.15);
    border: 2px solid rgba(variables.$color-white, 0.1);
    border-radius: variables.$border-radius-modal;
    margin: 0 0 20px 0;
    padding: 12px;
    text-align: center;
    box-shadow: 0 4px 8px 2px rgb(60 60 60 / 10%);
    box-sizing: border-box;

    ::v-deep .content {
      padding: 12px;
    }

    .mnemonics-text {
      letter-spacing: 0.1em;
      line-height: 32px;
      color: variables.$color-white;
      text-align: left;
      margin-bottom: 12px;

      @extend %face-sans-18-regular;
    }

    .copy-btn {
      @extend %face-sans-16-regular;

      margin: 0 auto;

      .check-success-circle {
        margin-right: 4px;
        color: variables.$color-success-dark;
      }

      .copy-icon {
        width: 24px;
        height: 24px;
      }
    }
  }

  .button {
    margin-top: 8px;
    margin-bottom: 18px;
  }
}
</style>
