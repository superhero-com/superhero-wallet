<template>
  <time :datetime="isoFormattedDateAndTime" :title="wholeDateAndTime">
    {{ formatDate }}
  </time>
</template>

<script>
import { secondsToRelativeTime } from '../../../filters/toRelativeTime';

export default {
  props: {
    date: { type: Date, required: true },
  },
  computed: {
    formatDate() {
      const today = new Date();
      const { date } = this;
      const lessThanFourDaysAgo = today - date < 4 * 24 * 60 * 60 * 1000;
      return lessThanFourDaysAgo
        ? `${secondsToRelativeTime((today - date) / 1000)} ago`
        : date.toLocaleDateString('en-US');
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
