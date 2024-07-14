const { app, BrowserWindow, ipcMain, session, Tray, Menu, Notification } = require('electron');
const path = require('path');
const storage = require('node-persist');
const schedule = require('node-schedule');

let mainWindow;
let tray;
const VOCAB_URL = 'https://www.vocabulary.com';
let minimizeToTray = false;

async function initStorage() {
  await storage.init({
    dir: path.join(app.getPath('userData'), 'storage'),
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    ttl: false,
    expiredInterval: 2 * 60 * 1000,
    forgiveParseErrors: false
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  await mainWindow.loadFile('index.html');

  mainWindow.webContents.on('did-finish-load', async () => {
    loadVocabTrainer();
  });

  mainWindow.on('close', (event) => {
    if (minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

async function loadVocabTrainer() {
  try {
    const storedCookies = await storage.getItem('cookies');
    if (storedCookies && Array.isArray(storedCookies)) {
      for (const cookie of storedCookies) {
        if (!cookie.url && !cookie.domain) {
          continue;
        }
        await session.defaultSession.cookies.set(cookie);
      }
    }
    mainWindow.webContents.send('load-vocab-trainer', `${VOCAB_URL}/vocabtrainer/`);
  } catch (error) {
    console.error('Error setting cookies or loading vocabtrainer:', error);
  }
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Vocabulary Trainer', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Vocabulary Trainer');
  tray.setContextMenu(contextMenu);
}

let reminderJob;

function scheduleReminders(frequency) {
  if (reminderJob) {
    reminderJob.cancel();
  }
  reminderJob = schedule.scheduleJob(`*/${frequency} * * * *`, function() {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
    mainWindow.show();
    new Notification({
      title: 'Vocabulary Reminder',
      body: 'Time to practice your vocabulary!'
    }).show();
  });
}

app.whenReady().then(async () => {
  await initStorage();
  await createWindow();
  createTray();
  scheduleReminders(60); // Default to hourly reminders
});

app.on('window-all-closed', (e) => {
  if (minimizeToTray) {
    e.preventDefault();
  } else {
    app.quit();
  }
});

ipcMain.handle('open-settings', () => {
  mainWindow.webContents.send('show-settings');
});

ipcMain.handle('minimize-app', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-app', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-app', () => {
  if (minimizeToTray) {
    mainWindow.hide();
  } else {
    app.quit();
  }
});

ipcMain.handle('login', async () => {
  const loginWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow,
    modal: true
  });

  loginWindow.loadURL(`${VOCAB_URL}/login/`);

  loginWindow.webContents.on('will-navigate', async (event, url) => {
    if (url.startsWith(`${VOCAB_URL}/dictionary/`)) {
      const cookies = await session.defaultSession.cookies.get({ url: VOCAB_URL });
      await storage.setItem('cookies', cookies);
      loginWindow.close();
      loadVocabTrainer();
    }
  });
});

ipcMain.handle('logout', async () => {
  await session.defaultSession.clearStorageData();
  await storage.removeItem('cookies');
  loadVocabTrainer();
});

ipcMain.handle('set-reminder-frequency', async (event, minutes) => {
  scheduleReminders(minutes);
  await storage.setItem('reminderFrequency', minutes);
});

ipcMain.handle('set-minimize-to-tray', async (event, value) => {
  minimizeToTray = value;
  await storage.setItem('minimizeToTray', value);
});