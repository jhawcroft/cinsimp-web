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


function Dialog(in_title, in_element) 
{
	this._div = document.createElement('div');
	this._div.className = 'Dialog';
	this._div.style.zIndex = 2000;
	
	this._titlebar = document.createElement('div');
	this._titlebar.className = 'DialogTitle';
	this._titlebar.appendChild(document.createTextNode(in_title));
	this._div.appendChild(this._titlebar);
	
	this._closebtn = document.createElement('img');
	this._closebtn.src = gBase+'gfx/closex.png';
	this._closebtn.style.width = '16px';
	this._titlebar.appendChild(this._closebtn);
	
	//this._root = document.createElement('div');
	//this._root.className = 'DialogRoot';
	//this._div.appendChild(this._root);
	
	var me = this;
	this._titlebar.addEventListener('mousedown', function(e) { Drag.beginObjectMove(e, me); });
	this._closebtn.addEventListener('click', this.hide.bind(this));
	
	if (!this._div.parentElement)
		document.body.appendChild(this._div);
		
	this._init_with_element(in_element);
}

Dialog._cover = null;


Dialog.prototype._init_with_element = function(in_element)
{
	this._root = in_element;
	this._div.appendChild(in_element);
	in_element.style.visibility = 'hidden';
	
	this._div.style.left = '0px';
	this._div.style.top = '0px';
	this._loc = [0,0];
	
	this._titlebar.style.width = in_element.clientWidth + 'px';
	this._div.style.width = in_element.clientWidth + 6 + 'px';
	this._div.style.height = in_element.clientHeight + this._titlebar.clientHeight + 6 + 'px';
	
	this._root.style.top = this._titlebar.clientHeight + 'px';
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


Dialog.prototype.show = function()
{	
	Dialog._installCover();
	Dialog._cover.style.width = window.innerWidth + 'px';
	Dialog._cover.style.height = window.innerHeight + 'px';
	Dialog._cover.style.visibility = 'visible';
	
	this._div.style.visibility = 'visible';
	this._root.style.visibility = 'visible';
}


Dialog.prototype.hide = function()
{
	this._root.style.visibility = 'hidden';
	this._div.style.visibility = 'hidden';
	Dialog._cover.style.visibility = 'hidden';
}


