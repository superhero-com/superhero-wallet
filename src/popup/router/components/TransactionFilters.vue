<template>
<div :style="fixedheader" class="popup">
  <div :style="fixedheader" id="filters" class="filters">
    <span class="date d-flex" :class="type == 'date' ? 'active' : ''" @click="filter('date', date_type)">
      <span>Date</span>
      <FilterArrow :class="direction" />
    </span>
    <span class="sent" :class="type == 'sent' ? 'active' : ''" @click="filter('sent')">Sent</span>
    <span class="received" :class="type == 'received' ? 'active' : ''" @click="filter('received')">Received</span>
    <span class="topups" :class="type == 'topups' ? 'active' : ''" @click="filter('topups')">Top-ups</span>
    <span class="withdrawals" :class="type == 'withdrawals' ? 'active' : ''" @click="filter('withdrawals')">Withdrawals</span>
    <span class="all" :class="type == 'all' ? 'active' : ''" @click="filter('all')">All</span>
  </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import FilterArrow from '../../../icons/filter-arrow.svg';

export default {
    props: [''],
    components: {
        FilterArrow,
    },
    data() {
        return {
            direction: '',
            type: 'date',
            date_type: 'recent',
            fixedheader: ''
        };
    },
    created() {
        window.addEventListener('scroll', this.handleScroll);
    },
    destroyed () {
        window.removeEventListener('scroll', this.handleScroll);
    },
    computed: {
        ...mapGetters(['account', 'popup', 'sdk', 'current', 'transactions']),
    },
    methods: {
        handleScroll (event) {
            if (window.scrollY > 150) {
                this.fixedheader = 'position:fixed; top:50px;';
            } else {
                this.fixedheader = '';
            }
        },
        filter(type, date_type) {
            switch (type) {
                case 'date':
                    if (date_type == '') {
                        this.date_type = 'recent';
                    } else if (date_type == 'recent') {
                        this.date_type = 'oldest';
                    } else if (date_type == 'oldest') {
                        this.date_type = 'recent';
                    }

                    this.direction = '';
                    switch (this.date_type) {
                        case 'oldest':
                            this.direction = 'rotate';
                        break;
                        case 'recent':
                            this.direction = '';
                        break;
                    }
                    this.type = 'date';
                break;
                case 'sent':
                    this.type = 'sent';
                    this.date_type = '';
                break;
                case 'received':
                    this.type = 'received';
                    this.date_type = '';
                break;
                case 'topups':
                    this.type = 'topups';
                    this.date_type = '';
                break;
                case 'withdrawals':
                    this.type = 'withdrawals';
                    this.date_type = '';
                break;
                case 'all':
                    this.type = 'all';
                    this.date_type = '';
                break;
            }
            this.$emit('filtrate', this.type, this.date_type)
        },
    },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.filters {
    background: #111117;
    height: 40px;
    width: 100%;
    line-height: 40px;
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    font-size: 13px;
    span {
    cursor: pointer;
        color: $accent-color !important;
    }
    span.all {
        color: $secondary-color !important;
    }
    span.active,
    span.active > * {
        color: $white-color !important;
    }
    .d-flex {
        display: flex;
        svg {
            padding-top: 13px;
            height: 100%;
        }
    }
    .rotate {
        transform: rotate(180deg);
    }
}
</style>
