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


View.prototype._init_view = function()
{
	this._edit_bkgnd = false;
	this._mode = View.MODE_BROWSE;
	this._tool = View.TOOL_BROWSE;
	this._container = document.getElementById('stackWindow');
	
	var me = this;
	this._container.addEventListener('mousedown', 
		function (in_event) { me._author_point_start(null, [in_event.pageX, in_event.pageY]); });
	
	this._size = [this._container.clientWidth, this._container.clientHeight];
	
	this._objects_card = [];
	this._objects_bkgnd = [];
	
	this._selected_objects = [];
	
	this._layer_obj_bkgnd = document.createElement('div');
	this._layer_obj_bkgnd.id = 'LayerObjBkgnd';
	this._layer_obj_bkgnd.style.zIndex = 3;
	this._layer_obj_bkgnd.className = 'Layer';
	this._layer_obj_bkgnd.style.width = this._size[0] + 'px';
	this._layer_obj_bkgnd.style.height = this._size[1] + 'px';
	
	this._layer_obj_card = document.createElement('div');
	this._layer_obj_card.id = 'LayerObjCard';
	this._layer_obj_card.style.zIndex = 5;
	this._layer_obj_card.className = 'Layer';
	this._layer_obj_card.style.width = this._size[0] + 'px';
	this._layer_obj_card.style.height = this._size[1] + 'px';
	
	//this._layer_obj_card = document.createElement('div');
	//this._layer_obj_card = document.createElement('div');
	this._container.appendChild(this._layer_obj_bkgnd);
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


View.prototype._author_point_start = function(in_object, in_coords)
{
	if (this._mode != View.MODE_AUTHORING) return;
	
	if (!in_object)
	{
		this.select_none();
		return;
	}
	
	if ((in_object.get_type() == Field.TYPE && this._tool != View.TOOL_FIELD) ||
		(in_object.get_type() != Field.TYPE && this._tool != View.TOOL_BUTTON)) return;

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
	this._edit_bkgnd = in_edit_bkgnd;
	this._bkgnd_indicator.style.visibility = (this._edit_bkgnd ? 'visible' : 'hidden');
	this._layer_obj_card.style.visibility = (this._edit_bkgnd ? 'hidden' : 'visible');
	//document.getElementById('EditBkgndLabel').textContent = (this._edit_bkgnd ? 'Edit Card' : 'Edit Bkgnd');
	
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


View.prototype.do_new_card = function()
{

}


View.prototype.do_new_bkgnd = function()
{

}


View.prototype._centre_object = function(in_object)
{
	var obj_size = in_object.get_size();
	var new_loc = [(this._size[0] - obj_size[0]) / 2, (this._size[1] - obj_size[1]) / 2];
	in_object.set_loc(new_loc);
}


View.prototype.do_new_field = function()
{
	var field = new Field(this);
	this._centre_object(field);
	if (!this._edit_bkgnd) 
	{
		this._objects_card.push(field);
		this._layer_obj_card.appendChild(field._div);
	}
	else 
	{
		this._objects_bkgnd.push(field);
		this._layer_obj_bkgnd.appendChild(field._div);
	}
	//this._container.appendChild(field._div);
}


View.prototype.do_new_button = function()
{

}


View.prototype.do_delete_objects = function()
{

}


View.prototype.do_delete_card = function()
{

}


View.prototype.do_delete = function()
{
	if (this._mode == View.MODE_BROWSE)
		this.do_delete_card();
	else if (this._mode == View.MODE_AUTHORING)
		this.do_delete_objects();
}


View.prototype.go_first = function()
{
	alert('First');
}

View.prototype.go_prev = function()
{
	alert('Prev');
}

View.prototype.go_next = function()
{
	alert('Next');
}

View.prototype.go_last = function()
{
	alert('Last');
}


View.prototype.refresh = function()
{
	

	//alert(JSON.stringify(this._card));
}


View.prototype.do_info = function()
{
	Dialog.FieldInfo.show();
}



