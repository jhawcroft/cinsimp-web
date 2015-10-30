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


// **TODO gradually apply ALL styling within the code, without stylesheets


/*****************************************************************************************
Construction, Defaults and Serialisation
*/

Model.Field = function(in_def, in_layer) 
{
	/* create the object */
	LayerObject.call(this, in_def, in_layer);
	this._data = 
	{
		'content': ''
	};
	
	/* init defaults */
	if (!in_def)
	{
		Util.array_apply(this._def, 
		{
			'border': true,
			'shadow': false,
			'scroll': false,
			'locked': false,
			'dont_wrap': false,
			'auto_tab': false,
			'wide_margins': false,
			'auto_select': false,
			'selection': '',
			'picklist': '',
		
			'content': ''
		});
		this.set_size([200, 85]);
	}
}
var Field = Model.Field;
Util.classInheritsFrom(Field, Model.LayerObject);
Field.TYPE = 'field';


Field.prototype.get_type = function()
{
	return Field.TYPE;
}



/*****************************************************************************************
DOM View
*/

Field.prototype.create_dom = function(in_view)
{
	this.parent.create_dom.call(this, in_view);
	
	this._div.classList.add('fld');
	
	this._inner = document.createElement('div');
	this._div.appendChild(this._inner);
	this._inner.style.boxSizing = 'border-box';
	
	return this._div;
}


Field.prototype._dom_rebuild = function()
{
	this._div.style.border = (this.get_attr('border') ? '1px solid black' : '');
	this._div.style.backgroundColor = Util.color_to_css(this.get_attr('color'));
	this._div.style.boxShadow = (this.get_attr('shadow') ? '2px 2px 2px 2px rgba(0,0,0,0.75)' : '');
	
	this._inner.style.overflowY = (this.get_attr('scroll') ? 'scroll' : 'hidden');
	this._inner.style.padding = (this.get_attr('wide_margins') ? '10px' : '0px');
	this._inner.style.whiteSpace = (this.get_attr('dont_wrap') ? 'nowrap' : 'normal');
	
	this._apply_text_attrs(this._inner);
}


Field.prototype._attribute_written = function(in_attr, in_value)
{
	switch (in_attr)
	{
	case 'content':
		if (this._div) this._inner.innerHTML = in_value;
		break;
	}
}


Field.prototype._attribute_reading = function(in_attr)
{
	if (this._div && in_attr == 'content')
		this.set_attr(in_attr, this._inner.innerHTML);
}



/*****************************************************************************************
DOM Interaction, Events
*/


Field.prototype.set_dom_editability = function(in_edit, in_show_content)
{
	var editable = (in_edit && !this.get_attr('locked'));
	
	this._inner.style.visibility = (in_show_content ? 'visible' : 'hidden');
	this._inner.contentEditable = editable;
	
	this._inner.style.cursor = (editable ? 'text' : '');
	
	var state = (editable ? 'text' : 'none');
	this._inner.style.userSelect = state;
	this._inner.style.MozUserSelect = state;
	this._inner.style.webkitUserSelect = state;
	this._inner.style.webkitTouchCallout = state;
	this._inner.style.khtmlUserSelect = state;
	this._inner.style.msUserSelect = state;
}




CinsImp._script_loaded('Model.Field');


