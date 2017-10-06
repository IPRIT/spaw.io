import * as settings from "./config";
import * as utils from "./utils";
import 'ion-sound';
import Promise from 'bluebird';
import EventEmitter from 'events';
import * as Phaser from 'phaser';
import { StarsBackground } from "./lib/background/stars";
import { SocketIoManager } from "./lib/socket.io";
import * as Api from './lib/api';
import { MyPlayer } from "./models/player/my-player";

export const GameState = {
  not_init: 2,
  init: 4,
  started: 4 | 8,
  paused: 4 | 16
};

export class Game extends EventEmitter {

  /**
   * @type {number}
   */
  gameState = GameState.started;

  /**
   * @type {Phaser.Game}
   * @private
   */
  _gameInstance = null;

  /**
   * @type {number}
   * @private
   */
  _frames = 0;

  /**
   * @type {MyPlayer}
   * @private
   */
  _player = null;

  /**
   * @type {Phaser.Group}
   * @private
   */
  _worldGroup = null;

  /**
   * @type {number}
   * @private
   */
  _worldScale = 1;

  /**
   * @type {Phaser.Rectangle}
   * @private
   */
  _worldSize = null;

  /**
   * @type {StarsBackground}
   * @private
   */
  _starsBackground = null;

  /**
   * @type {*}
   * @private
   */
  _gameStatus = null;

  constructor() {
    super();
    this._createGameInstance();
  }
  
  init(gameStatus) {
    this._gameStatus = gameStatus;
    this._createWorld( gameStatus );
    this._createStarsBackground();
    this._attachEvents();
  }
  
  start() {
    this.gameState = GameState.started;
  }

  pause() {
    this.gameState = GameState.paused;
  }

  reset() {
    this.pause();
    // todo: free memory
  }

  /**
   * @return {number}
   */
  getFPS() {
    return this._gameInstance.time.fps;
  }

  /**
   * @param params
   */
  register(params) {
    return Api.register( params );
  }

  /**
   * Creates current player
   * @return {MyPlayer}
   */
  createMe(socket, session, faction) {
    this._player = new MyPlayer(this._gameInstance, this._worldGroup, { socket, session, faction });
    return this._player;
  }

  /**
   * @private
   */
  _createGameInstance() {
    this._gameInstance = new Phaser.Game('100', '100', Phaser.AUTO, 'space-game', {
      preload: this._preload.bind(this),
      create: this._create.bind(this),
      update: this._update.bind(this),
      render: this._render.bind(this)
    });
    this._gameInstance.classInstance = this;
  }

  /**
   * @private
   */
  _preload() {
  }

  /**
   * @private
   */
  _create() {
    let game = this._gameInstance;
    game.time.advancedTiming = true;

    game.physics.startSystem(Phaser.Physics.P2JS);

    this._cursors = game.input.keyboard.createCursorKeys();

    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    game.scale.setResizeCallback(() => this._resize(), game);
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();
  }

  _update() {
    if (this.isGamePaused) {
      return;
    }
    this._frames++;

    this._handleZooming();

    let starsBackground = this._starsBackground;
    let game = this.game;

    if (starsBackground) {
      starsBackground.callAll('_moveForward');
    }
    if (this._player) {
      this._player.playerControls.update();

      if (this._player.hasBody && this._frames > 100) {
        let direction = this._player.playerControls._getDirection( game.input );
        let traction = this._player.playerControls._getTraction( game.input );
        let shiftX = 2 * -direction.x * traction;
        let shiftY = 2 * -direction.y * traction;
        if (this._isPlayerCollidesWithTopBottomBounds()
          || this._isCameraReachedTopBottomBounds()) {
          shiftY = 0;
        }
        if (this._isPlayerCollidesWithLeftRightBounds()
          || this._isCameraReachedLeftRightBounds()) {
          shiftX = 0;
        }
        starsBackground.moveStars(shiftX, shiftY);
        starsBackground.keepInView( this._worldScale );
      }
    }
  }

  /**
   * @param {number} interval
   * @return {boolean}
   * @private
   */
  _each(interval) {
    return !(this._frames % interval);
  }

  /**
   * @param {*} gameStatus
   */
  _createWorld(gameStatus) {
    let { world } = gameStatus;
    let { bounds } = world;
    let game = this._gameInstance;
    let worldSize = this._worldSize = new Phaser.Rectangle(
      bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY
    );
    game.add.tileSprite(worldSize.x, worldSize.y, worldSize.width, worldSize.height, this._createBackgroundColor());
    game.world.setBounds(worldSize.x, worldSize.y, worldSize.width, worldSize.height);
    this._worldGroup = game.add.group();
    this._drawWorldBounds( this._worldGroup );
  }

  /**
   * @param {Phaser.Group} group
   * @private
   */
  _drawWorldBounds(group) {
    let game = this._gameInstance;
    let worldSize = this._worldSize;
    this._worldBoundsBorder = game.add.graphics(0, 0, group);
    this._worldBoundsBorder.lineStyle(10, 0xFF0000, 1);
    this._worldBoundsBorder.drawRect(worldSize.x, worldSize.y, worldSize.width, worldSize.height);
  }

  /**
   * @private
   */
  _createStarsBackground() {
    this._starsBackground = new StarsBackground(this._gameInstance, this._worldGroup);
    setTimeout(() => this._starsBackground.initialize());
  }

  /**
   * @return {*}
   * @private
   */
  _createBackgroundColor() {
    let game = this._gameInstance;
    game.stage.backgroundColor = '#3B3251';
    let background = game.add.bitmapData(256, 256);
    background.ctx.beginPath();
    background.ctx.rect(0, 0, 256, 256);
    background.ctx.fillStyle = '#3B3251';
    background.ctx.fill();
    return background;
  }

  /**
   * @private
   */
  _handlePlayerMovements() {
    if (!this._player || !this._player.hasBody) {
      return;
    }
    let game = this._gameInstance;
    let player = this._player;
    let cursors = this._cursors;

    if (cursors.up.isDown) {
      player.playerBody.moveUp(600);
      if (!this._isPlayerCollidesWithTopBottomBounds()
        && !this._isCameraReachedTopBottomBounds()) {
        this._starsBackground.moveStars(0, -10);
      }
    } else if (cursors.down.isDown) {
      player.playerBody.moveDown(600);
      if (!this._isPlayerCollidesWithTopBottomBounds()
        && !this._isCameraReachedTopBottomBounds()) {
        this._starsBackground.moveStars(0, 10);
      }
    }

    if (cursors.left.isDown) {
      player.playerBody.moveLeft(600);
      if (!this._isPlayerCollidesWithLeftRightBounds()
        && !this._isCameraReachedLeftRightBounds()) {
        this._starsBackground.moveStars(-10, 0);
      }
    } else if (cursors.right.isDown) {
      player.playerBody.moveRight(600);
      if (!this._isPlayerCollidesWithLeftRightBounds()
        && !this._isCameraReachedLeftRightBounds()) {
        this._starsBackground.moveStars(10, 0);
      }
    }
    this._starsBackground.keepInView(this._worldScale);
  }

  /**
   * @private
   */
  _handleZooming() {
    let game = this._gameInstance;
    const zoomDelta = .01;
    const maxZoom = settings.maxZoomScaling;
    const minZoom = settings.minZoomScaling;
    let previousZoom = this._worldScale;
    if (game.input.keyboard.isDown(Phaser.KeyCode.NUMPAD_ADD)) {
      this._worldScale = Phaser.Math.clamp(this._worldScale + zoomDelta, minZoom, maxZoom);
    } else if (game.input.keyboard.isDown(Phaser.KeyCode.NUMPAD_SUBTRACT)) {
      this._worldScale = Phaser.Math.clamp(this._worldScale - zoomDelta, minZoom, maxZoom);
    }
    if (Math.abs(previousZoom - this._worldScale) > 1e-7) {
      this._worldGroup.scale.setTo(this._worldScale, this._worldScale);
      //game.camera.setBoundsToWorld();
      this._starsBackground.updateStars(this._worldScale);
    }
  }

  /**
   * @private
   */
  _render() {
    let game = this._gameInstance;
    if (game.input.keyboard.isDown(Phaser.KeyCode.L)) {
      game.debug.cameraInfo(this._gameInstance.camera, 32, 32);
      game.debug.bodyInfo(this._player, 500, 32);
      game.debug.text(`World scale: ${this._worldScale.toFixed(2)}`, 32, 140);
      game.debug.text(`FPS: ${this._gameInstance.time.fps}/${this._gameInstance.time.desiredFps} (${this._gameInstance.time.fpsMin}, ${this._gameInstance.time.fpsMax})`, 32, 160);
      console.log(this._player);
    } else {
      game.debug.reset();
    }
  }

  /**
   * @private
   */
  _attachEvents() {
    window.addEventListener('resize', this._resize.bind(this));
    this._resize();
  }

  _resize() {
  }

  _animateZoomTo(scale, duration = 100) {
    let game = this._gameInstance;
    return game.add.tween(this._worldGroup.scale).to({
      x: scale,
      y: scale
    }, duration, Phaser.Easing.Cubic.InOut, true);
  }

  _isPlayerCollidesWithTopBottomBounds() {
    let player = this._player;
    let playerHeight = this._player.height;
    let worldSize = this._worldSize;
    return player.y + playerHeight / 2 >= worldSize.y + worldSize.height
      || player.y - playerHeight / 2 <= worldSize.y;
  }

  _isPlayerCollidesWithLeftRightBounds() {
    let player = this._player;
    let playerWidth = this._player.width;
    let worldSize = this._worldSize;
    return player.x + playerWidth / 2 >= worldSize.x + worldSize.width
      || player.x - playerWidth / 2 <= worldSize.x;
  }

  _isCameraReachedTopBottomBounds() {
    let camera = this._gameInstance.camera;
    let worldSize = this._worldSize;
    return camera.y <= worldSize.y
      || camera.y + camera.height >= worldSize.y + worldSize.height;
  }

  _isCameraReachedLeftRightBounds() {
    let camera = this._gameInstance.camera;
    let worldSize = this._worldSize;
    return camera.x <= worldSize.x
      || camera.x + camera.width >= worldSize.x + worldSize.width;
  }

  /**
   * @return {boolean}
   */
  get isGameNotInit() {
    return ( this.gameState & GameState.not_init ) === GameState.not_init;
  }

  /**
   * @return {boolean}
   */
  get isGameInit() {
    return ( this.gameState & GameState.init ) === GameState.init;
  }

  /**
   * @return {boolean}
   */
  get isGameStarted() {
    return ( this.gameState & GameState.started ) === GameState.started;
  }

  /**
   * @return {boolean}
   */
  get isGamePaused() {
    return ( this.gameState & GameState.paused ) === GameState.paused;
  }

  /**
   * @return {MyPlayer}
   */
  get me() {
    return this._player;
  }

  /**
   * @return {Phaser.Group}
   */
  get worldGroup() {
    return this._worldGroup;
  }

  /**
   * @return {Phaser.Game}
   */
  get game() {
    return this._gameInstance;
  }

  /**
   * @return {StarsBackground}
   */
  get starsBackground() {
    return this._starsBackground;
  }

  /**
   * @return {number}
   */
  get worldScale() {
    return this._worldScale;
  }
}