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
	register_property: function(in_name, in_id, in_variant, in_context_type, in_handler)
	{
		var in_name = in_name.toLowerCase();
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
			handler:	in_handler
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
	register_command: function(in_syntax, in_arguments, in_handler)
	{
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
			handler: in_handler
		};
		if (this._commands['|'+first_word] === undefined)
			this._commands['|'+first_word] = [];
		this._commands['|'+first_word].push( def );
	},
	

/*
	Initalizes the dictionary with all language built-ins.
 */
	init_builtins: function()
	{
		this.register_command(
			'beep <number> [time | times]', 
			'number', 
			function(n) { alert('BEEP! ' + JSON.stringify(n)); }
		);
		
		this.register_command(
			'ask [`password``1`password] <prompt> [with <response>]', 
			'password,prompt,response', 
			function(n) { alert('ASK PASSWORD! ' + JSON.stringify(n)); }
		);
		
		this.register_command(
			'sort [[the] cards] [`dir``asc`ascending|`des`descending] by <sortKey>', 
			'dir,sortKey', 
			function(n) { alert('SORT! ' + JSON.stringify(n)); }
		);
		
		this.register_command(
			'find [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] <text> [in <field>]', 
			'mode,text,field', 
			function(n) { alert('FIND! ' + JSON.stringify(n)); }
		);
	
	
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
		
		this.register_term('this card', 'card', function() { alert('Get this card!'); return 9; });
		
		this.register_property('date', 'date', 'shrt', '----', Xtalk.Builtins.the_date);
		this.register_property('short date', 'date', 'shrt', '----', Xtalk.Builtins.the_date);
		this.register_property('abbr date', 'date', 'abbr', '----', Xtalk.Builtins.the_date);
		this.register_property('abbrev date', 'date', 'abbr', '----', Xtalk.Builtins.the_date);
		this.register_property('abbreviated date', 'date', 'abbr', '----', Xtalk.Builtins.the_date);
		this.register_property('long date', 'date', 'long', '----', Xtalk.Builtins.the_date);
		
		this.register_count('cards', 'cdct', 'BKGD', null);
		
		this.register_reference('card button', 'cdbn', '----', 
		function(in_context, in_param, in_mode, in_ident1, in_ident2) { 
			alert('Card Button '+in_mode +'|'+in_ident1+'|'+in_ident2);
		});
		
		
	}

};


Xtalk.Dict.init_builtins();

