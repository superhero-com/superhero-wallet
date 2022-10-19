<template>
  <div class="seed-phrase-details">
    <div class="title">
      {{ $t('pages.seed-phrase-settings.this-your-seed-phrase') }}
    </div>

    <ae-panel class="mnemonics">
      <p class="mnemonics-text">
        {{ mnemonic }}
      </p>
      <ae-button
        @click="copy(mnemonic)"
      >
        <template v-if="!copied">
          <CopyOutlined />
          {{ $t('pages.seed-phrase-settings.copy') }}
        </template>

        <template v-else>
          <CheckSuccessCircle />
          {{ $t('addressCopied') }}
        </template>
      </ae-button>
    </ae-panel>

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
  padding: 16px;

  .title {
    color: rgba(variables.$color-white, 1);
    padding: 12px 0 24px;
    text-align: center;

    @extend %face-sans-18-regular;
  }

  .description {
    color: rgba(variables.$color-white, 0.75);
    line-height: 20px;
    white-space: pre-line;
    text-align: center;
    padding-bottom: 12px;

    span {
      color: variables.$color-white;
    }

    @extend %face-sans-14-light;
  }

  .mnemonics {
    background: rgba(variables.$color-white, 0.15);
    border: 2px solid rgba(variables.$color-white, 0.1);
    border-radius: variables.$border-radius-interactive;
    margin: 0 0 20px 0;
    text-align: center;

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

    .ae-button {
      border-radius: variables.$border-radius-interactive;
      height: 40px;
      width: auto;
      padding: 8px 24px;
      min-width: 190px;
      background: rgba(variables.$color-black, 0.2);
      color: rgba(variables.$color-white, 1);

      @extend %face-sans-16-regular;

      .icon {
        width: 24px;
        height: 24px;
      }

      .check-success-circle {
        margin-right: 4px;
        color: variables.$color-success-dark;
      }

      &:hover {
        color: rgba(variables.$color-white, 0.75);
      }
    }
  }

  .button {
    margin-bottom: 18px;
  }
}
</style>
