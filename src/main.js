// Bootstrap the web component host. The component self-initializes.
window.addEventListener('DOMContentLoaded', () => {
  let root = document.getElementById('app');
  if (!root) {
    root = document.createElement('div');
    root.id = 'app';
    document.body.appendChild(root);
  }
  // Ensure a component exists if not present in HTML
  if (!root.querySelector('btc-converter')) {
    const el = document.createElement('btc-converter');
    el.setAttribute('currency', 'eur');
    el.setAttribute('direction', 'btc-to-fiat');
    el.setAttribute('amount', '1');
    root.appendChild(el);
  }
});
