/*
CinsImp
Standard dialog mechanism

*********************************************************************************
Copyright (c) 2009-2015, Joshua Hawcroft
All rights reserved.

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


function Dialog(inTemplateName)
{
	this._div = document.createElement('div');
	this._div.className = 'Dialog';
	this._div.style.zIndex = Screen.ZINDEX_DIALOG_BASE;
	this._div.style.visibility = 'hidden';
	
	this._tmp = document.getElementById('Dialog'+inTemplateName);
	this._tmp.parentElement.removeChild(this._tmp);
	this._div.appendChild(this._tmp);
	
	mez = this;
	Screen.onResize.push( function() { mez._handleScreenResized(); } );
	mez._handleScreenResized();
	
	document.body.appendChild(this._div);
}


Dialog.init = function()
{
	Dialog.current = null;
	Dialog.OpenStack = new Dialog('OpenStack');
}


Dialog.prototype.getTemplate = function()
{
	return this._tmp;
}


Dialog.prototype._handleScreenResized = function()
{
	this._div.style.width = window.innerWidth + 'px';
	this._div.style.height = window.innerHeight + 'px';
	
	//this._tmp.style.width = (window.innerWidth - 40) + 'px';
	this._tmp.style.height = (window.innerHeight - 80) + 'px';
}


Dialog.prototype.show = function()
{
	this._div.style.visibility = 'visible';
	this._tmp.style.visibility = 'visible';
	Dialog.current = this;
}


Dialog.prototype.hide = function()
{
	this._tmp.style.visibility = 'hidden';
	this._div.style.visibility = 'hidden';
}


Screen.onReady.push(Dialog.init);
