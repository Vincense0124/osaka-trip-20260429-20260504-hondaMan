// ── Tab Switching ──────────────────────────────────────────
(function initTabs() {
  const tabs    = document.querySelectorAll('.bottom-nav button');
  const panels  = document.querySelectorAll('.tab-panel');

  function switchTab(targetId) {
    tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === targetId));
    panels.forEach(panel => panel.classList.toggle('active', panel.id === 'tab-' + targetId));
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Activate first tab by default
  if (tabs.length) switchTab(tabs[0].dataset.tab);
})();

// ── Itinerary / Day Selector ───────────────────────────────
(function initItinerary() {
  const days    = window.DAYS_DATA || [];
  const dayBtns = document.querySelectorAll('.day-btn');
  const list    = document.getElementById('place-list');

  if (!list) return;

  function renderRouteItem(p, dotNum, isLast) {
    const desc = p.desc
      ? `<div class="place-desc">${escapeHtml(p.desc)}</div>`
      : '';
    const backupToggle = (p.backups && p.backups.length)
      ? `<details class="backup-toggle">
          <summary>備案 (${p.backups.length})</summary>
          ${p.backups.map(b => `
            <div class="backup-card">
              <span class="backup-icon">${b.category.icon}</span>
              <div class="backup-info">
                <div class="backup-name">${escapeHtml(b.name)}</div>
                ${b.desc ? `<div class="backup-desc">${escapeHtml(b.desc)}</div>` : ''}
              </div>
              ${mapLinkHtml(b.name, 'backup-map-link')}
            </div>`).join('')}
        </details>`
      : '';
    const line = isLast ? '' : '<div class="tl-line"></div>';
    return `
      <div class="timeline-item">
        <div class="tl-left">
          <div class="tl-dot">${dotNum}</div>
          ${line}
        </div>
        <div class="place-card ${p.category.key}${isLast ? ' last' : ''}">
          <div class="place-icon">${p.category.icon}</div>
          <div class="place-info">
            <div class="place-name">${escapeHtml(p.name)}</div>
            ${desc}
            ${backupToggle}
          </div>
          ${mapLinkHtml(p.mapDest || p.name, 'map-link')}
          <span class="cat-badge ${p.category.key}">${escapeHtml(p.category.label)}</span>
        </div>
      </div>`;
  }

  function renderGasChip(p) {
    return `
      <div class="tl-gas-row">
        <div class="tl-gas-column">
          <div class="gas-line-top"></div>
          <div class="gas-line-bottom"></div>
        </div>
        <div class="gas-chip">
          ${p.category.icon}
          <span class="gas-chip-name">${escapeHtml(p.name)}</span>
          <a class="gas-chip-map" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.name)}" target="_blank" rel="noopener" title="導航">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </a>
        </div>
      </div>`;
  }

  function renderOtherItem(p) {
    const desc = p.desc ? `<div class="other-desc">${escapeHtml(p.desc)}</div>` : '';
    return `
      <div class="other-item ${p.category.key}">
        <span class="other-icon">${p.category.icon}</span>
        <div class="other-body">
          <div class="other-name">${escapeHtml(p.name)}</div>
          ${desc}
        </div>
        ${mapLinkHtml(p.name, 'backup-map-link')}
      </div>`;
  }

  function renderDay(dayIndex) {
    const day = days[dayIndex];
    if (!day) { list.innerHTML = ''; return; }

    const routePlaces = day.places.filter(p => p.route);
    const otherPlaces = day.places.filter(p => !p.route);

    const mainCount = routePlaces.filter(p => p.category.key !== 'cat-gas' && p.category.key !== 'cat-stop').length;

    const segments = [];
    let chipBuffer = [];
    routePlaces.forEach(p => {
      const isChip = p.category.key === 'cat-gas' || p.category.key === 'cat-stop';
      if (isChip) {
        chipBuffer.push(p);
      } else {
        if (chipBuffer.length) { segments.push({ type: 'chips', items: chipBuffer }); chipBuffer = []; }
        segments.push({ type: 'place', item: p });
      }
    });
    if (chipBuffer.length) segments.push({ type: 'chips', items: chipBuffer });

    let dotNum = 0;
    const routeHtml = segments.map(seg => {
      if (seg.type === 'place') {
        dotNum++;
        return renderRouteItem(seg.item, dotNum, dotNum === mainCount);
      }
      const chips = seg.items;
      const visibleHtml = chips.slice(0, 3).map(p => renderGasChip(p)).join('');
      if (chips.length <= 3) return visibleHtml;
      const hiddenHtml = chips.slice(3).map(p => renderGasChip(p)).join('');
      return visibleHtml + `<details class="gas-more-toggle"><summary class="gas-more-btn">還有 ${chips.length - 3} 個加油站</summary>${hiddenHtml}</details>`;
    }).join('');

    const otherGroups = {};
    otherPlaces.forEach(p => {
      const k = p.category.key;
      if (!otherGroups[k]) otherGroups[k] = { cat: p.category, places: [] };
      otherGroups[k].places.push(p);
    });
    const otherHtml = otherPlaces.length ? `
      <div class="other-spots">
        <div class="other-spots-header">其他景點 &amp; 餐廳</div>
        <div class="other-spots-list">
          ${Object.values(otherGroups).map(g => `
            <div class="other-cat-group">
              <div class="other-cat-title">${g.cat.icon} ${escapeHtml(g.cat.label)}</div>
              ${g.places.map(p => renderOtherItem(p)).join('')}
            </div>`).join('')}
        </div>
      </div>` : '';

    list.innerHTML = routeHtml + otherHtml;
  }

  dayBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      dayBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      renderDay(i);
    });
  });

  // Activate first day
  if (dayBtns.length) {
    dayBtns[0].classList.add('active');
    renderDay(0);
  }
})();

// ── Checklist ─────────────────────────────────────────────
(function initChecklist() {
  const STORAGE_KEY = 'osaka-checklist-2026';
  const container   = document.getElementById('checklist-container');
  const fillBar     = document.getElementById('progress-fill');
  const progressTxt = document.getElementById('progress-text');
  const clearBtn    = document.getElementById('clear-checklist');

  if (!container) return;

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function updateProgress() {
    const items   = Array.from(container.querySelectorAll('input[type="checkbox"]'));
    const checked = items.filter(cb => cb.checked).length;
    const pct     = items.length ? Math.round(checked / items.length * 100) : 0;
    if (fillBar)     fillBar.style.width  = pct + '%';
    if (progressTxt) progressTxt.textContent = `${checked} / ${items.length} 已完成`;
  }

  function buildChecklist() {
    const categories = window.CHECKLIST_DATA || [];
    container.innerHTML = categories.map(cat => {
      const items = cat.items.map((item, i) => {
        const key     = cat.key + '_' + i;
        const checked = state[key] ? 'checked' : '';
        return `
          <div class="checklist-item${state[key] ? ' checked' : ''}" data-key="${key}">
            <input type="checkbox" id="chk-${key}" ${checked}>
            <label for="chk-${key}">${escapeHtml(item)}</label>
          </div>`;
      }).join('');
      return `
        <div class="checklist-category">
          <div class="cat-header">${cat.icon} ${escapeHtml(cat.name)}</div>
          ${items}
        </div>`;
    }).join('');

    container.addEventListener('change', e => {
      const checkbox = e.target;
      if (checkbox.type !== 'checkbox') return;
      const row = checkbox.closest('.checklist-item');
      const key = row.dataset.key;
      state[key] = checkbox.checked;
      row.classList.toggle('checked', checkbox.checked);
      saveState();
      updateProgress();
    });

    updateProgress();
  }

  buildChecklist();

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('確定要清除所有勾選狀態嗎？')) return;
      state = {};
      saveState();
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.checklist-item').classList.remove('checked');
      });
      updateProgress();
    });
  }
})();

// ── Utility ───────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mapLinkHtml(name, cls) {
  const size = cls === 'map-link' ? 16 : 14;
  const url  = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(name);
  return `<a class="${cls}" href="${url}" target="_blank" rel="noopener" title="Google Maps 導航">
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  </a>`;
}
