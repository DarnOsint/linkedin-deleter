const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const deletedCount = document.getElementById('deleted-count');
const removedCount = document.getElementById('removed-count');
const mainContent = document.getElementById('main-content');
const notLinkedin = document.getElementById('not-linkedin');

// Check if we're on LinkedIn
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || '';
  if (!url.includes('linkedin.com')) {
    mainContent.style.display = 'none';
    notLinkedin.style.display = 'block';
  }
});

function setStatus(text, type = 'idle') {
  statusText.textContent = text;
  statusDot.className = 'status-dot';
  if (type === 'active') statusDot.classList.add('active');
  if (type === 'done') statusDot.classList.add('done');
  if (type === 'error') statusDot.classList.add('error');
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'UPDATE') {
    deletedCount.textContent = msg.deleted;
    removedCount.textContent = msg.removed;
    setStatus(msg.status, msg.statusType || 'active');
  }
  if (msg.type === 'DONE') {
    deletedCount.textContent = msg.deleted;
    removedCount.textContent = msg.removed;
    setStatus(`✅ Done! Deleted: ${msg.deleted} | Removed: ${msg.removed}`, 'done');
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
  }
});

startBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'START' });
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    setStatus('Starting...', 'active');
  });
});

stopBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'STOP' });
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    setStatus('Stopped', 'idle');
  });
});
