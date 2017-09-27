import * as Phaser from 'phaser';

export class Star extends Phaser.Group {

  _radius = 1;
  _scale = 1;
  _randomShiftX = 0;
  _randomShiftY = 0;

  /**
   * @type {Phaser.Graphics}
   * @private
   */
  _star = null;

  constructor(game, parentGroup, radius, scale) {
    super(game, parentGroup);
    this._radius = radius;
    this._scale = scale;
    this._randomShiftX = game.rnd.realInRange(-.1, .1);
    this._randomShiftY = game.rnd.realInRange(-.1, .1);
    this._createCircle(radius);
  }

  _createCircle(radius) {
    let game = this.game;
    let star = this._star = game.add.graphics(0, 0, this);
    star.beginFill(0xffffff);
    star.drawCircle(0, 0, radius);
    star.endFill();
  }

  _moveForward() {
    let star = this._star.parent;
    star.x += this._randomShiftX * this._scale;
    star.y += this._randomShiftY * this._scale;
  }
}