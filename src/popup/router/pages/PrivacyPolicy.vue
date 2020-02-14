<template>
  <div class="popup">
    <!-- <h2>{{ $t('pages.privacyPolicy.heading') }}</h2> -->
    <p style="font-weight:normal">
      {{ $t('pages.privacyPolicy.content') }}
    </p>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  data() {
    return {};
  },
  created() {},
  methods: {
    navigateToIndex() {
      this.$router.push('/');
    },
  },
  computed: {},
};
</script>
]
