// Signals per TC39 proposal example: signal() and effect()
// Reference: https://github.com/tc39/proposal-signals (example semantics)

let currentEffect = null;
let scheduled = false;
const queue = new Set();

export function signal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  function read() {
    if (currentEffect) {
      subscribers.add(currentEffect);
      currentEffect.deps.add(subscribers);
    }
    return value;
  }

  read.set = (next) => {
    const newValue = typeof next === 'function' ? next(value) : next;
    if (Object.is(newValue, value)) return;
    value = newValue;
    // Schedule subscribers (effects)
    for (const eff of subscribers) {
      queue.add(eff);
    }
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(flushQueue);
    }
  };

  return read;
}

function flushQueue() {
  scheduled = false;
  const toRun = Array.from(queue);
  queue.clear();
  for (const eff of toRun) eff.run();
}

export function effect(fn) {
  const eff = {
    deps: new Set(),
    run() {
      // cleanup old dependencies
      for (const dep of eff.deps) dep.delete(eff);
      eff.deps.clear();
      const prev = currentEffect;
      currentEffect = eff;
      try {
        fn();
      } finally {
        currentEffect = prev;
      }
    }
  };
  // initial run
  eff.run();
  // return a stop function matching example capability
  return () => {
    for (const dep of eff.deps) dep.delete(eff);
    eff.deps.clear();
  };
}

// Minimal computed helper based on signals (not part of the base example but useful)
export function computed(getter) {
  const out = signal(undefined);
  effect(() => out.set(getter()));
  return () => out();
}
