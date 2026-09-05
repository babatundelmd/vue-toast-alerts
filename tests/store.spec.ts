import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createToastStore, type ToastStore } from '../src/store';
import {
  TOAST_ALERTS_DEFAULTS,
  TOAST_EXIT_DURATION,
  type ToastEvent,
} from '../src/types';

let store: ToastStore;

beforeEach(() => {
  vi.useFakeTimers();
  store = createToastStore();
});

afterEach(() => {
  store.dispose();
  vi.useRealTimers();
});

function flushExit() {
  vi.advanceTimersByTime(TOAST_EXIT_DURATION);
}

describe('queueing', () => {
  it('returns an increasing id per toast', () => {
    expect(store.success('one')).toBe(0);
    expect(store.error('two')).toBe(1);
  });

  it('puts the newest toast first', () => {
    store.success('first');
    store.success('second');

    expect(store.toasts.value.map((t) => t.message)).toEqual([
      'second',
      'first',
    ]);
  });

  it('titles each type by default', () => {
    store.success('a');
    store.error('b');
    store.warning('c');
    store.info('d');
    store.pending('e');

    expect(store.toasts.value.map((t) => t.title)).toEqual([
      'Pending',
      'Information',
      'Warning',
      'Error',
      'Success',
    ]);
  });

  it('lets a per-toast title win', () => {
    store.success('a', { title: 'All done' });
    expect(store.toasts.value[0]!.title).toBe('All done');
  });

  it('resolves config as defaults then per-toast overrides', () => {
    store.setConfig({ timeout: 1000 });
    store.success('a', { radius: 'pill' });

    const config = store.toasts.value[0]!.config;
    expect(config.timeout).toBe(1000);
    expect(config.radius).toBe('pill');
    expect(config.position).toBe(TOAST_ALERTS_DEFAULTS.position);
  });

  it('applies new defaults only to later toasts', () => {
    store.success('before');
    store.setConfig({ position: 'bottom-left' });
    store.success('after');

    expect(store.toasts.value[0]!.config.position).toBe('bottom-left');
    expect(store.toasts.value[1]!.config.position).toBe('top-right');
  });

  it('takes defaults from the factory', () => {
    const configured = createToastStore({ position: 'center', timeout: 100 });
    configured.info('a');

    expect(configured.getPosition()).toBe('center');
    expect(configured.toasts.value[0]!.config.timeout).toBe(100);
    configured.dispose();
  });
});

describe('auto-dismiss', () => {
  it('marks the toast leaving at the timeout, then removes it', () => {
    store.success('a', { timeout: 1000 });

    vi.advanceTimersByTime(999);
    expect(store.toasts.value[0]!.leaving).toBe(false);

    vi.advanceTimersByTime(1);
    expect(store.toasts.value[0]!.leaving).toBe(true);
    expect(store.toasts.value).toHaveLength(1);

    flushExit();
    expect(store.toasts.value).toHaveLength(0);
  });

  it('keeps a toast with disableTimeout', () => {
    store.pending('a', { disableTimeout: true });

    vi.advanceTimersByTime(60_000);
    expect(store.toasts.value).toHaveLength(1);
  });

  it('keeps a toast with a zero timeout', () => {
    store.info('a', { timeout: 0 });

    vi.advanceTimersByTime(60_000);
    expect(store.toasts.value).toHaveLength(1);
  });

  it('freezes and resumes the timer', () => {
    const id = store.success('a', { timeout: 1000 });

    vi.advanceTimersByTime(400);
    store.pauseToast(id);
    vi.advanceTimersByTime(10_000);
    expect(store.toasts.value[0]!.leaving).toBe(false);

    store.resumeToast(id);
    vi.advanceTimersByTime(599);
    expect(store.toasts.value[0]!.leaving).toBe(false);

    vi.advanceTimersByTime(1);
    expect(store.toasts.value[0]!.leaving).toBe(true);
  });

  it('ignores a double pause and a resume that never paused', () => {
    const id = store.success('a', { timeout: 1000 });

    store.pauseToast(id);
    store.pauseToast(id);
    store.resumeToast(id);
    store.resumeToast(id);

    vi.advanceTimersByTime(1000);
    expect(store.toasts.value[0]!.leaving).toBe(true);
  });
});

describe('dismissal', () => {
  it('closes by id and removes after the exit animation', () => {
    const id = store.success('a', { disableTimeout: true });

    store.closeToast(id);
    expect(store.toasts.value[0]!.leaving).toBe(true);

    flushExit();
    expect(store.toasts.value).toHaveLength(0);
  });

  it('ignores a second close on a leaving toast', () => {
    const events: ToastEvent[] = [];
    const id = store.success('a', {
      disableTimeout: true,
      onEvent: (e) => events.push(e),
    });

    store.closeToast(id);
    store.closeToast(id);

    expect(events.filter((e) => e.event === 'dismissed')).toHaveLength(1);
  });

  it('ignores an unknown id', () => {
    expect(() => store.closeToast(404)).not.toThrow();
  });

  it('dismisses everything at once', () => {
    store.success('a', { disableTimeout: true });
    store.error('b', { disableTimeout: true });

    store.dismissAll();
    expect(store.toasts.value.every((t) => t.leaving)).toBe(true);

    flushExit();
    expect(store.toasts.value).toHaveLength(0);
  });

  it('reports whether a click should close', () => {
    const yes = store.success('a', { disableTimeout: true });
    const no = store.error('b', {
      disableTimeout: true,
      clickToClose: false,
    });

    expect(store.isCloseableOnClick(yes)).toBe(true);
    expect(store.isCloseableOnClick(no)).toBe(false);
    expect(store.isCloseableOnClick(999)).toBe(true);
  });
});

describe('maxToasts', () => {
  it('drops the oldest past the cap, per position', () => {
    for (let i = 0; i < 7; i++) {
      store.success(`toast ${i}`, { maxToasts: 3, disableTimeout: true });
    }

    expect(store.toasts.value.map((t) => t.message)).toEqual([
      'toast 6',
      'toast 5',
      'toast 4',
    ]);
  });

  it('counts each position separately', () => {
    store.success('tr-1', { maxToasts: 1, disableTimeout: true });
    store.success('bl-1', {
      maxToasts: 1,
      position: 'bottom-left',
      disableTimeout: true,
    });

    expect(store.toasts.value).toHaveLength(2);
  });

  it('reports the eviction as a dismissal with reason "limit"', () => {
    const events: ToastEvent[] = [];
    const onEvent = (e: ToastEvent) => events.push(e);

    store.success('old', { maxToasts: 1, disableTimeout: true, onEvent });
    store.success('new', { maxToasts: 1, disableTimeout: true, onEvent });

    const evicted = events.find((e) => e.reason === 'limit');
    expect(evicted?.message).toBe('old');
  });

  it('keeps everything when the cap is zero or negative', () => {
    for (let i = 0; i < 4; i++) {
      store.success(`t${i}`, { maxToasts: 0, disableTimeout: true });
    }
    expect(store.toasts.value).toHaveLength(4);
  });
});

describe('derived state', () => {
  it('groups by position in insertion order', () => {
    store.success('a', { position: 'top-left', disableTimeout: true });
    store.success('b', { position: 'bottom-right', disableTimeout: true });
    store.success('c', { position: 'top-left', disableTimeout: true });

    const groups = store.toastsByPosition.value;
    expect([...groups.keys()]).toEqual(['top-left', 'bottom-right']);
    expect(groups.get('top-left')!.map((t) => t.message)).toEqual(['c', 'a']);
  });

  it('wants a backdrop only for a live centred toast', () => {
    expect(store.hasBackdrop.value).toBe(false);

    const id = store.center('a', 'info', { disableTimeout: true });
    expect(store.hasBackdrop.value).toBe(true);

    store.closeToast(id);
    expect(store.hasBackdrop.value).toBe(false);
  });

  it('skips the backdrop when the toast asked for none', () => {
    store.center('a', 'info', { backdrop: false, disableTimeout: true });
    expect(store.hasBackdrop.value).toBe(false);
  });

  it('pins center() to the centre whatever the config says', () => {
    store.center('a', 'error', {
      position: 'top-left',
      disableTimeout: true,
    });

    expect(store.toasts.value[0]!.config.position).toBe('center');
    expect(store.toasts.value[0]!.type).toBe('error');
  });

  it('defaults center() to an info toast', () => {
    store.center('a', undefined, { disableTimeout: true });
    expect(store.toasts.value[0]!.type).toBe('info');
  });
});

describe('events', () => {
  it('reports a shown toast without dismissal fields', () => {
    const onEvent = vi.fn();
    store.success('saved', { disableTimeout: true, onEvent });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent.mock.calls[0]![0]).toMatchObject({
      event: 'shown',
      id: 0,
      type: 'success',
      title: 'Success',
      message: 'saved',
      position: 'top-right',
    });
    expect(onEvent.mock.calls[0]![0]).not.toHaveProperty('reason');
  });

  it('reports how long a dismissed toast was on screen, and why', () => {
    const events: ToastEvent[] = [];
    store.success('a', { timeout: 1000, onEvent: (e) => events.push(e) });

    vi.advanceTimersByTime(1000);

    const dismissed = events[1]!;
    expect(dismissed.event).toBe('dismissed');
    expect(dismissed.reason).toBe('timeout');
    expect(dismissed.visibleFor).toBe(1000);
  });

  it('attributes a caller-supplied reason', () => {
    const events: ToastEvent[] = [];
    const id = store.error('a', {
      disableTimeout: true,
      onEvent: (e) => events.push(e),
    });

    store.closeToast(id, 'close-button');
    expect(events[1]!.reason).toBe('close-button');
  });

  it('defaults an unattributed close to "programmatic"', () => {
    const events: ToastEvent[] = [];
    const id = store.error('a', {
      disableTimeout: true,
      onEvent: (e) => events.push(e),
    });

    store.closeToast(id);
    expect(events[1]!.reason).toBe('programmatic');
  });

  it('lets a per-toast handler override the global one', () => {
    const global = vi.fn();
    const local = vi.fn();
    store.setConfig({ onEvent: global });

    store.success('a', { disableTimeout: true, onEvent: local });

    expect(local).toHaveBeenCalled();
    expect(global).not.toHaveBeenCalled();
  });

  it('contains a throwing handler', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onEvent = () => {
      throw new Error('analytics is down');
    };

    expect(() => store.success('a', { disableTimeout: true, onEvent })).not.toThrow();
    expect(store.toasts.value).toHaveLength(1);
    expect(spy).toHaveBeenCalled();
  });
});

describe('lifecycle', () => {
  it('drops pending timers on dispose', () => {
    store.success('a', { timeout: 1000 });
    store.dispose();

    vi.advanceTimersByTime(10_000);
    expect(store.toasts.value[0]!.leaving).toBe(false);
  });

  it('calls the show hook before queueing', () => {
    const hook = vi.fn(() => {
      expect(store.toasts.value).toHaveLength(0);
    });

    store.setShowHook(hook);
    store.success('a', { disableTimeout: true });

    expect(hook).toHaveBeenCalledTimes(1);

    store.setShowHook(null);
    store.success('b', { disableTimeout: true });
    expect(hook).toHaveBeenCalledTimes(1);
  });
});
