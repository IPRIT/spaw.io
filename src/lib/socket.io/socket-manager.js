import EventEmitter from 'events';
import Promise from 'bluebird';

export class SocketIoManager extends EventEmitter {

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
   * @type {Array.<string>}
   * @private
   */
  _transports = [ 'websocket' ];

  /**
   * @return {SocketIoManager}
   */
  static getInstance() {
    return this._instance || (this._instance = new SocketIoManager());
  }

  constructor() {
    super();
  }

  /**
   * @param {{ publicIp: string }} params
   */
  joinServer(params) {
    let { publicIp } = params;
    let socket = this._socket = io(publicIp, {
      transports: this._transports
    });
    socket.on('disconnect', () => {
      console.log('Disconnected from the game server:', publicIp, socket.id);
      this.emit('disconnect');
    });
    socket.on('game.error', data => {
      console.log('game.error', data);
      this.emit('game.error', data);
    });
    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        console.log('Connected to the game server:', publicIp, socket.id);
        this.emit('connect', socket);
        resolve(params);
      });
    });
  }

  /**
   * @param {{ gameToken: string }} params
   * @return {Promise}
   */
  joinArena(params) {
    let { gameToken } = params;
    this._socket.emit('player.join', { gameToken });
    return new Promise((resolve, reject) => {
      this._socket.once('player.joined', data => resolve(data));
    });
  }

  /**
   * @return {Promise}
   */
  getGameStatus() {
    this._socket.emit('game.status');
    return new Promise((resolve, reject) => {
      this._socket.once('game.status', data => resolve(data));
    });
  }

  /**
   * @return {Promise}
   */
  getWorldStatus() {
    this._socket.emit('world.status');
    return new Promise((resolve, reject) => {
      this._socket.once('world.status', data => resolve(data));
    });
  }

  /**
   * @param {number} factionId
   * @return {Promise}
   */
  joinFaction(factionId) {
    this._socket.emit('faction.join', { factionId });
    return new Promise((resolve, reject) => {
      this._socket.once('player.joinedFaction', data => resolve(data));
    });
  }

  /**
   * @return {Promise}
   */
  getMe() {
    this._socket.emit('player.me');
    return new Promise((resolve, reject) => {
      this._socket.once('player.me', data => resolve(data));
    });
  }

  /**
   * @return {Socket}
   */
  get socket() {
    return this._socket;
  }
}

