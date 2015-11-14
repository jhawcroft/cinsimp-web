/*
CinsImp
xTalk Compiler Dictionary

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
TODO: include comprehensive description of all registration functions and their 
corresponding language structures, with rationale for why to use a specific structure
ahead of another.

*/



Xtalk.Dict = {

/*****************************************************************************************
Constants
*/
	
	/* two types of constant: */
	_TERM: 1,		/* a term is read-only, but may evaluate to different values depending
					   on when and where it is used */
	_CONSTANT: 2,   /* a constant always has the same value */


/*****************************************************************************************
Module Globals 
*/

	_constants: [],
	_properties: [],
	_references: [],
	_counts: [],

	/* Commands:
	
	   Two levels of access:
		 _commands[ <first word> ][n] := <definition>, where n is the definition index.
	   
	   Command definitions consist of:
	   -	pattern (a tree produced by the parse-bnf module which describes the syntax)
	   -	parameters (an array of named arguments in the order they will be presented
	   		to the handling function)
	   -    delayed (an array of boolean flags indicating whether the corresponding 
	   		argument value should be evaluated to a primitive type, or left as a 
	   		reference type for further processing)
	   -	handler (a function to implement the command behaviour and to which the
	   		arguments will be provided)
	*/
	_commands: [], 
	_generics: {}, /* generic commands with no specific syntax */
	
	_functions: {},
	
	_loading_plugins: false,


/*****************************************************************************************
Registration 
*/

/*
	Registers a named read-only term handler.
 */
	register_term: function(in_name, in_id, in_handler)
	{
		var word_count = Xtalk._word_count(in_name);
		if (!this._constants[word_count])
			this._constants[word_count] = [];
		this._constants[word_count][in_name.toLowerCase()] = {
			type: 		this._TERM,
			id:			in_id,
			handler: 	in_handler
		};
	},


/*
	Registers a named constant value.
 */
	register_constant: function(in_name, in_value)
	{
		var word_count = Xtalk._word_count(in_name);
		if (!this._constants[word_count])
			this._constants[word_count] = [];
			
		this._constants[word_count][in_name.toLowerCase()] = {
			type: 		this._CONSTANT,
			value: 		in_value
		};
	},


/*
	Registers property handlers for a specific parent object context.
 */
	register_property: function(in_name, in_id, in_variant, in_context_type, in_getter, in_setter)
	{
		var in_name = in_name.toLowerCase();
		in_name = '|'+in_name; // javascript fix
		var word_count = Xtalk._word_count(in_name);
		
		if (!this._properties[word_count])
			this._properties[word_count] = [];
		var phrase_table = this._properties[word_count];
		
		if (!phrase_table[in_name])
			phrase_table[in_name] = {};
		var context_type_map = phrase_table[in_name];
		
		context_type_map[in_context_type] = {
			param:		in_id,
			variant:	in_variant,
			handler:	in_getter,
			setter:		(in_setter ? in_setter : null)
		};
	},


/*
	Registers a object reference handlers for a specific parent object context.
 */
	register_reference: function(in_name, in_id, in_context_type, in_handler)
	{
		var in_name = in_name.toLowerCase();
		var word_count = Xtalk._word_count(in_name);
		
		if (!this._references[word_count])
			this._references[word_count] = [];
		var phrase_table = this._references[word_count];
		
		if (!phrase_table[in_name])
			phrase_table[in_name] = {};
		var context_type_map = phrase_table[in_name];
		
		context_type_map[in_context_type] = {
			param:		in_id,
			handler:	in_handler
		};
	},


/*
	Registers an object counter for a specific parent object context.
 */
	register_count: function(in_name, in_id, in_context_type, in_handler)
	{
		var in_name = in_name.toLowerCase();
		var word_count = Xtalk._word_count(in_name);
		
		if (!this._counts[word_count])
			this._counts[word_count] = [];
		var phrase_table = this._counts[word_count];
		
		if (!phrase_table[in_name])
			phrase_table[in_name] = {};
		var context_type_map = phrase_table[in_name];
		
		context_type_map[in_context_type] = {
			param:		in_id,
			handler:	in_handler
		};
	},
	

/*
	Registers a command syntax, argument sequence, argument evaluation and handler.
 */
	register_command_syntax: function(in_syntax, in_arguments, in_handler)
	{
		var me = Xtalk.Dict; /* because this function may be invoked from a plugin */
		
		in_syntax = in_syntax.toLowerCase();
		var first_word = in_syntax.split(' ', 1)[0].trim().toLowerCase();
		
		var args = in_arguments.split(',');
		var delayed = [];
		for (var a = 0; a < args.length; a++)
		{
			var arg_name = args[a].trim().toLowerCase();
			if (arg_name.substr(0, 1) == '|' &&
				arg_name.substr(arg_name.length-1, 1) == '|')
			{
				arg_name = arg_name.replace('|','').trim();
				delayed.push(true);
			}
			else
				delayed.push(false);
			args[a] = arg_name;
		}
		
		var def = {
			pattern: Xtalk.Parser.BNF.parse(in_syntax),
			parameters: args,
			delayed: delayed,
			handler: in_handler,
			is_plugin: me._loading_plugins
		};
		
		if (me._commands['|'+first_word] === undefined)
			me._commands['|'+first_word] = [];
		me._commands['|'+first_word].push( def );
	},
	
	
	register_command: function(in_command, in_handler)
	{
		
	},
	
	
	register_function: function(in_function, in_handler, in_has_prop_variant)
	{
		me = Xtalk.Dict;
		me._functions[in_function.toLowerCase()] = 
		{
			handler: in_handler,
			is_plugin: me._loading_plugins
		};
		
		if (in_has_prop_variant)
			me.register_property(in_function, null, null, '****', 
			function(in_context, in_id, in_variant)
			{
				var params = (in_context && in_context.get_type() != 'Nothing' ?
							  [in_context] : []);
				var message = new Xtalk.VM.Message(in_function, true, params, true, me._loading_plugins);
				return in_handler(message);
			});
	},
	

/*****************************************************************************************
Language Built-in Initalization
*/

	init_builtins: function()
	{
/*
	Command syntax
 */
 
 
/*
	Sound
*/
 		this.register_command_syntax(
			'beep <number> [time | times]', 
			'number', 
			function(n) { alert('BEEP! ' + JSON.stringify(n)); }
		);
		

/*
	Find, Sort, Mark - data query operations
*/	

// probably store a plain text version of field contents
// for faster sorting and searching, separately to the rich content?

// find mechanism needs to work independently of the UI

		//all of these need to take unresolved field/layer references
		// ought to look at a more advanced coercion & validation than was previously provided for such things
		
		this.register_command_syntax(
			'find [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] <text> [in <field>] [of {`mark``false`unmarked|`true`marked} cards]', 
			'mode,text,field,mark', 
			Xtalk.Builtins.command_find
		);
		
		this.register_command_syntax(
			'sort [[the] [`mark``true`marked|`false`unmarked] cards [{in|of} <bkgnd>]] [`dir``asc`ascending|`des`descending] by <key>', 
			'mark,bkgnd,dir,key', 
			Xtalk.Builtins.command_sort
		);
		this.register_command_syntax(
			'sort <bkgnd> [`dir``asc`ascending|`des`descending] by <key>', 
			'mark,bkgnd,dir,key', 
			Xtalk.Builtins.command_sort
		);
		
		this.register_command_syntax(
			'mark [`mark``all`all|`false`unmarked] [cards] [{in|of} <bkgnd>] [by finding [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] <text> [in <field>]]', 
			'mark,bkgnd,mode,text,field', 
			Xtalk.Builtins.command_mark_find
		);
		this.register_command_syntax(
			'unmark [`mark``all`all|`true`marked] [cards] [{in|of} <bkgnd>] [by finding [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] <text> [in <field>]]', 
			'mark,bkgnd,mode,text,field', 
			Xtalk.Builtins.command_mark_find
		);// check the message name
		
		this.register_command_syntax(
			'mark cards where <expr>', 
			'expr', 
			Xtalk.Builtins.command_mark_expr
		);
		this.register_command_syntax(
			'unmark cards where <expr>', 
			'expr', 
			Xtalk.Builtins.command_mark_expr
		);
		
		
	/*
	
	Initially, implement only the client-side & server-assisted versions of these commands.
	
	find [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] <text> [in <field>] [of {unmarked|marked} cards]
	(^ server-side assist; avoids massive download)
	
	sort [[the] {`mark``true`marked|`false`unmarked} cards] of <bkgnd> [`dir``asc`ascending|`des`descending] by <sortKey>
	sort [[the] [marked] cards] [`dir``asc`ascending|`des`descending] by <sortKey>
	sort <bkgnd> [`dir``asc`ascending|`des`descending] by <sortKey>
	(if sortkey is a simple field - (^ server-side assist; avoids massive download))
	
	Could we possibly send an expression, involving no function calls to the server for sort processing?
	Biggest issue is ensuring the VMs produce exactly the same results, and of course, connecting references
	to the appropriate data.
	
	
	mark <card>
	mark [`mark``any`all|`false`unmarked] [cards] [{in|of} <bkgnd>] [by finding [<find-mode>] <text> [in <field>]]
	unmark [all|marked] [cards]  (as above)
	unmark all
	unmark <card>
	(^ server-side assist; avoids massive download)
	
	unmark cards where <expr>
	mark cards where <expr>
	
	(As above, would be good if we could send the expression (with no function calls) to the server)
	
	** Eventually we'll want a server-side VM anyway.
	==> that'll be much easier to do reliably once the VM design and stack interface/API is settled and cleaned, and simplified.
	
	*/
		
		
		/*
		this.register_command_syntax(
			'sort [[the] cards] [`dir``asc`ascending|`des`descending] by <sortKey>', 
			'dir,sortKey', 
			function(n) { alert('SORT! ' + JSON.stringify(n)); }
		);
		
		this.register_command_syntax(
			'find [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] <text> [in <field>]', 
			'mode,text,field', 
			function(n) { alert('FIND! ' + JSON.stringify(n)); }
		);
		*/
		
/*
	User interaction
 */
		
		this.register_command_syntax(
			'answer <prompt> [with <button1> [or <button2> [or <button3>]]]',
			'prompt,button1,button2,button3',
			Xtalk.Builtins.command_answer
		);
		
		this.register_command_syntax(
			'ask [`password``1`password] <prompt> [with <response>]', 
			'password,prompt,response', 
			Xtalk.Builtins.command_ask
		);
		
		
/*
	Display
 */
 
		this.register_command_syntax(
			'visual [effect] {`effect``cut`cut|`dissolve`dissolve|`wipe-left`wipe left|`wipe-right`wipe right|`slide-left`slide left|`slide-right`slide right} [`speed``very-slow`very slowly|`very-slow`very slow|`slow`slowly|`slow`slow|`normal`normal|`very-fast`very fast|`fast`fast] [to {`dest``card`card|`black`black|`white`white|`gray`gray|`gray`grey}]',
			'effect,speed,dest',
			Xtalk.Builtins.command_visual
		);
		
		
/*
	Navigation
 */
		this.register_command_syntax(
			'go [to] [the] {`which``#next`next|`#prev`prev|`#prev`previous|`#1`first|`#2`second|`#3`third|`#4`fourth|`#5`fifth|`#6`sixth|`#7`seventh|`#8`eighth|`#9`ninth|`#10`tenth|`#middle`middle|`#last`last|`#any`any} [[`marked``true`marked] card]',
        	'which,marked',
        	Xtalk.Builtins.command_go_which
        );
        this.register_command_syntax(
			'go [to] <where>',
        	'where',
        	Xtalk.Builtins.command_go_where
        );
	

/*
	Data access/mutation
 */
		this.register_command_syntax(
			'set [the] <prop> [of <object>] to <value>',
        	'prop,object,value',
        	Xtalk.Builtins.command_set
        );

        this.register_command_syntax(
			'get <value>',
        	'value',
        	Xtalk.Builtins.command_get
        );
        
        this.register_command_syntax(
			'put <value> [{`mode``into`into|`after`after|`before`before} <dest>]',
        	'value,mode,dest',
        	Xtalk.Builtins.command_put
        );
        
        

/*
	Generic functions
*/
// annuity ?
// compound ?

		this.register_function('value', Xtalk.Builtins.function_value);
		
		this.register_function('abs', Xtalk.Builtins.function_abs, true);
		this.register_function('round', Xtalk.Builtins.function_round, true);
		this.register_function('trunc', Xtalk.Builtins.function_trunc, true);
		this.register_function('sqrt', Xtalk.Builtins.function_sqrt, true);
		this.register_function('exp', Xtalk.Builtins.function_exp, true);
		this.register_function('exp1', Xtalk.Builtins.function_exp1, true);
		this.register_function('exp2', Xtalk.Builtins.function_exp2, true);
		
		this.register_function('atan', Xtalk.Builtins.function_atan, true);
		this.register_function('tan', Xtalk.Builtins.function_tan, true);
		this.register_function('cos', Xtalk.Builtins.function_cos, true);
		this.register_function('sin', Xtalk.Builtins.function_sin, true);
		
		this.register_function('average', Xtalk.Builtins.function_avg);
		this.register_function('max', Xtalk.Builtins.function_max);
		this.register_function('min', Xtalk.Builtins.function_min);
		this.register_function('sum', Xtalk.Builtins.function_sum);
		
		this.register_function('offset', Xtalk.Builtins.function_offset);
		this.register_function('length', Xtalk.Builtins.function_length, true);
		

/// **** can be 'anything' for property evaluation and might be a handy default,
// allowing the code itself to check allowable types for complicated registrations  **TODO

/*
	Generic constants and terms
 */
    	this.register_term('me', 'me  ', Xtalk.Builtins.term_me);
    	this.register_term('target', 'tgtC', Xtalk.Builtins.term_target_container);
    	this.register_property('target', 'tgtN', 'norm', '----', Xtalk.Builtins.term_target_name);
    	
    	this.register_constant('pi', Math.PI);
    	this.register_constant('zero', 0);
		this.register_constant('one', 1);
		this.register_constant('two', 2);
		this.register_constant('three', 3);
		this.register_constant('four', 4);
		this.register_constant('five', 5);
		this.register_constant('six', 6);
		this.register_constant('seven', 7);
		this.register_constant('eight', 8);
		this.register_constant('nine', 9);
		this.register_constant('ten', 10);
		
		this.register_constant('true', true);
		this.register_constant('false', false);
		
		this.register_constant('empty', '');
		this.register_constant('space', ' ');
		this.register_constant('colon', ':');
		this.register_constant('comma', ',');
		this.register_constant('tab', '\t');
		this.register_constant('quote', '"');
		this.register_constant('newline', '\n');//10
		this.register_constant('lineFeed', '\n');//10
		this.register_constant('return', '\r');//13
		this.register_constant('formFeed', String.fromCharCode(12));//12
		
		
		
		//this.register_reference('msg', 'mgbx', '----', Xtalk.Builtins.ref_message_box);
		//this.register_reference('msg box', 'mgbx', '----', Xtalk.Builtins.ref_message_box);
		//this.register_reference('message box', 'mgbx', '----', Xtalk.Builtins.ref_message_box);
		
		//this.register_reference('msg', 'mgbx', '----', Xtalk.Builtins.ref_palette);
		

/*
	Calendar
 */
 
		this.register_property('date', 'date', 'shrt', '----', Xtalk.Builtins.the_date);
		this.register_property('short date', 'date', 'shrt', '----', Xtalk.Builtins.the_date);
		this.register_property('abbr date', 'date', 'abbr', '----', Xtalk.Builtins.the_date);
		this.register_property('abbrev date', 'date', 'abbr', '----', Xtalk.Builtins.the_date);
		this.register_property('abbreviated date', 'date', 'abbr', '----', Xtalk.Builtins.the_date);
		this.register_property('long date', 'date', 'long', '----', Xtalk.Builtins.the_date);
		this.register_property('English date', 'date', 'en  ', '----', Xtalk.Builtins.the_date);
		
		this.register_property('time', 'time', 'shrt', '----', Xtalk.Builtins.the_time);
		this.register_property('short time', 'time', 'shrt', '----', Xtalk.Builtins.the_time);
		this.register_property('abbr time', 'time', 'abbr', '----', Xtalk.Builtins.the_time);
		this.register_property('abbrev time', 'time', 'abbr', '----', Xtalk.Builtins.the_time);
		this.register_property('abbreviated time', 'time', 'abbr', '----', Xtalk.Builtins.the_time);
		this.register_property('long time', 'time', 'long', '----', Xtalk.Builtins.the_time);
		this.register_property('English time', 'time', 'en  ', '----', Xtalk.Builtins.the_time);
		
		this.register_function('date', Xtalk.Builtins.function_date);
		this.register_function('time', Xtalk.Builtins.function_time);
		
		this.register_property('dateitems', 'ditm', 'locl', '----', Xtalk.Builtins.the_dateitems);
		
		this.register_property('timestamp', 'tmsp', 'locl', '----', Xtalk.Builtins.the_timestamp);
		// consider old HC synonym: seconds, but with a different epoch?
		
		// consider old HC: ticks (only length is particularly important, no specific start)
		
		// consider adding: month, weekday functions & properties
		// with short, abbreviated, long and long English versions
		
		
		
/*
	Generic properties
*/

		this.register_property('result', 'rslt', null, '----', Xtalk.Builtins.the_result);

		
		this.register_property('itemDelimiter', 'idel', null, '----', 
			Xtalk.Builtins.the_item_delimiter_get, Xtalk.Builtins.the_item_delimiter_set
		);
		this.register_property('numberFormat', 'nfmt', null, '----', 
			Xtalk.Builtins.the_number_format_get, Xtalk.Builtins.the_number_format_set
		);
		
		this.register_property('address', 'addr', 'norm', '----', Xtalk.Builtins.the_address);
		
		this.register_property('editBkgnd', 'edbg', null, '----', 
			Xtalk.Builtins.the_edit_bkgnd_get, Xtalk.Builtins.the_edit_bkgnd_set
		);
		this.register_property('editBackground', 'edbg', null, '----', 
			Xtalk.Builtins.the_edit_bkgnd_get, Xtalk.Builtins.the_edit_bkgnd_set
		);
		this.register_property('editBg', 'edbg', null, '----', 
			Xtalk.Builtins.the_edit_bkgnd_get, Xtalk.Builtins.the_edit_bkgnd_set
		);
		
		
		this.register_property('environment', 'envn', null, '----', Xtalk.Builtins.the_environment);
		
		
		// all reset at idle:
		
		this.register_property('lockErrorDialogs', 'lerr', null, '----', 
			Xtalk.Builtins.the_lock_errors_get, Xtalk.Builtins.the_lock_errors_set
			// VM
			// send errorDialog <msg> to card instead?
		);
		this.register_property('lockMessages', 'lmsg', null, '----', 
			Xtalk.Builtins.the_lock_messages_get, Xtalk.Builtins.the_lock_messages_set
			// HIDDEN SESSION / VM filter?
			// disable specific messages: closeCard, closeBackground, closeStack, 
			// openCard, openBackground, openStack, resumeStack, suspendStack
		);
		this.register_property('lockScreen', 'lscn', null, '----', 
			Xtalk.Builtins.the_lock_screen_get, Xtalk.Builtins.the_lock_screen_set
			// VIEW
			// card view shows updates?
		);
		this.register_property('lockRecent', 'lrec', null, '----', 
			Xtalk.Builtins.the_lock_recent_get, Xtalk.Builtins.the_lock_recent_set
			// VIEW / HIDDEN SESSION
			// eg. whether we create browser history for visited cards/stacks
		);
		
		
		// version [of CinsImp] / stack
		
		
		// the sound // currently playing sound (if any)
		/*
		
		
		
		this.register_property('clickChunk', 'leng', null, '----', Xtalk.Builtins.the_length); // char chunk expr
		this.register_property('clickH', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('clickV', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('clickLine', 'leng', null, '----', Xtalk.Builtins.the_length); // line chunk expr
		this.register_property('clickLoc', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('clickText', 'leng', null, '----', Xtalk.Builtins.the_length); // word or group text
		
		
		this.register_property('shiftKey', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('altKey', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('optionKey', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('optKey', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('metaKey', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('cmdKey', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('commandKey', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('ctrlKey', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('controlKey', 'leng', null, '----', Xtalk.Builtins.the_length);
		
		
		this.register_property('foundChunk', 'leng', null, '----', Xtalk.Builtins.the_length); // as above
		this.register_property('foundField', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('foundLine', 'leng', null, '----', Xtalk.Builtins.the_length); // as above
		this.register_property('foundText', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('clickH', 'leng', null, '----', Xtalk.Builtins.the_length);
		
		this.register_property('mouse', 'leng', null, '----', Xtalk.Builtins.the_length);// up / down
		this.register_property('mouseClick', 'leng', null, '----', Xtalk.Builtins.the_length); // clicked during exec
		this.register_property('mouseH', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('mouseV', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('mouseLoc', 'leng', null, '----', Xtalk.Builtins.the_length);
		
		this.register_property('param', 'leng', null, 'Integer', Xtalk.Builtins.the_length);
		this.register_property('paramCount', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('params', 'leng', null, '----', Xtalk.Builtins.the_length);
		
		this.register_property('random', 'leng', null, 'Integer', Xtalk.Builtins.the_length); // 1 - N
		
		
		*/
		//this.register_property('selectedButton', 'leng', null, 'Family', Xtalk.Builtins.the_length);
		// eg. the selected button of [bkgnd | card] family <int>
		// (radio buttons/ toggle buttons)
		/*
		this.register_property('selectedChunk', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('selectedField', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('selectedLine', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('selectedLoc', 'leng', null, '----', Xtalk.Builtins.the_length);
		this.register_property('selectedText', 'leng', null, '----', Xtalk.Builtins.the_length);
		
		
		
		this.register_property('tool', 'leng', null, '----', Xtalk.Builtins.the_length);
		*/
		
		//this.register_property('destination', 'leng', null, '----', Xtalk.Builtins.the_length);
		
		// eventually to add:
		// brush - a number/name indicating the type of paint brush selected
		// dragSpeed
		// filled /drawFilled
		// grid
		// lineSize
		// snapGuides ?
		// pattern?
		// texture?
		// polySides?
		// powerKeys?
		
		// language? eg. English  - localisation
		
		// (not reporting):
		// printMargins
		// printTextAlign
		// printTextFont
		// printTextHeight
		// printTextSize
		// printTextStyle
		
		// reportTemplates
		
		// scriptTextFont?
		// scriptTextSize?
		
		// stacksInUse
		// suspended
		
		// (either specific object, or general, eg. selection?)
		// textAlign
		// textFont
		// textHeight
		// textSize
		// textStyle
		
		// userModify - allow card to be modified even though stack is read-only
		// (changes will be discarded silently)
		
		
		
		
		// cursor - * automatic?
		// 
		
/*
	Chunk expressions
 */
		this.register_reference('char', 'char', 'String', Xtalk.Builtins.new_chunk);
		this.register_reference('character', 'char', 'String', Xtalk.Builtins.new_chunk);
		this.register_reference('word', 'word', 'String', Xtalk.Builtins.new_chunk);
		this.register_reference('item', 'item', 'String', Xtalk.Builtins.new_chunk);
		this.register_reference('line', 'line', 'String', Xtalk.Builtins.new_chunk);
		
		this.register_count('chars', 'chars', 'String', Xtalk.Builtins.count_chunks); // **TODO VM will need to auto-coerce types and try a few
		this.register_count('characters', 'chars', 'String', Xtalk.Builtins.count_chunks);
		this.register_count('words', 'words', 'String', Xtalk.Builtins.count_chunks);
		this.register_count('items', 'items', 'String', Xtalk.Builtins.count_chunks);
		this.register_count('lines', 'lines', 'String', Xtalk.Builtins.count_chunks);
		
	
/*
	Environment constants and terms
 */
		this.register_term('this cd', 'card', Xtalk.Builtins.term_this);
    	this.register_term('this card', 'card', Xtalk.Builtins.term_this);
    	this.register_term('this bg', 'bkgd', Xtalk.Builtins.term_this);
    	this.register_term('this bkgnd', 'bkgd', Xtalk.Builtins.term_this);
    	this.register_term('this background', 'bkgd', Xtalk.Builtins.term_this);
    	this.register_term('this stack', 'stak', Xtalk.Builtins.term_this);
    	
/*
	Environment counts
 */
 		this.register_count('cds', 'cdct', '----', Xtalk.Builtins.count_cards);
		this.register_count('cards', 'cdct', '----', Xtalk.Builtins.count_cards);
		this.register_count('cds', 'cdct', 'stack', Xtalk.Builtins.count_cards);
		this.register_count('cards', 'cdct', 'stack', Xtalk.Builtins.count_cards);
		this.register_count('cds', 'cdct', 'bkgnd', Xtalk.Builtins.count_cards);
		this.register_count('cards', 'cdct', 'bkgnd', Xtalk.Builtins.count_cards);
		
		this.register_count('marked cds', 'cdct,marked', '****', Xtalk.Builtins.count_cards);
		this.register_count('marked cards', 'cdct,marked', '****', Xtalk.Builtins.count_cards);
		this.register_count('unmarked cds', 'cdct,unmarked', '****', Xtalk.Builtins.count_cards);
		this.register_count('unmarked cards', 'cdct,unmarked', '****', Xtalk.Builtins.count_cards);
		
		this.register_count('bgs', 'bgct', '----', Xtalk.Builtins.count_bkgnds);
		this.register_count('bkgnds', 'bgct', '----', Xtalk.Builtins.count_bkgnds);
		this.register_count('backgrounds', 'bgct', '----', Xtalk.Builtins.count_bkgnds);
   
		
		/*
		register_term(<words>, <param>, <handler>)
			handler(<param>)
			
		register_constant(<words>, <value>)
			(may be Javascript or any other object type)
		
		register_property(<words>, <param>, <variant>, <context-type>, <handler>)
			mapping of words and handler for a specific data type of the context, or ---- for global
			handler(<context>, <param>, <variant>)
			
		register_count(<words>, <param>, <context-type>, <handler>)
			(as with property)
		
		register_reference(<words>, <param>, <context-type>, <handler>)
			handler(<context>, <param>, <mode>, <ident1>, <ident2>)
			mode := { REF_NAME, REF_ID, or REF_RANGE }  & ident2 may be null.
		
		*/
		
	/// testing
		
/*
	Environment objects
 */
 
 		this.register_reference('stack', 'stack', '----', Xtalk.Builtins.ref_stack);
 		
 		this.register_reference('bg', 'bkgnd', '****', Xtalk.Builtins.ref_layer); // [of stack]
 		this.register_reference('bkgnd', 'bkgnd', '****', Xtalk.Builtins.ref_layer);
 		this.register_reference('background', 'bkgnd', '****', Xtalk.Builtins.ref_layer);
 		
 		this.register_reference('cd', 'card', '****', Xtalk.Builtins.ref_layer); // [of bkgnd/stack]
 		this.register_reference('card', 'card', '****', Xtalk.Builtins.ref_layer); // [of bkgnd/stack]
 		
 		this.register_reference('marked cd', 'card,marked', '****', Xtalk.Builtins.ref_layer);
 		this.register_reference('marked card', 'card,marked', '****', Xtalk.Builtins.ref_layer);
 		this.register_reference('unmarked cd', 'card,unmarked', '****', Xtalk.Builtins.ref_layer);
 		this.register_reference('unmarked card', 'card,unmarked', '****', Xtalk.Builtins.ref_layer);
 		
 		// 1. all layerobject references shall return an adapter, which includes the object, and it's layer (default current card)
 		// 2. might be useful to have an automatic permutations thing in registration, eg. list of synonyms accepted also **TODO
 		//   ^^ use a wrapper, so that the functionality is still easy to understand in registration
 		
 		this.register_reference('button', 'card,button', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		this.register_reference('btn', 'card,button', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		this.register_reference('card button', 'card,button', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		this.register_reference('card btn', 'card,button', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		this.register_reference('cd button', 'card,button', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		this.register_reference('cd btn', 'card,button', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		
 		this.register_reference('background button', 'bkgnd,button', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('bg button', 'bkgnd,button', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('bkgnd button', 'bkgnd,button', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('background btn', 'bkgnd,button', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('bg btn', 'bkgnd,button', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('bkgnd btn', 'bkgnd,button', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		
 		this.register_reference('card field', 'card,field', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		this.register_reference('card fld', 'card,field', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		this.register_reference('cd field', 'card,field', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		this.register_reference('cd fld', 'card,field', '****', Xtalk.Builtins.ref_layer_object); // [of card]
 		
 		this.register_reference('field', 'bkgnd,field', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('fld', 'bkgnd,field', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('background field', 'bkgnd,field', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('bg field', 'bkgnd,field', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('bkgnd field', 'bkgnd,field', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('background fld', 'bkgnd,field', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('bg fld', 'bkgnd,field', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		this.register_reference('bkgnd fld', 'bkgnd,field', '****', Xtalk.Builtins.ref_layer_object); // [of card/bkgnd]
 		
 		
/*
	Environment object properties
 */
	//stack	
		this.register_property('script', 'script', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('name', 'name', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('id', 'id', null, '****', Xtalk.Builtins.obj_attr_get);
		
		this.register_property('cardSize', 'card_size', null, 'stack', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('cantModify', 'cant_modify', null, 'stack', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('cantAbort', 'cant_abort', null, 'stack', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('cantPeek', 'cant_peek', null, 'stack', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('privateAccess', 'private_access', null, 'stack', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
		this.register_property('cantDelete', 'cant_delete', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
	
	// bkgnd
		this.register_property('dontSearch', 'dont_search', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
	
	// card
		this.register_property('marked', 'marked', null, 'card', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
	
	// layer object
		this.register_property('number', 'klas_num', null, '****', Xtalk.Builtins.obj_attr_get);
		this.register_property('part number', 'part_num', null, '****', Xtalk.Builtins.obj_attr_get);
		
		this.register_property('rect', 'rect', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('rectangle', 'rect', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('loc', 'loc', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('location', 'loc', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('size', 'size', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('width', 'width', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('height', 'height', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('top', 'top', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('bottom', 'bottom', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('left', 'left', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('right', 'right', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
		this.register_property('shared', 'shared', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('sharedText', 'shared', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('sharedHilite', 'shared', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
		this.register_property('visible', 'visible', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('disabled', 'disabled', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
		this.register_property('multipleLines', 'multiple_lines', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('columnar', 'columnar', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('hasHeader', 'has_header', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
		this.register_property('textAlign', 'txt_align', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('textFont', 'txt_font', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('textSize', 'txt_size', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('textStyle', 'txt_style', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
		this.register_property('color', 'color', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('colour', 'color', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
		this.register_property('shadow', 'shadow', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
	// button
		this.register_property('style', 'style', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('family', 'family', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('icon', 'icon', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('showName', 'show_name', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('autoHilite', 'auto_hilite', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('hilite', 'hilite', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('highlight', 'hilite', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('menu', 'menu', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
	// field
		this.register_property('scroll', 'scroll', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('lockText', 'locked', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('dontWrap', 'dont_wrap', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('autoTab', 'auto_tab', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('wideMargins', 'wide_margins', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('autoSelect', 'auto_select', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('picklist', 'picklist', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		this.register_property('content', 'content', null, '****', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
		//this.register_property('selection', 'style', null, 'field', Xtalk.Builtins.obj_attr_get, Xtalk.Builtins.obj_attr_set);
		
		
	}

};



/*

Command Syntax Still TODO
-------------------------

	convert <expr> to {`fmtto``-1`timestamp | `-2`dateitems | `0`short date | `1`abbr date | `1`abbrev date | `1`abbreviated date | `2`long date |`3`short time | `4`long time}
	
	find [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] <text> [in <field>]
	
	sort [[the] cards] of <bkgnd> [`dir``asc`ascending|`des`descending] by <sortKey>
	sort [[the] cards] [`dir``asc`ascending|`des`descending] by <sortKey>
	sort <bkgnd> [`dir``asc`ascending|`des`descending] by <sortKey>
	
	mark all [cards]
	mark <card>
	mark cards where <expr>
	mark cards by finding [<find-mode>] <text> [in <field>]
	unmark cards  (as above)
	

Possible Future Command Syntax
------------------------------

	answer file <prompt> [of type <type1> [or <type2> [or <type3>]]]
	answer folder <prompt>
	ask file <prompt> [with <defaultFilename>]
	
These could work with uploads/downloads on the client-side, ie. preparing a file for
download on "close" and opening a file that was "answer file"'d:
	open file <filepath>
	close file <filepath>
    read line from file <filepath>
    read from file <filepath> [at <charBegin>] {for <charCount> | until {end|eof|<charEnd>}}
    write <text> to file <filepath> [at {end|eof|<charBegin>}]
    
   
*/
    

Xtalk.Dict.init_builtins();


CinsImp._script_loaded('xtalk-dict');

