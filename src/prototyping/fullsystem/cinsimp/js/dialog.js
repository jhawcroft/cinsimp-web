
function Dialog(in_element) 
{
	
	this._init_with_element(in_element);
}


Dialog.prototype._init_with_element = function(in_element)
{
	this._div = in_element;
}


Dialog.prototype.show = function()
{
	//if (!this._div.parentElement)
	//	document.body.appendChild(this._div);
	this._div.style.visibility = 'visible';
}


Dialog.prototype.hide = function()
{
	this._div.style.visibility = 'hidden';
	document.body.removeChild(this._div);
}


