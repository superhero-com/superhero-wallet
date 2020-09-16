<template>
  <time :datetime="isoFormattedDateAndTime" :title="wholeDateAndTime">
    {{ formatDate }}
  </time>
</template>

<script>
export default {
  props: {
    date: { type: Date, required: true },
  },
  computed: {
    formatDate() {
      const today = new Date();
      const tipDate = this.date;
      const isToday = today.toDateString() === tipDate.toDateString();
      return isToday ? tipDate.toLocaleTimeString('en-GB') : tipDate.toLocaleDateString('en-US');
    },
    wholeDateAndTime() {
      return this.date.toLocaleString('en-US', { hourCycle: 'h24' });
    },
    isoFormattedDateAndTime() {
      return this.date.toISOString();
    },
  },
};
</script>
