/*
CinsImp
View Object; Button or Field

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


function ViewObject(in_view) 
{
	this._div = document.createElement('div');
	this._div.classList.add('Object');
	
	this._attrs = {};
	this._view = in_view;
	
	//this._selected = false;
	
	this.__install_handlers();
}


ViewObject.prototype.kill = function()
{
	this._div.parentElement.removeChild(this._div);
	this._div = null;
}


ViewObject.prototype.__install_handlers = function()
{
	this._div.addEventListener('mousedown', this.__handle_point_start.bind(this));
}


ViewObject.prototype.__handle_point_start = function(in_event)
{
	if (this._view._mode == View.MODE_AUTHORING)
	{
		Util.update_modifiers(in_event);
		this._view._author_point_start(this, [in_event.pageX, in_event.pageY]);
		
		in_event.preventDefault();
		in_event.stopPropagation();
		return;
	}
}


ViewObject.prototype._handle_resize_start = function(in_event)
{
	Drag.begin_resize([in_event.pageX, in_event.pageY], [this]);
	
	in_event.preventDefault();
	in_event.stopPropagation();
	return;
}


ViewObject.prototype._set_selected = function(in_selected)
{
	//this._div.classList.toggle('Selected', in_selected);
	
	if (in_selected)
		this._div.style.border = '3px solid blue';
	else
		this._reconfigure();
	//this._div.style.outline = 'none';
	//this._div.style.visibility = 'visible';
	
	if (in_selected && (!this._drag_handle))
	{
		this._drag_handle = document.createElement('div');
		this._drag_handle.className = 'ResizeHandle';
		this._div.appendChild(this._drag_handle);
		
		this._drag_handle.addEventListener('mousedown', this._handle_resize_start.bind(this));
	}
	else if ((!in_selected) && this._drag_handle)
	{
		this._div.removeChild(this._drag_handle);
		this._drag_handle = null;
	}
}


ViewObject.prototype.get_type = function()
{
	return 'object';
}


ViewObject.prototype.set_size = function(in_size)
{
	this._size = [in_size[0], in_size[1]];
	this._div.style.width = in_size[0] + 'px';
	this._div.style.height = in_size[1] + 'px';
}


ViewObject.prototype.get_size = function()
{
	return this._size;
}


ViewObject.prototype.set_loc = function(in_loc)
{
	this._loc = [in_loc[0], in_loc[1]];
	this._div.style.left = in_loc[0] + 'px';
	this._div.style.top = in_loc[1] + 'px';
}


ViewObject.prototype.get_loc = function()
{
	return this._loc;
}


ViewObject.prototype.set_attr = function(in_attr, in_value)
{
	this._attrs[in_attr] = in_value;
}


ViewObject.prototype.get_attr = function(in_attr)
{
	return this._attrs[in_attr];
}


ViewObject.prototype._layer_visibility = function(in_visible)
{
	this._div.style.visibility = (in_visible ? 'visible' : 'hidden');
}





