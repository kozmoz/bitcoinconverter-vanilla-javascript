// Minimal reactive helper: signal, computed, effect
export function signal(initial) {
  let value = initial;
  const subs = new Set();
  const read = () => {
    if (currentEffect) depsStack.get(read)?.add(currentEffect);
    return value;
  };
  read.set = (v) => {
    if (typeof v === 'function') value = v(value); else value = v;
    subs.forEach(fn => fn());
    const deps = depsStack.get(read);
    if (deps) deps.forEach(fn => fn());
  };
  read.subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
  depsStack.set(read, new Set());
  return read;
}

export function computed(fn) {
  const sig = signal(undefined);
  const run = () => sig.set(fn());
  effect(run);
  const read = () => sig();
  read.subscribe = sig.subscribe;
  return read;
}

let currentEffect = null;
const depsStack = new Map();

export function effect(fn) {
  const runner = () => {
    currentEffect = runner;
    try { fn(); } finally { currentEffect = null; }
  };
  runner();
  return () => { /* no-op unsubscribe for simplicity */ };
}
