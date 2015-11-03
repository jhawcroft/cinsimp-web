/*
CinsImp
Data Model: Card

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

var CinsImp = CinsImp || {};
CinsImp.Model = CinsImp.Model || {};

var Model = CinsImp.Model;


/*
	Client-side representation of a loaded Background.
	
	in_stack must be a Model.Stack object.
	Card expects either a card ID, a card number, an ordinal, a name, or a card 
	definition object as the second argument.  Number should be prefixed with #.
*/
Model.Card = function(in_stack, in_def, in_ready_handler, in_view)
{
	Layer.call(this, in_stack, in_def, in_ready_handler, in_view);
};
var Card = Model.Card;
Card.TYPE = 'card';
Util.classInheritsFrom(Card, Model.Layer);


Card.prototype.get_type = function() { return Card.TYPE; }
Card.prototype.get_name = function() { return 'Card'; }



/*
	Fetches the definition object for the Card from the server.
*/
Card.prototype._fetch_def = function(in_ident)
{
	var card = this;
	this._stack.gateway(
	{
		cmd: 'load_card',
		id: in_ident	
	},
	function(in_reply)
	{
		if (in_reply.cmd != 'error')
		{
			card._load_def(in_reply.card);
			card._bkgnd = new Model.Bkgnd(in_reply.bkgnd);
		}
		else card._make_ready(false);
	});
}


Card.prototype._get_attr = function(in_attr, in_value, in_fmt)
{
	if (in_attr == 'seq' && in_fmt == 'ui')
		return Util.string('^0 out of ^1', in_value, this._stack.get_attr('count_cards'));
	else if (in_attr == 'count_buttons' && in_fmt == 'ui')
		return Util.plural(in_value, 'button', 'buttons');
	else if (in_attr == 'count_fields' && in_fmt == 'ui')
		return Util.plural(in_value, 'field', 'fields');
	
	return undefined;
}


Card.prototype._attr_writable = function(in_attr)
{
	switch (in_attr)
	{
	case 'script':
	case 'cant_delete':
	case 'dont_search':
	case 'marked':
	case 'name':
	case 'art':
		return true;
	default:
		return false;
	}
}


Card.prototype.get_card_content = function(in_id)
{
	var existing = this._def['content'];
	for (var i = 0; i < existing.length; i++)
	{
		if (existing[i][0] == in_id)
		{
			return existing[i][1];
		}
	}
	return null;
}


Card.prototype.set_card_content = function(in_id, in_content)
{
	this._changes['content'] = this._def['content'];
	this._make_dirty();
	
	var existing = this._def['content'];
	for (var i = 0; i < existing.length; i++)
	{
		if (existing[i][0] == in_id)
		{
			existing[i][1] = in_content;
			return;
		}
	}
	existing.push([in_id, in_content]);
}


Card.make_new = function(in_stack, in_preceeding, in_onfinished)
{
	if (typeof in_preceeding == 'object')
		in_preceeding = in_preceeding._def.id;
	
	in_stack.gateway(
	{
		cmd: 'new_card',
		card_id: in_preceeding
	},
	function(in_reply)
	{
		if (in_reply.cmd != 'error')
		{
			if (in_onfinished) in_onfinished(new CinsImp.Model.Card(in_stack, in_reply.card));
		}
		else
		{
			if (in_onfinished) in_onfinished(null);
		}
	});
}


Card.destroy = function(in_stack, in_card, in_onfinished)
{
	if (typeof in_card == 'object')
		in_card = in_card._def.id;
	
	in_stack.gateway(
	{
		cmd: 'delete_card',
		card_id: in_card
	},
	function(in_reply)
	{
		if (in_reply.cmd != 'error')
		{
			if (in_onfinished) in_onfinished(
				new CinsImp.Model.Card(in_stack, in_reply.card),
				new CinsImp.Model.Bkgnd(in_stack, in_reply.bkgnd)
			);
		}
		else
		{
			if (in_onfinished) in_onfinished(null);
		}
	});
}


Card.prototype.destroy = function(in_onfinished)
{
	Card.destroy(this._stack, this, in_onfinished);
}


Card.load_nth = function(in_stack, in_ref, in_bkgnd, in_onfinished, in_existing_card)
{
	if (in_existing_card !== null && typeof in_existing_card == 'object')
		in_existing_card = in_existing_card._def.id;
	if (in_bkgnd !== null && typeof in_bkgnd == 'object')
		in_bkgnd = in_bkgnd._def.id;
	
	var msg = 
	{
		cmd: 'load_card',
		ref: in_ref
	};
	if (in_existing_card !== null) msg.curr_card_id = in_existing_card;
	if (in_bkgnd !== null) msg.bkgnd_id = in_bkgnd;
	
	in_stack.gateway(msg,
	function(in_reply)
	{
		if (in_reply.cmd != 'error')
		{
			if (in_onfinished) in_onfinished(
				new CinsImp.Model.Card(in_stack, in_reply.card),
				(in_reply.bkgnd ? new CinsImp.Model.Bkgnd(in_stack, in_reply.bkgnd) : null)
			);
		}
		else
		{
			if (in_onfinished) in_onfinished(null, null);
		}
	});
}


Card.prototype.load_nth = function(in_ref, in_bkgnd, in_onfinished)
{
	Card.load_nth(this._stack, in_ref, in_bkgnd, in_onfinished, this);
}



CinsImp._script_loaded('Model.Card');


