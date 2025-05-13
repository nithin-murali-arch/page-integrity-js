export function sendMessage(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data.type === 'response') {
        resolve(event.data.payload);
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      } else if (event.data.type === 'error') {
        reject(new Error(event.data.error));
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      }
    };
    navigator.serviceWorker.addEventListener('message', messageHandler);
    navigator.serviceWorker.controller?.postMessage(message);
  });
} 