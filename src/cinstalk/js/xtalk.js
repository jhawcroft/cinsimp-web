/*
CinsImp
CinsTalk Base Namespace and Utilities

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

Dependencies
------------

n/a

*/


var Xtalk = {

/*****************************************************************************************
Constants 
*/

/* token.flags to aid parsing: */
	FLAG_OPERATOR: 	1,
	FLAG_ORDINAL: 	2,
	FLAG_KEYWORD: 	4,		/* reserved keyword */
	FLAG_SPECIAL:	8,
	FLAG_IDENTIFIER:16,		/* legal for use as a variable or handler name */
	
/* types of ID_ABORT: */
	ABORT_ITERATION: 0,		/* equivalent to "next repeat" or Javascript "continue" */
	ABORT_LOOP: 1,			/* equivalent to "exit repeat" or Javascript "break" */
	ABORT_EVENT: 2, 		/* equivalent to "exit to user";
							   aborts processing of all currently executing system events */

/* types of ID_LOOP: */
	LOOP_FOREVER: 0,		/* infinite loop; no condition */
	LOOP_WHILE: 1,			/* iterate until condition evaluates to true */
	LOOP_UNTIL: 2,			/* iterate until condition evaluates to false */
	LOOP_LIMIT: 3,			/* iterate a specified number of times */
	LOOP_COUNT_UP: 4,		/* loop with a counter within a specific range */
	LOOP_COUNT_DOWN: 5,
	
/* tokens and syntax tree nodes: */
	ID_LITERAL_INTEGER: -1,
	ID_LITERAL_REAL: -2,
	ID_LITERAL_STRING: -3,
	ID_LITERAL_BOOLEAN: -4,

	ID_CONSTANT: -5,
	ID_PROPERTY: -6,
	ID_REFERENCE: -7,
	ID_FUNCTION_CALL: -8,
	ID_MESSAGE_SEND: -9,
	ID_GLOBAL: -10,
	ID_LOOP: -11,
	ID_ABORT: -12,
	ID_RETURN: -13,
	ID_HANDLER: -14,
	ID_EXPRESSION: -15,
	ID_BLOCK: -16,
	ID_LIST: -17,
	ID_WORD: -18,
	ID_CONDITION_BLOCK: -19,
	ID_CONDITION_CASE: -20,
	ID_ORDINAL: -21,

	ID_INVALID: 0,

	ID_PAREN_OPEN: 1,
	ID_PAREN_CLOSE: 2,
	ID_COMMA: 3,
	ID_NUMBER_OF: 4,
	ID_EOL: 5,
	ID_NOT_WITHIN: 6,
	ID_WITHIN: 7,
	ID_NOT_IN: 8,
	ID_IN: 9,
	ID_CONTAINS: 10,
	ID_EQUAL: 11,
	ID_NOT_EQUAL: 12,
	ID_EXISTS: 13,
	ID_NOT_EXISTS: 14,
	ID_IDIV: 15,
	ID_RDIV: 16,
	ID_MOD: 17,
	ID_MULTIPLY: 18,
	ID_ADD: 19,
	ID_SUBTRACT: 20,
	ID_NEGATE: 21,
	ID_EXPONENT: 22,
	ID_LAND: 23,
	ID_LOR: 24,
	ID_LNOT: 25,
	ID_LESS_EQUAL: 26,
	ID_LESS: 27,
	ID_MORE_EQUAL: 27,
	ID_MORE: 28,
	ID_CONCAT_SPACE: 29,
	ID_CONCAT: 30,

	ID_ANY: 31,
	ID_MIDDLE: 32,
	ID_LAST: 33,
	ID_FIRST: 34,
	ID_SECOND: 35,
	ID_THIRD: 36,
	ID_FOURTH: 37,
	ID_FIFTH: 38,
	ID_SIXTH: 39,
	ID_SEVENTH: 40,
	ID_EIGHTH: 41,
	ID_NINTH: 42,
	ID_TENTH: 43,

	ID_THE: 50,
	ID_IN: 51,
	ID_OF: 52,
	ID_TO: 53,
	ID_ID: 54,
	ID_END: 55,
	ID_EXIT: 56,
	ID_FUNCTION: 57,
	ID_GLOBAL: 58,
	ID_IF: 59,
	ID_ELSE: 60,
	ID_NEXT: 61,
	ID_ON: 62,
	ID_PASS: 63,
	ID_REPEAT: 64,
	ID_RETURN: 65,

	ID_DOWN: 66,
	ID_WHILE: 67,
	ID_UNTIL: 68,
	ID_FOREVER: 69,
	ID_WITH: 70,
	ID_FOR: 71,
	ID_TIMES: 72,
	
	ID_JUMP: 90,
	ID_JUMP_IF_FALSE: 91,
	ID_JUMP_IF_TRUE: 92,
	
	// loop related, may be minimised by use of existing language built-ins ***
	ID_COUNT_INIT: 93,
	ID_COUNT_VALUE: 94,
	ID_COUNT_INC: 95,
	ID_COUNT_DEC: 96,
	ID_VAR_SET: 97,
	
	
/*****************************************************************************************
Module Globals 
*/
	_error_line: 0,		/* if an error occurs, what physical line is closest ? */
	
	_legacy_hc: false,	/* should the language allow the use of certain keywords that
						   were permitted in HyperTalk ? */


/*****************************************************************************************
Utilities
*/

/*
	Returns the number of words in the supplied string.
 */
	_word_count: function(in_string)
	{
		if (in_string == '') return 0;
		return in_string.split(' ').length;
	},
	

/*****************************************************************************************
Error Handling
*/

/*
	Looks at the supplied object and determines a string description of it suitable
	for an error message.
*/
	_object_desc: function(in_object)
	{
		if (typeof in_object != 'object') return in_object;
		
		if (in_object.id)
			return Xtalk.Lexer.describe(in_object);
		else if (in_object.errorDesc)
			return in_object.errorDesc;
	},
	

/*
 	Invoked by the parser to raise a syntax error.
 */
	_error_syntax: function(in_message)
	{
		for (var a = 1; a < arguments.length; a++)
			in_message = in_message.replace('^'+(a-1), this._object_desc(arguments[a]));
		throw Error("Syntax Error: " + Xtalk._error_line + ': ' + in_message);
	}

};







