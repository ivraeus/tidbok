(() => {

  'use strict';
  console.log('init');

  // add utility functions to nodelist and HTMLCollection
  NodeList.prototype.forEach = Array.prototype.forEach;
  HTMLCollection.prototype.forEach = Array.prototype.forEach;
  HTMLCollection.prototype.map = Array.prototype.map;

  class Page {
    constructor(element, set) {
      this._element = element;
      this._set = set;
    }
  }

  class PageSet {
    constructor(element) {
      this._element = element;
      this._pages   = element.children.map(e => new Page(e, this));
      this._offset  = 1;
      this._axis    = (element.classList.contains(
        'page-set--horizontal')) ? 'x' : 'y';
      this._element.addEventListener('touchstart', e => this._onTouchStart(e));

      this._setPosition()
    }

    _setPosition() {
      requestAnimationFrame(() => {
        if (this._axis === 'x') {
          this._element.scrollLeft = this._offset * window.innerWidth;
        } else {
          this._element.scrollTop = this._offset * window.innerHeight;
        }
      });
    }

    _onTouchStart(event) {

      // Store original event for later.
      let oldEvent = event;

      // prevent default event
      event.preventDefault();

      let startTime = window.performance.now()

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

          if (!pendingPaint) {
            // paint swipe here
            requestAnimationFrame(() => {

              // scroll correct axis
              if (this._axis === 'x') {
                this._element.scrollLeft = -deltaPos.x +
                  (this._offset * window.innerWidth);
              } else {
                this._element.scrollTop = -deltaPos.y +
                  (this._offset * window.innerHeight);
              }

              pendingPaint = false;
            }); // requestAnimationFrame
            pendingPaint = true;
          } // if (!pendingPaint)

        } else {
          return false;
        }

      };

      let onTouchEnd = event => {

        let deltaTime = window.performance.now() - startTime
        let percentage = deltaPos[this._axis] / windowSize[this._axis];
        let velocity = (percentage * 100) / deltaTime;

        // swipe if more then half screen movement.
        if (percentage > 0.5 || velocity > 0.2) {
          this._offset = Math.max(this._offset - 1, 0);
        } else if (percentage < -0.5 || velocity < -0.2) {
          this._offset = Math.min(this._offset + 1, this._pages.length -1);
        }

        // this._element.innerHTML = velocity;

        this._setPosition();

        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      };

      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    }
  }

  document.querySelectorAll('.page-set').forEach(e => { new PageSet(e); });

})();
