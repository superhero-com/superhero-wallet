export const setTxInQueue = async tx => {
  const { processingTx } = await browser.storage.local.get('processingTx');
  let list = [];
  if (typeof processingTx !== 'undefined' && processingTx.length) {
    list = [...list, ...processingTx];
  }
  list.push(tx);
  await browser.storage.local.set({ processingTx: list });
};

export const setPendingTx = async tx => {
  const { pendingTxs } = await browser.storage.local.get('pendingTxs');
  let list = [];
  if (pendingTxs && pendingTxs.length) {
    list = [...list, ...pendingTxs];
  }
  list.push(tx);
  await setTxInQueue(tx.hash);
  return await browser.storage.local.set({ pendingTxs: list });
};

export const formatTime = time => new Date(parseInt(time)).toLocaleTimeString(navigator.language, { timeStyle: 'short', hourCycle: 'h24', hour: '2-digit', minute: '2-digit' });

export const formatDate = time =>
  new Date(parseInt(time)).toLocaleString(navigator.language, {
    timeStyle: 'short',
    dateStyle: 'short',
    hourCycle: 'h24',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });