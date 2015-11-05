/*
CinsImp
Scriptable Object, eg. Stack, Background, Card, Button or Field
Initial mechanism for simple compilation, caching and retrieval of compiled handlers.

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



/*****************************************************************************************
Construction, Defaults and Serialisation
*/

Model.Scriptable = function() 
{
	this._script_index = null;
	this._handlers = {};
}
var Scriptable = Model.Scriptable;


/* all objects shall implement a readable script attribute */
Scriptable.prototype.get_attr = function(in_attr) {}


/*
	Quickly produce an index of the handlers within a script.
*/
Scriptable.prototype._index_script = function()
{
	var script = this.get_attr('script');
	this._script_index = Xtalk.Script.index(script);
}


/*
	Accepts an entry from the script handler index, compiles the script,
	caches the execution plan and returns the plan.
	If compilation fails, returns an invalid plan and associated error information
	so the error can be reported whenever that message is passed to this object.
*/
Scriptable.prototype._compile_handler = function(in_script_handler)
{
	try
	{
		var stream = Xtalk.Lexer.lex(in_script_handler);
		var tree = Xtalk.Parser.Expression.parse(stream);
		var plan = Xtalk.Flat.flatten(tree);
		return plan;
	}
	catch (err)
	{
		// need to store the message here ** todo
		return null;
	}
}


/*
	Returns an execution plan (if any) matching the specified message.
	If a cached execution plan doesn't currently exist, an attempt will be made to 
	compile a matching script handler.
	Returns null if no matching execution plan can be obtained.
	The returned plan shall include handler information for debugging/trace purposes.
*/
Scriptable.prototype.get_execution_plan = function(in_message_name, in_require_function)
{
	/* index the object's script if it isn't already */
	if (!this._script_index) this._index_script();
	
	/* look-up the handler; is there one for this message? */
	var script_handler = this._script_index[in_message_name];
	if (!script_handler) return null;
	
	/* compile the handler if it isn't already */
	var handler_plan = this._handlers[in_message_name];
	if (!handler_plan) handler_plan = this._compile_handler(script_handler);
	
	/* check if there were syntax errors during handler compilation */
	
	
	/* return the plan */
	return handler_plan;
}



CinsImp._script_loaded('Model.Scriptable');



