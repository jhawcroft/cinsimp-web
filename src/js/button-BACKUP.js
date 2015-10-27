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


function Button(in_view, in_def, in_bkgnd) 
{
	/* create the object */
	ViewObject.call(this, ViewObject.TYPE_BUTTON, in_view, in_bkgnd);
	
	/*this._inner = document.createElement('div');
	this._div.appendChild(this._inner);
	this._inner.classList.add('zy');*/
	
	
	this._div.classList.add('Button');
	
	this._struct = document.createElement('div');
	this._struct.className = 'St';
	this._div.appendChild(this._struct);
	
	this._icon = document.createElement('div');
	this._icon.style.display = 'none';
	this._struct.appendChild(this._icon);
	
	this._caption = document.createElement('div');
	this._caption.className = 'Cp';
	this._struct.appendChild(this._caption);
	
	var me = this;
	this._div.addEventListener('mousedown', 
		function(in_event) { me._view._browse_point_start(me, [in_event.pageX, in_event.pageY]); });
	
	/* set defaults */
	if (!in_def)
	{
		this.set_attr(ViewObject.ATTR_COLOR, [1,1,1]);
		this.set_attr(ViewObject.ATTR_SHADOW, true);
		this.set_attr(ViewObject.ATTR_NAME, 'New Button');
		this.set_size([95, 22]);
		
		this.set_attr(Button.ATTR_STYLE, Button.STYLE_ROUNDED);
		this.set_attr(Button.ATTR_FAMILY, 0);
		this.set_attr(Button.ATTR_MENU, null);
		this.set_attr(Button.ATTR_ICON, 0);
		this.set_attr(Button.ATTR_SHOW_NAME, true);
		this.set_attr(Button.ATTR_HILITE, false);
		this.set_attr(Button.ATTR_AUTO_HILITE, false);
		
		this.set_attr(ViewObject.ATTR_SCRIPT, {'content':'on mouseup\r  \rend mouseup\r','selection':13});
	}
	else
		this.set_def(in_def);
	
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
Button.ATTR_FAMILY = 2;
Button.ATTR_MENU = 3;
Button.ATTR_ICON = 4;
Button.ATTR_SHOW_NAME = 5;
Button.ATTR_HILITE = 6;
Button.ATTR_AUTO_HILITE = 7;


Button.prototype._resized = function()
{
	// in case we need to change the configuration
	this._struct.style.width = this._size[0] + 'px';
	this._struct.style.height = this._size[1] + 'px';
	
	this._reconfigure();
}


Button.prototype._display_name_and_icon = function()
{
	this._icon.style.display = 'none';
	var icon_id = this.get_attr(Button.ATTR_ICON);
	if (icon_id !== 0 && icon_id !== null)
	{
		var icon_data = this._view._icon_index[icon_id];
		if (icon_data)
		{
			var icon_img = document.createElement('img');
			icon_img.src = icon_data[2];
			this._icon.innerHTML = '';
			this._icon.appendChild(icon_img);
			this._icon.style.display = 'block';
		}
	}
	
	this._caption.innerHTML = '';
	if (this.get_attr(Button.ATTR_SHOW_NAME))
		this._caption.appendChild(document.createTextNode(this.get_attr(ViewObject.ATTR_NAME)));	
}


Button.prototype._attribute_changed = function(in_attr, in_value)
{
	switch (in_attr)
	{
	case ViewObject.ATTR_COLOR:
		this._div.style.backgroundColor = (in_value ? Util.color_to_css(in_value) : 'transparent');
		break;
	case ViewObject.ATTR_SHADOW:
		this._div.style.boxShadow = (in_value ? '1px 1px 2px 2px rgba(0,0,0,0.75)' : '');
		break;
	case Button.ATTR_STYLE:
		switch (in_value)
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
		break;
	
	case Button.ATTR_ICON:
	case ViewObject.ATTR_NAME:
	case Button.ATTR_SHOW_NAME:
		this._display_name_and_icon();
		break;
	}
}


Button.prototype._display_changed = function(in_author, in_edit)
{
	this._div.classList.toggle('Editable', in_edit);
}


CinsImp._script_loaded('button');




