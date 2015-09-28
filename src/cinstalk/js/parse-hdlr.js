/*
CinsImp
xTalk Handler Parser

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
-	Handler (this module)
-	Command (message sends, eg. answer "Hello World!", beep 3 times and sumNumbers 5,2,1)
-	Expression (eg. card field "Name" of bkgnd "Patients", the long date && the time)

This split design is adopted to make the later two components much more easily extensible,
including by a possible future plug-in mechanism.

The Handler parser is a somewhat conventional parser implementation and handles these
constructs only:
-	handlers
-	loops (repeat)
-	conditionals (if...then...else)
-	global declarations
-	flow control (exit, pass and next)


Syntax Tree Node Structures
---------------------------
** TO DO **


Dependencies
------------

xtalk.js
lex.js

*/

Xtalk.Parser = Xtalk.Parser || {};

Xtalk.Parser.Handler = {


/*****************************************************************************************
Design-time Configuration
*/
	/* maximum depth of nested blocks: handlers, loops and conditionals */
	MAX_BLOCK_DEPTH: 15,


/*****************************************************************************************
Constants
*/

	/* track what type of block is currently being parsed: */
	_BLOCK_HANDLER: 0,
	_BLOCK_LOOP: 1,
	_BLOCK_CONDITION: 2,
	
	/* track parsing of complex if...then...else... structures: */
	_STATE_IN_BLOCK: 0,
	_STATE_IN_BLOCK_MAY_ELSE: 1,
	_STATE_COND_EXP_THEN: 2,


/*****************************************************************************************
Module Globals 
*/
	
	/* the result of parsing: */
	_handler: null,
	
	/* the input to the parser: */
	_tokens: null,
	
	/* parser state: */
	_token_index: 0,
	_line_last: 0,
	
	_block_stack: [],
	_block_index: 0,
	
	
/*****************************************************************************************
Convenience/Utilities
*/
	
/*
 	Returns the current token.
 */
	_token: function()
	{
		if (this._end())
			return { id: Xtalk.ID_INVALID, text: '' };
		return this._tokens.items[this._token_index];
	},

/*
 	Returns an array of all the remaining tokens for this line.
 */
	_remainder: function()
	{
		if (this._tokens.items[this._line_last].id != Xtalk.ID_EOL)
			return this._tokens.items.slice(this._token_index, this._line_last + 1);
		else
			return this._tokens.items.slice(this._token_index, this._line_last);
	},

/*
 	Copies the remaining tokens on the current line, up until either the line end,
 	or one of the supplied stop terms (if any).
 	
 	in_stop_terms:  	an array of token IDs and/or keywords
 	in_dest:  			an ID_LIST token containing a children[] element
 */
	_accumulate: function(in_dest, in_stop_terms)
	{
		while (!this._end())
		{
			var token = this._token();
			var is_stop_term = false;
			for (var st = 0; st < in_stop_terms.length; st++)
			{
				var term = in_stop_terms[st];
				if (typeof term === 'string')
				{
					if (term.toLowerCase() == token.text.toLowerCase())
					{
						is_stop_term = true;
						break;
					}
				}
				else
				{
					if (term == token.id)
					{
						is_stop_term = true;
						break;
					}
				}
			}
			if (is_stop_term) break;
			in_dest.children.push(this._consume());
		}
	},
	
/*
 	Returns true if there are no more tokens to parse on the current line.
 */
	_end: function()
	{
		if ((this._token_index >= this._tokens.items.length) ||
			(this._token_index > this._line_last)) return true;
		if (this._tokens.items[this._token_index].id == Xtalk.ID_EOL) return true;
		return false;
	},

/*
 	Returns the current block stack frame.
 */
	_frame: function()
	{
		return this._block_stack[this._block_index];
	},
	
/*
 	Returns and 'consumes' the current token.  The token pointer is moved to the next
 	token on the current line.
 */
	_consume: function()
	{
		var token = this._token();
		this._token_index++;
		return token;
	},

/*
 	Pops the last block state off the block stack; moves up a level to the next highest
 	block state.
 */
	_up_block: function()
	{
		this._block_index--;
		if (this._block_index < 0)
			Xtalk._error_syntax('Internal error; too many ends.');
	},
	
/*
 	Pushes a block state on to the block stack; moves down a level into a deeper nested
 	block state.
 	
 	! Note: the new state is random and must yet be configured.
 */
	_down_block: function()
	{	
		this._block_index++;
		if (this._block_index >= this.MAX_BLOCK_DEPTH)
			Xtalk._error_syntax('Too many nested blocks.');
	},
	
/*
 	Appends the supplied syntax tree node to the parser output for the current block.
 */
	_append: function(in_node)
	{
		this._frame().container.stmts.push(in_node);
		// could potentially add information about line & offset to the node here
	},

/*
 	Returns true if the current block is enclosed (at any level) by a loop construct.
 */
	_in_loop: function()
	{
		for (var i = 0; i <= this._block_index; i++)
		{
			if (this._block_stack[i].type == this._BLOCK_LOOP) return true;
		}
		return false;
	},
	

/*****************************************************************************************
Core
*/

/*
 	Conditional Parsing
 	
 	The ugliest of the parsing functions; conditionals have a large variety of forms
 	and require some additional state to parse into the desired output form.
 	
 	For example, all the following are valid:
 	
 	1)
 	if <condition>
 	then
 	  <block>
 	end if
 	
 	2)
 	if <condition> then <statement> else <statement>
 	
 	3)
 	if <condition>
 	then <statement>
 	else <statement>
 	
 	4)
 	if <condition>
 	then
 	  <block>
 	else if <condition> then <statement>
 	else
 	  <block>
 	end if
 	
 	You get the idea!
 	
 */
 
/*
 	Begins parsing an if construct.
 */
	_parse_if: function()
	{
		var cond = {
			id:		Xtalk.ID_CONDITION_BLOCK,
			cases:		[]
		};
		this._frame().last_ctrl = cond;
		this._append(cond);
		this._frame().got_else = false;
		this._parse_block_if(false, false);
	},
	
/*
 	Begins parsing an else clause.
 */
	_parse_else: function()
	{
		if (this._block_index <= 0)
			Xtalk._error_syntax('"else" not allowed here.');
		if (this._frame().type != this._BLOCK_CONDITION)
			Xtalk._error_syntax('"else" not allowed here.');
		this._up_block();
		this._parse_block_else(false, false);
	},
	
/*
 	Parses an if clause.
 */
	_parse_block_if: function(is_else_if)
	{
		if (this._consume().id != Xtalk.ID_IF)
			Xtalk._error_syntax('Expected "if" here.');
		
		var case_  = { 
			id: Xtalk.ID_CONDITION_CASE, 
			condition: {
				id:	Xtalk.ID_LIST,
				children: []
			},
			block: {
				id: Xtalk.ID_BLOCK,
				stmts: []
			}
		};
		this._accumulate(case_.condition, [Xtalk.ID_THEN]);
		if (case_.condition.children.length == 0)
			Xtalk._error_syntax('Expected true or false expression here.');
		
		this._frame().last_ctrl.cases.push(case_);
		
		if (!this._end())
			this._parse_block_then(is_else_if, false);
		else
			this._frame().state = this._STATE_COND_EXP_THEN;
	},
	
/*
 	Returns the last case on the current syntax tree output,
 	ie. that which is presently being constructed by the parser.
 */
	_last_case: function()
	{
		return this._frame().last_ctrl.cases[this._frame().last_ctrl.cases.length - 1];
	},
	
/*
 	Parses a statment using _parse_stmt() within a single-line "then" or "else" clause.
 */
	_parse_cond_substatement: function()
	{
		var sub_eol;
		for (sub_eol = this._token_index; sub_eol <= this._line_last; sub_eol++)
		{
			continue_idx = sub_eol;
			var token = this._tokens.items[sub_eol];
			if (token.id == Xtalk.ID_INVALID ||
				token.id == Xtalk.ID_EOL ||
				token.id == Xtalk.ID_ELSE) 
			{
				sub_eol--;
				break;
			}
		}
		if (sub_eol < this._token_index)
			Xtalk._error_syntax('Expected some statement but found ^0.', this._token());
		
		var save_line_last = this._line_last;
		var save_container = this._frame().container;
		this._line_last = sub_eol;
		this._frame().container = this._last_case().block;
		
		this._parse_stmt();
		
		this._line_last = save_line_last;
		this._token_index = sub_eol + 1;
		this._frame().container = save_container;
	},
	

/*
 	Begins either a single or multi-line "then" block containing the subtree for the
 	script to run if the preceding condition is met.
 */
	_parse_block_then: function(is_else_if)
	{
		if (this._consume().id != Xtalk.ID_THEN)
			Xtalk._error_syntax('Expected "then" here.');
				
		/* if there's still stuff on this line, it's a single line block,
     	possibly terminated by an else clause; build block */
		if (!this._end())
			this._parse_cond_substatement();
		
		else
		{
			/* nothing on this line following "then";
         	start a multi-line block */     
         	var last_ctrl = this._frame().last_ctrl;	
         	this._frame().state = this._STATE_IN_BLOCK;
         	
         	this._down_block();
         	this._frame().last_ctrl = last_ctrl;
         	this._frame().container = last_ctrl.cases[last_ctrl.cases.length - 1].block;
         	this._frame().construct = last_ctrl;
         	this._frame().type = this._BLOCK_CONDITION;
         	this._frame().state = this._STATE_IN_BLOCK;
         	this._frame().got_else = false;
         	return;
		}
		
		/* is there "else" ? */
		if (this._end())
		{
			this._frame().state = this._STATE_IN_BLOCK_MAY_ELSE;
			return;
		}
		
		if (this._token().id != Xtalk.ID_ELSE)
			Xtalk._error_syntax('Expected "else" but found  ^0.', this._token());
		if (is_else_if)
			Xtalk._error_syntax('"else" cannot follow "else if" on the same line.');
		this._parse_block_else(true, false);
	},    
	

/*
 	Begins either a single or multi-line "else" block containing the subtree for the
 	script to run if none of the preceding conditions are met, ie. the default clause.
 	
 	Also handles an "else if".
 */
	_parse_block_else: function(is_after_then)
	{
		if (this._consume().id != Xtalk.ID_ELSE)
			Xtalk._error_syntax('Expected "else" here.');
			
		if (this._frame().got_else)
			Xtalk._error_syntax('Can have "else" only after "then".');
		
		/* if the next word is "if", start another condition */
		if (!this._end())
		{
			if (this._token().id == Xtalk.ID_IF)
			{
				/* style: don't allow "else if" to follow "then" on the same line;
				 quickly ends up looking awful and a really long line */
				if (is_after_then)
					Xtalk._error_syntax('"else if" cannot follow "then" on the same line.');
			
				this._parse_block_if(true);
				return;
			}
		}
		
		/* if there's still stuff on this line, make it into a single line else block */
		this._frame().got_else = true;
		var last_ctrl = this._frame().last_ctrl;	
        this._frame().state = this._STATE_IN_BLOCK;
         	
		var case_ = {
			id: Xtalk.ID_CONDITION_CASE,
			condition: null,
			block: {
				id: Xtalk.ID_BLOCK,
				stmts: []
			}
		};
		last_ctrl.cases.push(case_);
         	
		if (!this._end())
		{
			this._parse_cond_substatement();
			
			if (!this._end())
				Xtalk._error_syntax('"else" only after "then".');
		}
	
		else
		{
			/* nothing on this line following "else";
         	start a multi-line block */
         	this._down_block();
         	this._frame().last_ctrl = last_ctrl;
         	this._frame().container = case_.block;
         	this._frame().construct = last_ctrl;
         	this._frame().type = this._BLOCK_CONDITION;
         	this._frame().state = this._STATE_IN_BLOCK;
         	this._frame().got_else = false;
		}
	},


/*
 	Parses a "repeat ..." line.
 */
	_parse_repeat: function()
	{
		this._consume(); /* repeat */
		
		var node = { 
			id: Xtalk.ID_LOOP, 
			loop: Xtalk.LOOP_FOREVER, 
			block: {
				id: Xtalk.ID_BLOCK,
				stmts: []
			}, 
			condition: null, 
			variable: '', 
			init: null 
		};
		this._append(node);
		
		this._down_block();
		this._frame().container = node.block;
		this._frame().construct = node;
		this._frame().type = this._BLOCK_LOOP; // no longer necessary
		this._frame().state = this._STATE_IN_BLOCK;
		
		if (this._end()) return;
		if (this._token().text.toLowerCase() == 'forever')
		{
			this._consume();
			if (this._end()) return;
			Xtalk._error_syntax('Expected end of line after "repeat forever".');
		}
		
		else if ((this._token().id == Xtalk.ID_WHILE) ||
				(this._token().id == Xtalk.ID_UNTIL))
		{
			node.loop = (this._token().id == Xtalk.ID_UNTIL ? Xtalk.LOOP_UNTIL : Xtalk.LOOP_WHILE);
			this._consume();
			node.condition = {
				id: Xtalk.ID_LIST,
				children: this._remainder()
			};
			if (node.condition.children.length == 0)
				Xtalk._error_syntax('Expected true or false expression here.');
			//Xtalk.Parser.Expression.parse(node.condition);
		}
		
		else if (this._token().text.toLowerCase() == 'with')
		{
			/* with <ident> = <expr> {to | down to} <expr> */
			this._consume();
			if (this._end())
				Xtalk._error_syntax('Expected counter variable after "repeat with".');
			node.loop = Xtalk.LOOP_COUNT_UP;
			
			var counter = this._consume();
			if (!(counter.flags & Xtalk.FLAG_IDENTIFIER))
				Xtalk._error_syntax(counter.text+' is not a valid variable name.');
			node.variable = counter.text;
			
			if (this._end() || this._token().id != Xtalk.ID_EQUAL)
				Xtalk._error_syntax('Expected "=" after "repeat with ^0".', node.variable);
			this._consume();
			
			node.init = { id: Xtalk.ID_LIST, children: [] };
			if (this._end())
				Xtalk._error_syntax('Expected integer but found end of line.');
			this._accumulate(node.init, [Xtalk.ID_TO, Xtalk.ID_DOWN]);
			//Xtalk.Parser.Expression.parse(node.init);
			
			if (this._end())
				Xtalk._error_syntax('Expected "to" or "down to" but found end of line.');
			if (this._consume().id == Xtalk.ID_DOWN)
			{
				if (this._consume().id != Xtalk.ID_TO)
					Xtalk._error_syntax('Expected "down to" but found end of line.');
				node.loop = Xtalk.LOOP_COUNT_DOWN;
			}
			
			node.condition = { id: Xtalk.ID_LIST, children: this._remainder() };
			if (node.condition.children.length == 0)
				Xtalk._error_syntax('Expected integer but found end of line.');
			//Xtalk.Parser.Expression.parse(node.condition);
		}
		else
		{
			/* [for] <number> [times] */
			node.loop = Xtalk.LOOP_LIMIT;
			
			if (this._token().text.toLowerCase() == 'for')
				this._consume();
			
			node.condition = { id: Xtalk.ID_LIST, children: [] }; // was remainder
			this._accumulate(node.condition, ['times', 'time']);
			
			if ((this._token().text.toLowerCase() == 'times') ||
				(this._token().text.toLowerCase() == 'time'))
				this._consume();
			if (!this._end())
				Xtalk._error_syntax('Expected end of line here.');
			
			if (node.condition.children.length == 0)
				Xtalk._error_syntax('Expected integer here.');
			//Xtalk.Parser.Expression.parse(node.condition);
		}
	},
	

/*
 	Parses a "global ..." line.
 */
	_parse_global_decl: function()
	{
		this._consume(); /* global */
		if (this._end())
			Xtalk._error_syntax('Expected global variable name after "global".');
		
		var node = { id: Xtalk.ID_GLOBAL, variables: [] };
		this._append(node);
		
		while (!this._end())
		{
			var identifier = this._consume();
			if (!(identifier.flags & Xtalk.FLAG_IDENTIFIER))
				Xtalk._error_syntax('^0 is not a valid variable name.', identifier);
			node.variables.push(identifier.text);
			
			if (!this._end())
			{
				var comma = this._consume();
				if (comma.id != Xtalk.ID_COMMA)
					Xtalk._error_syntax('Expected end of line but found ^0.', comma.text);
				if (this._end())
					Xtalk._error_syntax('Expected another global variable name after ",".');
			}
		}
	},
    

/*
 	Parses an "exit ..." line.
 */
	_parse_exit: function()
	{
		this._consume(); /* exit */
		
		if (this._end())
		{
			if (this._in_loop()) Xtalk._error_syntax('Expected "repeat" after "exit".');
			else Xtalk._error_syntax('Expected "^0" after "exit".', this._handler.name);
		}
		
		if (this._token().id == Xtalk.ID_REPEAT)
		{
			this._consume();
			if (!this._end())
				Xtalk._error_syntax('Expected end of line but found ^0.', this._token());
			if (!this._in_loop())
				Xtalk._error_syntax('Found "exit repeat" outside a repeat loop.');
			this._append({ id: Xtalk.ID_ABORT, abort: Xtalk.ABORT_LOOP });
			return;
		}
		
		if (this._token().id == Xtalk.ID_TO)
		{
			this._consume();
			if (this._token().text.toLowerCase() != 'user')
				Xtalk._error_syntax('Expected "user" after "exit to".');
			this._consume();
			if (!this._end())
				Xtalk._error_syntax('Expected end of line after "exit to user".');
			this._append({ id: Xtalk.ID_ABORT, abort: Xtalk.ABORT_EVENT });
			return;
		}
		
		var handler = this._consume();
		if (handler.text.toLowerCase() != this._handler.name.toLowerCase())
			Xtalk._error_syntax('Expected "exit ^0" but found ^1.', this._handler.name, handler);
		this._append({ id: Xtalk.ID_RETURN, value: null });
		if (!this._end())
			Xtalk._error_syntax('Expected end of line here.');
	},
	

/*
 	Parses a "pass ..." line.
 */
	_parse_pass: function()
	{
		this._consume(); /* pass */
		if (this._end())
			Xtalk._error_syntax('Expected "^0" after "pass".', this._handler.name);
		if ((this._token().id != Xtalk.ID_IDENTIFIER) ||
			(this._token().text.toLowerCase() != this._handler.name.toLowerCase()))
			Xtalk._error_syntax('Expected "pass '+this._handler.name+'" here.');
		this._consume();
		if (!this._end())
			Xtalk._error_syntax('Expected end of line after "pass ^0".', this._handler.name);
		this._append({ id: Xtalk.ID_PASS });
	},
	

/*
 	Parses a "next ..." line.
 */
	_parse_next: function()
	{
		this._consume(); /* next */
		if (this._end())
			Xtalk._error_syntax('Expected "repeat" after "next".');
		if (this._token().id != Xtalk.ID_REPEAT)
			Xtalk._error_syntax('Expected "next repeat" here.');
		this._consume(); /* repeat */
		if (!this._in_loop())
			Xtalk._error_syntax('Found "next repeat" outside a repeat loop.');
		if (!this._end())
			Xtalk._error_syntax('Expected end of line after "next repeat".');
		this._append({ id: Xtalk.ID_ABORT, abort: Xtalk.ABORT_ITERATION });
	},
	
	
/*
 	Parses a "return ..." line.
 */
	_parse_return: function()
	{
		this._consume(); /* return */
		
		var node = {
			id:			Xtalk.ID_RETURN,
			value:		{
				id: Xtalk.ID_LIST,
				children: this._remainder()
			}
		};
		this._append(node);
		
		if (node.value.children.length > 0)
			;//Xtalk.Parser.Expression.parse(node.value);
		else
			node.value = null;
	},					


/*
 	Parses most statements, except those that directly affect the current block state.
 */	
	_parse_stmt: function()
	{
		/* check for known statement types;
		 global, exit, pass, next, return */
		if (!this._end())
		{
			if (this._token().id == Xtalk.ID_GLOBAL)
				return this._parse_global_decl();
			else if (this._token().id == Xtalk.ID_EXIT)
				return this._parse_exit();
			else if (this._token().id == Xtalk.ID_PASS)
				return this._parse_pass();
			else if (this._token().id == Xtalk.ID_NEXT)
				return this._parse_next();
			else if (this._token().id == Xtalk.ID_RETURN)
				return this._parse_return();
		}
		
		/* parse a generic message send */
		this._append(Xtalk.Parser.Message.parse({ id: Xtalk.ID_LIST, children: this._remainder() }));
	},
	

/*
 	Parses an "end ..." line.
 */
	_parse_end: function()
	{
		this._consume(); /* end */
		if (this._frame().type == this._BLOCK_LOOP)
		{
			if (this._end())
				Xtalk._error_syntax('Expected "end repeat" but found end of line.');
			if (this._token().id != Xtalk.ID_REPEAT)
				Xtalk._error_syntax('Expected "end repeat" but found "end ^0".', this._token().text);
			this._consume();
			if (!this._end())
				Xtalk._error_syntax('Expected end of line after "end repeat".');
		}
		else if (this._frame().type == this._BLOCK_CONDITION)
		{
			if (this._end())
				Xtalk._error_syntax('Expected "end if" but found end of line.');
			if (this._token().id != Xtalk.ID_IF)
				Xtalk._error_syntax('Expected "end if" but found "end ^0".', this._token().text);
			this._consume();
			if (!this._end())
				Xtalk._error_syntax('Expected end of line after "end if".');
		}
		else
			Xtalk._error_syntax('Expected "end ^0".', this._handler.name);
		
		this._up_block();
		this._frame().last_ctrl = null;
		this._frame().state = this._STATE_IN_BLOCK;
	},
	

/*
 	Drives the parsing of an individual line and generally handles only those statements
 	that enter/leave nested constructs, such as loops and conditionals.
 */
	_parse_handler_line: function()
	{
		/* Special cases: */
		
		/* shortcut empty lines */
		if (this._token().id == Xtalk.ID_EOL)
		{
			/* if a blank line immediately follows an 'if...then',
			a following 'else' may no longer be considered as belonging to that construct 
			(though it may belong to a higher level conditional block) */
			if (this._frame().state == this._STATE_IN_BLOCK_MAY_ELSE)
				this._frame().state = this._STATE_IN_BLOCK;
			return this._consume();
		}
    	
    	/* handle "then" at start of line */
		if (this._frame().state == this._STATE_COND_EXP_THEN)
		{
			this._frame().state = this._STATE_IN_BLOCK;
			if (this._token().id != Xtalk.ID_THEN)
				Xtalk._error_syntax('Expecting "then" here.');
			this._parse_block_then(false);
			return;
			//if (this._end()) return;
		}
		
		/* handle "else" at start of line and following a single-line then */
		if (this._frame().state == this._STATE_IN_BLOCK_MAY_ELSE)
		{
			this._frame().state = this._STATE_IN_BLOCK;
			if (this._token().id == Xtalk.ID_ELSE)
			{
				this._parse_block_else(false);
				return;
			}
			//if (this._end()) return;
		}
		
		/* Black-control statements: */
		if (this._frame().state == this._STATE_IN_BLOCK)
		{
			switch (this._token().id)
			{
			case Xtalk.ID_REPEAT:
				return this._parse_repeat();
			case Xtalk.ID_END:
				//if ((this._frame().type == this._BLOCK_LOOP) || 
			//		(this._frame().type == this._BLOCK_CONDITION))
					return this._parse_end();
				//break;
			case Xtalk.ID_IF:
				return this._parse_if();
			case Xtalk.ID_ELSE:
				return this._parse_else();
			case Xtalk.ID_THEN:
				Xtalk._error_syntax('"then" not allowed here.');
			}
		}
	
		this._parse_stmt();
	},
	

/*
 	Segregates the parse into separate lines, tracks the current line and configures
 	the internal state so that various convenience/utility functions may be used.
 */
	_parse_block: function()
	{
		while (this._token_index < this._tokens.items.length &&
			this._tokens.items[this._token_index].id != Xtalk.ID_INVALID)
		{
			/* find the end of this line */
			this._line_last = this._token_index;
			for (var i = this._token_index; i < this._tokens.items.length; i++)
			{
				if (this._tokens.items[i].id == Xtalk.ID_EOL)
				{
					this._line_last = i;
					break;
				}
			}
			
			/* skip blank lines */
			if (this._line_last == this._token_index) 
			{
				Xtalk._error_line++;
				this._consume();
				if (this._frame().state == this._STATE_IN_BLOCK_MAY_ELSE)
					this._frame().state = this._STATE_IN_BLOCK;
				this._frame().last_ctrl = null;
				continue;
			}
			
			var save_last = this._line_last;
			
			this._parse_handler_line(); /* parse the actual line */
			
			this._token_index = save_last + 1;
			Xtalk._error_line++;
		}
	},
	
/*
 	Resets the internal parser state in preparation to parse the supplied handler code.
 */
	_reset: function(in_handler, in_code)
	{
		/* the parser needs a line break at the end of the code to work correctly */
		if (in_code.substr(in_code.length - 1, 1) != "\n")
			in_code += "\n";
			
		this._handler = in_handler;
		
		/* convert the code to a token stream */
		this._tokens = Xtalk.Lexer.lex(in_code);
		
		/* rebuild the block stack */
		this._block_stack.length = 0;
		for (var i = 0; i < this.MAX_BLOCK_DEPTH; i++)
		{
			this._block_stack.push({
				type:		this._BLOCK_HANDLER,
				state:		this._STATE_IN_BLOCK,
				container:	null,
				construct:	null,
				
				last_ctrl:	null, // rename to be 'if' specific?
				got_else:	false
			});
		}
		
		/* configure state */
		this._block_stack[0].container = {
			id:		Xtalk.ID_BLOCK,
			stmts:	[]
		};
		this._block_stack[0].construct = this._handler;
		this._block_index = 0;
		this._token_index = 0;
	},
	
	
/*****************************************************************************************
Entry
*/

/*
 	Accepts a handler definition (as obtained from the Script module) and the source code
 	of that handler.
 	
 	Returns an abstract syntax tree representation of the parsed handler if successful.
 	
 	Throws an Error exception if parsing fails due to syntax or an internal error.
 */
	parse: function(in_handler, in_code)
	{
		/* prepare */
		Xtalk._error_line = 1;
		this._reset(in_handler, in_code);
		
		/* parse */
		this._parse_block();
		
		if (this._block_index > 0)
		{
			if (this._frame().type == this._BLOCK_LOOP)
				Xtalk._error_syntax('Expected "end repeat".');
			else
				Xtalk._error_syntax('Expected "end if".');
		}
		if (this._frame().state == this._STATE_COND_EXP_THEN)
			Xtalk._error_syntax('Expected "then" here.');
		
		/* return result */
		in_handler.block = this._block_stack[0].container;
		return in_handler;
	}
};



