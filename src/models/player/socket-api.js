import throttle from "throttleit";

export class PlayerSocketApi {

  /**
   * @type {Socket}
   * @private
   */
  _socket = null;

  constructor() {
  }

  /**
   * @param {Player} player
   * @param {Socket} socket
   */
  attach( player, socket  ) {
    this._player = player;
    this._socket = socket;

    // world api
    socket.on('world.changedObjects', data => this._changedObjects(data));

    // player api
    socket.on('player.position', data => this._changeCurrentPlayerPosition(data));
  }

  /**
   * @param {Phaser.Point} direction
   * @param {number} traction
   */
  directPlayerTo( direction, traction ) {
    this._socket.emit('player.move', [ direction.x, direction.y, traction ]);
  }

  directPlayerToThrottled = throttle(this.directPlayerTo.bind(this), 100);

  /**
   * @param {{ current: Array.<number>, objects: * }} data
   * @private
   */
  _changedObjects(data) {
    let { current = [], objects = [] } = data;
    // todo: implement
  }

  _changeCurrentPlayerPosition(data) {
    let [ x, y, /*vx, vy,*/ dt ] = data;
    if (!this._player.hasBody) {
      return;
    }
    let game = this._player.game;
    game.add.tween(this._player.position).to({ x, y }, dt + 50, 'Linear', true);
    this._player.state.pos.x = x;
    this._player.state.pos.y = y;
    //this._player.playerBody.velocity.set( 2000 * vx, 2000 * vy );
    //this._player.state.vel.x = vx;
    //this._player.state.vel.y = vy;
  }

  /**
   * @return {Socket}
   */
  get socket() {
    return this._socket;
  }
}