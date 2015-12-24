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
      this._dx = 0;

      element.addEventListener('touchstart', e => this._onTouchStart(e));
    }

    _onTouchStart(event) {
      if (event.touches.length > 1) return;
      event.preventDefault();

      let startTime = window.performance.now();
      let sx = event.touches[0].pageX;
      let draging = true;
      let direction = null;

      const SELF = this._self;
      const PREV = this._prev;
      const NEXT = this._next;
      const RECT = this._rect;

      if (PREV) {
        PREV.style.cssText = null;
        PREV.style.left = '-33.333333%';
        PREV.classList.add('inView', 'inTransit');
      }

      if (NEXT) {
        NEXT.style.cssText = null;
        NEXT.style.left = '100%';
        NEXT.classList.add('inView', 'inTransit');
      }

      SELF.style.cssText = null;
      SELF.classList.add('inTransit');

      this._dx = 0;



      let dragPaintLoop = () => {
        if (draging) {
          requestAnimationFrame(dragPaintLoop);

          let prevPos = (this._dx > 0) ? this._dx / 3 : 0;
          let nextPos = (this._dx < 0) ? this._dx : 0;
          let selfPos = (this._dx < 0) ? this._dx / 3 : this._dx;

          if (PREV) PREV.style.transform = 'translateX(' + prevPos + 'px)';
          if (NEXT) NEXT.style.transform = 'translateX(' + nextPos + 'px)';
          SELF.style.transform = 'translateX(' + selfPos + 'px)';

        } else {

          let percent = this._dx / RECT.width;
          let normalized = Math.round(percent) * 100;

          if (this._dx < 0) {
            SELF.addEventListener('transitionend', onTransitionEnd);
            if (NEXT) NEXT.style.transition = 'transform 200ms ease-out';
            if (NEXT) NEXT.style.transform = 'translateX(' + normalized + '%)';
            SELF.style.transform = 'translateX(' + normalized / 3 + '%)';
            SELF.style.transition = 'transform 200ms ease-out';
          } else if (this._dx > 0) {
            SELF.addEventListener('transitionend', onTransitionEnd);
            if (PREV) PREV.style.transition = 'transform 200ms ease-out';
            if (PREV) PREV.style.transform = 'translateX(' + normalized / 3 + '%)';
            SELF.style.transform = 'translateX(' + normalized + '%)';
            SELF.style.transition = 'transform 200ms ease-out';
          } else {
            if (PREV) PREV.classList.remove('inView');
            if (NEXT) NEXT.classList.remove('inView');
          }
        }
      };



      let onTouchMove = event => {
        event.preventDefault();
        this._dx = event.touches[0].pageX - sx;
        if (!PREV && this._dx > 0) this._dx = 0;
        if (!NEXT && this._dx < 0) this._dx = 0;
      };



      let onTransitionEnd = () => {
        if (PREV) PREV.classList.remove('inTransit');
        if (NEXT) NEXT.classList.remove('inTransit')
        SELF.classList.remove('inTransit');
        SELF.removeEventListener('transitionend', onTransitionEnd);
      }



      let onTouchEnd = () => {
        draging = false;
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('touchcancel', onTouchEnd);
      };



      dragPaintLoop();
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
      document.addEventListener('touchcancel', onTouchEnd);
    }
  }

  document.querySelectorAll('.page').forEach(e => { new Page(e); });




})();
