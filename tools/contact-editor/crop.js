// Crop dialog for a picked image: drag inside the box to move it, drag a corner to resize,
// pick a ratio preset, then apply (or keep the whole image). Resolves to a Blob of the same type,
// or null when cancelled.

const RATIOS = [['free', 0], ['1:1', 1], ['4:3', 4 / 3], ['16:9', 16 / 9]];

export function cropImage(file, strings) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const overlay = Object.assign(document.createElement('div'), { className: 'ce-crop' });
    overlay.innerHTML = `
      <div class="ce-crop-box" role="dialog" aria-modal="true" aria-label="${strings.crop_title}">
        <p class="ce-crop-title">${strings.crop_title}</p>
        <div class="ce-crop-stage"><img alt=""><div class="ce-crop-rect">
          <i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div></div>
        <div class="ce-crop-bar">
          <div class="ce-crop-ratios">${RATIOS.map(([k], i) => `<button type="button" class="ce-chip${i ? '' : ' is-on'}" data-r="${i}">${k === 'free' ? strings.crop_free : k}</button>`).join('')}</div>
          <div class="ce-crop-actions">
            <button type="button" class="ce-btn" data-act="cancel">${strings.cancel}</button>
            <button type="button" class="ce-btn" data-act="skip">${strings.crop_skip}</button>
            <button type="button" class="ce-btn is-primary" data-act="ok">${strings.crop_ok}</button>
          </div>
        </div>
      </div>`;
    document.body.append(overlay);
    const img = overlay.querySelector('img');
    const rectEl = overlay.querySelector('.ce-crop-rect');
    let W = 0, H = 0, ratio = 0;
    let r = { x: 0, y: 0, w: 0, h: 0 }; // in displayed pixels

    const paint = () => Object.assign(rectEl.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
    const fit = () => {
      if (!ratio) { r = { x: 0, y: 0, w: W, h: H }; return paint(); }
      let w = W, h = w / ratio;
      if (h > H) { h = H; w = h * ratio; }
      r = { x: (W - w) / 2, y: (H - h) / 2, w, h };
      paint();
    };
    img.onload = () => { W = img.clientWidth; H = img.clientHeight; fit(); };
    img.src = url;

    rectEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      rectEl.setPointerCapture(e.pointerId);
      const h = e.target.dataset.h;
      const start = { ...r, px: e.clientX, py: e.clientY };
      const move = (ev) => {
        const dx = ev.clientX - start.px, dy = ev.clientY - start.py;
        if (!h) {
          r.x = Math.min(Math.max(0, start.x + dx), W - r.w);
          r.y = Math.min(Math.max(0, start.y + dy), H - r.h);
        } else {
          const left = h.includes('w'), top = h.includes('n');
          let w = Math.max(24, start.w + (left ? -dx : dx));
          let hh = Math.max(24, start.h + (top ? -dy : dy));
          if (ratio) hh = w / ratio;
          let x = left ? start.x + start.w - w : start.x;
          let y = top ? start.y + start.h - hh : start.y;
          if (x < 0 || y < 0 || x + w > W || y + hh > H) return;
          r = { x, y, w, h: hh };
        }
        paint();
      };
      const up = () => { rectEl.removeEventListener('pointermove', move); rectEl.removeEventListener('pointerup', up); };
      rectEl.addEventListener('pointermove', move);
      rectEl.addEventListener('pointerup', up);
    });

    overlay.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
      overlay.querySelectorAll('[data-r]').forEach((x) => x.classList.toggle('is-on', x === b));
      ratio = RATIOS[Number(b.dataset.r)][1];
      fit();
    }));

    const done = (value) => {
      URL.revokeObjectURL(url);
      overlay.remove();
      document.removeEventListener('keydown', onKey, true);
      resolve(value);
    };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); done(null); } };
    document.addEventListener('keydown', onKey, true);

    overlay.querySelector('[data-act=cancel]').addEventListener('click', () => done(null));
    // both buttons re-encode through a canvas: that drops EXIF (GPS position, camera) and any other
    // metadata, so even "use original" never uploads the visitor's location. If encoding fails the
    // upload is cancelled rather than falling back to the untouched file.
    const encode = (x, y, w, h) => {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w));
      c.height = Math.max(1, Math.round(h));
      c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
      c.toBlob((blob) => done(blob ? new File([blob], file.name, { type: file.type }) : null), file.type, 0.92);
    };
    overlay.querySelector('[data-act=skip]').addEventListener('click', () => encode(0, 0, img.naturalWidth, img.naturalHeight));
    overlay.querySelector('[data-act=ok]').addEventListener('click', () => {
      const sx = img.naturalWidth / W, sy = img.naturalHeight / H;
      encode(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
    });
  });
}
