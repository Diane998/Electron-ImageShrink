const path = require('path'),
  os = require('os'),
  fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const imagemin = require('imagemin'),
  imageminMozjpeg = require('imagemin-mozjpeg'),
  imageminPngquant = require('imagemin-pngquant'),
  slash = require('slash'),
  log = require('electron-log');

// Set env
process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !== 'production' ? true : false,
  isMac = process.platform === 'darwin';

let mainWindow, aboutWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'ImageShrink',
    width: 500,
    height: 600,
    backgroundColor: 'white',
    icon: './assets/icons/Icon_256x256.png',
    resizable: isDev ? true : false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('./app/index.html');

  isDev && mainWindow.webContents.openDevTools();
  mainWindow.on('close', () => {
    mainWindow = null;
    aboutWindow = null;
  });
}

function creatAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: 'About ImageShrink',
    width: 300,
    height: 300,
    backgroundColor: 'white',
    icon: './assets/icons/Icon_256x256.png',
    resizable: false
  });

  aboutWindow.loadFile('./app/about.html');
  isDev && mainWindow.webContents.openDevTools();
}

app.on('ready', () => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(mainMenu);

  const dir = path.join(os.homedir(), 'imageshrink');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  mainWindow.on('ready', () => (mainWindow = null));
});

const menuTemplate = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: creatAboutWindow
            }
          ]
        }
      ]
    : []),
  {
    role: 'filemenu'
  },
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' }
          ]
        }
      ]
    : []),
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            {
              label: 'About',
              click: creatAboutWindow
            }
          ]
        }
      ]
    : [])
];

app.on('window-all-closed', () => {
  if (isMac) {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

async function shrinkImage({ imgPath, quality, imgDest }) {
  try {
    const pngQuality = quality / 100;
    const files = await imagemin([slash(imgPath)], {
      destination: imgDest,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngQuality, pngQuality]
        })
      ]
    });
    console.log(files);
    // log.info(files);

    shell.showItemInFolder(imgDest);
    mainWindow.webContents.send('image:done');
  } catch (err) {
    console.log('error', err);
    // log.error(err);
  }
}

ipcMain.on('image:minimize', (e, options) => {
  options.imgDest = path.join(os.homedir(), 'imageshrink');
  shrinkImage(options);
});
