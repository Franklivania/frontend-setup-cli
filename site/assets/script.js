const commandByManager = {
  npm: {
    command: 'npx frontend-setup init',
    helper: 'Uses npx to run the published CLI without installing it globally.'
  },
  pnpm: {
    command: 'pnpm dlx frontend-setup init',
    helper: 'Uses pnpm dlx to fetch and run the published CLI for this invocation.'
  },
  yarn: {
    command: 'yarn dlx frontend-setup init',
    helper: 'Uses Yarn dlx (modern Yarn). Yarn Classic can use the npx command or install the CLI as a dev dependency.'
  },
  bun: {
    command: 'bunx --bun frontend-setup init',
    helper: 'Uses Bun to execute the published CLI with the Bun runtime.'
  }
};

const tabs = [...document.querySelectorAll('[data-manager]')];
const commandElement = document.querySelector('#install-command');
const helperElement = document.querySelector('#install-helper');
const copyButton = document.querySelector('[data-copy-command]');
let activeManager = 'npm';

function selectManager(manager) {
  const selection = commandByManager[manager];
  if (!selection || !commandElement || !helperElement) return;
  activeManager = manager;
  commandElement.textContent = selection.command;
  helperElement.textContent = selection.helper;
  for (const tab of tabs) {
    const selected = tab.dataset.manager === manager;
    tab.classList.toggle('is-active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  if (copyButton) {
    copyButton.textContent = 'Copy';
    copyButton.setAttribute('aria-label', `Copy ${manager} install command`);
  }
}

for (const tab of tabs) {
  tab.addEventListener('click', () => selectManager(tab.dataset.manager));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tabs.indexOf(tab);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex]?.focus();
    selectManager(tabs[nextIndex]?.dataset.manager);
  });
}

copyButton?.addEventListener('click', async () => {
  const value = commandByManager[activeManager]?.command;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    copyButton.textContent = 'Copied';
  } catch {
    copyButton.textContent = 'Select command';
    const range = document.createRange();
    range.selectNodeContents(commandElement);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  copyButton.setAttribute('aria-label', copyButton.textContent === 'Copied' ? 'Command copied' : 'Select command text to copy manually');
});

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuToggle?.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  if (mobileNav) mobileNav.hidden = expanded;
});
mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    if (mobileNav.hidden) return;
    mobileNav.hidden = true;
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Open navigation');
  });
});

selectManager('npm');
