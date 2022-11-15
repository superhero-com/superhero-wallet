<template>
  <div class="seed-phrase-details">
    <div class="text-heading-1">
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
      tag="p"
      class="text-description"
    >
      <strong>{{ $t('pages.seedPhrase.inCorrectOrder') }}</strong>
    </i18n>
    <i18n
      path="pages.seedPhrase.toBeSureYouGotItRight"
      tag="p"
      class="text-description"
    >
      <strong>{{ $t('pages.seedPhrase.verifyYourSeedPhrase') }}</strong>
    </i18n>

    <div class="buttons">
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
      min-width: 210px;

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

  .buttons {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    margin-top: 20px;
  }
}
</style>
