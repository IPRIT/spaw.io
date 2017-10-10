import * as settings from "./config";
import 'ion-sound';
import EventEmitter from 'events';
import * as Phaser from 'phaser';
import { StarsBackground } from "./lib/background/stars";
import * as Api from './lib/api';
import { MyPlayer } from "./models/player";
import { FeedsGroup } from "./models/feeds";

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
   * @type {FeedsGroup}
   * @private
   */
  _feedsGroup = null;

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

  /**
   * @type {*}
   * @private
   */
  _worldStatus = null;

  constructor() {
    super();
    this._createGameInstance();
  }
  
  init({ gameStatus, worldStatus }) {
    this._gameStatus = gameStatus;
    this._worldStatus = worldStatus;
    this._createWorld( gameStatus );
    this._createStarsBackground();
    this._createFeedsLayer();
    this._createMap( worldStatus );
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
   * @param {number} scale
   */
  zoomToScale( scale ) {
    const maxZoom = settings.maxZoomScaling;
    const minZoom = settings.minZoomScaling;
    let previousZoom = this._worldScale;
    this._worldScale = Phaser.Math.clamp(scale, minZoom, maxZoom);
    if (Math.abs(previousZoom - this._worldScale) > 1e-7) {
      let game = this.game;
      let tweenFirst = game.add.tween(this._worldGroup.scale)
        .to({ x: this._worldScale, y: this._worldScale }, 300, 'Linear', true);
      tweenFirst.onComplete.addOnce(() => {
        this._starsBackground.updateStars();
      });
    }
  }

  /**
   * @private
   */
  _createGameInstance() {
    let optimalSize = this.optimalGameSize;
    this._gameInstance = new Phaser.Game(optimalSize.width, optimalSize.height, Phaser.AUTO, 'space-game', {
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

    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
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

    let starsBackground = this._starsBackground;
    let game = this.game;

    if (starsBackground) {
      starsBackground.callAll('_moveForward');
    }
    if (this._player) {
      let direction = this._player.playerControls.getDirection( game.input );
      let traction = this._player.playerControls.getTraction( game.input );

      this._player.playerControls.update();
      this._player.directTo( direction, traction );
      this._player.viewPlayers.filter(player => {
        return player.id !== this._player.id;
      }).forEach(player => {
        player.directRemotePlayer( this._player.avgVelocity );
      });
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
    this._createBackgroundColor();
    //game.add.tileSprite(worldSize.x, worldSize.y, worldSize.width, worldSize.height, this._createBackgroundColor() );
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
    this._starsBackground = new StarsBackground(this._gameInstance, this.worldGroup);
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
  _createFeedsLayer() {
    this._feedsGroup = new FeedsGroup(this.game, this._worldGroup);
  }

  /**
   * @private
   */
  _createMap(worldStatus) {
    let mapGroup = this.game.add.group(this.worldGroup, 'Map');
    for (let polygon of worldStatus.territories) {
      let poly = new Phaser.Polygon(polygon.polygon);
      let graphics = this.game.add.graphics(0, 0, mapGroup);
      graphics.lineStyle(10, Math.floor( Math.random() * 16777215 ), .5);
      graphics.drawPolygon(poly.points);
      //graphics.endFill();

      graphics.lineStyle(5, Math.floor( Math.random() * 16777215 ), .5);
      graphics.beginFill( Math.floor( Math.random() * 16777215 ) );
      graphics.drawCircle( polygon.planet.position.x, polygon.planet.position.y, polygon.planet.radius );
      graphics.endFill();

      graphics.alpha = .3;
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
    this._gameInstance.onPause.add(() => {
      this._gameInstance.paused = this.isGamePaused;
    });
  }

  _resize() {
    let optimalSize = this.optimalGameSize;
    let game = this._gameInstance;
    game.paused = this.isGamePaused;
    game.scale.setGameSize(optimalSize.width, optimalSize.height);
    game.scale.refresh();
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

  /**
   * @return {number}
   */
  get screenWidth() {
    return window.innerWidth;
  }

  /**
   * @return {number}
   */
  get screenHeight() {
    return window.innerHeight;
  }

  /**
   * @return {{width: number, height: number}}
   */
  get optimalGameSize() {
    const maxSideSize = 2000;
    let width = this.screenWidth;
    let height = this.screenHeight;
    let ratio = width / height;
    if (width > height) {
      width = maxSideSize;
      height = width / ratio;
    } else {
      ratio = height / width;
      height = maxSideSize;
      width = height / ratio;
    }
    return { width, height };
  }

  /**
   * @return {Phaser.Rectangle}
   */
  get worldSize() {
    return this._worldSize;
  }

  /**
   * @return {FeedsGroup}
   */
  get feedsGroup() {
    return this._feedsGroup;
  }
}