import { mountApp } from './app.js';

window.addEventListener('DOMContentLoaded', () => {
  let root = document.getElementById('app');
  if (!root) {
    root = document.createElement('div');
    root.id = 'app';
    document.body.appendChild(root);
  }
  mountApp(root);
});
