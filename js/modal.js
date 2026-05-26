export class Modal {
  /**
   * @param {{
   *   icons: Array<{icon: string, label: string}>,
   *   overlayEl: HTMLElement,
   *   titleEl: HTMLElement,
   *   inputEl: HTMLInputElement,
   *   confirmBtn: HTMLButtonElement,
   *   cancelBtn: HTMLButtonElement,
   *   iconsGridEl: HTMLElement,
   * }} params
   */
  constructor({ icons, overlayEl, titleEl, inputEl, confirmBtn, cancelBtn, iconsGridEl }) {
    this._icons = Array.isArray(icons) && icons.length > 0
      ? icons
      : [{ icon: 'bi-list-task', label: 'General' }];

    this._overlayEl   = overlayEl;
    this._titleEl     = titleEl;
    this._inputEl     = inputEl;
    this._confirmBtn  = confirmBtn;
    this._cancelBtn   = cancelBtn;
    this._iconsGridEl = iconsGridEl;

    this._callback    = null;
    this._selectedIcon = this._icons[0].icon;

    this._buildIconPicker();
    this._bindEvents();
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  _buildIconPicker() {
    if (!this._iconsGridEl) return;

    this._icons.forEach(({ icon, label }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-option';
      btn.title = label;
      btn.dataset.icon = icon;
      btn.innerHTML = `<i class="bi ${icon}"></i><span>${label}</span>`;
      btn.addEventListener('click', () => this._selectIcon(icon));
      this._iconsGridEl.appendChild(btn);
    });

    this._selectIcon(this._icons[0].icon);
  }

  _selectIcon(icon) {
    this._selectedIcon = icon;
    this._iconsGridEl.querySelectorAll('.icon-option').forEach((btn) => {
      btn.classList.toggle('icon-option--active', btn.dataset.icon === icon);
    });
  }

  _bindEvents() {
    this._overlayEl.addEventListener('click', (e) => {
      if (e.target === this._overlayEl) this.close();
    });

    this._confirmBtn.addEventListener('click', () => this._confirm());
    this._cancelBtn.addEventListener('click', () => this.close());

    this._inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._confirm();
      if (e.key === 'Escape') this.close();
    });
  }

  _confirm() {
    const value = this._inputEl.value.trim();
    if (!value) {
      alert('Just name your sheet finally!');
      this._inputEl.focus();
      return;
    }
    if (this._callback) this._callback(value, this._selectedIcon);
    this.close();
  }

  // ─── Public ──────────────────────────────────────────────────────────────

  open(title, placeholder, callback) {
    this._titleEl.textContent = title;
    this._inputEl.placeholder = placeholder;
    this._inputEl.value = '';
    this._callback = callback;
    this._selectIcon(this._icons[0].icon);
    this._overlayEl.classList.add('modal-overlay--visible');
    setTimeout(() => this._inputEl.focus(), 50);
  }

  close() {
    this._overlayEl.classList.remove('modal-overlay--visible');
    this._callback = null;
  }
}
