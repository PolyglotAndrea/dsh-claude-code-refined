import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Connect only to the explicitly enabled local desktop inspection endpoint.
// This suite navigates menus, but never submits chats or changes durable settings.
const browser = await chromium.connectOverCDP('http://127.0.0.1:9231');
const page = browser.contexts().flatMap(c => c.pages()).find(p => /^(https?|dsh-app):/.test(p.url()));
assert.ok(page, 'Desktop window unavailable');
await page.locator('body[data-dsh-claude-style][data-dsh-code-refined]').waitFor();
await mkdir('.debug/surfaces', { recursive: true });
const errors = [];
const checks = [];
page.on('pageerror', e => errors.push(e.message));
const initialDark = await page.locator('body').evaluate(e => e.hasAttribute('data-ds-dark-theme'));
const css = (await Promise.all(['refined', 'sidebar', 'settings', 'conversation', 'process', 'interaction'].map(name => readFile(`src/${name}.css`, 'utf8')))).join('\n');

try {
  if (!process.argv.includes('--installed')) {
    await page.locator('#dsh-claude-code-refined').evaluate((e, text) => { e.textContent = text; }, css);
  }
  await page.keyboard.press('Escape');
  const logo = page.locator('[data-dsh-claude-part~="logo-row"]');
  const brand = logo.locator('[data-dsh-claude-part~="brand-button"]');
  const search = logo.locator('.dsh-claude-search-trigger');
  for (const hovered of [brand, search]) {
    await hovered.hover();
    await page.waitForTimeout(180);
    assert.equal(await brand.evaluate(e => getComputedStyle(e).opacity), '1');
    assert.equal(await search.evaluate(e => getComputedStyle(e).opacity), '1');
    const a = await brand.boundingBox(), b = await search.boundingBox();
    assert.ok(a.y + a.height <= b.y, 'Brand and search need separate rows');
  }
  checks.push('Desktop header: brand stays visible on both hover targets; search has a separate row');
  await search.click();
  await page.locator('.dsh-claude-search-dialog').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await page.keyboard.press('Meta+k');
  await page.locator('.dsh-claude-search-dialog').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  checks.push('Search opens by click and Command+K and closes with Escape');

  const bubbles = page.locator('[data-chat-flow-kind="user"] [data-message-bubble]');
  if (await bubbles.count()) {
    assert.equal(await bubbles.first().evaluate(e => getComputedStyle(e).borderRadius), '14px');
    checks.push('Existing conversation user bubble uses the refined frame');
  }
  await page.screenshot({ path: '.debug/surfaces/conversation-after.png' });
  const processGroup = page.locator('[data-step-process]').last();
  if (await processGroup.count()) {
    const turn = await processGroup.getAttribute('data-chat-turn');
    const turnToggle = page.locator(`button[data-turn-process="${turn}"]`);
    const turnWasCollapsed = await turnToggle.count() && await turnToggle.getAttribute('aria-expanded') === 'false';
    if (turnWasCollapsed) await turnToggle.click();
    const toggle = processGroup.locator('button[data-process-activity]').first();
    const wasExpanded = await toggle.getAttribute('aria-expanded') === 'true';
    if (!wasExpanded) await toggle.click();
    const tool = processGroup.locator('[data-disclosure-row][data-expandable="true"][aria-expanded="false"]').first();
    // Keep the same row after its expanded attribute changes.
    const toolHandle = await tool.elementHandle();
    await tool.click();
    await page.waitForFunction(e => e.getAttribute('aria-expanded') === 'true', toolHandle);
    await toolHandle.press('Enter');
    await page.waitForFunction(e => e.getAttribute('aria-expanded') === 'false', toolHandle);
    assert.equal(await toolHandle.getAttribute('aria-expanded'), 'false');
    if (!wasExpanded) await toggle.click();
    if (turnWasCollapsed) await turnToggle.click();
    checks.push('Existing conversation work details and individual tool entries expand and collapse');
  }

  for (const scheme of ['light', 'dark']) {
    await page.evaluate(dark => document.body.toggleAttribute('data-ds-dark-theme', dark), scheme === 'dark');
    await page.mouse.move(900, 100);
    const account = page.locator('[data-dsh-claude-account-host-row]');
    await account.click();
    const menu = page.locator('[data-dsh-claude-account-menu]');
    await menu.waitFor({state:'visible'});
    await menu.evaluate(e => Promise.all(e.getAnimations({subtree:true}).map(a => a.finished)));
    assert.equal(await menu.locator('.dsh-claude-account-popover-header').isVisible(), false);
    const settingsItem=menu.getByRole('menuitem',{name:/Settings/});
    assert.ok(await settingsItem.isVisible());
    assert.ok(await menu.getByRole('menuitem',{name:/Feedback/}).isVisible());
    assert.ok(await menu.getByRole('menuitem',{name:/Sign out/}).isVisible());
    const menuBox = await menu.boundingBox(), settingsBox = await settingsItem.boundingBox();
    assert.ok(settingsBox.y - menuBox.y < 14, 'Account menu has no blank header band');
    await page.screenshot({path:`.debug/surfaces/account-${scheme}.png`});
    await page.keyboard.press('ArrowDown');
    assert.ok(await menu.evaluate(e => e.contains(document.activeElement)), 'Menu owns keyboard focus');
    await settingsItem.click();
    const dialog = page.locator('[data-shortcut-modal="settings"]');
    await dialog.getByRole('button',{name:'General',exact:true}).click();
    await page.waitForTimeout(200);
    const appearance = dialog.locator('[data-dsh-claude-part~="text-title"]').filter({hasText:'Appearance'});
    assert.match(await appearance.evaluate(e=>getComputedStyle(e).fontFamily), /Anthropic Sans|Claude Style Inter/);
    assert.equal(await dialog.evaluate(e=>getComputedStyle(e).borderRadius), '16px');
    const selected = dialog.locator('nav button[aria-current="true"]');
    assert.equal(await selected.innerText(), 'General');
    const box = await dialog.boundingBox(), viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
    assert.ok(box.x >= 0 && box.y >= 0 && box.x+box.width <= viewport.width && box.y+box.height <= viewport.height);
    await page.screenshot({path:`.debug/surfaces/settings-${scheme}.png`});
    await dialog.screenshot({path:`.debug/surfaces/settings-panel-${scheme}.png`});
    await dialog.getByRole('button',{name:'Claude Style',exact:true}).click();
    await dialog.locator('.dsh-claude-settings').waitFor({state:'visible'});
    await page.screenshot({path:`.debug/surfaces/theme-settings-${scheme}.png`});
    await page.keyboard.press('Escape');
    await dialog.waitFor({state:'hidden'});
    checks.push(`${scheme}: compact account menu, intact actions/keyboard focus, general settings and theme settings`);
  }
  assert.deepEqual(errors, []);
  checks.push('No new browser JavaScript errors during surface navigation');
  await writeFile('.debug/surfaces/test-results.json',JSON.stringify({installed:process.argv.includes('--installed'),checks,errors},null,2));
  console.log(checks.map(s=>`PASS ${s}`).join('\n'));
} finally {
  await page.keyboard.press('Escape');
  await page.evaluate(dark => document.body.toggleAttribute('data-ds-dark-theme', dark), initialDark);
  await browser.close();
}
