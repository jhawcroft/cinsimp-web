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

	_result: [],
	_nested_loop: -1,
	_loop_stack: [],


/*****************************************************************************************
Core
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
		this._nested_loop++;
		this._loop_stack.push({
			exit_patches: [],
			begin_step: this._result.length
		});
	
		var begins_at = this._result.length;
		
		this._result.push({
			id: Xtalk.ID_LOOP,
			loop: in_subtree.loop,
			variable: in_subtree.variable,
			init: in_subtree.init,
			condition: in_subtree.condition,
			index: this._nested_loop
		});
		
		this._generate_node(in_subtree.block);
		
		this._result.push({
			id: Xtalk.ID_ABORT,
			abort: Xtalk.ABORT_ITERATION,
			step: begins_at
		});
		
		var patches = this._loop_stack.pop().exit_patches;
		for (var p = 0; p < patches.length; p++)
			this._result[patches[p]].step = this._result.length;
		this._nested_loop--;
	},
	
	
	_generate_abort: function(in_subtree)
	{
		if (in_subtree.abort == Xtalk.ABORT_LOOP)
			this._current_loop().exit_patches.push(this._result.length);
		else if (in_subtree.abort == Xtalk.ABORT_ITERATION)
			in_subtree.step = this._current_loop().begin_step;
		this._result.push(in_subtree);
	},
	
	
	_generate_condition: function(in_subtree)
	{
		
	},
	

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
		default:
			this._result.push(in_node);
			break;
		}
	},


/*****************************************************************************************
Entry
*/

/*

 */
	flatten: function(in_tree)
	{
		this._result = [];
		this._nested_loop = -1;
		this._loop_stack = [];
		
		this._generate_node(in_tree);
	
		return this._result;
	}

};







