
function Window(in_title, in_frame)
{
	this._div = document.createElement('div');	
	this._div.className = 'Window';
	var temp = document.createElement('div');
	temp.className = 'WindowBorder';
	this._div.appendChild(temp);
	this._titleBar = document.createElement('div');
	this._titleBar.className = 'WindowTitle';
	temp.appendChild(this._titleBar);
	this._contentArea = document.createElement('div');
	this._contentArea.className = 'WindowContent';
	temp.appendChild(this._contentArea);
	
	this._domTitle = document.createTextNode(in_title);
	this._titleBar.appendChild(this._domTitle);
	
	this.setFrame(in_frame);
}


Window.prototype.setFrame = function(in_frame)
{
	this._frame = in_frame;
	this._div.style.left = in_frame.left + 'px';
	this._div.style.top = in_frame.top + 'px';
	this._contentArea.style.width = in_frame.width + 'px';
	this._contentArea.style.height = in_frame.height + 'px';
}


Window.prototype.centre = function()
{
	this._frame.left = (window.innerWidth - this._frame.width) / 2;
	this._frame.top = (window.innerHeight - this._frame.height) / 3;
	this.setFrame(this._frame);
}


Window.prototype.getRoot = function()
{
	return this._contentArea;
}


Window.prototype.show = function()
{
	document.body.appendChild(this._div);
}


Window.prototype.hide = function()
{
	document.body.removeChild(this._div);
}


Window.prototype.close = function()
{
	this.hide();
}

