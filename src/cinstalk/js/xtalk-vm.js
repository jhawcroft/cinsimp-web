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
An 'object-stream virtual machine' to execute the CinsTalk language.

The rationale behind an executable form other than Javascript is to permit script 
debugging and threaded operation such that it doesn't halt the user interface or
make the browser unresponsive.


Dependencies
------------

xtalk.js

*/

Xtalk.VM = {

	_quick_interval: null,		/* during execution, this is set to an interval reference
							       so that the VM is repeatedly invoked at rapid pace 
							       to execute the script */

	_current_card: null,		/* must be kept up-to-date by the environment */

	_globals: {},				/* associative array of global variables */
	
	_context_stack: [],			/* stack of local execution contexts,
								   ie. essentially a call stack */
	

/*****************************************************************************************
Utilities
*/

	_new_context: function(in_plan, in_target, in_handler)
	{
		return {
			target: in_target,
			me: (in_handler ? in_handler.owner: null),
			handler: in_handler,
			plan: in_plan,
			next_step: 0,
			locals: {}
		};
	},
	
	
	_context: function()
	{
		return this._context_stack[this._context_stack.length-1];
	},


/*****************************************************************************************
Message Hierarchy
*/

	_message_send: function()
	{
	
	},


/*****************************************************************************************
Expression Evaluation
*/

	_evaluate_expr: function(in_expr)
	{
		
	},


/*****************************************************************************************
Execution
*/

	_step: function()
	{
		var context = this._context();
		var step = context.plan[context.next_step ++];
		if (!step)
		{
			this._abort();
			return;
		}
		switch (step.id)
		{
		case Xtalk.ID_MESSAGE_SEND:
			alert('message send: '+step.name); // ** DEBUGGING **
			break;
		}
	},


	_run: function()
	{
		var me = this;
		if (!this._quick_interval)
			this._quick_interval = window.setInterval(function() { me._step(); }, 0 );
	},
	
	
	_abort: function()
	{
		if (this._quick_interval)
		{
			window.clearInterval(this._quick_interval);
			this._quick_interval = null;
		}
		this._context_stack = [];
	},
	

/*****************************************************************************************
Language Entry
*/

/*
	Some commands, like sort, will require that their parameters be evaluated repeatedly
	and within a specific context (ie. delayed evaluation).
 */
	handle_expression: function(in_expression_tree)
	{
	
	},
	
	// these two will probably be incorporated into the actual execution engine
	// rather than being specific entry points:
	
	// apparently in testing HC, both of these seem to be compiled within the local context 
	// (ie. with access to the local variables of the executing handler),
	// however, message sends in the compiled code are directed to the current object
	// with "do", or the specified object with "send"
	// until a message send actually happens though, execution is as if within the
	// invoking handler.
	
	handle_do: function(in_what, in_local_context)
	{
	
	},
	
	handle_send: function(in_what, in_target, in_local_context)
	{
	
	},

/*****************************************************************************************
Environment Entry
*/

/*
	The user may type into the message box in the environment and have the code typed
	executed within the context of the current card.
	
	Certain constructs are too complicated to be executed (since it's only a single
	line of entry).
	
	In addition, an unadorned expression is acceptable here and will be evaluated and
	it's result returned without requirement to be an operand to a control structure
	or message send.
 */
	handle_message_box: function(in_message)
	{
		/* consider only the first line */
		var in_message = in_message.split("\n")[0].trim();
		
		if (in_message == '') return; /* skip empty input */
		
		/* try processing the message as a simple expression */
		try
		{
			/* compile */
			var stream = Xtalk.Lexer.lex(in_message);
			var tree = Xtalk.Parser.Expression.parse(stream);
			if (tree && (tree.children.length == 1) && tree.children[0]
				&& (tree.children[0].flags & Xtalk.FLAG_IDENTIFIER))
			{
				/* if there's only a single word and it's not an existing global variable,
				then don't execute the message box as an expression */
				if (! this._globals[tree.children[0].text.toLowerCase()])
					Xtalk._error_syntax("Can't understand ^0.", tree.children[0].text);
			}
			var plan = Xtalk.Flat.flatten(tree);
			
			/* setup a fresh context for the input to be executed */
			this._context_stack = [ this._new_context(plan, this._current_card, null) ];
			
			this._run();
			return;
		}
		catch (err) {
			//alert(err);
		}
		
		/* try processing the message as a small block */
		try
		{
			/* compile */
			var tree = Xtalk.Parser.Handler.parse(null, in_message);
			var plan = Xtalk.Flat.flatten(tree);
			
			/* setup a fresh context for the input to be executed */
			this._context_stack = [ this._new_context(plan, this._current_card, null) ];
			
			this._run();
			return;
		}
		
		/* handle error */
		catch (err)
		{
			alert(err.message); // temporarily - will eventually be a callback to the environment
		}
	},


/*
	This is how stuff happens in CinsImp - the environment generates 'system messages'
	and the xtalk engine attempts to find a matching handler by doing a message send
	through the current message hierarchy.
	
	Unlike a script initiated message send, if a system event message fails to find a
	suitable handler, it will simply be silently ignored.
 */
	handle_system_event: function(in_event, in_target)
	{
	
	},

};







