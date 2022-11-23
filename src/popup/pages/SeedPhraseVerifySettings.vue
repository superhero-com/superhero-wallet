<template>
  <div class="seed-phrase-verify-settings">
    <div class="seed-phrase-verify-settings-body">
      <div class="text-heading-1">
        {{ $t('pages.seed-phrase-settings.verifyYourSeedPhrase') }}
      </div>

      <div class="text-description">
        {{ $t('pages.seed-phrase-settings.confirm-that-you-save-your-seed-phrase') }}
      </div>
      <i18n
        path="pages.seed-phrase-settings.compose-your-seed-phrase"
        tag="div"
        class="text-description"
      >
        <strong>
          {{ $t('pages.seed-phrase-settings.in-correct-order') }}
        </strong>
      </i18n>

      <div class="phraser">
        <SeedPhraseBadge
          v-for="(word, index) in mnemonicShuffled"
          :key="index"
          :text="word"
          :selected="selectedWordIds.includes(index)"
          @click.native="onSelectWord(index)"
        />
      </div>

      <div class="phraser bright">
        <template v-if="!selectedWordIds.length">
          <SeedPhraseBadge
            v-for="(word, index) in examplePhrase"
            :key="index"
            :text="word"
            selected
            editable
          />
        </template>
        <template v-else>
          <SeedPhraseBadge
            v-for="(id, index) in selectedWordIds"
            :key="id"
            :text="mnemonicShuffled[id]"
            editable
            @click.native="selectedWordIds.splice(index, 1)"
          />
        </template>
      </div>
    </div>
    <FixedScreenFooter>
      <BtnMain
        class="verify-button"
        :disabled="!selectedWordIds || selectedWordIds.length !== mnemonicShuffled.length"
        @click="verifyLastStep"
      >
        {{ $t('pages.seedPhrase.verify') }}
      </BtnMain>
      <SeedPhraseNotification
        v-if="showNotification"
        :has-error="hasError"
      />
    </FixedScreenFooter>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  watch,
} from '@vue/composition-api';
import { shuffle } from 'lodash-es';
import BtnMain from '../components/buttons/BtnMain.vue';
import FixedScreenFooter from '../components/FixedScreenFooter.vue';
import SeedPhraseNotification from '../components/SeedPhraseNotification.vue';
import SeedPhraseBadge from '../components/SeedPhraseBadge.vue';

export default defineComponent({
  components: {
    SeedPhraseBadge,
    SeedPhraseNotification,
    FixedScreenFooter,
    BtnMain,
  },
  setup(props, { root }) {
    const selectedWordIds = ref<number[]>([]);
    const showNotification = ref<boolean>(false);
    const hasError = ref<boolean>(false);
    const examplePhrase = ref([root.$t('pages.seedPhrase.first'), root.$t('pages.seedPhrase.second'), '...']);

    const mnemonic = computed((): string => root.$store.state.mnemonic);
    const mnemonicShuffled = computed((): string[] => shuffle(mnemonic.value.split(' ')));

    function verifyLastStep() {
      const mnemonicSelected = selectedWordIds.value
        .map((idx) => mnemonicShuffled.value[idx])
        .join(' ');
      showNotification.value = true;
      hasError.value = mnemonic.value !== mnemonicSelected;
      if (mnemonic.value === mnemonicSelected) {
        root.$store.commit('setBackedUpSeed');
      }

      setTimeout(() => {
        showNotification.value = false;
        root.$router.push({ name: 'account' });
      }, 3000);
    }

    function onSelectWord(index: number) {
      if (!selectedWordIds.value.includes(index)) {
        selectedWordIds.value.push(index);
      }
    }

    watch(() => selectedWordIds.value, (data: any) => {
      showNotification.value = false;
      hasError.value = false;
    });

    return {
      selectedWordIds,
      showNotification,
      hasError,
      examplePhrase,
      mnemonic,
      mnemonicShuffled,
      verifyLastStep,
      onSelectWord,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.seed-phrase-verify-settings {
  &-body {
    padding: var(--screen-padding-x);
  }

  .title {
    color: rgba(variables.$color-white, 1);
    margin-bottom: 18px;
    text-align: center;

    @extend %face-sans-18-regular;
  }

  .phraser {
    padding: 0;
    margin: 18px -4px 0 0; // -4px to compensate margin-right on badge

    &.bright {
      background: rgba(variables.$color-white, 0.15);
      border: 2px solid rgba(variables.$color-white, 0.1);
      border-radius: variables.$border-radius-card;
      padding: 12px 8px;
      min-height: 176px;
    }
  }
}
</style>
