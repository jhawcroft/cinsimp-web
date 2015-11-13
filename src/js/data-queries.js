/*
CinsImp
Data Queries: Find, Mark, Sort

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

// could extend Stack

function DataQueries() {}

DataQueries.FIND_MODE_WHOLE_WORDS = '';
DataQueries.FIND_MODE_WORDS_BEGINNING = '';
DataQueries.FIND_MODE_WORDS_CONTAINING = '';
DataQueries.FIND_MODE_WORD_PHRASE = '';
DataQueries.FIND_MODE_CHAR_PHRASE = '';

DataQueries._FIND_UNINITED = 0;
DataQueries._FIND_FINISHED = 1;
DataQueries._FIND_GET_NEXT_CARD = 2;
DataQueries._FIND_WORD_PHRASE = 3;
DataQueries._FIND_CHAR_PHRASE = 4;
DataQueries._FIND_WORDS_FIRST = 5;

DataQueries._find_state = null;



/*
	Constructs a search term with the specified content, which is the complete content
	including leading and trailing punctuation.
	The offset is the offset from the start of the containing content to the beginning of
	the supplied term content.
*/
DataQueries.SearchTerm = function(in_content, in_offset)
{
	this._c = in_content;
	this._o = in_offset;
	this._l = 0;
	this._t = 0;
	this._init();
}
var SearchTerm = DataQueries.SearchTerm;


SearchTerm.prototype._init = function()
{
	/* determine the length of leading and trailing punctuation */
	
}


SearchTerm.prototype.get_begin = function()
{
	return this._o;
}


SearchTerm.prototype.get_leading_length = function()
{
	return this._l;
}


SearchTerm.prototype.get_content = function()
{
	return this._c;
}


SearchTerm.prototype.get_word = function()
{
	return this._c.substring(this._l, this._c.length - this._t);
}


SearchTerm.prototype.get_leading = function()
{
	return this._c.substr(0, this._l);
}


SearchTerm.prototype.get_trailing = function(in_match_offset, in_match_length)
{
	return this._c.substr(this._c.length - this._t);
}



DataQueries._get_next_card = function()
{
	/* check if we're currently on the stop card,
	ie. the first card on which we started this search */
	if (View.current.get_card().get_attr('id') == DataQueries._stop_card_id)
	{
		DataQueries._find_state = DataQueries._finish;
		return;
	}
	
	/* request next searchable card */
	// must be requested from server, via current card's stack
	
	
	/* check for end of search */
	if (View.current.get_card().get_attr('id') == DataQueries._stop_card_id)
	{
		DataQueries._matches_this_invocation = 0;
		DataQueries._find_state = DataQueries._finish;
		return;
	}

	DataQueries._find_state = DataQueries._reset_search;
}



DataQueries._finish = function()
{
// ??
}


// field find mechanism will need to be client-side and server-side
// card find mechanism will need to be only server-side


/*
	_wordize()
	
	Split the input into a series of whitespace-delimited words, with offsets
	from the beginning of the supplied text.
	Also separates leading and trailing punctuation from the word itself in such a way
	that the punctuation can be matched separately and independently of the word matching.
*/
DataQueries._termize = function(in_content)
{
// each term should be the fulltext of the term including leading and trailing punctuation,
// along with an offset to the alphabetical bit and a length of that bit, and an offset to the term itself

// use SearchTerm below
}



DataQueries._get_searchable_fields = function()
{
	var searchable = [];
	View.current.get_card().get_searchable_fields(searchable);
	View.current.get_bkgnd().get_searchable_fields(searchable);
	return searchable;
}


DataQueries._reset_search = function()
{
	/* reset field list, position, offset and content */
	DataQueries._fields = DataQueries._get_searchable_fields();
	DataQueries._field_index = 0;
	
	DataQueries._field_content = '';
	DataQueries._field_char_index = 0;
	DataQueries._field_terms = null;
	DataQueries._field_term_index = 0;
	
	DataQueries._found_text = '';
	
	DataQueries._find_search = '';
	DataQueries._find_terms = null;
	
	DataQueries._matches_this_invocation = 0;
	
	/* check if there are actually any searchable fields on the current card */
	if (DataQueries._fields.length == 0)
	{
		DataQueries._find_state = DataQueries._FIND_GET_NEXT_CARD;
		return;
	}
	
	/* grab the content of the first searchable field */
	DataQueries._field_content = DataQueries._fields[0].searchable_text();
	
	/* pre-process the field content to facilitate searching;
	pre-processing is appropriate to the search mode */
	if (DataQueries._find_mode != DataQueries.FIND_MODE_CHAR_PHRASE)
		DataQueries._wordize();
	
	/* set the initial state appropriate to the find mode */
	if (DataQueries._find_mode == DataQueries.FIND_MODE_WORD_PHRASE)
		DataQueries._find_state = DataQueries._FIND_WORD_PHRASE;
	else if (DataQueries._find_mode == DataQueries.FIND_MODE_CHAR_PHRASE)
		DataQueries._find_state = DataQueries._FIND_CHAR_PHRASE;
	else
		DataQueries._find_state = DataQueries._FIND_WORDS_FIRST;
};




DataQueries._match_leading = function(in_search_leading, in_content, in_begin_at)
{
	var matched = 0;
	for (var s = in_search_leading.length - 1, c = in_begin_at; 
			s >= 0 && c >= 0; 
			s--, c--)
	{
		var search_char = in_search_leading.substr(s, 1);
		var content_char = in_content.substr(c, 1);
		if (search_char == content_char) matched++;
		else break;
	}
	return matched;
};


DataQueries._match_trailing = function(in_search_trailing, in_content, in_begin_at)
{
	var matched = 0;
	for (var s = 0, c = in_begin_at; 
			s < in_search_trailing.length && c < in_content.length; 
			s++, c++)
	{
		var search_char = in_search_trailing.substr(s, 1);
		var content_char = in_content.substr(c, 1);
		if (search_char == content_char) matched++;
		else break;
	}
	return matched;
};




/*
	FIND_MODE_WORDS_BEGINNING (default)
	Finds words that begin with the search terms.
*/
DataQueries._match_term_begins = function(in_search_term, in_content_term)
{
	/* compare the search term and content term's words */
	var search_term_length = in_search_term.get_word().length;
	if (search_term_length > in_content_word.get_word().length) return null;
	if (in_search_term.get_word().localeCompare( 
		in_content_word.get_word().substr(0, search_term_length) ) != 0) return null;
	
	/* found matching words, try and match leading and trailing punctuation */
	var match_end = in_content_term.get_leading_length() + search_term_length;
	return ({
		begin: in_content_term.get_begin() + 
				DataQueries._match_leading(in_search_term.get_leading(), 
										   in_content_term.get_content(),
									       in_content_term.get_leading_length()),
		end:   in_content_term.get_begin() + match_end +
			DataQueries._match_trailing(in_search_term.get_trailing(), 
								        in_content_term.get_content(), 
								        match_end)
	});
};


/*
	FIND_MODE_WORDS_CONTAINING
	Find words that contain the search terms.
*/
DataQueries._match_term_contains = function(in_search_term, in_content_term)
{
	/* compare the search term and content term's words */
	var search_regex = new RegExp( Util.regex_escape(in_search_term.get_word()), 'gi' );
	var match = search_regex.exec( in_content_term.get_content() );
	if (match === null) return null;
	
	/* found matching word, try and match leading and trailing punctuation */
	var match_end = match.index + match[0].length;
	return ({
		begin: 	in_content_term.get_begin() + 
			DataQueries._match_leading(in_search_term.get_leading(), in_content_term.get_content(), match.index),
		end:	in_content_term.get_begin() + match_end +
			DataQueries._match_trailing(in_search_term.get_trailing(), in_content_term.get_content(), match_end)
	});
};


/*
	FIND_MODE_WHOLE_WORDS (default)
	Finds words that exactly match with the search terms.
*/
DataQueries._match_term_whole = function(in_search_term, in_content_term)
{
	/* compare the search term and content term's words */
	if (in_search_term.get_word().localeCompare( in_content_term.get_word() ) != 0) return null;
	
	/* found matching words, try and match leading and trailing punctuation */
	var match_end = in_content_term.get_leading_length() + in_search_term.get_word().length;
	return ({
		begin: 	in_content_term.get_begin() + 
			DataQueries._match_leading(in_search_term.get_leading(), in_content_term.get_content(),
									   in_content_term.get_leading_length()),
		end:	in_content_term.get_begin() + match_end +
			DataQueries._match_trailing(in_search_term.get_trailing(), in_content_term.get_content(), match_end)
	});
};



/*
	Prepares the next field on the current card to be searched.
*/
DataQueries._prepare_next_field = function()
{
	DataQueries._field_index++;
	if (DataQueries._field_index < DataQueries._fields.length)
	{	
		/* grab the content of the next field */
		DataQueries._field_content = DataQueries._fields[DataQueries._field_index].get_searchable_text();
		DataQueries._field_char_index = 0;
		if (DataQueries._find_terms)
		{
			DataQueries._field_terms = DataQueries._termize(DataQueries._field_content);
			DataQueries._field_term_index = 0;
		}
	}
}


/*
	Stores information about the current match.
*/
DataQueries._save_match = function(in_offset, in_length)
{
	DataQueries._found_offset = in_offset;
	DataQueries._found_length = in_length;
	DataQueries._found_field = DataQueries._fields[DataQueries._field_index];
	DataQueries._found_text = DataQueries._field_content.substr(in_offset, in_length);
}



/*
	Find the first search term in any of the card's fields.
*/
DataQueries._find_first_term = function()
{
	var matched = false;
	
	while (DataQueries._field_index < DataQueries._fields.length)
	{
		/* continue search of field in which a match was previously found
		from the end of the last match */
		for (var term_index = DataQueries._field_term_index;
			term_index < DataQueries._field_terms.length;
			term_index++)
		{
			var term = DataQueries._field_terms[term_index];
			var match = null;
			switch (DataQueries._find_mode)
			{
			case DataQueries.FIND_MODE_WORDS_BEGINNING:
				match = DataQueries._match_term_begins(DataQueries._find_terms[0], term);
				break;
			case DataQueries.FIND_MODE_WORDS_CONTAINING:
				match = DataQueries._match_term_contains(DataQueries._find_terms[0], term);
				break;
			case DataQueries.FIND_MODE_WHOLE_WORDS:
				match = DataQueries._match_term_whole(DataQueries._find_terms[0], term);
				break;
			}
			if (match)
			{
				matched = true;
				DataQueries._field_term_index = term_index + 1;
				
				DataQueries._save_match(match.begin, match.end - match.begin);	
				break;
			}
		}
		if (matched) break;
		
		/* search the next field (if any) */
		DataQueries._prepare_next_field();
	}
	
	if (matched) DataQueries._find_state = DataQueries._find_other_terms;
	else DataQueries._find_state = DataQueries._get_next_card;
}


/*
	Find the second and subsequent search terms in any of the card's fields.
*/
DataQueries._find_other_terms = function()
{
	var matched_a_term = false;
	var matched_term_count = 0;
	
	/* consider second and subsequent terms */
	for (var find_term_index = 1;
		find_term_index < DataQueries._find_terms.length;
		find_term_index++)
	{
		var find_term = DataQueries._find_terms[find_term_index];
		
		/* search all fields for this term */
		matched_a_term = false;
		for (var field_index = 0;
			field_index < DataQueries._fields.length;
			field_index++)
		{
			var field_terms = DataQueries._fields[field_index].get_searchable_text();
			var field_terms = DataQueries._termize(field_terms); // optimisation !; content could be processed once and cached ??
			
			/* find term anywhere in field */
			var match = null;
			for (var field_term_index = 0;
				field_term_index < field_terms.length;
				field_term_index++)
			{
				switch (DataQueries._find_mode)
				{
				case DataQueries.FIND_MODE_WORDS_BEGINNING:
					match = DataQueries._match_term_begins(DataQueries._find_terms[0], term);
					break;
				case DataQueries.FIND_MODE_WORDS_CONTAINING:
					match = DataQueries._match_term_contains(DataQueries._find_terms[0], term);
					break;
				case DataQueries.FIND_MODE_WHOLE_WORDS:
					match = DataQueries._match_term_whole(DataQueries._find_terms[0], term);
					break;
				}
				if (match)
				{
					matched_a_term = true;
					break;
				}
			}
			if (matched_a_term) break;
		}
		
		if (matched_a_term) matched_term_count++;
	}
	
	if (matched_term_count == DataQueries._find_terms.length - 1)
	{
		DataQueries._matches_this_invocation++;
		DataQueries._find_state = DataQueries._finish;
	}
	else
		DataQueries._find_state = DataQueries._get_next_card;
};




/*
	Find the whole word phrase in any of the card's fields.
	FIND_MODE_WORD_PHRASE
*/
DataQueries._find_term_phrase = function()
{
	var matched = false;
	while (DataQueries._field_index < DataQueries._fields.length)
	{
		/* continue search of field in which a match was previously found */
		for (var term_index = DataQueries._field_term_index;
			term_index < DataQueries._field_terms.length;
			term_index++)
		{
			var field_term = DataQueries._field_terms[term_index];
			
			/* attempt to match search terms with consecutive content terms at this location */
			var matching_words = 0, match_offset = 0, match_length = 0;
			for (var find_term_index = 0;
				find_term_index < DataQueries._find_terms.length &&
				term_index + find_term_index < DataQueries._field_terms.length;
				find_term_index)
			{
				var find_term = DataQueries._find_terms[find_term_index];

				match = DataQueries._match_term_whole(find_term, field_term);
				if (!match) break;
				
				if (find_term_index == 0) match_offset = match.begin;
				if (find_term_index == DataQueries._find_terms.length - 1)
					match_length = match.end - match_offset;
				
				matching_words++;
			}
			
			if (matching_words == DataQueries._find_terms.length)
			{
				matched = true;
				DataQueries._field_term_index = term_index + 1;
				
				DataQueries._save_match(match_offset, match_length);
				break;
			}
		}
		if (matched) break;
		
		/* search the next field (if any) */
		DataQueries._prepare_next_field();
	}
	
	if (!matched)
		DataQueries._find_state = DataQueries._get_next_card;
	else
	{
		DataQueries._matches_this_invocation++;
		DataQueries._find_state = DataQueries._finish;
	}
};



/*
	Find the character phrase in any of the card's fields.
	FIND_MODE_CHAR_PHRASE
*/
DataQueries._find_char_phrase = function()
{
	var search_regex = new RegExp( Util.regex_escape(DataQueries._find_search), 'gi' );
	
	var matched = false;
	while (DataQueries._field_index < DataQueries._fields.length)
	{
		/* continue search of field in which a match was previously found */
		search_regex.lastIndex = DataQueries._field_offset;
		var match = search_regex.exec( DataQueries._field_content );
		if (match)
		{
			matched = true;
			DataQueries._field_offset = search_regex.lastIndex;
			DataQueries._save_match(match.index, DataQueries._find_search.length);
		}
		if (matched) break;
		
		/* search the next field (if any) */
		DataQueries._prepare_next_field();
	}
	
	if (!matched)
		DataQueries._find_state = DataQueries._get_next_card;
	else
	{
		DataQueries._matches_this_invocation++;
		DataQueries._find_state = DataQueries._finish;
	}
}




DataQueries._find_again = function()
{
	DataQueries._found_text = '';
	if (DataQueries._find_state) DataQueries._find_state();
}


DataQueries._find_step = function()
{
	if (!DataQueries._find_state) return false;
	DataQueries._find_again();
	return true;
}




DataQueries.find = function(in_mode, in_text, in_mark_state, in_field, in_bkgnd)
{
	// process on current card first
	// then send to server to get next card, and,
	// bring it back prior to initiating card search locally again
	
	
}


DataQueries.mark_by_find = function(in_mode, in_text, in_mark_state, in_field, in_bkgnd)
{
	// send to the server
	
	
}


DataQueries.mark_by_expr = function(in_mark_state, in_bkgnd, in_mark_expr)
{
	// send to server 
	// (eventually will support mark_expr
	// on the server but not initially)
	
	
}


DataQueries.sort = function(in_mark_state, in_bkgnd, in_direction, in_key_expr)
{
	// send to the server
	// (eventually will simply send the expression
	// initially will only support sending a single field as the key expression)
	
}



CinsImp._script_loaded('data-queries');

