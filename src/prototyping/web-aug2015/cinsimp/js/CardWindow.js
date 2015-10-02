/*
CinsImp
Configures and manages a card window

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


function CardWindow()
{
	this._div = document.createElement('div');
	this._div.className = 'CardWindow';
	
	this._layer = document.createElement('div');
	this._div.appendChild(this._layer);
	
	Screen.contentArea.appendChild(this._div);
	
	this.manager = new CardLayout(this._layer);
	
	this.manager.setSize(900,400);
	
	this._stack = null;
	
	
	me = this;
	document.addEventListener('keydown', function(inEvent) { me._handleKeyDown(inEvent); });
	
	/*
	testButton = new Button();
	this.manager.addObject(testButton);
	testButton.setProp('name', 'New Button');
	testButton.moveTo(50,50);


	testButton2 = new Button();
	this.manager.addObject(testButton2);
	testButton2.setProp('name', 'Click Me!');
	testButton2.moveTo(75,200);


	this.manager.setEditBkgnd(true);
	testField1 = new Field();
	this.manager.addObject(testField1);
	testField1.setProp('name', 'Stuff');
	testField1.moveTo(30,270);

	this.manager.setEditBkgnd(false);

	testField1.setProp('content', 'Hello World.');*/
}


CardWindow.prototype._handleKeyDown = function(inEvent)
{
	if (inEvent.keyCode == 37)
		this.goPrevious();
	else if (inEvent.keyCode == 39)
		this.goNext();
	else if ((inEvent.keyCode == 49) && (inEvent.metaKey))
	{
		this.goFirst();
		inEvent.preventDefault();
	}
	else if ((inEvent.keyCode == 50) && (inEvent.metaKey))
	{
		this.goPrevious();
		inEvent.preventDefault();
	}
	else if ((inEvent.keyCode == 51) && (inEvent.metaKey))
	{
		this.goNext();
		inEvent.preventDefault();
	}
	else if ((inEvent.keyCode == 52) && (inEvent.metaKey))
	{
		this.goLast();
		inEvent.preventDefault();
	}
	else if ((inEvent.keyCode == 8) || (inEvent.keyCode == 46))
	{
		if (this.manager.getTool() != CardLayout.TOOL_BROWSE)
		{
			this.manager.deleteSelection();
			inEvent.preventDefault();
		}
	}
	else
	{
		//alert( inEvent.keyCode);
		//inEvent.preventDefault();
	}
	//else if (inEvent.keyCode = 
	//38 , 40
}


CardWindow.init = function()
{
	CardWindow.main = new CardWindow();
}


CardWindow.prototype.openStack = function(inStackID, inSkipSave)
{
	if (!inSkipSave)
	{
		this._saveAndFinishEditing(function() { this.openStack(inStackID, true); });
		return;
	}
	
	msg = {
		cmd: 'open_stack',
		stack_id: inStackID
	};
	var me = this;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
			alert("Couldn't open stack: "+msg);
		else
		{
			me._stack = msg.stack;
			
			me.manager.setSize(me._stack.card_width, me._stack.card_height);
			
			me.openCard(me._stack.first_card_id);
			//alert('Now to load card ID '+this._stack.first_card_id);
			//alert("Opened!"+status+"\n"+JSON.stringify(msg.stack));
		}
	});
}


CardWindow.prototype._saveAndFinishEditing = function(onSaved, onFailed)
{
	// this should check for a dirty condition
	// thus avoiding unnecessary saving and network transport ***

	document.activeElement.blur();
	
	this._card.card_object_data = this.manager.getCardData();
	this._card.bkgnd_object_data = this.manager.getBkgndData();
	msg = {
		cmd: 'save_card',
		card: this._card
	};
	var me = this;
	var failed = onFailed;
	var saved = onSaved;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
		{
			if (failed) failed();// window.setTimeout(failed, 0);
			else alert("Couldn't save and finish editing.");
		}
		else
		{
			if (saved) saved();//window.setTimeout(saved, 0);
		}
	});
}


CardWindow.prototype.closeStack = function()
{
	if (this._stack === null) return;
	this._saveAndFinishEditing(function() { window.location.href='/'; });
	
}


CardWindow.prototype.newStack = function()
{
	this._saveCard();
	//this.closeStack();
	
	//alert('new stack');
}


CardWindow.prototype._loadCard = function(inCard)
{
	//alert(JSON.stringify(inCard));
	this._card = inCard;
	
	bkgnd_art_url = '';
	if (this._card.bkgnd_has_art)
		bkgnd_art_url = '?art=B'+this._card.bkgnd_id;
		
	card_art_url = '';
	if (this._card.card_has_art)
		card_art_url = '?art=C'+this._card.card_id;
	
	this.manager.setBkgndData(this._card.bkgnd_object_data, bkgnd_art_url);
	this.manager.setCardData(this._card.card_object_data, card_art_url);
}


CardWindow.prototype.openCard = function(inCardID)
{
	msg = {
		cmd: 'load_card',
		card_id: inCardID
	};
	var me = this;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
			alert("Couldn't open card: "+msg);
		else
		{
			me._loadCard(msg.card);
		}
	});
}


CardWindow.prototype.toggleEditBkgnd = function()
{
	this.manager.setEditBkgnd(!this.manager.getEditBkgnd());
	Screen._stripes.style.visibility = (this.manager.getEditBkgnd() ? 'visible' : 'hidden');
}


CardWindow.prototype._ordPrev = function(inSeq, inTotal)
{
	output = inSeq-1;
	if (output < 1) output = inTotal;
	return output;
}


CardWindow.prototype._ordNext = function(inSeq, inTotal)
{
	output = inSeq+1;
	if (output > inTotal) output = 1;
	return output;
}




CardWindow.prototype.goFirst = function(inSkipSave)
{
	if (!inSkipSave)
	{
		me = this;
		this._saveAndFinishEditing( function() { me.goFirst(true) } );
		return;
	}
	msg = {
		cmd: 'nth_card',
		stack_id: this._stack.stack_id,
		num: 1
	};
	var me = this;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
		{
			alert("NTH CARD Couldn't get NTH." + msg);
		}
		else
			me._loadCard(msg.card);
	});
}


CardWindow.prototype.goNext = function(inSkipSave)
{
	if (!inSkipSave)
	{
		me = this;
		this._saveAndFinishEditing( function() { me.goNext(true) } );
		return;
	}
	msg = {
		cmd: 'nth_card',
		stack_id: this._stack.stack_id,
		num: this._ordNext(this._card.card_seq, this._card.stack_count)
	};
	var me = this;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
		{
			alert("NTH CARD Couldn't get NTH." + msg);
		}
		else
			me._loadCard(msg.card);
	});
}


CardWindow.prototype.goPrevious = function(inSkipSave)
{
	if (!inSkipSave)
	{
		me = this;
		this._saveAndFinishEditing( function() { me.goPrevious(true) } );
		return;
	}
	msg = {
		cmd: 'nth_card',
		stack_id: this._stack.stack_id,
		num: this._ordPrev(this._card.card_seq, this._card.stack_count)
	};
	var me = this;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
		{
			alert("NTH CARD Couldn't get NTH." + msg);
		}
		else
			me._loadCard(msg.card);
	});
}


CardWindow.prototype.goLast = function(inSkipSave)
{
	if (!inSkipSave)
	{
		me = this;
		this._saveAndFinishEditing( function() { me.goLast(true) } );
		return;
	}
	msg = {
		cmd: 'nth_card',
		stack_id: this._stack.stack_id,
		num: this._card.stack_count
	};
	var me = this;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
		{
			alert("NTH CARD Couldn't get NTH." + msg);
		}
		else
			me._loadCard(msg.card);
	});
}


CardWindow.prototype.newCard = function(inSkipSave)
{
	if (!inSkipSave)
	{
		me = this;
		this._saveAndFinishEditing( function() { me.newCard(true) } );
		return;
	}
	msg = {
		cmd: 'new_card',
		card_id: this._card.card_id
	};
	//alert(JSON.stringify(msg));
	//return;
	var me = this;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
		{
			alert("Couldn't NEW CARD." + msg);
		}
		else
			me._loadCard(msg.card);
	});
}


CardWindow.prototype.newBackground = function(inSkipSave)
{
	if (!inSkipSave)
	{
		me = this;
		this._saveAndFinishEditing( function() { me.newBackground(true) } );
		return;
	}
	msg = {
		cmd: 'new_bkgnd',
		card_id: this._card.card_id
	};
	var me = this;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
		{
			alert("Couldn't NEW BKGND." + msg);
		}
		else
			me._loadCard(msg.card);
	});
}


CardWindow.prototype.deleteCard = function(inSkipSave)
{
	if (!inSkipSave)
	{
		me = this;
		this._saveAndFinishEditing( function() { me.deleteCard(true) } );
		return;
	}
	msg = {
		cmd: 'delete_card',
		card_id: this._card.card_id
	};
	//alert(JSON.stringify(msg));
	//return;
	var me = this;
	Ajax.send(msg, function(msg, status)
	{
		if (status != 'ok')
		{
			alert("Couldn't DELETE CARD." + msg);
		}
		else
			me._loadCard(msg.card);
	});
}


CardWindow.prototype.newButton = function()
{
	obj = new Button();
	sz = this.manager.getSize();
	obj.moveTo( (sz[0] - obj._size[0])/2, (sz[1] - obj._size[1])/2 );
	this.manager.addObject( obj );
	this.manager.setTool(CardLayout.TOOL_BUTTON);
}


CardWindow.prototype.newField = function()
{
	obj = new Field();
	sz = this.manager.getSize();
	obj.moveTo( (sz[0] - obj._size[0])/2, (sz[1] - obj._size[1])/2 );
	this.manager.addObject( obj );
	this.manager.setTool(CardLayout.TOOL_FIELD);
}



Screen.onReady.push(CardWindow.init);




