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
  // Book titles are scraped off blinkist.com, so build the status line out of
  // text nodes rather than innerHTML — a title containing markup would
  // otherwise execute inside the popup.
  el.replaceChildren(
    Object.assign(document.createElement('b'), { textContent: state.status }),
    document.createTextNode(` — ${state.index + 1} / ${state.items.length}`),
    document.createElement('br'),
    document.createTextNode(`Now: ${current ? current.title : '—'}`)
  );
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
