/*
CinsImp
Layer Object; Button or Field

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



/*****************************************************************************************
Construction, Defaults and Serialisation
*/

Model.LayerObject = function(in_def, in_layer) 
{
	/* init core performance properties */
	this._position = [0,0,0,0,0,0]; /* l, t, r, b, w, h */
	this._layer = in_layer;
	
	/* init defaults */
	this._def = 
	{
		// this one is determined by the subclass and computed automatically
		'type': null,
		
		// this one is allocated by the layer
		'id': (in_layer ? in_layer.generate_object_id() : 0),
		
		// these two are dynamically managed by the layer
		'part_num': 0,
		'klas_num': 0,
		
		// loc, size, rect all dynamically accessing _position
		'loc': '',
		'size': '',
		'rect': '',
		
		'name': '',
		'shared': false,
		'searchable': true,
		'visible': true,
		'script': '',
		'disabled': false,
		
		'txt_align': 'left',
		'txt_font': 'sans-serif',
		'txt_size': 12,
		'txt_style': '',
		
		'color': '1,1,1',
		'shadow': false
	};
	
	/* load the object definition (if any) */
	if (in_def !== undefined) this._load_def(in_def);
}
var LayerObject = Model.LayerObject;
LayerObject.TYPE = 'layer-object';


LayerObject.prototype.get_type = function()
{
	return LayerObject.TYPE;
}


LayerObject._load_def = function(in_def)
{
	this._def = in_def;
	
	// should probably be verified **TODO**

	
}


LayerObject.prototype.get_def = function()
{
	return this._def;
}


LayerObject.prototype.get_stack = function()
{
	if (!this._layer) return null;
	return this._layer.get_stack();
}



/*****************************************************************************************
DOM View
*/

LayerObject.create_dom = function(in_view)
{
	this._view = in_view;

	this._div = document.createElement('div');
	
	this._div.classList.add('o');
	this._inner = null;
	
	
	
	
	this._div.addEventListener('mousedown', this.__handle_point_start.bind(this));
	this._div.addEventListener('touchstart', this.__handle_point_start.bind(this));
}


LayerObject.prototype.set_dom_visiblity = function(in_visible)
{
	var visible = (in_visible && this.get_attr('visible'));
	
	if (this._div)
	{
		this._div.style.visibility = (visible ? 'visible' : 'hidden');
		if (this._inner) this._inner.style.visibility = (visible ? 'visible' : 'hidden');
	}
}


LayerObject.prototype.kill = function()
{
	if (this._div !== undefined && this._div !== null)
		this._div.parentElement.removeChild(this._div);
	this._div = null;
}


LayerObject.prototype._reconfigure = function()
{
	for (var attr_name in this._attrs)
		this._attribute_changed(attr_name * 1, this._attrs[attr_name]);
}


LayerObject.prototype._apply_text_attr = function(in_div, in_attr, in_value)
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



/*****************************************************************************************
Attribute Mutation/Access
*/

LayerObject.prototype.set_card_data = function(in_data)
{
	for (attr in this._data)
	{
		if (in_data.hasOwnProperty(attr))
			this._data[attr] = in_data[attr];
	}
}


LayerObject.prototype.get_card_data = function()
{
	if (this._data === undefined) return null;
	return this._data;
}


LayerObject.prototype.set_size = function(in_size)
{
	/* update the stored position */
	this._position[4] = in_size[0];
	this._position[5] = in_size[1];
	this._position[2] = this._position[0] + this._position[4];
	this._position[3] = this._position[1] + this._position[5];
	
	/* resize the container div(s) */
	if (this._div)
	{
		Util.set_dom_size(this._div, in_size);
		if (this._inner) Util.set_dom_size(this._inner, in_size);
	}
}


LayerObject.prototype.get_size = function()
{
	return this._position.slice(4, 5);
}


LayerObject.prototype.set_loc = function(in_loc)
{
	/* update the stored position */
	this._position[0] = in_loc[0];
	this._position[1] = in_loc[1];
	this._position[2] = this._position[0] + this._position[4];
	this._position[3] = this._position[1] + this._position[5];
	
	/* move the container div(s) */
	if (this._div) Util.set_dom_loc(this._div, in_loc);
}


LayerObject.prototype.get_loc = function()
{
	return this._position.slice(0, 1);
}


LayerObject.prototype.set_rect = function(in_rect)
{
	/* update the stored position */
	this._position[0] = in_rect[0];
	this._position[1] = in_rect[1];
	this._position[2] = in_rect[2];
	this._position[3] = in_rect[3];
	this._position[4] = in_rect[2] - in_rect[0];
	this._position[5] = in_rect[3] - in_rect[1];
	
	/* reposition the container div(s) */
	if (this._div)
	{
		Util.set_dom_size(this._div, in_size);
		if (this._inner) Util.set_dom_size(this._inner, in_size);
	}
}


LayerObject.prototype.get_rect = function()
{
	return this._position.slice(0, 3);
}


LayerObject.prototype._attribute_written = function() {}


LayerObject.prototype.set_attr = function(in_attr, in_value)
{
	if (in_attr == 'loc') return this.set_loc(in_value.split(','));
	else if (in_attr == 'size') return this.set_size(in_value.split(','));
	else if (in_attr == 'rect') return this.set_rect(in_value.split(','));

	switch (in_attr)
	{
	case '':
		if (in_attr in this._data && (!this._def['shared']))
			this._data[in_attr] = in_value;
		else
			this._def[in_attr] = in_value;
		break;
	default:
		throw new Error(this.get_type() + ' has no writable attribute "' + in_attr + '"');
	}
	
	if (LayerObject._no_write_note !== true)
		this._attribute_written(in_attr, in_value);
}


LayerObject.prototype._attribute_reading = function() {}


LayerObject.prototype.get_attr = function(in_attr, in_fmt)
{
	if (in_attr == 'type') return this.get_type();
	else if (in_attr == 'loc') return this.get_loc().join(',');
	else if (in_attr == 'size') return this.get_size().join(',');
	else if (in_attr == 'rect') return this.get_rect().join(',');
	
	if (!(in_attr in this._def))
		throw new Error(this.get_type() + ' has no readable attribute "' + in_attr + '"');
	
	LayerObject._no_write_note = true;
	try { this._attribute_reading(in_attr); }
	catch (err) {}
	LayerObject._no_write_note = false;
	
	var value = null;
	if (in_attr in this._data && (!this._def['shared']))
		value = this._data[in_attr];
	else
		value = this._def[in_attr];
	
	return value;
}




/*

OLD STUFF FOR REFERENCE (during refactoring)
=======================


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
	
	
	
	
	if ((in_attr == LayerObject.ATTR_KLAS_NUM) && (this._num_tag != null))
		this._num_tag.innerHTML = in_value * 1;
	
	
	
	 re-apply the selection styling if this object 
	is selected within the authoring environment 
	if (this._selected)
		this._div.style.border = '3px solid blue';
		
		
		if (this._selected)
		this._div.style.border = '3px solid blue';
}
*/



CinsImp._script_loaded('Model.LayerObject');


