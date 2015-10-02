/*
CinsImp
Field object; usually user editable text/or a static label

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


function Field()
{
	LayoutObject.call(this);
	this._type = 'field';
	
	this._thing_div = document.createElement('textarea');
	this.configureCssClasses();
	this._container.appendChild(this._thing_div);
	
	this._objectConfigured();
	this.setSize(200,85);
}

Field.subclassOf( LayoutObject );


Field.prototype.getCardContent = function()
{
	return { id: this._id, content: this.getProp('content') };
}


Field.prototype.getAttrs = function()
{
	attrs = LayoutObject.prototype.getAttrs.call(this);
	//attrs.showName = this._showName;
	return attrs;
}


Field.prototype.configureCssClasses = function()
{
	this._thing_div.className = 'Field';
	//if (!this._thing_div.readOnly)
	//	this._thing_div.className += ' CursorIBeam';
	if (this._thing_div.readOnly)
		this._thing_div.className += ' '+(this._manager.isBrowseMode() ? 'CursorHand' : 'CursorArrow');
}


Field.prototype._objectConfigured = function()
{
	
}


Field.prototype.onmousedown = function(inEvent)
{
	if (this._thing_div.readOnly)
		inEvent.preventDefault();
	//inEvent.preventDefault();
}


Field.prototype._objectSizeChanged = function()
{
	if (!this._thing_div) return;
	this._thing_div.style.width = (this._size[0]) + 'px';
	this._thing_div.style.height = (this._size[1]) + 'px';
}


Field.prototype._getProp = function(propName)
{
	switch (propName)
	{
	case 'content':
		//this._thing_div.style.visibility = 'hidden';
		return this._thing_div.value;
	}
}

Field.prototype._setProp = function(propName, propValue)
{
	switch (propName)
	{
	case 'content':
		//this._thing_div.innerHTML = '';
		//this._thing_div.appendChild(document.createTextNode(propValue));
		this._thing_div.value = propValue;
		break;
	}
}


Field.prototype.setEditable = function(inEditable)
{
	if (!inEditable)
	{
		this._thing_div.readOnly = true;
		this._thing_div.disabled = true;
		this.configureCssClasses();
		//this._thing_div.style.enabled = false;
		return;
	}
	
	this._thing_div.readOnly = false;
	this._thing_div.disabled = false;
	this.configureCssClasses();
}
