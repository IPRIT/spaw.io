import * as Phaser from 'phaser';
import * as settings from "../../config";
import { Star } from "./star";


export class StarsBackground extends Phaser.Group {

  /**
   * @type {Phaser.Group}
   * @private
   */
  _worldGroup = null;

  _starRadius = 15;
  _starMaxScale = 1;
  _starMinScale = .1;

  _starsNumberInQuad = 2;
  _quadsNumber = 5;

  _maxStarsNumber = 50;

  constructor(game, parentGroup) {
    super(game, parentGroup);
    this._worldGroup = parentGroup;
  }

  initialize() {
    let game = this.game;
    this._worldGroup.sendToBack(this);
    this.createStars();
  }

  createStars(worldScale = this._worldGroup.scale.x) {
    let game = this.game;
    let [ cameraWidth, cameraHeight ] = [ game.camera.width, game.camera.height ];
    let actualWorldViewWidth = cameraWidth / worldScale;
    let actualWorldViewHeight = cameraHeight / worldScale;

    let blockRowSize = actualWorldViewWidth / this._quadsNumber;
    let blockColumnSize = actualWorldViewHeight / this._quadsNumber;

    for (let blockNumberY = 1; blockNumberY <= this._quadsNumber; ++blockNumberY) {
      let blockStartsY = blockColumnSize * (blockNumberY - 1) + game.camera.view.y / worldScale;
      for (let blockNumberX = 1; blockNumberX <= this._quadsNumber; ++blockNumberX) {
        let blockStartsX = blockRowSize * (blockNumberX - 1) + game.camera.view.x / worldScale;
        //let rectZone = new Phaser.Rectangle(blockStartsX, blockStartsY, blockRowSize, blockColumnSize);
        for (let times = 0; times < this._starsNumberInQuad; ++times) {
          this.createStar(
            new Phaser.Point(
              blockStartsX + game.rnd.realInRange(0, blockRowSize),
              blockStartsY + game.rnd.realInRange(0, blockColumnSize)
            ),
            game.rnd.realInRange(this._starMinScale, this._starMaxScale)
          );
        }
      }
    }
  }

  createStar(point, farScale) {
    let game = this.game;
    let star = new Star(game, this, this._starRadius * farScale, farScale);
    star.x = point.x;
    star.y = point.y;
  }

  updateStars(worldScale = this._worldGroup.scale.x) {
    let game = this.game;
    let cameraBounds = this._getCameraBounds();
    let stars = this.children;

    const decreaseScale = .1;
    let maxStarRadius = this._starRadius;
    let minStarRadius = (this._starRadius * .1 ) / (
      decreaseScale + (1 - decreaseScale)
      * (worldScale - settings.minZoomScaling) / (settings.maxZoomScaling - settings.minZoomScaling)
    );
    if (minStarRadius > maxStarRadius) {
      minStarRadius = maxStarRadius;
    }
    let maxStarsNumber = this._maxStarsNumber / (
      decreaseScale + (1 - decreaseScale)
      * (worldScale - settings.minZoomScaling) / (settings.maxZoomScaling - settings.minZoomScaling)
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

  keepInView(worldScale = this._worldGroup.scale.x) {
    let game = this.game;
    let cameraBounds = this._getCameraBounds();

    for (let index = 0; index < this.children.length; ++index) {
      let item = this.children[ index ];
      if (item.x > cameraBounds.x + cameraBounds.width + 5) {
        item.x = cameraBounds.x;
      }
      if (item.x < cameraBounds.x + -item.width - 5) {
        item.x = cameraBounds.x + cameraBounds.width;
      }
      if (item.y > cameraBounds.y + cameraBounds.height + 5) {
        item.y = cameraBounds.y;
      }
      if (item.y < cameraBounds.y + -item.height - 5) {
        item.y = cameraBounds.y + cameraBounds.height;
      }
    }
  }

  moveStars(shiftX, shiftY) {
    for (let index = 0; index < this.children.length; ++index) {
      let item = this.children[ index ];
      item.position.add(shiftX * (1 - item._scale), shiftY * (1 - item._scale));
    }
  }

  /**
   * @param {number} worldScale
   * @return {Phaser.Rectangle}
   * @private
   */
  _getCameraBounds(worldScale = this._worldGroup.scale.x) {
    let game = this.game;
    let [ cameraWidth, cameraHeight ] = [ game.camera.width, game.camera.height ];
    let actualWorldViewWidth = cameraWidth / worldScale;
    let actualWorldViewHeight = cameraHeight / worldScale;
    let cameraXOffset = game.camera.view.x / worldScale;
    let cameraYOffset = game.camera.view.y / worldScale;
    return new Phaser.Rectangle(cameraXOffset, cameraYOffset, actualWorldViewWidth, actualWorldViewHeight);
  }
}