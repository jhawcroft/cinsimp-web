/*
CinsImp
CinsTalk Lexical Analyser ('the Lexer')

******************************************************************************************
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

var Xtalk = Xtalk || {};


/*

Module Synopsis
---------------

The lexical analyser takes CinsTalk source code (as a string) and produces a stream of
lexical tokens as output.

In the event of an error, an exception is thrown.


Token Structures
----------------

All tokens have an 'id' field which is an integer constant that uniquely identifies 
the token.  Tokens output by the lexical analyser may have any of the following IDs:

** TO BE COMPLETED **

Depending on the token ID, the other fields of the token are varied accordingly.

The output token stream is an ID_LIST type token.

ID_LIST
-------
children	An array of tokens.

** TO BE COMPLETED **


Errors
------

** TO BE COMPLETED **


Line Breaks
-----------

The only acceptable line break is the line feed (LF; 0x0A).  If the source might contain
line breaks as generated from non-UNIXy operating environments, these must be translated
prior to invoking the lexer.


Dependencies
------------

xtalk.js


Entry Points
------------

Xtalk.Lexer.lex(in_source)


 */


Xtalk.Lexer = {
	
/*****************************************************************************************
Module Globals 
*/

	/* the CinsTalk source that is currently being processed: */
	_source: '',
	_length: 0,		/* cached length of source */
	_offset: 0,		/* character offset from beginning of source */
	_line: 0,		/* current physical line number (1-based) */
	
	/* used by the _match and _matched functions to track what was matched */
	_match_text: '',
	
	
/*****************************************************************************************
Utilities 
*/

/*
 	Is the specified character a horizontal whitespace ?
 */
	_is_space: function(in_char)
	{
		return (" \t".indexOf(in_char) >= 0);
	},

/*
 	Is the specified character a digit ?
 */
	_is_digit: function(in_char)
	{
		return ('0123456789'.indexOf(in_char) >= 0);
	},

/*
 	Is the specified character a control character, whitespace or punctuation ?
 	
 	Note:  It is much easier to look for recognised special characters than to look for
 	all alpha-numerics, for which the complete set is prohibitively large!
 */
	_is_non_alnum: function(in_char)
	{
		return ('!"#$%&\'()*+,-./:;<=>?@[\\]^`{|}~¬≠≥≤ \t\n\r'.indexOf(in_char) >= 0);
	},
	
	
/*****************************************************************************************
Analysis 
*/

/*
	Skips ahead through the source until the next line break.
	Returns a representative token (ID = ID_EOL; see notes above for more information).
 */
	_get_eol: function()
	{
		var eol = this._source.indexOf("\n", this._offset); /* find next line break */
		if (eol < 0) eol = this._length;
		else eol++; /* skip the line break */
		var node = { 
			id: Xtalk.ID_EOL, 
			text: '', 
			value: '', 
			debug: "end of line", 
			offset: this._offset, 
			line: this._line, 
			flags: 0 
		};
		this._line ++; /* track which line is currently being processed */
		this._offset = eol;
		return node;
	},

/*
	Reads a quoted string literal from the source.
	Returns a representative token (ID = ID_LITERAL_STRING; 
	see notes above for more information).
 */
	_get_string: function()
	{
		this._offset++; /* skip the leading quote (") */
		var end = this._source.indexOf('"', this._offset); /* find the closing quote (") */
		if (end < 0) end = this._length;
		var str = { 
			id: Xtalk.ID_LITERAL_STRING, 
			text: '', 
			debug: 'string',
			value: this._source.substr(this._offset, end - this._offset), 
			offset: this._offset, 
			line: this._line,
			flags: 0 
		};
		this._offset = end + 1; /* skip the string and the closing quote (") */
		return str;
	},
	
/*
	Reads a numeric literal (integer or real number) from the source.
	Returns a representative token (ID = ID_LITERAL_INTEGER/ID_LITERAL_REAL; 
	see notes above for more information).
 */
	_get_number: function()
	{
		var end = this._offset;
		var is_real = false; /* assume it's an integer until we find a decimal point */
		var num = '';
		for (; end < this._length; end++) /* accumulate a string representation
											 and determine if it's a real number */
		{
			var c = this._source.substr(end, 1);
			if (!is_real)
			{
				if (this._is_digit(c)) num += c;
				else if (c == '.')
				{
					num += '.';
					is_real = true;
				}
				else break;
			}
			else
			{
				if (this._is_digit(c)) num += c;
				else break;
			}
		}
		this._offset += num.length; /* skip the number */
		if (!is_real)
			return { id: Xtalk.ID_LITERAL_INTEGER, text: num, value: (num * 1), 
				offset: this._offset, line: this._line, flags: 0 };
		else
			return { id: Xtalk.ID_LITERAL_REAL, text: num, value: (num * 1.0), 
				offset: this._offset, line: this._line, flags: 0 };
	},
	
/*
	Attempts to match the supplied string with the current position in the source 
	(case insensitive).
	If there's a match, returns true and stores the match for later use.
	Otherwise, returns false.
 */
	_match: function(in_string)
	{
		if (this._source.substr(this._offset, in_string.length).toLowerCase() != in_string) return false;
		var last_char = in_string.substr(in_string.length - 1, 1);
		if (!this._is_non_alnum(last_char)) /* if the last character is alpha-numeric,
											   ensure the string is immediately followed
											   by a non-alpha-numeric character, eg.
											   matches 'for' in 'for x' but not in 'forever' */
		{
			if (!this._is_non_alnum(this._source.substr(this._offset + in_string.length, 1))) return false;
		}
		_match_text = in_string; /* store the match for use by _matched() below */
		return true;
	},

/*
	Constructs a token representative of the previously matched string;
	designed to work in co-operation with the prior _match() call.
 */
	_matched: function(in_id, in_flags, in_value)
	{
		if (!in_flags) in_flags = 0; 	/* auto-fill flags if not supplied */
		if (!in_value) in_value = ''; 	/* auto-fill value if not supplied */
		var op = { 
			id: in_id,
			text: _match_text, 
			value: in_value, 
			offset: this._offset, 
			line: this._line, 
			flags: in_flags 
		};
		this._offset += _match_text.length; /* skip the match */
		return op;
	},
	
/*
	Reads a word or identifier from the source.
	If the word fulfils the basic criteria for an identifier, it is returned as an
	ID_IDENTIFIER token, otherwise an ID_UNKNOWN.
 */
	_get_identifier: function()
	{
		for (var end = this._offset; end < this._length; end++) /* find first non-alpha-numeric */
		{
			var c = this._source.substr(end, 1);
			if (this._is_non_alnum(c)) break;
		}
		if (end == this._offset) /* looking at a non-alpha-numeric? */
		{
			var node = { id: Xtalk.ID_UNKNOWN, text: this._source.substr(this._offset, 1) };
			this._offset++; /* skip ahead one character */
			return node;
		}
		var word = { id: Xtalk.ID_IDENTIFIER, text: this._source.substr(this._offset, end - this._offset),
			value: '', offset: this._offset, line: this._line, flags: Xtalk.FLAG_IDENTIFIER };
		this._offset += word.text.length; /* skip the word */
		return word;
	},

/*
	Reads and returns the next token from the source.
	If the end of the source is reached, returns null.
 */
	_get_token: function()
	{
		while (this._offset < this._length) /* loop in case we find a token that we ignore */
		{
			var char1 = this._source.substr(this._offset, 1);
			if (char1 == '-' && this._source.substr(this._offset, 2) == '--') /* line comment */
				return this._get_eol();
			else if (char1 == "\n") /* end of line */
				return this._get_eol();
			else if (char1 == '¬') /* line continuation; ignore and keep scanning */
				this._get_eol();
			else if (char1 == '"') /* string literal */
				return this._get_string();
			else if (this._is_space(char1)) /* horizontal whitespace */
				this._offset++;
			else if (this._is_digit(char1)) /* numeric literal */
				return this._get_number();
			else
			{
				/* recognised operators, control characters, syntax and reserved keywords */
				
				/* simple operators: */
				if (this._match('=')) return this._matched(Xtalk.ID_EQUAL, Xtalk.FLAG_OPERATOR);
				else if (this._match('-')) return this._matched(Xtalk.ID_SUBTRACT, Xtalk.FLAG_OPERATOR);
				else if (this._match('^')) return this._matched(Xtalk.ID_EXPONENT, Xtalk.FLAG_OPERATOR);
				else if (this._match('*')) return this._matched(Xtalk.ID_MULTIPLY, Xtalk.FLAG_OPERATOR);
				else if (this._match('+')) return this._matched(Xtalk.ID_ADD, Xtalk.FLAG_OPERATOR);
				else if (this._match('/')) return this._matched(Xtalk.ID_RDIV, Xtalk.FLAG_OPERATOR);
				else if (this._match('<=')) return this._matched(Xtalk.ID_LESS_EQUAL, Xtalk.FLAG_OPERATOR);
				else if (this._match('≤')) return this._matched(Xtalk.ID_LESS_EQUAL, Xtalk.FLAG_OPERATOR);
				else if (this._match('<>')) return this._matched(Xtalk.ID_NOT_EQUAL, Xtalk.FLAG_OPERATOR);
				else if (this._match('≠')) return this._matched(Xtalk.ID_NOT_EQUAL, Xtalk.FLAG_OPERATOR);
				else if (this._match('<')) return this._matched(Xtalk.ID_LESS, Xtalk.FLAG_OPERATOR);
				else if (this._match('>=')) return this._matched(Xtalk.ID_MORE_EQUAL, Xtalk.FLAG_OPERATOR);
				else if (this._match('≥')) return this._matched(Xtalk.ID_MORE_EQUAL, Xtalk.FLAG_OPERATOR);
				else if (this._match('>')) return this._matched(Xtalk.ID_MORE, Xtalk.FLAG_OPERATOR);
				else if (this._match('&&')) return this._matched(Xtalk.ID_CONCAT_SPACE, Xtalk.FLAG_OPERATOR);
				else if (this._match('&')) return this._matched(Xtalk.ID_CONCAT, Xtalk.FLAG_OPERATOR);
				
				/* control characters: */
				else if (this._match('(')) return this._matched(Xtalk.ID_PAREN_OPEN, Xtalk.FLAG_SPECIAL);
				else if (this._match(')')) return this._matched(Xtalk.ID_PAREN_CLOSE, Xtalk.FLAG_SPECIAL);
				else if (this._match(',')) return this._matched(Xtalk.ID_COMMA, Xtalk.FLAG_SPECIAL);
		
				/* long operators: */
				else if (this._match('is not within')) return this._matched(Xtalk.ID_NOT_WITHIN, Xtalk.FLAG_OPERATOR);
				else if (this._match('is not in')) return this._matched(Xtalk.ID_NOT_IN, Xtalk.FLAG_OPERATOR);
				else if (this._match('is not')) return this._matched(Xtalk.ID_NOT_EQUAL, Xtalk.FLAG_OPERATOR);
				else if (this._match('is within')) return this._matched(Xtalk.ID_WITHIN, Xtalk.FLAG_OPERATOR);
				else if (this._match('is in')) return this._matched(Xtalk.ID_IN, Xtalk.FLAG_OPERATOR);
				else if (this._match('is')) return this._matched(Xtalk.ID_EQUAL, Xtalk.FLAG_OPERATOR);
				else if (this._match('there is a')) return this._matched(Xtalk.ID_EXISTS, Xtalk.FLAG_OPERATOR);
				else if (this._match('there is no')) return this._matched(Xtalk.ID_NOT_EXISTS, Xtalk.FLAG_OPERATOR);
				else if (this._match('contains')) return this._matched(Xtalk.ID_CONTAINS, Xtalk.FLAG_OPERATOR);
				else if (this._match('div')) return this._matched(Xtalk.ID_IDIV, Xtalk.FLAG_OPERATOR);
				else if (this._match('mod')) return this._matched(Xtalk.ID_MODULUS, Xtalk.FLAG_OPERATOR);
				else if (this._match('and')) return this._matched(Xtalk.ID_LAND, Xtalk.FLAG_OPERATOR);
				else if (this._match('or')) return this._matched(Xtalk.ID_LOR, Xtalk.FLAG_OPERATOR);
				else if (this._match('not')) return this._matched(Xtalk.ID_LNOT, Xtalk.FLAG_OPERATOR);
				
				/* ordinals: */
				else if (this._match('any')) return this._matched(Xtalk.ID_ANY, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, -3);
				else if (this._match('middle')) return this._matched(Xtalk.ID_MIDDLE, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, -2);
				else if (this._match('last')) return this._matched(Xtalk.ID_LAST,
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, -1);
				else if (this._match('first')) return this._matched(Xtalk.ID_FIRST, 
					Xtalk.FLAG_ORDINA|Xtalk.FLAG_IDENTIFIERL, 1);
				else if (this._match('second')) return this._matched(Xtalk.ID_SECOND, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 2);
				else if (this._match('third')) return this._matched(Xtalk.ID_THIRD, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 3);
				else if (this._match('forth')) return this._matched(Xtalk.ID_FOURTH, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 4);
				else if (this._match('fourth')) return this._matched(Xtalk.ID_FOURTH, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 4);
				else if (this._match('fifth')) return this._matched(Xtalk.ID_FIFTH, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 5);
				else if (this._match('sixth')) return this._matched(Xtalk.ID_SIXTH, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 6);
				else if (this._match('seventh')) return this._matched(Xtalk.ID_SEVENTH, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 7);
				else if (this._match('eighth')) return this._matched(Xtalk.ID_EIGHTH, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 8);
				else if (this._match('ninth')) return this._matched(Xtalk.ID_NINTH, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 9);
				else if (this._match('tenth')) return this._matched(Xtalk.ID_TENTH, 
					Xtalk.FLAG_ORDINAL|Xtalk.FLAG_IDENTIFIER, 10);
				
				/* assorted syntax fragments: */
				else if (this._match('the')) return this._matched(Xtalk.ID_THE, Xtalk.FLAG_IDENTIFIER);
				else if (this._match('in')) return this._matched(Xtalk.ID_IN, Xtalk.FLAG_IDENTIFIER);
				else if (this._match('of')) return this._matched(Xtalk.ID_OF, Xtalk.FLAG_IDENTIFIER);
				else if (this._match('down')) return this._matched(Xtalk.ID_DOWN, Xtalk.FLAG_IDENTIFIER);
				else if (this._match('to')) return this._matched(Xtalk.ID_TO, Xtalk.FLAG_IDENTIFIER);
				else if (this._match('id')) return this._matched(Xtalk.ID_ID, Xtalk.FLAG_IDENTIFIER);
				else if (this._match('while')) return this._matched(Xtalk.ID_WHILE, Xtalk.FLAG_IDENTIFIER);
				else if (this._match('until')) return this._matched(Xtalk.ID_UNTIL, Xtalk.FLAG_IDENTIFIER);
		
				/* reserved keywords: */
				else if (this._match('end')) return this._matched(Xtalk.ID_END, Xtalk.FLAG_KEYWORD);
				else if (this._match('exit')) return this._matched(Xtalk.ID_EXIT, Xtalk.FLAG_KEYWORD);
				else if (this._match('function')) return this._matched(Xtalk.ID_FUNCTION, Xtalk.FLAG_KEYWORD);
				else if (this._match('global')) return this._matched(Xtalk.ID_GLOBAL, Xtalk.FLAG_KEYWORD);
				else if (this._match('if')) return this._matched(Xtalk.ID_IF, Xtalk.FLAG_KEYWORD);
				else if (this._match('then')) return this._matched(Xtalk.ID_THEN, Xtalk.FLAG_KEYWORD);
				else if (this._match('else')) return this._matched(Xtalk.ID_ELSE, Xtalk.FLAG_KEYWORD);
				else if (this._match('next')) return this._matched(Xtalk.ID_NEXT, Xtalk.FLAG_KEYWORD);
				else if (this._match('on')) return this._matched(Xtalk.ID_ON, Xtalk.FLAG_KEYWORD);
				else if (this._match('pass')) return this._matched(Xtalk.ID_PASS, Xtalk.FLAG_KEYWORD);
				else if (this._match('repeat')) return this._matched(Xtalk.ID_REPEAT, Xtalk.FLAG_KEYWORD);
				else if (this._match('return')) return this._matched(Xtalk.ID_RETURN, Xtalk.FLAG_KEYWORD);
				
				/* other syntax and identifiers: */
				return this._get_identifier();
			}
		}
		return null; /* end of source */
	},

/*
	Prepares the lexer for processing a new script fragment.
 */
	_reset: function(in_source)
	{
		this._source = in_source;
		this._length = in_source.length;
		this._offset = 0;
		this._line = 1;
	},


/*****************************************************************************************
Entry 
*/
	/*
		Returns a list of tokens for the given CinsTalk source/script fragment.
	*/
	lex: function(in_source)
	{
		this._reset(in_source); /* prepare */
		var list = { id: Xtalk.ID_LIST, items: [] }; /* empty output */
		while (this._offset < this._length)
		{
			var token = this._get_token(); /* get next token */
			list.items.push( token ); /* accumulate tokens */
		}
		return list;
	},
}



