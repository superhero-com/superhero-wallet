<template>
  <div class="popup text-left">
    <h1 class="heading-1 uppercase">{{ $t('pages.termsOfService.heading') }}</h1>
    <p class="sub-heading">{{ $t('pages.termsOfService.sub-heading') }}</p>
    <p class="termsText">

      <p>
        {{ $t('pages.termsOfService.section0Content') }}
      </p>

      <p>
        {{ $t('pages.termsOfService.section01Content') }}
      </p>

      <div v-for="(item, index) in details">
        <p class="accordion-item-title uppercase flex flex-justify-between flex-align-start" @click="toggleAccordionItem(index)">
          <ArrowDown class="icon" v-if="item.open"/>
          <ArrowRight class="icon" v-else />
          <span> {{ item.title }} </span>
        </p>
        <p class="accordion-item-content" v-if="item.open">{{ item.content }}</p>
      </div>
      
    </p>
  </div>
</template>

<script>
import ArrowDown from '../../../icons/arrow-down.svg';
import ArrowRight from '../../../icons/arrow-right.svg';

export default {
  components: {
    ArrowDown,
    ArrowRight
  },
  data() {
    return {
      details: [
        {
          title: this.$t('pages.termsOfService.section1Title'),
          content: this.$t('pages.termsOfService.section1Content'),
          open: false
        },
        {
          title: this.$t('pages.termsOfService.section2Title'),
          content: this.$t('pages.termsOfService.section2Content'),
          open: false
        },
        {
          title: this.$t('pages.termsOfService.section3Title'),
          content: this.$t('pages.termsOfService.section3Content'),
          open: false
        },
        {
          title: this.$t('pages.termsOfService.section4Title'),
          content: this.$t('pages.termsOfService.section4Content'),
          open: false
        },
        {
          title: this.$t('pages.termsOfService.section5Title'),
          content: this.$t('pages.termsOfService.section5Content'),
          open: false
        },
        {
          title: this.$t('pages.termsOfService.section6Title'),
          content: this.$t('pages.termsOfService.section6Content'),
          open: false
        },
        {
          title: this.$t('pages.termsOfService.section7Title'),
          content: this.$t('pages.termsOfService.section7Content'),
          open: false
        },
        {
          title: this.$t('pages.termsOfService.section8Title'),
          content: this.$t('pages.termsOfService.section8Content'),
          open: false
        },
        {
          title: this.$t('pages.termsOfService.section9Title'),
          content: this.$t('pages.termsOfService.section9Content'),
          open: false
        },
        {
          title: this.$t('pages.termsOfService.section10Title'),
          content: this.$t('pages.termsOfService.section10Content'),
          open: false
        }
      ]
    };
  },
  methods: {
    toggleAccordionItem(index) {
      this.details[index].open = !this.details[index].open
    }
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';
.accordion-item-title {
  color: $accent-color;
  font-size:14px;
  font-weight: 500;
  cursor: pointer;
  .icon {
    width:25px;
    margin-top:4px;
  }
  span {
    margin-right:auto;
    color: $accent-color;
  }
}
.accordion-item-content {
  font-size:14px;
  font-weight: 500;
}
</style>
