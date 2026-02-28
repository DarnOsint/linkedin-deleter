let running = false;
let deleted = 0;
let removed = 0;

const delay = ms => new Promise(r => setTimeout(r, ms));

function sendUpdate(status, statusType = 'active') {
  chrome.runtime.sendMessage({ type: 'UPDATE', deleted, removed, status, statusType });
}

function sendDone() {
  chrome.runtime.sendMessage({ type: 'DONE', deleted, removed });
}

const removeAriaHidden = () => {
  document.querySelector('.application-outlet')?.removeAttribute('aria-hidden');
};

async function run() {
  running = true;
  deleted = 0;
  removed = 0;

  sendUpdate('Starting...', 'active');

  while (running) {
    window.scrollTo(0, 0);
    await delay(2000);

    if (!running) break;
    sendUpdate('Scanning posts...');

    const menus = [...document.querySelectorAll('button[aria-label*="Open control menu for post"]')];

    if (!menus.length) {
      sendDone();
      running = false;
      break;
    }

    let actionTaken = false;

    for (let menu of menus) {
      if (!running) break;

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await delay(500);

      removeAriaHidden();
      menu.click();

      // Wait for delete option to appear
      let deleteItem = null;
      let removeItem = null;

      for (let i = 0; i < 20; i++) {
        await delay(300);
        removeAriaHidden();
        deleteItem = document.querySelector('li.option-delete div[role="button"]');
        removeItem = document.querySelector('li.option-delete-repost div[role="button"]') ||
                     [...document.querySelectorAll('li div[role="button"] h5')]
                       .find(el => el.innerText.trim().includes('Delete repost'))?.closest('div[role="button"]');
        if (deleteItem || removeItem) break;
      }

      if (deleteItem) {
        sendUpdate('Deleting post...');
        deleteItem.click();
        await delay(1500);

        let confirm = [...document.querySelectorAll('button')]
          .find(btn => btn.innerText?.trim() === 'Delete');
        if (confirm) {
          confirm.click();
          deleted++;
          sendUpdate(`Just deleted post #${deleted} ✓`);
          await delay(5000);
          actionTaken = true;
          break;
        }
      } else if (removeItem) {
        sendUpdate('Removing repost...');
        removeItem.click();
        removed++;
        sendUpdate(`Just removed repost #${removed} ✓`);
        await delay(3000);
        actionTaken = true;
        break;
      } else {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await delay(500);
      }
    }

    if (!actionTaken) {
      sendDone();
      running = false;
      break;
    }

    await delay(3000);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'START') {
    run();
  }
  if (msg.type === 'STOP') {
    running = false;
  }
});
