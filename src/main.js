import './utils/polyfills';
import ds from 'fm-localstorage';
import { Game } from "./game";
import { SocketIoManager } from "./lib/socket.io/socket-manager";

document.addEventListener('DOMContentLoaded', () => {
  entryPoint();
});

async function entryPoint() {
  attachEvents();

  let socketIoManager = SocketIoManager.getInstance();
  let game = new Game();
  let me, _session, _faction;
  game.register({
    gameType: "quick",
    region: "eu-west",
    userNickname: "IPRIT " + (Math.random() > .5 ? Math.random().toFixed(5) : '')
  }).then(session => {
    _session = session;
    return socketIoManager.joinServer({
      publicIp: session.GameServer.publicIp,
      gameToken: session.gameToken
    });
  }).then(({ gameToken }) => {
    return socketIoManager.joinArena({ gameToken });
  }).then(session => {
    console.log('Player joined the game!', session);
    return Promise.all([
      socketIoManager.getGameStatus(),
      socketIoManager.getWorldStatus()
    ]);
  }).then(([ gameStatus, worldStatus ]) => {
    console.log('Game status:', gameStatus);
    console.log('World status:', worldStatus);
    game.init({ gameStatus, worldStatus });
    let factionId = gameStatus.factions[0].id;
    return socketIoManager.joinFaction( factionId );
  }).then(faction => {
    _faction = faction;
    console.log('Player joined the faction', faction);
    me = game.createMe(socketIoManager.socket, _session, _faction);
  }).catch(err => {
    console.log(err);
  });


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