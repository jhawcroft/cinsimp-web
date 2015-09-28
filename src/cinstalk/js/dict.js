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

	_TERM: 1,
	_CONSTANT: 2,


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


	register_property: function(in_name, in_id, in_context_type, in_handler)
	{
		var word_count = Xtalk._word_count(in_name);
		var in_name = in_name.toLowerCase();
		var context_type_map = this._properties[in_name];
		if (!context_type_map)
		{
			context_type_map = [];
			this._properties[in_name] = context_type_map;
		}
		context_type_map[in_context_type] = {
			id:			in_id,
			handler:	in_handler
		};
	},


	register_reference: function(in_name, in_id, in_context_type, in_handler)
	{
		var word_count = Xtalk._word_count(in_name);
		var in_name = in_name.toLowerCase();
		var context_type_map = this._references[in_name];
		if (!context_type_map)
		{
			context_type_map = [];
			this._references[in_name] = context_type_map;
		}
		context_type_map[in_context_type] = {
			id:			in_id,
			handler:	in_handler
		};
	},


	register_count: function(in_name, in_id, in_context_type, in_handler)
	{
		var word_count = Xtalk._word_count(in_name);
		var in_name = in_name.toLowerCase();
		var context_type_map = this._counts[in_name];
		if (!context_type_map)
		{
			context_type_map = [];
			this._counts[in_name] = context_type_map;
		}
		context_type_map[in_context_type] = {
			id:			in_id,
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
		this._commands[first_word] = def;
	},
	

/*
	Initalizes the dictionary with all language built-ins.
 */
	init_builtins: function()
	{
		this.register_command(
			'beep <number> [time[s]]', 
			'number', 
			function(n) { alert('BEEP! ' + JSON.stringify(n)); }
		);
	
		/*this.register_term('this bkgnd', 'bkgd', function() { alert('Get this bkgnd'); });
		this.register_constant('one', 1);

		this.register_property('date', 'date', '----', function() { alert('Get date'); });

		this.register_count('cards', 'cdct', 'BKGD', function() { alert('return bg card count'); });*/
	}

};


Xtalk.Dict.init_builtins();

