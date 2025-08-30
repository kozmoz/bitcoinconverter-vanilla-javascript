import {signal} from '../services/reactive.js';
import {toErrorMessage} from '../services/network.js';

const API_BASE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,usd';

export function createBitcoinStore() {
  const _price = signal(null);
  const _loading = signal(false);
  const _error = signal(null);

  async function loadPrice() {
    _loading.set(true);
    _error.set(null);
    try {
      const res = await fetch(API_BASE_URL, {headers: {'accept': 'application/json'}});
      if (!res.ok) {
        _error.set(toErrorMessage({status: res.status, message: res.statusText}));
        return;
      }
      const data = await res.json();
      if (!data) {
        _error.set('Empty response from price API');
        return;
      }
      const {eur, usd} = data['bitcoin'] || {};
      if (typeof eur !== 'number' || typeof usd !== 'number') {
        _error.set('Invalid response from price API');
        return;
      }
      const last_updated = Date.now();
      _price.set({eur, usd, last_updated});
      _error.set(null);
    } catch (err) {
      _error.set(toErrorMessage(err) || 'Failed to fetch price');
    } finally {
      _loading.set(false);
    }
  }

  // Initial fetch and polling
  let intervalId = null;

  function start() {
    void loadPrice();
    intervalId = setInterval(loadPrice, 60_000);
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
  }

  return {
    price: _price,
    loading: _loading,
    error: _error,
    start,
    stop
  };
}
