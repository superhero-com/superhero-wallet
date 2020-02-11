<template>
  <div class="filters">
      <span @click="sync" ><span>Date </span><FilterArrow :style="direction"/></span>
      <span @click="sync" >Sent</span>
      <span @click="sync" >Received</span>
      <span @click="sync" >Top-ups</span>
      <span @click="sync" >Withdrawals</span>
      <span @click="sync" >All</span>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import FilterArrow from '../../../icons/filter-arrow.svg'

export default {
  props: [''],
  components: {
      FilterArrow
  },
  data() {
    return {
        
    };
  },
  async created() {
      
  },
  computed: {
    ...mapGetters(['account', 'popup', 'sdk', 'current']),
  },
  methods: {
      sync() {

      }
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.filters {
    height: 40px;
    width: 100%;
    line-height: 40px;
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    font-size: 13px;
}
</style>
