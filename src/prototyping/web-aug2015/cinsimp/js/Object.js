/*
CinsImp
Object abstract base class; basic functionality of all layout objects

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


function LayoutObject()
{
	this._manager = null;
	this._type = 'object';
	this._id = 0;
	this._name = '';
	this._visible = true;
	
	this._container = document.createElement('div');
	this._container.className = 'LayoutObject';
	
	this._size = Array(0,0);
	this._loc = Array(0,0);
	this.setSize(50,50);
	
	var thisObj = this;
	this._container.addEventListener('mousedown', 
		function(e) { thisObj.handleMouseDown(e); });
}


LayoutObject.prototype.zap = function()
{
	this.setOutline('none', false);
}


LayoutObject.prototype.getAttrs = function()
{
	attrs = {};
	attrs.type = this._type;
	attrs.id = this._id;
	attrs.name = this._name;
	attrs.visible = this._visible;
	
	attrs.rectangle = Array(this._loc[0], this._loc[1], 
		this._loc[0]+this._size[0], this._loc[1]+this._size[1]).join(',');
		
	return attrs;
}


LayoutObject.prototype.getCardContent = function()
{
}


LayoutObject.prototype.setAttrs = function(theAttrs)
{
	this._id = theAttrs.id;
	this._name = theAttrs.name;
	this._visible = theAttrs.visible;
	
	rect = theAttrs.rectangle.split(',');
	this.moveTo(rect[0] * 1, rect[1] * 1);
	this.setSize((rect[2]-rect[0])*1, (rect[3]-rect[1])*1);
	
	if (this._objectConfigured) this._objectConfigured();
}


LayoutObject.prototype.handleMouseDown = function(inEvent)
{
	if ((this._type == 'button') && (this._manager.getTool() == CardLayout.TOOL_BUTTON))
		canLayout = true;
	else if ((this._type == 'field') && (this._manager.getTool() == CardLayout.TOOL_FIELD))
		canLayout = true;
	else
		canLayout = false;
	
	if (!canLayout)
	{
		if (this.onmousedown) this.onmousedown(inEvent);
		else inEvent.preventDefault();
		inEvent.stopPropagation();
		return;
	}

	this.setSelected(true);

	if (Util.getEventMouseRegion(inEvent) == 'bottom-right')
		Drag.beginObjectResize(inEvent, this);
	else
		Drag.beginObjectMove(inEvent, this);
		
	inEvent.stopPropagation();
}


LayoutObject.prototype.getProp = function(propName)
{
	switch (propName)
	{
	case 'id':
		return this._id;
	case 'name':
		return this._name;
	case 'visible':
		return this._visible;
	default:
		if (this._getProp) return this._getProp(propName);
	}
}

LayoutObject.prototype.setProp = function(propName, propValue)
{
	switch (propName)
	{
	case 'name':
		this._name = propValue;
		break;
	case 'visible':
		this._visible = propValue;
		break;
	default:
		if (this._setProp) this._setProp(propName, propValue);
	}
	if (this._objectConfigured) this._objectConfigured();
}


LayoutObject.prototype.getSize = function()
{
	return this._size;
}


LayoutObject.prototype.setSize = function(w,h)
{
	this._size = Array(w,h);
	this._container.style.width = w + 'px';
	this._container.style.height = h + 'px';
	
	if (this._selected)
	{
		this._selected.style.width = (this._size[0]-6) + 'px';
		this._selected.style.height = (this._size[1]-6) + 'px';
	}
	if (this._outline)
	{
		this._outline.style.width = (this._size[0]) + 'px';
		this._outline.style.height = (this._size[1]) + 'px';
	}
	
	if (this._objectSizeChanged) this._objectSizeChanged();
}


LayoutObject.prototype.getLoc = function()
{
	return this._loc;
}


LayoutObject.prototype.moveTo = function(x,y)
{
	this._loc = Array(x,y);
	this._container.style.left = x+'px';
	this._container.style.top = y+'px';
	
	if (this._outline)
	{
		this._outline.style.left = (this._loc[0]-1) + 'px';
		this._outline.style.top = (this._loc[1]-1) + 'px';
	}
}


LayoutObject.prototype.setSelected = function(inSelected)
{
	if (inSelected && (!this._selected))
	{
		if (this._manager) this._manager.modifySelection(this, true);
		this._selected = document.createElement('div');
		this._selected.className = 'LayoutObjectSelected';
		this._selected.style.width = (this._size[0]-6) + 'px';
		this._selected.style.height = (this._size[1]-6) + 'px';
		this._container.appendChild(this._selected);
	}
	else if ((!inSelected) && this._selected)
	{
		if (this._manager) this._manager.modifySelection(this, false);
		this._container.removeChild(this._selected);
		this._selected = null;
	}
}


LayoutObject.prototype.setOutline = function(inWhat, inVisible)
{
	if ((inWhat == this._type+'s') && (!this._outline))
	{
		this._outline = document.createElement('div');
		this._outline.className = 'LayoutObjectOutline';
		this._outline.style.left = (this._loc[0]-1) + 'px';
		this._outline.style.top = (this._loc[1]-1) + 'px';
		this._outline.style.width = (this._size[0]) + 'px';
		this._outline.style.height = (this._size[1]) + 'px';
		this._manager._div.appendChild(this._outline);
		
		var thisObj = this;
		this._outline.addEventListener('mousedown', 
			function(e) { thisObj.handleMouseDown(e); });
	}
	else if ((this._outline) && (inWhat != this._type+'s'))
	{
		this._manager._div.removeChild(this._outline);
		this._outline = null;
	}
	
	this._container.style.visibility = (inVisible ? 'visible' : 'hidden');
	if (this._outline)
		this._outline.style.visibility = (inVisible ? 'visible' : 'hidden');
}


LayoutObject.prototype.setData = function(theData)
{
	this._id = theData.id;
	this._name = theData.name;
}


LayoutObject.prototype.setEditable = function(inEditable)
{	
}



