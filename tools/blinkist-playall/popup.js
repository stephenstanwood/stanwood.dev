function send(type) {
  return new Promise((resolve) =>
    chrome.runtime.sendMessage({ type }, (resp) => resolve(resp))
  );
}

async function refresh() {
  const resp = await send('BPA_GET_STATE');
  const state = resp?.state;
  const el = document.getElementById('status');
  if (!state || !state.items?.length) {
    el.textContent = 'No active queue.';
    return;
  }
  const current = state.items[state.index];
  el.innerHTML =
    `<b>${state.status}</b> — ${state.index + 1} / ${state.items.length}<br>` +
    `Now: ${current ? current.title : '—'}`;
}

document.getElementById('pause').onclick = async () => {
  await send('BPA_PAUSE');
  refresh();
};
document.getElementById('resume').onclick = async () => {
  await send('BPA_RESUME');
  refresh();
};
document.getElementById('skip').onclick = async () => {
  await send('BPA_NEXT');
  refresh();
};
document.getElementById('clear').onclick = async () => {
  await send('BPA_CLEAR');
  refresh();
};

refresh();
