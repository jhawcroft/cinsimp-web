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


function Field(in_def) 
{
	/* create the object */
	ViewObject.call(this);
	
	this._div = document.createElement('div');
	this._div.classList.add('Object');
	this._div.classList.add('Field');
	
	/* set defaults */
	if (!in_def)
	{
		this.set_size([200, 85]);
		this.set_attr(Field.ATTR_BORDER, false);
		this.set_attr(Field.ATTR_COLOR, null);
		this.set_attr(Field.ATTR_SHADOW, false);
		this.set_attr(Field.ATTR_SCROLL, false);
		this.set_attr(Field.ATTR_LOCKED, false);
	}
	else
		this._init_with_def(in_def);
	
	/* complete configuration */
	this._reconfigure();
}

Util.classInheritsFrom(Field, ViewObject);


Field.prototype.get_type = function()
{
	return 'field';
}


Field.TYPE = 'field';


Field.ATTR_BORDER = 1;
Field.ATTR_COLOR = 2;
Field.ATTR_SHADOW = 3;
Field.ATTR_SCROLL = 4;

Field.ATTR_LOCKED = 5;


Field.prototype._init_with_def = function(in_def)
{
	//alert(in_def);
}


Field.prototype.set_size = function(in_size)
{
	ViewObject.prototype.set_size.call(this, in_size);
}


Field.prototype._reconfigure = function()
{
	this._div.style.border = (this._attrs[Field.ATTR_BORDER] ? '1px solid black' : '');
	this._div.style.backgroundColor = (this._attrs[Field.ATTR_COLOR] ? 
		Util.color_to_css(this._attrs[Field.ATTR_COLOR]) : 'transparent');
	this._div.style.boxShadow = (this._attrs[Field.ATTR_SHADOW] ? '2px 2px 2px 2px rgba(0,0,0,0.75)' : '');
	this._div.style.overflowY = (this._attrs[Field.ATTR_SCROLL] ? 'scroll' : 'hidden');
}


/*
	The view periodically informs all objects as to whether authoring is currently 
	occurring and whether the card text content is presently editable.
*/
Field.prototype._author_edit_changed = function(in_author, in_edit)
{
	this._div.contentEditable = in_edit;
}



