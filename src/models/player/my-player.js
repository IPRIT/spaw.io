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
   * @type {number}
   * @private
   */
  _lastPositionChangedAtMs = Date.now();

  /**
   * @type {number}
   * @private
   */
  _avgVelocity = 0;

  /**
   * @type {number}
   * @private
   */
  _avgMeasuresNumber = 0;

  /**
   * @type {Map.<*>}
   * @private
   */
  _viewBodies = new Map();

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
      this._viewBodies.set( this.id, this );
    });
  }

  /**
   * Creates body for current player
   */
  createBody() {
    super.createBody();
    let game = this.game;
    game.camera.follow(this, Phaser.Camera.FOLLOW_LOCKON, .5, .5);
    setTimeout(() => {
      this.gameClassInstance.starsBackground.updateStars();
      game.camera.lerp.set(1, 1);
    }, 300)
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} traction
   */
  directTo({ x, y }, traction) {
    const frameRate = 60;
    // x and y are normalized
    let deltaX = (this._avgVelocity / frameRate) * x * traction;
    let deltaY = (this._avgVelocity / frameRate) * y * traction;
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
   * @param {number} newX
   * @param {number} newY
   */
  measureAvgVelocity(newX, newY) {
    let game = this.game;
    let traction = this.playerControls.getTraction( game.input );
    if (traction < .01) {
      return;
    }
    let oldX = this.state.pos.x;
    let oldY = this.state.pos.y;

    let currentTimeMs = Date.now();
    let oldPosition = new Phaser.Point(oldX, oldY);
    let newPosition = new Phaser.Point(newX, newY);
    let deltaDistance = newPosition.distance( oldPosition );
    let deltaTimeMs = currentTimeMs - this._lastPositionChangedAtMs;

    let newVelocity = (deltaDistance / deltaTimeMs * 1000) / traction;

    if (!this._avgMeasuresNumber) {
      this._avgVelocity = newVelocity;
    } else {
      let avgVelocity = this._avgVelocity;
      this._avgVelocity = ( avgVelocity * this._avgMeasuresNumber + newVelocity ) / ( this._avgMeasuresNumber + 1 );
    }
    this._avgMeasuresNumber++;
    if (this._avgMeasuresNumber > 1000) {
      this._avgMeasuresNumber = 100;
    }
    this.state.pos.x = newX;
    this.state.pos.y = newY;
    this._lastPositionChangedAtMs = currentTimeMs;
  }

  /**
   * @param {Array.<*>} bodies
   * @param {Array.<number>} checkList
   */
  addBodies(bodies, checkList) {
    for (let i = 0; i < bodies.length; ++i) {
      this._addViewBody( bodies[ i ] );
    }
    this._checkViewBodies( checkList );
  }

  /**
   * @param {Array.<*>} bodies
   * @param {Array.<number>} checkList
   */
  removeBodies(bodies, checkList) {
    this._checkViewBodies( checkList );
  }

  /**
   * @param {Array.<*>} bodies
   * @param {Array.<number>} checkList
   */
  changeBodies(bodies, checkList) {
    for (let i = 0; i < bodies.length; ++i) {
      this._changeViewBody( bodies[ i ] );
    }
    this._checkViewBodies( checkList );
  }

  /**
   * @param {*} body
   * @private
   */
  _addViewBody(body) {
    let type = body.type;
    switch ( type ) {
      case 'feed': {
        this._addFeedViewBody( body );
        break;
      }
      case 'player': {
        this._addPlayerViewBody( body );
        break;
      }
      default: {
        console.warn('Unsupported body type:', body);
      }
    }
  }

  /**
   * @param {*} feedBody
   * @private
   */
  _addFeedViewBody(feedBody) {
    let { radius, state, uid } = feedBody || {};
    let { pos } = state || {};
    if (!pos || !radius || !uid) {
      return;
    }
    let feedsGroup = this.gameClassInstance.feedsGroup;
    let feed = feedsGroup.addFeed( feedBody );
    feed.position.set( pos.x, pos.y );
    this._viewBodies.set( feed.id, feed );
  }

  /**
   * @param {*} playerBody
   * @private
   */
  _addPlayerViewBody(playerBody) {
    let { state, uid } = playerBody || {};
    let { pos } = state || {};
    if (!pos || !uid) {
      return;
    }
    if (this.id === uid || this._viewBodies.has(uid)) {
      return;
    }
    let player = new Player(this.game, this.worldGroup);
    player.setInfo( playerBody );
    player.createBody();
    player.position.set( pos.x, pos.y );
    player.updateBodySize();
    //player.updateRotation();
    this._viewBodies.set( player.id, player );
  }

  /**
   * @param {*} body
   * @private
   */
  _changeViewBody(body) {
    let type = body.type;
    switch ( type ) {
      case 'player': {
        this._changePlayerBody( body );
        break;
      }
      default: {
        console.warn('Unsupported body type:', body);
      }
    }
  }

  /**
   * @param {*} playerBody
   * @private
   */
  _changePlayerBody(playerBody) {
    let { uid } = playerBody || {};
    if (!uid) {
      return;
    }
    /** @type {Player} */
    let player = this._viewBodies.get( uid );
    if (!player) {
      this._addPlayerViewBody(playerBody);
      return;
    }
    player.updateInfo( playerBody );
    player.updateBodySize();

    // affect zoom only for current player
    if (uid === this.id) {
      let scale = this._approximateViewScaleByPlayerSize();
      this.gameClassInstance.zoomToScale( scale );
    } else {
      player.setPosition( playerBody.state );
      //player.updateRotation();
    }
  }

  /**
   * @param {Array.<number>} list
   * @private
   */
  _checkViewBodies(list) {
    let viewBodiesArray = [ ...this._viewBodies.values() ];
    for (let i = 0; i < viewBodiesArray.length; ++i) {
      let body = viewBodiesArray[ i ];
      if (!list.includes( body.id )) {
        switch ( body.type ) {
          case 'feed': {
            this._removeFeedBody(body);
            this._viewBodies.delete( body.id );
            break;
          }
          case 'player': {
            this._removePlayerBody(body);
            this._viewBodies.delete( body.id );
            break;
          }
        }
      }
    }
  }

  /**
   * @param {Feed} feed
   * @private
   */
  _removeFeedBody(feed) {
    let feedsGroup = this.gameClassInstance.feedsGroup;
    feedsGroup.removeFeedById( feed.id );
  }

  /**
   * @param {Player} player
   * @private
   */
  _removePlayerBody(player) {
    console.log(player);
    if (!player || !player.id) {
      return;
    }
    console.log(player);
    this.worldGroup.remove( player );
    player.destroy();
  }

  /**
   * @return {number}
   * @private
   */
  _approximateViewScaleByPlayerSize() {
    // 1.05998 - 0.00202994 x + 1.01996×10^-6 x^2
    // http://www.wolframalpha.com/input/?i=quadratic+fit+%7B30,1%7D,%7B500,0.3%7D,%7B1000,0.05%7D
    // scale quadratic approximation by 3 points
    let x = this.size;
    return 1.01996 * 1e-6 * x * x - 0.00202994 * x + 1.05998;
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

  /**
   * @return {number}
   */
  get avgVelocity() {
    return this._avgVelocity;
  }

  /**
   * @return {Map.<*>}
   */
  get viewBodies() {
    return this._viewBodies;
  }

  /**
   * @return {Array.<Player>}
   */
  get viewPlayers() {
    return [ ...this.viewBodies.values() ].filter(body => body.type === 'player');
  }
}