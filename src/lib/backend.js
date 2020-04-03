// copied from https://github.com/aeternity/aepp-raendom/blob/246c75e6fb773cbe8cfe3960975779ab9d81186c/src/utils/backend.js

const BACKEND_URL = 'https://raendom-backend.z52da5wt.xyz';

const wrapTry = async promise => {
  try {
    return Promise.race([
      promise.then(res => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        return res.json();
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

const backendFetch = (path, ...args) => wrapTry(fetch(`${BACKEND_URL}/${path}`, ...args));

export default class Backend {
  static getTipComments = async tipId => backendFetch(`comment/api/tip/${encodeURIComponent(tipId)}`);

  static async sendTipComment(tipId, text, author, signCb) {
    const sendComment = async postParam =>
      backendFetch(`comment/api/`, {
        method: 'post',
        body: JSON.stringify(postParam),
        headers: { 'Content-Type': 'application/json' },
      });

    const responseChallenge = await sendComment({ tipId, text, author });
    const signedChallenge = await signCb(responseChallenge.challenge);
    const respondChallenge = {
      challenge: responseChallenge.challenge,
      signature: signedChallenge,
    };

    return sendComment(respondChallenge);
  }

  static getAllComments = async () => backendFetch(`comment/api/`);

  static getProfile = async address => backendFetch(`profile/${address}`);

  static sendProfileData = async postParam =>
    backendFetch(`profile`, {
      method: 'post',
      body: JSON.stringify(postParam),
      headers: { 'Content-Type': 'application/json' },
    });

  static setProfileImage = async (address, data, image = true) => {
    const request = {
      method: 'post',
      body: image ? data : JSON.stringify(data),
    };
    Object.assign(request, !image && { headers: { 'Content-Type': 'application/json' } });
    console.log(request);
    return wrapTry(fetch(Backend.getProfileImageUrl(address), request));
  };

  static getProfileImageUrl = address => `${BACKEND_URL}/profile/image/${address}`;

  static getStats = async () => backendFetch(`static/stats/`);

  static getCacheTipById = async id => backendFetch(`cache/tip?id=${id}`);

  static getCacheUserStats = async address => backendFetch(`cache/userStats?address=${address}`);

  static getCacheTips = async (ordering, page, address = null, search = null) => {
    let query = `?ordering=${ordering}&page=${page}`;
    if (address) query += `&address=${address}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;

    return backendFetch(`cache/tips${query}`);
  };

  static getCacheStats = async () => backendFetch(`cache/stats`);

  static getCacheChainNames = async () => backendFetch(`cache/chainnames`);

  static getPrice = async () => backendFetch(`cache/price`);

  static getOracleCache = async () => backendFetch(`cache/oracle`);

  static getTopicsCache = async () => backendFetch(`cache/topics`);

  static cacheInvalidateTips = async () => backendFetch(`cache/invalidate/tips`);

  static getCommentCountForAddress = async address => backendFetch(`comment/count/author/${address}`);

  static getTipPreviewUrl = previewLink => `${BACKEND_URL}${previewLink}`;

  static getProfileImageUrl = address => `${BACKEND_URL}/profile/image/${address}`;
}
