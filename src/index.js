(() => {

'use strict';
console.log('init');

document.addEventListener('touchstart', e => {
  e.preventDefault();
});

Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
};

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

function linearEase(currentIteration, startValue, changeInValue, totalIterations) {
  return changeInValue * currentIteration / totalIterations + startValue;
}

function easeOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
  return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
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
  constructor(canvas, options = {}) {
    this._canvas    = canvas;
    this._options   = options;
    this._context   = canvas.getContext('2d');
    this._ratio     = window.devicePixelRatio;
    this._draging   = false;
    this._easing    = false;
    this._position  = 0;
    this._velocity  = 0;
    this._startVal  = 0;
    this._minValue  = -Infinity;
    this._maxValue  = Infinity;
    this._value     = 0;
    this._mapFunc   = 0;
    this._leap      = 1;
    this._step      = 0;

    this._colorArrow    = '#007EE5';
    this._colorGrade    = '#ddd';
    this._colorLabel    = '#333';

    this._height = canvas.offsetHeight * this._ratio;
    this._width = canvas.offsetWidth * this._ratio;
    this._unitWidth = Math.round(this._width / 5);
    this._units = Math.round(this._width / this._unitWidth);
    this._canvas.width = this._width;
    this._canvas.height = this._height;

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
  }

  _startPaintLoop() {

    let output = this._context;
    let unit = this._unitWidth;
    let leap = this._leap;
    let step = this._step;
    let steps = (step) ? leap / step : 1;

    let itteration = 0;
    let duration = 40;

    let paintLoop = () => {

      let fraction = this._position / unit;

      if (this._draging) {
        requestAnimationFrame(paintLoop);
      } else if (this._easing) {
        requestAnimationFrame(paintLoop);

          this._position = easeOutCubic(
            itteration,
            this._startVal,
            this._velocity,
            duration
          );

          if (itteration >= duration) {
            this._easing = false;
          };

          itteration ++;

      }

      if (this._position >= unit) {
        this._position -= unit;
        this._startVal -= unit;
        this._value -= leap;
      } else if (this._position <= -unit) {
        this._position += unit;
        this._startVal += unit;
        this._value += leap;
      }

      output.clearRect(0, 0, this._width, this._height);
      output.font = "40px Arial";

      for (let i = 0; i < this._units + 2; i++) {

        let text = (this._mapFunc)
          ? this._mapFunc((this._value - 4 + i).mod(this._maxValue))
          : (this._value - 4 + i).mod(this._maxValue);

        let gradePos = -unit / 2 + this._position + (unit * i) - 2;
        let textPos = gradePos - output.measureText(text).width / 2;

        output.fillStyle = this._colorLabel;
        output.fillText(text, textPos, 70);

        output.fillStyle = this._colorGrade;
        output.fillRect(gradePos, 100, 4, this._height - 140);

        for (let t = 1; t < steps; t++) {
          output.fillRect(gradePos + (unit * step * t), 120, 4, this._height - 160);
        };
      };

      output.fillRect (0, this._height - 44, this._width, 4);

      output.fillStyle = this._colorArrow;
      output.fillRect((this._width / 2) - 2, 90, 4, this._height - 130);
    };

    paintLoop();
  };

  _onTouchStart(event) {
    event.preventDefault();
    event.stopPropagation();

    let lastPos = event.touches[0].pageX;
    let lastChange = 0;
    let lastTime = 0;

    this._draging = true;
    this._startPaintLoop();

    let onTouchMove = event => {
      let newPos = event.touches[0].pageX;
      lastChange = (newPos - lastPos) * this._ratio;
      lastTime = window.performance.now();
      this._position += lastChange;
      lastPos = newPos;
    }

    let onTouchEnd = event => {

      let leap = this._leap;
      let step = this._step;
      let unit = this._unitWidth;
      let steps = (step) ? leap / step : 1;
      let fraction = this._position / unit;
      let interpolation = -unit * Math.round(fraction * steps) / steps;
      let deltaTime = window.performance.now() - lastTime;

      this._velocity = (Math.round(lastChange / deltaTime) * this._unitWidth);
      this._startVal = interpolation;
      this._draging = false;
      this._easing = true;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }
}

new Selector(
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

new Selector(
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

new Selector(
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

new Selector(
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
