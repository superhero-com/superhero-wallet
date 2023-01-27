<template>
  <div class="dashboard-header">
    <TotalWalletAmount v-if="visibleAccounts.length > 1" />

    <swiper
      ref="customSwiper"
      class="swiper"
      :options="swiperOptions"
      @slideChange="onSlideChange"
    >
      <swiper-slide
        v-for="(account, idx) in visibleAccounts"
        :key="getAccountId(account)"
      >
        <AccountCard
          class="swiper-card"
          :account="account"
          :selected="idx === activeIdSelector"
        />
        <BtnPlain
          v-if="!(idx === 0 || IS_CORDOVA)"
          class="swiper-button prev"
          @click="setCurrentSlide(swiper.realIndex - 1)"
        >
          <ChevronIcon />
        </BtnPlain>
        <BtnPlain
          v-if="!IS_CORDOVA"
          class="swiper-button next"
          @click="setCurrentSlide(swiper.realIndex + 1)"
        >
          <ChevronIcon />
        </BtnPlain>
      </swiper-slide>
      <swiper-slide>
        <BtnPlain
          v-if="!IS_CORDOVA"
          class="swiper-button prev"
          @click="setCurrentSlide(swiper.realIndex - 1)"
        >
          <ChevronIcon />
        </BtnPlain>
        <AccountCardAdd class="swiper-card" />
      </swiper-slide>
    </swiper>

    <div class="switcher-row">
      <BulletSwitcher
        v-if="visibleAccounts && visibleAccounts.length"
        :active-color="getAccountColor(currentIdx)"
        :current-idx="currentIdx"
        :options-size="visibleAccounts.length"
        @change="setCurrentSlide"
      />
      <ToggleMultisigButton />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed, defineComponent,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api';
import { Swiper, SwiperSlide } from 'vue-awesome-swiper';
import {
  useGetter,
  useState,
} from '../../composables/vuex';
import { getAddressColor } from '../utils/avatar';

import type { IAccount, IMultisigAccount } from '../../types';

import AccountCard from './AccountCard.vue';
import AccountCardAdd from './AccountCardAdd.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import BulletSwitcher from './BulletSwitcher.vue';
import ToggleMultisigButton from './ToggleMultisigButton.vue';
import TotalWalletAmount from './TotalWalletAmount.vue';
import ChevronIcon from '../../icons/chevron.svg?vue-component';
import { useMultisigAccounts } from '../../composables';

export default defineComponent({
  components: {
    ToggleMultisigButton,
    TotalWalletAmount,
    BulletSwitcher,
    AccountCard,
    AccountCardAdd,
    Swiper,
    SwiperSlide,
    BtnPlain,
    ChevronIcon,
  },
  setup(props, { root }) {
    const {
      isMultisigDashboard,
      multisigAccounts,
      activeMultisigAccountId,
      setActiveMultisigAccountId,
    } = useMultisigAccounts({ store: root.$store });

    const swiperOptions = {
      slidesPerView: 1.1,
      centeredSlides: true,
      spaceBetween: 8,
    };

    const currentIdx = ref(0);
    const customSwiper = ref();

    const activeIdx = useState('accounts', 'activeIdx');
    const accounts = useGetter<IAccount[]>('accounts');

    const swiper = computed(() => customSwiper.value?.$swiper);

    const gaAccountIdx = computed(() => multisigAccounts.value
      .findIndex((acc) => acc.address === activeMultisigAccountId.value));

    const activeIdSelector = computed(
      () => isMultisigDashboard.value
        ? gaAccountIdx.value
        : activeIdx.value,
    );

    const visibleAccounts = computed(
      (): (IMultisigAccount | IAccount)[] => isMultisigDashboard.value
        ? multisigAccounts.value
        : accounts.value,
    );

    function getAccountId(selectedAccount: IMultisigAccount | IAccount) {
      return isMultisigDashboard.value
        ? (selectedAccount as IMultisigAccount).multisigAccountId
        : (selectedAccount as IAccount).idx;
    }

    function selectAccount(idx: number | string) {
      if (isMultisigDashboard.value && typeof idx === 'string') {
        setActiveMultisigAccountId(idx);
      } else {
        root.$store.commit('accounts/setActiveIdx', idx);
      }
    }

    function onSlideChange() {
      const { realIndex } = swiper.value;
      const selectedAccount = visibleAccounts.value[realIndex];
      if (
        swiper.value.realIndex < visibleAccounts.value.length
          && selectedAccount
      ) {
        selectAccount(getAccountId(selectedAccount));
      }
      if (currentIdx.value !== realIndex) {
        currentIdx.value = realIndex;
      }
    }
    function getAccountColor(idx: number) {
      return getAddressColor(visibleAccounts.value[idx]?.address);
    }
    function setCurrentSlide(idx: number, slideParams?: number) {
      if (currentIdx.value !== idx) {
        currentIdx.value = idx;
        swiper.value.slideTo(idx, slideParams);
      }
    }

    onMounted(() => {
      if (activeIdSelector.value) {
        setCurrentSlide(activeIdSelector.value, 0);
      }
      watch(
        () => activeIdSelector.value,
        (activeIdxValue) => {
          setCurrentSlide(activeIdxValue, 0);
        },
      );
    });

    return {
      IS_CORDOVA: process.env.IS_CORDOVA,
      currentIdx,
      activeIdx,
      swiperOptions,
      visibleAccounts,
      getAccountId,
      activeIdSelector,
      swiper,
      customSwiper,
      getAccountColor,
      onSlideChange,
      setCurrentSlide,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/mixins';

@import '../../../node_modules/swiper/css/swiper.css';

.dashboard-header {
  .switcher-row {
    @include mixins.flex(space-between, center, row);
  }

  .swiper-card {
    width: 100%;
    height: 192px;
    margin: 0;
  }

  .swiper-button {
    position: absolute;
    z-index: 1;
    top: 50%;
    height: 60px;
    width: 30px;
    color: $color-white;
    opacity: 0.5;
    transition: $transition-interactive;

    &.prev {
      left: 2px;
      transform: translateY(-50%) scaleX(-1);
    }

    &.next {
      right: 2px;
      transform: translateY(-50%);
    }

    &:hover {
      opacity: 1;
    }
  }
}
</style>
