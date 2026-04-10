let ioInstance = null;

export function registerSocket(io) {
  ioInstance = io;
}

export function broadcast(event, payload) {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  }
}
