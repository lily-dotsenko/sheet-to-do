import { TaskList } from './task-list.js';

export class StorageManager {
  constructor(storageKey, bgStorageKey) {
    this.storageKey = storageKey;
    this.bgStorageKey = bgStorageKey;
  }

  save(lists) {
    localStorage.setItem(this.storageKey, JSON.stringify(lists));
  }

  load() {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(TaskList.fromJSON);
    } catch {
      localStorage.removeItem(this.storageKey);
      console.warn(
        "Failed to read data from LocalStorage. Starting fresh.",
      );
      return [];
    }
  }

  saveBg(id) {
    localStorage.setItem(this.bgStorageKey, id);
  }

  loadBg(fallbackId) {
    return localStorage.getItem(this.bgStorageKey) ?? fallbackId;
  }
}
