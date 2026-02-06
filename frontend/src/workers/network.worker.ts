const PING_INTERVAL = 3000;
const PING_URL = 'https://dns.google'; 

async function checkConnection() {
  try {
    await fetch(PING_URL, { 
      method: 'HEAD', 
      mode: 'no-cors',
      cache: 'no-store',
    });

    console.log('[Worker] Ping success (Online)');
    postMessage('online');
  } catch (error) {
    console.log('[Worker] Ping failed (Offline)', error);
    postMessage('offline');
  }
}

console.log('[Worker] Starting network polling...');
setInterval(checkConnection, PING_INTERVAL);
checkConnection();
