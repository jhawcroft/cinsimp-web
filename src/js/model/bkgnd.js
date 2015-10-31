/*
CinsImp
Data Model: Background

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
	Background always takes a definition object, since it is always obtained by accessing
	a specific card, and returned within the same request.
*/
Model.Bkgnd = function(in_stack, in_def, in_ready_handler)
{
	/* initialise the class internals */
	this._ready = false;
	this._changes = {};
	this._stack = in_stack;
	this._next_id = 1;
	
	/* otherwise, just load the background from the definition */
	this._load_def(in_def);
	if (this._ready_handler)
		this._ready_handler(this, this._ready);
};
var Bkgnd = Model.Bkgnd;

Bkgnd.TYPE = 'bkgnd';


Bkgnd.prototype.get_type = function()
{
	return Bkgnd.TYPE;
}



/*
	Loads the Bkgnd definition obtained from a gateway server.
*/
Bkgnd.prototype._load_def = function(in_def)
{
	this._def = in_def;
	
	/* we should check the definition is valid here */ /// ** TODO **
	
	this._def.count_fields = 0;
	this._def.count_buttons = 0;// ** TODO ** need to be calculated initially, and maintained during edits
	
	this._ready = true;
}



Bkgnd.prototype.get_description = function()
{
	var desc = 'background ID ' + this.get_attr('id');
	var name = this.get_attr('name');
	if (name != '')
		desc += ' "' + name + '"';
	return desc;
}



Bkgnd.prototype.get_attr = function(in_attr, in_fmt)
{
	if (!(in_attr in this._def))
		throw Error('Bkgnd doesn\'t have an '+in_attr+' attribute.');

	var value = null;
	if (in_attr in this._changes) value = this._changes[in_attr];
	else value = this._def[in_attr];
	
	if (in_attr == 'count_cards' && in_fmt == 'ui')
		value = Util.plural(value, 'card', 'cards');
	else if (in_attr == 'count_buttons' && in_fmt == 'ui')
		value = Util.plural(value, 'button', 'buttons');
	else if (in_attr == 'count_fields' && in_fmt == 'ui')
		value = Util.plural(value, 'field', 'fields');
	
	return value;
}


Bkgnd.prototype.set_attr = function(in_attr, in_value)
{
	switch (in_attr)
	{
	case 'script':
	case 'cant_delete':
	case 'dont_search':
	case 'name':
		this._changes[in_attr] = in_value;
		break;
	default:
		throw new Error('Cannot set '+in_attr+' attribute of bkgnd');
	}
}


Bkgnd.prototype.apply_changes = function()
{
	for (var key in this._changes)
		this._def[key] = this._changes[key];
	this._changes = {};
}


Bkgnd.prototype.save = function(in_onfinished, in_arg)
{
	

	var card = this;
	this._changes['id'] = this._def.id;
	this._stack.gateway(
	{
		cmd: 'save_card',
		ref: this._def.id,
		bkgnd: this._changes
	}, 
	function(in_reply) 
	{
		if (in_reply.cmd != 'error') card.apply_changes();
		if (in_onfinished) in_onfinished(in_reply.cmd != 'error', in_arg);
	});
}


Bkgnd.prototype.generate_object_id = function()
{
	return this._next_id ++;
}


Bkgnd.prototype.add_object = function(in_object)
{
	this._def.objects.push(in_object);
}


Bkgnd.prototype.get_objects = function()
{
	return this._def.objects;
}


Bkgnd.prototype.get_stack = function()
{
	return this._stack;
}


CinsImp._script_loaded('Model.Bkgnd');


