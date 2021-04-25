const path = require('path'),
  os = require('os'),
  { ipcRenderer } = require('electron');

const outputPath = document.querySelector('#output-path'),
  form = document.querySelector('#image-form'),
  slider = document.querySelector('#slider'),
  img = document.querySelector('#img');

outputPath.innerText = path.join(os.homedir(), 'imageshrink');

form.addEventListener('submit', e => {
  e.preventDefault();

  const imgPath = img.files[0].path,
    quality = slider.value;

  ipcRenderer.send('image:minimize', { imgPath, quality });
  ipcRenderer.on('image:done', () => {
    M.toast({
      html: `Image resized to ${slider.value}% quality`
    });
  });
});
