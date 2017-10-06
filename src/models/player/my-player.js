import * as Phaser from 'phaser';
import { Player } from "./player";
import { PlayerSocketApi } from "./socket-api";
import { SocketIoManager } from "../../lib/socket.io/socket-manager";
import { PlayerControls } from "./player-controls";

export class MyPlayer extends Player {

  /**
   * @type {Socket}
   * @private
   */
  _socket = null;

  /**
   * @type {*}
   * @private
   */
  _session = null;

  /**
   * @type {PlayerSocketApi}
   * @private
   */
  _socketApi = null;

  /**
   * @type {PlayerControls}
   * @private
   */
  _playerControls = null;

  /**
   * @param game
   * @param parentGroup
   * @param params
   */
  constructor(game, parentGroup, params) {
    super(game, parentGroup, params);
    this._socket = params.socket;
    this._session = params.session;
    this._createSocketApi();
    this._createPlayersControl();
    this._retrieveInfo().then(() => {
      this.createBody();
    });
  }

  /**
   * Creates body for current player
   */
  createBody() {
    super.createBody();
    let game = this.game;
    game.physics.p2.enable(this.playerTriangle);
    game.camera.follow(this, Phaser.Camera.FOLLOW_LOCKON, .5, .5);
    setTimeout(() => {
      this.gameClassInstance.starsBackground.updateStars();
      game.camera.lerp.set(1, 1);
    }, 300)
  }

  /**
   * @private
   */
  _createSocketApi() {
    this._socketApi = new PlayerSocketApi();
    this._socketApi.attach( this, this._socket );
  }

  /**
   * @private
   */
  _createPlayersControl() {
    this._playerControls = new PlayerControls( this );
    this._playerControls.initControls();
  }

  /**
   * @private
   */
  async _retrieveInfo() {
    let socketIoManager = SocketIoManager.getInstance();
    let info = await socketIoManager.getMe();
    this.setInfo( info );
  }

  /**
   * @return {PlayerControls}
   */
  get playerControls() {
    return this._playerControls;
  }

  /**
   * @return {Socket}
   */
  get socket() {
    return this._socket;
  }

  /**
   * @return {PlayerSocketApi}
   */
  get socketApi() {
    return this._socketApi;
  }
}