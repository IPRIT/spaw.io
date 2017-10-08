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
   * @type {number}
   * @private
   */
  _traction = 0;

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
    this._traction = info.traction;
    if (info.playerInfo && info.playerInfo.faction) {
      this._faction = info.playerInfo.faction;
    }
  }

  /**
   * @param {*} info
   */
  updateInfo(info, updatePosition = true) {
    this._size = info.size;
    this._md = info.md;
    this._traction = info.traction;
    if (updatePosition) {
      this._state.pos = info.pos;
    }
    this._playerInfo.score = info.score;
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
    let game = this.game;
    let direction = new Phaser.Point(this.md.x, this.md.y);
    let oldRotation = this.playerBody.rotation;
    let rotation = (new Phaser.Point(-1, 0)).angle( direction, true ) * 2;

    let animationTime = 1000 / 3;

    if (Math.abs(oldRotation - rotation) > 180) {
      // oldRotation -> -180/180 -> rotation:
      let firstStartAt = oldRotation;
      let firstStopAt = oldRotation < 0 ? -180 : 180;
      let firstDelta = Math.abs(firstStopAt - firstStartAt);

      let secondStartAt = rotation < 0 ? -180 : 180;
      let secondStopAt = rotation;
      let secondDelta = Math.abs(secondStopAt - secondStartAt);

      let overallDistance = firstDelta + secondDelta;
      let firstDistanceRatio = firstDelta / overallDistance;
      let secondDistanceRatio = 1 - firstDistanceRatio;

      let firstTween = game.add.tween(this.playerBody)
        .to({ rotation: firstStopAt }, animationTime * firstDistanceRatio, 'Linear', true);
      let secondTween = game.add.tween(this.playerBody)
        .to({ rotation: secondStopAt }, animationTime * secondDistanceRatio, 'Linear');
      firstTween.onComplete.add(() => {
        this.playerBody.rotation = secondStartAt;
        secondTween.start();
      });
    } else {
      // oldRotation -> rotation:
      game.add.tween(this.playerBody)
        .to({ rotation }, animationTime, 'Linear', true);
    }
  }

  /**
   * Updates player size
   */
  updateBodySize() {
    let scale = this._getScaleBySize();
    this.game.add.tween(this.scale)
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
    let scale = this._getScaleBySize();
    this.scale.set( scale, scale );
    this.playerBody.rotation = this._state.angular.pos;
    game.physics.p2.enable(this.playerTriangle);
  }

  /**
   * (!) This method only for remote players
   *
   * Setting next player position
   *
   * @param {number} avgVelocity Average velocity for player with 60 fps
   */
  directRemotePlayer(avgVelocity = this._avgVelocity) {
    const frameRate = 60;
    // x and y are normalized
    let { x, y } = this._md;
    let direction = new Phaser.Point(x, y);
    let traction = this._traction;
    let deltaX = (avgVelocity / frameRate) * x * traction;
    let deltaY = (avgVelocity / frameRate) * y * traction;
    let worldSize = this.gameClassInstance.worldSize;
    // add world bounds constraints
    let newX = Phaser.Math.clamp(this.x + deltaX, worldSize.x + this.width / 3, worldSize.x + worldSize.width - this.width / 3);
    let newY = Phaser.Math.clamp(this.y + deltaY, worldSize.y + this.height / 3, worldSize.y + worldSize.height - this.height / 3);
    this.position.set( newX, newY );

    if (this.state) {
      let realPosition = new Phaser.Point(this.state.pos.x, this.state.pos.y);
      this.position.add(
        (realPosition.x - this.position.x) / 50,
        (realPosition.y - this.position.y) / 50
      );
    }
  }

  /**
   * @return {number}
   * @private
   */
  _getScaleBySize() {
    let size = this.size;
    const initSize = 30;
    return size / initSize;
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