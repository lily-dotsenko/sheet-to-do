import { Task } from './task.js';

export class TaskList {
  constructor(name, tasks = [], id = TaskList.generateId(), icon = 'bi-list-task') {
    this.id = id;
    this.name = name;
    this.tasks = tasks;
    this.icon = icon;
  }

  static generateId() {
    return crypto.randomUUID();
  }

  addTask(text) {
    const task = new Task(text);
    this.tasks.push(task);
  }

  removeTask(taskId) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  findTask(taskId) {
    return this.tasks.find((task) => task.id === taskId);
  }

  get doneCount() {
    return this.tasks.filter((task) => task.done).length;
  }

  static fromJSON(raw) {
    const tasks = (raw.tasks ?? []).map(Task.fromJSON);
    return new TaskList(raw.name ?? '', tasks, raw.id, raw.icon ?? 'bi-list-task');
  }
}
