import { signal, effect } from '../services/reactive.js';
import { createBitcoinStore } from '../stores/bitcoinStore.js';

// Web Component inspired by patterns in "Web Components in Action"
// - Custom Element definition
// - Shadow DOM encapsulation
// - Template for markup
// - Attributes <-> properties reflection
// - Lifecycle: connected/disconnected callbacks
// - Event-driven communication via CustomEvent (for changes)

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { display: block; }
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  <div class="bg-primary text-white py-3 mb-4">
    <div class="container">
      <h1 class="h3 mb-0"><slot name="title">Vanilla JS Bitcoin Converter</slot></h1>
      <p class="mb-0 small opacity-75"><slot name="subtitle">Live BTC price via CoinGecko</slot></p>
    </div>
  </div>
  <div class="container mb-5">
    <div class="row g-4 align-items-start">
      <div class="col-12 col-lg-6">
        <div class="mb-3 row">
          <label class="col-sm-2 col-form-label" for="currency">Currency</label>
          <div class="col-sm-10">
            <select id="currency" class="form-select w-auto">
              <option value="eur">EUR</option>
              <option value="usd">USD</option>
            </select>
          </div>
        </div>
        <div class="mb-3 row">
          <label class="col-sm-2 col-form-label d-block">Direction</label>
          <div class="col-sm-10">
            <div class="form-check">
              <input class="form-check-input" type="radio" id="dir-btc-to-fiat" name="direction" value="btc-to-fiat">
              <label class="form-check-label" for="dir-btc-to-fiat">BTC → <span id="dir-label-1">Euro</span></label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" id="dir-fiat-to-btc" name="direction" value="fiat-to-btc">
              <label class="form-check-label" for="dir-fiat-to-btc"><span id="dir-label-2">Euro</span> → BTC</label>
            </div>
          </div>
        </div>
        <div class="mb-3 row">
          <label class="col-sm-2 col-form-label" for="amount">Amount</label>
          <div class="col-sm-10">
            <div class="input-group" style="width: 20em;">
              <span class="input-group-text" id="amount-prefix">BTC</span>
              <input id="amount" class="form-control" type="number" min="0">
            </div>
            <div class="form-text">The amount that is used for the calculations.</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-6">
        <div class="border border-2 border-primary rounded-4 p-4">
          <div class="display-6 fw-semibold text-center mb-3" id="resultText"></div>
          <div class="text-center text-muted mb-2">The exchange rate updates every minute.</div>
          <div class="text-center text-muted" style="position: relative;">
            <div class="text-center" style="position: absolute; right: 0; top: 0; display:none;" id="spinner">
              <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
            </div>
            Last update at: <strong id="lastUpdate">-</strong><br/>
            <span id="eurLine"></span><br/>
            <span id="usdLine"></span>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4" id="errorBox" style="display:none;">
      <div class="alert alert-danger" role="alert" id="errorText"></div>
    </div>
  </div>
`;

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
function formatNumber(amount, min=1, max=8) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: min, maximumFractionDigits: max }).format(amount);
}

export class BtcConverter extends HTMLElement {
  static get observedAttributes() { return ['currency', 'direction', 'amount']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // State using minimal reactive primitives
    this._store = createBitcoinStore();
    this._amount = signal(1);
    this._currency = signal('eur');
    this._direction = signal('btc-to-fiat');

    // bound handlers
    this._onCurrencyChange = this._onCurrencyChange.bind(this);
    this._onDirBtcToFiat = this._onDirBtcToFiat.bind(this);
    this._onDirFiatToBtc = this._onDirFiatToBtc.bind(this);
    this._onAmountInput = this._onAmountInput.bind(this);

    this._disposers = [];
  }

  // Properties reflecting attributes
  get currency() { return this._currency(); }
  set currency(val) { this.setAttribute('currency', val); }

  get direction() { return this._direction(); }
  set direction(val) { this.setAttribute('direction', val); }

  get amount() { return this._amount(); }
  set amount(val) { this.setAttribute('amount', String(val)); }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'currency') this._currency.set(newValue === 'usd' ? 'usd' : 'eur');
    if (name === 'direction') this._direction.set(newValue === 'fiat-to-btc' ? 'fiat-to-btc' : 'btc-to-fiat');
    if (name === 'amount') {
      const v = parseFloat(newValue);
      this._amount.set(Number.isFinite(v) ? v : 0);
    }
  }

  connectedCallback() {
    const root = this.shadowRoot;
    this._el = {
      select: root.querySelector('#currency'),
      dir1: root.querySelector('#dir-btc-to-fiat'),
      dir2: root.querySelector('#dir-fiat-to-btc'),
      dirLabel1: root.querySelector('#dir-label-1'),
      dirLabel2: root.querySelector('#dir-label-2'),
      amount: root.querySelector('#amount'),
      amountPrefix: root.querySelector('#amount-prefix'),
      result: root.querySelector('#resultText'),
      spinner: root.querySelector('#spinner'),
      lastUpdate: root.querySelector('#lastUpdate'),
      eurLine: root.querySelector('#eurLine'),
      usdLine: root.querySelector('#usdLine'),
      errorBox: root.querySelector('#errorBox'),
      errorText: root.querySelector('#errorText')
    };

    // Initialize from attributes
    if (this.hasAttribute('currency')) {
      this._currency.set(this.getAttribute('currency'));
    }
    if (this.hasAttribute('direction')) {
      this._direction.set(this.getAttribute('direction'));
    }
    if (this.hasAttribute('amount')) {
      const v = parseFloat(this.getAttribute('amount'));
      this._amount.set(Number.isFinite(v) ? v : 0);
    }

    // Initialize inputs
    this._el.select.value = this._currency();
    this._el.dir1.checked = this._direction() === 'btc-to-fiat';
    this._el.dir2.checked = this._direction() === 'fiat-to-btc';
    this._el.amount.step = this._direction() === 'btc-to-fiat' ? '0.000001' : '1';
    this._el.amount.value = String(this._amount());

    // Input handlers (emit events so hosts can listen, per WCIA guidance)
    this._el.select.addEventListener('change', this._onCurrencyChange);
    this._el.dir1.addEventListener('change', this._onDirBtcToFiat);
    this._el.dir2.addEventListener('change', this._onDirFiatToBtc);
    this._el.amount.addEventListener('input', this._onAmountInput);

    // Effects
    this._disposers.push(effect(() => {
      const c = this._currency();
      this._el.dirLabel1.textContent = c === 'eur' ? 'Euro' : 'Dollar';
      this._el.dirLabel2.textContent = c === 'eur' ? 'Euro' : 'Dollar';
      this._el.amountPrefix.textContent = this._direction() === 'btc-to-fiat' ? 'BTC' : (c === 'eur' ? 'EUR' : 'USD');
      this._el.amount.step = this._direction() === 'btc-to-fiat' ? '0.000001' : '1';
    }));

    this._disposers.push(effect(() => {
      const isLoading = this._store.loading();
      this._el.spinner.style.display = isLoading ? 'block' : 'none';
    }));

    this._disposers.push(effect(() => {
      const err = this._store.error();
      if (err) {
        this._el.errorText.textContent = err;
        this._el.errorBox.style.display = '';
      } else {
        this._el.errorBox.style.display = 'none';
      }
    }));

    this._disposers.push(effect(() => {
      const p = this._store.price();
      const amt = this._amount();
      const c = this._currency();
      const dir = this._direction();

      if (!p) {
        this._el.result.innerHTML = '<div class="text-muted">First call loading current rate…</div>';
        this._el.lastUpdate.textContent = '-';
        this._el.eurLine.textContent = '';
        this._el.usdLine.textContent = '';
        return;
      }
      const last = new Date(p.last_updated);
      this._el.lastUpdate.textContent = last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this._el.eurLine.textContent = `1 BTC = ${formatCurrency(p.eur, 'EUR')}`;
      this._el.usdLine.textContent = `1 BTC = ${formatCurrency(p.usd, 'USD')}`;

      if (dir === 'fiat-to-btc') {
        if (c === 'eur') {
          const left = formatCurrency(amt || 0, 'EUR');
          const right = `${formatNumber((amt || 0) / p.eur, 1, 8)}\u00A0BTC`;
          this._el.result.innerHTML = `${left} ≈ <strong>${right}</strong>`;
        } else {
          const left = formatCurrency(amt || 0, 'USD');
          const right = `${formatNumber((amt || 0) / p.usd, 1, 8)}\u00A0BTC`;
          this._el.result.innerHTML = `${left} ≈ <strong>${right}</strong>`;
        }
      } else {
        const left = `${formatNumber(amt || 0, 1, 8)}\u00A0BTC`;
        if (c === 'eur') {
          const right = formatCurrency((amt || 0) * p.eur, 'EUR');
          this._el.result.innerHTML = `${left} ≈ <strong>${right}</strong>`;
        } else {
          const right = formatCurrency((amt || 0) * p.usd, 'USD');
          this._el.result.innerHTML = `${left} ≈ <strong>${right}</strong>`;
        }
      }
    }));

    // Start polling
    this._store.start();
  }

  disconnectedCallback() {
    // cleanup subscriptions
    for (const dispose of this._disposers) {
      try { dispose(); } catch {}
    }
    this._disposers = [];
    this._store.stop();

    // remove listeners
    if (this._el) {
      this._el.select.removeEventListener('change', this._onCurrencyChange);
      this._el.dir1.removeEventListener('change', this._onDirBtcToFiat);
      this._el.dir2.removeEventListener('change', this._onDirFiatToBtc);
      this._el.amount.removeEventListener('input', this._onAmountInput);
    }
  }

  _onCurrencyChange() {
    const val = this._el.select.value;
    this._currency.set(val);
    this.dispatchEvent(new CustomEvent('currency-change', { detail: { value: val } }));
    this.setAttribute('currency', val);
  }
  _onDirBtcToFiat() {
    if (this._el.dir1.checked) {
      this._direction.set('btc-to-fiat');
      this.dispatchEvent(new CustomEvent('direction-change', { detail: { value: 'btc-to-fiat' } }));
      this.setAttribute('direction', 'btc-to-fiat');
    }
  }
  _onDirFiatToBtc() {
    if (this._el.dir2.checked) {
      this._direction.set('fiat-to-btc');
      this.dispatchEvent(new CustomEvent('direction-change', { detail: { value: 'fiat-to-btc' } }));
      this.setAttribute('direction', 'fiat-to-btc');
    }
  }
  _onAmountInput() {
    const v = parseFloat(this._el.amount.value);
    const next = Number.isFinite(v) ? v : 0;
    this._amount.set(next);
    this.dispatchEvent(new CustomEvent('amount-change', { detail: { value: next } }));
    this.setAttribute('amount', String(next));
  }
}

customElements.define('btc-converter', BtcConverter);
