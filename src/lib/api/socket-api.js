
export class SocketIoManager {

  /**
   * @type {SocketIoManager}
   * @private
   */
  static _instance = null;

  /**
   * @type {Socket}
   * @private
   */
  _socket = null;

  /**
   * @return {SocketIoManager}
   */
  static getInstance() {
    return this._instance || (this._instance = new SocketIoManager());
  }

  constructor() {
    let socket = this._socket = io('http://localhost:9001', {
      transports: [ 'websocket' ]
    });
    socket.on('connect', function() {
      console.log('user connected', socket.id);
    });
    socket.on('disconnect', function() {
      console.log('user disconnected', socket.id);
    });
    socket.on('game.error', data => {
      console.log('game.error', data);
    });
    socket.on('player.joined', data => {
      console.log('player.joined', data);
    });
    socket.on('player.left', data => {
      console.log('player.left', data);
    });
    socket.on('player.joinedFaction', data => {
      console.log('player.joinedFaction', data);
    });
    socket.on('faction.newPlayer', data => {
      console.log('faction.newPlayer', data);
    });
    socket.on('game.status', data => {
      console.log('game.status', data);
    });
    socket.emit('player.join', { gameToken: 'ffb833c335732ed6e507ecebd954224c0344bf50d79b0081956e1e1f7adedd662a316577f4d72ad6161311791e59814e' });
    setTimeout(() => {
      socket.emit('faction.join', { factionId: 1 });
    }, 300);
  }

  get socket() {
    return this._socket;
  }
}

