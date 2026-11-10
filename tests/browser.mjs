import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

// Run against a disposable Harness profile; never against the user's profile.
const log = await readFile('.debug/harness.log', 'utf8');
const url = log.match(/http:\/\/127\.0\.0\.1:5188\/\?\S+/)?.[0];
assert.ok(url, 'Start the isolated Harness profile described in README.md');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const checks = [];
const errors = [];
const screenshotDir = '.debug/screenshots';
await mkdir(screenshotDir, { recursive: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('body[data-dsh-claude-style][data-dsh-code-refined]');
  const notice = page.getByRole('button', { name: 'Continue', exact: true });
  if (await notice.isVisible()) await notice.click();
  await page.waitForTimeout(800);
  assert.equal(await page.getByRole('heading', { name: 'Get started', exact: true }).count(), 0);
  checks.push('Real DSH 0.2.2-rc.1 loads the companion after Claude Style 0.19.7');

  await page.evaluate(() => document.body.removeAttribute('data-dsh-code-refined'));
  const baseline = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.screenshot({ path: `${screenshotDir}/before-light.png` });
  await page.evaluate(() => document.body.setAttribute('data-dsh-code-refined', ''));

  for (const [scheme, expected] of [['light', 'rgb(250, 249, 245)'], ['dark', 'rgb(38, 38, 36)']]) {
    await page.evaluate(dark => document.body.toggleAttribute('data-ds-dark-theme', dark), scheme === 'dark');
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), expected);
    const hero = await page.locator('[data-composer-card]').boundingBox();
    assert.ok(hero.width > 600 && hero.height >= 130, 'Home must show the full writing card');
    assert.ok(hero.y > 100 && hero.y + hero.height < 960, 'Centered card remains in the viewport');
    assert.equal(await page.locator('.dsh-claude-home-panel').isVisible(), false);
    await page.screenshot({ path: `${screenshotDir}/refined-${scheme}.png` });
    checks.push(`${scheme}: correct palette, centered card, no dashboard or mascot obstruction`);
  }

  await page.evaluate(() => document.body.removeAttribute('data-ds-dark-theme'));
  const editor = page.locator('[data-composer-input]');
  await editor.fill('请检查这个函数的边界条件。\nKeep the API unchanged.');
  assert.match(await editor.innerText(), /Keep the API unchanged/);
  const send = page.locator('button[data-dsh-claude-control="send"]');
  assert.ok(await send.isVisible());
  const rects = await page.evaluate(() => {
    const card = document.querySelector('[data-composer-card]').getBoundingClientRect();
    const send = document.querySelector('button[data-dsh-claude-control="send"]').getBoundingClientRect();
    const model = document.querySelector('.dsh-claude-model-seat')?.getBoundingClientRect();
    return { inside: send.right <= card.right && send.bottom <= card.bottom, overlap: model && model.right > send.left };
  });
  assert.ok(rects.inside);
  assert.ok(!rects.overlap, 'Send and model selector must not overlap');
  checks.push('Chinese/English multiline input and send/model control geometry');

  await page.getByRole('button', { name: /^Select model, currently/ }).click();
  await page.getByText('Offline visual test', { exact: true }).first().waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await page.locator('button[data-dsh-claude-control="commands"]').click();
  await page.waitForTimeout(150);
  assert.ok(await page.getByText('File', { exact: true }).isVisible());
  assert.ok(await page.getByText('Compact older conversation history', { exact: true }).isVisible());
  await page.keyboard.press('Escape');
  checks.push('Native model and add-file/command menus remain operable');

  await editor.fill('');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  const mobile = await page.locator('[data-composer-card]').boundingBox();
  assert.ok(mobile.x >= -1 && mobile.x + mobile.width <= 391, 'Mobile composer must stay in viewport');
  assert.ok(mobile.y >= 0 && mobile.y + mobile.height <= 844);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: `${screenshotDir}/refined-mobile.png` });
  checks.push('390px viewport: reachable composer and no horizontal page overflow');

  // Exercise real DOM/style ownership across host-style lifecycle callbacks.
  const bundle = await readFile('lib/client.js', 'utf8');
  const lifecycle = await page.evaluate(code => {
    let plugin;
    new Function('window', code)({ __ModuleLoader__: { load: entry => { plugin = entry.factory(); } } });
    const disposers = [];
    const ctx = { effect: fn => disposers.push(fn()) };
    plugin.apply(ctx);
    const oldDispose = disposers[0];
    plugin.apply(ctx);
    oldDispose();
    const newSurvives = document.body.hasAttribute('data-dsh-code-refined') && document.querySelectorAll('#dsh-claude-code-refined').length === 1;
    disposers[1]();
    disposers[1]();
    return { newSurvives, markerGone: !document.body.hasAttribute('data-dsh-code-refined'), stylesGone: !document.getElementById('dsh-claude-code-refined'), baseRemains: document.body.hasAttribute('data-dsh-claude-style'), background: getComputedStyle(document.body).backgroundColor };
  }, bundle);
  assert.deepEqual(lifecycle, { newSurvives: true, markerGone: true, stylesGone: true, baseRemains: true, background: baseline });
  checks.push('Repeated reload, stale cleanup, idempotent disposal and exact base-palette restoration');
  assert.deepEqual(errors, []);
  checks.push('No browser JavaScript errors');
  await writeFile('.debug/test-results.json', JSON.stringify({ checks, errors }, null, 2));
  console.log(checks.map(x => `PASS ${x}`).join('\n'));
} finally {
  await browser.close();
}
