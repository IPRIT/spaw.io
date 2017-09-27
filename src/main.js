import ds from 'fm-localstorage';
import { Game } from "./game";

document.addEventListener('DOMContentLoaded', () => {
  entryPoint();
});

function entryPoint() {
  attachEvents();

  let game = new Game();
  game.init();
  //game.on('loading-progress', progress => progressCallback(progress));

  window.$game = game;
}

function progressCallback(progress) {
  console.log(progress);
}

function extractSettings() {
  return ds.get('settings') || {};
}

function attachEvents() {
  window.addEventListener('resize', resize);
  setTimeout(resize, 500);
}

function resize() {
  // global resize callback
}