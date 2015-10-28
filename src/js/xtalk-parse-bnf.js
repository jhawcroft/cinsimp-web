/*
CinsImp
xTalk Engine: Command Syntax BNF Parser

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

Converts command syntax definitions expressed as a kind of BNF (Backus Naur Form) 
into a tree form (a Command Pattern) suitable for use by the Command Parser to match 
command statement syntax in a script.

BNF Syntax
----------

** TODO **


Examples
--------

read from file <filepath> [at <charBegin>] {for <charCount> | until {end|eof|<charEnd>}}

ask [`password``1`password] <prompt> [with <response>]

sort [[the] cards] [`dir``asc`ascending|`des`descending] by <sortKey>

find [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] <text> [in <field>]
        
beep [<times> [times]]


*/


Xtalk.Parser = Xtalk.Parser || {};

Xtalk.Parser.BNF = {

/*****************************************************************************************
Constants
*/

	/* pattern node types: */

	PAT_LIST: 		0,	/* sequence of terms */
	PAT_LITERAL: 	1,	/* literal syntax term */
	PAT_PARAM: 		2, 	/* command parameter */
	PAT_SET_OPT: 	3, 	/* optional set of terms */
	PAT_SET_REQ: 	4, 	/* required set of terms */


/*****************************************************************************************
Utilities
*/

	_is_space: function(in_char)
	{
		return (" \t".indexOf(in_char) >= 0)
	},


	_is_alpha: function(in_char)
	{
		return ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".indexOf(in_char) >= 0);
	},


/*****************************************************************************************
Core
*/

/*
	Add a stop-word to the set;
	ie. don't add a word which is already in the set.
 */
	_sws_add: function(in_set, in_word)
	{
		for (var i = 0; i < in_set.length; i++)
			if (in_set[i] == in_word) return;
		in_set.push(in_word);
	},


/*
	Combine two sets of stop words, with no duplicates.
	The result is in the first set.
 */
	_sws_union: function(in_1, in_2)
	{
		if (!in_2) return;
		for (var i = 0; i < in_2.length; i++)
			this._sws_add(in_1, in_2[i]);
	},


/*
	Copies a stop-word set.
 */
	_sws_grab: function(in_set)
	{
		var stop_words = [];
		for (var i = 0; i < in_set.length; i++)
			stop_words.push(in_set[i]);
		return stop_words;
	},


/*
	Recursively determines a list of stop-words for a given pattern subtree/node.
 */
	_stop_words_for_subpattern: function(in_pattern)
	{
		var result = null;
		var temp_set;
		if (!in_pattern) return null;
		switch (in_pattern.bnf)
		{
			case this.PAT_SET_REQ:
			case this.PAT_SET_OPT:
			{
				// each list element's stop words must be appended, because regardless of the list type,
				// the elements are each alternates
				for (var i = 0; i < in_pattern.children.length; i++)
				{
					temp_set = this._stop_words_for_subpattern(in_pattern.children[i]);
					if (temp_set && temp_set.length) 
					{
						if (!result) result = [];
						this._sws_union(result, temp_set);
					}
				}
				return result;
			}
			
			case this.PAT_LIST:
			{
				// accumulate stop words of optional sets
				// and the first required set
				// or the first word we encounter in this element
				var got_req;
				for (var i = 0; i < in_pattern.children.length; i++)
				{
					var subpattern = in_pattern.children[i];
					if (!subpattern) continue;
					if (subpattern.bnf == this.PAT_LITERAL)
					{
						if (!result) result = [];
						this._sws_add(result, subpattern.text);
						return result;
					}
					var got_req = false;
					if ((subpattern.bnf == this.PAT_SET_OPT) || (subpattern.bnf == this.PAT_SET_REQ))
					{
						temp_set = this._stop_words_for_subpattern(in_pattern.children[i]);
						if (temp_set && temp_set.length) 
						{
							if (!result) result = [];
							this._sws_union(result, temp_set);
							got_req = (subpattern.bnf == this.PAT_SET_REQ);
						}
					}
					// continue appending until first required word(s)
					if (got_req) break;
				}
				return result;
			}
			
			case this.PAT_LITERAL:
				// the stop word, is this literal! <-- first literal encountered at top of search
				result = [];
				this._sws_add(result, in_pattern.text);
				return result;
			
				break;
			case this.PAT_PARAM:
				// this is an error - if we encounter one of these at the top of the search
				// effectively two or more successive params with no syntax between - not allowed
				// ???
				//throw 'cmd-bnf.js: _stop_words_for_subpattern(): illegal command syntax';
				break;
		}
		return null;
	},


/*
	Attaches lists of 'stop-words' to appropriate nodes within a BNF-based
	pattern subtree to facilitate later matching.
 */
	_attach_stop_words: function(in_pattern, in_set)
	{
		switch (in_pattern.bnf)
		{
			case this.PAT_SET_REQ:
			case this.PAT_SET_OPT:
				for (var i = 0; i < in_pattern.children.length; i++)
					this._attach_stop_words(in_pattern.children[i], in_set);
				break;
			
			case this.PAT_LIST:
				// need to process within lists
				// if we encounter a param, stop words from caller + those following but only up til the first required set
				for (var i = 0; i < in_pattern.children.length; i++)
				{
					// stop words include those we can obtain from the subpatterns beyond child i,
					// up to the first required subpattern or first literal
					var post_set = [];
					for (var j = i+1; j < in_pattern.children.length; j++)
					{
						var subpattern = in_pattern.children[j];
						var temp_set = this._stop_words_for_subpattern(subpattern);
						if (temp_set && temp_set.length) this._sws_union(post_set, temp_set);
						if (subpattern.bnf == this.PAT_LITERAL) break;
					}
				
					// create a union of the set we've been fed
					var union_set = [];
					this._sws_union(union_set, in_set);
					this._sws_union(union_set, post_set);
					this._attach_stop_words(in_pattern.children[i], union_set);
				}
				break;
			
			case this.PAT_LITERAL:
				break;
			
			case this.PAT_PARAM:
				// need to attach stop words here
				if (in_pattern.stop_words != null) throw Error('Internal Error: Pattern stopwords already set.');
				in_pattern.stop_words = this._sws_grab(in_set);
				break;
		}
	},


/*
	Turns a BNF-style stream into a sequence of very primitive tokens for the BNF parser.
 */
	_tokenize: function(in_syntax)
	{
		var list = [];
	
		var len = in_syntax.length;
		var token_start = 0;
		var token_length;
		var buffer;
	
		/* iterate through characters of syntax */
		for (var offset = 0; offset <= len; offset++)
		{
			/* as soon as we encounter punctuation, whitespace or the end of the syntax;
			 process the preceeding token, the punctuation and prepare for the next */
			if ( this._is_space(in_syntax.substr(offset, 1)) || (!this._is_alpha(in_syntax.substr(offset, 1))) )
			{
				/* append preceeding text token (if any) */
				token_length = offset - token_start;
				if (token_length)
					list.push(in_syntax.substr(token_start, token_length));
			
				/* handle punctuation */
				if ( (offset < len) && (!this._is_space(in_syntax.substr(offset, 1))) )
					list.push(in_syntax.substr(offset, 1));
			
				/* prepare for next text token */
				token_start = offset + 1;
			}
		}
	
		return list;
	},


/*
	Translates the BNF token stream into a BNFPattern tree, which is almost ready to 
	be used to match syntax.
 */
	_parse_bnf: function(io_pattern, io_tokens, in_set, in_element)
	{
		/* check for end of token stream */
		while(io_tokens.offset < io_tokens.stream.length)
		{
			var token = io_tokens.stream[io_tokens.offset];
		
			/* process list */
			if (io_pattern.bnf == this.PAT_LIST)
			{
				/* append <params> */
				if (token.charAt(0) == '<')
				{
					var param_node = {
						bnf:		this.PAT_PARAM,
						children:	[],
						text:		'',
						stop_words: null
					};
					io_pattern.children.push(param_node);
					token = io_tokens.stream[++io_tokens.offset];
					while ( token && (token.charAt(0) != '>') )
					{
						param_node.text += token;
						token = io_tokens.stream[++io_tokens.offset];
					}
					++io_tokens.offset;
				}
			
				/* `name` for namable element */
				else if ( (token.charAt(0) == '`') && in_set && in_element )
				{
					token = io_tokens.stream[++io_tokens.offset];
					if (in_set.text.length == 0)
					{
						while ( token && (token.charAt(0) != '`') )
						{
							in_set.text += token;
							token = io_tokens.stream[++io_tokens.offset];
						}
					}
					else
					{
						while ( token && (token.charAt(0) != '`') )
						{
							in_element.text += token;
							token = io_tokens.stream[++io_tokens.offset];
						}
					}
					++io_tokens.offset;
				}
			
				/* check for exit of current list; beginning of another */
				else if (token.charAt(0) == '|')
				{
					++io_tokens.offset;
					return;
				}
			
				/* handle set begin */
				else if ( (token.charAt(0) == '[') || (token.charAt(0) == '{') )
				{
					var set_node = {
						bnf:		((token.charAt(0) == '[') ? this.PAT_SET_OPT : this.PAT_SET_REQ),
						children:	[],
						text:		'',
						stop_words: null
					};
					++io_tokens.offset;
					io_pattern.children.push(set_node);
					this._parse_bnf(set_node, io_tokens, set_node, null);
				}
			
				/* handle set end */
				else if ( (token.charAt(0) == ']') || (token.charAt(0) == '}') )
					return;
			
				/* append words and ,  */
				else if ( (token.charAt(0) == ',') || this._is_alpha(token.charAt(0)) )
				{
					io_pattern.children.push({
						bnf:		this.PAT_LITERAL,
						children:	[],
						text:		token,
						stop_words: null
					});
					++io_tokens.offset;
				}
			}
		
			/* if we're in a SET, begin by creating another LIST and branching to it to continue */
			else if ((io_pattern.bnf == this.PAT_SET_OPT) || (io_pattern.bnf == this.PAT_SET_REQ))
			{
				/* handle set end */
				if ( (token.charAt(0) == ']') || (token.charAt(0) == '}') )
				{
					++io_tokens.offset;
					return;
				}
			
				/* handle set continuation */
				var list_node = {
					bnf:		this.PAT_LIST,
					children:   [],
					text:		'',
					stop_words: null
				};
				io_pattern.children.push(list_node);
				this._parse_bnf(list_node, io_tokens, in_set, list_node);
			}
		}
	},


/*****************************************************************************************
Entry
*/

/*
	Parses a BNF-style syntax to produce a pattern tree which can be used to easily
	match a tokenised CinsTalk message send.
 */

	parse: function(in_syntax)
	{
		if (in_syntax.indexOf("\n") >= 0) 
			throw Error('Internal Error: BNF syntax cannot contain multiple lines.');
	
		var tokens = this._tokenize(in_syntax);
	
		var result = {
			bnf:		this.PAT_SET_REQ,
			children:	[],
			text:		'',
			stop_words: null
		};
		this._parse_bnf(result, {stream: tokens, offset: 0}, null, null);
		this._attach_stop_words(result, null);
	
		return result;
	}

};


CinsImp._script_loaded('xtalk-parse-bnf');