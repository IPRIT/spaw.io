import * as Phaser from "phaser";

export class Feed extends Phaser.Group {

  /**
   * @type {number}
   * @private
   */
  _id = null;

  /**
   * @type {string}
   * @private
   */
  _type = 'feed';

  /**
   * @type {string}
   * @private
   */
  _color = '#ccc';

  /**
   * @type {number}
   * @private
   */
  _radius = 1;

  /**
   * @type {{ x: number, y: number }}
   * @private
   */
  _pos = null;

  constructor(game, parent) {
    super( game, parent );
  }

  /**
   * @param {{ x: number, y: number }} pos
   * @param {number} radius
   * @param {string} color
   * @param {number} uid
   */
  createView({ pos, radius, color, uid }) {
    this._pos = pos;
    this._radius = radius;
    this._color = color;
    this._id = uid;
    let game = this.game;
    let feed = game.add.graphics(0, 0, this);
    feed.beginFill(0xFF7885);
    feed.drawCircle( 0, 0, radius * 2 );
    feed.endFill();
  }

  /**
   * @return {number}
   */
  get id() {
    return this._id;
  }

  /**
   * @return {string}
   */
  get type() {
    return this._type;
  }
}