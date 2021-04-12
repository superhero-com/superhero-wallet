import { handleUnknownError } from '../../popup/utils/helper';

let store;

export default (s) => {
  store = s;
};

export const openErrorModal = (entry) => store?.dispatch('modals/open', { name: 'error-log', entry }).catch(handleUnknownError);
