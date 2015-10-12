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

// suggest we improve this soon to use the 'Bootstrap WYSIWYG' editor,
// which is very lightweight.
// may need to modify to work without jQuery,
// but shouldn't be difficult

// should also consider just doing it directly.
// IE doesn't (at time of writing - Oct 2015, probably IE 11) support the HTML 5 inputEvent,
// but the other browsers do, so I don't really care...


/*

A note about importing fields from HyperCard:

-	style -> a combination of the 4 attributes: border, color, shadow, scroll:
	transparent: false, null, false, false
	opaque: false, [1,1,1], false, false
	rectangle: true, [1,1,1], false, false
	shadow: true, [1,1,1], true, false
	scrolling: true, [1,1,1], false, true

-	field size will need to be slightly adjusted if shadow is present
	because the CSS shadow is applied to the outside, not the inside of the field,
	ie. increase the width and height by about 2 pixels to compensate during import.

*/


function Field(in_view, in_def, in_bkgnd) 
{
	/* create the object */
	ViewObject.call(this, ViewObject.TYPE_FIELD, in_view, in_bkgnd);
	this._div.classList.add('Field');
	
	this._num_tag = document.createElement('div');
	this._num_tag.className = 'NumTag';
	this._view._container.appendChild(this._num_tag);
	
	/* set defaults */
	if (!in_def)
	{
		this.set_size([200, 85]);
		this.set_attr(ViewObject.ATTR_COLOR, [1,1,1]);
		this.set_attr(ViewObject.ATTR_SHADOW, false);
		
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
	}
	else
		this.set_def(in_def);
	
	/* complete configuration */
	this._reconfigure();
}

Util.classInheritsFrom(Field, ViewObject);


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



/*
Field.prototype._reconfigure = function()
{
	this._div.style.border = (this._attrs[Field.ATTR_BORDER] ? '1px solid black' : '');
	this._div.style.backgroundColor = (this._attrs[Field.ATTR_COLOR] ? 
		Util.color_to_css(this._attrs[Field.ATTR_COLOR]) : 'transparent');
	this._div.style.boxShadow = (this._attrs[Field.ATTR_SHADOW] ? '2px 2px 2px 2px rgba(0,0,0,0.75)' : '');
	this._div.style.overflowY = (this._attrs[Field.ATTR_SCROLL] ? 'scroll' : 'hidden');
}*/


Field.prototype.get_raw_content = function()
{
	return this._div.innerHTML;
}


Field.prototype.set_raw_content = function(in_content)
{
	this._div.innerHTML = in_content;
}


Field.prototype._display_changed = function(in_author, in_edit)
{
	this._div.contentEditable = (in_edit && (!this._attrs[Field.ATTR_LOCKED]));
	this._div.classList.toggle('Editable', in_edit);
	//if (this._num_tag)
	//	this._num_tag.style.visibility = (this._visible && this._view._tool == View.TOOL_FIELD ? 'visible' : 'hidden');
}


Field.prototype._attribute_changed = function(in_attr, in_value)
{
	switch (in_attr)
	{
	case Field.ATTR_BORDER:
		this._div.style.border = (in_value ? '1px solid black' : '');
		break;
	case ViewObject.ATTR_COLOR:
		this._div.style.backgroundColor = (in_value ? Util.color_to_css(in_value) : 'transparent');
		break;
	case ViewObject.ATTR_SHADOW:
		this._div.style.boxShadow = (in_value ? '2px 2px 2px 2px rgba(0,0,0,0.75)' : '');
		break;
	case Field.ATTR_SCROLL:
		this._div.style.overflowY = (in_value ? 'scroll' : 'hidden');
		break;
	}
}




