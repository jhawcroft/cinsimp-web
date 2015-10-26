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
	View.current = this;
	
	this._stack = in_stack;
	this._card = in_card;
	this._paint = null;
	this._icon_index = {};
	
	this._index_icons();
	
	this._init_view();
}

View.current = null;


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


View.CURRENT_STACK = 0;
View.CURRENT_BKGND = 1;
View.CURRENT_CARD = 2;
View.CURRENT_OBJECT = 3;
View.CURRENT_BUTTON = 4;
View.CURRENT_FIELD = 5;

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
	this._container = Application._stack_window;
	
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
	
	this._layer_bkgnd_art = document.createElement('div');
	this._layer_bkgnd_art.className = 'LayerArt';
	this._layer_bkgnd_art.style.zIndex = 3;
	this._layer_bkgnd_art.style.width = this._size[0] + 'px';
	this._layer_bkgnd_art.style.height = this._size[1] + 'px';
	
	this._layer_card_art = document.createElement('div');
	this._layer_card_art.className = 'LayerArt';
	this._layer_card_art.style.zIndex = 4;
	this._layer_card_art.style.width = this._size[0] + 'px';
	this._layer_card_art.style.height = this._size[1] + 'px';
	
	this._layer_paint = document.createElement('div');
	this._layer_paint.className = 'PaintCanvas';
	this._layer_paint.style.zIndex = 6;
	this._layer_paint.style.width = this._size[0] + 'px';
	this._layer_paint.style.height = this._size[1] + 'px';
	this._layer_paint.style.visibility = 'hidden';
	
	this._layer_obj_card = document.createElement('div');
	this._layer_obj_card.id = 'LayerObjCard';
	this._layer_obj_card.style.zIndex = 5;
	this._layer_obj_card.className = 'Layer';
	this._layer_obj_card.style.width = this._size[0] + 'px';
	this._layer_obj_card.style.height = this._size[1] + 'px';
	
	//this._layer_obj_card = document.createElement('div');
	//this._layer_obj_card = document.createElement('div');
	//this._container.appendChild(this._layer_obj_bkgnd);
	this._container.appendChild(this._layer_bkgnd_art);
	this._container.appendChild(this._layer_card_art);
	this._container.appendChild(this._layer_paint);
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
	var palette_img = document.getElementById('Tool'+in_tool);//Palette.Tools._root.children[0].children[in_tool - 1].children[0];
	palette_img.src = palette_img.src.replace('normal', 'hilite');
	
	/* change the cursor on the view */
	this._container.classList.toggle('CursBrowse', false);
	this._container.classList.toggle('CursAuthor', false);
	switch (in_tool)
	{
	case View.TOOL_BROWSE:
		this._container.classList.toggle('CursBrowse', true);
		break;
	case View.TOOL_BUTTON:
	case View.TOOL_FIELD:
		this._container.classList.toggle('CursAuthor', true);
		break;
	default:
		break;
	}
	
	//this._container.classList.toggle('ShowBkgndNumTags', (this._tool == View.TOOL_FIELD));
	//this._container.classList.toggle('ShowCardNumTags', (this._tool == View.TOOL_FIELD && (!this._edit_bkgnd)));
}


View.prototype.choose_color = function(in_color)
{
	if (this._paint)
		this._paint.choose_color(in_color);
}


View.prototype._show_object_outlines = function()
{
	if (this._tool == View.TOOL_FIELD)
	{
		this._layer_obj_card.classList.add('FieldOutlines');
		//this._layer_obj_bkgnd.classList.add('FieldOutlines');
	}
	else
	{
		this._layer_obj_card.classList.remove('FieldOutlines');
		//this._layer_obj_bkgnd.classList.remove('FieldOutlines');
	}
	if (this._tool == View.TOOL_BUTTON)
	{
		this._layer_obj_card.classList.add('ButtonOutlines');
		//this._layer_obj_bkgnd.classList.add('ButtonOutlines');
	}
	else
	{
		this._layer_obj_card.classList.remove('ButtonOutlines');
		//this._layer_obj_bkgnd.classList.remove('ButtonOutlines');
	}
}


View.prototype._configure_obj_display = function()
{
	this._author_fields = (this._tool == View.TOOL_FIELD);
	this._author_buttons = (this._tool == View.TOOL_BUTTON);
	this._text_editable = true; // TODO: user-level, user-modify and cant-modify
	if (this._mode != View.MODE_BROWSE)
		this._text_editable = false;
		
	for (var o = 0; o < this._objects_card.length; o++)
	{
		var obj = this._objects_card[o];
		obj._layer_visibility(!this._edit_bkgnd);
		if (obj.get_type() == Field.TYPE)
			obj._display_changed(this._author_fields, this._text_editable);
		else
			obj._display_changed(this._author_buttons, this._text_editable);
	}
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		obj._layer_visibility(true);
		if (obj.get_type() == Field.TYPE)
			obj._display_changed(this._author_fields, this._text_editable);
		else
			obj._display_changed(this._author_buttons, this._text_editable);
	}
}


View.prototype._mode_changed = function()
{
	
	
	this._configure_obj_display();
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


View.prototype._guide_drag_layer = function(in_context, in_object, in_rect, in_layer, no_size)
{
	for (var o = 0; o < in_layer.length; o++)
	{
		var obj = in_layer[o];
		if (obj == in_object) continue;
		
		var deltaT = Math.abs(obj._loc[1] - in_rect[1]);
		var deltaB = Math.abs(obj._rb[1] - in_rect[1]);
		var deltaL = Math.abs(obj._loc[0] - in_rect[0]);
		var deltaR = Math.abs(obj._rb[0] - in_rect[0]);
		
		if (deltaT < in_context.objYDelta)
		{
			in_context.objYDelta = deltaT;
			in_context.objY = obj;
			in_context.objYCoord = obj._loc[1];
			in_context.alignY = 0;
		}
		if (deltaB < in_context.objYDelta)
		{
			in_context.objYDelta = deltaB;
			in_context.objY = obj;
			in_context.objYCoord = obj._rb[1];
			in_context.alignY = 0;
		}
		if (deltaL < in_context.objXDelta)
		{
			in_context.objXDelta = deltaL;
			in_context.objX = obj;
			in_context.objXCoord = obj._loc[0];
			in_context.alignX = 0;
		}
		if (deltaR < in_context.objXDelta)
		{
			in_context.objXDelta = deltaR;
			in_context.objX = obj;
			in_context.objXCoord = obj._rb[0];
			in_context.alignX = 0;
		}
		
		if (no_size) continue;
		var deltaT = Math.abs(obj._loc[1] - in_rect[3]);
		var deltaB = Math.abs(obj._rb[1] - in_rect[3]);
		var deltaL = Math.abs(obj._loc[0] - in_rect[2]);
		var deltaR = Math.abs(obj._rb[0] - in_rect[2]);
		
		if (deltaT < in_context.objYDelta)
		{
			in_context.objYDelta = deltaT;
			in_context.objY = obj;
			in_context.objYCoord = obj._loc[1];
			in_context.alignY = 1;
		}
		if (deltaB < in_context.objYDelta)
		{
			in_context.objYDelta = deltaB;
			in_context.objY = obj;
			in_context.objYCoord = obj._rb[1];
			in_context.alignY = 1;
		}
		if (deltaL < in_context.objXDelta)
		{
			in_context.objXDelta = deltaL;
			in_context.objX = obj;
			in_context.objXCoord = obj._loc[0];
			in_context.alignX = 1;
		}
		if (deltaR < in_context.objXDelta)
		{
			in_context.objXDelta = deltaR;
			in_context.objX = obj;
			in_context.objXCoord = obj._rb[0];
			in_context.alignX = 1;
		}
	}
}


// we can use this for resize too in theory...
View.prototype._guide_drag = function(in_object, in_loc, no_size, out_snapped)
{
	const THRESHOLD = 8;

	var context = {
		objY: 		null,
		objYDelta:	1000000,
		objYCoord: 	0,
		alignY:		0,		// 0 = top, 1 = bottom (of object)
		objX:		null,
		objXDelta:	1000000,
		objXCoord:	0,
		alignX: 	0		// 0 = left, 1 = right (of object)
	};
	
	var proposed_rect = [in_loc[0], in_loc[1], 
		in_loc[0] + in_object._size[0], in_loc[1] + in_object._size[1]];
	
	this._guide_drag_layer(context, in_object, proposed_rect, this._objects_card, no_size);
	this._guide_drag_layer(context, in_object, proposed_rect, this._objects_bkgnd, no_size);
	
	if (context.objY != null && context.objYDelta <= THRESHOLD)
	{
		in_loc[1] = context.objYCoord;
		if (context.alignY != 0) in_loc[1] -= in_object._size[1];
		out_snapped[1] = (context.alignY == 0 ? -1 : 1);
	}
	else out_snapped[1] = 0;
	if (context.objX != null && context.objXDelta <= THRESHOLD)
	{
		in_loc[0] = context.objXCoord;
		if (context.alignX != 0) in_loc[0] -= in_object._size[0];
		out_snapped[0] = (context.alignX == 0 ? -1 : 1);
	}
	else out_snapped[0] = 0;
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
	
	Drag.begin_move(in_coords, this._selected_objects, this._guide_drag.bind(this));
}


View.prototype.choose_tool = function(in_tool)
{
	this.select_none();
	
	this._tool = in_tool;
	
	/* instantiate the paint subsystem if appropriate
	and configure the paint environment */
	if (in_tool != View.TOOL_BROWSE && in_tool != View.TOOL_BUTTON && in_tool != View.TOOL_FIELD)
	{
		if (!this._paint) 
		{
			this._paint = new Paint(this._layer_paint, this._size);
			var me = this;
			this._paint.onenterpaint = function() { me.paint_revert(); };
			this._paint.onexitpaint = function() { me.paint_keep(); me._rebuild_art(); };
		}
		if (this._paint) 
			this._paint.choose_tool(in_tool);
			// probably need to reinit with a different card size here; only if different?
	}
	else
	{
		if (this._paint)
			this._paint.choose_tool(in_tool);
	}
	
	/* determine the mode */
	if (this._tool == View.TOOL_BROWSE) this._mode = View.MODE_BROWSE;
	else if (this._tool == View.TOOL_BUTTON ||
		this._tool == View.TOOL_FIELD) this._mode = View.MODE_AUTHORING;
	else this._mode = View.MODE_PAINTING;
	this._mode_changed();
	
	this._config_art_visibility();
	
	this._indicate_tool(in_tool);
	
	/* show object outlines */
	this._show_object_outlines();
}


View.prototype.edit_bkgnd = function(in_edit_bkgnd)
{
	this.select_none();
	this.paint_keep();
	this._rebuild_art();

	this._edit_bkgnd = in_edit_bkgnd;
	this._bkgnd_indicator.style.visibility = (this._edit_bkgnd ? 'visible' : 'hidden');
	
	this._configure_obj_display();
	this._config_art_visibility();
	this.paint_revert();
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
	var btn_num = 1;
	var fld_num = 1;
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		obj.set_attr(ViewObject.ATTR_PART_NUM, o + 1);
		if (obj.get_type() == Button.TYPE)
			obj.set_attr(ViewObject.ATTR_KLAS_NUM, btn_num ++);
		else
			obj.set_attr(ViewObject.ATTR_KLAS_NUM, fld_num ++);
	}
	var btn_num = 1;
	var fld_num = 1;
	for (var o = 0; o < this._objects_card.length; o++)
	{
		var obj = this._objects_card[o];
		obj.set_attr(ViewObject.ATTR_PART_NUM, o + 1);
		if (obj.get_type() == Button.TYPE)
			obj.set_attr(ViewObject.ATTR_KLAS_NUM, btn_num ++);
		else
			obj.set_attr(ViewObject.ATTR_KLAS_NUM, fld_num ++);
	}
}


View.prototype._add_object = function(in_object)
{
	var existing_id = in_object.get_attr(ViewObject.ATTR_ID);
	if (existing_id >= this._next_id)
		this._next_id = existing_id + 1;
		
	if (!this._edit_bkgnd) 
	{
		in_object.set_attr(ViewObject.ATTR_PART_NUM, this._objects_card.length + 1);
		in_object._is_bkgnd = false;
		this._objects_card.push(in_object);
		this._layer_obj_card.appendChild(in_object._div);
	}
	else 
	{
		in_object.set_attr(ViewObject.ATTR_PART_NUM, this._objects_bkgnd.length + 1);
		in_object._is_bkgnd = true;
		this._objects_bkgnd.push(in_object);
		this._layer_obj_card.appendChild(in_object._div);
	}
	
	this._renumber_objects();
	
	this._layer_obj_card.style.visibility = 'hidden';
	this._layer_obj_card.style.visibility = 'visible';
}


View.prototype.do_new_field = function()
{
	this.select_none();
	this.choose_tool(View.TOOL_FIELD);
	
	var field = new Field(this, null, this._edit_bkgnd);
	this._centre_object(field);
	this._add_object(field);
	
	this.select_object(field, true);
}


View.prototype.do_new_button = function()
{
	this.select_none();
	this.choose_tool(View.TOOL_BUTTON);
	
	var button = new Button(this, null, this._edit_bkgnd);
	this._centre_object(button);
	this._add_object(button);
	
	this.select_object(button, true);
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


View.prototype._keep_content = function() // need to replace this for resequencing with something that will ensure object content is saved
// probably duplicate content within object - store a buffer TOO, which doubles as a mechanism for dirty flagging?
{
	/* dump the card content */
	/*var card_data = new Array(this._objects_card.length + this._objects_bkgnd.length);
	for (var o = 0; o < this._objects_card.length; o++)
		card_data[o] = [this._objects_card[o]._attrs[ViewObject.ATTR_ID],
						this._objects_card[o].get_attr(ViewObject.ATTR_CONTENT)];
	var offset = this._objects_card.length;
	for (var o = 0; o < this._objects_bkgnd.length; o++)
		card_data[o + offset] = [this._objects_bkgnd[o]._attrs[ViewObject.ATTR_ID], 
								this._objects_bkgnd[o].get_attr(ViewObject.ATTR_CONTENT)];
	this._card.content = card_data;*/
	
	
	/*
	
	
	var objects = [];
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		if (obj.get_attr(ViewObject.ATTR_SHARED)) continue;
		
		if (obj.get_type() == Button.TYPE)
			var data = [obj.get_attr(ViewObject.ATTR_ID),
				obj.get_attr(ViewObject.ATTR_CONTENT),
				obj.get_attr(Button.ATTR_HILITE)];
		else
			var data = [obj.get_attr(ViewObject.ATTR_ID),
				obj.get_attr(ViewObject.ATTR_CONTENT)];
			
		objects.push(data);
	}
	this._card.data = JSON.stringify(objects);*/
}


View.prototype._save_defs_n_content = function()
{
	/* dump the object definitions to the card data block */
	var objects = new Array(this._objects_card.length);
	for (var o = 0; o < this._objects_card.length; o++)
		objects[o] = this._objects_card[o].get_def();
	this._card.card_object_data = JSON.stringify(objects);
	
	objects = new Array(this._objects_bkgnd.length);
	for (var o = 0; o < this._objects_bkgnd.length; o++)
		objects[o] = this._objects_bkgnd[o].get_def();
	this._card.bkgnd_object_data = JSON.stringify(objects);
	
	/* get non-shared background content */
	var objects = [];
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		if (obj.get_attr(ViewObject.ATTR_SHARED)) continue;
		
		if (obj.get_type() == Button.TYPE)
			var data = [obj.get_attr(ViewObject.ATTR_ID),
				obj.get_attr(ViewObject.ATTR_CONTENT),
				obj.get_attr(Button.ATTR_HILITE)];
		else
			var data = [obj.get_attr(ViewObject.ATTR_ID),
				obj.get_attr(ViewObject.ATTR_CONTENT)];
			
		objects.push(data);
	}
	this._card.data = JSON.stringify(objects);
}


View.prototype._save_card = function(in_handler)
{
	/* end editing and selections */
	if (document.activeElement)
		document.activeElement.blur();
	this.select_none();
	this.paint_keep();

	this._save_defs_n_content();
	
	/* submit ajax request to save the card */
	var msg = {
		cmd: 'save_card',
		stack_id: this._stack.stack_id,
		card: this._card
	};
	//alert(JSON.stringify(msg));
	
	Progress.operation_begun('Saving card...');
	Ajax.send(msg, function(msg, status) {
		var handler = in_handler;
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'save_card'))
			Alert.network_error("Couldn't save card.\n(" + status + JSON.stringify(msg) + ")");
			//alert('Save card error: '+status+"\n"+JSON.stringify(msg));
		else if (handler) handler();
	});
}


View.prototype._resurect = function(in_def, in_bkgnd)
{
	var id = in_def[ViewObject.ATTR_ID] * 1;
	if (id >= this._next_id) this._next_id = id + 1;
		
	var obj = null;
	if (in_def[ViewObject.ATTR_TYPE] == ViewObject.TYPE_BUTTON)
		obj = new Button(this, in_def, in_bkgnd);
	else
		obj = new Field(this, in_def, in_bkgnd);
		
	return obj;
}


/*
	** only rebuild the actual display of the layers
*/
View.prototype._rebuild_layers = function()
{
	while (this._layer_obj_card.children.length > 0)
		this._layer_obj_card.removeChild( this._layer_obj_card.children[0] );

	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		this._layer_obj_card.appendChild(obj._div);
	}
	for (var o = 0; o < this._objects_card.length; o++)
	{
		var obj = this._objects_card[o];
		this._layer_obj_card.appendChild(obj._div);
	}
}


View.prototype._config_art_visibility = function()
{
	if ( this._mode == View.MODE_PAINTING || (this._paint && this._paint.is_active()) )
	{
		this._layer_card_art.style.visibility = 'hidden';
		this._layer_bkgnd_art.style.visibility = (!this._edit_bkgnd ? 'visible' : 'hidden');
		this._layer_paint.style.visibility = 'visible';
	}
	else
	{
		this._layer_paint.style.visibility = 'hidden';
		this._layer_card_art.style.visibility = (this._edit_bkgnd ? 'hidden' : 'visible');
		this._layer_bkgnd_art.style.visibility = 'visible';
	}
}


View.prototype._rebuild_art = function()
{
	this._layer_bkgnd_art.innerHTML = '';
	this._layer_card_art.innerHTML = '';
	
	if (this._card.card_art)
	{
		var img = new Image();
		img.src = this._card.card_art;
		this._layer_card_art.appendChild(img);
	}
	if (this._card.bkgnd_art)
	{
		var img = new Image();
		img.src = this._card.bkgnd_art;
		this._layer_bkgnd_art.appendChild(img);
	}
	
	this._config_art_visibility();
}


View.prototype._rebuild_card = function() // will have to do separate load object data & separate reload from object lists
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
			var obj = this._resurect(objects[o], true);
			//obj._is_bkgnd = true;
			this._objects_bkgnd[o] = obj;
			//this._layer_obj_card.appendChild(obj._div);
		}
	}
	catch (e) {}
	
	try {
		var objects = JSON.parse(this._card.card_object_data);
		this._objects_card = new Array(objects.length);
		for (var o = 0; o < objects.length; o++)
		{
			var obj = this._resurect(objects[o], false);
			//obj._is_bkgnd = false;
			this._objects_card[o] = obj;
			//this._layer_obj_card.appendChild(obj._div);
		}
	}
	catch (e) {}
	
	this._rebuild_layers();
	
	/* load the object content */
	/*try
	{
		var offset = this._objects_card.length;
		for (var o = 0; o < this._card.content.length; o++)
		{
			var data = this._card.content[o];
			if (o >= offset)
				this._objects_bkgnd[o - offset].set_attr(ViewObject.ATTR_CONTENT, data[1]);
			else
				this._objects_card[o].set_attr(ViewObject.ATTR_CONTENT, data[1]);
		}
	}
	catch (e) {}*/
	
	/* new content mechanism? CAN only use for card content in bkgnd fields */
	try
	{
		var objects = JSON.parse(this._card.data);
		for (var o = 0; o < objects.length; o++)
		{
			var data = objects[o];
			var obj = this._lookup_bkgnd_part_by_id(data[0]);
			if (obj) 
			{
				obj.set_attr(ViewObject.ATTR_CONTENT, data[1]);
				if (data.length == 3)
					obj.set_attr(Button.HILITE, data[2]);
			}
		}
	}
	catch (e) {}
	
	this._renumber_objects();
	
	/* pull out the art work (if any) */
	//alert('card art: '+this._card.card_art);
	//alert('bkgnd art: '+this._card.bkgnd_art);
	
	this._rebuild_art();
	this.paint_revert();
	
	/* cause fields to be editable where appropriate */
	this._mode_changed();
}


View.prototype._lookup_bkgnd_part_by_id = function(in_part_id)
{
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		if (obj.get_attr(ViewObject.ATTR_ID) == in_part_id)
			return obj;
	}
	return null;
}


View.prototype._load_card = function(in_card_id)
{
	/* submit ajax request to load the card */
	msg = {
		cmd: 'load_card',
		stack_id: this._stack.stack_id,
		card_id: in_card_id
	};
	
	Progress.operation_begun('Loading card...');
	var me = this;
	Ajax.send(msg, function(msg, status) {
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'load_card'))
			alert('Load card error: '+status+"\n"+JSON.stringify(msg));
		else
		{
			me._card = msg.card;
			me._rebuild_card();
		}
	});
	
	
}


View.prototype.do_new_card = function()
{
	this._save_card( this._do_new_card.bind(this) );
}


View.prototype._do_new_card = function()
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
	this._save_card( this._do_new_bkgnd.bind(this) );
}


View.prototype._do_new_bkgnd = function()
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
	this._save_card( this._do_delete_card.bind(this) );
}


View.prototype._do_delete_card = function()
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
	var obj = this._selected_objects[0];
	Application._objects = this._selected_objects;
	
	document.getElementById('ButtonInfoName').value = obj.get_attr(ViewObject.ATTR_NAME);
	document.getElementById('ButtonInfoNumber').textContent = 
		(obj._is_bkgnd ? 'Bkgnd' : 'Card') + ' button number: ' + obj.get_attr(ViewObject.ATTR_KLAS_NUM);
	document.getElementById('ButtonInfoID').textContent = 
		(obj._is_bkgnd ? 'Bkgnd' : 'Card') + ' button ID: ' + obj.get_attr(ViewObject.ATTR_ID);
		
	switch (obj.get_attr(Button.ATTR_STYLE))
	{
	case Button.STYLE_RECTANGLE:
		document.getElementById('ButtonInfoType2').checked = true;
		break;
	case Button.STYLE_ROUNDED:
		document.getElementById('ButtonInfoType3').checked = true;
		break;
	case Button.STYLE_CHECKBOX:
		document.getElementById('ButtonInfoType4').checked = true;
		break;
	case Button.STYLE_RADIO:
		document.getElementById('ButtonInfoType5').checked = true;
		break;
	case Button.STYLE_BORDERLESS:
	default:
		document.getElementById('ButtonInfoType1').checked = true;
		break;
	}
	
	document.getElementById('ButtonInfoShadow').checked = obj.get_attr(ViewObject.ATTR_SHADOW);
	document.getElementById('ButtonInfoOpaque').checked = (obj.get_attr(ViewObject.ATTR_COLOR) != null);
	document.getElementById('ButtonInfoShowName').checked = obj.get_attr(Button.ATTR_SHOW_NAME);
	
	document.getElementById('ButtonInfoAutoHilite').checked = obj.get_attr(Button.ATTR_AUTO_HILITE);
	
	document.getElementById('ButtonInfoBkgndOnly').style.visibility = (obj._is_bkgnd ? 'visible' : 'hidden');
	document.getElementById('ButtonInfoShared').checked = obj.get_attr(ViewObject.ATTR_SHARED);	
		
	Dialog.ButtonInfo.show();
}


View.prototype._save_button_info = function()
{
	var obj = this._selected_objects[0];
	
	obj.set_attr(ViewObject.ATTR_NAME, document.getElementById('ButtonInfoName').value);
	
	obj.set_attr(ViewObject.ATTR_SHADOW, document.getElementById('ButtonInfoShadow').checked);
	obj.set_attr(ViewObject.ATTR_COLOR, (document.getElementById('ButtonInfoOpaque').checked ? [1,1,1] : null));
	obj.set_attr(Button.ATTR_SHOW_NAME, document.getElementById('ButtonInfoShowName').checked);
	
	obj.set_attr(Button.ATTR_AUTO_HILITE, document.getElementById('ButtonInfoAutoHilite').checked);
	obj.set_attr(ViewObject.ATTR_SHARED, document.getElementById('ButtonInfoShared').checked);
	
	if (document.getElementById('ButtonInfoType1').checked)
		obj.set_attr(Button.ATTR_STYLE, Button.STYLE_BORDERLESS);
	else if (document.getElementById('ButtonInfoType2').checked)
		obj.set_attr(Button.ATTR_STYLE, Button.STYLE_RECTANGLE);
	else if (document.getElementById('ButtonInfoType3').checked)
		obj.set_attr(Button.ATTR_STYLE, Button.STYLE_ROUNDED);
	else if (document.getElementById('ButtonInfoType4').checked)
		obj.set_attr(Button.ATTR_STYLE, Button.STYLE_CHECKBOX);
	else if (document.getElementById('ButtonInfoType5').checked)
		obj.set_attr(Button.ATTR_STYLE, Button.STYLE_RADIO);

	Dialog.dismiss();
}


View.prototype._do_field_info = function()
{
	var obj = this._selected_objects[0];
	Application._objects = this._selected_objects;
	
	document.getElementById('FieldInfoName').value = obj.get_attr(ViewObject.ATTR_NAME);
	document.getElementById('FieldInfoNumber').textContent = 
		(obj._is_bkgnd ? 'Bkgnd' : 'Card') + ' field number: ' + obj.get_attr(ViewObject.ATTR_KLAS_NUM);
	document.getElementById('FieldInfoID').textContent = 
		(obj._is_bkgnd ? 'Bkgnd' : 'Card') + ' field ID: ' + obj.get_attr(ViewObject.ATTR_ID);
	
	document.getElementById('FieldInfoBorder').checked = obj.get_attr(Field.ATTR_BORDER);
	document.getElementById('FieldInfoShadow').checked = obj.get_attr(ViewObject.ATTR_SHADOW);
	document.getElementById('FieldInfoOpaque').checked = (obj.get_attr(ViewObject.ATTR_COLOR) != null);
	document.getElementById('FieldInfoScrolling').checked = obj.get_attr(Field.ATTR_SCROLL);
	
	document.getElementById('FieldInfoShowLines').checked = obj.get_attr(Field.ATTR_SHOW_LINES);
	document.getElementById('FieldInfoWideMargins').checked = obj.get_attr(Field.ATTR_WIDE_MARGINS);
	document.getElementById('FieldInfoLocked').checked = obj.get_attr(Field.ATTR_LOCKED);
	document.getElementById('FieldInfoDontWrap').checked = obj.get_attr(Field.ATTR_DONT_WRAP);
	document.getElementById('FieldInfoAutoTab').checked = obj.get_attr(Field.ATTR_AUTO_TAB);

	document.getElementById('FieldInfoBkgndOnly').style.visibility = (obj._is_bkgnd ? 'visible' : 'hidden');
	document.getElementById('FieldInfoShared').checked = obj.get_attr(ViewObject.ATTR_SHARED);
	document.getElementById('FieldInfoDontSearch').checked = ! obj.get_attr(ViewObject.ATTR_SEARCHABLE);
	
	document.getElementById('FieldInfoAutoSelect').checked = obj.get_attr(Field.ATTR_AUTO_SELECT);
	document.getElementById('FieldInfoMultipleLines').checked = obj.get_attr(Field.ATTR_MULTIPLE_LINES);
	
	Dialog.FieldInfo.show();
}


View.prototype._save_field_info = function()
{
	var obj = this._selected_objects[0];
	
	obj.set_attr(ViewObject.ATTR_NAME, document.getElementById('FieldInfoName').value);
	
	obj.set_attr(Field.ATTR_BORDER, document.getElementById('FieldInfoBorder').checked);
	obj.set_attr(ViewObject.ATTR_SHADOW, document.getElementById('FieldInfoShadow').checked);
	obj.set_attr(ViewObject.ATTR_COLOR, (document.getElementById('FieldInfoOpaque').checked ? [1,1,1] : null));
	obj.set_attr(Field.ATTR_SCROLL, document.getElementById('FieldInfoScrolling').checked);
	
	obj.set_attr(Field.ATTR_SHOW_LINES, document.getElementById('FieldInfoShowLines').checked);
	obj.set_attr(Field.ATTR_WIDE_MARGINS, document.getElementById('FieldInfoWideMargins').checked);
	obj.set_attr(Field.ATTR_LOCKED, document.getElementById('FieldInfoLocked').checked);
	obj.set_attr(Field.ATTR_DONT_WRAP, document.getElementById('FieldInfoDontWrap').checked);
	obj.set_attr(Field.ATTR_AUTO_TAB, document.getElementById('FieldInfoAutoTab').checked);

	obj.set_attr(ViewObject.ATTR_SHARED, document.getElementById('FieldInfoShared').checked);
	obj.set_attr(ViewObject.ATTR_SEARCHABLE, ! document.getElementById('FieldInfoDontSearch').checked);
	
	obj.set_attr(Field.ATTR_AUTO_SELECT, document.getElementById('FieldInfoAutoSelect').checked);
	obj.set_attr(Field.ATTR_MULTIPLE_LINES, document.getElementById('FieldInfoMultipleLines').checked);
	
	Dialog.dismiss();
}


View.prototype._do_card_info = function()
{
	document.getElementById('CardInfoName').value = this._card.card_name;
	
	document.getElementById('CardInfoNumber').textContent = 'Card '+this._card.card_seq+' out of '+this._stack.count_cards;
	document.getElementById('CardInfoID').textContent = 'Card ID: '+this._card.card_id;
	document.getElementById('CardInfoFieldCount').textContent = 'Contains '+Util.plural(this._count_klass(this._objects_card, Field.TYPE),'field','fields');
	document.getElementById('CardInfoButtonCount').textContent = 'Contains '+Util.plural(this._count_klass(this._objects_card, Button.TYPE),'button','buttons');
	
	document.getElementById('CardInfoCantDelete').checked = this._card.card_cant_delete;
	document.getElementById('CardInfoDontSearch').checked = this._card.card_dont_search;
	document.getElementById('CardInfoMarked').checked = this._card.card_marked;
	
	Dialog.CardInfo.show();
}





View.prototype._save_card_info = function()
{
	this._card.card_name = document.getElementById('CardInfoName').value;
	
	this._card.card_cant_delete = document.getElementById('CardInfoCantDelete').checked;
	this._card.card_dont_search = document.getElementById('CardInfoDontSearch').checked;
	this._card.card_marked = document.getElementById('CardInfoMarked').checked;

	Dialog.dismiss();
}


View.prototype._count_klass = function(in_table, in_klass)
{
	var count = 0;
	for (var o = 0; o < in_table.length; o++)
		if (in_table[o].get_type() == in_klass) count++;
	return count;
}


View.prototype._do_bkgnd_info = function()
{
	document.getElementById('BkgndInfoName').value = this._card.bkgnd_name;
	
	document.getElementById('BkgndInfoID').textContent = 'Background ID: '+this._card.bkgnd_id;
	document.getElementById('BkgndInfoCardCount').textContent = 'Background shared by '+
		this._card.bkgnd_count+' '+(this._card.bkgnd_count == 1 ? 'card' : 'cards')+'.';
	document.getElementById('BkgndInfoFieldCount').textContent = 'Contains '+Util.plural(this._count_klass(this._objects_bkgnd, Field.TYPE),'field','fields');
	document.getElementById('BkgndInfoButtonCount').textContent = 'Contains '+Util.plural(this._count_klass(this._objects_bkgnd, Button.TYPE),'button','buttons');
	
	document.getElementById('BkgndInfoCantDelete').checked = this._card.bkgnd_cant_delete;
	document.getElementById('BkgndInfoDontSearch').checked = this._card.bkgnd_dont_search;

	Dialog.BkgndInfo.show();
}


View.prototype._save_bkgnd_info = function()
{
	this._card.bkgnd_name = document.getElementById('BkgndInfoName').value;
	
	this._card.bkgnd_cant_delete = document.getElementById('BkgndInfoCantDelete').checked;
	this._card.bkgnd_dont_search = document.getElementById('BkgndInfoDontSearch').checked;
	
	Dialog.dismiss();
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


View.prototype.save_info = function()
{
	if (this._selected_objects.length == 1)
	{
		if (this._selected_objects[0].get_type() == Button.TYPE)
			this._save_button_info();
		else
			this._save_field_info();
	}
	else if (!this._edit_bkgnd)
		this._save_card_info();
	else
		this._save_bkgnd_info();
}


// ie. go through and build a list of the selection in the actual current relative number order,
// as well as the current index within their respective layer table,
// then can remove one at a time from the top down, and put in the new location,
// and offset the remaining indexes as appropriate

View.prototype._enumerate_in_sequence = function()
{
	var bkgnd_list = [];
	for (var o = 0; o < this._objects_bkgnd.length; o++)
	{
		var obj = this._objects_bkgnd[o];
		if (obj._selected)
			bkgnd_list.push({ obj: obj, num: obj.get_attr(ViewObject.ATTR_PART_NUM), idx: o });
	}
	var card_list = [];
	for (var o = 0; o < this._objects_card.length; o++)
	{
		var obj = this._objects_card[o];
		if (obj._selected)
			card_list.push({ obj: obj, num: obj.get_attr(ViewObject.ATTR_PART_NUM), idx: o });
	}
	return { card: card_list, bkgnd: bkgnd_list };
}


View.prototype.send_to_front = function()
{
	if (this._selected_objects.length == 0) return;
	
	var lists = this._enumerate_in_sequence();
	
	for (var o = lists.card.length - 1; o >= 0; o--)
	{
		var item = lists.card[o];
		var obj = this._objects_card.splice(item.idx, 1)[0];
		this._objects_card.push(obj);
	}
	
	this._renumber_objects();
	
	this._save_defs_n_content();
	this._rebuild_layers();
}


View.prototype.send_forward = function()
{
	if (this._selected_objects.length == 0) return;
	
	var lists = this._enumerate_in_sequence();
	
	for (var o = lists.card.length - 1; o >= 0; o--)
	{
		var item = lists.card[o];
		if (item.idx >= this._objects_card.length - 1) return;
		var obj = this._objects_card.splice(item.idx, 1)[0];
		this._objects_card.splice(item.idx + 1, 0, obj);
	}
	
	this._renumber_objects();
	
	this._save_defs_n_content();
	this._rebuild_layers();
}


View.prototype.send_backward = function()
{
	if (this._selected_objects.length == 0) return;
	
	var lists = this._enumerate_in_sequence();
	
	for (var o = 0; o < lists.card.length; o++)
	{
		var item = lists.card[o];
		if (item.idx < 1) return;
		var obj = this._objects_card.splice(item.idx, 1)[0];
		this._objects_card.splice(item.idx - 1, 0, obj);
	}
	
	this._renumber_objects();
	
	this._save_defs_n_content();
	this._rebuild_layers();
}


View.prototype.send_to_back = function()
{
	if (this._selected_objects.length == 0) return;
	
	var lists = this._enumerate_in_sequence();
	
	var nidx = 0;
	for (var o = 0; o < lists.card.length; o++)
	{
		var item = lists.card[o];
		var obj = this._objects_card.splice(item.idx, 1)[0];
		this._objects_card.splice(nidx ++, 0, obj);
	}
	
	this._renumber_objects();
	
	this._save_defs_n_content();
	this._rebuild_layers();
}
///ScriptEditorObject

View.prototype.do_edit_script = function(in_subject, in_prior)
{
	var desc_label = document.getElementById('ScriptEditorObject');
	var curr_script = null;
	
	if (in_subject == View.CURRENT_OBJECT)
	{
		Dialog.ScriptEditor._object = this._selected_objects[0];
		var obj = Dialog.ScriptEditor._object;
		var id = obj.get_attr(ViewObject.ATTR_ID);
		var name = obj.get_attr(ViewObject.ATTR_NAME);
		var layer = (obj._is_bkgnd ? 'background' : 'card');
		
		if (obj.get_type() == Button.TYPE)
		{
			Dialog.ScriptEditor._type = View.CURRENT_BUTTON;
			desc_label.textContent = 'Script of '+layer+' button ID '+id+
				(name != '' ? ' "'+name+'"' : '');
		}
		else
		{
			Dialog.ScriptEditor._type = View.CURRENT_FIELD;
			desc_label.textContent = 'Script of '+layer+' field ID '+id+
				(name != '' ? ' "'+name+'"' : '');
		}
		
		curr_script = obj.get_attr(ViewObject.ATTR_SCRIPT);
		Dialog.ScriptEditor._edit_type = 'object';
	}
	else if (in_subject == View.CURRENT_STACK)
	{
		Dialog.ScriptEditor._object = this._stack;
		Dialog.ScriptEditor._type = View.CURRENT_STACK;
		desc_label.textContent = 'Script of stack '+this._stack.stack_name;
		
		curr_script = this._stack.stack_script;
		Dialog.ScriptEditor._edit_type = 'stack';
	}
	else if (in_subject == View.CURRENT_BKGND)
	{
		Dialog.ScriptEditor._object = this._card;
		Dialog.ScriptEditor._type = View.CURRENT_BKGND;
		desc_label.textContent = 'Script of background ID '+this._card.bkgnd_id+
			(this._card.bkgnd_name != '' ? ' "'+this._card.bkgnd_name+'"' : '');
			
		curr_script = this._card.bkgnd_script;
		Dialog.ScriptEditor._edit_type = 'bkgnd';
	}
	else
	{
		Dialog.ScriptEditor._object = this._card;
		Dialog.ScriptEditor._type = View.CURRENT_CARD;
		desc_label.textContent = 'Script of card ID '+this._card.card_id+
			(this._card.card_name != '' ? ' "'+this._card.card_name+'"' : '');
		
		curr_script = this._card.card_script;
		Dialog.ScriptEditor._edit_type = 'card';
	}
	
	if (!curr_script) curr_script = {'content':'', 'selection':0};
	Dialog.ScriptEditor._codeeditor._jce_ta.value = curr_script['content'];
	Dialog.ScriptEditor._codeeditor._jce_ta.selectionStart = curr_script['selection'];
	Dialog.ScriptEditor._codeeditor._jce_ta.selectionEnd = curr_script['selection'];

	if (in_prior) in_prior();
	Dialog.ScriptEditor.show();
	Dialog.ScriptEditor._codeeditor._jce_ta.focus();
}


View.prototype._save_stack = function()
{
	Progress.operation_begun('Saving stack...');
	var msg = {
		cmd: 'save_stack',
		stack_id: this._stack.stack_id,
		stack: this._stack
	};
	Ajax.send(msg, function(msg, status)
	{
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'save_stack'))
			Alert.network_error("Couldn't save stack. \n" + status + "; " + JSON.stringify(msg));
		else
			this._stack = msg.stack;
	});
}


View.prototype.save_script = function()
{
	var script_code = Dialog.ScriptEditor._codeeditor._jce_ta.value;
	var script_sel = Dialog.ScriptEditor._codeeditor._jce_ta.selectionStart;
	var new_script = {'content': script_code, 'selection': script_sel};
	
	switch (Dialog.ScriptEditor._edit_type)
	{
	case 'object':
		Dialog.ScriptEditor._object.set_attr(ViewObject.ATTR_SCRIPT, new_script);
		break;
	case 'stack':
		this._stack.stack_script = new_script;
		this._save_stack();
		break;
	case 'bkgnd':
		this._card.bkgnd_script = new_script;
		break;
	case 'card':
		this._card.card_script = new_script;
		break;
	}
	
}



View.prototype.paint_keep = function()
{
	if (!this._paint) return;
	if (!this._paint.is_active()) return;
	
	if (!this._edit_bkgnd)
		this._card.card_art = this._paint.get_data_png();
	else
		this._card.bkgnd_art = this._paint.get_data_png();
}


View.prototype.paint_revert = function()
{
	if (!this._paint) return;
	if (!this._paint.is_active()) return;
	
	if (!this._edit_bkgnd)
		this._paint.set_data_png(this._card.card_art);
	else
		this._paint.set_data_png(this._card.bkgnd_art);
}



View.do_link_to = function()
{
	Palette.LinkTo.show();
}


View.do_effect = function()
{
	
	Dialog.Effect.show();
}


View.apply_link_to = function(in_subject)
{
	Palette.LinkTo.hide();
}


View.apply_effect = function()
{
	Dialog.dismiss();
}



View.get_stack_icons = function()
{
	return View.current._stack.stack_icons;
}


View.register_icon = function(in_id, in_name, in_data)
{
	var icon_def = [in_id, in_name, in_data];
	View.current._stack.stack_icons.push(icon_def);
	View.current._icon_index[in_id] = icon_def;
}


View.prototype._index_icons = function()
{
	this._icon_index = {};
	for (var i = 0; i < this._stack.stack_icons.length; i++)
	{
		this._icon_index[this._stack.stack_icons[i][0]] = this._stack.stack_icons[i];
	}
}


View.do_share = function()
{
	var rt = document.getElementById('ShareButton').getBoundingClientRect();
	PopupMenu.ShareMenu.show([rt.left, rt.top, rt.right, rt.bottom]);
}


View.do_print_card = function()
{
	alert('Print card not yet implemented.');
}


View.do_save = function()
{
	View.current._save_card(null);
}



View.do_protect_stack = function()
{
	
	document.getElementById('ProtectStackCantModify').checked = View.current._stack.stack_cant_modify;
	document.getElementById('ProtectStackCantDelete').checked = View.current._stack.stack_cant_delete;
	document.getElementById('ProtectStackCantAbort').checked = View.current._stack.stack_cant_abort;
	document.getElementById('ProtectStackCantPeek').checked = View.current._stack.stack_cant_peek;
	document.getElementById('ProtectStackPrivateAccess').checked = View.current._stack.stack_private_access;
	
	var ul = View.current._stack.stack_user_level * 1;
	if ((!Number.isInteger(ul)) || ul < 1 || ul > 5) ul = 5;
	document.getElementById('ProtectStackUserLevel' + ul).checked = true;

	Dialog.ProtectStack.show();
}


View.save_protect_stack = function()
{
	Dialog.dismiss();
	
	View.current._stack.stack_cant_modify = document.getElementById('ProtectStackCantModify').checked;
	View.current._stack.stack_cant_delete = document.getElementById('ProtectStackCantDelete').checked;
	View.current._stack.stack_cant_abort = document.getElementById('ProtectStackCantAbort').checked;
	View.current._stack.stack_cant_peek = document.getElementById('ProtectStackCantPeek').checked;
	View.current._stack.stack_private_access = document.getElementById('ProtectStackPrivateAccess').checked;
	
	var ul = 5;
	if (document.getElementById('ProtectStackUserLevel1').checked) ul = 1;
	else if (document.getElementById('ProtectStackUserLevel2').checked) ul = 2;
	else if (document.getElementById('ProtectStackUserLevel3').checked) ul = 3;
	else if (document.getElementById('ProtectStackUserLevel4').checked) ul = 4;
	View.current._stack.stack_user_level = ul;
	
	View.current._save_stack();
}


View.do_set_password = function()
{
	Dialog.SetPassword.show();
	//document.getElementById(
}


CinsImp._script_loaded('view');


