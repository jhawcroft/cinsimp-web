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
	this._selected = null;
	this._needs_rebuild = false;
	
	this._card_content_key = null;
	//this._data = null;
	//this._dirty_nonshared = false;
	
	/* init defaults */
	this._def = 
	{	
		// this one is allocated by the layer
		'id': (in_layer ? in_layer.generate_object_id() : 0),
		
		// these two are dynamically managed by the layer
		'part_num': 0,
		'klas_num': 0,
		
		// loc, size, rect all dynamically accessing _position
		'rect': '0,0,0,0',
		
		'name': '',
		'shared': false,
		'searchable': true,
		'visible': true,
		'script': '',
		'disabled': false,
		'multiple_lines': false,
		'columnar': false,
		'has_header': false,
		
		'txt_align': 'left',
		'txt_font': 'sans-serif',
		'txt_size': 12,
		'txt_style': '',
		
		'color': '1,1,1',
		'shadow': false
	};
	
	/* load the object definition (if any) */
	if (in_def !== undefined) this._load_def(in_def);
	
	/* add the object to the layer, if specified */
	if (in_layer) 
	{
		in_layer.add_object(this);
		this.needs_dom_rebuild();
	}
}
var LayerObject = Model.LayerObject;
LayerObject.TYPE = 'layer-object';


LayerObject.prototype.get_type = function()
{
	return LayerObject.TYPE;
}


LayerObject.prototype.get_description = function()
{
	var desc = this._layer.get_type() + ' ' + this.get_type() + ' ID ' + 
		this.get_attr('id');
	var name = this.get_attr('name');
	if (name != '')
		desc += ' "' + name + '"';
	return desc;
}


LayerObject.prototype.is_bkgnd = function()
{
	return (this._layer && this._layer.get_type() == Bkgnd.TYPE);
}


LayerObject.prototype._load_def = function(in_def)
{
	if (!in_def) return;
	
	Util.array_apply(this._def, in_def);
	this.set_rect(in_def.rect.split(','));
	
	//this._def = in_def;
	
	// should probably be verified **TODO**

	
}


LayerObject.prototype._make_consistent = function() {};


LayerObject.prototype.make_consistent = function()
{
	LayerObject._no_write_note = true;
	try { this._make_consistent(); }
	catch (err) {}
	LayerObject._no_write_note = false;
}


LayerObject.prototype.get_def = function()
{
	this.make_consistent();
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


LayerObject.prototype._dom_create = function() {}


LayerObject.prototype.create_dom = function(in_view)
{
	if (this._div) return this._div;
	
	this._view = in_view;

	this._div = document.createElement('div');
	
	this._div.classList.add('o');
	this._inner = null;
	
	
	
	
	this._div.addEventListener('mousedown', this.__handle_point_start.bind(this));
	this._div.addEventListener('touchstart', this.__handle_point_start.bind(this));
	
	this._dom_create();
	this.needs_dom_rebuild();
	
	return this._div;
}


LayerObject.prototype._dom_rebuild = function() {}


LayerObject.prototype.rebuild_dom = function()
{
	if (!this._needs_rebuild) return;
	this._dom_rebuild();
	this._needs_rebuild = false;
	
	Util.set_dom_loc(this._div, this.get_loc());
	Util.set_dom_size(this._div, this.get_size());
	if (this._inner) Util.set_dom_size(this._inner, this.get_size());
}


LayerObject.prototype.needs_dom_rebuild = function()
{
	if (this._needs_rebuild) return;
	if (this._view) 
	{
		this._needs_rebuild = true;
		this._view.needs_rebuild(this);
	}
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


LayerObject.prototype.set_dom_editability = function(in_edit, in_show_content) {}


LayerObject.prototype.kill = function()
{
	if (this._selection) 
		this._selection.parentElement.removeChild(this._selection);
	this._selection = null;
	if (this._div !== undefined && this._div !== null)
		this._div.parentElement.removeChild(this._div);
	this._div = null;
}


LayerObject.prototype._apply_text_attrs = function(in_div)
{
	Text.apply_attributes_to_dom(in_div, this._def);
}


// **TODO remove
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

// **TODO remove
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
/*
LayerObject.prototype.set_card_content = function(in_data)
{
	this._data = in_data[1];
	/*for (attr in this._data)
	{
		if (in_data.hasOwnProperty(attr))
			this._data[attr] = in_data[attr];
	}
}


LayerObject.prototype.get_card_content = function()
{
	if (this._data === undefined) return null;
	if (!this.is_bkgnd()) return null;
	
	return [this._def['id'], this._data];
}
*/

LayerObject.prototype._resized = function()
{
	this._def['rect'] = this.get_rect().join(',');

	if (this._div)
	{
		Util.set_dom_loc(this._div, this.get_loc());
		Util.set_dom_size(this._div, this.get_size());
		if (this._inner) Util.set_dom_size(this._inner, this.get_size());
	}
	
	if (this._selection)
	{
		Util.set_dom_loc(this._selection, this.get_loc(), [-3, -3]);
		Util.set_dom_size(this._selection, this.get_size());
	}
}



LayerObject.prototype._resize_start = function(in_event)
{
	Drag.begin_resize(
		[(in_event.pageX || in_event.touches[0].pageX), 
		(in_event.pageY || in_event.touches[0].pageY)], [this], 
		this._view._guide_drag.bind(this._view)
	);
	
	in_event.preventDefault();
	in_event.stopPropagation();
}


LayerObject.prototype._move_start = function(in_event)
{
	Util.update_modifiers(in_event);
	this._view._author_point_start(this, 
		[(in_event.pageX || in_event.touches[0].pageX), 
		(in_event.pageY || in_event.touches[0].pageY)]);
	
	in_event.preventDefault();
	in_event.stopPropagation();
}


LayerObject.prototype._set_selected = function(in_selected)
{
	if (!in_selected && this._selection) 
	{
		this._selection.parentElement.removeChild(this._selection);
		this._selection = null;
	}
	else if (in_selected && !this._selection)
	{
		this._selection = document.createElement('div');
		this._selection.style.display = 'block';
		this._selection.style.position = 'absolute';
		this._selection.style.border = '3px solid blue';
		
		var drag_handle = document.createElement('div');
		drag_handle.style.display = 'block';
		drag_handle.style.position = 'absolute';
		drag_handle.style.right = 0;
		drag_handle.style.bottom = 0;
		drag_handle.style.width = '15px';
		drag_handle.style.height = '15px';
		drag_handle.style.backgroundColor = 'black';
		this._selection.appendChild(drag_handle);
		
		this._selection.addEventListener('mousedown', this._move_start.bind(this));
		this._selection.addEventListener('touchstart', this._move_start.bind(this));
		drag_handle.addEventListener('mousedown', this._resize_start.bind(this));
		drag_handle.addEventListener('touchstart', this._resize_start.bind(this));// may be a leak on drag handle... **TODO
		
		this._resized();
		
		this._div.parentElement.appendChild(this._selection);
	}
}


LayerObject.prototype.set_size = function(in_size)
{
	/* update the stored position */
	this._position[4] = Math.round(in_size[0]);
	this._position[5] = Math.round(in_size[1]);
	this._position[2] = Math.round(this._position[0] + this._position[4]);
	this._position[3] = Math.round(this._position[1] + this._position[5]);
	
	/* resize the container div(s) */
	this._resized();
}


LayerObject.prototype.get_size = function()
{
	return this._position.slice(4, 6);
}


LayerObject.prototype.set_loc = function(in_loc)
{
	/* update the stored position */
	this._position[0] = Math.round(in_loc[0]);
	this._position[1] = Math.round(in_loc[1]);
	this._position[2] = Math.round(this._position[0] + this._position[4]);
	this._position[3] = Math.round(this._position[1] + this._position[5]);
	
	/* move the container div(s) */
	this._resized();
}


LayerObject.prototype.get_loc = function()
{
	return this._position.slice(0, 2);
}


LayerObject.prototype.set_rect = function(in_rect)
{
	/* update the stored position */
	this._position[0] = Math.round(in_rect[0]);
	this._position[1] = Math.round(in_rect[1]);
	this._position[2] = Math.round(in_rect[2]);
	this._position[3] = Math.round(in_rect[3]);
	this._position[4] = Math.round(in_rect[2] - in_rect[0]);
	this._position[5] = Math.round(in_rect[3] - in_rect[1]);
	
	/* reposition the container div(s) */
	this._resized();
}


LayerObject.prototype.get_rect = function()
{
	return this._position.slice(0, 4);
}


LayerObject.prototype._set_opaque = function(in_opaque)
{
	if (!in_opaque)
		this.set_attr('color', '');
	else
		this.set_attr('color', '1,1,1');
}


LayerObject.prototype._get_opaque = function()
{
	return ! Util.null_or_empty(this.get_attr('color'));
}


LayerObject.prototype._attribute_written = function() {}


LayerObject.prototype._attribute_writable = function(in_attr)
{
	if (in_attr != 'id' && in_attr != 'type')
	{
		this.needs_dom_rebuild();
		return true;
	}
	return false;
}



LayerObject.prototype.make_dirty = function()
{
	if (this._layer) this._layer.dirty_objects();
}



LayerObject.prototype.set_attr = function(in_attr, in_value)
{
	if (in_attr == 'loc') return this.set_loc(in_value.split(','));
	else if (in_attr == 'size') return this.set_size(in_value.split(','));
	else if (in_attr == 'rect') return this.set_rect(in_value.split(','));
	else if (in_attr == 'opaque') return this._set_opaque(in_value);
	else if (in_attr == 'dont_search') return this.set_attr('searchable', !in_value);

	if (!(in_attr in this._def))
		throw new Error(this.get_type() + ' has no writable attribute "' + in_attr + '"');
	if (!this._attribute_writable(in_attr))
		throw new Error(this.get_type() + ' attribute "' + in_attr + '" is read-only');

	if (this.is_bkgnd() && in_attr == this._card_content_key && (!this._def['shared']))
	{
		if (this._view) this._view.card().set_card_content(this.get_attr('id'), in_value);
		else throw new Error('Cannot mutate content of non-shared background object not attached to view');
	}
	else
	{
		this._def[in_attr] = in_value;
		this.make_dirty();
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
	else if (in_attr == 'opaque') return this._get_opaque();
	else if (in_attr == 'dont_search') return !this.get_attr('searchable');
	
	if (!(in_attr in this._def))
		throw new Error(this.get_type() + ' has no readable attribute "' + in_attr + '"');
	
	var value = null;
	if (this.is_bkgnd() && in_attr === this._card_content_key && (!this._def['shared']))
	{	
		if (this._view) value = this._view.card().get_card_content(this.get_attr('id'));
		else throw new Error('Cannot access content of non-shared background object not attached to view');
	}
	else
	{
		value = this._def[in_attr];
	}
	
	return value;
}



LayerObject.prototype.get_layer = function()
{
	return this._layer;
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


