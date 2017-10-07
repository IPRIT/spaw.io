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
    let direction = this.getDirection( game.input );
    let traction = this.getTraction( game.input );
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
    player.socketApi.directPlayerThrottled( direction, traction );
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {Phaser.Point}
   */
  getDirection({ x, y }) {
    let mousePoint = new Phaser.Point(x, y);
    let anchorPoint = this._getAnchorPoint();
    return mousePoint.subtract( anchorPoint.x, anchorPoint.y ).normalize();
  }

  /**
   * @param {number} x
   * @param {number} y
   * @return {number}
   */
  getTraction({ x, y }) {
    let screenSize = this._getScreenSize();
    let maxPossibleRadius = Math.min(screenSize.width, screenSize.height) / 2;
    const liveAreaRatio = .6;
    let liveAreaRadius = maxPossibleRadius * liveAreaRatio;
    let mousePoint = new Phaser.Point(x, y);
    return Math.min( mousePoint.distance( this._getAnchorPoint() ), liveAreaRadius ) / liveAreaRadius;
  }

  /**
   * @return {Phaser.Point}
   * @private
   */
  _getAnchorPoint() {
    let worldPosition = this.me.worldPosition;
    return new Phaser.Point(worldPosition.x, worldPosition.y);
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