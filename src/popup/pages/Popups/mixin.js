export default {
  props: {
    app: { type: Object, default: null },
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  computed: {
    faviconUrl() {
      return this.app.icons?.length
        ? this.app.icons[0]
        : `${this.app.protocol}//${this.app.host}/favicon.ico`;
    },
  },
  methods: {
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
