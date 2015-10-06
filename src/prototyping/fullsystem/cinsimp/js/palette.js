
function Palette(in_div) 
{
	this._init_with_div(in_div);
}


Palette.prototype._init_with_div = function(in_div)
{
	this._div = in_div;
	this._div.className = 'Palette noselect';
		
	this._loc = [in_div.offsetLeft, in_div.offsetTop];
	
	this._titlebar = in_div.getElementsByClassName('VertTitle')[0];
	
	var me = this;
	this._titlebar.addEventListener('mousedown', function(e) { Drag.beginObjectMove(e, me); });
	
	this._closebtn = this._titlebar.getElementsByTagName('img')[0];
	this._closebtn.addEventListener('click', function(e) { me.hide(); e.preventDefault(); e.stopPropagation(); });
}


Palette.prototype.getLoc = function()
{
	return [this._loc[0], this._loc[1]];
}


Palette.prototype.setLoc = function(in_loc)
{
	this._loc = [in_loc[0], in_loc[1]];
	this._div.style.left = this._loc[0] + 'px';
	this._div.style.top = this._loc[1] + 'px';
}


Palette.prototype.hide = function()
{
	this._div.style.visibility = 'hidden';
}


Palette.prototype.show = function()
{
	this._div.style.visibility = 'visible';
}


Palette.prototype.toggle = function()
{
	if (this._div.style.visibility == 'hidden')
		this.show();
	else
		this.hide();
}


Palette.prototype.getVisible = function()
{
	return (this._div.style.visibility != 'hidden');
}





