/*
CinsImp
Utilities

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


function Util() {}


Util.url_path = function(in_url)
{
	var link = document.createElement("a");
    link.href = in_url;
    return link.pathname;
}


Util.url_host = function(in_url)
{
	var link = document.createElement("a");
    link.href = in_url;
    return link.hostname;
}



Util.human_size = function(in_bytes)
{
	if (in_bytes >= 1024 * 1024 * 1024)
		return Math.round(in_bytes / (1024 * 1024 * 1024)) + ' GB';
	else if (in_bytes >= 1024 * 1024)
		return Math.round(in_bytes / (1024 * 1024)) + ' MB';
	else if (in_bytes >= 1024)
		return Math.round(in_bytes / 1024) + ' KB';
	else
		return in_bytes + '';
}


Util.classInheritsFrom = function( in_subclass, in_superclass )
{ 
	if ( in_superclass.constructor == Function ) 
	{ 
		//Normal Inheritance 
		in_subclass.prototype = new in_superclass; // was new
		in_subclass.prototype.constructor = in_subclass;
		in_subclass.prototype.parent = in_superclass.prototype;
	} 
	else 
	{ 
		//Pure Virtual Inheritance 
		in_subclass.prototype = in_superclass;
		in_subclass.prototype.constructor = in_subclass;
		in_subclass.prototype.parent = in_superclass;
	} 
	return in_subclass;
}


Util.color_to_css = function(in_color)
{
	if (in_color === null || in_color == '') return 'transparent';
	var components = in_color.split(',');
	var components = [components[0] * 255, components[1] * 255, components[2] * 255];
	return 'rgb(' + components.join(',') + ')';
}


Util.modifier_shift = false;
Util.modifier_ctrl = false;
Util.modifier_alt = false;
Util.modifier_meta = false;


Util.update_modifiers = function(in_event)
{
	Util.modifier_shift = (in_event.shiftKey);
	Util.modifier_ctrl = (in_event.ctrlKey);
	Util.modifier_alt = (in_event.altKey);
	Util.modifier_meta = (in_event.metaKey);
}


window.addEventListener('keydown', Util._update_modifiers, true);
window.addEventListener('keyup', Util._update_modifiers, true);



Util.plural = function(in_value, in_singular, in_plural)
{
	if (in_value == 1) return in_value + ' ' + Util.localised_string(in_singular);
	else return in_value + ' ' + Util.localised_string(in_plural);
}



Util.insert_at_cursor = function(in_textarea, in_value) 
{
    /* for Internet Explorer: */
    if (document.selection) 
    {
        in_textarea.focus();
        var rge = document.selection.createRange();
        rge.text = in_value;
    }
    /* for other browsers */
    else if (in_textarea.selectionStart || in_textarea.selectionStart == 0) 
    {
        var pos_begin = in_textarea.selectionStart;
        var pos_end = in_textarea.selectionEnd;
        in_textarea.value = in_textarea.value.substring(0, pos_begin) + in_value + 
        	in_textarea.value.substring(pos_end, in_textarea.value.length);
        in_textarea.selectionStart = pos_begin + in_value.length;
        in_textarea.selectionEnd = in_textarea.selectionStart;
    }
    /* otherwise append */
    else
        in_textarea.value += in_value;
}


Util.auto_focus = function(in_container)
{
	var elements = in_container.getElementsByTagName('input');
	if (elements.length > 0)
		elements[0].focus();
}


Util.set_text_content = function(in_element, in_text)
{
	for (var i = 0; i < in_element.childNodes.length; i++) 
	{
    	var node = in_element.childNodes[i];
    	if (node.nodeName === "#text") 
    	{
        	node.nodeValue = in_text;
        	return;
        }
    }
    in_element.appendChild(document.createTextNode(in_text));
}


/*
	Convenience method to set the size of a DOM element.
*/
Util.set_dom_size = function(in_element, in_size, in_height)
{
	var w = 0, h = 0;
	if (in_height !== undefined)
	{
		w = in_size * 1;
		h = in_height * 1;
	}
	else if (in_size.width)
	{
		w = in_size.width * 1;
		h = in_size.height * 1;
	}
	else if (typeof in_size == 'object' && in_size.length && in_size.length == 2)
	{
		w = in_size[0] * 1;
		h = in_size[1] * 1;
	}
	else if (typeof in_size == 'string')
	{
		in_size = in_size.split(',');
		w = in_size[0] * 1;
		h = in_size[1] * 1;
	}
	
	if (in_element.tagName == 'CANVAS')
	{
		in_element.width = w;
		in_element.height = h;
	}
	else
	{
		in_element.style.width = w + 'px';
		in_element.style.height = h + 'px';
	}
}


/*
	Convenience method to set the location of a DOM element.
*/
Util.set_dom_loc = function(in_element, in_loc, in_top)
{
	var l = 0, t = 0;
	if (in_top !== undefined && typeof in_top != 'object')
	{
		l = in_loc * 1;
		t = in_top * 1;
	}
	else if (in_loc.left)
	{
		l = in_loc.left * 1;
		t = in_loc.top * 1;
	}
	else if (typeof in_loc == 'object' && in_loc.length && in_loc.length == 2)
	{
		l = in_loc[0] * 1;
		t = in_loc[1] * 1;
	}
	else if (typeof in_loc == 'string')
	{
		in_size = in_loc.split(',');
		l = in_loc[0] * 1;
		t = in_loc[1] * 1;
	}
	
	if (in_top !== undefined && typeof in_top == 'object')
	{
		l += in_top[0];
		t += in_top[1];
	}
	
	in_element.style.left = l + 'px';
	in_element.style.top = t + 'px';
}


Util.localised_string = function(in_template)
{
	return in_template;
}


Util.string = function(in_template)
{
	var localised = Util.localised_string(in_template);
	for (var i = 1; i < arguments.length; i++)
	{
		localised = localised.replace('^'+(i-1), arguments[i]);
	}
	return localised;
}



Util.array_apply = function(in_dest, in_source) 
{
    for (var property in in_source) 
    {
    	in_dest[property] = in_source[property];
        /*if (in_source.hasOwnProperty(property)) 
        {
            
        }*/
    }
    return in_dest;
};


Util.null_or_empty = function(in_value)
{
	if (in_value === null || in_value == '') return true;
	else return false;
}


Util.assoc_array_length = function(in_array) 
{
    var length = 0;
    var key;
    for (key in in_array) {
        if (obj.hasOwnProperty(key)) length++;
    }
    return length;
};



CinsImp._script_loaded('util');



