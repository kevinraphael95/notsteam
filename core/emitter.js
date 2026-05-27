export class Emitter {

  constructor() {
    this.events = new Map();
  }

  on(event, callback) {

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event).push(callback);
  }

  emit(event, payload) {

    if (!this.events.has(event)) {
      return;
    }

    for (const callback of this.events.get(event)) {
      callback(payload);
    }
  }
}
