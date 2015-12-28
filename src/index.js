(() => {

'use strict';
console.log('init');

document.addEventListener('touchstart', e => {
  e.preventDefault();
});

NodeList.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.forEach = Array.prototype.forEach;

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
    this._btns = element.getElementsByClassName('button');
    this._sx = 0;
    this._dx = 0;
    this._draging = false;

    element.addEventListener('touchstart', e => this._onTouchStart(e));

    this._btns.forEach(b => {
      b.addEventListener('touchstart', e => this._onbtnTouchStart(e));
    });
  }

  static init() {
    document.querySelectorAll('.page').forEach(e => {
      new Page(e);
    });
  }

  _addTransit() {
    this._self.classList.add('page--smooth', 'page--shadow');
    if (this._prev) this._prev.classList.add('page--smooth');
    if (this._next) this._next.classList.add('page--smooth', 'page--shadow');
    document.body.classList.add('noEvent');
  }

  _removeTransit() {
    this._self.classList.remove('page--smooth', 'page--shadow');
    if (this._prev) this._prev.classList.remove('page--smooth');
    if (this._next) this._next.classList.remove('page--smooth', 'page--shadow');
    document.body.classList.remove('noEvent');
  }

  _goPrevPage() {
    this._self.addEventListener('transitionend', () => this._onTransitionEnd());
    this._addTransit();

    this._self.style.transform =
      'translateX(100%)';

    if (this._prev) this._prev.style.transform =
      'translateX(0%)';
  }

  _goNextPage() {
    this._self.addEventListener('transitionend', () => this._onTransitionEnd());
    this._addTransit();

    this._self.style.transform =
      'translateX(-33%)';

    if (this._next) this._next.style.transform =
      'translateX(0%)';
  }

  _onTransitionEnd() {
    this._removeTransit();
    this._self.removeEventListener('transitionend', () => this._onTransitionEnd());
  }

  _dragPaintLoop() {
    let percent = 0;

    if (this._draging) {
      requestAnimationFrame(() => this._dragPaintLoop());
      percent = (this._dx / this._size.width) * 100;

    } else {

      percent = Math.round(this._dx / this._size.width) * 100;

      if (this._dx === 0 || this._dx === 100) {

        this._self.classList.remove('page--shadow');
        if (this._next) this._next.classList.remove('page--shadow');

      } else {

        this._self.addEventListener('transitionend', () => this._onTransitionEnd());
        this._addTransit();
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

    document.addEventListener('touchmove', e => this._onTouchMove(e));
    document.addEventListener('touchend', () => this._onTouchEnd());
    document.addEventListener('touchcancel', () => this._onTouchEnd());
  }

  _onTouchMove(event) {
    this._dx = event.touches[0].pageX - this._sx;
    if (!this._prev && this._dx > 0) this._dx = 0;
    if (!this._next && this._dx < 0) this._dx = 0;
  };

  _onTouchEnd() {
    this._draging = false;
    document.removeEventListener('touchmove', e => this._onTouchMove(e));
    document.removeEventListener('touchend', () => this._onTouchEnd());
    document.removeEventListener('touchcancel', () => this._onTouchEnd());
  }

  _onbtnTouchStart(event) {
    event.stopPropagation();
    event.preventDefault()
    let startPos = {
      x: event.touches[0].pageX,
      y: event.touches[0].pageY,
    }

    let self = event.target;
    let distance = 0;

    let onbtnTouchMove = event => {
      let dx = Math.abs(startPos.x - event.touches[0].pageX);
      let dy = Math.abs(startPos.y - event.touches[0].pageY);
      distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 10) {
        return;
      }
    }

    let onbtnTouchEnd = () => {
      if (distance < 10) {
        let action = self.getAttribute('data-action');

        switch(action) {

          case 'prevPage':
          this._goPrevPage();
          break;

          case 'nextPage':
          this._goNextPage();
          break;
        }
      }

      document.removeEventListener('touchmove', onbtnTouchMove);
      document.removeEventListener('touchend', onbtnTouchEnd);
    }

    document.addEventListener('touchmove', onbtnTouchMove);
    document.addEventListener('touchend', onbtnTouchEnd);
  }
}
Page.init();




class Selector {
  constructor(element) {
    this._canvas    = element;
    this._context   = element.getContext('2d');
    this._draging   = false;
    this._animating = false;
    this._position  = 0;
    this._maxValue  = 2026;   // false, infinite positive
    this._minValue  = 2006;   // false, infinite negative
    this._value     = 2016;
    this._step      = 1;      // 0.25 for time
    this._fraction  = 1;      // 60 (0.25 * 60 = 15m)
    this._loop      = false;
    this._map       = false;  // [JAN, FEB, MAR, ...]
    this._labels    = true;

    this._colorArrow    = '#009';
    this._colorStep     = '#999';
    this._colorFraction = '#999';
    this._colorLabel    = '#333';
    this._colorTrack    = '#999';

    this._height = element.offsetHeight;
    this._width = element.offsetWidth;
    this._unitWidth = Math.round(this._width / 4);
    this._units = Math.ceil(this._unitWidth / this._width);

    this._canvas.width = this._width;
    this._canvas.height = this._height;

    this._paintLoop();

    element.addEventListener('touchstart', e => this._onTouchStart(e));
  }

  _paintLoop() {

    const ctx = this._context;

    ctx.clearRect(0, 0, this._width, this._height);

    if (this._draging || this._animating) {
      requestAnimationFrame(() => this._paintLoop());

    } else {
      console.log('last paint');
    }


    for (var i = 0; i < 5; i++) {
      let x = this._position + (this._unitWidth * i);
      ctx.fillStyle = this._colorStep;
      ctx.fillRect (x, 0, 2, this._height);
    };


  }

  _onTouchStart(event) {
    event.preventDefault();
    event.stopPropagation();

    let lastPos = event.touches[0].pageX;

    this._draging = true;
    this._animating = true;
    this._paintLoop();

    let onTouchMove = event => {
      let newPos = event.touches[0].pageX;
      this._position += newPos - lastPos;
      lastPos = newPos;
      console.log(this._position);
    }

    let onTouchEnd = () => {
      this._draging = false;
      this._animating = false;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }
}

new Selector(document.querySelector('.selector--year'));
new Selector(document.querySelector('.selector--month'));
new Selector(document.querySelector('.selector--date'));
new Selector(document.querySelector('.selector--time'));

})();
