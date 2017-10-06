export function getBodyBounds() {
  let width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

  let height = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;
  return [ width, height ];
}

export function optimalPixelRatio() {
  const sizeConstraints = 1500;
  let nativePixelRatio = window.devicePixelRatio;
  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;
  let maxSize = Math.max( screenWidth, screenHeight );
  return Math.min(
    maxSize > sizeConstraints ? 2 : nativePixelRatio, 2
  );
}

export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function probabilityTest(probability = 1) {
  return Math.random() <= probability;
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