/*
CinsImp
xTalk Message Send Parser

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

The CinsTalk parser is split into three components:
-	Handler (handlers, if..then..else, repeat, global, exit, pass, next)
-	Command (this module)
-	Expression (eg. card field "Name" of bkgnd "Patients", the long date && the time)

This split design is adopted to make the later two components much more easily extensible,
including by a possible future plug-in mechanism.

The message send parser is a kind of meta-parser, which is largely driven by a set of
soft syntaxes expressed in a BNF-like form.  In this way, command syntaxes can be added
or modified within the CinsTalk language with minimal change to the compiler itself
and potentially with no code changes (in the case of a plug-in architecture.)


Syntax Tree Node Structures
---------------------------
** TO DO **


Dependencies
------------

xtalk.js

*/

Xtalk.Parser = Xtalk.Parser || {};

Xtalk.Parser.Message = {


/*****************************************************************************************
Design-time Configuration
*/
	
	/* dictates the maximum complexity of pattern that can be matched */
	_MAX_GRAMMAR_COMPLEXITY: 50,


/*****************************************************************************************
Core
*/

/*
	Pushes a frame on to the match stack to deal with a nested pattern element.
 */
	_match_element_begin: function(in_context, in_pattern)
	{
		/* push a stack frame */
		var frame = in_context.stack[++in_context.stack_index];
	
		/* record the current statement position */
		frame.old_stmt_position = in_context.stmt_position;
	
		/* record the current parameter list size */
		frame.old_param_list_size = in_context.param_list.length;
	
		/* record the current set name */
		frame.old_set_name = in_context.set_name;
	},


/*
	Pops a frame off the match stack.
 */
	_match_element_end: function(in_context, in_success)
	{
		/* pop a stack frame */
		var frame = in_context.stack[in_context.stack_index--];
	
		/* was the match unsuccessful? */
		if (!in_success)
		{
			/* restore previous statement position (prior to beginning failed match) */
			in_context.stmt_position = frame.old_stmt_position;
		
			/* restore matched parameter list (prior to beginning failed match) */
			in_context.param_list.length = frame.old_param_list_size;
		}
	
		/* restore previous set name */
		in_context.set_name = frame.old_set_name;
	},


/*
	Accumulates matched parameters.
 */
	_matched_parameter: function(in_context, in_offset, in_length, in_name, in_value)
	{
		var param = {
			name:		in_name,
			text:		in_value,
			offset:		in_offset,
			length:		in_length
		};
		in_context.param_list.push(param);
	},


/*
	Accumulates a named set as a parameter. 
 */
	_matched_set: function(in_context, in_value)
	{
		if (!in_value || !in_context.set_name) return;
		this._matched_parameter(in_context, -1, -1, in_context.set_name, in_value);
	},


/*
	Attempts to match the token stream with a single pattern/sub-pattern.
 */
	_stream_matches: function(in_context, in_pattern)
	{
		var matched = false;
		this._match_element_begin(in_context, in_pattern);
	
		switch (in_pattern.bnf)
		{
			case Xtalk.Parser.BNF.PAT_SET_REQ:
				/* an element of this set must match */
				matched = false;
				in_context.set_name = in_pattern.text;
				for (var i = 0; i < in_pattern.children.length; i++)
				{
					if (this._stream_matches(in_context, in_pattern.children[i]))
					{
						matched = true;
						break;
					}
				}
				break;
			
			case Xtalk.Parser.BNF.PAT_SET_OPT:
				/* it doesn't matter if this matches anything or not,
				 but we must attempt to match one of the set elements.
				 if a match is found, don't try and match another element */
				matched = true;
				in_context.set_name = in_pattern.text;
				for (var i = 0; i < in_pattern.children.length; i++)
				{
					if (this._stream_matches(in_context, in_pattern.children[i]))
						break;
				}
				break;
			
			case Xtalk.Parser.BNF.PAT_LIST:
				/* check if every term of the set matches */
				matched = true;
				for (var i = 0; i < in_pattern.children.length; i++)
				{
					if (!this._stream_matches(in_context, in_pattern.children[i]))
					{
						matched = false;
						break;
					}
				}
				/* save the match as a named subexpression to the context */
				if (matched)
					this._matched_set(in_context, in_pattern.text);// check
				break;
			
			case Xtalk.Parser.BNF.PAT_LITERAL:
			{
				/* check if literal matches stream */
				var word = in_context.stmt.children[in_context.stmt_position];
				if (word && (word.text == in_pattern.text))
				{
					in_context.stmt_position++;
					matched = true;
				}
				else
					matched = false;
				break;
			}
			
			case Xtalk.Parser.BNF.PAT_PARAM:
			{
				/* find the end of the stream or a stop word (whichever comes first) */
				var end_offset;
				for (end_offset = in_context.stmt_position;
					 end_offset < in_context.stmt.children.length;
					 end_offset++)
				{
					var word = in_context.stmt.children[end_offset];
					var stop_words = in_pattern.stop_words;
					var found_stop_word = false;
					if (stop_words && word && (word.text.length != 0))
					{
						for (var sw = 0; sw < stop_words.length; sw++)
						{
							if (word.text == stop_words[sw])
							{
								found_stop_word = true;
								break;
							}
						}
					}
					if (found_stop_word) break;
				}
			
				/* check for a match (at least one node) */
				var match_length = end_offset - in_context.stmt_position;
				if (match_length == 0)
				{
					matched = false;
					break;
				}
				matched = true;
			
				/* save the matching nodes as a named subexpression to the context */
				this._matched_parameter(in_context, in_context.stmt_position, match_length, in_pattern.text, null);
				in_context.stmt_position += match_length;
				break;
			}
		}
	
		this._match_element_end(in_context, matched);
		return matched;
	},


/*
	Prepares a context for the matching of a single pattern against the token stream.
 */
	_new_match_context: function(in_stmt)
	{
		var context =
		{
			stack_size:		this._MAX_GRAMMAR_COMPLEXITY,
			stack_index:	-1,
			stack:			[],		/* assists with matching sub-patterns */
			param_list:		[],		/* an accumulation of matched parameter values */
			stmt:			in_stmt,
			stmt_position:	0,		/* where in the token stream the match process is at */
			set_name:		null
		};
		
		/* initalize the stack with empty frames */
		for (var si = 0; si < context.stack_size; si++)
		{
			context.stack.push({
				old_stmt_position: 0,
				old_param_list_size: 0,
				old_set_name: ''
			});
		}
		
		return context;
	},

	
/*
	Supervises the match of a single complete pattern with the supplied statement.
	
	If matching is successful, named parameters are accumulated in the out_params array.
	
	Returns true if matching successful, or false otherwise.
 */
	_cmd_stmt_matches: function(in_stmt, in_pattern, out_params)
	{   
		/* prepare to match statement against command pattern */
		var context = this._new_match_context(in_stmt);
	
		/* perform match analysis */
		var matches = this._stream_matches(context, in_pattern);
		if (context.stmt_position != context.stmt.children.length)
			return false;
	
		/* build parameter list */
		for (var i = 0; i < context.param_list.length; i++)
		{
			var param = {
				id:			Xtalk.ID_LIST,
				name:		context.param_list[i].name,
				children:	[]
			};
			out_params.push(param);
		
			/* check for a syntax-specified param value, ie.
			a value that was given in the command syntax itself (based on a particular
			match path) is the parameter value */
			if ((context.param_list[i].offset < 0) && (context.param_list[i].length < 0))
				param.children.push({
					id: 		Xtalk.ID_IDENTIFIER,
					text:		context.param_list[i].text
				});
		
			/* check for a reference to a range of the input token stream, ie.
			a range of tokens within the input forms the parameter value */
			else if ((context.param_list[i].offset >= 0) && (context.param_list[i].length > 0))
			{
				for (var j = 0; j < context.param_list[i].length; j++)
				{
					var stmt_node_index = context.param_list[i].offset + j;
					param.children.push( in_stmt.children[stmt_node_index] );
					in_stmt.children[stmt_node_index] = null; // not really necessary any more
				}
			}
		}
	
		return true;
	},


/*
	Appends the matched parameter values to the ID_MESSAGE_SEND syntax tree node,
	in the sequence stipulated by the command definition.
	
	Also initiates the expression parser on each of the matched parameter values.
 */
	_append_cmd_params: function(io_command, in_prescribed_params, in_prescribed_delayed, in_supplied_params)
	{
		for (var prescribed_index = 0; prescribed_index < in_prescribed_params.length; prescribed_index++)
		{
			var got_this_param = false;
			for (var supplied_index = 0; supplied_index < in_supplied_params.length; supplied_index++)
			{
				var supplied_param = in_supplied_params[supplied_index];
				if (!supplied_param) continue;
				if (supplied_param.id != Xtalk.ID_LIST) continue;
				if (supplied_param.name == in_prescribed_params[prescribed_index])
				{
					got_this_param = true;
					
					//if (!Xtalk.Parser.Expression.parse(io_command, supplied_param)) //*** TO ENABLE ***
					//	return false;
					
					io_command.parameters.push(supplied_param);
					if (in_prescribed_delayed[prescribed_index])
						supplied_param.delayed = true;
				}
			}
			if (!got_this_param)
				io_command.parameters.push(null);
		}
		return true;
	},


/*
	Attempts to parse a generic message send/command,
	ie. where no known syntax exists.
	
	Parameters are comma-delimited.
	
	This is the parsing routine utilised to call user scripted handlers and external
	commands (plug-ins).
	
	Also initiates the expression parser on each of the parameter values.
*/
	_parse_generic_command: function(in_stmt)
	{
		/* build command message send */
		var cmd = {
			id:			Xtalk.ID_MESSAGE_SEND,
			name:		in_stmt.children[0].text,
			parameters:	[],
			handler:	null,
			syntax:		null
		};
	
		/* build parameters (if any) */
		if (in_stmt.children.length > 1)
		{
			var param = {
				id:			Xtalk.ID_LIST,
				children:	[]
			};
			cmd.params.push(param);
		
			for (var i = 1; i < in_stmt.children.length; i++)
			{
				var token = in_stmt.children[i];
				if (token && (token.id == Xtalk.ID_COMMA))
				{
					/* note: it's permitted syntax to have no tokens within each comma-delimited parameter */
					var param = {
						id:			Xtalk.ID_LIST,
						children:	[]
					};
					cmd.params.push(param);
				}
				else
				{
					param.children.push(token);
					in_stmt.children[i] = null; // not strictly necessary any more
				}
			}
		}
	
		/* parse subexpressions */
		for (var i = 0; i < cmd.params.length; i++)
		{
			//if (!Xtalk.Parser.Expression.parse(cmd.params[i])) return false; // *** to be enabled ***
		}
	
		return cmd;
	},


/*
	Attempts to parse the supplied statement as a message send.
	
	Tries to recognise a known syntax first, referencing the dictionary module.
	If no match is found with a known syntax, an attempt is made to parse as a generic
	message send.
	
	If parsing fails, a standard syntax error is raised.
	
	Otherwise, an ID_MESSAGE_SEND subtree is returned that encapsulates all the 
	details of the message send.
 */
	_find_and_parse_command: function(in_stmt)
	{
		/* do some basic syntax checks */
		if ((in_stmt.children.length < 1) || (!in_stmt.children[0].flags & Xtalk.FLAG_IDENTIFIER))
			Xtalk._error_syntax('Can\'t understand "^0".', in_stmt.children[0].text);
	
		/* search for matching command(s) with the same prefix */
		var command_list = Xtalk.Dict._commands['|'+in_stmt.children[0].text];
		if (command_list)
		{
			/* iterate over syntax patterns beginning with the same prefix */
			for (var syntax = 0; syntax < command_list.length; syntax++)
			{
				var cmd = command_list[syntax];
			
				/* attempt to match each syntax pattern beginning with the same prefix */
				var params = [];
				if (this._cmd_stmt_matches(in_stmt, cmd.pattern, params))
				{
					/* found a match!
					 create a new abstract syntax tree to hold the parsed command */
					var temp_tree = {
						id:			Xtalk.ID_MESSAGE_SEND,
						name:		in_stmt.children[0].text,
						parameters:	[],
						handler:	cmd.handler,
						syntax:		in_stmt.children[0].text + ':' + syntax
					};
				
					/* move the parameter nodes from the input statement tree
					 to the correct sequence within the result tree;
					 parse the parameter expressions */
					this._append_cmd_params(temp_tree, cmd.parameters, cmd.delayed, params);
					return temp_tree;
				}
			}
		} /* if prefix found */
	
		/* no matches, parse as generic message send, ie.
		command arg1, arg2, ..., argN */
		return this._parse_generic_command(in_stmt);
	},
	
	
/*****************************************************************************************
Entry
*/

/*
 	Accepts an ID_LIST of tokens for the message send line.
 	
 	Returns an abstract syntax tree representation of the parsed message send if successful.
 	
 	Throws an Error exception if parsing fails due to syntax or an internal error.
 */
	parse: function(in_line)
	{
		var result = this._find_and_parse_command(in_line);
		//if (result.imp) result.imp();
		return result;
	}
};



