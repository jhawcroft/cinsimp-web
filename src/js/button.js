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
	this._div.classList.remove('Object');//hack - eventually to be removed at the ViewObject level
	this._div.classList.add('btn');
	
	this._inner = document.createElement('div');
	this._div.appendChild(this._inner);
	this._inner.classList.add('zy');
	this._inner.classList.add('zx');
	
	this._icon = document.createElement('div');
	this._inner.appendChild(this._icon);
	this._icon.style.display = 'none';
	//this._icon.classList.add('zi');
	this._icon.style.marginBottom = '4px';
	
	this._caption = document.createElement('div');
	this._inner.appendChild(this._caption);
	this._caption.classList.add('zc');
	
	this._drop_arrow = null;
	
	/* add event handlers */
	this._div.addEventListener('mousedown', this._handle_mousedown.bind(this));
	this._div.addEventListener('mouseup', this._handle_mouseup.bind(this));
	
	/* set defaults or apply a persistant definition */
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
		
		this.set_attr(ViewObject.ATTR_SCRIPT, 
			{'content':'on mouseup\r  \rend mouseup\r','selection':13});
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


Button.prototype._handle_menu_choice = function(in_title, in_index)
{
	alert('Chose: '+in_title + ' (Index='+in_index+')');	
}


Button.prototype._handle_mousedown = function(in_event)
{
	if (this._drop_arrow && this._view.is_browsing())
	{
		var items = this.get_attr(Button.ATTR_MENU).split("\n");
		var mnu = new PopupMenu();
		for (var i = 0; i < items.length; i++)
			mnu.appendItem(items[i], this._handle_menu_choice.bind(this));
		var rt = this._div.getBoundingClientRect();
		mnu.show([rt.left, rt.top, rt.right, rt.bottom]);
		return;
	}

	this._auto_hilite(true);
	//this._view._browse_point_start(this, [in_event.pageX, in_event.pageY]); 
}


Button.prototype._handle_mouseup = function(in_event)
{
	this._auto_hilite(false);
	//this._view._browse_point_start(this, [in_event.pageX, in_event.pageY]); 
}


Button.prototype._auto_hilite = function(in_down)
{
	if (!this._view.is_browsing() || !this.get_attr(Button.ATTR_AUTO_HILITE)) return;
	
	var style = this.get_attr(Button.ATTR_STYLE);
	if (style == Button.STYLE_CHECK_BOX)
	{
		/* toggle checkbox */
		if (!in_down)
			this.set_attr(Button.ATTR_HILITE, !this.get_attr(Button.ATTR_HILITE));
	}
	else if (style == Button.STYLE_RADIO)
	{
		/* change radio indication */
		// needs to take account of family, if specified
	}
	else 
	{
		/* hilite push button */
		this.set_attr(Button.ATTR_HILITE, in_down);
	}
}



Button.prototype._display_name_and_icon = function()
{
	var style = this.get_attr(Button.ATTR_STYLE);
	if (style == Button.STYLE_CHECK_BOX || style == Button.STYLE_RADIO)
	{
		this._icon.style.border = '1px solid black';
		this._icon.style.width = '16px';
		this._icon.style.height = '16px';
		this._icon.style.verticalAlign = 'middle';
		this._icon.style.marginRight = '10px';
		this._icon.style.backgroundRepeat = 'no-repeat';
		this._icon.style.backgroundPosition = '0px 2px';
		this._icon.style.display = 'inline-block';
		this._icon.innerHTML = '';
		
		this._inner.classList.remove('zx');
		this._inner.style.paddingLeft = '';
		this._inner.style.paddingRight = '';
	}
	else
	{
		if (this._drop_arrow != null)
		{
			this._inner.classList.remove('zx');
			this._inner.style.paddingLeft = '10px';
			this._inner.style.paddingRight = '10px';
		}
		else
		{
			this._inner.classList.add('zx');
			this._inner.style.paddingLeft = '';
			this._inner.style.paddingRight = '';
		}
	
		this._icon.style.border = '';
		this._icon.style.borderRadius = '';
		this._icon.style.width = '';
		this._icon.style.height = '';
		this._icon.style.marginRight = '';
		this._icon.style.backgroundImage = '';
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
		if ((this.get_attr(Button.ATTR_STYLE) != Button.STYLE_CHECK_BOX) &&
				(this.get_attr(Button.ATTR_STYLE) != Button.STYLE_RADIO))
		{
			/* push button color */
			if (this.get_attr(Button.ATTR_HILITE))  
			{
				// ought to find an appropriate hilite & text color *** TODO ****
				this._div.style.backgroundColor = 'black';
				this._caption.style.color = 'white';
			}
			else
			{
				this._div.style.backgroundColor = (in_value ? Util.color_to_css(in_value) : 'transparent');
				this._caption.style.color = '';
			}
			this._icon.style.backgroundColor = 'transparent';
		}
		else
		{
			/* checkbox/radio button color */
			this._div.style.backgroundColor = 'transparent';
			this._icon.style.backgroundColor = (in_value ? Util.color_to_css(in_value) : 'transparent');
			this._icon.style.color = 'black';
		}
		break;
	case ViewObject.ATTR_SHADOW:
		if (this.get_attr(Button.ATTR_STYLE) == Button.STYLE_BORDERLESS)
		{
			/* borderless shadow */
			this._div.style.boxShadow = (in_value ? '1px 1px 2px 2px rgba(0,0,0,0.75)' : '');
			this._icon.style.boxShadow = '';
		}
		else if ((this.get_attr(Button.ATTR_STYLE) != Button.STYLE_CHECK_BOX) &&
				(this.get_attr(Button.ATTR_STYLE) != Button.STYLE_RADIO))
		{
			/* bordered push shadow and bevel */
			this._div.style.boxShadow = (in_value ? '1px 1px 2px 2px rgba(0,0,0,0.75), '+
				'-1px -1px 2px 0px #CCC inset' : '');
			this._icon.style.boxShadow = '';
		}
		else
		{
			/* checkbox/radio button shadow and bevel */
			this._div.style.boxShadow = '';
			this._icon.style.boxShadow = (in_value ? '1px 1px 2px 2px rgba(0,0,0,0.75), '+
				'-1px -1px 1px 0px #AAA inset' : '-1px -1px 1px 0px #AAA inset');
			this._icon.style.marginLeft = (in_value ? '4px' : '');
		}
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
			
		case Button.STYLE_CHECK_BOX:
			this._div.style.border = '0';
			this._div.style.borderRadius = '0';
			this._icon.style.borderRadius = '0';
			break;
		case Button.STYLE_RADIO:
			this._div.style.border = '0';
			this._div.style.borderRadius = '0';
			this._icon.style.borderRadius = '8px';
			break;
		}
		
		this._display_name_and_icon();
		this.set_attr(ViewObject.ATTR_SHADOW, this.get_attr(ViewObject.ATTR_SHADOW));
		this.set_attr(ViewObject.ATTR_COLOR, this.get_attr(ViewObject.ATTR_COLOR));
		this.set_attr(Button.ATTR_MENU, this.get_attr(Button.ATTR_MENU));
		break;
	
	case Button.ATTR_ICON:
	case ViewObject.ATTR_NAME:
	case Button.ATTR_SHOW_NAME:
		this._display_name_and_icon();
		break;
		
	case Button.ATTR_HILITE:
		{
			var style = this.get_attr(Button.ATTR_STYLE);
			if (style == Button.STYLE_CHECK_BOX)
				this._icon.style.backgroundImage = (in_value ? 'url('+gBase + 'gfx/chk-tick.png)' : '');
			else if (style == Button.STYLE_RADIO)
				this._icon.style.backgroundImage = (in_value ? 'url('+gBase + 'gfx/rbn-dot.png)' : '');
			else 
				this._icon.style.backgroundImage = '';
			this.set_attr(ViewObject.ATTR_COLOR, this.get_attr(ViewObject.ATTR_COLOR));
			break;
		}
		
	case Button.ATTR_MENU:
		var style = this.get_attr(Button.ATTR_STYLE);
		if (in_value !== null && in_value !== '' && this._drop_arrow === null &&
			(style != Button.STYLE_CHECK_BOX) && (style != Button.STYLE_RADIO))
		{
			this._drop_arrow = document.createElement('img');
			this._drop_arrow.style.verticalAlign = 'middle';
			this._drop_arrow.style.float = 'right';
			this._drop_arrow.style.marginLeft = '10px';
			this._drop_arrow.src = gBase + 'gfx/drop-arrow-black.png';
			this._inner.appendChild(this._drop_arrow);
			this._display_name_and_icon();
		}
		else if ((in_value === null || in_value === '' || 
				style == Button.STYLE_CHECK_BOX || style == Button.STYLE_RADIO) && 
				this._drop_arrow !== null)
		{
			try { this._inner.removeChild(this._drop_arrow); }
			catch (e) {}
			this._drop_arrow = null;
			this._display_name_and_icon();
		}
		break;
	}
	
	this.apply_text_attrs(this._caption, in_attr, in_value);
}


Button.prototype._display_changed = function(in_author, in_edit)
{
	this._div.classList.toggle('Editable', in_edit);
}


CinsImp._script_loaded('button');




