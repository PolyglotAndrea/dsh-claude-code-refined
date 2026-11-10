import stylesheet from './refined.css';
import sidebarStyles from './sidebar.css';
import settingsStyles from './settings.css';
import conversationStyles from './conversation.css';
import processStyles from './process.css';
import interactionStyles from './interaction.css';

export const name = 'dsh-claude-code-refined';
const activeAttribute = 'data-dsh-code-refined';
const generationKey = Symbol.for('dsh-claude-code-refined.dispose');

export function apply(ctx) {
  // Retire a previous hot-reload generation before taking ownership.
  globalThis[generationKey]?.();
  const sheet = document.createElement('style');
  sheet.id = name;
  sheet.dataset.plugin = name;
  sheet.dataset.pluginCss = `${name}/refined.css`;
  sheet.textContent = [stylesheet, sidebarStyles, settingsStyles, conversationStyles, processStyles, interactionStyles].join('\n');
  document.head.append(sheet);
  document.body.setAttribute(activeAttribute, '');

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    sheet.remove();
    if (globalThis[generationKey] === dispose) {
      document.body.removeAttribute(activeAttribute);
      delete globalThis[generationKey];
    }
  };
  globalThis[generationKey] = dispose;
  ctx.effect(() => dispose, 'Claude Code Refined styles');
}
