import ds from 'fm-localstorage';
import { Game } from "./game";
import { SocketIoManager } from "./lib/socket.io/socket-manager";
import { MyPlayer } from "./models/player/my-player";

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
    userNickname: "IPRIT",
    token: 'cf393375ad24d8166bcc975b209cb2768cf0ca3e1132e936e8475743771e8c8d193db1a7ef276b5ed4597a7bc9d9a6eb'
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
    return socketIoManager.getGameStatus();
  }).then(gameStatus => {
    console.log('Game status:', gameStatus);
    game.init(gameStatus);
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