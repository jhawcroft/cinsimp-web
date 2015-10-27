/*
CinsImp
PopupMenu:  A Simple Popup Menu

*********************************************************************************
Copyright (c) 2009-2015, Joshua Hawcroft
All rights reserved.

 May all beings have happiness and the cause of happiness.
 May all beings be free of suffering and the cause of suffering.
 May all beings rejoice for the supreme happiness which is without suffering.
 May all beings abide in the great equanimity; free of attachment and delusion.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the product nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


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
		checkmark: false,
		index: 0
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
		
		item.index = i;
		
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
		
	this._size = [this._div.clientWidth, this._div.clientHeight];
}


PopupMenu.prototype._select = function(in_item)
{
	this._close();
	if (in_item.handler) in_item.handler(in_item.title, in_item.index);
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
	PopupMenu._cover.style.zIndex = 900;
	document.body.appendChild(PopupMenu._cover);
	
	PopupMenu._cover.addEventListener('mousedown', PopupMenu._closeActive);
}


PopupMenu.prototype._show_menu = function()
{
	PopupMenu._active = this;
	
	PopupMenu._installCover();
	
	PopupMenu._cover.style.width = window.innerWidth + 'px';
	PopupMenu._cover.style.height = window.innerHeight + 'px';
	PopupMenu._cover.style.visibility = 'visible';
	
	this._div.style.visibility = 'visible';
}


/*
	Deprecated.
	Use show() instead.
*/
PopupMenu.prototype.open = function(in_loc, in_side)
{
	this._reconstruct();
	
	if (in_side == 'right')
		this._div.style.left = in_loc[0] - this._div.clientWidth +'px';
	else
		this._div.style.left = in_loc[0]+'px';
	this._div.style.top = in_loc[1]+'px';
	
	this._show_menu();
}


/*
	Takes a rect around which the menu should be shown.  Attempts to display the menu
	in the most aesthetically pleasing away, whilst ensuring it remains completely
	within the visible screen/page area.
	Input rect is [left, top, right, bottom].
*/
PopupMenu.prototype.show = function(in_rect)
{
	/* reconstruct the menu content */
	this._reconstruct();
	
	/* position the menu so it's completely within the screen */
	var screen_size = [window.innerWidth, window.innerHeight];
	this._div.style.left = in_rect[0] + 'px';
	if (this._div.offsetLeft + this._size[0] >= screen_size[0])
		this._div.style.left = in_rect[2] - this._size[0] + 'px';
	this._div.style.top = in_rect[3] + 'px';
	if (this._div.offsetTop + this._size[1] >= screen_size[1])
		this._div.style.top = in_rect[1] - this._size[1] + 'px';
		
	/* show the menu */
	this._show_menu();
	
}


CinsImp._script_loaded('popup-menu');

