import * as Phaser from 'phaser';
import * as settings from "../../config";
import { Star } from "./star";


export class StarsBackground extends Phaser.Group {

  _starRadius = 20;
  _starMaxScale = 1;
  _starMinScale = .1;

  _maxStarsNumber = 50;

  constructor(game) {
    super(game);
    this.fixedToCamera = true;
    console.log(this);
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
      .to({ alpha: 1 }, 200, Phaser.Easing.Cubic.InOut, true);
  }

  updateStars() {
    let game = this.game;
    let scale = this.scale.x;
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

    let rect = new Phaser.Rectangle(0, 0, cameraBounds.width, cameraBounds.height);
    for (let starIndex = 0; starIndex < stars.length; ++starIndex) {
      let star = stars[ starIndex ];
      if (!rect.contains( star.x, star.y )
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
          game.rnd.realInRange(0, cameraBounds.width),
          game.rnd.realInRange(0, cameraBounds.height)
        ),
        game.rnd.realInRange(minStarRadius / maxStarRadius, this._starMaxScale)
      );
    }
  }

  /**
   * @param {number} scale
   */
  setScale(scale) {
    this.scale.set( scale, scale );
  }

  keepInView() {
    let cameraBounds = this._getCameraBounds();
    let view = new Phaser.Rectangle(0, 0, cameraBounds.width, cameraBounds.height);
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

  moveStars(shiftX, shiftY) {
    for (let index = 0; index < this.children.length; ++index) {
      let item = this.children[ index ];
      item.position.add(shiftX * item._scale, shiftY * item._scale);
    }
  }

  moveStarsSimple(shiftX, shiftY) {
    for (let index = 0; index < this.children.length; ++index) {
      let item = this.children[ index ];
      item.position.add(shiftX, shiftY);
    }
  }

  /**
   * @return {Phaser.Rectangle}
   * @private
   */
  _getCameraBounds() {
    let game = this.game;
    let scale = this.scale.x;
    let [ cameraWidth, cameraHeight ] = [ game.camera.width, game.camera.height ];
    let actualWorldViewWidth = cameraWidth / scale;
    let actualWorldViewHeight = cameraHeight / scale;
    let cameraXOffset = game.camera.view.x / scale;
    let cameraYOffset = game.camera.view.y / scale;
    return new Phaser.Rectangle( cameraXOffset, cameraYOffset, actualWorldViewWidth, actualWorldViewHeight );
  }
}