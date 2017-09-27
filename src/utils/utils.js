export function getBodyBounds() {
  let width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

  let height = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
  return [ width, height ];
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function probabilityTest(probability = 1) {
  return Math.random() <= probability;
}

export function highlight(container) {
  let graphics = new PIXI.Graphics();
  graphics.beginFill(0x0FF0F0);
  graphics.lineStyle(2, 0xFF0000);
  graphics.drawRect(0, 0, container.width || 100, container.height || 100);
  graphics.blendMode = PIXI.BLEND_MODES.MULTIPLY;
  container.addChild(graphics);
}

export function mark(coords, container) {
  let graphics = new PIXI.Graphics();
  graphics.beginFill(0x0FF0F0);
  graphics.lineStyle(2, 0xFF0000);
  graphics.drawRect(0, 0, 10, 10);
  graphics.blendMode = PIXI.BLEND_MODES.MULTIPLY;
  graphics.position.x = coords[0];
  graphics.position.y = coords[1];
  setTimeout(() => {
    container.removeChild(graphics);
    graphics.destroy();
  }, 100);
  container.addChild(graphics);
}

export function deleteObject(object) {
  if (typeof object === 'object' && object !== null) {
    for (let prop in object) {
      if (object.hasOwnProperty && object.hasOwnProperty(prop)) {
        deleteObject(object[ prop ]);
      }
    }
  } else if (Array.isArray(object)) {
    for (let i = 0; i < object.length; ++i) {
      deleteObject(object[ i ]);
    }
  } else {
    object = null;
  }
}