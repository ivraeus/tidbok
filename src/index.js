(() => {

'use strict';
console.log('init');

NodeList.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.forEach = Array.prototype.forEach;
document.addEventListener('touchstart', e => e.preventDefault());

let mod = (num, mod) => {
  // var remain = num % mod;
  // return Math.floor(remain >= 0 ? remain : remain + mod);
  return ((num%mod)+mod)%mod;
};

let rem = (num, denom) => {
  return Math[num > 0 ? 'floor' : 'ceil'](num % denom);
};

let div = (num, denom) => {
    return Math[num > 0 ? 'floor' : 'ceil'](num / denom);
};

let between = (x, min, max) => {
  return x >= min && x <= max;
};

// t: iteration
// b: start value
// c: end value
// d: duration
let easeOutQuad = (t, b, c, d) => {
  return -c *(t/=d)*(t-2) + b;
};

let easeOutQuart = (t, b, c, d) => {
  return -c * ((t=t/d-1)*t*t*t - 1) + b;
};

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
    this._onChange  = false;
    this._running   = false;
    this._minValue  = -Infinity;
    this._maxValue  = Infinity;
    this._position  = 0;
    this._value     = 0;
    this._valueMap  = 0;
    this._step      = 0;
    this._ratio     = window.devicePixelRatio;
    this._height    = canvas.offsetHeight * this._ratio;
    this._width     = canvas.offsetWidth * this._ratio;
    this._unitWidth = Math.round(this._width / 5);
    this._unitCount = Math.round(this._width / this._unitWidth);

    this._colArrow  = '#007EE5';
    this._colGrade  = '#bbb';
    this._colStep   = '#eee';
    this._colLabel  = '#333';

    this._setDefaults();
    canvas.addEventListener('touchstart', e => this._onTouchStart(e));
  }

  _setDefaults() {
    for (var key in this._options) {
      if (this._options.hasOwnProperty(key)) {
        this['_' + key] = this._options[key];
      }
    }

    this._maxValue++;
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    this._context.translate(Math.round(this._width / 2), 0);
    this._context.font = "40px Arial";
    this._paint();
  }

  _getIndex() {
    return Math.round((-this._position /
        this._unitWidth) % this._unitWidth);
  }

  _getValue(index) {
    return mod(index,
      this._maxValue);
  }

  _pullLoop() {
    if (!this._easing) {
      this._paint();
      requestAnimationFrame(() => this._pullLoop());
    }
  };

  _easeLoop(time) {

    if (!this._pulling && this._easing.iteration <= this._easing.duration) {

      let now = window.performance.now();
      let delta = 1000 / (now - this._easing.last) / 60;
      this._easing.last = now;


      this._position = easeOutQuad(
        this._easing.iteration++,
        this._easing.start,
        this._easing.shift,
        this._easing.duration
      );

      this._paint();
      requestAnimationFrame(() => this._easeLoop());
      // setTimeout(() => this._easeLoop(), 1000 / 30);
    } else {
      this._easing = false;
    }
  }

  _paint() {
    let pos = (this._position % this._unitWidth) - 2;
    this._context.clearRect(-this._width / 2, 0, this._width, this._height);

    this._context.fillStyle = this._colGrade;
    for (var i = 0; i <= this._unitCount / 2 + 1; i++) {
      this._context.fillRect(pos + (i * -this._unitWidth),
        75, 4, this._height - 90);
      if (i !== 0) {
        this._context.fillRect(pos + (i * +this._unitWidth),
          75, 4, this._height - 90);
      }
    };

    if (this._step) {
      this._context.fillStyle = 'this._colStep';
      for (var i = 0; i <= this._unitCount / 2 + 1; i++) {
        let t = 4;
        while(t-- > 1) {
          this._context.fillRect(pos + (i * -this._unitWidth) - (t
            * this._step * this._unitWidth) , 90, 4, this._height - 120);
          this._context.fillRect(pos + (i * +this._unitWidth) + (t
            * this._step * this._unitWidth) , 90, 4, this._height - 120);
        };
      };
    }

    let value = '';
    let index = Math[this._position < 0 ? 'floor' : 'ceil'](
      (-this._position / this._unitWidth) % this._unitWidth)
    this._context.fillStyle = this._colLabel;
    for (var i = 0; i <= this._unitCount / 2 + 1; i++) {
      value = (this._valueMap) ? this._valueMap(this._getValue(index
        - i)) : this._getValue(index - i);
      this._context.fillText(value, pos + (i * -this._unitWidth)
        - (this._context.measureText(value).width / 2), 40);
      if (i !== 0) {
        value = (this._valueMap) ? this._valueMap(this._getValue(index
        + i)) : this._getValue(index + i);
        this._context.fillText(value, pos + (i * +this._unitWidth)
          - (this._context.measureText(value).width / 2), 40);
      }
    };

    this._context.fillStyle = this._colArrow;
    this._context.fillRect(-2, 60, 4, this._height);
  }

  _onTouchStart(event) {
    this._pulling = true;
    this._easing = false;

    event.preventDefault();
    event.stopPropagation();

    let lastPos = event.touches[0].pageX * this._ratio;
    let lastTime = window.performance.now();

    this._pullLoop();

    let frameIndex = 0;
    let frameSpeed = [];
    let frameDelta = [];

    let onTouchMove = event => {
      let newTime = window.performance.now();
      let newPos = event.touches[0].pageX * this._ratio;
      this._position += newPos - lastPos
      frameSpeed[frameIndex] = newPos - lastPos;
      frameDelta[frameIndex] = newTime - lastTime;
      lastTime = newTime;
      lastPos = newPos;
      if(++frameIndex >= 4) frameIndex = 0;
    }

    let onTouchEnd = () => {
      this._pulling = false;

      // let speed = (frameSpeed.length) ? frameSpeed.reduce(
      //   (prev, curr) => prev + curr) / frameSpeed.length : 0;
      // let delta = (frameDelta.length) ? frameDelta.reduce(
      //   (prev, curr) => prev + curr) / frameDelta.length : 0;

      // let shift = 0;
      // let adapt = 0;
      // let turn  = (this._position < 0) ? -1 : 0;
      // let inTransit = Boolean(mod(Math.round(this._position)
      //   , this._unitWidth));

      // if (Math.abs(speed) < 3) { // Tap

      //   if (inTransit) { // just stop scroll.
      //     speed = 30;
      //     adapt = mod(this._position, this._unitWidth);
      //   } else {         // go to clicked position
      //     speed = 30;
      //     adapt = rem(this._position - (lastPos - this._width /
      //       2), this._unitWidth) + (lastPos - this._width / 2);

      //     // rem on negative position and mod on positive mabye?
      //   }

      // } else { // Swipe or atleast not tap
      //   shift = Math.abs(speed) * (speed / 3.6);
      //   adapt = mod(this._position + shift, this._unitWidth);
      // }

      // this._easing = {
      //   iteration: 0,
      //   start: this._position,
      //   shift: Math.round(shift - adapt),
      //   duration: Math.round(Math.abs(speed)),
      //   last: window.performance.now()
      // }

      // this._easeLoop();

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
    maxValue: 11,
    value: 1,
    valueMap: val => {
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
    minValue: 0.25,
    maxValue: 12,
    value: 8,
    step: 0.25,
    mapFunc: val => {
      return val + 1;
    }
  }
);

})();
