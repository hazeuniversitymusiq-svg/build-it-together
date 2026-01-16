type UnknownErrorEvent = ErrorEvent & { error?: unknown };

type RejectionEvent = PromiseRejectionEvent & { reason?: unknown };

function isCapacitorNative(): boolean {
  const w = window as any;
  return (
    w?.Capacitor?.isNativePlatform?.() === true ||
    window.location.protocol === 'capacitor:'
  );
}

function safeStringify(value: unknown): string {
  try {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack ?? ''}`;
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ensureOverlay(): HTMLDivElement {
  const existing = document.getElementById('flow-native-error-overlay');
  if (existing) return existing as HTMLDivElement;

  const el = document.createElement('div');
  el.id = 'flow-native-error-overlay';
  el.style.position = 'fixed';
  el.style.left = '0';
  el.style.top = '0';
  el.style.right = '0';
  el.style.bottom = '0';
  el.style.zIndex = '2147483647';
  el.style.background = 'rgba(0,0,0,0.92)';
  el.style.color = '#fff';
  el.style.padding = '16px';
  el.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  el.style.overflow = 'auto';

  const title = document.createElement('div');
  title.id = 'flow-native-error-overlay-title';
  title.style.fontSize = '14px';
  title.style.fontWeight = '700';
  title.style.marginBottom = '12px';
  title.textContent = 'FLOW Native Debug';

  const meta = document.createElement('div');
  meta.id = 'flow-native-error-overlay-meta';
  meta.style.opacity = '0.85';
  meta.style.fontSize = '12px';
  meta.style.marginBottom = '12px';
  meta.textContent = `url: ${window.location.href}`;

  const pre = document.createElement('pre');
  pre.id = 'flow-native-error-overlay-pre';
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.fontSize = '12px';
  pre.style.lineHeight = '1.35';
  pre.textContent = '';

  const hint = document.createElement('div');
  hint.style.opacity = '0.75';
  hint.style.fontSize = '12px';
  hint.style.marginTop = '12px';
  hint.textContent = 'Tip: screenshot this screen and send it here.';

  el.appendChild(title);
  el.appendChild(meta);
  el.appendChild(pre);
  el.appendChild(hint);

  document.body.appendChild(el);
  return el;
}

function appendToOverlay(message: string): void {
  const overlay = ensureOverlay();
  const pre = overlay.querySelector('#flow-native-error-overlay-pre') as HTMLPreElement | null;
  if (!pre) return;
  const current = pre.textContent ?? '';
  pre.textContent = current ? `${current}\n\n${message}` : message;
}

export function installNativeErrorOverlay(): void {
  if (typeof window === 'undefined') return;
  if (!isCapacitorNative()) return;

  // Watchdog: if React never renders, show something.
  window.setTimeout(() => {
    const root = document.getElementById('root');
    const empty = !root || root.childNodes.length === 0;
    if (empty) {
      appendToOverlay(
        [
          'WHITE SCREEN WATCHDOG',
          `time: ${new Date().toISOString()}`,
          `href: ${window.location.href}`,
          `userAgent: ${navigator.userAgent}`,
        ].join('\n')
      );
    }
  }, 2500);

  window.addEventListener(
    'error',
    (e) => {
      const ev = e as UnknownErrorEvent;
      appendToOverlay(
        [
          'WINDOW.ERROR',
          `message: ${ev.message}`,
          `file: ${ev.filename ?? ''}`,
          `line: ${ev.lineno ?? ''}:${ev.colno ?? ''}`,
          `error: ${safeStringify(ev.error)}`,
        ].join('\n')
      );
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (e) => {
      const ev = e as RejectionEvent;
      appendToOverlay(
        ['UNHANDLED.REJECTION', `reason: ${safeStringify(ev.reason)}`].join('\n')
      );
    },
    true
  );

  // Capture console.error only AFTER the overlay is already shown.
  // This prevents non-fatal handled errors (e.g., network hiccups) from taking over the UI in native.
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    original(...args);
    try {
      const overlayExists = document.getElementById('flow-native-error-overlay');
      if (!overlayExists) return;
      appendToOverlay(['CONSOLE.ERROR', ...args.map(safeStringify)].join('\n'));
    } catch {
      // ignore
    }
  };
}
