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

var CinsImp = CinsImp || {};
CinsImp.Model = CinsImp.Model || {};

var Model = CinsImp.Model;



Model.LayerObject = function(in_type, in_view, in_bkgnd) 
{
	if (!in_view) return;
	
	this._num_tag = null;
	this._is_bkgnd = in_bkgnd;
	
	this._rb = [0,0];
	this._loc = [0,0];
	this._size = [0,0];

	this._div = document.createElement('div');
	this._div.classList.add('Object');
	this._div.classList.add('o');
	this._inner = null;
	
	this._attrs = {};
	this._view = in_view;
	
	this._attrs[LayerObject.ATTR_TYPE] = in_type;
	this._attrs[LayerObject.ATTR_ID] = in_view._next_id ++;
	this._attrs[LayerObject.ATTR_PART_NUM] = 1;
	this._attrs[LayerObject.ATTR_KLAS_NUM] = 1;
	this._attrs[LayerObject.ATTR_LOC] = [0,0];
	this._attrs[LayerObject.ATTR_SIZE] = [50,50];
	this._attrs[LayerObject.ATTR_NAME] = '';
	this._attrs[LayerObject.ATTR_SHARED] = false;
	this._attrs[LayerObject.ATTR_SEARCHABLE] = true;
	this._attrs[LayerObject.ATTR_VISIBLE] = true;
	this._attrs[LayerObject.ATTR_SCRIPT] = {'content':'','selection':0};
	this._attrs[LayerObject.ATTR_DISABLED] = false;
	this._attrs[LayerObject.ATTR_TALIGN] = Text.ALIGN_LEFT;
	this._attrs[LayerObject.ATTR_TFONT] = 'sans-serif';
	this._attrs[LayerObject.ATTR_TSIZE] = 12;
	this._attrs[LayerObject.ATTR_TSTYLE] = 0;
	this._attrs[LayerObject.ATTR_THEIGHT] = 0;
	this._attrs[LayerObject.ATTR_COLOR] = [1,1,1];
	this._attrs[LayerObject.ATTR_SHADOW] = false;
	
	this._selected = false;
	
	this.__install_handlers();
}
var LayerObject = Model.LayerObject;



LayerObject.TYPE_BUTTON = 0;
LayerObject.TYPE_FIELD = 1;

LayerObject.ATTR_TYPE = -1;
LayerObject.ATTR_ID = -2;
LayerObject.ATTR_PART_NUM = -3;
LayerObject.ATTR_KLAS_NUM = -4;
LayerObject.ATTR_LOC = -5;
LayerObject.ATTR_SIZE = -6;
LayerObject.ATTR_NAME = -7;
LayerObject.ATTR_SHARED = -8;
LayerObject.ATTR_SEARCHABLE = -9;
LayerObject.ATTR_VISIBLE = -10;
LayerObject.ATTR_SCRIPT = -11;
LayerObject.ATTR_DISABLED = -12;
LayerObject.ATTR_TALIGN = -13;
LayerObject.ATTR_TFONT = -14;
LayerObject.ATTR_TSIZE = -15;
LayerObject.ATTR_TSTYLE = -16;
LayerObject.ATTR_THEIGHT = -17;
LayerObject.ATTR_COLOR = -18;
LayerObject.ATTR_SHADOW = -19;

LayerObject.ATTR_CONTENT = -99;


LayerObject.prototype.get_def = function()
{
	if ((!this._is_bkgnd) || this.get_attr(LayerObject.ATTR_SHARED))
		this._attrs[LayerObject.ATTR_CONTENT] = this._get_raw_content();
	else
		this._attrs[LayerObject.ATTR_CONTENT] = '';
		
	return this._attrs;
}


LayerObject.prototype.set_def = function(in_def)
{
	for (var attr_name in in_def)
	{
		var attr_value = in_def[attr_name];
		this.set_attr(attr_name * 1, attr_value);
	}
}


LayerObject.prototype._get_raw_content = function()
{
	return '';
}


LayerObject.prototype._set_raw_content = function(in_content)
{
}


LayerObject.prototype.kill = function()
{
	this._div.parentElement.removeChild(this._div);
	this._div = null;
	
	if (this._num_tag != null)
		this._view._container.removeChild(this._num_tag);
	this._num_tag = null;
}


LayerObject.prototype.__install_handlers = function()
{
	this._div.addEventListener('mousedown', this.__handle_point_start.bind(this));
	this._div.addEventListener('touchstart', this.__handle_point_start.bind(this));
}


LayerObject.prototype.__handle_point_start = function(in_event)
{
	if (this._view._mode == View.MODE_AUTHORING)
	{
		Util.update_modifiers(in_event);
		this._view._author_point_start(this, [(in_event.pageX || in_event.touches[0].pageX), 
			(in_event.pageY || in_event.touches[0].pageY)]);
		
		in_event.preventDefault();
		in_event.stopPropagation();
		return;
	}
}


LayerObject.prototype._handle_resize_start = function(in_event)
{
	Drag.begin_resize(
		[(in_event.pageX || in_event.touches[0].pageX), 
		(in_event.pageY || in_event.touches[0].pageY)], [this], 
		this._view._guide_drag.bind(this._view)
	);
	
	in_event.preventDefault();
	in_event.stopPropagation();
	return;
}


LayerObject.prototype._reconfigure = function()
{
	for (var attr_name in this._attrs)
		this._attribute_changed(attr_name * 1, this._attrs[attr_name]);
}


LayerObject.prototype._set_selected = function(in_selected)
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
		this._drag_handle.addEventListener('touchstart', this._handle_resize_start.bind(this));
	}
	else if ((!in_selected) && this._drag_handle)
	{
		this._div.removeChild(this._drag_handle);
		this._drag_handle = null;
	}
}


LayerObject.prototype.get_type = function()
{
	return 'object';
}


LayerObject.prototype.set_size = function(in_size)
{
	/* store the new size as an attribute */
	this._size = [in_size[0], in_size[1]];
	this._attrs[LayerObject.ATTR_SIZE] = this._size;
	
	/* resize the container div(s) */
	this._div.style.width = in_size[0] + 'px';
	this._div.style.height = in_size[1] + 'px';
	if (this._inner)
	{
		this._inner.style.width = in_size[0]-2 + 'px';
		this._inner.style.height = in_size[1]-2 + 'px';
	}
	
	/* cache the right-bottom coordinates */
	this._rb[0] = this._loc[0] + this._size[0];
	this._rb[1] = this._loc[1] + this._size[1];
	
	/* notify the subclass */
	if (this._resized) this._resized();
	
	/* re-apply the selection styling if this object 
	is selected within the authoring environment */
	if (this._selected)
		this._div.style.border = '3px solid blue';
}


LayerObject.prototype.get_size = function()
{
	return this._size;
}


LayerObject.prototype.set_loc = function(in_loc)
{
	this._loc = [in_loc[0], in_loc[1]];
	this._attrs[LayerObject.ATTR_LOC] = this._loc;
	this._div.style.left = in_loc[0] + 'px';
	this._div.style.top = in_loc[1] + 'px';
	
	this._rb[0] = this._loc[0] + this._size[0];
	this._rb[1] = this._loc[1] + this._size[1];
	
	if (this._num_tag != null)
	{
		this._num_tag.style.left = this._loc[0] + 'px';
		this._num_tag.style.top = this._loc[1] + 'px';
	}
}


LayerObject.prototype.get_loc = function()
{
	return this._loc;
}


LayerObject.prototype.apply_text_attrs = function(in_div, in_attr, in_value)
{
	switch (in_attr)
	{
	case LayerObject.ATTR_TFONT:
		in_div.style.fontFamily = in_value;
		break;
	case LayerObject.ATTR_TSIZE:
		in_div.style.fontSize = in_value +'pt';
		break;
	case LayerObject.ATTR_TSTYLE:
		in_div.style.fontWeight = ((in_value & Text.STYLE_BOLD) ? 'bold' : 'normal');
		in_div.style.fontStyle = ((in_value & Text.STYLE_ITALIC) ? 'italic' : 'normal');
		in_div.style.textShadow = (in_value & Text.STYLE_SHADOW ? '2px 2px 1px #CCC' : 'none');
		if (in_value & Text.STYLE_EXTEND) in_div.style.letterSpacing = '1px';
		else in_div.style.letterSpacing = (in_value & Text.STYLE_CONDENSE ? '-1px' : 'normal');
		break;
	case LayerObject.ATTR_TALIGN:
		if (in_value == Text.ALIGN_LEFT)
			in_div.style.textAlign = 'left';
		else if (in_value == Text.ALIGN_CENTRE)
			in_div.style.textAlign = 'center';
		else if (in_value == Text.ALIGN_RIGHT)
			in_div.style.textAlign = 'right';
		else if (in_value == Text.ALIGN_JUSTIFY)
			in_div.style.textAlign = 'justify';
		break;
	}
}


LayerObject.prototype.set_attr = function(in_attr, in_value)
{
	if ((in_attr == LayerObject.ATTR_KLAS_NUM) && (this._num_tag != null))
		this._num_tag.innerHTML = in_value * 1;

	switch (in_attr)
	{
	case LayerObject.ATTR_LOC:
		this.set_loc(in_value);
		break;
	case LayerObject.ATTR_SIZE:
		this.set_size(in_value);
		break;
	case LayerObject.ATTR_CONTENT:
		this._set_raw_content(in_value);
		break;
	default:
		this._attrs[in_attr] = in_value;
	}
	
	
	
	
	this._attribute_changed(in_attr, in_value);
	
	if (this._selected)
		this._div.style.border = '3px solid blue';
}


LayerObject.prototype.get_attr = function(in_attr)
{
	var result;
	if (in_attr == LayerObject.ATTR_CONTENT)
		result = this._get_raw_content();
	else
		result = this._attrs[in_attr];
	if (result === undefined) result = null;
	return result;
}


LayerObject.prototype._layer_visibility = function(in_visible)
{
	var visible =  (in_visible && this.get_attr(LayerObject.ATTR_VISIBLE));
	this._div.style.visibility = (visible ? 'visible' : 'hidden');
	if (this._inner)
		this._inner.style.visibility = (visible ? 'visible' : 'hidden');
	if (this._num_tag)
		this._num_tag.style.visibility = (visible && this._view._tool == View.TOOL_FIELD ? 'visible' : 'hidden');
}



CinsImp._script_loaded('Model.LayerObject');


