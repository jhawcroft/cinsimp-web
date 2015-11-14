/*
CinsImp
Data Model: Layer (Card/Bkgnd)

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



Model.Layer = function(in_stack, in_def, in_ready_handler, in_view)
{
	Scriptable.call(this);
	
	/* initialise the class internals */
	this._ready = false;
	this._ready_handler = in_ready_handler;
	this._changes = {};
	this._is_dirty = false;
	this._stack = in_stack;
	this._next_id = 1;
	this._objects = [];
	this._view = in_view;
	
	/* if the definition is an ID,
	then the definition must be fetched before it can be loaded */
	if (typeof in_def != 'object')
	{
		this._fetch_def(in_def);
		return;
	}
	
	/* load the layer from the definition */
	this._load_layer_def(in_def);
};
var Layer = Model.Layer;
Util.classInheritsFrom(Layer, Model.Scriptable);


Layer.prototype._fetch_def = function(in_ident) {}


Layer.prototype._check_def = function(in_def) {}
Layer.prototype._load_def = function() {}


Layer.prototype._load_layer_def = function(in_def)
{
	this._check_def();

	this._def = in_def;
	
	for (var o = 0; o < in_def.objects.length; o++)
	{
		var obj_def = in_def.objects[o];
		if (obj_def.id >= this._next_id) this._next_id = obj_def.id + 1;
		var obj = null;
		if (obj_def.type == Button.TYPE)
			var obj = new CinsImp.Model.Button(obj_def, this);
		else if (obj_def.type == Field.TYPE)
			var obj = new CinsImp.Model.Field(obj_def, this);
	}
	/* we should check the definition is valid here */ /// ** TODO **


	this._load_def();
	
	this._renumber_count_objects();
	this._make_ready(true);
}


Layer.prototype._make_ready = function(in_ready)
{
	this._ready = in_ready;
	if (this._ready_handler) this._ready_handler(this, in_ready);
	this._ready_handler = null;
	
	this._changes_discard();
}


Layer.prototype.generate_object_id = function()
{
	return this._next_id ++;
}


Layer.prototype._prepare_def = function() {}

Layer.prototype.get_def = function(in_changes)
{
	if (this._changes.length == 0) return this._def;
	
	this._prepare_def();
	
	if ('objects' in this._changes)
	{
		var objects = [];
		for (var o = 0; o < this._objects.length; o++)
		{
			var obj = this._objects[o];
			objects.push(obj.get_def());
		}
		this._changes['objects'] = objects;
	}
	
	return this._changes;
}


Layer.prototype.get_description = function()
{
	var desc = this.get_type() + ' ID ' + this.get_attr('id');
	var name = this.get_attr('name');
	if (name != '')
		desc += ' "' + name + '"';
	return desc;
}


Layer.prototype._get_attr = function(in_attr, in_value, in_fmt) { return undefined; }

Layer.prototype.get_attr = function(in_attr, in_fmt)
{
	if (!(in_attr in this._def))
		throw Error(this.get_type() + ' doesn\'t have a "' + in_attr + '" attribute.');

	var value = null;
	if (in_attr in this._changes) value = this._changes[in_attr];
	else value = this._def[in_attr];
	
	var override_value = this._get_attr(in_attr, value, in_fmt);
	if (override_value !== undefined) value = override_value;
	
	return value;
}



Layer.prototype._attr_writable = function(in_attr) { return false; }

Layer.prototype.set_attr = function(in_attr, in_value)
{
	if (in_attr == 'script') this.invalidate_executables();

	if (!this._attr_writable(in_attr))
		throw new Error('Cannot write "'+in_attr+'" attribute of ' + this.get_type());
	
	this._changes[in_attr] = in_value;
	this._make_dirty();
}


Layer.prototype._make_dirty = function()
{
	if (this._is_dirty) return;
	this._is_dirty = true;
	
	if (this._view) this._view._notify_dirty_changed();
}


Layer.prototype._clear_dirty = function()
{
	if (!this._is_dirty) return;

	this._changes = {};
	this._is_dirty = false;
	
	if (this._view) this._view._notify_dirty_changed();
}


Layer.prototype._changes_apply = function()
{
	for (var key in this._changes)
		this._def[key] = this._changes[key];
	this._clear_dirty();
}


Layer.prototype._changes_discard = function()
{
	this._clear_dirty();
}


Layer.prototype._make_dirty_objects = function()
{
	this._changes['objects'] = null;
	this._make_dirty();
}


Layer.prototype.save = function(in_onfinished, in_arg)
{
	if (!this._is_dirty)
	{
		if (in_onfinished) in_onfinished(true, in_arg);
		return;
	}
	
	var layer = this;
	this._changes['id'] = this._def.id;
	var msg = {
		cmd: 'save_card',
		ref: this._def.id
	};
	msg[this.get_type()] = this.get_def();
	
	this._stack.gateway(msg, 
	function(in_reply) 
	{
		if (in_reply.cmd != 'error') layer._changes_apply();
		if (in_onfinished) in_onfinished(in_reply.cmd != 'error', in_arg);
	});
}


Layer.prototype.add_object = function(in_object)
{
	this._objects.push(in_object);
	this._make_dirty_objects();
	this._renumber_count_objects();
}


Layer.prototype.remove_object = function(in_object)
{
	var idx = this._objects.indexOf(in_object);
	if (idx < 0) throw new Error('Can\'t remove object from ' + this.get_type() + ', as it isn\'t on the layer');
	
	this._objects.splice(idx, 1);
	in_object.kill();
	
	this._make_dirty_objects();
	this._renumber_count_objects();
}


Layer.prototype.get_objects = function()
{
	return this._objects;
}


Layer.prototype.get_stack = function()
{
	return this._stack;
}


Layer.prototype.is_dirty = function()
{
	return this._is_dirty;
}


Layer.prototype.set_view = function(in_view)
{
	this._view = in_view;
}


Layer.prototype._renumber_count_objects = function()
{
	var btn_count = 0;
	var fld_count = 0;
	for (var o = 0; o < this._objects.length; o++)
	{
		var obj = this._objects[o];
		obj.set_attr('part_num', o + 1);
		if (obj.get_type() == Button.TYPE)
			obj.set_attr('klas_num', ++btn_count);
		else
			obj.set_attr('klas_num', ++fld_count);
	}
	
	this._def.count_fields = fld_count;
	this._def.count_buttons = btn_count;
}



// ie. go through and build a list of the selection in the actual current relative number order,
// as well as the current index within their respective layer table,
// then can remove one at a time from the top down, and put in the new location,
// and offset the remaining indexes as appropriate
Layer.prototype._enumerate_in_sequence = function()
{
	var list = [];
	for (var o = 0; o < this._objects.length; o++)
	{
		var obj = this._objects[o];
		if (obj._selection)
			list.push({ obj: obj, num: obj.get_attr('part_num'), idx: o });
		obj.set_num_tag(false);
	}
	return list;
}


Layer.prototype.send_to_front = function()
{
	var list = this._enumerate_in_sequence();
	
	for (var o = list.length - 1; o >= 0; o--)
	{
		var item = list[o];
		var obj = this._objects.splice(item.idx, 1)[0];
		this._objects.push(obj);
	}
	
	this._renumber_count_objects();
}


Layer.prototype.send_forward = function()
{
	var list = this._enumerate_in_sequence();
	
	for (var o = list.length - 1; o >= 0; o--)
	{
		var item = list[o];
		if (item.idx >= this._objects.length - 1) return;
		var obj = this._objects.splice(item.idx, 1)[0];
		this._objects.splice(item.idx + 1, 0, obj);
	}
	
	this._renumber_count_objects();
}


Layer.prototype.send_backward = function()
{
	var list = this._enumerate_in_sequence();
	
	for (var o = 0; o < list.length; o++)
	{
		var item = list[o];
		if (item.idx < 1) return;
		var obj = this._objects.splice(item.idx, 1)[0];
		this._objects.splice(item.idx - 1, 0, obj);
	}
	
	this._renumber_count_objects();
}


Layer.prototype.send_to_back = function()
{
	var list = this._enumerate_in_sequence();
	
	var nidx = 0;
	for (var o = 0; o < list.length; o++)
	{
		var item = list[o];
		var obj = this._objects.splice(item.idx, 1)[0];
		this._objects.splice(nidx ++, 0, obj);
	}
	
	this._renumber_count_objects();
}


Layer.prototype.get_child_by_id = function(in_id, in_klas)
{
	for (var o = 0; o < this._objects.length; o++)
	{
		var object = this._objects[o];
		if (object.get_attr('id') == in_id && 
			object.get_type() == in_klas) return object;
	}
	return null;
}


Layer.prototype.get_child_by_name = function(in_name, in_klas)
{
	for (var o = 0; o < this._objects.length; o++)
	{
		var object = this._objects[o];
		if (object.get_attr('name').localeCompare(in_name) == 0 && 
			object.get_type() == in_klas) return object;
	}
	return null;
}


Layer.prototype.get_child_by_number = function(in_number, in_klas)
{
	for (var o = 0; o < this._objects.length; o++)
	{
		var object = this._objects[o];
		if (object.get_attr('klas_num') == in_number && 
			object.get_type() == in_klas) return object;
	}
	return null;
}


Layer.prototype.get_searchable_fields = function(out_list, in_only_field_id)
{
	var list = (out_list ? out_list : []);
	
	for (var o = 0; o < this._objects.length; o++)
	{
		var object = this._objects[o];
		if (in_only_field_id && object.get_attr('id') != in_only_field_id) continue;
		if (object.get_searchable_text && object.get_attr('searchable') && !object.get_attr('shared'))
			list.push(object);
	}
	
	return list;
}




CinsImp._script_loaded('Model.Layer');


