/*
CinsImp
CinsTalk Virtual Machine

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

/*

Synopsis
--------
Built-in commands, properties, constants and functions that are part of the CinsTalk
language environment.


Dependencies
------------

xtalk.js

*/

Xtalk.Builtins = {

/*****************************************************************************************
Generic to CinsTalk Implementation
*/

	the_date: function(in_context, in_id, in_variant)
	{
		var now = new Date();
		switch (in_variant)
		{
		case 'shrt':
		{
			return now.toLocaleDateString(Application.get_dt_locale_id(), {
				day: 'numeric',
				month: 'numeric',
				year: 'numeric'
			});
			//var yr = now.getFullYear() + '';
			//return now.getDate() + '/' + (now.getMonth()+1) + '/' + yr.substr(yr.length - 2, 2);
		}
		case 'abbr':
		{
			return now.toLocaleDateString(Application.get_dt_locale_id(), {
				weekday: 'short',
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
			//var abbr_days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
			//var abbr_months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			//return abbr_days[now.getDay()] + ', ' + abbr_months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
		}
		case 'long':
		{
			return now.toLocaleDateString(Application.get_dt_locale_id(), {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
			//var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
			//var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
			//return days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
		}
		case 'en  ':
		{
			return now.toLocaleDateString('en-us', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			});
		}
		}
	},
	
	
	function_date: function(in_message)
	{
		return Xtalk.Builtins.the_date(null, null, 'shrt');
	},
	
	
	the_time: function(in_context, in_id, in_variant)
	{
		var now = new Date();
		switch (in_variant)
		{
		case 'shrt':
		case 'abbr':
		{
			return now.toLocaleTimeString(Application.get_dt_locale_id(), {
				hour: 'numeric', 
				minute: 'numeric'
			});
			break;
		}
		case 'long':
		{
			return now.toLocaleTimeString(Application.get_dt_locale_id(), {
				hour: 'numeric', 
				minute: 'numeric',
				second: 'numeric'
			});
			break;
		}
		case 'en  ':
		{
			return now.toLocaleTimeString('en-us', {
				hour12: true,
				hour: 'numeric', 
				minute: 'numeric',
				second: 'numeric'
			});
			break;
		}
		}
	},
	
	
	function_time: function(in_message)
	{
		return Xtalk.Builtins.the_time(null, null, 'shrt');
	},
	
	
	the_dateitems: function(in_context, in_id, in_variant)
	{
		var now = new Date();
		var items = [
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			now.getHours(),
			now.getMinutes(),
			now.getSeconds(),
			now.getDay() + 1
		];
		return items.join(',');
	},
	
	
	the_timestamp: function(in_context, in_id, in_variant)
	{
		var now = new Date();
		return now.getTime();
	},
	
	
	the_item_delimiter_get: function(in_context, in_id, in_variant)
	{
		return Xtalk.VM._item_delimiter;
	},
	
	the_item_delimiter_set: function(in_context, in_id, in_new_value)
	{
		Xtalk.VM._item_delimiter = in_new_value;
	},
	
	
	the_number_format_get: function(in_context, in_id, in_variant)
	{
		return Xtalk.VM._number_format;
	},
	
	the_number_format_set: function(in_context, in_id, in_new_value)
	{
		Xtalk.VM._number_format = in_new_value;
	},
	
	
	the_address: function(in_context, in_id, in_variant)
	{
		return window.location.href;
	},
	
	
	the_edit_bkgnd_get: function(in_context, in_id, in_variant)
	{
		return View.current.is_edit_bkgnd();
	},
	
	the_edit_bkgnd_set: function(in_context, in_id, in_new_value)
	{
		View.current.edit_bkgnd( in_new_value );
	},
	
	
	the_environment: function(in_context, in_id, in_variant)
	{
		return 'development';// or 'player' if the runtime environment doesn't provide authoring
	},
	
	
	
	the_lock_errors_get: function(in_context, in_id, in_variant)
	{
		//return View.current.is_edit_bkgnd();
	},
	
	the_lock_errors_set: function(in_context, in_id, in_new_value)
	{
		//View.current.edit_bkgnd( in_new_value );
	},
	
	the_lock_screen_get: function(in_context, in_id, in_variant)
	{
		return View.current.is_screen_locked();
	},
	
	the_lock_screen_set: function(in_context, in_id, in_new_value)
	{
		if (in_new_value) View.current.lock_screen();
		else View.current.unlock_screen(); // **TODO this needs to put the VM into wait mode until unlock callback..
	},
	
	the_lock_recent_get: function(in_context, in_id, in_variant)
	{
		//return View.current.is_edit_bkgnd();
	},
	
	the_lock_recent_set: function(in_context, in_id, in_new_value)
	{
		//View.current.edit_bkgnd( in_new_value );
	},
	
	the_lock_messages_get: function(in_context, in_id, in_variant)
	{
		//return View.current.is_edit_bkgnd();
	},
	
	the_lock_messages_set: function(in_context, in_id, in_new_value)
	{
		//View.current.edit_bkgnd( in_new_value );
	},
	
	
	the_result: function(in_context, in_id, in_variant)
	{
		if (Xtalk.VM._result === null) return new Xtalk.VM.TString('');
		else return Xtalk.VM._result;
	},
	
	
	
	count_cards: function(in_context, in_id)
	{
		if (in_context === null) in_context = View.current.get_stack();
		switch (in_context.get_type())
		{
		case Stack.TYPE:
		case Bkgnd.TYPE:
			return in_context.get_attr('count_cards');
		}
	},
	
	count_bkgnds: function(in_context, in_id)
	{
		if (in_context === null) in_context = View.current.get_stack();
		switch (in_context.get_type())
		{
		case Stack.TYPE:
			return in_context.get_attr('count_bkgnds');
		}
	},
	
	
	
	term_me: function(in_id)
	{
		return Xtalk.VM.get_me();
	},
	
	term_target_container: function(in_id)
	{
		return Xtalk.VM.get_target();
	},
	
	term_target_name: function(in_context, in_id, in_variant)
	{
		var obj = Xtalk.VM.get_target();
		return obj.get_attr('name', in_variant);
	},


	term_this: function(in_id)
	{
		switch (in_id)
		{
		case 'card':
			return View.current.get_card();
		case 'bkgd':
			return View.current.get_bkgnd();
		case 'stak':
			return View.current.get_stack();
		}
	},
	
	
	new_chunk: function(in_context, in_param, in_mode, in_ident1, in_ident2)
	{
		if (in_mode != Xtalk.REF_RANGE) Xtalk.VM._error("Can't understand arguments to \"^0\".", in_param); // need better way to handle such errors **TODO
		return new Xtalk.VM.TChunk(in_param, in_ident1, in_ident2, in_context);
	},
	
	
	count_chunks: function(in_context, in_id)
	{
		return Xtalk.VM.TChunk.count(in_id, in_context.resolve().toString().toValue());
	},
	
	
	command_set: function(in_message)
	{
		/* decode and check parameters */
		var property_name = in_message.params[0];
		if (property_name === null || property_name.get_type() != 'VariableRef')
			Xtalk.VM._error("Can't understand arguments to \"^0\".", "set"); // need better way to handle such errors **TODO
		property_name = property_name.name;
		
		var object = in_message.params[1];
		object = (object.get_type() == 'Nothing') ? null : object; // need to ensure it's an object here
		
		var new_value = in_message.params[2].resolve().toValue();
		
		/* check if the object has such a property */
		var prop = null;
		try
		{
			var table = Xtalk.Dict._properties[1]['|'+property_name];
			if (!object)
				prop = table['----'];
			else
			{
				prop = table[object.get_type()];
			}
			if (!prop)
				prop = table['****'];
		}
		catch (err) {}
		if (prop == null)
			Xtalk.VM._error("No such property."); // need better way to handle such errors **TODO
		
		/* check if the property is writable */
		if (!prop.setter)
			Xtalk.VM._error("Can't set that property.");
		
		/* finally, set the property! */
		prop.setter(object, prop.param, new_value);
	},
	
	
	command_get: function(in_message)
	{
		Xtalk.VM.global_set('it', in_message.params[0].resolve());
	},
	
	
	command_put: function(in_message)
	{
		var value = in_message.params[0].resolve();
		var mode = in_message.params[1].toValue();
		var dest = in_message.params[2];
		
		if (mode === null)
		{
			Xtalk.VM.onMessageWrite( value.toString().toValue() );
		}
		else
		{
			if (dest === null || !dest.write_content)
				Xtalk.VM._error("Expected a container here.");
			dest.write_content( value, mode, null ); // value, mode, range
		}
	},
	
	
	
	
	function_abs: function(in_message)
	{
		return Math.abs(in_message.params[0].resolve().toNumber().toValue());
	},
	
	
	function_round: function(in_message)
	{
		return Math.round(in_message.params[0].resolve().toNumber().toValue());
	},
	
	
	function_trunc: function(in_message)
	{
		return Math.trunc(in_message.params[0].resolve().toNumber().toValue());
	},
	
	
	function_sqrt: function(in_message)
	{
		return Math.sqrt(in_message.params[0].resolve().toNumber().toValue());
	},
	
	
	function_exp: function(in_message)
	{
		var x = in_message.params[0].resolve().toNumber().toValue();
		return Math.exp(x);
	},
	
	
	function_exp1: function(in_message)
	{
		var x = in_message.params[0].resolve().toNumber().toValue();
		return Math.exp(x) - 1;
	},
	
	
	function_exp2: function(in_message)
	{
		var x = in_message.params[0].resolve().toNumber().toValue();
		return Math.pow(2, x);
	},
	
	
	function_atan: function(in_message)
	{
		return Math.atan(in_message.params[0].resolve().toNumber().toValue());
	},
	
	
	function_tan: function(in_message)
	{
		return Math.tan(in_message.params[0].resolve().toNumber().toValue());
	},
	
	
	function_cos: function(in_message)
	{
		return Math.cos(in_message.params[0].resolve().toNumber().toValue());
	},
	
	
	function_sin: function(in_message)
	{
		return Math.sin(in_message.params[0].resolve().toNumber().toValue());
	},
	
	
	function_avg: function(in_message)
	{
		if (in_message.params.length == 0)
			Xtalk.VM._error("Can't understand arguments of average."); // **TODO better way of this
		var a = in_message.params[0].resolve();
		if (a.get_type() == 'String')
			var params = a.toValue().split(',');
		else
			var params = in_message.params;
		var result = 0.0;
		for (var p = 0; p < params.length; p++)
		{
			var param = params[p];
			if (typeof param == 'string') result += (param * 1.0);
			else result += param.resolve().toNumber().toValue();
		}
		return result / params.length;
	},
	
	
	function_sum: function(in_message)
	{
		if (in_message.params.length == 0)
			Xtalk.VM._error("Can't understand arguments of sum."); // **TODO better way of this
		var a = in_message.params[0].resolve();
		if (a.get_type() == 'String')
			var params = a.toValue().split(',');
		else
			var params = in_message.params;
		var result = 0.0;
		for (var p = 0; p < params.length; p++)
		{
			var param = params[p];
			if (typeof param == 'string') result += (param * 1.0);
			else result += param.resolve().toNumber().toValue();
		}
		return result;
	},
	
	
	function_max: function(in_message)
	{
		if (in_message.params.length == 0)
			Xtalk.VM._error("Can't understand arguments of max."); // **TODO better way of this
		var a = in_message.params[0].resolve();
		if (a.get_type() == 'String')
			var params = a.toValue().split(',');
		else
			var params = in_message.params;
		var result = 0.0;
		for (var p = 0; p < params.length; p++)
		{
			var param = params[p];
			if (typeof param == 'string') result = Math.max( result, param );
			else result = Math.max( result, param.resolve().toNumber().toValue() );
		}
		return result;
	},
	
	
	function_min: function(in_message)
	{
		if (in_message.params.length == 0)
			Xtalk.VM._error("Can't understand arguments of min."); // **TODO better way of this
		var a = in_message.params[0].resolve();
		if (a.get_type() == 'String')
			var params = a.toValue().split(',');
		else
			var params = in_message.params;
		var result = 0.0;
		for (var p = 0; p < params.length; p++)
		{
			var param = params[p];
			if (typeof param == 'string') result = Math.min( result, param );
			else result = Math.min( result, param.resolve().toNumber().toValue() );
		}
		return result;
	},
	
	
	function_offset: function(in_message)
	{
		if (in_message.params.length != 2)
			Xtalk.VM._error("Can't understand arguments of offset."); // **TODO better way of this
		
		var needle = in_message.params[0].resolve().toString().toValue();
		var haystack = in_message.params[1].resolve().toString().toValue();
		
		return haystack.toLocaleLowerCase().indexOf( needle.toLocaleLowerCase() ) + 1;
	},
	
	
	function_length: function(in_message)
	{
		if (in_message.params.length != 1)
			Xtalk.VM._error("Can't understand arguments of length."); // **TODO better way of this
		
		var string = in_message.params[0].resolve().toString().toValue();
		return string.length;
	},
	
	
	
	
	// basically, take a single param
	// if it's not a string, just return it
	// if it is a string, try evaluating it as a CinsTalk expression
	// if that fails, just return the string itself
	function_value: function(in_message)
	{
		var param = in_message.params[0].resolve();
		if (param.get_type() != 'String') return param;
		Xtalk.VM.handle_value(param); // VM knows to return this for this special function
	},
	
	

/*****************************************************************************************
Specific to CinsImp Environment
*/


// **TODO - normally, params should be automatically resolved by resolve()
// but it would be good to have a newer mechanism to specify the level & type of resolution performed
// within the command syntax registration itself


	command_ask: function(in_message)
	{
		Xtalk.VM.wait();
		
		var is_password = (in_message.params[0].get_type() != 'Nothing');
		var prompt = in_message.params[1].resolve().toString().toValue();
		var text = (in_message.params[2].get_type() != 'Nothing') ? 
			in_message.params[2].resolve().toString().toValue() : '';
		
		document.getElementById('AskPrompt').textContent = prompt;
		document.getElementById('AskText').value = text;
		
		Dialog.Ask.set_onclose(function(in_dlog, in_code)
		{
			if (in_code) var text = document.getElementById('AskText').value;
			else var text = '';
			text = new Xtalk.VM.TString(text);
			Xtalk.VM.global_set('it', text);
			Xtalk.VM.unwait( text );
		});
		Dialog.Ask.show();
	},
	
	

	command_answer: function(in_message)
	{
		Xtalk.VM.wait();
		
		var alert = new Alert();
		alert.prompt = in_message.params[0].resolve().toString().toValue();
		if (in_message.params[1].type == 'Nothing')
		{
			alert.button1_label = 'OK';
			alert.button1_handler = Xtalk.Builtins._command_answer_end.bind(this, new Xtalk.VM.TString(alert.button1_label));
		}
		else
		{
			alert.button1_label = in_message.params[1].toString()._value;
			alert.button1_handler = Xtalk.Builtins._command_answer_end.bind(this, in_message.params[1].toString());
			if (in_message.params[2].type != 'Nothing')
			{
				alert.button2_label = in_message.params[2].toString()._value;
				alert.button2_handler = Xtalk.Builtins._command_answer_end.bind(this, in_message.params[2].toString());
				if (in_message.params[3].type != 'Nothing')
				{
					alert.button3_label = in_message.params[3].toString()._value;
					alert.button3_handler = Xtalk.Builtins._command_answer_end.bind(this, in_message.params[3].toString());
				}
			}
		}
		alert.show();
	},
	
	_command_answer_end: function(in_response)
	{
		Xtalk.VM.global_set('it', in_response);
		Xtalk.VM.unwait( in_response );
	},
	
	
	command_visual: function(in_message)
	{
		var effect = in_message.params[0].toValue();
		var speed = in_message.params[1].toValue();
		if (speed === null) speed = 'normal';
		var dest = in_message.params[2].toValue();
		if (dest === null) dest = 'card';
		View.current.queue_visual_effect(effect, speed, dest);
	},
	
	
	command_go_which: function(in_message)
	{
		var which = in_message.params[0].toValue();
		var marked = (in_message.params[1].toValue() === 'true');
		View.current.go_nth_card(which, null, marked);  // **TODO ensure we have a syntax that supports bkgnd specification
	},
	
	
	command_go_where: function(in_message)
	{
		var where = in_message.params[0].resolve();
		alert('GO WHERE - to be implemented once object references working - obtain a card ID');
	},
	
	
	
	
	ref_stack: function(in_context, in_param, in_mode, in_ident1, in_ident2) 
	{
		if (in_mode != Xtalk.REF_NAME)
			Xtalk.VM._error("Can't understand arguments of stack.");
		
		// if in_ident doesn't contain any /'s,
		// it's a stack name relative to the current card's stack
		// otherwise, it's a full URL to another stack
		
		alert('Stack ' + in_ident1);  // **TODO
	},
	
	
	ref_layer: function(in_context, in_param, in_mode, in_ident1, in_ident2) 
	{
		if (in_mode == Xtalk.REF_RANGE && in_ident2 !== null)
			Xtalk.VM._error("Can't understand arguments of ^0.", in_param); // **
		var context_type = (in_context ? in_context.get_type() : 'Nothing');
		if (in_param == 'card') // [of bkgnd/stack]
		{
			if (context_type == 'Nothing') ;
			else if (context_type == 'bkgnd') ;
			else if (context_type == 'stack') ;
			else
				Xtalk.VM._error("Can't understand arguments of ^0.", in_param);
		}
		else // [of stack]
		{
			if (context_type == 'Nothing') ;
			else if (context_type == 'stack') ;
			else
				Xtalk.VM._error("Can't understand arguments of ^0.", in_param);
		}
		
		// accessing a layer will not necessarily be syncronous
		// so we'll have to call wait,
		// and have the callback call unwait
	},
	
	
	ref_layer_object: function(in_context, in_param, in_mode, in_ident1, in_ident2) 
	{
		if (in_mode == Xtalk.REF_RANGE && in_ident2 !== null)
			Xtalk.VM._error("Can't understand arguments....", in_param);//**
			
		if (in_mode == Xtalk.REF_ID)
			var ref = in_ident1 * 1;
		else if (in_mode == Xtalk.REF_RANGE)
			var ref = '#'+in_ident1;
		else if (in_mode == Xtalk.REF_NAME)
			var ref = in_ident1;
			
		var lt = in_param.split(',');
		
		return new Xtalk.VM.LayerObjectRef(lt[0], lt[1], ref, in_context);
	},
	
	
	obj_attr_get: function(in_context, in_id, in_variant)
	{
		return in_context.get_attr(in_id);
	},
	
	obj_attr_set: function(in_context, in_id, in_new_value)
	{
		in_context.set_attr(in_id, in_new_value);
		//alert('set ' + in_id + ' of an object');
	},
	
	
	
/*
	Find, sort and mark
*/

	
	// in future, could significantly improve the decode of parameters,
	// and automate it a lot more **TODO
	
	command_find: function(in_message)
	{
		//mode,text,field,mark
		//console.log(JSON.stringify(in_message, null, 2));
	},
	
	command_sort: function(in_message)
	{
		//mark,bkgnd,dir,key
		//console.log(JSON.stringify(in_message, null, 2));
	},
	
	command_mark: function(in_message)
	{
		//mark,bkgnd,mode,text,field
		//console.log(JSON.stringify(in_message, null, 2));
	}
	
	

};





CinsImp._script_loaded('xtalk-builtins');


