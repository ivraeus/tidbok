(() => {

  'use strict';
  console.log('init');

  // add utility functions to nodelist and HTMLCollection
  NodeList.prototype.forEach = Array.prototype.forEach;
  HTMLCollection.prototype.forEach = Array.prototype.forEach;
  HTMLCollection.prototype.map = Array.prototype.map;

  function getSiblingIfClass(element, className, direction) {
    let elm = null;
    if (direction === 'backwards') {
      elm = element.previousSibling;
    } else if (direction === 'forwards'){
      elm = element.nextSibling;
    }
    if (elm.tagName !== 'DIV') { return false; }
    if (elm.classList.contains(className)) { return elm; }
    return false;
  }

  class Page {
    constructor(element) {
      this._self = element;
      this._prev = getSiblingIfClass(element, 'page', 'backwards');
      this._next = getSiblingIfClass(element, 'page', 'forwards');
      this._rect = element.getBoundingClientRect();

      element.addEventListener('touchstart', e => this._onTouchStart(e));
    }

    _onTouchStart(event) {

      event.preventDefault();
      event.stopPropagation();

      if (event.touches.length > 1) return true;

      let startTime = window.performance.now();

      let pending = false;

      const SELF = this._self;
      const PREV = this._prev;
      const NEXT = this._next;
      const RECT = this._rect;

      let startPos = {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY
      };

      let deltaPos = { x: 0, y: 0 };

      if (PREV) {
        PREV.style.cssText = null;
        PREV.style.left = '-30%';
        PREV.classList.add('inView');
      }

      if (NEXT) {
        NEXT.style.cssText = null;
        NEXT.style.left = '100%';
        NEXT.classList.add('inView');
      }

      SELF.style.cssText = null;



      let onTouchMove = event => {

        event.preventDefault();
        event.stopPropagation();

        if (!pending) {

          deltaPos.x = event.touches[0].pageX - startPos.x;

          requestAnimationFrame(() => {

            if (!PREV && deltaPos.x > 0) deltaPos.x = 0;
            if (!NEXT && deltaPos.x < 0) deltaPos.x = 0;

            let prevPos = (deltaPos.x > 0) ? deltaPos.x / 3 : 0;
            let nextPos = (deltaPos.x < 0) ? deltaPos.x : 0;
            let selfPos = (deltaPos.x < 0) ? deltaPos.x / 3 : deltaPos.x;

            if (PREV) PREV.style.transform =
              'translateX(' + prevPos + 'px)';

            if (NEXT) NEXT.style.transform =
              'translateX(' + nextPos + 'px)';

            SELF.style.transform =
              'translateX(' + selfPos + 'px)';

            pending = false;
          });

          pending = true;
        }
      };



      let onTouchEnd = () => {

        let deltaTime = window.performance.now() - startTime;
        let percent = (deltaPos.x / RECT.width) * 100;
        let velocity = percent / deltaTime;

        let velocityThreshold = 0.16;
        let percentTreshold = 50;

        if (percent !== 0) {

          requestAnimationFrame(() => {

            if (percent > percentTreshold || velocity > velocityThreshold) {

              PREV.style.transition = 'transform 200ms ease-out';
              PREV.style.transform = 'translateX(30%)';
              SELF.style.pointerEvents = 'none';
              SELF.style.transition = 'transform 200ms ease-out';
              SELF.style.transform = 'translateX(100%)';

            } else if ( percent < -percentTreshold || velocity < -velocityThreshold) {

              NEXT.style.transition = 'transform 200ms ease-out';
              NEXT.style.transform = 'translateX(-100%)';
              SELF.style.pointerEvents = 'none';
              SELF.style.transition = 'transform 200ms ease-out';
              SELF.style.transform = 'translateX(-30%)';

            } else {

              if (PREV) {
                PREV.style.pointerEvents = 'none';
                PREV.style.transition = 'transform 200ms ease-out';
                PREV.style.transform = 'translateX(0)';
              }

              if (NEXT) {
                NEXT.style.pointerEvents = 'none';
                NEXT.style.transition = 'transform 200ms ease-out';
                NEXT.style.transform = 'translateX(0)';
              }

              SELF.style.transition = 'transform 200ms ease-out';
              SELF.style.transform = 'translateX(0)';
            }

          });



          let onTransitionEnd = () => {

            if (percent > percentTreshold || velocity > velocityThreshold) {

              if (NEXT) NEXT.classList.remove('inView');
              SELF.classList.remove('inView');

            } else if ( percent < -percentTreshold || velocity < -velocityThreshold) {

              if (PREV) PREV.classList.remove('inView');
              SELF.classList.remove('inView');

            } else {

              if (PREV) PREV.classList.remove('inView');
              if (NEXT) NEXT.classList.remove('inView');

            }

            SELF.removeEventListener('transitionend', onTransitionEnd);
          };

          SELF.addEventListener('transitionend', onTransitionEnd);

        } else {
          if (PREV) PREV.classList.remove('inView');
          if (NEXT) NEXT.classList.remove('inView');
        }

        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('touchcancel', onTouchEnd);
      };

      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
      document.addEventListener('touchcancel', onTouchEnd);
    }
  }

  document.querySelectorAll('.page').forEach(e => { new Page(e); });




})();
