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

/*****************************************************************************************
Callbacks
*/

	onMessageWrite: null,
	
	onError: null,	
	
	/* Note:  The dynamic path applies when the environment's current stack differs
	from the stack owner of the target of the message. */
	
	onNextResponder: null, /* look for the next responder for a given object;
							  irrespective of message, ie. next in message hierarchy */
	onLookupHandler: null, /* lookup the compiled handler for a given object */
	

/*****************************************************************************************
Constants
*/

	/* define the state of the VM: */
	_STATE_READY: 0,
	_STATE_RUNNING: 1,
	_STATE_ABORTED: 2,
	_STATE_PAUSED: 3,


/*****************************************************************************************
Module Globals
*/
	_state: 0,					/* the state of the VM */
	_last_error: null,			/* last runtime/syntax error */

	_quick_interval: null,		/* during execution, this is set to an interval reference
							       so that the VM is repeatedly invoked at rapid pace 
							       to execute the script */

	_current_card: null,		/* must be kept up-to-date by the environment */

	_globals: {},				/* associative array of global variables */
	
	_context_stack: [],			/* stack of local execution contexts,
								   ie. essentially a call stack */
								   
	_result: null,				/* 'the result' of any prior command */
	
	
/*****************************************************************************************
Utilities
*/

/*
	Creates a new execution local context.
*/
	_new_context: function(in_plan, in_target, in_handler, in_completion) // take 'me' directly?
	{
		return {
			target: in_target,
			me: (in_handler ? in_handler.owner: null),
			handler: in_handler, // what is the point of this?  debugging information?
			plan: in_plan,
			next_step: 0,
			locals: {},
			imported_globals: {},
			operand_stack: [],
			completion: in_completion,
		};
	},
	
	
/*
	Returns the top execution local context.
*/
	_context: function()
	{
		if (this._context_stack.length == 0) return null;
		return this._context_stack[this._context_stack.length-1];
	},
	
	
/*
	Automatically converts a Javascript value to an appropriate VM object.
*/
	newValue: function(in_value)
	{
		if (typeof in_value == 'string')
			return new Xtalk.VM.TString(in_value);
		else if (typeof in_value == 'number')
		{
			if (in_value % 1 === 0)
				return new Xtalk.VM.TInteger(in_value);
			else
				return new Xtalk.VM.TReal(in_value);
		}
		else if (typeof in_value == 'boolean')
			return new Xtalk.VM.TBoolean(in_value);
		else
			return in_value;
	},

	
/*
	Creates a new VM object representative of the supplied numeric value as the specified
	VM type.
*/
	_new_number: function(in_value, in_type)
	{
		if (in_type == 'Integer')
			return new Xtalk.VM.TInteger(in_value);
		else
			return new Xtalk.VM.TReal(in_value);
	},
	

/*
	Pushes a value on to the current local context's operand stack.
*/
	_push: function(in_what)
	{
		var context = this._context();
		context.operand_stack.push(in_what);
	},
	

/*
	Pops a value from the current local context's operand stack.
*/
	_pop: function()
	{
		var context = this._context();
		if (context.operand_stack.length == 0)
			Xtalk._error_internal("Can't pop, operand stack is empty.");
		return context.operand_stack.pop();
	},
	

/*
	Pops the specified number of operands off the current local context's operand stack
	and accumulates within an array, in the order in which they were originally pushed.
*/
	_operands: function(in_count)
	{
		var operands = [];
		operands.length = in_count;
		for (var i = in_count-1; i >= 0; i--)
			operands[i] = this._pop();
		return operands;
	},


/*****************************************************************************************
Message Hierarchy
*/

	/* safely handle and ignore a system event message */
	_ignore_system_event: function(in_message)
	{
	},
	

/*
	Returns a handler if the specified object responds to the supplied message,
	or null if no appropriate message handler exists.
	
	** THIS FUNCTION SHOULD BE SUBSTANTIALLY CHANGED
	TO ASK THE ENVIRONMENT FOR A GIVEN OBJECT IF IT RESPONDS TO THE MESSAGE,
	AND TO PROVIDE A COMPILED HANDLER.
	RESPONSIBILITY TO COMPILE THE HANDLER/STORE A COMPILED VERSION FALLS TO THE
	ENVIRONMENT TO UTILISE THE METHODS PROVIDED BY THE XTALK COMPILER.
	
	COMPILER ERRORS SHALL BE STORED FOR EACH INDEXED HANDLER
	SO THEY CAN BE REPORTED WHEN THE HANDLER IS ACTUALLY ACCESSED BY A MSG SEND.
 */
	_responds_to: function(in_object, in_message)
	{
		var script = in_target.scriptRead();
		var index = Xtalk.Script.index(script); // ** TO BE CACHED SOMEWHERE & POSSIBLY STORED ** TODO
		var handler = index[in_message];
		if ((!handler) || handler.type != in_message.type) return null;
		
		script = script.substr(handler.offset, handler.length);
		handler.block = Xtalk.Parser.Handler.parse(handler, script);
		handler.block = Xtalk.Flat.flatten(handler.block);
		handler.owner = in_object;
		
		return handler;
	},


/*
	Finds the next responder in the message hierarchy for the supplied message.
	Returns the appropriate handler if a responder is found, or null if no next
	responder can be identified.
 */
	_next_message_handler: function(in_responder, in_message)
	{
		while (in_responder)
		{
			/* lookup the next object in the message hierarchy */
			in_responder = onNextResponder(in_responder);
			if (!in_responder) return null;
			
			/* look for a handler for the supplied message */
			var handler = onLookupHandler(responder, in_message.name, in_message.type);
			if (handler) return handler;
		}
		return null;
	},
	

/*
	Directs the supplied message to the supplied target.
	
	Directs built-in messages to the built-in handler.
	
	Failed message sends are reported at the origin, except where the message was a 
	system event (bearing in mind a message may be caught and passed by a handler),
	before failing at CinsImp level.  -- > ** where does HC fail it for Script/Debug?
 */
 	_send_message: function(in_target, in_message)
 	{
 		/* find an appropriate handler in the message hierarchy;
 		first in the target itself and then beyond */
 		var handler = onLookupHandler(in_target, in_message.name, in_message.type);
 		if (!handler)
 			handler = this._next_message_handler(in_target, in_message);
 		
 		/* if no handler is found, the message isn't understood;
 		raise an error with the message's original origin */
 		if ((!handler) && (!in_message.builtin))
 			this._error("Can't understand \"^0\".", in_message.name);
 			
 		/* if no handler is found, look for builtin */
 		if ((!handler) && in_message.builtin)
 		{
 			in_message.builtin(in_message); // ** could set this up as a sub-context as below so that long commands can reply in time?
 			return;
 		}
 		
 		/* if a handler was found, create a sub-context and configure execution */
 		me = this;
 		this._context_stack.push( this._new_context(handler.block, handler.owner, handler, 
 			me._exit_subroutine()) );
 	},
 	
 
 /*
 	Directs the message to the next responder in the hierarchy.
 	
 	(If me is null, gets the current card. - via next responder)
  */
 	_pass_message: function(in_message)
 	{
 		/* find an appropriate handler in the message hierarchy;
 		first in the one beyond the current object (if any) */
 		var handler = this._next_message_handler(this._context().me, in_message);
 		
 		/* if no handler is found, the message isn't understood;
 		raise an error with the message's original origin */
 		if ((!handler) && (!in_message.builtin))
 			this._error("Can't understand \"^0\".", in_message.name);
 		
 		/* if no handler is found, look for builtin */
 		if ((!handler) && in_message.builtin)
 		{
 			in_message.builtin(in_message); // ** could set this up as a sub-context as below so that long commands can reply in time?
 			return;
 		}
 		
 		/* if a handler was found, replace the current sub-context and configure
 		execution */
 		me = this;
 		this._context_stack[this._context_stack.length - 1] = 
 			this._new_context(handler.block, handler.owner, handler, me._exit_subroutine());
 	},


/*****************************************************************************************
Access/Mutation
*/

// *** YET TO BE EXPANDED FOR CHUNK SUPPORT, ETC. ***
	_put: function(in_what)
	{
		in_what = in_what.resolve().toText();
		if (this.onMessageWrite)
			this.onMessageWrite(in_what);
	},
	
	
	_variable_read: function(in_name)
	{
		var context = this._context();
		if (context.imported_globals[in_name])
			return this._globals[in_name];
		else
			return context.variables[in_name];
	},
	
	
/*****************************************************************************************
Comparison
*/

/*
	Converts both operands to the same type, if possible,
	so that they may be compared.
*/
	_make_operands_compatible: function(in_operands)
	{
		in_operands[0] = in_operands[0].resolve();
		in_operands[1] = in_operands[1].resolve();
	
		if (in_operands[0].type == in_operands[1].type) return true;
		switch (in_operands[0].type)
		{
		case 'String':
		{
			switch (in_operands[1].type)
			{
			case 'Integer':
				in_operands[0] = in_operands[0].toInteger();
				return true;
			case 'Real':
				in_operands[0] = in_operands[0].toReal();
				return true;
			case 'Boolean':
				in_operands[1] = in_operands[1].toString();
				return true;
			}
			break;
		}
		case 'Boolean':
		{
			switch (in_operands[1].type)
			{
			case 'String':
				in_operands[0] = in_operands[0].toString();
				return true;
			}
			break;
		}
		case 'Integer':
		{
			switch (in_operands[1].type)
			{
			case 'String':
				in_operands[1] = in_operands[1].toInteger();
				return true;
			case 'Real':
				in_operands[0] = in_operands[0].toReal();
				return true;
			}
			break;
		}
		case 'Real':
		{
			switch (in_operands[1].type)
			{
			case 'Integer':
				in_operands[1] = in_operands[1].toReal();
				return true;
			case 'String':
				in_operands[1] = in_operands[1].toReal();
				return true;
			}
			break;
		}
		}
		return false;
	},
	

/*
	Compares two VM values and returns an integer:
	-1, if value 1 < value 2,
	0,  if value 1 and value 2 are equal, or
	1,  if value 1 > value 2.
	
	Strings are compared case-insensitively.
*/
	_compare: function(in_value1, in_value2)
	{
		switch (in_value1.type)
		{
		case 'String':
			if (in_value1._value.toLowerCase() == in_value2._value.toLowerCase()) return 0;
			return in_value1._value.localeCompare(in_value2._value);
		case 'Integer':
			if (in_value1._value == in_value2._value) return 0;
			if (in_value1._value < in_value2._value) return -1;
			return 1;
		case 'Real':
			if (Math.abs(in_value1._value - in_value2._value) < 0.0000001) return 0;
			if (in_value1._value < in_value2._value) return -1;
			return 1;
			break;
		case 'Boolean':
			if (in_value1._value == in_value2._value) return 0;
			if (!in_value1._value) return -1;
			return 1;
		}
		return -1;
	},
	

/*****************************************************************************************
Execution
*/

/*
	Converts all the operands to strings.
*/
	_make_operands_strings: function(in_operands)
	{
		for (var i = 0; i < in_operands.length; i++)
			in_operands[i] = in_operands[i].resolve().toString();
	},
	

/*
	Converts all the operands to booleans.
*/
	_make_operands_booleans: function(in_operands)
	{
		for (var i = 0; i < in_operands.length; i++)
			in_operands[i] = in_operands[i].resolve().toBoolean();
	},
	

/*
	Raises a runtime error.
*/
	_error: function(in_message)
	{
		for (var a = 1; a < arguments.length; a++)
			in_message = in_message.replace('^'+(a-1), arguments[a]);
	
		var owner = null;
		if (this._context().handler)
			owner = this._context().handler.owner;
		
		var err = new Xtalk.Error('runtime', owner, 0, in_message); // **TODO later: figure out which line we're on based on step, etc.
		// type, owner, line, message
		
		throw err;
	},
	
	
/*
	Executes a return from handler, placing the result into 'the result' and 
	if the handler was a function, also places the result on the operand stack of
	the caller (if any).
 */
	_return: function()
	{
		/* store the result */
		var val = this._pop().resolve();
		var context = this._context();
		if (context.handler && context.handler.type == Xtalk.Script.HANDLER_FUNCTION
				&& this._context_stack.length > 1)
		{
			var caller_context = this._context_stack[this._context_stack.length - 2];
			caller_context.operand_stack.push(val);
		}
		this._result = val;
		
		/* save completion handler */
		var completion = context.completion;
		
		/* remove the current context */
		this._context_stack.pop();
		
		/* run the completion handler (if any) */  // may be able to do something else with this for message box results ****
		if (completion) completion();
	},
	
	
/*
	Safely executes a single step of the current execution plan.
	If any kind of error occurs, it is caught and handled according to documented policy.
*/	
	_step_safe: function()
	{
		try { this._step(); }
		catch (err)
		{
			this._last_error = err;
			this._abort();
		}
	},
	

/*
	Executes a single step of the current execution plan.
	If an error occurs, an exception is thrown.
*/
	_step: function()
	{
		/* automatically stop the VM if there's no local context */
		var context = this._context();
		if (!context)
			this._abort();
		
		/* automatically return if the end of the current plan is reached */
		var step = context.plan[context.next_step ++];
		if (!step)
		{
			this._return();
			return;
		}
		
		/* switch on the type of operation to be performed at this step
		of the execution plan */
		switch (step.id)
		{
		
		/* message sends */
		case Xtalk.ID_MESSAGE_SEND:
		case Xtalk.ID_FUNCTION_CALL:
		{
			var params = this._operands(step.arg_count);
			var message = new Xtalk.VM.Message(step.name, (step.id == Xtalk.ID_FUNCTION_CALL), params, step.handler);
			this._send_message(context.me, message);
			break;
		}
			
		/* import global into local namespace */
		case Xtalk.ID_GLOBAL:
		{
			for (var v = 0; v < step.variables.length; v++)
				context.imported_globals[step.variables[v]] = true;
			break;
		}
		
		/* abort the current VM session */
		case Xtalk.ID_ABORT:
		{
			this._abort();
			break;
		}
		
		/* return from the current message handler */
		case Xtalk.ID_RETURN:
		{
			this._return();
			break;
		}
		
		/* push a constant or special term value */
		case Xtalk.ID_CONSTANT:
		{
			if (step.handler)
				this._push( this.newValue(step.handler(step.param)) );
			else
				this._push( this.newValue(step.value) );
			break;
		}
			
		/* push a variable reference */
		case Xtalk.ID_VARIABLE:
		{
			// need to wrap up like with the refs below, rather than read directly
			// ie. new TVariable   ****** todo *******
			
			this._push( this._variable_read(step.name) );
			break;
		}
			
		/* push a property/count reference */
		case Xtalk.ID_PROPERTY:
		case Xtalk.ID_NUMBER_OF:
		{
			// if !has_context, then context type is '----' (global)
			// otherwise, context must be obtained from operand stack,
			// evaluated and type tested
			// resolve all operands, but not the reference itself
			// except for properties and number of :)
			
			var context = null;
			if (step.has_context)
				context = this._pop();
			
			var prop = null;
			if (!context)
				prop = step.map['----'];
			else
				prop = step.map[context.type];
				
			if (prop) this._push(  this.newValue(prop.handler(context, prop.param, prop.variant)) );
			else this._error("Can't understand arguments of \"^0\".", step.name);
			
			// can't actually execute the handler, although we can create an object of TProperty
			// with all the details ready-to-go,
			// because we need to be able to write to some properties
			
			break;
		}
		
		/* push an object reference */
		case Xtalk.ID_REFERENCE:
		{
			// context, op1, op2
			
			var operands = this._operands(step.operands);
			
			var context = (step.has_context ? operands.splice(0, 1) : null);
			var ident1 = operands[0].resolve();
			var ident2 = (operands.length > 1 ? operands[1].resolve().toValue() : null);
			
			var ref = null;
			if (!context)
				ref = step.map['----'];
			else
				ref = step.map[context.type];
				
			var mode = step.ref;
			if (mode == Xtalk.REF_UNKNOWN)
			{
				if (ident1.type == 'String') mode = Xtalk.REF_NAME;
				else mode = Xtalk.REF_RANGE;
			}
			
			if (ref) this._push( this.newValue(ref.handler(context, ref.param, mode, ident1.toValue(), ident2)) );
			else throw 'Problems'; // ** TODO as above - can't get that thing/can't understand
			
			// can't actually execute the handler, although we can create an object of TReference
			// with all the details ready-to-go,
			// because we need to be able to write to some references
			
			break;
		}
		
		/* jump to a different step in the current plan */	
		case Xtalk.ID_JUMP:
		{
			context.next_step = step.step;
			break;
		}
		case Xtalk.ID_JUMP_IF_FALSE: /* ...only if the last expression was false */
		{
			var val = this._pop().resolve().toBoolean();
			if (!val._value)
				context.next_step = step.step;
			break;
		}
		case Xtalk.ID_JUMP_IF_TRUE: /* ...only if the last expression was true */
		{
			var val = this._pop().resolve().toBoolean();
			if (val._value)
				context.next_step = step.step;
			break;
		}
			
		/* push a constant literal value */
		case Xtalk.ID_LITERAL_STRING:
		{
			this._push( new Xtalk.VM.TString(step.value) );
			break;
		}
		case Xtalk.ID_LITERAL_INTEGER:
		{
			this._push( new Xtalk.VM.TInteger(step.value) );
			break;
		}
		case Xtalk.ID_LITERAL_REAL:
		{
			this._push( new Xtalk.VM.TReal(step.value) );
			break;
		}
		case Xtalk.ID_LITERAL_BOOLEAN:
		{
			this._push( new Xtalk.VM.TBoolean(step.value) );
			break;
		}
			
		/* handle arithmetic operations */
		case Xtalk.ID_ADD:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push( this._new_number(operands[0]._value + operands[1]._value, operands[0].type) );
			break;
		}
		case Xtalk.ID_SUBTRACT:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push( this._new_number(operands[0]._value - operands[1]._value, operands[0].type) );
			break;
		}
		case Xtalk.ID_NEGATE:
		{
			var operands = this._operands(1);
			this._push( this._new_number(-operands[0]._value, operands[0].type) );
			break;
		}
		case Xtalk.ID_IDIV:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push( new Xtalk.VM.TInteger(operands[0]._value / operands[1]._value) );
			break;
		}
		case Xtalk.ID_RDIV:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push( this._new_number(operands[0]._value / operands[1]._value, operands[0].type) );
			break;
		}
		case Xtalk.ID_MOD:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push( new Xtalk.VM.TInteger(operands[0]._value % operands[1]._value) );
			break;
		}
		case Xtalk.ID_MULTIPLY:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push( this._new_number(operands[0]._value * operands[1]._value, operands[0].type) );
			break;
		}
		case Xtalk.ID_EXPONENT:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push( this._new_number(Math.pow(operands[0]._value, operands[1]._value), operands[0].type) );
			break;
		}
		
		/* handle string operations */
		case Xtalk.ID_CONCAT:
		{
			var operands = this._operands(2);
			this._make_operands_strings(operands);
			this._push( new Xtalk.VM.TString(operands[0]._value + operands[1]._value) );
			break;
		}
		case Xtalk.ID_CONCAT_SPACE:
		{
			var operands = this._operands(2);
			this._make_operands_strings(operands);
			this._push( new Xtalk.VM.TString(operands[0]._value + ' ' + operands[1]._value) );
			break;
		}
		case Xtalk.ID_IS_NOT_IN:
		{
			var operands = this._operands(2);
			this._make_operands_strings(operands);
			this._push(new Xtalk.VM.TBoolean( ! operands[1].contains(operands[0]) ));
			break;
		}
		case Xtalk.ID_IS_IN:
		{
			var operands = this._operands(2);
			this._make_operands_strings(operands);
			this._push(new Xtalk.VM.TBoolean( operands[1].contains(operands[0]) ));
			break;
		}
		case Xtalk.ID_CONTAINS:
		{
			var operands = this._operands(2);
			this._make_operands_strings(operands);
			this._push(new Xtalk.VM.TBoolean( operands[0].contains(operands[1]) ));
			break;
		}
		
		/* handle comparison operations */
		case Xtalk.ID_EQUAL:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push(new Xtalk.VM.TBoolean( this._compare(operands[0], operands[1]) == 0 ));
			break;
		}
		case Xtalk.ID_NOT_EQUAL:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push(new Xtalk.VM.TBoolean( this._compare(operands[0], operands[1]) != 0 ));
			break;
		}
		case Xtalk.ID_LESS_EQUAL:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push(new Xtalk.VM.TBoolean( this._compare(operands[0], operands[1]) <= 0 ));
			break;
		}
		case Xtalk.ID_LESS:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push(new Xtalk.VM.TBoolean( this._compare(operands[0], operands[1]) < 0 ));
			break;
		}
		case Xtalk.ID_MORE_EQUAL:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push(new Xtalk.VM.TBoolean( this._compare(operands[0], operands[1]) >= 0 ));
			break;
		}
		case Xtalk.ID_MORE:
		{
			var operands = this._operands(2);
			this._make_operands_compatible(operands);
			this._push(new Xtalk.VM.TBoolean( this._compare(operands[0], operands[1]) > 0 ));
			break;
		}
		
		/* handle logical operations */
		case Xtalk.ID_LAND:
		{
			var operands = this._operands(2);
			this._make_operands_booleans(operands);
			this._push(new Xtalk.VM.TBoolean( operands[0]._value && operands[1]._value ));
			break;
		}
		case Xtalk.ID_LOR:
		{
			var operands = this._operands(2);
			this._make_operands_booleans(operands);
			this._push(new Xtalk.VM.TBoolean( operands[0]._value || operands[1]._value ));
			break;
		}
		case Xtalk.ID_LNOT:
		{
			var operand = this._pop().toBoolean();
			this._push(new Xtalk.VM.TBoolean( !(operand._value) ));
			break;
		}
		
		// todo: implement ID_NOT_WITHIN & ID_WITHIN (geometric operators)
		// todo: implement ID_EXISTS & ID_NOT_EXISTS (using callbacks to ask about specific object reference)
	
		default:
		{
			Xtalk._error_internal("Illegal operation ^0.", step.id);
			break;
		}
		}
	},


/*
	Start the VM executing with the top context's execution plan.
*/
	_run: function()
	{
		var me = this;
		if (!this._quick_interval)
			this._quick_interval = window.setInterval(function() { me._step_safe(); }, 0 );
		this._state = this._STATE_RUNNING;
		this._last_error = null;
	},
	

/*
	Stop the VM executing, with no intention of resuming the current context stack/plan.
*/
	_abort: function(in_state)
	{
		if (this._state != this._STATE_RUNNING)
			return;
	
		if (!in_state)
			in_state = this._STATE_ABORTED;
		this._state = in_state;
		
		if (this._quick_interval)
		{
			window.clearInterval(this._quick_interval);
			this._quick_interval = null;
		}
		
		if (this.onError && this._last_error)
			this.onError(this._last_error);
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
			this._context_stack = [ this._new_context(plan, this._current_card, null, 
				function() { 
					var result = Xtalk.VM._result;
					if (!result) result = new Xtalk.VM.TString('');
					Xtalk.VM._put(result); 
				}) ];
			
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
			if (this.onError)
				this.onError(err);
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
		//alert('VM should handle system event: '+in_event.name);
		
		var plan = in_target.get_execution_plan(in_event.name, in_event.type == Xtalk.Script.HANDLER_FUNCTION);
		// handler (1st null in below arguments) probably needs to be defined and supplied
		
		this._context_stack = [ this._new_context(plan, this._current_card, null, null) ];
		this._run();
	},

};




CinsImp._script_loaded('xtalk-vm');


