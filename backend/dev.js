const { spawn } = require('node:child_process');
const path = require('node:path');

const port = process.env.PORT || 5000;
const healthUrl = `http://127.0.0.1:${port}/api/health`;

async function checkExistingBackend() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(healthUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Port ${port} merespons HTTP ${response.status}, bukan API Warkop.`);
    }

    const health = await response.json();
    if (health.status !== 'OK') {
      throw new Error(`Layanan di port ${port} bukan API Warkop.`);
    }

    return true;
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED') {
      return false;
    }
    if (error.name === 'AbortError') {
      throw new Error(`Health check API di port ${port} timeout.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function startDevelopmentBackend() {
  if (await checkExistingBackend()) {
    console.log(`✅ API Warkop sudah aktif di port ${port}; menggunakan server yang berjalan.`);
    return;
  }

  const nodemonPath = path.join(__dirname, 'node_modules', 'nodemon', 'bin', 'nodemon.js');
  const child = spawn(process.execPath, [nodemonPath, 'server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal));
  }

  child.on('error', (error) => {
    console.error('Gagal menjalankan nodemon:', error.message);
    process.exitCode = 1;
  });

  child.on('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}

startDevelopmentBackend().catch((error) => {
  console.error(`Gagal memulai backend development: ${error.message}`);
  process.exitCode = 1;
});
