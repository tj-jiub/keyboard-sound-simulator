const { shell } = require('electron');

document.getElementById('ig-link').addEventListener('click', (event) => {
  event.preventDefault();
  shell.openExternal('https://instagram.com/tj_jiub');
});
