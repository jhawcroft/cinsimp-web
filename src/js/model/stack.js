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
	this._changes = {};
	
	this._host = null;
	this._url = null;
	
	//this._icon_index = {}; // **TODO ** consider reimplementing this for performance later

	/* the input is a URL, we need first to fetch the stack definition object via AJAX */
	if (typeof in_url_or_def == 'string')
	{
		this._fetch_def(in_url_or_def, in_ready_handler);
		return;
	}
	
	/* otherwise, just load the stack from the definition */
	this._load_def(in_url_or_def);
	if (this._ready_handler)
		this._ready_handler(this, this._ready);
};
var Stack = Model.Stack;
Stack.TYPE = 'stack';
Util.classInheritsFrom(Stack, Model.Scriptable);


Stack.prototype.get_type = function()
{
	return Stack.TYPE;
}


/*
	Stack provided AJAX gateway;
	thus the stack can inject additional parameters, such as authentication
	and proxy settings if the stack is on a different server to the gateway.
*/
Stack.prototype.gateway = function(in_msg, in_reply_handler)
{
	if (this._host || this._url)
	{
		in_msg.host = this._host;
		in_msg.url = this._url;
	}
	
	in_msg.id = this._def.id;
	
	Ajax.request(in_msg, in_reply_handler);
}


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


Stack.prototype.get_description = function()
{
	var desc = 'stack ' + this.get_attr('name');
	return desc;
}


/*
	Returns a textual description of the card size.
*/
Stack.prototype.get_card_size_text = function()
{
	return this._def.card_width + ' x ' + this._def.card_height;
}



Stack.prototype.get_attr = function(in_attr)
{
	if (!(in_attr in this._def))
	{
		if (in_attr == 'card_size') return [this._def.card_width, this._def.card_height];
		throw Error('Stack doesn\'t have an '+in_attr+' attribute.');
	}
	if (in_attr == 'user_level')
	{
		var ul = this._def.user_level;
		if ((!Number.isInteger(ul)) || ul < 1 || ul > 5) ul = 5;
		return ul;
	}
	return this._def[in_attr];
}


Stack.prototype.set_attr = function(in_attr, in_value)
{
	switch (in_attr)
	{
	case 'script':
	case 'cant_modify':
	case 'cant_delete':
	case 'cant_abort':
	case 'cant_peek':
	case 'private_access':
	case 'user_level':
		this._changes[in_attr] = in_value;
		break;
	default:
		throw new Error('Cannot set '+in_attr+' attribute of stack');
	}
	
	if (in_attr == 'script')
		this.save();
}


Stack.prototype.apply_changes = function()
{
	for (var key in this._changes)
		this._def[key] = this._changes[key];
	this._changes = {};
}


Stack.prototype.save = function(in_onfinished)
{
	var stack = this;
	Ajax.request(
	{
		cmd: 'save_stack',
		id: this._def.id,
		stack: this._changes
	}, function(in_reply) 
	{
		if (in_reply.cmd != 'error')
			stack.apply_changes();
		if (in_onfinished) in_onfinished(in_reply.cmd != 'error');
	});
}


Stack.prototype.set_password = function(in_password, in_onfinished)
{
	alert('Set password ' + in_password); // TODO - apply hash
	in_onfinished();
}


Stack.prototype.resize = function(in_new_size, in_onfinished)
{
	var stack = this;
	Ajax.request(
	{
		cmd: 'save_stack',
		id: this._def.id,
		stack: {
			'card_width': in_new_size[0],
			'card_height': in_new_size[1]
		}
	}, function(in_reply) 
	{
		if (in_reply.cmd != 'error')
		{
			stack._def.record_version = in_reply.record_version;
			stack._def.card_width = in_new_size[0];
			stack._def.card_height = in_new_size[1];
			if (in_onfinished) in_onfinished(in_new_size);
		}
		else if (in_onfinished) in_onfinished(null);
	});
}

	
Stack.prototype.compact = function(in_onfinished)
{
	Ajax.request(
	{
		cmd: 'compact_stack',
		id: this._def.id
		
	}, in_onfinished);
}


Stack.prototype.get_icons_table = function()
{
	return this._def.icons;
}


Stack.prototype.get_icon = function(in_id)
{
	// **Needs to be optimised using an index
	for (var i = 0; i < this._def.icons.length; i++)
	{
		var icon_def = this._def.icons[i];
		if (icon_def[0] == in_id) return {id: icon_def[0], name: icon_def[1], data: icon_def[2]};
	}
	return null;
}


Stack.prototype.import_icon = function(in_id, in_name, in_data, in_onfinished)
{
	Progress.operation_begun('Importing icon into stack...');
	
	var stack = this;
	var icon_def = {
		id: in_id,
		name: in_name,
		data: in_data
	};
	
	View.current.get_stack().gateway(
	{
		cmd: 'import_icon',
		icon: icon_def
	},
	function(in_reply)
	{
		Progress.operation_finished();
		
		if (in_reply.cmd != 'error')
		{
			stack._def.icons.push([in_reply.icon_id, icon_def.name, icon_def.data]);
			if (in_onfinished) in_onfinished(in_reply.icon_id);
		}
		else
			if (in_onfinished) in_onfinished(0)
	});
}


Stack.prototype.is_readonly = function()
{
	return (this._def.file_locked || this._def.cant_modify);
}


Stack.prototype.sort = function(in_mark_state, in_bkgnd, in_direction, in_expr, in_handler)
{
	this.gateway(
	{
		cmd: 'sort',
		mark_state: in_mark_state,
		bkgnd_id: (in_bkgnd ? in_bkgnd.get_attr('id') : null),
		direction: in_direction,
		expression: in_expr
	},
	in_handler);
}


Stack.prototype.mark_by_expr = function(in_set, in_mark_state, in_bkgnd, in_expr, in_handler)
{
	this.gateway(
	{
		cmd: 'mark',
		new_state: in_set,
		mark_state: in_mark_state,
		bkgnd_id: (in_bkgnd ? in_bkgnd.get_attr('id') : null),
		expression: in_expr
	},
	in_handler);
}


Stack.prototype.mark_by_finding = function(in_set, in_mark_state, in_bkgnd, in_mode, in_text, in_field, in_handler)
{
	if (in_field) in_bkgnd = in_field.get_layer();
	var msg = {
		cmd: 'mark',
		new_state: in_set,
		mark_state: in_mark_state,
		bkgnd_id: (in_bkgnd ? in_bkgnd.get_attr('id') : null)
	};
	if (in_text !== null)
	{
		msg.mode = in_mode;
		msg.text = in_text;
		msg.field_id = (in_field ? in_field.get_attr('id') : null);
	}
	this.gateway(msg, in_handler);
}



CinsImp._script_loaded('Model.Stack');


