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


function ViewObject(in_type, in_view) 
{
	if (!in_view) return;

	this._div = document.createElement('div');
	this._div.classList.add('Object');
	
	this._attrs = {};
	this._view = in_view;
	
	this._attrs[ViewObject.ATTR_TYPE] = in_type;
	this._attrs[ViewObject.ATTR_ID] = in_view._next_id ++;
	this._attrs[ViewObject.ATTR_NUM] = 1;
	this._attrs[ViewObject.ATTR_LOC] = [0,0];
	this._attrs[ViewObject.ATTR_SIZE] = [50,50];
	
	this._selected = false;
	
	this.__install_handlers();
}

ViewObject.TYPE_BUTTON = 0;
ViewObject.TYPE_FIELD = 1;

ViewObject.ATTR_TYPE = -1;
ViewObject.ATTR_ID = -2;
ViewObject.ATTR_NUM = -3;
ViewObject.ATTR_LOC = -4;
ViewObject.ATTR_SIZE = -5;


ViewObject.prototype.get_def = function()
{
	return this._attrs;
}


ViewObject.prototype.set_def = function(in_def)
{
	for (var attr_name in in_def)
	{
		var attr_value = in_def[attr_name];
		this.set_attr(attr_name * 1, attr_value);
	}
}


ViewObject.prototype.get_raw_content = function()
{
}


ViewObject.prototype.set_raw_content = function(in_content)
{
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


ViewObject.prototype._reconfigure = function()
{
	for (var attr_name in this._attrs)
		this._attribute_changed(attr_name * 1, this._attrs[attr_name]);
}


ViewObject.prototype._set_selected = function(in_selected)
{
	//this._div.classList.toggle('Selected', in_selected);
	
	this._selected = in_selected;
	if (in_selected)
		this._div.style.border = '3px solid blue';
	else
		this._reconfigure();
	
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
	this._attrs[ViewObject.ATTR_SIZE] = this._size;
	this._div.style.width = in_size[0] + 'px';
	this._div.style.height = in_size[1] + 'px';
	
	if (this._resized)
		this._resized();
	
	if (this._selected)
		this._div.style.border = '3px solid blue';
	//this._reconfigure();
}


ViewObject.prototype.get_size = function()
{
	return this._size;
}


ViewObject.prototype.set_loc = function(in_loc)
{
	this._loc = [in_loc[0], in_loc[1]];
	this._attrs[ViewObject.ATTR_LOC] = this._loc;
	this._div.style.left = in_loc[0] + 'px';
	this._div.style.top = in_loc[1] + 'px';
}


ViewObject.prototype.get_loc = function()
{
	return this._loc;
}


ViewObject.prototype.set_attr = function(in_attr, in_value)
{
	switch (in_attr)
	{
	case ViewObject.ATTR_LOC:
		this.set_loc(in_value);
		break;
	case ViewObject.ATTR_SIZE:
		this.set_size(in_value);
		break;
	default:
		this._attrs[in_attr] = in_value;
	}
	this._attribute_changed(in_attr, in_value);
}


ViewObject.prototype.get_attr = function(in_attr)
{
	return this._attrs[in_attr];
}


ViewObject.prototype._layer_visibility = function(in_visible)
{
	this._div.style.visibility = (in_visible ? 'visible' : 'hidden');
}





