/*
CinsImp
Palette:  A Simple Draggable Floating Palette

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

function Palette(in_div, in_flags) 
{
	this._div = document.createElement('div');
	this._div.className = 'Palette';
	this._div.style.zIndex = 50;
	this._flags = in_flags;
	
	this._titlebar = document.createElement('div');
	this._titlebar.className = (in_flags & Palette.TITLE_VERTICAL ? 'VertTitle' : 'HorzTitle');
	this._div.appendChild(this._titlebar);
	
	this._closebtn = document.createElement('img');
	this._closebtn.src = 'gfx/closex.png';
	this._closebtn.style.width = '16px';
	this._titlebar.appendChild(this._closebtn);
	
	var me = this;
	this._titlebar.addEventListener('mousedown', function(e) { Drag.beginObjectMove(e, me); });
	this._closebtn.addEventListener('click', function(e) { me.hide(); e.preventDefault(); e.stopPropagation(); });
	
	document.body.appendChild(this._div);
	
	this._init_with_div(in_div);
}

Palette.TITLE_VERTICAL = 1;



Palette.prototype._init_with_div = function(in_element)
{
	this._loc = [in_element.offsetLeft, in_element.offsetTop];
	this._size = [in_element.clientWidth, in_element.clientHeight];
	
	this._root = in_element;
	this._div.appendChild(in_element);
		
	in_element.style.left = 0;
	in_element.style.top = 0;
	
	this._div.style.left = this._loc[0]+'px';
	this._div.style.top = this._loc[1]+'px';
	
	
	
	
	if (this._flags & Palette.TITLE_VERTICAL)
		this._root.style.left = this._titlebar.clientWidth + 'px';
	else
		this._root.style.top = this._titlebar.clientHeight + 'px';
	//this._root.style.width = this._size[0]+ 4 + 'px';
	//this._root.style.height = this._size[1] + 'px';
	
	this.setSize(this._size);
}


Palette.prototype.getLoc = function()
{
	return [this._loc[0], this._loc[1]];
}


Palette.prototype.setLoc = function(in_loc)
{
	this._loc = [in_loc[0], in_loc[1]];
	this._div.style.left = this._loc[0] + 'px';
	this._div.style.top = this._loc[1] + 'px';
}


Palette.prototype.setSize = function(in_size)
{
	this._size = [in_size[0], in_size[1]];
	this._root.style.width = this._size[0]+1+'px';
	this._root.style.height = this._size[1]+1+'px';
	this._div.style.width = this._size[0] + 4 + (this._flags & Palette.TITLE_VERTICAL ? this._titlebar.clientWidth : 0) + 'px';
	this._div.style.height = this._size[1] + 4 + (this._flags & Palette.TITLE_VERTICAL ? 0 : this._titlebar.clientHeight) + 'px';
}


Palette.prototype.hide = function()
{
	this._root.style.visibility = 'hidden';
	this._div.style.visibility = 'hidden';
}


Palette.prototype.show = function()
{
	this._div.style.visibility = 'visible';
	this._root.style.visibility = 'visible';
}


Palette.prototype.toggle = function()
{
	if (!this.getVisible())
		this.show();
	else
		this.hide();
}


Palette.prototype.getVisible = function()
{
	return ((this._div.style.visibility != '') && (this._div.style.visibility != 'hidden'));
}





