/*
CinsImp
Button

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


function Button(in_view, in_def) 
{
	/* create the object */
	ViewObject.call(this, in_view);
	this._div.classList.add('Button');
	
	var me = this;
	this._div.addEventListener('mousedown', 
		function(in_event) { me._view._browse_point_start(me, [in_event.pageX, in_event.pageY]); });
	
	/* set defaults */
	if (!in_def)
	{
		this.set_size([95, 22]);
		this.set_attr(Button.ATTR_STYLE, Button.STYLE_ROUNDED);
		this.set_attr(Button.ATTR_COLOR, [1,1,1]);
		this.set_attr(Button.ATTR_SHADOW, true);
		this.set_attr(Button.ATTR_ICON, 0);
		this.set_attr(Button.ATTR_MENU, null);
	}
	else
		this._init_with_def(in_def);
	
	/* complete configuration */
	this._reconfigure();
}

Util.classInheritsFrom(Button, ViewObject);


Button.prototype.get_type = function()
{
	return Button.TYPE;
}
Button.TYPE = 'button';


Button.STYLE_BORDERLESS = 0;
Button.STYLE_RECTANGLE = 1;
Button.STYLE_ROUNDED = 2;
Button.STYLE_CHECK_BOX = 3;
Button.STYLE_RADIO = 4;

Button.ATTR_STYLE = 1;
Button.ATTR_COLOR = 2;
Button.ATTR_SHADOW = 3;
Button.ATTR_MENU = 4;
Button.ATTR_ICON = 5;


Button.prototype._init_with_def = function(in_def)
{
	//alert(in_def);
}


Button.prototype.set_size = function(in_size)
{
	ViewObject.prototype.set_size.call(this, in_size);
	this._reconfigure();
}


Button.prototype._reconfigure = function()
{
	this._div.style.backgroundColor = (this._attrs[Button.ATTR_COLOR] ? 
		Util.color_to_css(this._attrs[Button.ATTR_COLOR]) : 'transparent');
	this._div.style.boxShadow = (this._attrs[Button.ATTR_SHADOW] ? '1px 1px 2px 2px rgba(0,0,0,0.75)' : '');
	
	switch (this._attrs[Button.ATTR_STYLE])
	{
	case Button.STYLE_BORDERLESS:
		this._div.style.border = '0';
		this._div.style.borderRadius = '0';
		break;
	case Button.STYLE_RECTANGLE:
		this._div.style.border = '1px solid black';
		this._div.style.borderRadius = '0';
		break;
	case Button.STYLE_ROUNDED:
		this._div.style.border = '1px solid black';
		this._div.style.borderRadius = '6px';
		break;
	case Button.STYLE_CHECK_BOX:  // ** TODO
		this._div.style.border = '0';
		this._div.style.borderRadius = '0';
		break;
	case Button.STYLE_RADIO:  // ** TODO
		this._div.style.border = '0';
		this._div.style.borderRadius = '0';
		break;
	}
}


Button.prototype._author_edit_changed = function(in_author, in_edit)
{
	this._div.classList.toggle('Editable', in_edit);
}




