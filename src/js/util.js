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


Util.niceSize = function(in_bytes)
{
	return Math.round(in_bytes / 1024) + ' KB';
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
	var components = [in_color[0] * 255, in_color[1] * 255, in_color[2] * 255];
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





