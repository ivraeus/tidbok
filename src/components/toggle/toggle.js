class Toggle {
  constructor (element) {
    this._element = element;
    this._element.addEventListener('touchend', event => this._onInputEnd(event));
    this._element.addEventListener('mouseup', event => this._onInputEnd(event));
  }

  _onInputEnd(event) {
    event.preventDefault();
    console.log(this);
  }
}

document.addEventListener('DOMContentLoaded', () =>
  document.querySelectorAll('.toggle').forEach((elm) => {
    new Toggle(elm);
  }));

function supportsImports() {
  return 'import' in document.createElement('link');
}

console.log(supportsImports());
