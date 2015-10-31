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

var CinsImp = CinsImp || {};
CinsImp.Model = CinsImp.Model || {};

var Model = CinsImp.Model;


// **TODO gradually apply ALL styling within the code, without stylesheets


/*****************************************************************************************
Construction, Defaults and Serialisation
*/

Model.Button = function(in_def, in_layer) 
{
	/* create the object */
	LayerObject.call(this, in_def, in_layer);
	this._data = 
	{
		'hilite': false
	};
	
	/* init defaults */
	if (!in_def)
	{
		Util.array_apply(this._def, 
		{
			'type': 'button',
			'name': 'New Button',
			'script': 'on mouseup\n  \nend mouseup',
			'txt_style': 'bold',
			'style': 'rounded',
			'shadow': true,
			'family': 0,
			'menu': '',
			'icon': 0,
			'show_name': true,
			'auto_hilite': false,
		
			'hilite': false
		});
		this.set_size([95, 22]);
	}
}
var Button = Model.Button;
Util.classInheritsFrom(Button, Model.LayerObject);
Button.TYPE = 'button';


Button.prototype.get_type = function()
{
	return Button.TYPE;
}



/*****************************************************************************************
DOM View
*/

Button.prototype.create_dom = function(in_view)
{
	this.parent.create_dom.call(this, in_view);
	
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
	
	return this._div;
}


// THIS #$@!* NEEDS TO BE REWRITTEN NOW:  ***TODO***
Button.prototype._dom_rebuild = function()
{
	/* cache some properties */
	var style = this.get_attr('style');
	
	/* border */
	switch (style)
	{
	case 'borderless':
		this._div.style.border = '0';
		this._div.style.borderRadius = '0';
		break;
	case 'rectangle':
		this._div.style.border = '1px solid black';
		this._div.style.borderRadius = '0';
		break;
	case 'rounded':
		this._div.style.border = '1px solid black';
		this._div.style.borderRadius = '6px';
		break;
	case 'check_box':
		this._div.style.border = '0';
		this._div.style.borderRadius = '0';
		this._icon.style.borderRadius = '0';
		break;
	case 'radio':
		this._div.style.border = '0';
		this._div.style.borderRadius = '0';
		this._icon.style.borderRadius = '8px';
		break;
	}
	
	/* background color */
	if (style != 'check_box' && style != 'radio')
	{
		/* push button color */
		if (this.get_attr('hilite'))  
		{
			// ought to find an appropriate hilite & text color *** TODO ****
			this._div.style.backgroundColor = 'black';
			this._caption.style.color = 'white';
		}
		else
		{
			this._div.style.backgroundColor = Util.color_to_css(this.get_attr('color'));
			this._caption.style.color = '';
		}
		this._icon.style.backgroundColor = 'transparent';
	}
	else
	{
		/* checkbox/radio button color */
		this._div.style.backgroundColor = 'transparent';
		this._icon.style.backgroundColor = Util.color_to_css(this.get_attr('color'));
		this._icon.style.color = 'black';
	}
	
	/* checked */
	if (style == 'check_box')
		this._icon.style.backgroundImage = (this.get_attr('hilite') ? 'url('+CinsImp._base + 'gfx/chk-tick.png)' : '');
	else if (style == 'radio')
		this._icon.style.backgroundImage = (this.get_attr('hilite') ? 'url('+CinsImp._base + 'gfx/rbn-dot.png)' : '');
	else 
		this._icon.style.backgroundImage = '';
	
	/* shadow */
	if (style == 'borderless')
	{
		/* borderless shadow */
		this._div.style.boxShadow = (this.get_attr('shadow') ? 
		'1px 1px 2px 2px rgba(0,0,0,0.75)' : '');
		this._icon.style.boxShadow = '';
	}
	else if ((style != 'check_box') && (style != 'radio'))
	{
		/* bordered push shadow and bevel */
		this._div.style.boxShadow = (this.get_attr('shadow') ? 
			'1px 1px 2px 2px rgba(0,0,0,0.75), -1px -1px 2px 0px #CCC inset' : '');
		this._icon.style.boxShadow = '';
	}
	else
	{
		/* checkbox/radio button shadow and bevel */
		this._div.style.boxShadow = '';
		this._icon.style.boxShadow = (this.get_attr('shadow') ? 
			'1px 1px 2px 2px rgba(0,0,0,0.75), -1px -1px 1px 0px #AAA inset' : 
			'-1px -1px 1px 0px #AAA inset');
		this._icon.style.marginLeft = (this.get_attr('shadow') ? '4px' : '');
	}
	
	/* icon / check-box-radio appearance */
	if (style == 'check_box' || style == 'radio')
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
		this._icon.style.border = '';
		this._icon.style.borderRadius = '';
		this._icon.style.width = '';
		this._icon.style.height = '';
		this._icon.style.marginRight = '';
		this._icon.style.backgroundImage = '';
		this._icon.style.display = 'none';
		var icon_id = this.get_attr('icon');
		if (icon_id !== 0 && icon_id !== null)
		{
			var icon = this.get_stack().get_icon(icon_id);
			if (icon)
			{
				var icon_img = document.createElement('img');
				icon_img.src = icon.data;
				this._icon.innerHTML = '';
				this._icon.appendChild(icon_img);
				this._icon.style.display = 'block';
			}
		}
	}

	/* caption */
	this._apply_text_attrs(this._caption);
	this._caption.innerHTML = '';
	if (this.get_attr('show_name'))
		this._caption.appendChild(document.createTextNode(this.get_attr('name')));
		
	/* addition/removal of menu arrow */
	if (this.get_attr('menu') !== null && this.get_attr('menu') !== '' && this._drop_arrow === null &&
		(style != 'check_box') && (style != 'radio'))
	{
		this._drop_arrow = document.createElement('img');
		this._drop_arrow.style.verticalAlign = 'middle';
		this._drop_arrow.style.float = 'right';
		this._drop_arrow.style.marginLeft = '10px';
		this._drop_arrow.src = CinsImp._base + 'gfx/drop-arrow-black.png';
		this._inner.appendChild(this._drop_arrow);
	}
	else if ((this.get_attr('menu') === null || this.get_attr('menu') === '' || 
			style == 'check_box' || style == 'radio') && 
			this._drop_arrow !== null)
	{
		try { this._inner.removeChild(this._drop_arrow); }
		catch (e) {}
		this._drop_arrow = null;
	}
	
	/* menu arrow position */
	if (style != 'check_box' && style != 'radio')
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
	}
}


Button.prototype.set_dom_editability = function(in_edit)
{
	this._div.classList.toggle('Editable', in_edit);
}



/*****************************************************************************************
DOM Interaction, Events
*/

Button.prototype._handle_menu_choice = function(in_title, in_index)
{
	alert('Chose: '+in_title + ' (Index='+in_index+')');	
}


Button.prototype._handle_mousedown = function(in_event)
{
	if (this._drop_arrow && this._view.is_browsing())
	{
		var items = this.get_attr('menu').split("\n");
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
	if (!this._view.is_browsing() || !this.get_attr('auto_hilite')) return;
	
	var style = this.get_attr('style');
	if (style == 'check_box')
	{
		/* toggle checkbox */
		if (!in_down)
			this.set_attr('hilite', !this.get_attr('hilite'));
	}
	else if (style == 'radio')
	{
		/* change radio indication */
		// needs to take account of family, if specified
	}
	else 
	{
		/* hilite push button */
		this.set_attr('hilite', in_down);
	}
}





/*

NOTES FOR REFERENCE (during refactoring)
===================

this._div.classList.add('btn');

this._div.addEventListener('mousedown', this.__handle_point_start.bind(this));
	this._div.addEventListener('touchstart', this.__handle_point_start.bind(this));
	
	
	
Button.STYLE_BORDERLESS = 0;
Button.STYLE_RECTANGLE = 1;
Button.STYLE_ROUNDED = 2;
Button.STYLE_CHECK_BOX = 3;
Button.STYLE_RADIO = 4;

*/


CinsImp._script_loaded('Model.Button');




