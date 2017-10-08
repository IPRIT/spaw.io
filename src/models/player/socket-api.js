import throttle from "throttleit";
import * as Phaser from "phaser";

export class PlayerSocketApi {

  /**
   * @type {Socket}
   * @private
   */
  _socket = null;

  /**
   * @type {MyPlayer}
   * @private
   */
  _player = null;

  constructor() {
  }

  /**
   * @param {MyPlayer} player
   * @param {Socket} socket
   */
  attach( player, socket  ) {
    this._player = player;
    this._socket = socket;

    // world api
    socket.on('world.newObjects', data => this._newObjects(data));
    socket.on('world.removedObjects', data => this._removedObjects(data));
    // updating bodies except players
    socket.on('world.changedObjects', data => this._changedObjects(data));
    // updating players
    socket.on('world.updatePlayers', data => this._updatePlayers(data));

    // player api
    socket.on('player.position', data => this._changeCurrentPlayerPosition(data));
  }

  /**
   * @param {Phaser.Point} direction
   * @param {number} traction
   */
  directPlayer( direction, traction ) {
    let data = [ direction.x, direction.y, traction ].map(number => Number(number.toFixed(4)));
    this._socket.emit('player.move', data);
  }

  directPlayerThrottled = throttle(this.directPlayer.bind(this), 100);

  /**
   * @param {{ current: Array.<number>, objects: * }} data
   * @private
   */
  _newObjects(data) {
    let { c = [], o = [] } = data;
    this._player.addBodies( o, c );
  }

  /**
   * @param {Array} data
   * @private
   */
  _removedObjects(data) {
    this._player.removeBodies( data || [] );
  }

  /**
   * @param {{ current: Array.<number>, objects: * }} data
   * @private
   */
  _changedObjects(data) {
    let { c = [], o = [] } = data;
    this._player.changeBodies( o, c );
  }

  /**
   * @param data
   * @private
   */
  _updatePlayers(data) {
    this._player.updatePlayers( data );
  }

  /**
   * @param {[number, number, number]} data
   * @private
   */
  _changeCurrentPlayerPosition(data) {
    let [ x, y ] = data;
    if (!this._player.hasBody) {
      return;
    }
    let player = this._player;
    player.measureAvgVelocity( x, y );
    player.state.pos.x = x;
    player.state.pos.y = y;
  }

  /**
   * @return {Socket}
   */
  get socket() {
    return this._socket;
  }
}