import * as Phaser from 'phaser';
import * as utils from "../../utils";

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
   * @type {{ pos: Phaser.Point, vel: Phaser.Point, acc: Phaser.Point, angular: *, md: {x: number, y: number} }}
   * @private
   */
  _state = null;

  /**
   * @type {*}
   * @private
   */
  _playerInfo = null;

  /**
   * @type {{ x: number, y: number }}
   * @private
   */
  _md = { x: 0, y: 0 };

  /**
   * @param game
   * @param parentGroup
   * @param params
   */
  constructor(game, parentGroup, params) {
    super(game, parentGroup);
    this.enableBody = true;
    if (params && params.faction) {
      this._faction = params.faction;
    }
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
    this._md = info.md;
    if (info.playerInfo && info.playerInfo.faction) {
      this._faction = info.playerInfo.faction;
    }
  }

  /**
   * @param {*} info
   */
  updateInfo(info) {
    this._size = info.size;
    this._md = info.md;
    // workaround
    this._state.angular = info.state.angular;
    this._playerInfo = info.playerInfo;
  }

  /**
   * @param {*} state
   */
  setPosition(state) {
    this._state = state;
    let game = this.game;
    game.add.tween(this.position)
      .to({ x: state.pos.x, y: state.pos.y }, 200, 'Linear', true);
  }

  /**
   * Updating rotation
   */
  updateRotation() {
    if (!this.md) {
      return;
    }
    let direction = new Phaser.Point(this.md.x, this.md.y);
    let game = this.game;
    let rotation = (new Phaser.Point(-1, 0)).angle( direction, true ) * 2;
    game.add.tween(this.playerBody)
      .to({ rotation }, 100, 'Linear', true);
  }

  /**
   * Updates player size
   */
  updateBodySize() {
    let size = this.size;
    let game = this.game;
    let scale = size / 30;
    game.add.tween(this.scale)
      .to({ x: scale, y: scale }, 400, 'Linear', true);
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
    this.playerBody.rotation = this._state.angular.pos;
    game.physics.p2.enable(this.playerTriangle);
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
    return this.gameClassInstance.worldGroup;
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
   * @return {string}
   */
  get type() {
    return this._type;
  }

  /**
   * @return {{pos: Phaser.Point, vel: Phaser.Point, acc: Phaser.Point, angular: *}}
   */
  get state() {
    return this._state;
  }

  /**
   * @return {{x: number, y: number}}
   */
  get md() {
    return this._md;
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

  /**
   * @return {number}
   */
  get size() {
    return this._size;
  }

  destroy() {
    super.destroy(true);
  }
}