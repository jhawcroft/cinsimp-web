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

function Palette(in_div) 
{
	this._init_with_div(in_div);
}


Palette.prototype._init_with_div = function(in_div)
{
	this._div = in_div;
	this._div.className = 'Palette noselect';
		
	this._loc = [in_div.offsetLeft, in_div.offsetTop];
	
	this._titlebar = in_div.getElementsByClassName('VertTitle')[0];
	
	var me = this;
	this._titlebar.addEventListener('mousedown', function(e) { Drag.beginObjectMove(e, me); });
	
	this._closebtn = this._titlebar.getElementsByTagName('img')[0];
	this._closebtn.addEventListener('click', function(e) { me.hide(); e.preventDefault(); e.stopPropagation(); });
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


Palette.prototype.hide = function()
{
	this._div.style.visibility = 'hidden';
}


Palette.prototype.show = function()
{
	this._div.style.visibility = 'visible';
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





