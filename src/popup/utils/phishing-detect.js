const phishingCheckUrl = async (url) => {
  try {
    const res = await fetch(`https://etherscamdb.info/api/check/${url}`);
    return await res.json();
  } catch (e) {
    return e;
  }
};

const getPhishingUrls = () => {
  const storage = sessionStorage.getItem('phishing_urls');
  if (!storage) {
    return [];
  }
  return JSON.parse(storage);
};

const setPhishingUrl = (urls) => {
  sessionStorage.setItem('phishing_urls', JSON.stringify(urls));
};

export { phishingCheckUrl, getPhishingUrls, setPhishingUrl };
