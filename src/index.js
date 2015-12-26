(() => {

'use strict';
console.log('init');

document.addEventListener('touchstart', e => {
  e.preventDefault();
});

NodeList.prototype.forEach = Array.prototype.forEach;

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
    this._size = element.getBoundingClientRect();
    this._sx = 0; // touch start
    this._dx = 0; // touch delta
    this._draging = false;

    // bind all functions to this
    [
      '_onTransitionEnd',
      '_dragPaintLoop',
      '_onTouchStart',
      '_onTouchMove',
      '_onTouchEnd'
    ].forEach(f => {
      this[f] = this[f].bind(this);
    });

    element.addEventListener('touchstart', this._onTouchStart);
  }

  static init() {
    document.querySelectorAll('.page').forEach(e => {
      new Page(e);
    });
  }

  _onTransitionEnd() {
    if (this._prev) this._prev.classList.remove('page--smooth');
    if (this._next) this._next.classList.remove('page--smooth', 'page--shadow');
    this._self.classList.remove('page--smooth', 'page--shadow');
    this._self.removeEventListener('transitionend', this._onTransitionEnd);
    document.body.classList.remove('noEvent');
  }

  _dragPaintLoop() {

    let percent = 0;

    if (this._draging) {

      requestAnimationFrame(this._dragPaintLoop);
      percent = (this._dx / this._size.width) * 100;

    } else {

      percent = Math.round(this._dx / this._size.width) * 100;

      if (this._dx === 0 || this._dx === 100) {

        this._self.classList.remove('page--shadow');
        if (this._next) this._next.classList.remove('page--shadow');

      } else {

        this._self.addEventListener('transitionend', this._onTransitionEnd);
        this._self.classList.add('page--smooth');
        if (this._prev) this._prev.classList.add('page--smooth');
        if (this._next) this._next.classList.add('page--smooth');
        document.body.classList.add('noEvent');
      }
    }

    let prevPos = Math.max(-33.3 + (percent / 3), -33.3);
    let selfPos = (this._dx < 0) ? percent / 3 : percent;
    let nextPos = Math.min(100 + percent, 100);

    if (this._prev) this._prev.style.transform =
      'translateX(' + prevPos + '%)';

    this._self.style.transform =
      'translateX(' + selfPos + '%)';

    if (this._next) this._next.style.transform =
      'translateX(' + nextPos + '%)';
  }

  _onTouchStart(event) {

    event.stopPropagation();
    event.preventDefault();
    if (event.touches.length > 1) return;

    this._self.classList.add('page--shadow');
    if (this._next) this._next.classList.add('page--shadow');
    this._sx = event.touches[0].pageX;
    this._dx = 0;
    this._draging = true;
    this._dragPaintLoop();

    document.addEventListener('touchmove', this._onTouchMove);
    document.addEventListener('touchend', this._onTouchEnd);
    document.addEventListener('touchcancel', this._onTouchEnd);
  }

  _onTouchMove(event) {
    this._dx = event.touches[0].pageX - this._sx;
    if (!this._prev && this._dx > 0) this._dx = 0;
    if (!this._next && this._dx < 0) this._dx = 0;
  };

  _onTouchEnd() {
    this._draging = false;
    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);
    document.removeEventListener('touchcancel', this._onTouchEnd);
  }

}

Page.init();

})();
