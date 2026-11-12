export const ENTER_READER_MODE_SCRIPT = `
(() => {
  const existingOverlay = document.getElementById('mingyue-reader-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
    document.documentElement.style.removeProperty('overflow');
    return false;
  }
  const selectors = ['article', 'main', '[role="main"]', '.article', '.post', '.content'];
  let source = null;
  let bestScore = 0;
  for (const selector of selectors) {
    for (const candidate of document.querySelectorAll(selector)) {
      const textLength = (candidate.textContent || '').trim().length;
      if (textLength > bestScore) {
        bestScore = textLength;
        source = candidate;
      }
    }
  }
  if (!source || bestScore < 300) return false;
  const overlay = document.createElement('div');
  overlay.id = 'mingyue-reader-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#f7f7f1;color:#253128;overflow:auto;font-family:Georgia,"Songti SC","Noto Serif SC",serif;line-height:1.85;';
  const bar = document.createElement('div');
  bar.style.cssText = 'position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px max(22px,calc((100vw - 760px)/2));background:rgba(247,247,241,.94);border-bottom:1px solid #d9ded3;backdrop-filter:blur(8px);font-family:system-ui,sans-serif;font-size:13px;z-index:2;';
  const label = document.createElement('span');
  label.textContent = '明月阅读模式';
  label.style.cssText = 'font-weight:700;letter-spacing:.04em;color:#5f735a;';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '退出阅读模式';
  close.style.cssText = 'border:1px solid #c9d0c2;border-radius:999px;background:transparent;color:#4b5f47;padding:6px 13px;font:inherit;cursor:pointer;';
  const closeReader = () => {
    overlay.remove();
    document.documentElement.style.removeProperty('overflow');
    document.removeEventListener('keydown', onKey, true);
    console.log('__mingyue_reader_closed__');
  };
  const onKey = (event) => {
    if (event.key === 'Escape') closeReader();
  };
  close.addEventListener('click', closeReader);
  bar.append(label, close);
  const article = document.createElement('article');
  article.style.cssText = 'width:min(760px,calc(100% - 44px));margin:0 auto;padding:36px 0 80px;font-size:18px;';
  const title = document.createElement('h1');
  title.textContent = document.title || '阅读';
  title.style.cssText = 'font-size:clamp(30px,4vw,48px);line-height:1.16;margin:0 0 26px;letter-spacing:-.03em;font-family:"Songti SC","Noto Serif SC",Georgia,serif;';
  const content = source.cloneNode(true);
  content.querySelectorAll('script,style,nav,aside,form,button,input,textarea,select,[aria-hidden="true"]').forEach((node) => node.remove());
  content.querySelectorAll('*').forEach((node) => {
    node.removeAttribute('style');
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noreferrer');
      node.style.color = '#4b5f47';
    }
  });
  content.style.cssText = 'font-size:inherit;line-height:inherit;';
  article.append(title, content);
  overlay.append(bar, article);
  document.body.append(overlay);
  document.documentElement.style.setProperty('overflow', 'hidden', 'important');
  document.addEventListener('keydown', onKey, true);
  return true;
})()
`

export const EXIT_READER_MODE_SCRIPT = `
(() => {
  const overlay = document.getElementById('mingyue-reader-overlay');
  if (!overlay) return false;
  overlay.remove();
  document.documentElement.style.removeProperty('overflow');
  return true;
})()
`

export const AUTOFILL_SCRIPT = (username: string, password: string): string => `
(() => {
  const passwordInput = document.querySelector(
    'input[type="password"]:not([disabled]), input[autocomplete="current-password"]:not([disabled])'
  );
  if (!passwordInput) return 0;
  const setValue = (input, value) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  setValue(passwordInput, ${JSON.stringify(password)});
  const form = passwordInput.closest('form') || document;
  const candidates = Array.from(
    form.querySelectorAll(
      'input[type="text"]:not([disabled]), input[type="email"]:not([disabled]), input[autocomplete="username"]:not([disabled])'
    )
  );
  const usernameInput = candidates.find(
    (input) => input.compareDocumentPosition(passwordInput) & Node.DOCUMENT_POSITION_FOLLOWING
  ) || candidates[0];
  if (usernameInput) setValue(usernameInput, ${JSON.stringify(username)});
  passwordInput.focus();
  return 1;
})()
`

export const PICTURE_IN_PICTURE_SCRIPT = `
(async () => {
  const videos = Array.from(document.querySelectorAll('video')).filter(
    (video) => video.readyState > 0 && !video.disablePictureInPicture
  );
  const video = videos.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
  if (!video) return false;
  try {
    if (document.pictureInPictureElement === video) {
      await document.exitPictureInPicture();
      return true;
    }
    await video.requestPictureInPicture();
    return true;
  } catch {
    return false;
  }
})()
`
