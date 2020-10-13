import { DEFAULT_BACKEND_URL } from '../popup/utils/constants';

const wrapTry = async promise => {
  try {
    return Promise.race([
      promise.then(async res => {
        const response = res.json();
        const { err, error } = await response;
        if (err || error) {
          const e = { message: err || error, type: 'backend' };
          throw e;
        }
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return response;
      }),
      new Promise((resolve, reject) => {
        setTimeout(reject, 3000, 'TIMEOUT');
      }),
    ]);
  } catch (e) {
    console.error('backend error', e);
    return null;
  }
};

export default class Backend {
  backendUrl = DEFAULT_BACKEND_URL;

  constructor(url) {
    this.backendUrl = url || this.backendUrl;
  }

  backendFetch = (path, ...args) => wrapTry(fetch(`${this.backendUrl}/${path}`, ...args));

  getTipComments = async tipId => this.backendFetch(`comment/api/tip/${encodeURIComponent(tipId)}`);

  async sendTipComment(tipId, text, author, signCb, parentId) {
    const sendComment = async postParam =>
      this.backendFetch('comment/api/', {
        method: 'post',
        body: JSON.stringify(postParam),
        headers: { 'Content-Type': 'application/json' },
      });

    const responseChallenge = await sendComment({ tipId, text, author });
    const signedChallenge = await signCb(responseChallenge.challenge);
    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
      parentId,
    };

    return sendComment(respondChallenge);
  }

  static async modifyNotification(notifId, status, author, signCb) {
    const modifyNotif = async postParam =>
      backendFetch(`notification/${notifId}`, {
        method: 'post',
        body: JSON.stringify(postParam),
        headers: { 'Content-Type': 'application/json' },
      });

    const responseChallenge = await modifyNotif({ author, status });
    const signedChallenge = await signCb(responseChallenge.challenge);
    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };

    return modifyNotif(respondChallenge);
  }

  getAllComments = async () => this.backendFetch('comment/api/');

  getProfile = async address => this.backendFetch(`profile/${address}`);

  static async getAllNotifications(address, signCb) {
    const responseChallenge = await backendFetch(`notification/user/${address}`);
    const signedChallenge = await signCb(responseChallenge.challenge);

    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };
    const url = new URL(`${BACKEND_URL}/notification/user/${address}`);
    Object.keys(respondChallenge).forEach(key =>
      url.searchParams.append(key, respondChallenge[key]),
    );
    return wrapTry(fetch(url.toString()));
  }

  sendProfileData = async postParam =>
    this.backendFetch('profile', {
      method: 'post',
      body: JSON.stringify(postParam),
      headers: { 'Content-Type': 'application/json' },
    });

  setProfileImage = async (address, data, image = true) => {
    const request = {
      method: 'post',
      body: image ? data : JSON.stringify(data),
    };
    Object.assign(request, !image && { headers: { 'Content-Type': 'application/json' } });
    return wrapTry(fetch(this.getProfileImageUrl(address), request));
  };

  deleteProfileImage = async (address, postParam = false) => {
    const request = {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json',
      },
      ...(postParam && { body: JSON.stringify(postParam) }),
    };
    return this.backendFetch(`profile/image/${address}`, request);
  };

  getProfileImageUrl = address => `${this.backendUrl}/profile/image/${address}`;

  getStats = async () => this.backendFetch('static/stats/');

  getCacheTipById = async id => this.backendFetch(`cache/tip?id=${id}`);

  getCacheUserStats = async address => this.backendFetch(`cache/userStats?address=${address}`);

  getCacheTips = async (ordering, page, address = null, search = null) => {
    let query = `?ordering=${ordering}&page=${page}`;
    if (address) query += `&address=${address}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;

    return this.backendFetch(`cache/tips${query}`);
  };

  getCacheStats = async () => this.backendFetch('cache/stats');

  getCacheChainNames = async () => this.backendFetch('cache/chainnames');

  static getPrice = async () =>
    wrapTry(
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=aeternity&vs_currencies=usd,eur,cny',
      ),
    );
  // quick workaround because of CORS issue in the backend.
  // static getPrice = async () => backendFetch('cache/price');

  getOracleCache = async () => this.backendFetch('cache/oracle');

  getTopicsCache = async () => this.backendFetch('cache/topics');

  cacheInvalidateTips = async () => this.backendFetch('cache/invalidate/tips');

  cacheInvalidateOracle = async () => this.backendFetch('cache/invalidate/oracle');

  getCommentCountForAddress = async address => this.backendFetch(`comment/count/author/${address}`);

  getTipPreviewUrl = previewLink => `${this.backendUrl}${previewLink}`;

  getProfileImageUrl = address => `${this.backendUrl}/profile/image/${address}`;

  getCommentById = async id => this.backendFetch(`comment/api/${id}`);

  claimTips = async postParam =>
    this.backendFetch('claim/submit', {
      method: 'post',
      body: JSON.stringify(postParam),
      headers: { 'Content-Type': 'application/json' },
    });

  donateError = async postParam =>
    this.backendFetch('errorreport', {
      method: 'post',
      body: JSON.stringify(postParam),
      headers: { 'Content-Type': 'application/json' },
    });

  getVerifiedUrls = async () => this.backendFetch('verified');

  getGraylistedUrls = async () => this.backendFetch('static/wallet/graylist');

  getTxEvents = async (address, recent, limit) =>
    this.backendFetch(
      `cache/events/?address=${address}&event=TipWithdrawn${recent ? `&limit=${limit}` : ``}`,
    );
}
