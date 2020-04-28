import axios from 'axios';
import { BACKEND_URL } from '../popup/utils/constants';
import { getTwitterAccountUrl } from '../popup/utils/helper';

export default {
  data: () => ({
    verifiedUrls: [],
    blacklistedUrls: [],
  }),
  async created() {
    try {
      this.verifiedUrls = (await axios.get(`${BACKEND_URL}/verified`)).data;
      this.blacklistedUrls = (await axios.get(`${BACKEND_URL}/static/wallet/graylist`)).data;
    } catch (e) {
      this.$logError({ e, action: 'fetch-verified' });
    }
  },
  methods: {
    getStatus(tipUrl) {
      if (!tipUrl) return 'not-supported';
      const twitterProfile = getTwitterAccountUrl(tipUrl);
      const url = twitterProfile || tipUrl;
      let status;
      if (this.blacklistedUrls.some(u => url.includes(u))) {
        status = 'blacklisted';
      } else if (this.verifiedUrls.includes(url)) {
        status = 'verified';
      } else {
        status = 'not-supported';
      }

      return status;
    },
    showStatusModal(status) {
      this.$store.dispatch('modals/open', {
        name: 'tip-badge',
        status,
      });
    },
  },
};
