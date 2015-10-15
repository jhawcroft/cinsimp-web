/*
CinsImp
Card size widget; visual adjustment of card size

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


function CardSizeWidget(in_container, in_change_handler)
{
	this._container = in_container;
	this.onchange = in_change_handler;
	
	this._card = document.createElement('div');
	this._card.style.display = 'block';
	this._card.style.position = 'absolute';
	this._card.style.left = '0px';
	this._card.style.top = '0px';
	this._card.style.width = '100px';
	this._card.style.height = '100px';
	this._card.style.backgroundColor = 'white';
	this._card.style.border = '1px solid black';
	this._card.style.minWidth = '18px';
	this._card.style.minHeight = '18px';
	this._card.style.maxWidth = in_container.clientWidth - 2 + 'px';
	this._card.style.maxHeight = in_container.clientHeight - 2 + 'px';
	this._card.style.overflow = 'hidden';
	
	this._handle = document.createElement('div');
	this._handle.style.display = 'block';
	this._handle.style.position = 'absolute';
	this._handle.style.right = '0px';
	this._handle.style.bottom = '0px';
	this._handle.style.width = '10px';
	this._handle.style.height = '10px';
	this._handle.style.backgroundColor = 'black';
	this._card.appendChild(this._handle);
	
	this.set_card_size([200,100]);
	
	this._container.appendChild(this._card);
	
	var me = this;
	this._handle.addEventListener('mousedown', me._begin_resize.bind(me));
	this._handle.addEventListener('touchstart', me._begin_resize.bind(me));
}


CardSizeWidget.prototype.get_card_size = function()
{
	return [this._card_size[0], this._card_size[1]];
}


CardSizeWidget.prototype.set_card_size = function(in_size)
{
	this._card_size = [in_size[0], in_size[1]];
	
	// need to set the mini card size (indirectly)
	this._card.style.width = in_size[0] / 6.0 +'px';
	this._card.style.height = in_size[1] / 6.0 +'px';
	
	if (this.onchange)
		this.onchange(this.get_card_size());
}


CardSizeWidget.prototype.get_loc = function()
{
	return [0,0];
}


CardSizeWidget.prototype.set_loc = function()
{
}


CardSizeWidget.prototype._begin_resize = function(in_event)
{
	Drag.begin_resize([in_event.pageX, in_event.pageY], [this], null);
	
}


CardSizeWidget.prototype.get_size = function()
{
	return [this._card.clientWidth, this._card.clientHeight];
}


CardSizeWidget.prototype.set_size = function(in_size)
{
	this._card.style.width = in_size[0]+'px';
	this._card.style.height = in_size[1]+'px';
	
	// need to set the big card size (directly)
	this._card_size = [this._card.clientWidth * 6.0, this._card.clientHeight * 6.0];
	
	if (this.onchange)
		this.onchange(this.get_card_size());
}


/*
var csd = document.getElementById('CardSizeDragger');
	var csh = document.getElementById('CardSizeHandle');
	
	csh.addEventListener('mousedown', function(e) { Drag.begin_resize([e.pageX, e.pageY], 
	
	
	<div style="display: block; position: absolute; left: 0; top: 0; width: 100px; height: 80px; background-color: white; border: 1px solid black; min-width: 18px; min-height: 18px; overflow: hidden;" id="CardSizeDragger"><div style="display: block; position: absolute; right: 1px; bottom: 1px; width: 16px; height: 16px; background-color: black;" id="CardSizeHandle"></div></div>
	*/
