export class BgPicker {
  /**
   * @param {{
   *   backgrounds: Array<{id: string, file: string, label: string}>,
   *   storage: import('./storage.js').StorageManager,
   *   pickerEl: HTMLElement,
   *   pickerBtnEl: HTMLButtonElement,
   * }} params
   */
  constructor({ backgrounds, storage, pickerEl, pickerBtnEl }) {
    this._backgrounds = Array.isArray(backgrounds) ? backgrounds : [];
    this._storage     = storage;
    this._pickerEl    = pickerEl;
    this._pickerBtnEl = pickerBtnEl;

    if (this._backgrounds.length === 0) {
      this._pickerBtnEl?.setAttribute('hidden', 'hidden');
      return;
    }

    this._buildPicker();
    this._bindEvents();
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  _buildPicker() {
    if (!this._pickerEl) return;

    this._backgrounds.forEach((bg) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'bg-picker__item';
      item.title = bg.label;
      item.dataset.bgId = bg.id;
      item.style.backgroundImage = `url("pictures/${bg.file}")`;
      item.addEventListener('click', () => {
        this._apply(bg.id);
        this._pickerEl.classList.remove('is-open');
      });
      this._pickerEl.appendChild(item);
    });
  }

  _bindEvents() {
    if (!this._pickerBtnEl || !this._pickerEl) return;

    this._pickerBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this._pickerEl.classList.toggle('is-open');
    });

    document.addEventListener('click', (e) => {
      if (!this._pickerEl.contains(e.target) && e.target !== this._pickerBtnEl) {
        this._pickerEl.classList.remove('is-open');
      }
    });
  }

  _apply(bgId) {
    const bg = this._backgrounds.find((b) => b.id === bgId) ?? this._backgrounds[0];
    document.body.style.backgroundImage = `url("pictures/${bg.file}")`;

    this._pickerEl?.querySelectorAll('.bg-picker__item').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.bgId === bg.id);
    });

    this._storage.saveBg(bg.id);
  }

  // ─── Public ──────────────────────────────────────────────────────────────

  loadSaved() {
    if (this._backgrounds.length === 0) return;
    const savedId = this._storage.loadBg(this._backgrounds[0].id);
    this._apply(savedId);
  }
}
