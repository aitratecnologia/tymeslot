/**
 * Tests for the Aitra dashboard theme switch (assets/js/aitra/theme.js).
 *
 * The module runs on import (it applies the stored choice and injects the
 * button), so each test resets the module registry and imports it afresh.
 */

import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';

function buildTopBar() {
  document.body.innerHTML = `
    <div id="dashboard-root">
      <nav class="brand-nav">
        <div class="flex">
          <div class="logo"></div>
          <div class="relative shrink-0" data-tour="user-menu"></div>
        </div>
      </nav>
    </div>`;
}

async function load() {
  vi.resetModules();
  await import('../theme.js');
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

// Every import starts a MutationObserver; record them so each test can stop
// its own and none fires after the test environment is torn down.
const observers = [];
const NativeObserver = globalThis.MutationObserver;
class RecordingObserver extends NativeObserver {
  constructor(callback) {
    super(callback);
    observers.push(this);
  }
}

describe('aitra theme switch', () => {
  afterEach(() => {
    observers.splice(0).forEach(observer => observer.disconnect());
    globalThis.MutationObserver = NativeObserver;
  });

  beforeEach(() => {
    globalThis.MutationObserver = RecordingObserver;
    localStorage.clear();
    delete document.documentElement.dataset.aitraTheme;
    document.documentElement.lang = 'en';
    buildTopBar();
  });

  test('follows the system by default: no attribute, button before the user menu', async () => {
    await load();
    expect(document.documentElement.dataset.aitraTheme).toBeUndefined();
    const button = document.getElementById('aitra-theme-toggle');
    expect(button).not.toBeNull();
    expect(button.nextElementSibling.dataset.tour).toBe('user-menu');
    expect(button.getAttribute('aria-label')).toBe('Theme: follow system');
  });

  test('applies a stored choice on load', async () => {
    localStorage.setItem('aitra-theme', 'dark');
    await load();
    expect(document.documentElement.dataset.aitraTheme).toBe('dark');
  });

  test('ignores an unknown stored value', async () => {
    localStorage.setItem('aitra-theme', 'sepia');
    await load();
    expect(document.documentElement.dataset.aitraTheme).toBeUndefined();
  });

  test('cycles system → light → dark → system and remembers it', async () => {
    await load();
    const button = document.getElementById('aitra-theme-toggle');

    button.click();
    expect(document.documentElement.dataset.aitraTheme).toBe('light');
    expect(localStorage.getItem('aitra-theme')).toBe('light');

    button.click();
    expect(document.documentElement.dataset.aitraTheme).toBe('dark');
    expect(localStorage.getItem('aitra-theme')).toBe('dark');

    button.click();
    expect(document.documentElement.dataset.aitraTheme).toBeUndefined();
    expect(localStorage.getItem('aitra-theme')).toBeNull();
  });

  test('labels follow the page language', async () => {
    document.documentElement.lang = 'pt-PT';
    await load();
    const button = document.getElementById('aitra-theme-toggle');
    expect(button.getAttribute('aria-label')).toBe('Tema: seguir o sistema');
  });

  test('puts the button back when a re-render drops it', async () => {
    await load();
    document.getElementById('aitra-theme-toggle').remove();
    await Promise.resolve();
    await nextFrame();
    expect(document.getElementById('aitra-theme-toggle')).not.toBeNull();
  });

  test('does nothing outside the dashboard', async () => {
    document.body.innerHTML = '<main></main>';
    await load();
    expect(document.getElementById('aitra-theme-toggle')).toBeNull();
  });
});
