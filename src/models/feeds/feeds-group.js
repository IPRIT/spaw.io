import * as Phaser from "phaser";
import { Feed } from "./feed";

export class FeedsGroup extends Phaser.Group {

  constructor(game, parent) {
    super(game, parent);
  }

  /**
   * @param {*} feedInfo
   * @return {Feed}
   */
  addFeed( feedInfo ) {
    let feed = new Feed( this.game, this );
    feed.createView( feedInfo );
    return feed;
  }

  /**
   * @param {number} id
   */
  removeFeedById(id) {
    this.removeFeeds([ id ]);
  }

  /**
   * @param {Array.<number>} ids
   */
  removeFeeds(ids = []) {
    /** @type Array.<Feed> */
    let feeds = this.children;
    for (let i = 0; i < feeds.length; ++i) {
      let feed = feeds[ i ];
      if (ids.includes( feed.id )) {
        this._removeFeedByIndex( i );
        feed.destroy();
        i--;
      }
    }
  }

  /**
   * @param {number} index
   * @private
   */
  _removeFeedByIndex(index) {
    this.children.splice( index, 1 );
  }
}