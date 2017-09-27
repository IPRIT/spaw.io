import * as settings from "./config";
import * as utils from "./utils";
import 'ion-sound';
import Promise from 'bluebird';
import EventEmitter from 'events';
import * as Phaser from 'phaser';
import { StarsBackground } from "./lib/background/stars";

export const GameState = {
  not_init: 2,
  init: 4,
  started: 4 | 8,
  paused: 4 | 16
};

export class Game extends EventEmitter {

  gameState = GameState.started;

  /**
   * @type {Phaser.Game}
   * @private
   */
  _gameInstance = null;

  /**
   * @type {Phaser.Sprite}
   * @private
   */
  _player = null;

  /**
   * @type {Phaser.Group}
   * @private
   */
  _worldGroup = null;

  _worldScale = 1;

  /**
   * @type {StarsBackground}
   * @private
   */
  _stars = null;

  constructor() {
    super();
  }
  
  init() {
    this._createGameInstance();
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

  getFPS() {
    return this._gameInstance.time.fps;
  }

  _createGameInstance() {
    this._gameInstance = new Phaser.Game('100', '100', Phaser.AUTO, 'space-game', {
      preload: this._preload.bind(this),
      create: this._create.bind(this),
      update: this._update.bind(this),
      render: this._render.bind(this)
    });
  }

  _preload() {
    //this._gameInstance.load.image('background','resources/bg/1/bg-04.png');
    //this._gameInstance.load.image('player', 'resources/models/foxy/died/foxy-died.png');
  }

  _create() {
    let game = this._gameInstance;
    game.time.advancedTiming = true;

    game.stage.backgroundColor = '#3B3251';

    let background = game.add.bitmapData(256, 256);
    background.ctx.beginPath();
    background.ctx.rect(0, 0, 256, 256);
    background.ctx.fillStyle = '#3B3251';
    background.ctx.fill();

    let worldSize = this._worldSize = new Phaser.Point(10000, 10000);
    game.add.tileSprite(-worldSize.x / 2, -worldSize.y / 2, worldSize.x, worldSize.y, background);
    game.world.setBounds(-worldSize.x / 2, -worldSize.y / 2, worldSize.x, worldSize.y);

    game.physics.startSystem(Phaser.Physics.P2JS);

    let bmd = game.add.bitmapData(64, 64);
    // draw to the canvas context like normal
    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0, 64, 64);
    bmd.ctx.fillStyle = '#FF7885';
    bmd.ctx.fill();

    this._worldGroup = game.add.group();
    //this._worldGroup.position.setTo(game.world.centerX, game.world.centerY);

    this._worldBoundsBorder = game.add.graphics(0, 0, this._worldGroup);
    this._worldBoundsBorder.lineStyle(10, 0xFF0000, 1);
    this._worldBoundsBorder.drawRect(-worldSize.x / 2, -worldSize.y / 2, worldSize.x, worldSize.y);

    this._player = this._worldGroup.create(game.world.centerX, game.world.centerY, bmd);
    game.physics.p2.enable(this._player);
    this._player.anchor.set(.5, .5);
    this._player.body.collideWorldBounds = true;
    game.camera.follow(this._player, Phaser.Camera.FOLLOW_LOCKON);

    this._cursors = game.input.keyboard.createCursorKeys();

    game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    game.scale.setResizeCallback(() => this._resize(), game);
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.refresh();

    /* creating stars background instance */
    this._stars = new StarsBackground(game, this._worldGroup);
    setTimeout(() => this._stars.initialize(), 0);
  }

  _update() {
    if (this.isGamePaused) {
      return;
    }
    let game = this._gameInstance;
    let player = this._player;
    let cursors = this._cursors;

    this._handlePlayerMovements();
    this._handleZooming();

    this._stars.callAll('_moveForward');
  }

  _handlePlayerMovements() {
    let game = this._gameInstance;
    let player = this._player;
    let cursors = this._cursors;

    this._player.body.setZeroVelocity();

    if (cursors.up.isDown) {
      player.body.moveUp(600);
      if (!this._isPlayerCollidesWithTopBottomBounds()
        && !this._isCameraReachedTopBottomBounds()) {
        this._stars.moveStars(0, -10);
      }
    } else if (cursors.down.isDown) {
      player.body.moveDown(600);
      if (!this._isPlayerCollidesWithTopBottomBounds()
        && !this._isCameraReachedTopBottomBounds()) {
        this._stars.moveStars(0, 10);
      }
    }

    if (cursors.left.isDown) {
      player.body.moveLeft(600);
      if (!this._isPlayerCollidesWithLeftRightBounds()
        && !this._isCameraReachedLeftRightBounds()) {
        this._stars.moveStars(-10, 0);
      }
    } else if (cursors.right.isDown) {
      player.body.moveRight(600);
      if (!this._isPlayerCollidesWithLeftRightBounds()
        && !this._isCameraReachedLeftRightBounds()) {
        this._stars.moveStars(10, 0);
      }
    }
    this._stars.keepInView(this._worldScale);
  }

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
      game.camera.setBoundsToWorld();
      this._stars.updateStars(this._worldScale);
    }
  }

  _render() {
    let game = this._gameInstance;
    if (game.input.keyboard.isDown(Phaser.KeyCode.L)) {
      game.debug.cameraInfo(this._gameInstance.camera, 32, 32);
      game.debug.spriteInfo(this._player, 500, 32);
      game.debug.text(`World scale: ${this._worldScale.toFixed(2)}`, 32, 140);
      game.debug.text(`FPS: ${this._gameInstance.time.fps}/${this._gameInstance.time.desiredFps} (${this._gameInstance.time.fpsMin}, ${this._gameInstance.time.fpsMax})`, 32, 160);
    } else {
      game.debug.reset();
    }
  }

  _attachEvents() {
    window.addEventListener('resize', this._resize.bind(this));
    this._resize();
  }

  _resize() {
  }

  _animateZoomTo(scale, duration = 0) {
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
    return player.y + playerHeight / 2 >= worldSize.y / 2
      || player.y - playerHeight / 2 <= -worldSize.y / 2;
  }

  _isPlayerCollidesWithLeftRightBounds() {
    let player = this._player;
    let playerWidth = this._player.width;
    let worldSize = this._worldSize;
    return player.x + playerWidth / 2 >= worldSize.x / 2
      || player.x - playerWidth / 2 <= -worldSize.x / 2;
  }

  _isCameraReachedTopBottomBounds() {
    let camera = this._gameInstance.camera;
    let worldSize = this._worldSize;
    return camera.y <= -worldSize.y / 2
      || camera.y + camera.height >= worldSize.y / 2;
  }

  _isCameraReachedLeftRightBounds() {
    let camera = this._gameInstance.camera;
    let worldSize = this._worldSize;
    return camera.x <= -worldSize.x / 2
      || camera.x + camera.width >= worldSize.x / 2;
  }

  get isGameNotInit() {
    return ( this.gameState & GameState.not_init ) === GameState.not_init;
  }

  get isGameInit() {
    return ( this.gameState & GameState.init ) === GameState.init;
  }

  get isGameStarted() {
    return ( this.gameState & GameState.started ) === GameState.started;
  }

  get isGamePaused() {
    return ( this.gameState & GameState.paused ) === GameState.paused;
  }
}