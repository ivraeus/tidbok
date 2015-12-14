(() => {

  'use strict';
  console.log('init');

  // add forEach to nodelist
  NodeList.prototype.forEach = Array.prototype.forEach;

  class Page {
    constructor(element) {
      this._element  = element;
      this._onTop    = element.getAttribute('data-on-top') || false;
      this._onLeft   = element.getAttribute('data-on-left') || false;
      this._onRight  = element.getAttribute('data-on-right') || false;
      this._onBottom = element.getAttribute('data-on-bottom') || false;

      this._element.addEventListener('touchstart', e => this._onTouchStart(e));
    }

    _onTouchStart(event) {

      event.preventDefault();
      if (event.targetTouches.length > 1)  { return; }

      let startTime = window.performance.now();
      let lastPos = {x: 0, y: 0};
      let startPos = {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY
      };

      let lockedAxis = false;
      let pendingPaint = false;
      let onTouchMove = event => {

        let deltaPos = {
          x: event.touches[0].pageX - startPos.x,
          y: event.touches[0].pageY - startPos.y
        };

        let wholePixel = false;
        if (!lockedAxis) {
          // Lock axis on first > 20px delta event.
          if (Math.abs(deltaPos.x) > 20) {
            if (!this._onLeft && !this._onRight) { return; };
            lockedAxis = 'x';
            // Set new start position when axis is determined.
            deltaPos.x = {
              x: event.touches[0].pageX - startPos.x,
              y: event.touches[0].pageY - startPos.y
            };
          } else if (Math.abs(deltaPos.y) > 20) {
            // if (!this._onTop && !this._bottom) { return; };
            lockedAxis = 'y';
            // Set new start position when axis is determined.
            deltaPos = {
              x: event.touches[0].pageX - startPos.x,
              y: event.touches[0].pageY - startPos.y
            };
          }
        // calculate difference between move events and set wholePixel.
        } else if (Math.abs(deltaPos[lockedAxis] - lastPos[lockedAxis]) > 1) {
          lastPos = deltaPos;
          wholePixel = true;
        }

        // Continue when locked axis.
        if (lockedAxis) {
          // Continue when moved > 1px in locked axis direction.
          // if (wholePixel) {
            // Continue if last paint has occurred.
            if (!pendingPaint) {
              pendingPaint = true;
              requestAnimationFrame(() => {
                // PAINT HERE

                if (lockedAxis === 'x') {
                  this._element.style.left = 0 + deltaPos.x + 'px';
                } else {
                  this._element.style.top = 0 + deltaPos.y + 'px';
                }
                pendingPaint = false;
              });
            // }
          }
        }
      };

      let onTouchEnd = event => {
        let deltaTime = Math.round(window.performance.now() - startTime);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };

      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    }
  }

  document.querySelectorAll('.page').forEach(elm => { new Page(elm); });

})();
