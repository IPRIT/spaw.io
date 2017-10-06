// Fix for browsers, that don't provide window.devicePixelRatio
window.devicePixelRatio = (function() {
  // based on http://snippets.pro/snippet/37-get-device-pixel-ratio-dpr/

  // Fix fake window.devicePixelRatio on mobile Firefox
  var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  if (typeof window.devicePixelRatio !== 'undefined' && !isFirefox) {
    return window.devicePixelRatio;
  } else if (window.matchMedia) {
    var mediaQuery = function(v, ov) {
      return "(-webkit-min-device-pixel-ratio: "+v+"),"
        +"(min--moz-device-pixel-ratio: "+v+"),"
        +"(-o-min-device-pixel-ratio: "+ov+"),"
        +"(min-resolution: "+v+"dppx)"
    };
    if (window.matchMedia(mediaQuery('1.5', '3/2')).matches)
      return 1.5;
    if (window.matchMedia(mediaQuery('2', '2/1')).matches)
      return 2;
    if (window.matchMedia(mediaQuery('0.75', '3/4')).matches)
      return 0.7;
  }
  return 1;
})();