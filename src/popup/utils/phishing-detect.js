const phishingCheckUrl = url =>
  fetch(`https://etherscamdb.info/api/check/${url}`)
    .then(res => res.json())
    .catch(err => err);

const getPhishingUrls = () => {
  const storage = sessionStorage.getItem('phishing_urls');
  if (!storage) {
    return [];
  }
  return JSON.parse(storage);
};

const setPhishingUrl = urls => {
  sessionStorage.setItem('phishing_urls', JSON.stringify(urls));
};

export { phishingCheckUrl, getPhishingUrls, setPhishingUrl };
