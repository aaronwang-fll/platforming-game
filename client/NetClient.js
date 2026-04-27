export class NetClient {
  constructor() {
    this.ws = null;
    this.handlers = {};
    this.connected = false;
  }

  connect() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${proto}//${location.host}`);

    this.ws.onopen = () => {
      this.connected = true;
      this.emit('connected');
    };

    this.ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        this.emit(msg.type, msg);
      } catch {}
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.emit('disconnected');
    };
  }

  send(msg) {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(msg));
      return true;
    }
    console.warn('WebSocket not connected, message dropped:', msg.type);
    return false;
  }

  on(type, fn) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(fn);
  }

  emit(type, data) {
    const fns = this.handlers[type];
    if (fns) fns.forEach(fn => fn(data));
  }
}
