import * as Phaser from 'phaser';
import debounce from 'debounce';

export class PlayerControls {

  /**
   * @type {MyPlayer}
   * @private
   */
  _me = null;

  /**
   * @type {Phaser.Point}
   * @private
   */
  _prevInput = new Phaser.Point(0, 0);

  /**
   * @param {MyPlayer} me
   */
  constructor(me) {
    this._me = me;
  }

  /**
   * Initializing mouse controls
   */
  initControls() {
    let game = this.game;
  }

  /**
   * Invokes each frame
   */
  update() {
    let game = this.game;
    if (!this.me.hasBody) {
      return;
    }
    let direction = this._getDirection( game.input );
    let traction = this._getTraction( game.input );
    this._directPlayer( direction, traction );
    this._prevInput = new Phaser.Point( game.input.x, game.input.y );
  }

  /**
   * @param {Phaser.Point} direction
   * @param {number} traction
   * @private
   */
  _directPlayer(direction, traction = 1) {
    let player = this.me;
    let playerBody = player.playerBody;
    playerBody.rotation = (new Phaser.Point(-1, 0)).angle( direction, true ) * 2;
    player.socketApi.directPlayerToThrottled( direction, traction );
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {Phaser.Point}
   */
  _getDirection({ x, y }) {
    let mousePoint = new Phaser.Point(x, y);
    let screenCenter = this._getScreenCenter();
    return mousePoint.subtract( screenCenter.x, screenCenter.y ).normalize();
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {number}
   */
  _getTraction({ x, y }) {
    let screenSize = this._getScreenSize();
    let maxPossibleRadius = Math.min(screenSize.width, screenSize.height) / 2;
    const liveAreaRatio = .7;
    let liveAreaRadius = maxPossibleRadius * liveAreaRatio;
    let mousePoint = new Phaser.Point(x, y);
    return Math.min( mousePoint.distance( this._getScreenCenter() ), liveAreaRadius ) / liveAreaRadius;
  }

  /**
   * @return {Phaser.Point}
   * @private
   */
  _getScreenCenter() {
    let screenSize = this._getScreenSize();
    return new Phaser.Point(screenSize.width / 2, screenSize.height / 2);
  }

  /**
   * @return {{width: number, height: number}}
   * @private
   */
  _getScreenSize() {
    let game = this.game;
    return {
      width: game.width,
      height: game.height
    }
  }

  /**
   * @return {MyPlayer}
   */
  get me() {
    return this._me;
  }

  /**
   * @return {Phaser.Game}
   */
  get game() {
    return this._me.game;
  }
}