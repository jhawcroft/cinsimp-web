/*
CinsImp
Dialog:  A Simple Modal Dialog

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


function Dialog(in_title, in_element, in_flags, in_cleanup) 
{
	Dialog._list.push(this);
	
	this._dom_map = null;
	this._dom_id_map = null;
	
	this._flags = in_flags;
	this.oncleanup = in_cleanup;
	this._close_code = null;
	
	this._default_enable = false;
	
	this._user = null;
	
	this._div = document.createElement('div');
	this._div.className = 'Dialog';
	this._div.style.zIndex = 2000;
	
	this._titlebar = document.createElement('div');
	this._titlebar.className = 'DialogTitle';
	this._titlebar.appendChild(document.createTextNode(in_title));
	this._div.appendChild(this._titlebar);
	
	this._closebtn = document.createElement('img');
	this._closebtn.src = CinsImp._base + 'gfx/closex.png';
	this._closebtn.style.width = '16px';
	if (this._flags & Dialog.FLAG_NOCLOSE)
		this._closebtn.style.visibility = 'hidden';
	this._titlebar.appendChild(this._closebtn);
	
	//this._root = document.createElement('div');
	//this._root.className = 'DialogRoot';
	//this._div.appendChild(this._root);
	
	var me = this;
	this._titlebar.addEventListener('mousedown', function(e) { Drag.beginObjectMove(e, me); e.preventDefault(); e.stopPropagation(); });
	this._titlebar.addEventListener('touchstart', function(e) { if (e.touches.length != 1) return;
		Drag.beginObjectMove(e, me); e.preventDefault(); e.stopPropagation(); });
	this._closebtn.addEventListener('click', this.hide.bind(this));
	this._closebtn.addEventListener('touchstart', this.hide.bind(this));
	
	if (!this._div.parentElement)
		document.body.appendChild(this._div);
		
	this._init_with_element(in_element);
	
	Dialog._resequence();
	
	this.__keyup_handler = this._handle_keyup.bind(this);
}

Dialog.FLAG_NOCLOSE = 1;


Dialog._cover = null;
Dialog._list = [];
Dialog._visibleCount = 0;
Dialog._topZIndex = 0;


Dialog.prototype._auto_main_btn_sizes = function()
{
	var inputs = this._root.getElementsByTagName('input');
	var szFam = [];
	for (var i = 0; i < inputs.length; i++)
	{
		var input = inputs[i];
		if (input.className.indexOf('SzFam1') >= 0)
			szFam.push(input);
	}
	if (szFam.length > 1)
	{
		
	}
}


Dialog.prototype._init_with_element = function(in_element)
{
	this._root = in_element;
	this._div.appendChild(in_element);
	in_element.style.visibility = 'hidden';
	
	this._auto_main_btn_sizes();
	
	this._div.style.left = '0px';
	this._div.style.top = '0px';
	this._loc = [0,0];
	
	this._titlebar.style.width = in_element.clientWidth + 'px';
	this._div.style.width = in_element.clientWidth + 6 + 'px';
	this._div.style.height = in_element.clientHeight + this._titlebar.clientHeight + 6 + 'px';
	
	this._root.style.top = this._titlebar.clientHeight + 'px';
	
	if (this._dom_map === null) 
	{
		this._dom_map = {};
		this._dom_id_map = {};
		this._map(this._root);
	}
}


Dialog.prototype._handle_keyup = function(in_event)
{
	if (!this._default_enable) return;
	if (in_event.keyCode == 13)
	{
		if (this.onreturn) 
		{
			in_event.preventDefault();
			in_event.stopPropagation();
			this.onreturn();
		}
	}
}


Dialog._resequence = function()
{
	var offset = 2000;
	for (var p = 0; p < Dialog._list.length; p++)
		Dialog._list[p]._div.style.zIndex = offset ++;
	Dialog._topZIndex = offset - 1;
}


Dialog.prototype.bringToFront = function()
{
	var p = Dialog._list.indexOf(this);
	Dialog._list.splice(p, 1);
	Dialog._list.push(this);
	Dialog._resequence();
}


Dialog._installCover = function()
{
	if (Dialog._cover) return;
	Dialog._cover = document.createElement('div');
	Dialog._cover.className = 'Cover';
	Dialog._cover.style.zIndex = 400;
	Dialog._cover.style.backgroundColor = 'black';
	Dialog._cover.style.opacity = 0.6;
	document.body.appendChild(Dialog._cover);
}


Dialog.prototype.getLoc = function()
{
	return [this._loc[0], this._loc[1]];
}


Dialog.prototype.setLoc = function(in_loc)
{
	this._loc = [in_loc[0], in_loc[1]];
	this._div.style.left = this._loc[0] + 'px';
	this._div.style.top = this._loc[1] + 'px';
}


Dialog.prototype.centre = function()
{
	this._loc = [(window.innerWidth - this._div.clientWidth) / 2,
		(window.innerHeight - this._div.clientHeight) / 3];
	this._div.style.left = this._loc[0] + 'px';
	this._div.style.top = this._loc[1] + 'px';
}


Dialog.prototype.getVisible = function()
{
	return ((this._div.style.visibility != '') && (this._div.style.visibility != 'hidden'));
}


Dialog.prototype.element = function(in_id)
{
	return this._dom_id_map[in_id];
}


Dialog.prototype._map = function(in_root)
{
	var children = in_root.children;
	for (var i = 0; i < children.length; i++)
	{
		var child = children[i];
		var attr_name = child.dataset.attr;
		if (attr_name !== undefined)
		{
			if (this._dom_map[attr_name] === undefined)
			{
				this._dom_map[attr_name] = [ child ];
				switch (child.nodeName.toLowerCase())
				{
				case 'div':
					child.dataset.str_tmpl = child.textContent;
					break;
				}
			}
			else /* multiple elements; likely to be a radio group */
			{
				this._dom_map[attr_name].push( child );
			}
		}
		
		var attr_id = child.dataset.id;
		if (attr_id !== undefined)
			this._dom_id_map[attr_id] = child;
		
		this._map(child);
	}
}


Dialog.prototype.get_object = function()
{
	return this._populate_object;
}


Dialog.prototype.apply = function()
{
	for (var attr_name in this._dom_map)
	{
		var attr_elements = this._dom_map[attr_name];
		var attr_value = undefined;
		
		if (attr_elements.length == 1)
		{
			var attr_element = attr_elements[0];
			switch (attr_element.nodeName.toLowerCase())
			{
			case 'input':
				if (attr_element.type == 'checkbox')
					attr_value = attr_element.checked;
				else
					attr_value = attr_element.value;
				break;
			case 'select':
				attr_value = attr_element.value;
				break;
			default: 
				continue;
			}
		}
		else
		{
			for (var e = 0; e < attr_elements.length; e++)
			{
				var attr_element = attr_elements[e];
				if (attr_element.checked)
				{
					attr_value = attr_element.value;
					break;
				}
			}
		}
		
		if (attr_value !== undefined)
			this._populate_object.set_attr(attr_name, attr_value);
	}
}


Dialog.prototype.populate_with = function(in_object)
{
	this._populate_object = in_object;
	
	for (var attr_name in this._dom_map)
	{
		var attr_elements = this._dom_map[attr_name];
		var attr_value = in_object.get_attr(attr_name, 'ui');
		
		if (attr_elements.length == 1)
		{
			var attr_element = attr_elements[0];
			switch (attr_element.nodeName.toLowerCase())
			{
				case 'div':
					if (attr_element.dataset.str_tmpl)
						attr_value = Util.string(attr_element.dataset.str_tmpl, attr_value);
					attr_element.textContent = attr_value;
					break;
				case 'input':
					if (attr_element.type == 'checkbox')
						attr_element.checked = attr_value;
					else
						attr_element.value = attr_value;
					break;
				case 'select':
					attr_element.value = attr_value;
					break;
			}
		}
		else
		{
			for (var e = 0; e < attr_elements.length; e++)
			{
				var attr_element = attr_elements[e];
				if (attr_element.value == attr_value)
				{
					attr_element.checked = true;
					break;
				}
			}
		}
	}
}


Dialog.prototype.set_user = function(in_user)
{
	this._user = in_user;
}


Dialog.prototype._enable_default_keys = function()
{
	this._default_enable = true;
}


Dialog.prototype.show = function()
{	
	if (this.getVisible()) return;
	
	this._close_code = null;
	
	Dialog._installCover();
	Dialog._cover.style.width = window.innerWidth + 'px';
	Dialog._cover.style.height = window.innerHeight + 'px';
	Dialog._cover.style.visibility = 'visible';
	
	this.centre();
	
	this._div.style.visibility = 'visible';
	this._root.style.visibility = 'visible';
	
	this.bringToFront();
	
	Dialog._cover.style.zIndex = Dialog.active()._div.style.zIndex - 1;
	Dialog._visibleCount++;
	
	if (document.activeElement) document.activeElement.blur();
	Util.auto_focus(this._div);
	
	document.addEventListener('keydown', this.__keyup_handler);
	
	this._default_enable = false;
	window.setTimeout(this._enable_default_keys.bind(this), 10);
}


// really should be set oncleanup - do onclose separately **TODO
// cleanup is only valid for one showing
// close is always valid
Dialog.prototype.set_onclose = function(in_onclose)
{
	this.oncleanup = in_onclose;
}


Dialog.prototype.get_close_code = function()
{
	return this._close_code;
}


Dialog.prototype.hide = function()
{
	if (!this.getVisible()) return;
	
	document.removeEventListener('keydown', this.__keyup_handler);
	
	this._root.style.visibility = 'hidden';
	this._div.style.visibility = 'hidden';
	
	Dialog._visibleCount--;
	if (Dialog._cover)
	{
		if (Dialog._visibleCount == 0)
			Dialog._cover.style.visibility = 'hidden';
		else
			Dialog._cover.style.zIndex = Dialog.active()._div.style.zIndex - 1;
	}
	
	if (this.oncleanup)
	{
		this.oncleanup(this, this._close_code, this._user);
		this.oncleanup = null;
	}
	
	this._populate_object = null;
}


Dialog.active = function()
{
	for (var d = Dialog._list.length - 1; d >= 0; d--)
	{
		var dlg = Dialog._list[d];
		if (dlg.getVisible()) return dlg;
	}
	return null;
}


Dialog.dismiss = function(in_code)
{
	var dlg = Dialog.active();
	if (dlg) 
	{
		if (in_code !== undefined) dlg._close_code = in_code;
		dlg.hide();
	}
}


Dialog.prototype.set_title = function(in_title)
{
	Util.set_text_content(this._titlebar, in_title);
	//this._titlebar.textContent = in_title;
	//this._titlebar.appendChild(document.createTextNode(in_title));
}


CinsImp._script_loaded('dialog');

