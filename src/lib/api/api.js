import axios from 'axios';
import * as settings from '../../config';

/**
 * @param params
 */
export async function register(params) {
  let protocol = settings.apiSecure ? 'https' : 'http';
  let endpoint = `${protocol}://${settings.apiServerUri}/api/game/register`;
  let response = await _get(endpoint, params);
  return response.data;
}


/**
 * @param endpoint
 * @param params
 * @private
 */
async function _get(endpoint, params = {}) {
  return axios.get(endpoint, {
    params,
    validateStatus(status) {
      return status >= 200 && status < 300; // default
    }
  });
}

/**
 * @param endpoint
 * @param data
 * @private
 */
async function _post(endpoint, data = {}) {
  return axios.get(endpoint, {
    params,
    validateStatus(status) {
      return status >= 200 && status < 300; // default
    }
  });
}