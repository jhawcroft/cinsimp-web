/*
CinsImp
CinsTalk Tree Flattener

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
Rather than translate the parsed CinsTalk to byte-code, this module 'flattens' the
abstract syntax tree to make a list of executable instruction objects.

For the most part, very little modification is needed except to significant block 
structures such as conditionals and loops.

The rationale behind an executable form other than Javascript is to permit script 
debugging and threaded operation such that it doesn't halt the user interface or
make the browser unresponsive.


Output Structure
----------------

** TODO **


Dependencies
------------

xtalk.js

*/

Xtalk.Flat = {

/*****************************************************************************************
Module Globals
*/

	_result: [],		/* holds the output of the flattening process as it's prepared */
	_nested_loop: -1,
	_loop_stack: [],	/* track various loop details during flattening */


/*****************************************************************************************
Core
*/

/*
	Returns the top-most stack frame for the loop stack,
	which holds information pertinent to the compilation of loop constructs.
*/
	_current_loop: function()
	{
		return this._loop_stack[this._loop_stack.length-1];
	},

/*
	Generates the operations necessary to execute a loop.
 */
	_generate_loop: function(in_subtree)
	{
		/* begin by tracking some loop information */
		this._nested_loop++;
		this._loop_stack.push({
			exit_patches: [],				/* list of steps which need to be patched
									           so that "exit repeat" can jump */
			begin_step: this._result.length /* the loop control step so that
											   "next repeat" has can jump */
		});
		
		/* branch to appropriate handler for type of loop;
		generate the loop header */
		switch (in_subtree.loop)
		{
		/* loop while/until a particular condition is met */
		case Xtalk.LOOP_WHILE:
		case Xtalk.LOOP_UNTIL:
			/* the condition */
			this._generate_node(in_subtree.condition);
			
			/* the loop escape */
			this._current_loop().exit_patches.push(this._result.length);
			this._result.push({
				id: (in_subtree.loop == Xtalk.LOOP_WHILE ? Xtalk.ID_JUMP_IF_FALSE : Xtalk.ID_JUMP_IF_TRUE),
				step: 0
			});
			break;
	
		/* loop a specific number of times */
		case Xtalk.LOOP_LIMIT:
			/* initialize the counter */
			this._result.push({
				id: Xtalk.ID_LITERAL_INTEGER,
				value: 0
			});
			this._result.push({
				id: Xtalk.ID_COUNT_INIT,
				which: this._nested_loop
			});
			
			/* set the start of each iteration */
			this._current_loop().begin_step = this._result.length;
			
			/* the condition */
			this._result.push({
				id: Xtalk.ID_COUNT_VALUE,
				which: this._nested_loop
			});
			this._generate_node(in_subtree.condition);
			this._result.push({
				id: Xtalk.ID_LESS,
				operand1: null,
				operand2: null
			});
			
			/* the loop escape */
			this._current_loop().exit_patches.push(this._result.length);
			this._result.push({
				id: Xtalk.ID_JUMP_IF_FALSE,
				step: 0
			});
			
			/* increment the loop counter */
			this._result.push({
				id: Xtalk.ID_COUNT_INC,
				which: this._nested_loop
			});
			break;
			
		/* loop with an explicit counter variable until a limit expression */
		case Xtalk.LOOP_COUNT_UP:
		case Xtalk.LOOP_COUNT_DOWN:
			/* initialize the counter variable */
			this._result.push({
				id: Xtalk.ID_WORD,
				name: in_subtree.variable
			});
			this._generate_node(in_subtree.init);
			this._result.push({
				id: Xtalk.ID_VAR_SET,
			});
			
			/* set the start of each iteration */
			this._current_loop().begin_step = this._result.length;
			
			/* the condition */
			this._result.push({
				id: Xtalk.ID_WORD,
				name: in_subtree.variable
			});
			this._result.push({
				id: (in_subtree.loop == Xtalk.LOOP_COUNT_UP ? Xtalk.ID_LESS : Xtalk.ID_MORE),
				operand1: null,
				operand2: null
			});
			this._generate_node(in_subtree.condition);
			
			/* the loop escape */
			this._current_loop().exit_patches.push(this._result.length);
			this._result.push({
				id: Xtalk.ID_JUMP_IF_FALSE,
				step: 0
			});
			
			/* increment the loop counter */
			this._result.push({
				id: Xtalk.ID_WORD,
				name: in_subtree.variable
			});
			this._result.push({
				id: Xtalk.ID_WORD,
				name: in_subtree.variable
			});
			this._result.push({
				id: Xtalk.ID_LITERAL_INTEGER,
				value: 1
			});
			this._result.push({
				id: (in_subtree.loop == Xtalk.LOOP_COUNT_UP ? Xtalk.ID_ADD : Xtalk.ID_SUBTRACT),
				operand1: null,
				operand2: null
			});
			this._result.push({
				id: Xtalk.ID_VAR_SET,
			});
			break;
		}
		
		/* generate the iteration steps */
		this._generate_node(in_subtree.block);
		
		/* generate the jump to the next iteration */
		this._result.push({
			id: Xtalk.ID_JUMP,
			step: this._current_loop().begin_step
		});
		
		/* patch all the steps that need to jump to the end of the loop */
		//this._result[this._current_loop().begin_step].end = this._result.length;
		var patches = this._loop_stack.pop().exit_patches;
		for (var p = 0; p < patches.length; p++)
			this._result[patches[p]].step = this._result.length;
		this._nested_loop--;
	},
	
	
/*
	Generates an abort;
	if the abort is loop related, the appropriate 'step' index is added to the 
	instruction so the VM knows where to jump next.
*/
	_generate_abort: function(in_subtree)
	{
		if (in_subtree.abort == Xtalk.ABORT_LOOP)
		{
			this._current_loop().exit_patches.push(this._result.length);
			this._result.push({
				id: Xtalk.ID_JUMP,
				step: 0
			});
		}
		else if (in_subtree.abort == Xtalk.ABORT_ITERATION)
		{
			this._result.push({
				id: Xtalk.ID_JUMP,
				step: this._current_loop().begin_step
			});
		}
		else if (in_subtree.abort == Xtalk.ABORT_EVENT)
		{
			this._result.push(in_subtree);
		}
	},
	
	
/*
	Generates an if..then..else (condition) block.
*/
	_generate_condition: function(in_subtree)
	{
		/* setup list of steps that will need patching (later) */
		var end_patches = [];
		
		/* iterate over all cases, including the default (else) case (if any) */
		for (var c = 0; c < in_subtree.cases.length; c++)
		{
			/* generate the condition itself (if any);
			if the condition is false, the VM will jump to the step index given
			(to be patched later) */
			var case_ = in_subtree.cases[c];
			var bypass_at = -1;
			if (case_.condition)
			{
				this._generate_node(case_.condition);
			
				/* the condition case bypass */
				bypass_at = this._result.length;
				this._result.push({
					id: Xtalk.ID_JUMP_IF_FALSE,
					step: 0
				});
			}
			
			/* generate the steps to execute if the condition is true */
			this._generate_node(case_.block);
			
			/* generate an instruction to bypass all other cases */
			if (c + 1 != in_subtree.cases.length)
			{
				end_patches.push(this._result.length);
				this._result.push({
					id: Xtalk.ID_JUMP,
					step: 0
				});
			}
			
			/* fix the bypass to point at the end of the case */
			if (bypass_at >= 0)
				this._result[bypass_at].step = this._result.length;
		}
		
		/* fix the end of all the case implementations to point at the end of the block */
		for (var p = 0; p < end_patches.length; p++)
			this._result[end_patches[p]].step = this._result.length;
	},
	
	
/*
	Generates a null expression suitable for passing a missing argument in a message send.
*/
	_generate_null()
	{
		this._result.push({
			"id": Xtalk.ID_INVALID
		});
	},
	

/*
	Generates an expression by flattening the evaluation into a linear sequence of 
	operand stack operations.
 */
	_generate_expr(in_subtree)
	{
		if (in_subtree.id == Xtalk.ID_EXPRESSION)
		{
			if (in_subtree.children.length > 0)
				this._generate_expr(in_subtree.children[0]);
		}
		else if (in_subtree.flags & Xtalk.FLAG_IDENTIFIER)
			this._result.push({
				id: Xtalk.ID_VARIABLE,
				name: in_subtree.text
			});
		else if ((in_subtree.id == Xtalk.ID_LITERAL_STRING) ||
				(in_subtree.id == Xtalk.ID_LITERAL_INTEGER) ||
				(in_subtree.id == Xtalk.ID_ORDINAL) ||
				(in_subtree.id == Xtalk.ID_LITERAL_REAL) ||
				(in_subtree.id == Xtalk.ID_LITERAL_BOOLEAN))
		{
			if (in_subtree.id == Xtalk.ID_ORDINAL && in_subtree.value >= 0)
				this._result.push({
					id: Xtalk.ID_LITERAL_INTEGER,
					value: in_subtree.value
				});
			else
				this._result.push({
					id: in_subtree.id,
					value: in_subtree.value
				});
		}
		else if (in_subtree.id == Xtalk.ID_CONSTANT)
		{
			if (in_subtree.context)
				this._generate_expr(in_subtree.context);
			if (in_subtree.value !== undefined && in_subtree.value !== null)
				this._result.push({
					id: in_subtree.id,
					name: in_subtree.name,
					value: in_subtree.value,
					has_context: (in_subtree.context ? true : false)
				});
			else
				this._result.push({
					id: in_subtree.id,
					name: in_subtree.name,
					handler: in_subtree.handler,
					param: in_subtree.param,
					has_context: (in_subtree.context ? true : false)
				});
		}
		else if ((in_subtree.id == Xtalk.ID_PROPERTY) ||
				(in_subtree.id == Xtalk.ID_NUMBER_OF))
		{
			if (in_subtree.context)
				this._generate_expr(in_subtree.context);
			this._result.push({
				id: in_subtree.id,
				name: in_subtree.name,
				map: in_subtree.map,
				has_context: (in_subtree.context ? true : false)
			});
		}
		else if (in_subtree.id == Xtalk.ID_REFERENCE)
		{
			var o_count = 0;
			if (in_subtree.context)
			{
				this._generate_expr(in_subtree.context);
				o_count++;
			}
			if (in_subtree.operand1)
			{
				this._generate_expr(in_subtree.operand1);
				o_count++;
			}
			if (in_subtree.operand2)
			{
				this._generate_expr(in_subtree.operand2);
				o_count++;
			}
			this._result.push({
				id: in_subtree.id,
				name: in_subtree.name,
				map: in_subtree.map,
				ref: in_subtree.ref,
				has_context: (in_subtree.context ? true : false),
				operands: o_count
			});
		}
		else if (in_subtree.id == Xtalk.ID_FUNCTION_CALL)
		{
			for (var p = 0; p < in_subtree.parameters.length; p++)
			this._generate_expr(in_subtree.parameters[p]);
			this._result.push({
				id: Xtalk.ID_FUNCTION_CALL,
				name: in_subtree.name,
				handler: (in_subtree.handler || null),
				arg_count: in_subtree.parameters.length,
				is_plugin: (in_subtree.is_plugin || false)
			});
		}
		else if (in_subtree.operand1)
		{
			this._generate_expr(in_subtree.operand1);
			if (in_subtree.operand2)
				this._generate_expr(in_subtree.operand2);
			this._result.push({
				id: in_subtree.id
			});
		}
		else
			Xtalk._error_syntax("Internal Error: Expression generation encountered unexpected node.");
	},
	
	
/*
	Generates a message send by evaluating it's arguments (if any) via the operand
	stack and finally making the message call.
*/	
	_generate_message_send: function(in_subtree)
	{
		for (var p = 0; p < in_subtree.parameters.length; p++)
		{
			var param_expr = in_subtree.parameters[p];
			if (!param_expr) this._generate_null();
			else this._generate_expr(param_expr);
		}
		this._result.push({
			id: Xtalk.ID_MESSAGE_SEND,
			name: in_subtree.name,
			handler: (in_subtree.handler || null),
			arg_count: in_subtree.parameters.length,
			is_plugin: in_subtree.is_plugin
		});
	},
	
	
/*
	Generates a return from the current message handler.
*/
	_generate_return: function(in_subtree)
	{
		this._generate_expr(in_subtree.value);
		this._result.push({
			id: Xtalk.ID_RETURN
		});
	},
	

/*
	Generates any kind of node by branching to the appropriate routine (if required.)
*/
	_generate_node: function(in_node)
	{
		switch (in_node.id)
		{
		case Xtalk.ID_HANDLER:
			this._generate_node(in_node.block);
			break;
		case Xtalk.ID_BLOCK:
			for (var s = 0; s < in_node.stmts.length; s++)
				this._generate_node(in_node.stmts[s]);
			break;
		case Xtalk.ID_LOOP:
			this._generate_loop(in_node);
			break;
		case Xtalk.ID_CONDITION_BLOCK:
			this._generate_condition(in_node);
			break;
		case Xtalk.ID_ABORT:
			this._generate_abort(in_node);
			break;
		case Xtalk.ID_EXPRESSION:
			this._generate_expr(in_node);
			break;
		case Xtalk.ID_MESSAGE_SEND:
			this._generate_message_send(in_node);
			break;
		case Xtalk.ID_RETURN:
			this._generate_return(in_node);
			break;
		default:
			this._result.push(in_node);
			break;
		}
	},


/*****************************************************************************************
Entry
*/

/*
	Accepts an abstract syntax tree and returns a sequential list of executable nodes
	whose first is index 0.
 */
	flatten: function(in_tree)
	{
		/* prepare the flattening process */
		this._result = [];
		this._nested_loop = -1;
		this._loop_stack = [];
		
		/* do the flattening */
		this._generate_node(in_tree);
	
		/* return the result */
		return this._result;
	}

};




CinsImp._script_loaded('xtalk-falt');


