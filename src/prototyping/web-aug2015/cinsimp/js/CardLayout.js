/*
CinsImp
Card layout manager; provides browsing and authoring of a card and background

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

function CardLayout(theDiv) 
{
	this._div = theDiv;
	this._div.className = 'CardLayout CursorHand';
	
	/*this._layer_bkgnd = document.createElement('div');
	this._layer_bkgnd.className = 'LayoutLayer';
	this._div.appendChild(this._layer_bkgnd);
	this._layer_card = document.createElement('div');
	this._layer_card.className = 'LayoutLayer';
	this._div.appendChild(this._layer_card);*/
	
	this._art_bkgnd = null;
	this._art_card = null;
	
	this._loc = Util.elementPageLoc(this._div);
	
	this._objects_card = Array();
	this._objects_bkgnd = Array();
	
	this._selection = Array();
	
	this._edit_bkgnd = false;
	
	this._flag_cmd = false;
	this._flag_opt = false;
	this._flag_ctrl = false;
	this._flag_sft = false;
	
	this._peek = 'none';
	
	this._nextID = 1;
	
	var thisObj = this;
	this._div.addEventListener('mousedown', 
		function(e) { thisObj.handleMouseDown(e); });
	document.addEventListener('keydown',
		function(e) { thisObj.checkFlagChanges(e); });
	document.addEventListener('keyup',
		function(e) { thisObj.checkFlagChanges(e); });
}


CardLayout.TOOL_BROWSE = 0;
CardLayout.TOOL_BUTTON = 1;
CardLayout.TOOL_FIELD = 2;


CardLayout.prototype.setSize = function(width, height)
{
	this._div.style.width = width + 'px';
	this._div.style.height = height + 'px';
	/*this._layer_bkgnd.style.width = width + 'px';
	this._layer_bkgnd.style.height = height + 'px';
	this._layer_card.style.width = width + 'px';
	this._layer_card.style.height = height + 'px';*/
}

CardLayout.prototype.getSize = function()
{
	return Array(this._div.clientWidth, this._div.clientHeight);
}



CardLayout.prototype.handleMouseDown = function(inEvent)
{
	this.selectNone();
	
	inEvent.stopPropagation();
	inEvent.preventDefault();
}


CardLayout.prototype.checkFlagChanges = function(inEvent)
{
	if ((this._flag_cmd != inEvent.metaKey) ||
		(this._flag_opt != inEvent.altKey) ||
		(this._flag_ctrl != inEvent.ctrlKey) ||
		(this._flag_sft != inEvent.shiftKey))
	{
		this._flag_cmd = inEvent.metaKey;
		this._flag_opt = inEvent.altKey;
		this._flag_ctrl = inEvent.ctrlKey;
		this._flag_sft = inEvent.shiftKey;
		this.handleFlagsChanged();
	}
}


CardLayout.prototype.handleFlagsChanged = function()
{
	if (this._flag_cmd && this._flag_opt)
		this.setPeekAt( (this._flag_sft ? 'fields' : 'buttons') );
	else
		this.setPeekAt( 'none' );
}


CardLayout.prototype.setPeekAt = function(inWhat)
{
	if (inWhat == this._peek) return;
	this._peek = inWhat;
	this.configureOutlines();
}


CardLayout.prototype.configureOutlines = function()
{
	if (this._tool == CardLayout.TOOL_BROWSE)
		what = this._peek;
	else if (this._tool == CardLayout.TOOL_BUTTON)
		what = (this._peek == 'none' ? 'buttons' : this._peek);
	else if (this._tool == CardLayout.TOOL_FIELD)
		what = (this._peek == 'none' ? 'fields' : this._peek);
	else
		what = 'none';
	for (var i in this._objects_bkgnd)
		this._objects_bkgnd[i].setOutline(what, true);
	if (this._edit_bkgnd) what = 'none';
	for (var i in this._objects_card)
		this._objects_card[i].setOutline(what, (!this._edit_bkgnd));
}


CardLayout.prototype.selectNone = function()
{
	if (this._alreadyNoning) return;
	this._alreadyNoning = true;
	for (var i in this._objects_card)
		this._objects_card[i].setSelected(false);
	for (var i in this._objects_bkgnd)
		this._objects_bkgnd[i].setSelected(false);
	this._alreadyNoning = false;
}


CardLayout.prototype.modifySelection = function(inObject, inSelected)
{
	this.selectNone();
	
	if (inSelected)
	{
		this._selection.push(inObject);
	}
	else
	{
		var index = this._selection.indexOf(inObject);
		if (index >= 0) this._selection.splice(index,1);
	}
}


CardLayout.prototype.zap = function()
{
	if (this._art_card)
		this._div.removeChild(this._art_card);
	if (this._art_bkgnd)
		this._div.removeChild(this._art_bkgnd);
	this._art_card = null;
	this._art_bkgnd = null;

	for (var i in this._objects_card)
	{
		this._div.removeChild(this._objects_card[i]._container);
		this._objects_card[i].zap();
	}
	this._objects_card = Array();
	for (var i in this._objects_bkgnd)
	{
		this._div.removeChild(this._objects_bkgnd[i]._container);
		this._objects_bkgnd[i].zap();
	}
	this._objects_bkgnd = Array();
	this._nextID = 1;
}



CardLayout.prototype.getCardData = function()
{
	var cd_obs = Array();
	var bg_dat = Array();
	for (var i in this._objects_card)
		cd_obs.push( this._objects_card[i].getAttrs() );
	for (var i in this._objects_bkgnd)
		bg_dat.push( this._objects_bkgnd[i].getCardContent() );
	var theData = {
		cardObjects: cd_obs,
		fieldContent: bg_dat
	};
	return JSON.stringify(theData);
}


CardLayout.prototype.getBkgndData = function()
{
	var bg_obs = Array();
	for (var i in this._objects_bkgnd)
		bg_obs.push( this._objects_bkgnd[i].getAttrs() );
	var theData = {
		bkgndObjects: bg_obs
		/*bkgndObjects: bg_obs,*/
	};
	return JSON.stringify(theData);
}


CardLayout.prototype.setCardData = function(theData, theArtURL)
{
	try { var theData = JSON.parse(theData); }
	catch (err) {}
	//this.zap();
	
	if (theArtURL != '')
	{
		this._art_card = document.createElement('img');
		this._art_card.className = 'LayerArt';
		this._art_card.src = theArtURL;
		this._div.appendChild(this._art_card);
	}
	
	saveEditBkgnd = this._edit_bkgnd;
	this._edit_bkgnd = false;
	for (i in theData.cardObjects)
	{
		obDef = theData.cardObjects[i];
		if (obDef.type == 'button')
			ob = new Button();
		else
			ob = new Field();
		ob.setAttrs(obDef);
		this.addObject(ob);
		if (this._nextID <= ob.id) this._nextID = ob.id + 1;
	}
	
	for (i in theData.fieldContent)
	{
		obDef = theData.fieldContent[i];
		ob = this.lookupBkgndFieldObjByID(obDef.id);
		if (ob)
			ob.setProp('content', obDef.content);
	}
	
	this.setEditBkgnd(saveEditBkgnd);
}


CardLayout.prototype.lookupBkgndFieldObjByID = function(theID)
{
	for (var i in this._objects_bkgnd)
		if (this._objects_bkgnd[i]._id == theID) return this._objects_bkgnd[i];
	return null;
}


CardLayout.prototype.setBkgndData = function(theData, theArtURL)
{
//alert(theArtURL);
	try { var theData = JSON.parse(theData); }
	catch (err) {}
	this.zap();
	
	if (theArtURL != '')
	{
		this._art_bkgnd = document.createElement('img');
		this._art_bkgnd.className = 'LayerArt';
		this._art_bkgnd.src = theArtURL;
		this._div.appendChild(this._art_bkgnd);
	}
	
	saveEditBkgnd = this._edit_bkgnd;
	this._edit_bkgnd = true;
	for (i in theData.bkgndObjects)
	{
		obDef = theData.bkgndObjects[i];
		if (obDef.type == 'button')
			ob = new Button();
		else
			ob = new Field();
		ob.setAttrs(obDef);
		this.addObject(ob);
		if (this._nextID <= ob.id) this._nextID = ob.id + 1;
	}
	
	this.setEditBkgnd(saveEditBkgnd);
}




CardLayout.prototype.addObject = function(theObject)
{
	theObject._manager = this;
	if (!this._edit_bkgnd)
	{
		this._objects_card.push(theObject);
		//this._layer_card.appendChild(theObject._container);
	}
	else
	{
		this._objects_bkgnd.push(theObject);
		//this._layer_bkgnd.appendChild(theObject._container);
	}
	this._div.appendChild(theObject._container);
	
	if (theObject._id == 0)
	{
		theObject._id = this._nextID ++;
	}
}


CardLayout.prototype.setEditBkgnd = function(inEditBkgnd)
{
	this.selectNone();
	this._edit_bkgnd = inEditBkgnd;
	//this._layer_card.style.visibility = (inEditBkgnd ? 'hidden' : 'visible');
	this.configureOutlines();
}


CardLayout.prototype.getEditBkgnd = function()
{
	return this._edit_bkgnd;
}


CardLayout.prototype.isBrowseMode = function()
{
	return (this._tool == CardLayout.TOOL_BROWSE);
}


CardLayout.prototype.setTool = function(inTool)
{
	if (inTool == this._tool) return;
	
	this.selectNone();
	this._tool = inTool;
	this.configureOutlines();
	
	for (var i in this._objects_card)
		this._objects_card[i].setEditable(this._tool == CardLayout.TOOL_BROWSE);
	for (var i in this._objects_bkgnd)
		this._objects_bkgnd[i].setEditable(this._tool == CardLayout.TOOL_BROWSE);
	
	switch (inTool)
	{
	case CardLayout.TOOL_BROWSE:
		this._div.className = 'CardLayout CursorHand';
		break;
	case CardLayout.TOOL_BUTTON:
		this._div.className = 'CardLayout CursorArrow';
		break;
	case CardLayout.TOOL_FIELD:
		this._div.className = 'CardLayout CursorArrow';
		break;
	}
}


CardLayout.prototype.getTool = function()
{
	return this._tool;
}



CardLayout.prototype.removeObject = function(obj)
{
	obj.zap();
	this._div.removeChild(obj._container);
	for (var i = 0; i < this._objects_card.length; i++)
	{
		if (this._objects_card[i] == obj)
		{
			this._objects_card.splice(i, 1);
			break;
		}
	}
	for (var i = 0; i < this._objects_bkgnd.length; i++)
	{
		if (this._objects_bkgnd[i] == obj)
		{
			this._objects_bkgnd.splice(i, 1);
			break;
		}
	}
}


CardLayout.prototype.deleteSelection = function()
{
	if (this._selection.length == 1)
	{
		obj = this._selection[0];
		this.selectNone();
		this.removeObject(obj);
	}
}



