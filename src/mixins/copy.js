export default {
  data: () => ({
    copied: false,
  }),
  methods: {
    copy({ text }, preserveText = false) {
      this.copied = !preserveText || text;
      setTimeout(() => {
        this.copied = false;
      }, 1000);
    },
  },
};
