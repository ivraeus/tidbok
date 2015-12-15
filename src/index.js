(() => {

  'use strict';
  console.log('init');

  // add utility functions to nodelist and HTMLCollection
  NodeList.prototype.forEach = Array.prototype.forEach;
  HTMLCollection.prototype.forEach = Array.prototype.forEach;
  HTMLCollection.prototype.map = Array.prototype.map;

  class Page {
    constructor(element) {
      this._element = element;
    }
  }

  class PageSet {
    constructor(element) {
      this._element = element;
      this._pages   = element.children.map(e => new Page(e));
      this._axis    = (element.classList.contains(
        'page-set--horizontal')) ? 'x' : 'y';
      this._offset  = 0;
      this._element.addEventListener('touchstart', e => this._onTouchStart(e));
    }

    _onTouchStart(event) {
      // Store original event for later.
      let oldEvent = event;

      // prevent default event
      event.preventDefault();

      // true if paint is pending
      let pendingPaint = false;

      // direction of current swipe
      let swipeAxis = false;

      let windowSize = {
        x: window.innerWidth,
        y: window.innerHeight
      };

      let startPos = {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY
      };

      let deltaPos = {
        x: 0,
        y: 0
      };

      let onTouchMove = event => {
        if (!pendingPaint) {
          // All calculation in here. (max 60 times per second)
          requestAnimationFrame(() => {

            deltaPos = {
              x: event.touches[0].pageX - startPos.x,
              y: event.touches[0].pageY - startPos.y
            };

            if (!swipeAxis) {
              if (Math.abs(deltaPos.x) > 20) {
                swipeAxis = 'x';
              } else if (Math.abs(deltaPos.y) > 20) {
                swipeAxis = 'y';
              }
            } else if (swipeAxis === this._axis) {
              // stop event for other targets if this is an allowed swipe
              event.stopPropagation();

              // scroll correct axis
              // if (this._axis === 'x') {
              //   this._element.scrollLeft = -deltaPos.x +
              //     (this._offset * window.innerWidth);
              // } else {
              //   this._element.scrollTop = -deltaPos.y +
              //     (this._offset * window.innerHeight);
              // }

            } else {
              return false;
            }

            pendingPaint = false;
          });
          pendingPaint = true;
        }
      };

      let onTouchEnd = event => {

        this._element.innerHTML = this._offset;

        // if (this._axis === 'x') {
        //   if (deltaPos.x / window.innerWeight > 0.5) {
        //     this._element.scrollTop += window.innerWeight;
        //   } else if (deltaPos.x / window.innerWeight < -0.5) {
        //     this._element.scrollTop += window.innerWeight;
        //   }
        // } else if (this._axis === 'y') {
        //   if (deltaPos.y / window.innerHeight > 0.5) {
        //     this._element.scrollTop += window.innerHeight;
        //   } else if (deltaPos.y / window.innerHeight < -0.5) {
        //     this._element.scrollTop += window.innerHeight;
        //   }
        // }

        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };

      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    }
  }

  document.querySelectorAll('.page-set').forEach(e => { new PageSet(e); });

})();

// if (this._axis === 'y') {
//   if (deltaPos.y / window.innerHeight > 0.5) {
//     this._offset -= 1;
//     this._element.scrollTop = this._offset * window.innerHeight;
//   } else if (deltaPos.y / window.innerHeight < -0.5) {
//     this._offset += 1;
//     this._element.scrollTop = this._offset * window.innerHeight;
//   } else {
//     this._element.scrollTop = this._offset * window.innerHeight;
//   }
// } else if (this._axis === 'x') {
//   if (deltaPos.x / window.innerWidth > 0.5) {
//     this._offset -= 1;
//     this._element.scrollLeft = this._offset * window.innerWidth;
//   } else if (deltaPos.x / window.innerWidth < -0.5) {
//     this._offset += 1;
//     this._element.scrollLeft = this._offset * window.innerWidth;
//   } else {
//     this._element.scrollLeft = this._offset * window.innerWidth;
//   }
// }
