export interface ScreenshotRegion {
  x: number
  y: number
  width: number
  height: number
}

export const SELECT_REGION_SCRIPT = `
(() => new Promise((resolve) => {
  if (document.getElementById('mingyue-region-overlay')) return resolve(null);
  const overlay = document.createElement('div');
  overlay.id = 'mingyue-region-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(16,28,23,.18);';
  const hint = document.createElement('div');
  hint.textContent = '拖动选择截图区域 · Esc 取消';
  hint.style.cssText = 'position:fixed;top:22px;left:50%;transform:translateX(-50%);padding:8px 14px;border-radius:999px;background:rgba(16,28,23,.9);color:#fff;font:13px system-ui,sans-serif;';
  const selection = document.createElement('div');
  selection.style.cssText = 'position:fixed;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(16,28,23,.3);display:none;';
  overlay.append(hint, selection);
  document.body.append(overlay);
  let startX = 0;
  let startY = 0;
  let dragging = false;
  const cleanup = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey, true);
  };
  const finish = (result) => {
    cleanup();
    resolve(result);
  };
  const onKey = (event) => {
    if (event.key === 'Escape') finish(null);
  };
  const update = (x, y) => {
    const left = Math.min(startX, x);
    const top = Math.min(startY, y);
    const width = Math.abs(x - startX);
    const height = Math.abs(y - startY);
    selection.style.display = width > 2 && height > 2 ? 'block' : 'none';
    selection.style.left = left + 'px';
    selection.style.top = top + 'px';
    selection.style.width = width + 'px';
    selection.style.height = height + 'px';
    return { left, top, width, height };
  };
  overlay.addEventListener('mousedown', (event) => {
    event.preventDefault();
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    update(startX, startY);
  });
  overlay.addEventListener('mousemove', (event) => {
    if (!dragging) return;
    event.preventDefault();
    update(event.clientX, event.clientY);
  });
  overlay.addEventListener('mouseup', (event) => {
    if (!dragging) return;
    dragging = false;
    const rect = update(event.clientX, event.clientY);
    if (rect.width < 4 || rect.height < 4) finish(null);
    else finish(rect);
  });
  document.addEventListener('keydown', onKey, true);
}))()
`
