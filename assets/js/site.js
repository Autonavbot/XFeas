// Project-page template behaviour: nav menu, hero video, highlights carousel,
// tabs, film dialog, FAQ expand-all, BibTeX copy, scroll reveal.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const PAUSE = 'M4 2.5h3.4v13H4zM10.6 2.5H14v13h-3.4z';
  const PLAY = 'M5 2.8v12.4L15 9z';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Explore menu
  const exBtn = $('#exploreBtn'), exMenu = $('#exploreMenu');
  const setMenu = open => { exMenu.hidden = !open; exBtn.setAttribute('aria-expanded', open); };
  exBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(exMenu.hidden); });
  exMenu.addEventListener('click', () => setMenu(false));
  document.addEventListener('click', e => { if (!exMenu.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // ---- Hero video: phone source, play/pause button
  const hv = $('#heroV'), hb = $('#heroBtn');
  if (hv) {
    if (matchMedia('(max-width:734px)').matches && hv.dataset.srcSm) hv.src = hv.dataset.srcSm;
    if (reduced) hv.removeAttribute('autoplay'), hv.pause();
    const sync = () => {
      hb.querySelector('path').setAttribute('d', hv.paused ? PLAY : PAUSE);
      hb.setAttribute('aria-label', hv.paused ? 'Play the video' : 'Pause the video');
    };
    hb.addEventListener('click', () => (hv.paused ? hv.play() : hv.pause()));
    hv.addEventListener('play', sync); hv.addEventListener('pause', sync); sync();
  }

  // ---- Highlights carousel: auto-advance with progress dots
  const track = $('#hlTrack'), pager = $('#hlPager'), playBtn = $('#hlPlay');
  if (track) {
    const cards = $$('.hcard', track);
    let idx = 0, t0 = 0, running = !reduced, raf, inView = false;
    const dots = cards.map((c, i) => {
      const d = document.createElement('button');
      d.className = 'dot'; d.type = 'button'; d.innerHTML = '<i></i>';
      d.setAttribute('aria-label', `Highlight ${i + 1}`);
      d.addEventListener('click', () => go(i, true));
      pager.appendChild(d); return d;
    });
    const scrollTo = i => track.scrollTo({ left: cards[i].offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: reduced ? 'auto' : 'smooth' });
    function go(i, user) {
      idx = (i + cards.length) % cards.length; t0 = performance.now();
      dots.forEach((d, j) => { d.classList.toggle('on', j === idx); d.querySelector('i').style.setProperty('--p', 0); });
      cards.forEach((c, j) => { const v = $('video', c); if (!v) return; j === idx && inView ? v.play().catch(() => {}) : v.pause(); });
      if (user !== undefined) scrollTo(idx);
    }
    function tick(now) {
      if (running && inView) {
        const dwell = (parseFloat(cards[idx].dataset.dwell) || 6) * 1000;
        const p = Math.min(1, (now - t0) / dwell);
        dots[idx].querySelector('i').style.setProperty('--p', p);
        if (p >= 1) go(idx + 1, false);
      } else t0 = now - (parseFloat(dots[idx].querySelector('i').style.getPropertyValue('--p')) || 0) * (parseFloat(cards[idx].dataset.dwell) || 6) * 1000;
      raf = requestAnimationFrame(tick);
    }
    const setRun = r => { running = r; $('#hlPlayIcon').setAttribute('d', r ? PAUSE : PLAY); playBtn.setAttribute('aria-label', r ? 'Pause highlights' : 'Play highlights'); };
    playBtn.addEventListener('click', () => setRun(!running));
    // manual swipe picks up the nearest card
    let st; track.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => {
      const x = track.scrollLeft, near = cards.reduce((b, c, i) => Math.abs(c.offsetLeft - x - parseFloat(getComputedStyle(track).paddingLeft)) < Math.abs(cards[b].offsetLeft - x - parseFloat(getComputedStyle(track).paddingLeft)) ? i : b, 0);
      if (near !== idx) go(near);
    }, 120); }, { passive: true });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; go(idx); }, { threshold: .35 }).observe(track);
    setRun(running); go(0); raf = requestAnimationFrame(tick);
  }

  // ---- Closer-look tabs: both clips seek to the tab's start time and play in sync
  const tabs = $('#lookTabs');
  if (tabs) {
    const vids = $$('.look-v'), cap = $('#lookCap');
    const show = b => {
      $$('button', tabs).forEach(x => x.setAttribute('aria-pressed', x === b));
      cap.innerHTML = b.dataset.cap;
      vids.forEach(v => { v.currentTime = parseFloat(b.dataset.t) || 0; v.play().catch(() => {}); });
    };
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b); });
    new IntersectionObserver(([e]) => vids.forEach(v => e.isIntersecting && !reduced ? v.play().catch(() => {}) : v.pause()), { threshold: .3 }).observe($('.pair'));
    vids[0].addEventListener('loadedmetadata', () => show($('[aria-pressed=true]', tabs)), { once: true });
  }

  // ---- Film dialog
  const film = $('#film'), fv = $('video', film);
  $$('[data-film]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); fv.src = a.getAttribute('href'); film.showModal(); fv.play().catch(() => {});
  }));
  const closeFilm = () => { fv.pause(); film.close(); };
  $('.film-x', film).addEventListener('click', closeFilm);
  film.addEventListener('close', () => fv.pause());

  // ---- FAQ expand all
  const all = $('#faqAll');
  if (all) all.addEventListener('click', () => {
    const open = all.getAttribute('aria-expanded') !== 'true';
    $$('.faq details').forEach(d => (d.open = open));
    all.setAttribute('aria-expanded', open); all.textContent = open ? 'Collapse all' : 'Expand all';
  });

  // ---- BibTeX copy
  const bc = $('#bibCopy');
  if (bc) bc.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#bibText').textContent); bc.textContent = 'Copied'; }
    catch { bc.textContent = 'Select & copy'; }
    setTimeout(() => (bc.textContent = 'Copy'), 1800);
  });

  // ---- Scroll reveal
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));
})();
