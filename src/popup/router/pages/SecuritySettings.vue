<template>
  <div class="popup">
    <template v-if="view === 'warning'">
      <h3>{{ $t('pages.securitySettings.seedRecoveryHeading') }}</h3>
      {{ $t('pages.securitySettings.seedRecoverySmall') }}
      <Button @click="view = 'show'">
        {{ $t('pages.securitySettings.seedRecoveryBtn') }}
      </Button>
    </template>

    <template v-else-if="view === 'show'">
      <h3>{{ $t('pages.securitySettings.seedPhrase') }}</h3>
      <ae-panel class="mnemonics">
        <p>{{ mnemonic }}</p>
        <ae-button face="toolbar" v-clipboard:copy="mnemonic">
          <ae-icon name="copy" />
          {{ $t('pages.securitySettings.copy') }}
        </ae-button>
      </ae-panel>
      {{ $t('pages.seedPhrase.backupText') }}
      <p>{{ $t('pages.seedPhrase.dontLose') }}</p>
      <small>{{ $t('pages.seedPhrase.nextScreen') }}</small>
      <Button @click="view = 'verify'">
        {{ $t('pages.seedPhrase.verifySeed') }}
      </Button>
      <Button @click="setBackedUpSeed">
        {{ $t('pages.seedPhrase.doneThis') }}
      </Button>
    </template>

    <template v-else-if="view === 'verify'">
      <h3>{{ $t('pages.seedPhrase.confirmSeedPhrase') }}</h3>
      <ae-phraser>
        <ae-badge
          :class="{ selected: selectedWordIds.includes(index) }"
          v-for="(word, index) in mnemonicShuffled"
          :key="index"
          @click.native="!selectedWordIds.includes(index) && selectedWordIds.push(index)"
        >
          {{ word }}
        </ae-badge>
      </ae-phraser>
      {{ $t('pages.seedPhrase.recoveryPhrase') }}
      <ae-phraser :error="error">
        <template v-if="selectedWordIds.length === 0">
          <ae-badge class="selected">{{ $t('pages.seedPhrase.first') }}</ae-badge>
          <ae-badge class="selected">{{ $t('pages.seedPhrase.second') }}</ae-badge>
          <ae-badge class="selected">{{ $t('pages.seedPhrase.third') }}</ae-badge>
          <!--eslint-disable-next-line vue-i18n/no-raw-text-->
          <ae-badge class="selected">...</ae-badge>
        </template>
        <ae-badge
          v-else
          v-for="(id, index) in selectedWordIds"
          :key="id"
          @click.native="selectedWordIds.splice(index, 1)"
        >
          {{ mnemonicShuffled[id] }} <ae-icon name="close" />
        </ae-badge>
      </ae-phraser>
      <Button @click="verifyLastStep">
        {{ $t('pages.seedPhrase.verify') }}
      </Button>
    </template>

    <template v-else-if="view === 'verified'">
      <ae-icon name="check" />
      <p>{{ $t('pages.seedPhrase.seedConfirmed') }}</p>
      <Button @click="setBackedUpSeed">
        {{ $t('pages.seedPhrase.toDashboard') }}
      </Button>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { shuffle } from 'lodash-es';
import Button from '../components/Button';

export default {
  components: { Button },
  data: () => ({
    view: 'warning',
    selectedWordIds: [],
    error: false,
  }),
  computed: mapState({
    mnemonic: 'mnemonic',
    mnemonicShuffled: ({ mnemonic }) => shuffle(mnemonic.split(' ')),
  }),
  watch: {
    selectedWordIds() {
      this.error = false;
    },
  },
  methods: {
    setBackedUpSeed() {
      this.$store.commit('setBackedUpSeed');
      this.$router.push({ name: 'account' });
    },
    verifyLastStep() {
      const mnemonicSelected = this.selectedWordIds
        .map((idx) => this.mnemonicShuffled[idx])
        .join(' ');
      if (this.mnemonic !== mnemonicSelected) {
        this.error = 'Oops! Incorrect seed phrase!';
        return;
      }
      this.error = false;
      this.view = 'verified';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.mnemonics {
  margin: 0;

  p {
    word-spacing: 10px;
  }

  .ae-button {
    float: right;
    margin: 10px 0 30px 0;
  }

  p,
  .ae-button.toolbar {
    color: #000;
  }
}

.ae-icon.ae-icon-check {
  color: #e911ff;
  font-size: 100px;
}

.ae-badge {
  user-select: unset;
  cursor: pointer;
  border: 2px solid #edf3f7;

  .ae-icon-close {
    margin-left: 5px;
  }

  &.selected {
    opacity: 0.4;
    cursor: unset;
    background: transparent;
    border: 2px solid #c1c1c1;
    color: #fff;
  }
}
</style>
