import * as Phaser from 'phaser';
import * as settings from "../../config";
import { Star } from "./star";


export class StarsBackground extends Phaser.Group {

  _starRadius = settings.starMaxRadius;
  _starMaxScale = 1;
  _starMinScale = .1;

  _maxStarsNumber = settings.maxStarsNumber;

  constructor(game, parent) {
    super(game, parent);
  }

  initialize() {
    if (this.parent) {
      this.parent.sendToBack(this);
    }
    this.createStars();
  }

  createStars() {
    this.updateStars();
  }

  createStar(point, farScale) {
    let game = this.game;
    let star = new Star(game, this, this._starRadius * farScale, farScale);
    star.x = point.x;
    star.y = point.y;
    star.alpha = 0;
    game.add.tween(star)
      .to({ alpha: 1 }, 200, Phaser.Easing.Quadratic.InOut, true);
  }

  updateStars() {
    let game = this.game;
    let scale = this.parent.scale.x;
    let cameraBounds = this._getCameraBounds();
    let stars = this.children;

    const decreaseScale = .1;
    let maxStarRadius = this._starRadius;
    let minStarRadius = (this._starRadius * .1 ) / (
      decreaseScale + (1 - decreaseScale)
      * (scale - settings.minZoomScaling) / (settings.maxZoomScaling - settings.minZoomScaling)
    );
    if (minStarRadius > maxStarRadius) {
      minStarRadius = maxStarRadius;
    }
    let maxStarsNumber = this._maxStarsNumber / (
      decreaseScale + (1 - decreaseScale)
      * (scale - settings.minZoomScaling) / (settings.maxZoomScaling - settings.minZoomScaling)
    );

    for (let starIndex = 0; starIndex < stars.length; ++starIndex) {
      let star = stars[ starIndex ];
      if (!cameraBounds.contains( star.x, star.y )
        || star._radius < minStarRadius
        || star._radius > maxStarRadius) {
        stars.splice(starIndex, 1);
        star.destroy();
        starIndex--;
      }
    }
    let starsNeeded = maxStarsNumber - stars.length;
    for (let times = 0; times < starsNeeded; ++times) {
      this.createStar(
        new Phaser.Point(
          cameraBounds.x + game.rnd.realInRange(0, cameraBounds.width),
          cameraBounds.y + game.rnd.realInRange(0, cameraBounds.height)
        ),
        game.rnd.realInRange(minStarRadius / maxStarRadius, this._starMaxScale)
      );
    }
  }

  /**
   * Deletes all stars and creates new again
   */
  forceUpdate() {
    this.removeAll(true);
    setTimeout(() => this.updateStars(), 200);
  }

  /**
   * Keeps stars in camera view
   */
  keepInView() {
    let cameraBounds = this._getCameraBounds();
    let view = new Phaser.Rectangle(cameraBounds.x, cameraBounds.y, cameraBounds.width, cameraBounds.height);
    for (let index = 0; index < this.children.length; ++index) {
      let item = this.children[ index ];
      if (item.x > view.x + view.width + 5) {
        item.x = view.x;
      }
      if (item.x < view.x + -item.width - 5) {
        item.x = view.x + view.width;
      }
      if (item.y > view.y + view.height + 5) {
        item.y = view.y;
      }
      if (item.y < view.y + -item.height - 5) {
        item.y = view.y + view.height;
      }
    }
  }

  /**
   * @param shiftX
   * @param shiftY
   */
  moveStars(shiftX, shiftY) {
    let game = this.game.classInstance;
    let worldSize = game.worldSize;
    let player = game.me;
    let camera = this.game.camera;

    if (this._isPlayerCollidesWithLeftRightBounds(player, worldSize)
      || this._isCameraReachedLeftRightBounds(camera, worldSize)) {
      shiftX = 0;
    }
    if (this._isPlayerCollidesWithTopBottomBounds(player, worldSize)
      || this._isCameraReachedTopBottomBounds(camera, worldSize)) {
      shiftY = 0;
    }

    for (let index = 0; index < this.children.length; ++index) {
      let item = this.children[ index ];
      item.position.add(shiftX * (1 - item._scale), shiftY * (1 - item._scale));
    }
    this.keepInView();
  }

  /**
   * @param player
   * @param worldSize
   * @return {boolean}
   * @private
   */
  _isPlayerCollidesWithTopBottomBounds(player, worldSize) {
    let playerHeight = player.height;
    return player.y + playerHeight / 2 >= worldSize.y + worldSize.height - 10
      || player.y - playerHeight / 2 <= worldSize.y + 10;
  }

  /**
   * @param player
   * @param worldSize
   * @return {boolean}
   * @private
   */
  _isPlayerCollidesWithLeftRightBounds(player, worldSize) {
    let playerWidth = player.width;
    return player.x + playerWidth / 2 >= worldSize.x + worldSize.width - 10
      || player.x - playerWidth / 2 <= worldSize.x + 10;
  }

  /**
   * @param camera
   * @param worldSize
   * @return {boolean}
   * @private
   */
  _isCameraReachedTopBottomBounds(camera, worldSize) {
    return camera.y <= worldSize.y + 10
      || camera.y + camera.height >= worldSize.y + worldSize.height - 10;
  }

  /**
   * @param camera
   * @param worldSize
   * @return {boolean}
   * @private
   */
  _isCameraReachedLeftRightBounds(camera, worldSize) {
    return camera.x <= worldSize.x + 10
      || camera.x + camera.width >= worldSize.x + worldSize.width - 10;
  }

  /**
   * @return {Phaser.Rectangle}
   * @private
   */
  _getCameraBounds() {
    let game = this.game;
    let scale = this.parent.scale.x;
    let [ cameraWidth, cameraHeight ] = [ game.camera.width, game.camera.height ];
    let actualWorldViewWidth = cameraWidth / scale;
    let actualWorldViewHeight = cameraHeight / scale;
    let cameraXOffset = game.camera.view.x / scale;
    let cameraYOffset = game.camera.view.y / scale;
    return new Phaser.Rectangle( cameraXOffset, cameraYOffset, actualWorldViewWidth, actualWorldViewHeight );
  }
}