# Bitcoin Converter (Vanilla JavaScript)

A lightweight, framework-free BTC converter that fetches live prices and updates the UI with reactive primitives in plain JavaScript. The UI is implemented as a Web Component (Custom Element + Shadow DOM), following patterns from the book “Web Components in Action” (Benjamin Farrell, 2019).

Note on reactivity: This project experiments with simple reactive primitives inspired by the TC39 Signals proposal (standardization 
work-in-progress). See the proposal for details: https://github.com/tc39/proposal-signals

The following tools are used:

* Vanilla JavaScript (ES Modules) – no framework, no build step
* Web Components (Custom Elements, Shadow DOM, templates)
* Bootstrap 5.3.3 – styling
* Coingecko.com API – live BTC price data

## Getting Started

### Prerequisites

- A modern browser
- Optional: Node.js and npm (recommended for running a local static server)

### Installation

Clone the repository:
```
git clone https://github.com/OWNER/REPO.git cd REPO
``` 

There is no build step and no required npm dependencies.

### Run locally

Use any static file server and open the site in your browser:

- Using npx serve:
```
$ npx serve .
``` 
- Or using http-server:
```
$ npx http-server .
``` 

Then open the printed local URL (for example http://localhost:3000 or http://127.0.0.1:8080).

## Usage

- Use the <btc-converter> custom element in your HTML (already placed in src/index.html):
  <btc-converter currency="eur" direction="btc-to-fiat" amount="1"></btc-converter>
- Select the currency (EUR or USD)
- Choose direction (BTC → Fiat or Fiat → BTC)
- Enter an amount to see the converted value
- The exchange rate is fetched from CoinGecko and updates every minute

The component exposes attributes/properties (currency, direction, amount) and fires CustomEvents:
- currency-change
- direction-change
- amount-change

It also supports slots for header customization:
- `<slot name="title">` and `<slot name="subtitle">`

## Built With

* Vanilla JavaScript (ES Modules)
* Web Components (Custom Elements, Shadow DOM)
* Bootstrap 5.3.3
* Coingecko Bitcoin Price API

---

This README.md is based on a template from:
https://gist.github.com/PurpleBooth/109311bb0361f32d87a2

