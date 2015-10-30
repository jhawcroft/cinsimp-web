/*
CinsImp
Field

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


Model.Field = function(in_view, in_def, in_bkgnd) 
{
	/* create the object */
	LayerObject.call(this, LayerObject.TYPE_FIELD, in_view, in_bkgnd);
	this._div.classList.remove('Object');//hack - eventually to be removed at the LayerObject level
	this._div.classList.add('fld');
	
	this._inner = document.createElement('div');
	this._div.appendChild(this._inner);
	this._inner.style.boxSizing = 'border-box';
	//this._inner.style.border = '1px dotted red';
	
	this._num_tag = document.createElement('div');
	this._num_tag.className = 'NumTag';
	this._view._container.appendChild(this._num_tag);
	
	/* set defaults */
	if (!in_def)
	{
		this.set_size([200, 85]);
		this.set_attr(LayerObject.ATTR_COLOR, [1,1,1]);
		this.set_attr(LayerObject.ATTR_SHADOW, false);
		
		this.set_attr(Field.ATTR_BORDER, true);
		this.set_attr(Field.ATTR_SCROLL, false);
		this.set_attr(Field.ATTR_LOCKED, false);
		
		this.set_attr(Field.ATTR_DONT_WRAP, false);
		this.set_attr(Field.ATTR_FIXED_LINES, false);
		this.set_attr(Field.ATTR_AUTO_TAB, false);
		this.set_attr(Field.ATTR_WIDE_MARGINS, false);
		this.set_attr(Field.ATTR_SHOW_LINES, false);
		this.set_attr(Field.ATTR_AUTO_SELECT, false);
		this.set_attr(Field.ATTR_FIRST_SELECTED, -1);
		this.set_attr(Field.ATTR_LAST_SELECTED, -1);
		
		this.set_attr(Field.ATTR_PICKLIST, '');
	}
	else
		this.set_def(in_def);
	
	/* complete configuration */
	this._reconfigure();
}
var Field = Model.Field;
Util.classInheritsFrom(Field, Model.LayerObject);


Field.prototype.get_type = function()
{
	return Field.TYPE;
}
Field.TYPE = 'field';


Field.ATTR_BORDER = 1;
Field.ATTR_SCROLL = 2;
Field.ATTR_LOCKED = 3;
Field.ATTR_DONT_WRAP = 4;
Field.ATTR_FIXED_LINES = 5;
Field.ATTR_AUTO_TAB = 6;
Field.ATTR_WIDE_MARGINS = 7;
Field.ATTR_SHOW_LINES = 8;
Field.ATTR_AUTO_SELECT = 9;
Field.ATTR_FIRST_SELECTED = 10;
Field.ATTR_LAST_SELECTED = 11;
Field.ATTR_PICKLIST = 12;



Field.prototype._get_raw_content = function()
{
	return this._inner.innerHTML;
}


Field.prototype._set_raw_content = function(in_content)
{
	this._inner.innerHTML = in_content;
}


Field.prototype._display_changed = function(in_author, in_edit)
{
	var editable = (in_edit && (!this._attrs[Field.ATTR_LOCKED]));
	if (this._is_bkgnd)
	{
		if (this.get_attr(LayerObject.ATTR_SHARED))
		{
			if (!this._view._edit_bkgnd) editable = false;
			this._inner.style.visibility = this._div.style.visibility;
		}
		else
			this._inner.style.visibility = (this._view._edit_bkgnd ? 'hidden' : this._div.style.visibility);
	}
	else
		this._inner.style.visibility = this._div.style.visibility;
	
	this._inner.contentEditable = editable;
	
	//this._inner.classList.toggle('o-edit', editable); // doesn't seem to be reliably effect
	
	this._inner.style.cursor = (editable ? 'text' : '');
	
	var state = (editable ? 'text' : 'none');
	this._inner.style.userSelect = state;
	this._inner.style.MozUserSelect = state;
	this._inner.style.webkitUserSelect = state;
	this._inner.style.webkitTouchCallout = state;
	this._inner.style.khtmlUserSelect = state;
	this._inner.style.msUserSelect = state;
}


Field.prototype._attribute_changed = function(in_attr, in_value)
{
	switch (in_attr)
	{
	case Field.ATTR_BORDER:
		this._div.style.border = (in_value ? '1px solid black' : '');
		break;
	case LayerObject.ATTR_COLOR:
		this._div.style.backgroundColor = (in_value ? Util.color_to_css(in_value) : 'transparent');
		break;
	case LayerObject.ATTR_SHADOW:
		this._div.style.boxShadow = (in_value ? '2px 2px 2px 2px rgba(0,0,0,0.75)' : '');
		break;
	case Field.ATTR_SCROLL:
		this._inner.style.overflowY = (in_value ? 'scroll' : 'hidden');
		break;
	case Field.ATTR_WIDE_MARGINS:
		this._inner.style.padding = (in_value ? '10px' : '0px');
		break;
	case Field.ATTR_DONT_WRAP:
		this._inner.style.whiteSpace = (in_value ? 'nowrap' : 'normal');
		break;
	}
	
	this.apply_text_attrs(this._inner, in_attr, in_value);
}


CinsImp._script_loaded('Model.Field');


