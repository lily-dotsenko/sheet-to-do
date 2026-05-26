import { TaskList } from './task-list.js';

export class App {
  constructor({ storage, icons, backgrounds }) {
    this.lists = [];
    this.storage = storage;
    this.icons = Array.isArray(icons) && icons.length > 0
      ? icons
      : [{ icon: 'bi-list-task', label: 'General' }];

    // --- DOM ---
    this.listsContainer = document.getElementById("listsContainer");
    this.createListBtn = document.getElementById("createListBtn");

    // --- modal ---
    this.modalOverlay = document.getElementById("modalOverlay");
    this.modalTitle = document.getElementById("modalTitle");
    this.modalInput = document.getElementById("modalInput");
    this.modalConfirmBtn = document.getElementById("modalConfirmBtn");
    this.modalCancelBtn = document.getElementById("modalCancelBtn");

    this._modalCallback = null;

    this.modalIconsGrid  = document.getElementById('modalIconsGrid');
    this._buildIconPicker();

    // --- background ---
    this._backgrounds = Array.isArray(backgrounds) ? backgrounds : [];
    this.bgPickerBtn  = document.getElementById('bgPickerBtn');
    this.bgPicker     = document.getElementById('bgPicker');
    this._buildBgPicker();

    if (this._backgrounds.length === 0) {
      this.bgPickerBtn?.setAttribute('hidden', 'hidden');
    }
  }

  _buildIconPicker() {
    if (!this.modalIconsGrid) return;

    this.icons.forEach(({ icon, label }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-option';
      btn.title = label;
      btn.dataset.icon = icon;
      btn.innerHTML = `<i class="bi ${icon}"></i><span>${label}</span>`;
      btn.addEventListener('click', () => this._selectIcon(icon));
      this.modalIconsGrid.appendChild(btn);
    });
    this._selectIcon(this.icons[0].icon);
  }

  _selectIcon(icon) {
    this._selectedIcon = icon;
    this.modalIconsGrid.querySelectorAll('.icon-option').forEach((btn) => {
      btn.classList.toggle('icon-option--active', btn.dataset.icon === icon);
    });
  }

  _buildBgPicker() {
    if (!this.bgPicker || this._backgrounds.length === 0) return;

    this._backgrounds.forEach((bg) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'bg-picker__item';
      item.title = bg.label;
      item.dataset.bgId = bg.id;
      item.style.backgroundImage = `url("pictures/${bg.file}")`;
      item.addEventListener('click', () => {
        this._applyBackground(bg.id);
        this.bgPicker.classList.remove('is-open');
      });
      this.bgPicker.appendChild(item);
    });
  }

  _applyBackground(bgId) {
    const bg = this._backgrounds.find((b) => b.id === bgId) ?? this._backgrounds[0];
    document.body.style.backgroundImage = `url("pictures/${bg.file}")`;
    this.bgPicker.querySelectorAll('.bg-picker__item').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.bgId === bg.id);
    });

    this.storage.saveBg(bg.id);
  }

  _loadSavedBackground() {
    if (this._backgrounds.length === 0) return;

    const savedId = this.storage.loadBg(this._backgrounds[0].id);
    this._applyBackground(savedId);
  }

  init() {
    this._loadSavedBackground();
    this.lists = this.storage.load();
    this.render();
    this.bindGlobalEvents();
  }

  render() {
    if (this.lists.length === 0) {
      this.listsContainer.innerHTML =
        '<p class="empty-state">No sheets yet. Create your first one! 📋</p>';
      return;
    }

    this.listsContainer.innerHTML = "";
    this.lists.forEach((list) => {
      const card = this.createListCard(list);
      this.listsContainer.appendChild(card);
    });
  }

  createListCard(list) {
    const card = document.createElement("div");
    card.className = "task-list-card";
    card.dataset.listId = list.id;

    const header = document.createElement("div");
    header.className = "task-list-card__header";

    const title = document.createElement("h2");
    title.className = "task-list-card__title";
    const iconEl = document.createElement("i");
    iconEl.className = `bi ${list.icon} task-list-card__icon`;
    title.appendChild(iconEl);
    title.appendChild(document.createTextNode(list.name));

    const deleteListBtn = document.createElement("button");
    deleteListBtn.type = "button";
    deleteListBtn.className = "btn btn--icon";
    deleteListBtn.title = "Delete list";
    deleteListBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteListBtn.addEventListener("click", () => {
      this.handleDeleteList(list.id);
    });

    header.appendChild(title);
    header.appendChild(deleteListBtn);

    const meta = document.createElement("p");
    meta.className = "task-list-card__meta";
    meta.textContent = this.buildMetaText(list);

    const taskItems = document.createElement("ul");
    taskItems.className = "task-items";

    list.tasks.forEach((task) => {
      const item = this.createTaskItem(list.id, task);
      taskItems.appendChild(item);
    });

    const form = this.createAddTaskForm(list.id);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(taskItems);
    card.appendChild(form);

    return card;
  }

  buildMetaText(list) {
    const total = list.tasks.length;
    if (total === 0) return "No tasks";
    return `Done: ${list.doneCount} / ${total}`;
  }

  createTaskItem(listId, task) {
    const item = document.createElement("li");
    item.className = `task-item${task.done ? " task-item--done" : ""}`;
    item.dataset.taskId = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-item__checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      this.handleToggleTask(listId, task.id);
    });

    const text = document.createElement("span");
    text.className = "task-item__text";
    text.textContent = task.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn--danger";
    deleteBtn.title = "Delete task";
    deleteBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    deleteBtn.addEventListener("click", () => {
      this.handleDeleteTask(listId, task.id);
    });

    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(deleteBtn);

    return item;
  }

  createAddTaskForm(listId) {
    const form = document.createElement("form");
    form.className = "add-task-form";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "add-task-form__input";
    input.placeholder = "New task...";
    input.maxLength = 120;

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "btn btn--primary";
    submitBtn.textContent = "+";
    submitBtn.title = "Add task";

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      this.handleAddTask(listId, text);
      const card = this.listsContainer.querySelector(`[data-list-id="${listId}"]`);
      card?.querySelector(".add-task-form__input")?.focus();
    });

    form.appendChild(input);
    form.appendChild(submitBtn);

    return form;
  }

  bindGlobalEvents() {
    // --- new list ---
    this.createListBtn.addEventListener("click", () => {
      this.openModal("New sheet", "Sheet name...", (name, icon) => {
        this.handleCreateList(name, icon);
      });
    });

    // --- modal ---
    this.modalOverlay.addEventListener("click", (event) => {
      if (event.target === this.modalOverlay) this.closeModal();
    });

    this.modalConfirmBtn.addEventListener("click", () => this.confirmModal());
    this.modalCancelBtn.addEventListener("click", () => this.closeModal());

    this.modalInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.confirmModal();
      if (event.key === "Escape") this.closeModal();
    });

    // --- background picker ---
    if (this.bgPickerBtn && this.bgPicker && this._backgrounds.length > 0) {
      this.bgPickerBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        this.bgPicker.classList.toggle('is-open');
      });

      document.addEventListener('click', (event) => {
        if (!this.bgPicker.contains(event.target) && event.target !== this.bgPickerBtn) {
          this.bgPicker.classList.remove('is-open');
        }
      });
    }
  }

  handleCreateList(name, icon) {
    const list = new TaskList(name, [], undefined, icon);
    this.lists.push(list);
    this.saveAndRender();
  }

  handleDeleteList(listId) {
    const list = this.findList(listId);
    if (!list) return;
    if (!confirm(`Delete "${list.name}" and all its tasks?`)) return;
    this.lists = this.lists.filter((l) => l.id !== listId);
    this.saveAndRender();
  }

  handleAddTask(listId, text) {
    const list = this.findList(listId);
    if (!list) return;
    list.addTask(text);
    this.saveAndRender();
  }

  handleToggleTask(listId, taskId) {
    const list = this.findList(listId);
    if (!list) return;
    const task = list.findTask(taskId);
    if (!task) return;
    task.toggleDone();
    this.saveAndRender();
  }

  handleDeleteTask(listId, taskId) {
    const list = this.findList(listId);
    if (!list) return;
    list.removeTask(taskId);
    this.saveAndRender();
  }

  openModal(title, placeholder, callback) {
    this.modalTitle.textContent = title;
    this.modalInput.placeholder = placeholder;
    this.modalInput.value = "";
    this._modalCallback = callback;
    this._selectIcon(this.icons[0].icon);
    this.modalOverlay.classList.add("modal-overlay--visible");
    setTimeout(() => this.modalInput.focus(), 50);
  }

  closeModal() {
    this.modalOverlay.classList.remove("modal-overlay--visible");
    this._modalCallback = null;
  }

  confirmModal() {
    const value = this.modalInput.value.trim();
    if (!value) {
      alert("Just name your sheet finally!");
      this.modalInput.focus();
      return;
    }
    if (this._modalCallback) this._modalCallback(value, this._selectedIcon);
    this.closeModal();
  }

  findList(listId) {
    return this.lists.find((list) => list.id === listId);
  }

  saveAndRender() {
    this.storage.save(this.lists);
    this.render();
  }
}
