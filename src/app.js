import { signal, effect } from './services/reactive.js';
import { createBitcoinStore } from './stores/bitcoinStore.js';

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
function formatNumber(amount, min=1, max=8) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: min, maximumFractionDigits: max }).format(amount);
}

export function mountApp(root) {
  const store = createBitcoinStore();
  const amount = signal(1);
  const currency = signal('eur'); // 'eur' | 'usd'
  const direction = signal('btc-to-fiat'); // 'btc-to-fiat' | 'fiat-to-btc'

  // Build DOM moved to index.html; ensure elements exist in provided root.

  // Elements
  const elSelect = root.querySelector('#currency');
  const elDir1 = root.querySelector('#dir-btc-to-fiat');
  const elDir2 = root.querySelector('#dir-fiat-to-btc');
  const elDirLabel1 = root.querySelector('#dir-label-1');
  const elDirLabel2 = root.querySelector('#dir-label-2');
  const elAmount = root.querySelector('#amount');
  const elAmountPrefix = root.querySelector('#amount-prefix');
  const elResult = root.querySelector('#resultText');
  const elSpinner = root.querySelector('#spinner');
  const elLastUpdate = root.querySelector('#lastUpdate');
  const elEurLine = root.querySelector('#eurLine');
  const elUsdLine = root.querySelector('#usdLine');
  const elErrorBox = root.querySelector('#errorBox');
  const elErrorText = root.querySelector('#errorText');

  // Ensure required elements exist
  if (!elSelect || !elDir1 || !elDir2 || !elDirLabel1 || !elDirLabel2 || !elAmount || !elAmountPrefix || !elResult || !elSpinner || !elLastUpdate || !elEurLine || !elUsdLine || !elErrorBox || !elErrorText) {
    console.error('Required DOM elements are missing in #app. Ensure index.html contains the expected markup.');
    return;
  }

  // Initialize inputs
  elSelect.value = currency();
  elDir1.checked = direction() === 'btc-to-fiat';
  elDir2.checked = direction() === 'fiat-to-btc';
  elAmount.step = direction() === 'btc-to-fiat' ? '0.000001' : '1';
  elAmount.value = String(amount());

  // Input handlers
  elSelect.addEventListener('change', () => currency.set(elSelect.value));
  elDir1.addEventListener('change', () => direction.set('btc-to-fiat'));
  elDir2.addEventListener('change', () => direction.set('fiat-to-btc'));
  elAmount.addEventListener('input', () => {
    const v = parseFloat(elAmount.value);
    amount.set(Number.isFinite(v) ? v : 0);
  });

  // Reactive effects
  effect(() => {
    const c = currency();
    elDirLabel1.textContent = c === 'eur' ? 'Euro' : 'Dollar';
    elDirLabel2.textContent = c === 'eur' ? 'Euro' : 'Dollar';
    elAmountPrefix.textContent = direction() === 'btc-to-fiat' ? 'BTC' : (c === 'eur' ? 'EUR' : 'USD');
    elAmount.step = direction() === 'btc-to-fiat' ? '0.000001' : '1';
  });

  effect(() => {
    const isLoading = store.loading();
    elSpinner.style.display = isLoading ? 'block' : 'none';
  });

  effect(() => {
    const err = store.error();
    if (err) {
      elErrorText.textContent = err;
      elErrorBox.style.display = '';
    } else {
      elErrorBox.style.display = 'none';
    }
  });

  effect(() => {
    const p = store.price();
    const amt = amount();
    const c = currency();
    const dir = direction();

    if (!p) {
      elResult.innerHTML = '<div class="text-muted">First call loading current rate…</div>';
      elLastUpdate.textContent = '-';
      elEurLine.textContent = '';
      elUsdLine.textContent = '';
      return;
    }
    const last = new Date(p.last_updated);
    elLastUpdate.textContent = last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elEurLine.textContent = `1 BTC = ${formatCurrency(p.eur, 'EUR')}`;
    elUsdLine.textContent = `1 BTC = ${formatCurrency(p.usd, 'USD')}`;

    if (dir === 'fiat-to-btc') {
      if (c === 'eur') {
        const left = formatCurrency(amt || 0, 'EUR');
        const right = `${formatNumber((amt || 0) / p.eur, 1, 8)}\u00A0BTC`;
        elResult.innerHTML = `${left} ≈ <strong>${right}</strong>`;
      } else {
        const left = formatCurrency(amt || 0, 'USD');
        const right = `${formatNumber((amt || 0) / p.usd, 1, 8)}\u00A0BTC`;
        elResult.innerHTML = `${left} ≈ <strong>${right}</strong>`;
      }
    } else {
      const left = `${formatNumber(amt || 0, 1, 8)}\u00A0BTC`;
      if (c === 'eur') {
        const right = formatCurrency((amt || 0) * p.eur, 'EUR');
        elResult.innerHTML = `${left} ≈ <strong>${right}</strong>`;
      } else {
        const right = formatCurrency((amt || 0) * p.usd, 'USD');
        elResult.innerHTML = `${left} ≈ <strong>${right}</strong>`;
      }
    }
  });

  // Start polling and cleanup
  store.start();
  window.addEventListener('beforeunload', store.stop);
}
