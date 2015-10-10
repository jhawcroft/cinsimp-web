/*
CinsImp
Stack View

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


function View(in_stack, in_card) 
{
	this._stack = in_stack;
	this._card = in_card;
	
	
	this._init_view();
}

View.MODE_BROWSE = 0;
View.MODE_AUTHORING = 1;
View.MODE_PAINTING = 2;

View.TOOL_BROWSE = 1;
View.TOOL_BUTTON = 2;
View.TOOL_FIELD = 3;
View.TOOL_SELECT = 4;
View.TOOL_LASSO = 5;
View.TOOL_PENCIL = 6;
View.TOOL_BRUSH = 7;
View.TOOL_ERASER = 8;
View.TOOL_LINE = 9;
View.TOOL_SPRAY = 10;
View.TOOL_RECTANGLE = 11;
View.TOOL_ROUND_RECT = 12;
View.TOOL_BUCKET = 13;
View.TOOL_OVAL = 14;
View.TOOL_FREE_SHAPE = 15;
View.TOOL_TEXT = 16;
View.TOOL_REG_POLY = 17;
View.TOOL_FREE_POLY = 18;
View.TOOL_EYEDROPPER = 19;

/*

Experimental technology - not stable - also doesn't work this easily since the event object must be cloned.
Going to have to use a simpler approach and just not have graphical masking of objects,
or else, find the target ourselves?

View.prototype._redirect_event = function(in_event)
{
	if (this._edit_bkgnd) return false;
	
	this._layer_obj_card.style.visibility = 'hidden';
	var blocked_target = document.elementFromPoint(in_event.pageX, in_event.pageY); // not supported on Android and subject to change? ***
	this._layer_obj_card.style.visibility = 'visible';
	
	if (blocked_target && blocked_target.className != 'Layer')
	{
		blocked_target.dispatchEvent(in_event);
		return true;
	}
	
	return false;
}
*/

View.prototype._init_view = function()
{
	this._edit_bkgnd = false;
	this._mode = View.MODE_BROWSE;
	this._tool = View.TOOL_BROWSE;
	this._container = document.getElementById('stackWindow');
	
	this._next_id = 1;
	
	var me = this;
	this._container.addEventListener('mousedown', 
		function (in_event) { me._author_point_start(null, [in_event.pageX, in_event.pageY]); });
	
	this._size = [this._container.clientWidth, this._container.clientHeight];
	
	this._objects_card = [];
	this._objects_bkgnd = [];
	
	this._selected_objects = [];
	
	/*this._layer_obj_bkgnd = document.createElement('div');
	this._layer_obj_bkgnd.id = 'LayerObjBkgnd';
	this._layer_obj_bkgnd.style.zIndex = 3;
	this._layer_obj_bkgnd.className = 'Layer';
	this._layer_obj_bkgnd.style.width = this._size[0] + 'px';
	this._layer_obj_bkgnd.style.height = this._size[1] + 'px';*/
	
	this._layer_obj_card = document.createElement('div');
	this._layer_obj_card.id = 'LayerObjCard';
	this._layer_obj_card.style.zIndex = 5;
	this._layer_obj_card.className = 'Layer';
	this._layer_obj_card.style.width = this._size[0] + 'px';
	this._layer_obj_card.style.height = this._size[1] + 'px';
	
	//this._layer_obj_card = document.createElement('div');
	//this._layer_obj_card = document.createElement('div');
	//this._container.appendChild(this._layer_obj_bkgnd);
	this._container.appendChild(this._layer_obj_card);
	
	this._bkgnd_indicator = document.createElement('div');
	this._bkgnd_indicator.className = 'BkgndIndicator';
	this._bkgnd_indicator.style.left = this._container.offsetLeft - 4 + 'px';
	this._bkgnd_indicator.style.top = this._container.offsetTop - 4 + 'px';
	this._bkgnd_indicator.style.width = this._container.clientWidth + 8 + 'px';
	this._bkgnd_indicator.style.height = this._container.clientHeight + 8 + 'px';
	document.body.appendChild(this._bkgnd_indicator);
}


View.prototype._indicate_tool = function(in_tool)
{
	/* clear the current tool indication */
	var img_list = Palette.Tools._root.children[0].children;
	for (var t = 0; t < img_list.length; t++)
	{
		var palette_img = img_list[t].children[0];
		palette_img.src = palette_img.src.replace('hilite', 'normal');
	}
	
	/* set the new tool indication */
	var palette_img = Palette.Tools._root.children[0].children[in_tool - 1].children[0];
	palette_img.src = palette_img.src.replace('normal', 'hilite');
	
	/* change the cursor on the view */
	switch (in_tool)
	{
	case View.TOOL_BROWSE:
		this._container.className = 'CursBrowse';
		break;
	case View.TOOL_BUTTON:
	case View.TOOL_FIELD:
		this._container.className = 'CursAuthor';
		break;
	}
}


View.prototype._show_object_outlines = function()
{
	if (this._tool == View.TOOL_FIELD)
	{
		this._layer_obj_card.classList.add('FieldOutlines');
		this._layer_obj_bkgnd.classList.add('FieldOutlines');
	}
	else
	{
		this._layer_obj_card.classList.remove('FieldOutlines');
		this._layer_obj_bkgnd.classList.remove('FieldOutlines');
	}
	if (this._tool == View.TOOL_BUTTON)
	{
		this._layer_obj_card.classList.add('ButtonOutlines');
		this._layer_obj_bkgnd.classList.add('ButtonOutlines');
	}
	else
	{
		this._layer_obj_card.classList.remove('ButtonOutlines');
		this._layer_obj_bkgnd.classList.remove('ButtonOutlines');
	}
}


View.prototype._mode_changed = function()
{
	this._author_fields = (this._tool == View.TOOL_FIELD);
	this._author_buttons = (this._tool == View.TOOL_BUTTON);
	this._text_editable = true; // TODO: user-level, user-modify and cant-modify
	if (this._mode != View.MODE_BROWSE)
		this._text_editable = false;
	
	for (var o = 0; o < this._objects_card.length; o++)
	{
		var obj = this._objects_card[o];
		if (obj.get_type() == Field.TYPE)
			obj._author_edit_changed(this._author_fields, this._text_editable);
		else
			obj._author_edit_changed(this._author_buttons, this._text_editable);
	}
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		if (obj.get_type() == Field.TYPE)
			obj._author_edit_changed(this._author_fields, this._text_editable);
		else
			obj._author_edit_changed(this._author_buttons, this._text_editable);
	}
}


View.prototype.object_is_selected = function(in_object)
{
	var idx = this._selected_objects.indexOf(in_object);
	return (idx >= 0);
}


View.prototype.select_object = function(in_object, in_selected)
{
	var idx = this._selected_objects.indexOf(in_object);
	if (idx >= 0 && (!in_selected))
	{
		this._selected_objects.splice(idx, 1);
		in_object._set_selected(in_selected);
	}
	else if (idx < 0 && in_selected)
	{
		this._selected_objects.push(in_object);
		in_object._set_selected(in_selected);
	}
}


View.prototype.select_none = function()
{
	for (var o = this._selected_objects.length - 1; o >= 0; o--)
	{
		var obj = this._selected_objects[o];
		obj._set_selected(false);
	}
	this._selected_objects.length = 0;
}


View.prototype._browse_point_start = function(in_object, in_coords)
{
	if (this._mode != View.MODE_BROWSE) return;
	
	alert('Click on object '+ in_object);
}


View.prototype._author_point_start = function(in_object, in_coords)
{
	if (this._mode != View.MODE_AUTHORING) return;
	
	if (!in_object)
	{
		this.select_none();
		return;
	}
	
	if ((in_object.get_type() == Field.TYPE && this._tool != View.TOOL_FIELD) ||
		(in_object.get_type() == Button.TYPE && this._tool != View.TOOL_BUTTON)) return;

	if (Util.modifier_shift)
	{
		if (this.object_is_selected(in_object))
		{
			this.select_object(in_object, false);
			return;
		}
		else
			this.select_object(in_object, true);
	}
	else
	{
		if (!this.object_is_selected(in_object))
		{
			this.select_none();
			this.select_object(in_object, true);
		}
	}
	if (this.object_is_selected(in_object))
	
	Drag.begin_move(in_coords, this._selected_objects);
}


View.prototype.choose_tool = function(in_tool)
{
	this.select_none();
	
	this._tool = in_tool;
	
	/* determine the mode */
	if (this._tool == View.TOOL_BROWSE) this._mode = View.MODE_BROWSE;
	else if (this._tool == View.TOOL_BUTTON ||
		this._tool == View.TOOL_FIELD) this._mode = View.MODE_AUTHORING;
	else this._mode = View.MODE_PAINTING;
	this._mode_changed();
	
	this._indicate_tool(in_tool);
	
	/* show object outlines */
	this._show_object_outlines();
}


View.prototype.edit_bkgnd = function(in_edit_bkgnd)
{
	this.select_none();

	this._edit_bkgnd = in_edit_bkgnd;
	this._bkgnd_indicator.style.visibility = (this._edit_bkgnd ? 'visible' : 'hidden');
	
	//this._layer_obj_card.style.visibility = (this._edit_bkgnd ? 'hidden' : 'visible');
	for (var o = 0; o < this._objects_card.length; o++)
		this._objects_card[o]._layer_visibility(!in_edit_bkgnd);
}


View.prototype.is_edit_bkgnd = function()
{
	return this._edit_bkgnd;
}


View.prototype.do_new = function()
{
	if (this._mode == View.MODE_BROWSE)
	{
		if (!this._edit_bkgnd) this.do_new_card();
		else this.do_new_bkgnd();
	}
	else if (this._mode == View.MODE_AUTHORING)
	{
		if (this._tool == View.TOOL_BUTTON) this.do_new_button();
		else this.do_new_field();
	}
}


View.prototype._centre_object = function(in_object)
{
	var obj_size = in_object.get_size();
	var new_loc = [(this._size[0] - obj_size[0]) / 2, (this._size[1] - obj_size[1]) / 2];
	in_object.set_loc(new_loc);
}


View.prototype._renumber_objects = function()
{
	for (var o = 0; o < this._objects_bkgnd.length; o++)
		this._objects_bkgnd[o].set_attr(ViewObject.ATTR_NUM, o + 1);
	for (var o = 0; o < this._objects_card.length; o++)
		this._objects_card[o].set_attr(ViewObject.ATTR_NUM, o + 1);
}


View.prototype._add_object = function(in_object)
{
	var existing_id = in_object.get_attr(ViewObject.ATTR_ID);
	if (existing_id >= this._next_id)
		this._next_id = existing_id + 1;
		
	if (!this._edit_bkgnd) 
	{
		in_object.set_attr(ViewObject.ATTR_NUM, this._objects_card.length + 1);
		this._objects_card.push(in_object);
		this._layer_obj_card.appendChild(in_object._div);
	}
	else 
	{
		in_object.set_attr(ViewObject.ATTR_NUM, this._objects_bkgnd.length + 1);
		this._objects_bkgnd.push(in_object);
		this._layer_obj_card.appendChild(in_object._div);
	}
}


View.prototype.do_new_field = function()
{
	var field = new Field(this);
	this._centre_object(field);
	this._add_object(field);
}


View.prototype.do_new_button = function()
{
	var button = new Button(this);
	this._centre_object(button);
	this._add_object(button);
}


View.prototype.do_delete_objects = function()
{
	for (var o = 0; o < this._selected_objects.length; o++)
	{
		var obj = this._selected_objects[o];
		var idx = this._objects_card.indexOf(obj);
		if (idx >= 0)
			this._objects_card.splice(idx, 1);
		idx = this._objects_bkgnd.indexOf(obj);
		if (idx >= 0)
			this._objects_bkgnd.splice(idx, 1);
		obj.kill();
	}
	this._selected_objects.length = 0;
	
	this._renumber_objects();
}


View.prototype.do_delete = function()
{
	if (this._mode == View.MODE_BROWSE)
		this.do_delete_card();
	else if (this._mode == View.MODE_AUTHORING)
		this.do_delete_objects();
}


View.prototype._save_card = function(in_handler)
{
	/* end editing and selections */
	if (document.activeElement)
		document.activeElement.blur();
	this.select_none();

	/* dump the object definitions to the card data block */
	var objects = new Array(this._objects_card.length);
	for (var o = 0; o < this._objects_card.length; o++)
		objects[o] = this._objects_card[o].get_def();
	this._card.card_object_data = JSON.stringify(objects);
	
	objects = new Array(this._objects_bkgnd.length);
	for (var o = 0; o < this._objects_bkgnd.length; o++)
		objects[o] = this._objects_bkgnd[o].get_def();
	this._card.bkgnd_object_data = JSON.stringify(objects);
	
	/* dump the card content */
	var card_data = new Array(this._objects_card.length + this._objects_bkgnd.length);
	for (var o = 0; o < this._objects_card.length; o++)
		card_data[o] = [this._objects_card[o]._attrs[ViewObject.ATTR_ID],
						this._objects_card[o].get_raw_content()];
	var offset = this._objects_card.length;
	for (var o = 0; o < this._objects_bkgnd.length; o++)
		card_data[o + offset] = [this._objects_bkgnd[o]._attrs[ViewObject.ATTR_ID], 
								this._objects_bkgnd[o].get_raw_content()];
	this._card.content = card_data;
	
	/* submit ajax request to save the card */
	var msg = {
		cmd: 'save_card',
		stack_id: this._stack.stack_id,
		card: this._card
	};
	//alert(JSON.stringify(msg));
	
	Progress.operation_begun();
	Ajax.send(msg, function(msg, status) {
		var handler = in_handler;
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'save_card'))
			alert('Save card error: '+status+"\n"+JSON.stringify(msg));
		else if (handler) handler();
	});
}


View.prototype._resurect = function(in_def)
{
	var id = in_def[ViewObject.ATTR_ID] * 1;
	if (id >= this._next_id) this._next_id = id + 1;
		
	var obj = null;
	if (in_def[ViewObject.ATTR_TYPE] == ViewObject.TYPE_BUTTON)
		obj = new Button(this, in_def);
	else
		obj = new Field(this, in_def);
		
	return obj;
}


View.prototype._rebuild_card = function()
{
	/* dump the current card */
	this._next_id = 1;
	this._selected_objects = [];
	for (o = 0; o < this._objects_card.length; o++)
		this._objects_card[o].kill();
	this._objects_card = [];
	for (o = 0; o < this._objects_bkgnd.length; o++)
		this._objects_bkgnd[o].kill();
	this._objects_bkgnd = [];

	/* load the object definitions from the card data block */
	try
	{
		var objects = JSON.parse(this._card.bkgnd_object_data);
		this._objects_bkgnd = new Array(objects.length);
		for (var o = 0; o < objects.length; o++)
		{
			var obj = this._resurect(objects[o]);
			
			this._objects_bkgnd[o] = obj;
			this._layer_obj_card.appendChild(obj._div);
		}
	}
	catch (e) {}
	
	try {
		var objects = JSON.parse(this._card.card_object_data);
		this._objects_card = new Array(objects.length);
		for (var o = 0; o < objects.length; o++)
		{
			var obj = this._resurect(objects[o]);

			this._objects_card[o] = obj;
			this._layer_obj_card.appendChild(obj._div);
		}
	}
	catch (e) {}
	
	/* load the object content */
	try
	{
		var offset = this._objects_card.length;
		for (var o = 0; o < this._card.content.length; o++)
		{
			var data = this._card.content[o];
			if (o >= offset)
				this._objects_bkgnd[o - offset].set_raw_content(data[1]);
			else
				this._objects_card[o].set_raw_content(data[1]);
		}
	}
	catch (e) {}
	
	this._renumber_objects();
	
	/* cause fields to be editable where appropriate */
	this._mode_changed();
}


View.prototype._load_card = function(in_card_id)
{
	/* submit ajax request to load the card */
	msg = {
		cmd: 'load_card',
		stack_id: this._stack.stack_id,
		card_id: in_card_id
	};
	
	Progress.operation_begun();
	var me = this;
	Ajax.send(msg, function(msg, status) {
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'load_card'))
			alert('Save card error: '+status+"\n"+JSON.stringify(msg));
		else
		{
			me._card = msg.card;
			me._rebuild_card();
		}
	});
	
	
}


View.prototype.do_new_card = function()
{
	msg = {
		cmd: 'new_card',
		stack_id: this._stack.stack_id,
		card_id: this._card.card_id
	};
	
	Progress.operation_begun();
	var me = this;
	Ajax.send(msg, function(msg, status) {
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'new_card'))
			alert('New card error: '+status+"\n"+JSON.stringify(msg));
		else
		{
			me._card = msg.card;
			me._stack.count_cards ++;
			me._rebuild_card();
		}
	});
}


View.prototype.do_new_bkgnd = function()
{
	msg = {
		cmd: 'new_bkgnd',
		stack_id: this._stack.stack_id,
		card_id: this._card.card_id
	};
	
	Progress.operation_begun();
	var me = this;
	Ajax.send(msg, function(msg, status) {
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'new_bkgnd'))
			alert('New bkgnd error: '+status+"\n"+JSON.stringify(msg));
		else
		{
			me._card = msg.card;
			me._stack.count_cards ++;
			me._stack.count_bkgnds ++;
			me._rebuild_card();
		}
	});
}


View.prototype.do_delete_card = function()
{
	msg = {
		cmd: 'delete_card',
		stack_id: this._stack.stack_id,
		card_id: this._card.card_id
	};
	
	Progress.operation_begun();
	var me = this;
	Ajax.send(msg, function(msg, status) {
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'delete_card'))
			alert('Delete card error: '+status+"\n"+JSON.stringify(msg));
		else
		{
			me._card = msg.card;
			me._stack = msg.stack;
			me._rebuild_card();
		}
	});
}


View.prototype._go_nth_card = function(in_num, in_bkgnd)
{
	/* submit ajax request to load the card */
	msg = {
		cmd: 'load_card',
		stack_id: this._stack.stack_id,
		stack_num: in_num
	};
	
	Progress.operation_begun();
	var me = this;
	Ajax.send(msg, function(msg, status) {
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'load_card'))
			alert('Save card error: '+status+"\n"+JSON.stringify(msg));
		else
		{
			me._card = msg.card;
			me._rebuild_card();
		}
	});
}


View.prototype.go_first = function()
{
	this._save_card( this._go_nth_card.bind(this, 1) );
}

View.prototype.go_prev = function()
{
	if (this._card.card_seq == 1)
		this.go_last();
	else
		this._save_card( this._go_nth_card.bind(this, this._card.card_seq - 1) );
}

View.prototype.go_next = function()
{
	if (this._card.card_seq == this._stack.count_cards)
		this.go_first();
	else
		this._save_card( this._go_nth_card.bind(this, this._card.card_seq + 1) );
}

View.prototype.go_last = function()
{
	this._save_card( this._go_nth_card.bind(this, this._stack.count_cards) );
}


View.prototype.refresh = function()
{
	this._rebuild_card();

	//alert(JSON.stringify(this._card));
}


View.prototype._do_button_info = function()
{
	
	Dialog.ButtonInfo.show();
}


View.prototype._do_field_info = function()
{

	Dialog.FieldInfo.show();
}


View.prototype._do_card_info = function()
{
	
	Dialog.CardInfo.show();
}


View.prototype._do_bkgnd_info = function()
{

	Dialog.BkgndInfo.show();
}


View.prototype.do_info = function()
{
	if (this._selected_objects.length == 1)
	{
		if (this._selected_objects[0].get_type() == Button.TYPE)
			this._do_button_info();
		else
			this._do_field_info();
	}
	else if (!this._edit_bkgnd)
		this._do_card_info();
	else
		this._do_bkgnd_info();
}


View.prototype.send_to_front = function()
{
	if (this._selected_objects.length == 0) return;
	
	for (var o = 0; o < this._selected_objects.length; o++)
	{
		var obj = this._selected_objects[o];
		
	}
}


View.prototype.send_forward = function()
{
	if (this._selected_objects.length == 0) return;
	
}


View.prototype.send_backward = function()
{
	if (this._selected_objects.length == 0) return;
	
}


View.prototype.send_to_back = function()
{
	if (this._selected_objects.length == 0) return;
	
}


