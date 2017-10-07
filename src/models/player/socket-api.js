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
    socket.on('world.changedObjects', data => this._changedObjects(data));

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
    let { current = [], objects = [] } = data;
    this._player.addBodies( objects, current );
  }

  /**
   * @param {{ current: Array.<number>, objects: * }} data
   * @private
   */
  _removedObjects(data) {
    let { current = [], objects = [] } = data;
    this._player.removeBodies( objects, current );
  }

  /**
   * @param {{ current: Array.<number>, objects: * }} data
   * @private
   */
  _changedObjects(data) {
    let { current = [], objects = [] } = data;
    this._player.changeBodies( objects, current );
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
  }

  /**
   * @return {Socket}
   */
  get socket() {
    return this._socket;
  }
}