import { TaskList } from './task-list.js';
import { Modal }    from './modal.js';
import { BgPicker } from './bg-picker.js';
import { Renderer } from './renderer.js';

export class App {
  constructor({ storage, icons, backgrounds }) {
    this.lists   = [];
    this.storage = storage;

    this._modal = new Modal({
      icons,
      overlayEl:   document.getElementById('modalOverlay'),
      titleEl:     document.getElementById('modalTitle'),
      inputEl:     document.getElementById('modalInput'),
      confirmBtn:  document.getElementById('modalConfirmBtn'),
      cancelBtn:   document.getElementById('modalCancelBtn'),
      iconsGridEl: document.getElementById('modalIconsGrid'),
    });

    this._bgPicker = new BgPicker({
      backgrounds,
      storage,
      pickerEl:    document.getElementById('bgPicker'),
      pickerBtnEl: document.getElementById('bgPickerBtn'),
    });

    this._renderer = new Renderer({
      container:    document.getElementById('listsContainer'),
      onAddTask:    (listId, text) => this._handleAddTask(listId, text),
      onToggleTask: (listId, taskId) => this._handleToggleTask(listId, taskId),
      onDeleteTask: (listId, taskId) => this._handleDeleteTask(listId, taskId),
      onDeleteList: (listId) => this._handleDeleteList(listId),
      onAddPhoto:   (listId, taskId, file) => this._handleAddPhoto(listId, taskId, file),
      onRemovePhoto:(listId, taskId) => this._handleRemovePhoto(listId, taskId),
      onShareList:  (listId) => this._handleShareList(listId),
    });

    this._createListBtn = document.getElementById('createListBtn');
    this._toast = this._createToast();
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  init() {
    this._bgPicker.loadSaved();
    this.lists = this.storage.load();
    this._checkSharedList();
    this._renderer.render(this.lists);
    this._bindEvents();
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  _bindEvents() {
    this._createListBtn.addEventListener('click', () => {
      this._modal.open('New sheet', 'Sheet name...', (name, icon) => {
        this._handleCreateList(name, icon);
      });
    });
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  _handleCreateList(name, icon) {
    const list = new TaskList(name, [], undefined, icon);
    this.lists.push(list);
    this._saveAndRender();
  }

  _handleDeleteList(listId) {
    const list = this._findList(listId);
    if (!list) return;
    if (!confirm(`Delete "${list.name}" and all its tasks?`)) return;
    this.lists = this.lists.filter((l) => l.id !== listId);
    this._saveAndRender();
  }

  _handleAddTask(listId, text) {
    const list = this._findList(listId);
    if (!list) return;
    list.addTask(text);
    this._saveAndRender();
  }

  _handleToggleTask(listId, taskId) {
    const list = this._findList(listId);
    if (!list) return;
    const task = list.findTask(taskId);
    if (!task) return;
    task.toggleDone();
    this._saveAndRender();
  }

  _handleDeleteTask(listId, taskId) {
    const list = this._findList(listId);
    if (!list) return;
    list.removeTask(taskId);
    this._saveAndRender();
  }

  async _handleAddPhoto(listId, taskId, file) {
    const list = this._findList(listId);
    if (!list) return;
    const task = list.findTask(taskId);
    if (!task) return;
    try {
      task.photo = await this._compressImage(file);
      this._saveAndRender();
    } catch {
      this._showToast('Failed to load image');
    }
  }

  _handleRemovePhoto(listId, taskId) {
    const list = this._findList(listId);
    if (!list) return;
    const task = list.findTask(taskId);
    if (!task) return;
    task.photo = null;
    this._saveAndRender();
  }

  async _handleShareList(listId) {
    const list = this._findList(listId);
    if (!list) return;

    // Recompress each photo to 100 px / q=0.2 (~1–3 KB each as base64)
    const tasksWithPhotos = await Promise.all(
      list.tasks.map(async (t) => ({
        id:    t.id,
        text:  t.text,
        done:  t.done,
        photo: t.photo ? await this._compressForShare(t.photo) : null,
      }))
    );

    const buildUrl = (tasks) => {
      const data    = { id: list.id, name: list.name, icon: list.icon, tasks };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      return `${location.origin}${location.pathname}#share=${encoded}`;
    };

    // Hash fragment is never sent to the server — no server-side length limit.
    // Most messengers handle URLs up to ~4 000 chars; strip photos if longer.
    let shareUrl       = buildUrl(tasksWithPhotos);
    let photosExcluded = false;

    if (shareUrl.length > 4000) {
      const tasksNoPhotos = list.tasks.map((t) => ({
        id: t.id, text: t.text, done: t.done, photo: null,
      }));
      shareUrl       = buildUrl(tasksNoPhotos);
      photosExcluded = true;
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([shareUrl], { type: 'text/plain' }),
          'text/html':  new Blob(
            [`<a href="${shareUrl}">check up my list 📋</a>`],
            { type: 'text/html' }
          ),
        }),
      ]);
    } catch {
      // Fallback for browsers that don't support ClipboardItem
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        this._showToast('Could not copy link');
        return;
      }
    }

    this._showToast(photosExcluded ? 'Link copied! (no photos) 🔗' : 'Link copied! 🔗');
  }

  // ─── Share import ─────────────────────────────────────────────────────────

  _checkSharedList() {
    // Support both #share= (current) and ?share= (legacy) for old links
    let encoded = null;
    if (location.hash.startsWith('#share=')) {
      encoded = location.hash.slice(7);
    } else {
      encoded = new URLSearchParams(location.search).get('share');
    }
    if (!encoded) return;

    try {
      const raw = JSON.parse(decodeURIComponent(escape(atob(encoded))));
      if (!raw.name || !Array.isArray(raw.tasks)) return;

      if (!confirm(`Import list "${raw.name}"?`)) return;

      const imported = TaskList.fromJSON({ ...raw, id: TaskList.generateId() });
      this.lists.push(imported);
      this.storage.save(this.lists);
    } catch {
      // Malformed share data — silently ignore
    } finally {
      history.replaceState(null, '', location.pathname);
    }
  }

  // ─── Image compression ────────────────────────────────────────────────────

  // Recompress an already-stored base64 data-URL to 100 px / JPEG q=0.2
  // for the share URL — keeps each photo to roughly 1–3 KB as base64.
  _compressForShare(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 100;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) {
            height = Math.round((height * MAX) / width);
            width  = MAX;
          } else {
            width  = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.2));
      };
      // On error exclude the photo rather than crash the share flow
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  _compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 800;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) {
              height = Math.round((height * MAX) / width);
              width = MAX;
            } else {
              width = Math.round((width * MAX) / height);
              height = MAX;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width  = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  _createToast() {
    const el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
    return el;
  }

  _showToast(message) {
    this._toast.textContent = message;
    this._toast.classList.add('toast--visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this._toast.classList.remove('toast--visible');
    }, 2200);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _findList(listId) {
    return this.lists.find((l) => l.id === listId);
  }

  _saveAndRender() {
    this.storage.save(this.lists);
    this._renderer.render(this.lists);
  }
}
