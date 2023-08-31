<template>
  <div class="account-swiper">
    <Swiper
      ref="customSwiper"
      class="swiper"
      :slides-per-view="1.1"
      :space-between="8"
      :centered-slides="true"
      virtual
      @slideChange="onSlideChange"
    >
      <SwiperSlide
        v-for="(address, index) in addressList"
        :key="address"
        :swiper-ref="customSwiper"
        :virtual-index="index"
        class="account-swiper-slide"
      >
        <AccountSwiperSlide
          :idx="index"
          :active="index === activeIdx"
          :to="to"
          :address="address"
          @slide="(newIndex) => setCurrentSlide(newIndex)"
        >
          <slot
            name="slide"
            :index="index"
          />
        </AccountSwiperSlide>
      </SwiperSlide>

      <SwiperSlide
        class="account-swiper-slide"
        :virtual-index="addressList.length"
        :swiper-ref="customSwiper"
      >
        <AccountSwiperSlide
          hide-next
          :idx="addressList.length"
          @slide="(newIndex) => setCurrentSlide(newIndex)"
        >
          <AccountCardAdd :is-multisig="isMultisig" />
        </AccountSwiperSlide>
      </SwiperSlide>
    </Swiper>

    <div class="account-swiper-bottom">
      <BulletSwitcher
        v-if="addressList"
        :active-color="getAccountColor(currentIdx)"
        :current-idx="currentIdx"
        :options-size="addressList.length"
        @change="setCurrentSlide"
      />

      <div
        v-if="accounts.length > 1"
        class="dashboard-header-info"
      >
        <BtnPill
          class="account-select-btn"
          hollow
        >
          <FormSelect
            :default-text="$t('dashboard.selectAccount')"
            :model-value="activeAccount.address"
            class="account-select-input"
            unstyled
            account-select
            @update:model-value="(address: string) => $emit('select-account', address)"
          >
            <template #current-text>
              <div class="account-number">
                <span class="account-number-current">{{ activeIdx + 1 }}</span>
                / {{ accounts.length }}
              </div>
            </template>
          </FormSelect>
        </BtnPill>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  PropType,
  computed,
  defineComponent,
  onMounted,
  nextTick,
  ref,
  watch,
} from 'vue';
import { RouteLocationNamedRaw } from 'vue-router';
import SwiperCore from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Virtual } from 'swiper/modules';

import { getAddressColor } from '@/utils';
import { PROTOCOL_AETERNITY } from '@/constants';
import { useAccounts } from '@/composables';

import AccountCardAdd from './AccountCardAdd.vue';
import AccountSwiperSlide from './AccountSwiperSlide.vue';
import BulletSwitcher from './BulletSwitcher.vue';
import BtnPill from './buttons/BtnPill.vue';
import FormSelect from './form/FormSelect.vue';

SwiperCore.use([Virtual]);

export default defineComponent({
  components: {
    BulletSwitcher,
    AccountSwiperSlide,
    Swiper,
    SwiperSlide,
    AccountCardAdd,
    BtnPill,
    FormSelect,
  },
  props: {
    activeIdx: { type: Number, required: true },
    to: { type: Object as PropType<RouteLocationNamedRaw>, required: true },
    addressList: { type: Array as PropType<string[]>, required: true },
    isMultisig: Boolean,
  },
  emits: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    'select-account': (idx: number) => undefined,
  },
  setup(props, { emit }) {
    const { activeAccount, accounts } = useAccounts();
    const customSwiper = ref();
    const currentIdx = ref(0);

    const swiper = computed(() => customSwiper.value?.$el.swiper);

    async function setCurrentSlide(idx: number, slideParams?: number) {
      if (idx > -1 && currentIdx.value !== idx) {
        await nextTick();
        swiper.value.slideTo(idx, slideParams);
      }
    }

    function onSlideChange() {
      const { activeIndex } = swiper.value;
      if (activeIndex < props.addressList.length && activeIndex >= 0) {
        emit('select-account', activeIndex);
      }
      if (currentIdx.value !== activeIndex) {
        currentIdx.value = activeIndex;
      }
    }
    function getAccountColor(idx: number) {
      return getAddressColor(props.addressList[idx]);
    }

    onMounted(() => {
      if (props.activeIdx) {
        setCurrentSlide(props.activeIdx, 0);
      }
      watch(
        () => props.activeIdx,
        (activeIdxValue) => {
          setCurrentSlide(activeIdxValue, 0);
        },
      );
    });

    return {
      PROTOCOL_AETERNITY,
      currentIdx,
      customSwiper,
      activeAccount,
      accounts,
      swiper,
      getAccountColor,
      onSlideChange,
      setCurrentSlide,
    };
  },
});
</script>

<style lang="scss">
@use 'swiper/css';
</style>

<style lang="scss" scoped>
@use '@/styles/mixins';
@use '@/styles/typography';

.account-swiper {
  .account-swiper-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: var(--screen-padding-x);
  }

  .dashboard-header-info {
    display: flex;
    align-items: flex-end;

    .account-select-btn {
      padding: 0;
      margin-left: auto;
    }

    .account-select-input {
      padding: 4px 10px;
    }

    .account-number {
      @extend %face-sans-14-medium;

      margin-right: 2px;
      opacity: 0.4;
      line-height: 1;
    }
  }
}
</style>
