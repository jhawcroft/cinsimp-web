
function Dialog(in_title, in_frame)
{
	Dialog._stack.push(this);

	this._cover = document.createElement('div');
	this._cover.className = 'ModalCover';
	this._cover.style.height = window.innerHeight + 'px';
	
	this._window = new Window(in_title, in_frame);
	this._window.centre();
	this._window.zIndex = 1000;
	
	document.body.appendChild(this._cover);
	this._window.show();
}

Dialog._stack = [];


Dialog.prototype.getRoot = function()
{
	return this._window.getRoot();
}


Dialog.getTop = function()
{
	return Dialog._stack[Dialog._stack.length-1];
}


Dialog.prototype.show = function()
{
	this._window.show();
}


Dialog.prototype.hide = function()
{
	this._window.hide();
}


Dialog.prototype.close = function()
{
	this._window.close();
	this._window = null;
	document.body.removeChild(this._cover);
	this._cover = null;
}