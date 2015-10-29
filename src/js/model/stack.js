/*
CinsImp
Data Model: Stack

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
	Client-side representation of a loaded Stack.
	(May also be loaded from a stack on another server)
	
	in_url_or_object may be either the URL to a stack on a server with CinsImp installed,
	or, a raw stack definition object like that embedded in the static HTML for a stack.
*/
Model.Stack = function(in_url_or_def, in_ready_handler)
{
	/* initialise the class internals */
	this._ready = false;

	/* the input is a URL, we need first to fetch the stack definition object via AJAX */
	if (typeof in_url_or_def == 'string')
	{
		this._fetch_def(in_url_or_def, in_ready_handler);
		return;
	}
	
	/* otherwise, just load the stack from the definition */
	this._load_def(in_url_or_def);
	if (this._ready_handler)
		this._ready_handler(stack, this._ready);
};
var Stack = Model.Stack;


/*
	Fetches a Stack definition from a CinsImp gateway server.
	(The server doesn't have to be our own - our own acts as a proxy)
*/

// investigate using CORS for this instead of server proxy:
//https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
Stack.prototype._fetch_def = function(in_url, in_ready_handler)
{
	this._host = Util.url_host(in_url);
	this._url = Util.url_path(in_url);
	
	var msg = {
		cmd: 'load_stack',
		stack_host: this._host,
		stack_url: this._url
	};
	
	var stack = this;
	Ajax.send(msg, function(in_reply, in_status)
	{
		if (in_status == 'ok' && in_reply.cmd == 'load_stack')
			stack._load_def(in_reply.stack);
		if (in_ready_handler)
			in_ready_handler(stack, stack._ready);
	});
}


/*
	Loads the Stack definition obtained from a gateway server.
*/
Stack.prototype._load_def = function(in_def)
{
	this._def = in_def;
	
	/* we should check the definition is valid here */ /// ** TODO **
	
	this._ready = true;
}


/*
	Returns true if the model object is ready and valid.
*/
Stack.prototype.is_ready = function()
{
	return this._ready;
}


/*
	Returns a textual description of the card size.
*/
Stack.prototype.get_card_size_text = function()
{
	return this._def.card_width + ' x ' + this._def.card_height;
}

/*
	Returns the card size.
*/
Stack.prototype.get_card_size = function()
{
	return { width: this._def.card_width, height: this._def.card_height };
}



Stack.prototype.get_attr = function(in_attr)
{
	if (!(in_attr in this._def))
		throw Error('Stack doesn\'t have an '+in_attr+' attribute.');
	return this._def[in_attr];
}


Stack.prototype.compact = function(in_onfinished)
{
	Ajax.request(
	{
		cmd: 'compact_stack',
		id: this._def.id
		
	}, in_onfinished);
}


CinsImp._script_loaded('Model.Stack');


