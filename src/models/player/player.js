import * as Phaser from 'phaser';

export class Player extends Phaser.Group {

  /**
   * @type {*}
   * @private
   */
  _faction = null;

  /**
   * @type {number}
   * @private
   */
  _id = null;

  /**
   * @type {string}
   * @private
   */
  _type = 'player';

  /**
   * @type {number}
   * @private
   */
  _size = 0;

  /**
   * @type {Array.<Phaser.Point>}
   * @private
   */
  _vertices = [];

  /**
   * @type {{ pos: Phaser.Point, vel: Phaser.Point, acc: Phaser.Point, angular: * }}
   * @private
   */
  _state = null;

  /**
   * @type {*}
   * @private
   */
  _playerInfo = null;

  /**
   * @param game
   * @param parentGroup
   * @param params
   */
  constructor(game, parentGroup, params) {
    super(game, parentGroup);
    this.enableBody = true;
    this._faction = params.faction;
  }

  /**
   * @param {*} info
   */
  setInfo(info) {
    this._id = info.uid;
    this._type = info.type;
    this._size = info.size;
    this._vertices = info.vertices;
    this._state = info.state;
    this._playerInfo = info.playerInfo;
  }

  /**
   * Creates world body
   */
  createBody() {
    let game = this.game;

    let triangle = game.add.graphics(0, 0, this);
    triangle.beginFill(0xFF7885);

    let vertices = this._vertices;
    triangle.drawTriangle( vertices );
    triangle.endFill();

    triangle.beginFill(0xcaff64);
    triangle.drawCircle(vertices[0].x, vertices[0].y, 3);
    triangle.endFill();

    this.position.set(
      this._state.pos.x,
      this._state.pos.y
    );
    this.playerBody.rotation = this.state.angular.pos;
    this.playerBody.velocity.x = 60 * this.state.vel.x;
    this.playerBody.velocity.y = 60 * this.state.vel.y;
  }

  /**
   * @return {*}
   */
  get faction() {
    return this._faction;
  }

  /**
   * @return {Phaser.World}
   */
  get world() {
    return this.game.world;
  }

  /**
   * @return {Phaser.Group}
   */
  get worldGroup() {
    return this.game.classInstance.worldGroup;
  }

  /**
   * @return {Game}
   */
  get gameClassInstance() {
    return this.game.classInstance;
  }

  /**
   * @return {number}
   */
  get id() {
    return this._id;
  }

  /**
   * @return {{pos: Phaser.Point, vel: Phaser.Point, acc: Phaser.Point, angular: *}}
   */
  get state() {
    return this._state;
  }

  /**
   * @return {Phaser.Sprite}
   */
  get playerTriangle() {
    return this.children[0];
  }

  /**
   * @return {Phaser.Physics.Arcade.Body|any}
   */
  get playerBody() {
    return this.playerTriangle.body;
  }

  /**
   * @return {boolean}
   */
  get hasBody() {
    return !!(this.playerTriangle && this.playerBody);
  }
}