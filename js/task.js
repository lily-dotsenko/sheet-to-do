export class Task {
  constructor(text, done = false, id = Task.generateId(), photo = null) {
    this.id = id;
    this.text = text;
    this.done = done;
    this.photo = photo;
  }

  static generateId() {
    return crypto.randomUUID();
  }

  toggleDone() {
    this.done = !this.done;
  }

  static fromJSON(raw) {
    const task = new Task(raw.text ?? '', raw.done ?? false, raw.id, raw.photo ?? null);
    return task;
  }
}
