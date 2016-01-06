(() => {

'use strict';
console.log('init');

NodeList.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.forEach = Array.prototype.forEach;

document.addEventListener('touchstart', e => {
  e.preventDefault();
});

let mod = (num, mod) => {
  return ((num%mod)+mod)%mod;
  // return num -mod * (Math.ceil(num/mod)-1);
}

let rem = (num, denom) => {
  return Math[num > 0 ? 'floor' : 'ceil'](num % denom);
}

// let div = (num, denom) => {
//     return Math[num > 0 ? 'floor' : 'ceil'](num / denom);
// }

// t: iteration
// b: start value
// c: end value
// d: duration
let easeOutQuad = (t, b, c, d) => {
  return -c *(t/=d)*(t-2) + b;
}

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
    this._pulling = false;

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

    if (this._pulling) {
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
    this._pulling = true;
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
    this._pulling = false;
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
  constructor(canvas, options = {}) {

    this._canvas    = canvas;
    this._options   = options;
    this._context   = canvas.getContext('2d');
    this._pulling   = false;
    this._easing    = false;
    this._valueMap  = false;
    this._onChange  = false;
    this._minValue  = -Infinity;
    this._maxValue  = Infinity;
    this._position  = 0;
    this._value     = 0;
    this._step      = 1;
    this._ratio     = window.devicePixelRatio;
    this._height    = canvas.offsetHeight * this._ratio;
    this._width     = canvas.offsetWidth * this._ratio;
    this._unitWidth = Math.round(this._width / 5);
    this._unitCount = Math.round(this._width / this._unitWidth);

    this._colArrow  = '#007EE5';
    this._colGrade  = '#bbb';
    this._colMidle  = '#eee';
    this._colLabel  = '#333';

    this._setDefaults();
    this._startPaintLoop();

    canvas.addEventListener('touchstart', e => this._onTouchStart(e));
  }

  _setDefaults() {
    for (var key in this._options) {
      if (this._options.hasOwnProperty(key)) {
        this['_' + key] = this._options[key];
      }
    }

    this._canvas.width = this._width;
    this._canvas.height = this._height;
    this._context.translate(Math.round(this._width / 2), 0);
    this._context.font = "40px Arial";
  }

  _startPaintLoop() {

    let output = this._context;
    let count  = this._unitCount / 2;
    let unit   = this._unitWidth;
    let width  = this._width;
    let height = this._height;

    let paintLoop = () => {

      if (this._easing) {

        this._position = easeOutQuad(
          this._easing.iteration++,
          this._easing.startPos,
          this._easing.posChange,
          this._easing.duration
        );

        if (this._easing.iteration >= this._easing.duration) {
          this._easing = false;
        };
      }

      let pos = mod(this._position, unit) - 2;
      output.clearRect(-width / 2, 0, width, height);

      output.fillStyle = this._colGrade;
      for (var i = 0; i <= count + 1; i++) {
        output.fillRect(pos + (i * -unit), 75, 4, height - 90);
        output.fillRect(pos + (i * +unit), 75, 4, height - 90);
      };

      output.fillStyle = this._colLabel;
      for (var i = 0; i <= count + 1; i++) {
        output.fillText('text', pos + (i * -unit)
          - (output.measureText('text').width / 2), 40);
        output.fillText('text', pos + (i * +unit)
          - (output.measureText('text').width / 2), 40);
      };

      output.fillStyle = this._colArrow;
      output.fillRect(-2, 60, 4, height);

      if (this._pulling || this._easing) {
        requestAnimationFrame(paintLoop);
      }
    };

    paintLoop();
  };

  _onTouchStart(event) {
    event.preventDefault();
    event.stopPropagation();

    let lastPosition = event.touches[0].pageX;
    let lastChange   = 0;

    this._easing  = null;
    this._pulling = true;
    this._startPaintLoop();

    let onTouchMove = event => {
      let newPos = event.touches[0].pageX;
      lastChange = (newPos - lastPosition) * this._ratio;
      this._position += lastChange;
      lastPosition = newPos;
    }

    let onTouchEnd = () => {

      let velocity = Math.min(lastChange, 300);
      let adjust = 0;

      if (velocity < 0) {
        adjust = -mod(this._position, this._unitWidth);
      } else {
        adjust = -mod(this._position, this._unitWidth) + this._unitWidth;
      }

      this._easing = {
        iteration: 0,
        startPos: this._position,
        posChange: adjust + Math.round(velocity / 16) * this._unitWidth,
        duration: 24
      };

      this._pulling = false;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }
}

let yearSelector = new Selector(
  document.querySelector('.selector--year'),
  {
    minValue: 1000,
    maxValue: 3000,
    value: 2015,
    mapFunc: val => {
      return val + 1;
    }
  }
);

let monthSelector = new Selector(
  document.querySelector('.selector--month'),
  {
    minValue: 0,
    maxValue: 12,
    value: 1,
    mapFunc: val => {
      let months = [
        'JAN', 'FEB', 'MAR',
        'APR', 'MAJ', 'JUN',
        'JUL', 'AUG', 'SEP',
        'OKT', 'NOV', 'DEC'
      ];
      return months[val];
    }
  }
);

let dateSelector = new Selector(
  document.querySelector('.selector--date'),
  {
    minValue: 0,
    maxValue: 31,
    value: 1,
    mapFunc: val => {
      return val + 1;
    }
  }
);

let hourSelector = new Selector(
  document.querySelector('.selector--time'),
  {
    minValue: 0,
    maxValue: 12,
    value: 8,
    step: 0.25,
    mapFunc: val => {
      return val + 1;
    }
  }
);

})();
