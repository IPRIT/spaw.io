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
   * @type {Map.<number, Player|Feed|any>}
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
      //this.createBody();
      //this._viewBodies.set( this.id, this );
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
      this.gameClassInstance.starsBackground.initialize();
      game.camera.lerp.set(1, 1);
    }, 500);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} traction
   */
  directTo({ x, y }, traction) {
    let game = this.gameClassInstance;
    let starsGroup = game.starsBackground;

    const frameRate = 60;
    // x and y are normalized
    let deltaX = (this._avgVelocity / frameRate) * x * traction;
    let deltaY = (this._avgVelocity / frameRate) * y * traction;
    let worldSize = this.gameClassInstance.worldSize;

    // Size = distance from center to any vertex of triangle.
    // Opposite cathetus of 30 degree corner equals 1/2 of hypotenuse
    let playerRadius = this.size * .5;
    // world bounds constraints
    let newX = Phaser.Math.clamp(
      this.x + deltaX, worldSize.x + playerRadius, worldSize.x + worldSize.width - playerRadius);
    let newY = Phaser.Math.clamp(
      this.y + deltaY, worldSize.y + playerRadius, worldSize.y + worldSize.height - playerRadius);
    starsGroup.moveStars(newX - this.x, newY - this.y);
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
      this._avgMeasuresNumber++;
    } else if (deltaDistance > 40) {
      let avgVelocity = this._avgVelocity;
      this._avgVelocity = ( avgVelocity * this._avgMeasuresNumber + newVelocity ) / ( this._avgMeasuresNumber + 1 );
      this._avgMeasuresNumber++;
      this._lastPositionChangedAtMs = currentTimeMs;
    }
    if (this._avgMeasuresNumber > 200) {
      this._avgMeasuresNumber = 20;
    }
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
   * @param {Array.<number>} checkList
   */
  removeBodies(checkList) {
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
   * @param {Array.<Array.<number|any>>} updates
   */
  updatePlayers(updates) {
    for (let i = 0; i < updates.length; ++i) {
      this._updatePlayer( updates[ i ] );
    }
  }

  /**
   * @param {Array.<number|any>} data
   * @private
   */
  _updatePlayer(data) {
    let update = this._decodeUpdatePlayerData( data );
    /** @type {Player} */
    let player = this._viewBodies.get( update.uid );
    if (!player || !player.hasBody) {
      return;
    }
    // check if the player is our and not update position if true
    // because we have another event for this
    let isMe = this.id === player.id;
    player.updateInfo( update, !isMe );
    player.updateBodySize();

    if (isMe) {
      let scale = this._approximateViewScaleByPlayerSize();
      this.gameClassInstance.zoomToScale( scale );
    } else {
      player.updateRotation();
    }
  }

  /**
   * @param {*} data
   * @private
   */
  _addViewBody(data) {
    let body = this._decodeFullBodyData( data );
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
    if (this.id === uid) {
      this.setInfo( playerBody );
      this.createBody();
      this.position.set( pos.x, pos.y );
      this.updateBodySize(true);
      this._viewBodies.set( this.id, this );
      return;
    } else if (this._viewBodies.has(uid)) {
      return;
    }
    let player = new Player(this.game, this.worldGroup);
    player.setInfo( playerBody );
    player.createBody();
    player.position.set( pos.x, pos.y );
    player.updateBodySize(true);
    player.updateRotation(true);
    this._viewBodies.set( player.id, player );
  }

  /**
   * @param {*} data
   * @private
   */
  _changeViewBody(data) {
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
    }
  }

  /**
   * @param {Array.<number>} list
   * @private
   */
  _checkViewBodies(list) {
    list.reduce((uid, value, index) => {
      uid += value;
      list[ index ] = uid;
      return uid;
    }, 0);
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
    if (!this.game) {
      return;
    }
    let feedsGroup = this.gameClassInstance.feedsGroup;
    feedsGroup.removeFeedById( feed.id );
  }

  /**
   * @param {Player} player
   * @private
   */
  _removePlayerBody(player) {
    if (!player || !player.id) {
      return;
    }
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
   * @param data
   * @private
   */
  _decodeFullBodyData( data) {
    let [ type ] = data;
    switch ( type ) {
      case 'player': {
        return this._decodeFullPlayerData( data );
      }
      case 'feed': {
        return this._decodeFullFeedData( data );
      }
    }
  }

  /**
   * @param data
   * @private
   */
  _decodeFullPlayerData(data) {
    let [
      type, uid, size,
      verticesX1, verticesY1,
      verticesX2, verticesY2,
      verticesX3, verticesY3,
      mdX, mdY,
      traction,
      positionX, positionY,
      angularPos, angularVel, angularAcc,
      bodyId, userNickname, userType,
      playerScore,
      factionId, factionName, factionPlayersNumber, factionMaxPlayersNumber,
      factionScore
    ] = data;
    let decoded = {
      type, uid, size,
      vertices: [{
        x: verticesX1, y: verticesY1
      }, {
        x: verticesX2, y: verticesY2
      }, {
        x: verticesX3, y: verticesY3
      }],
      md: { x: mdX, y: mdY },
      traction,
      state: {
        pos: {
          x: positionX, y: positionY
        },
        angular: {
          pos: angularPos,
          vel: angularVel,
          acc: angularAcc
        }
      },
      playerInfo: {
        bodyId, userNickname, userType,
        score: playerScore,
        faction: factionId && {
          id: factionId,
          name: factionName,
          playersNumber: factionPlayersNumber,
          maxPlayersNumber: factionMaxPlayersNumber,
          score: factionScore
        }
      }
    };
    console.log(decoded);
    return decoded;
  }

  /**
   * @param data
   * @private
   */
  _decodeUpdatePlayerData(data) {
    let [
      uid, size,
      mdX, mdY,
      traction,
      positionX, positionY,
      playerScore
    ] = data;
    return {
      uid, size,
      md: { x: mdX, y: mdY },
      traction,
      pos: { x: positionX, y: positionY },
      score: playerScore
    }
  }

  /**
   * @param data
   * @private
   */
  _decodeFullFeedData(data) {
    let [
      type, uid, radius,
      positionX, positionY
    ] = data;
    return {
      type, uid, radius,
      state: {
        pos: {
          x: positionX, y: positionY
        }
      }
    }
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