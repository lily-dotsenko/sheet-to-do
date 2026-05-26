export class Task {
  constructor(text, done = false, id = Task.generateId()) {
    this.id = id;
    this.text = text;
    this.done = done;
  }

  static generateId() {
    return crypto.randomUUID();
  }

  toggleDone() {
    this.done = !this.done;
  }

  static fromJSON(raw) {
    return new Task(raw.text ?? '', raw.done ?? false, raw.id);
  }
}
