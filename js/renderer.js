export class Renderer {
  /**
   * @param {{
   *   container:    HTMLElement,
   *   onAddTask:    (listId: string, text: string) => void,
   *   onToggleTask: (listId: string, taskId: string) => void,
   *   onDeleteTask: (listId: string, taskId: string) => void,
   *   onDeleteList: (listId: string) => void,
   *   onAddPhoto:   (listId: string, taskId: string, file: File) => void,
   *   onRemovePhoto:(listId: string, taskId: string) => void,
   *   onShareList:  (listId: string) => void,
   * }} params
   */
  constructor({ container, onAddTask, onToggleTask, onDeleteTask, onDeleteList, onAddPhoto, onRemovePhoto, onShareList }) {
    this._container     = container;
    this._onAddTask     = onAddTask;
    this._onToggleTask  = onToggleTask;
    this._onDeleteTask  = onDeleteTask;
    this._onDeleteList  = onDeleteList;
    this._onAddPhoto    = onAddPhoto;
    this._onRemovePhoto = onRemovePhoto;
    this._onShareList   = onShareList;
    this._lightbox      = this._createLightbox();
  }

  // ─── Public ───────────────────────────────────────────────────────────────

  render(lists) {
    if (lists.length === 0) {
      this._container.innerHTML =
        '<p class="empty-state">No sheets yet. Create your first one! 📋</p>';
      return;
    }
    this._container.innerHTML = '';
    lists.forEach((list) => {
      this._container.appendChild(this._createListCard(list));
    });
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  _createListCard(list) {
    const card = document.createElement('div');
    card.className = 'task-list-card';
    card.dataset.listId = list.id;

    card.appendChild(this._createCardHeader(list));

    const meta = document.createElement('p');
    meta.className = 'task-list-card__meta';
    meta.textContent = this._buildMetaText(list);

    const taskItems = document.createElement('ul');
    taskItems.className = 'task-items';
    list.tasks.forEach((task) => taskItems.appendChild(this._createTaskItem(list.id, task)));

    card.appendChild(meta);
    card.appendChild(taskItems);
    card.appendChild(this._createAddTaskForm(list.id));

    return card;
  }

  _createCardHeader(list) {
    const header = document.createElement('div');
    header.className = 'task-list-card__header';

    const title = document.createElement('h2');
    title.className = 'task-list-card__title';
    const iconEl = document.createElement('i');
    iconEl.className = `bi ${list.icon} task-list-card__icon`;
    title.appendChild(iconEl);
    title.appendChild(document.createTextNode(list.name));

    const actions = document.createElement('div');
    actions.className = 'task-list-card__actions';

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'btn btn--icon';
    shareBtn.title = 'Copy share link';
    shareBtn.innerHTML = '<i class="bi bi-share"></i>';
    shareBtn.addEventListener('click', () => this._onShareList(list.id));

    const deleteListBtn = document.createElement('button');
    deleteListBtn.type = 'button';
    deleteListBtn.className = 'btn btn--icon';
    deleteListBtn.title = 'Delete list';
    deleteListBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteListBtn.addEventListener('click', () => this._onDeleteList(list.id));

    actions.appendChild(shareBtn);
    actions.appendChild(deleteListBtn);

    header.appendChild(title);
    header.appendChild(actions);

    return header;
  }

  _buildMetaText(list) {
    const total = list.tasks.length;
    if (total === 0) return 'No tasks';
    return `Done: ${list.doneCount} / ${total}`;
  }

  _createTaskItem(listId, task) {
    const item = document.createElement('li');
    item.className = `task-item${task.done ? ' task-item--done' : ''}`;
    item.dataset.taskId = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-item__checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => this._onToggleTask(listId, task.id));

    const text = document.createElement('span');
    text.className = 'task-item__text';
    text.textContent = task.text;

    // ── Photo area ───────────────────────────────────────────────────────────
    const photoArea = document.createElement('div');
    photoArea.className = 'task-item__photo-area';

    if (task.photo) {
      const wrap = document.createElement('div');
      wrap.className = 'task-item__photo-wrap';

      const thumb = document.createElement('img');
      thumb.className = 'task-item__photo-thumb';
      thumb.src = task.photo;
      thumb.alt = 'Task photo';
      thumb.title = 'Click to view full size';
      thumb.addEventListener('click', () => this._openLightbox(task.photo));

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'task-item__photo-remove';
      removeBtn.title = 'Remove photo';
      removeBtn.innerHTML = '<i class="bi bi-x"></i>';
      removeBtn.addEventListener('click', () => this._onRemovePhoto(listId, task.id));

      wrap.appendChild(thumb);
      wrap.appendChild(removeBtn);
      photoArea.appendChild(wrap);
    } else {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.className = 'task-item__file-input';
      fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) this._onAddPhoto(listId, task.id, fileInput.files[0]);
      });

      const cameraBtn = document.createElement('button');
      cameraBtn.type = 'button';
      cameraBtn.className = 'btn btn--icon task-item__camera-btn';
      cameraBtn.title = 'Attach photo';
      cameraBtn.innerHTML = '<i class="bi bi-camera"></i>';
      cameraBtn.addEventListener('click', () => fileInput.click());

      photoArea.appendChild(fileInput);
      photoArea.appendChild(cameraBtn);
    }
    // ── End photo area ───────────────────────────────────────────────────────

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--danger';
    deleteBtn.title = 'Delete task';
    deleteBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    deleteBtn.addEventListener('click', () => this._onDeleteTask(listId, task.id));

    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(photoArea);
    item.appendChild(deleteBtn);

    return item;
  }

  _createAddTaskForm(listId) {
    const form = document.createElement('form');
    form.className = 'add-task-form';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'add-task-form__input';
    input.placeholder = 'New task...';
    input.maxLength = 120;

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn--primary';
    submitBtn.textContent = '+';
    submitBtn.title = 'Add task';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      this._onAddTask(listId, text);
      const card = this._container.querySelector(`[data-list-id="${listId}"]`);
      card?.querySelector('.add-task-form__input')?.focus();
    });

    form.appendChild(input);
    form.appendChild(submitBtn);

    return form;
  }

  // ─── Lightbox ─────────────────────────────────────────────────────────────

  _createLightbox() {
    const overlay = document.createElement('div');
    overlay.className = 'photo-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Photo viewer');

    const img = document.createElement('img');
    img.className = 'photo-lightbox__img';
    img.alt = 'Full size photo';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'photo-lightbox__close';
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => this._closeLightbox());

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('photo-lightbox--visible')) {
        this._closeLightbox();
      }
    });

    return { overlay, img };
  }

  _openLightbox(src) {
    this._lightbox.img.src = src;
    this._lightbox.overlay.classList.add('photo-lightbox--visible');
    document.body.style.overflow = 'hidden';
  }

  _closeLightbox() {
    this._lightbox.overlay.classList.remove('photo-lightbox--visible');
    this._lightbox.img.src = '';
    document.body.style.overflow = '';
  }
}
