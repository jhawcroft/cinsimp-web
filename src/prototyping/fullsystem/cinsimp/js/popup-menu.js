
function PopupMenu() 
{
	this._div = document.createElement('div');
	this._div.className = 'PopupMenu';
	this._div.style.zIndex = 1000;
	
	this._items = [];
}


PopupMenu._cover = null;


PopupMenu.prototype.appendItem = function(in_title, in_handler)
{
	var item = {
		title: in_title,
		handler: in_handler,
		checkmark: false
	};
	this._items.push(item);
	return item;
}


PopupMenu.prototype.item = function(in_index)
{
	return this._items[in_index];
}


PopupMenu.prototype._reconstruct = function()
{
	if (this._div.parentElement)
		document.body.removeChild(this._div);

	this._div.innerHTML = ''; // might leak on IE
	var dom_list = document.createElement('ul');
	for (var i = 0; i < this._items.length; i++)
	{
		var item = this._items[i];
		var dom_item = document.createElement('li');
		if (item.title.substr(0, 1) == '-')
			dom_item.className = 'Separator';
		else
		{
			dom_item.appendChild(document.createTextNode(item.title));
			if (item.checkmark)
				dom_item.className += ' Checked';
		}
		dom_list.appendChild(dom_item);
		
		dom_item.addEventListener('mousedown', this._select.bind(this, item));
	}
	this._div.appendChild(dom_list);
	
	this._div.style.visibility = 'hidden';
	if (!this._div.parentElement)
		document.body.appendChild(this._div);
}


PopupMenu.prototype._select = function(in_item)
{
	this._close();
	if (in_item.handler) in_item.handler();
}


PopupMenu.prototype._close = function()
{
	PopupMenu._active = null;
	
	this._div.style.visibility = 'hidden';
	PopupMenu._cover.style.visibility = 'hidden';
}


PopupMenu._closeActive = function()
{
	if (PopupMenu._active) PopupMenu._active._close();
}


PopupMenu._installCover = function()
{
	if (PopupMenu._cover) return;
	PopupMenu._cover = document.createElement('div');
	PopupMenu._cover.className = 'Cover noselect';
	PopupMenu._cover.width = window.innerWidth + 'px';
	PopupMenu._cover.style.zIndex = 900;
	document.body.appendChild(PopupMenu._cover);
	
	PopupMenu._cover.addEventListener('mousedown', PopupMenu._closeActive);
}


PopupMenu.prototype.open = function(in_loc, in_side)
{
	PopupMenu._active = this;
	
	this._reconstruct();
	
	if (in_side == 'right')
		this._div.style.left = in_loc[0] - this._div.clientWidth +'px';
	else
		this._div.style.left = in_loc[0]+'px';
	this._div.style.top = in_loc[1]+'px';
	
	PopupMenu._installCover();
	PopupMenu._cover.style.width = window.innerWidth + 'px';
	PopupMenu._cover.style.height = window.innerHeight + 'px';
	PopupMenu._cover.style.visibility = 'visible';
	
	this._size = [this._div.clientWidth, this._div.clientHeight];
	this._div.style.visibility = 'visible';
}



