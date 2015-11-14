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


function DataQueries() {}

/*****************************************************************************************
Constants
*/

DataQueries.FIND_MODE_WHOLE_WORDS = 'w';		// word / words
DataQueries.FIND_MODE_WORDS_BEGINNING = 'b';	// [normal]
DataQueries.FIND_MODE_WORDS_CONTAINING = 'c';	// chars / characters
DataQueries.FIND_MODE_WORD_PHRASE = 's';		// string
DataQueries.FIND_MODE_CHAR_PHRASE = 'p';		// whole



/*****************************************************************************************
Internal Find State
*/

DataQueries._find_mode = '';
DataQueries._find_search = '';
DataQueries._find_mark_state = null;
DataQueries._find_bkgnd_id = 0;
DataQueries._find_field_id = 0;
DataQueries._find_terms = null;
DataQueries._stop_card_id = 0;

DataQueries._find_state = null;
DataQueries._matches_this_invocation = 0;

DataQueries._fields = null;
DataQueries._field_index = 0;

DataQueries._field_content = '';
DataQueries._field_char_index = 0;
DataQueries._field_terms = null;
DataQueries._field_term_index = 0;

DataQueries._found_field = null;
DataQueries._found_offset = 0;
DataQueries._found_length = 0;
DataQueries._found_text = '';

DataQueries._found_line_begin = -1;
DataQueries._found_line_end = -1;

// will need to do a found line & end line computation here too
// but only cached and only if actually requested (an extra)



/*****************************************************************************************
Search Terms
A mechanism to encapsulate search terms and the corresponding match equivalent within 
the searched text content.
*/

/*
	Constructs a SearchTerm object representative of a search term, or word within the
	searched text content.
*/
DataQueries.SearchTerm = function(in_content, in_leading, in_trailing, in_offset)
{
	this._c = in_content;
	this._o = in_offset;
	this._l = in_leading;
	this._t = in_trailing;
}
var SearchTerm = DataQueries.SearchTerm;


/*
	text_to_terms()
	
	Splits the text into a series of whitespace-delimited SearchTerm objects,
	with offsets from the beginning of the supplied text.
	
	Leading and trailing punctuation is identified for each SearchTerm such that the
	word itself can be returned, and any punctuation considered as a separate (optional)
	step of any find process.
*/
SearchTerm.text_to_terms = function(in_text)
{
	/* define the regular expressions we need */
	var splitRegex = new RegExp('\\s+', 'g');
	var leadingRegex = new RegExp('^[^\\w\\s]+');
	var trailingRegex = new RegExp('[^\\w\\s]+$');
	
	/* prepare to split */
	var terms = [];
	var from_index = 0;
	var SearchTerm = DataQueries.SearchTerm;
	
	/* split the text into terms */
	for (var match = splitRegex.exec(in_text); ; match = splitRegex.exec(in_text))
	{
		if (match == null)
			var term = in_text.substr(from_index, in_text.length);
		else
			var term = in_text.substring(from_index, match.index);
		
		/* don't accumulate empty terms */
		if (term.length != 0)
		{
			/* identify the leading and trailing punctuation (if any) */
			var leading = 0;
			var matchPunc = leadingRegex.exec(term);
			if (matchPunc) leading = matchPunc[0].length;
		
			var trailing = 0;
			var matchPunc = trailingRegex.exec(term);
			if (matchPunc) trailing = matchPunc[0].length;
		
			/* accumulate the term */
			terms.push(new SearchTerm(term, leading, trailing, from_index));
		}
		
		if (!match) break;
		from_index = match.index + match[0].length;
	}
	
	/* return the term list */
	return terms;
}


/*
	Returns the offset to the search term's alpha-numeric component, relative to the 
	beginning of the original text content.
*/
SearchTerm.prototype.get_begin_word = function()
{
	return this._o + this._l;
}


/*
	Returns the offset to the search term relative to the beginning of the original
	text content.
*/
SearchTerm.prototype.get_begin_content = function()
{
	return this._o;
}


/*
	Returns only the primary alpha-numeric component of the search term
	(excluding any leading and trailing punctuation).
*/
SearchTerm.prototype.get_word = function()
{
	return this._c.substring(this._l, this._c.length - this._t);
}


/*
	Returns the length of any leading punctuation.
*/
SearchTerm.prototype.get_leading_length = function()
{
	return this._l;
}


/*
	Returns any leading punctuation.
*/
SearchTerm.prototype.get_leading = function()
{
	return this._c.substr(0, this._l);
}


/*
	Returns the entire term content, including any leading and trailing punctuation.
*/
SearchTerm.prototype.get_content = function()
{
	return this._c;
}


SearchTerm.prototype.get_length = function()
{
	return this._c.length;
}


/*
	Returns any trailing punctuation.
*/
SearchTerm.prototype.get_trailing = function(in_match_offset, in_match_length)
{
	return this._c.substr(this._c.length - this._t);
}



/*****************************************************************************************
Find Machinery
The core of the client-side implementation of the "find" command.
*/


// field find mechanism will need to be client-side and server-side
// card find mechanism will need to be only server-side



/*

*/
DataQueries._get_next_card = function()
{
// TEMPORARILY FOR DEBUGGING LOCAL CARD FIND FUNCTIONALITY - DISABLE FURTHER CARD SEARCHES:
alert('Going next card, ie. stopping search');
DataQueries._find_state = DataQueries._find_finished;
return;

	/* check if we're currently on the stop card,
	ie. the first card on which we started this search */
	if (View.current.get_card().get_attr('id') == DataQueries._stop_card_id)
	{
		DataQueries._find_state = DataQueries._find_finished;
		return;
	}
	
	/* request next searchable card */
	// must be requested from server, via current card's stack
	
	
	/* check for end of search */
	if (View.current.get_card().get_attr('id') == DataQueries._stop_card_id)
	{
		DataQueries._matches_this_invocation = 0;
		DataQueries._find_state = DataQueries._find_finished;
		return;
	}

	DataQueries._find_state = DataQueries.reset_search;
}


// probably invoked at the completion of each invocation-- to be checked
// might be a good place to provoke display the result?
DataQueries._find_finished = function()
{
// ??
//alert('finished find: ' + DataQueries._found_text + ', ' + DataQueries._found_offset + ', ' + DataQueries._found_length);
	DataQueries._find_state = null;
	
	if (DataQueries._found_field)
	{
		//DataQueries._found_field.focus();
		DataQueries._found_field.set_selection(DataQueries._found_offset, DataQueries._found_length);
	}
	else
	{
		var alert = new Alert();
		alert.title = "Find";
		alert.prompt = Util.string("Can't find \"^0\".", DataQueries._find_search);
		alert.button1_label = 'OK';
		alert.show();
	}
}


/*
	Returns a list of all the searchable fields (card and background) on the current card.
	
	Searchable fields are only those for which the Don't Search property is false
	and the Shared Text property is false.
*/
DataQueries._get_searchable_fields = function()
{
	var searchable = [];
	View.current.get_card().get_searchable_fields(searchable);
	View.current.get_bkgnd().get_searchable_fields(searchable);
	return searchable;
}


/*
	Forgets any match from the last search operation.
	
	This must be called when the user clicks or does anything on the current card,
	or navigates to a different card, and at the beginning of each "find" invocation.
*/
DataQueries.clear_match = function()
{
	DataQueries._found_field = null;
	DataQueries._found_offset = 0;
	DataQueries._found_length = 0;
	DataQueries._found_text = '';

	DataQueries._found_line_begin = -1;
	DataQueries._found_line_end = -1;
}


DataQueries._set_initial_state = function()
{
	if (DataQueries._fields.length == 0)
		DataQueries._find_state = DataQueries._get_next_card;
	else if (DataQueries._find_mode == DataQueries.FIND_MODE_WORD_PHRASE)
		DataQueries._find_state = DataQueries._find_term_phrase;
	else if (DataQueries._find_mode == DataQueries.FIND_MODE_CHAR_PHRASE)
		DataQueries._find_state = DataQueries._find_char_phrase;
	else
		DataQueries._find_state = DataQueries._find_first_term;
}


/*
	Initialises the internal state variables for a new search of the current card,
	(but does not delete the last search in case it is to be repeated).
*/
DataQueries.reset_search = function()
{
	/* reset field list, position, offset and content */
	DataQueries._fields = DataQueries._get_searchable_fields();
	DataQueries._field_index = 0;
	
	DataQueries._field_content = '';
	DataQueries._field_char_index = 0;
	DataQueries._field_terms = null;
	DataQueries._field_term_index = 0;
	
	DataQueries._matches_this_invocation = 0;
	
	/* clear any existing match */
	DataQueries.clear_match();
	
	/* check if there are actually any searchable fields on the current card */
	if (DataQueries._fields.length == 0) return;
	
	/* grab the content of the first searchable field */
	DataQueries._field_index = -1;
	DataQueries._prepare_next_field();
};




DataQueries._match_leading = function(in_search_leading, in_content, in_begin_at)
{
	var matched = 0;
	for (var s = in_search_leading.length - 1, c = in_begin_at - 1; 
			s >= 0 && c >= 0; 
			s--, c--)
	{
		var search_char = in_search_leading.substr(s, 1);
		var content_char = in_content.substr(c, 1);
		if (search_char == content_char) matched++;
		else break;
	}
	if (in_search_leading.length > matched) return false;
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
	if (in_search_trailing.length > matched) return false;
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
	if (search_term_length > in_content_term.get_word().length) return null;
	if (Util.strings_compare(in_search_term.get_word(),
		in_content_term.get_word().substr(0, search_term_length) ) != 0) return null;
	
	/* found matching words, try and match leading and trailing punctuation */
	var leading = DataQueries._match_leading(in_search_term.get_leading(), 
										     in_content_term.get_content(),
									         in_content_term.get_leading_length());
	if (leading === false) return null;
	var trailing = DataQueries._match_trailing(in_search_term.get_trailing(), 
								               in_content_term.get_content(), 
								               search_term_length + in_content_term.get_leading_length());
	if (trailing === false) return null;
	
	return ({
		begin: in_content_term.get_begin_word() - leading,
		length: leading + search_term_length + trailing
		//end:   in_content_term.get_begin() + search_term_length + trailing
	});
};


/*
	FIND_MODE_WORDS_CONTAINING
	Find words that contain the search terms.
*/
DataQueries._match_term_contains = function(in_search_term, in_content_term)
{
	/* compare the search term and content term's words */
	var search_term_length = in_search_term.get_word().length;
	var search_regex = new RegExp( Util.regex_escape(in_search_term.get_word()), 'gi' );
	var match = search_regex.exec( in_content_term.get_content() );
	if (match === null) return null;
	
	/* found matching word, try and match leading and trailing punctuation */
	var leading = DataQueries._match_leading(in_search_term.get_leading(), 
										     in_content_term.get_content(),
									         match.index);
	if (leading === false) return null;
	var trailing = DataQueries._match_trailing(in_search_term.get_trailing(), 
								               in_content_term.get_content(), 
								               match.index + match[0].length);
	if (trailing === false) return null;
	
	return ({
		begin: in_content_term.get_begin_content() + match.index - leading,
		length: leading + search_term_length + trailing
		//length: leading + search_term_length + trailing
	});
	/*var match_end = match.index + match[0].length;
	return ({
		begin: 	in_content_term.get_begin() + 
			DataQueries._match_leading(in_search_term.get_leading(), in_content_term.get_content(), match.index),
		end:	in_content_term.get_begin() + match_end +
			DataQueries._match_trailing(in_search_term.get_trailing(), in_content_term.get_content(), match_end)
	});*/
};


/*
	FIND_MODE_WHOLE_WORDS (default)
	Finds words that exactly match with the search terms.
*/
DataQueries._match_term_whole = function(in_search_term, in_content_term)
{
	/* compare the search term and content term's words */
	if (Util.strings_compare(in_search_term.get_word(), in_content_term.get_word() ) != 0) return null;
	
	/* found matching words, try and match leading and trailing punctuation */
	var search_term_length = in_search_term.get_word().length;
	var leading = DataQueries._match_leading(in_search_term.get_leading(), 
										     in_content_term.get_content(),
									         in_content_term.get_leading_length());
	if (leading === false) return null;
	var trailing = DataQueries._match_trailing(in_search_term.get_trailing(), 
								               in_content_term.get_content(), 
								               search_term_length + in_content_term.get_leading_length());
	if (trailing === false) return null;
	
	return ({
		begin: in_content_term.get_begin_word() - leading,
		length: leading + search_term_length + trailing
		//length: leading + search_term_length + trailing
	});
	//var match_end = in_search_term.get_word().length;
	//return ({
	//	begin: 	in_content_term.get_begin() - 
	//		DataQueries._match_leading(in_search_term.get_leading(), in_content_term.get_content(),
//									   in_content_term.get_leading_length()),
		/*end:	in_content_term.get_begin() + match_end +
			DataQueries._match_trailing(in_search_term.get_trailing(), in_content_term.get_content(), match_end)*/
	//});
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
			DataQueries._field_terms = DataQueries.SearchTerm.text_to_terms( DataQueries._field_content );
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
				
				DataQueries._save_match(match.begin, match.length);	
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
			field_terms = DataQueries.SearchTerm.text_to_terms(field_terms);
			//var field_terms = DataQueries._termize(field_terms); // optimisation !; content could be processed once and cached ??
			
			/* find term anywhere in field */
			var match = null;
			for (var field_term_index = 0;
				field_term_index < field_terms.length;
				field_term_index++)
			{
				var term = field_terms[field_term_index];
				switch (DataQueries._find_mode)
				{
				case DataQueries.FIND_MODE_WORDS_BEGINNING:
					match = DataQueries._match_term_begins(find_term, term);
					break;
				case DataQueries.FIND_MODE_WORDS_CONTAINING:
					match = DataQueries._match_term_contains(find_term, term);
					break;
				case DataQueries.FIND_MODE_WHOLE_WORDS:
					match = DataQueries._match_term_whole(find_term, term);
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
		DataQueries._find_state = DataQueries._find_finished;
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
			/* attempt to match search terms with consecutive content terms at this location */
			var matching_words = 0, match_offset = 0, match_length = 0;
			for (var find_term_index = 0;
				find_term_index < DataQueries._find_terms.length &&
				term_index + find_term_index < DataQueries._field_terms.length;
				find_term_index++)
			{
				var find_term = DataQueries._find_terms[find_term_index];
				var field_term = DataQueries._field_terms[term_index + find_term_index];

				match = DataQueries._match_term_whole(find_term, field_term);
				if (!match) break;
				
				if (find_term_index == 0) match_offset = match.begin;
				if (find_term_index == DataQueries._find_terms.length - 1)
					match_length = match.begin + match.length - match_offset;
				
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
		DataQueries._find_state = DataQueries._find_finished;
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
		search_regex.lastIndex = DataQueries._field_char_index;
		var match = search_regex.exec( DataQueries._field_content );
		if (match)
		{
			matched = true;
			DataQueries._field_char_index = search_regex.lastIndex;
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
		DataQueries._find_state = DataQueries._find_finished;
	}
}






DataQueries._find_step = function()
{
	if (!DataQueries._find_state) return;
	DataQueries._find_state();
	
	window.setTimeout(DataQueries._find_step, 0);
}



/*
	The API of the "find" command.
*/
DataQueries.find = function(in_mode, in_text, in_mark_state, in_field, in_bkgnd)
{
	// process on current card first
	// then send to server to get next card, and,
	// bring it back prior to initiating card search locally again
	
	/* decode a couple of input parameters */
	var field_id = (in_field ? in_field.get_attr('id') : 0);
	var bkgnd_id = (in_bkgnd ? in_bkgnd.get_attr('id') : 0);
	if (field_id && !bkgnd_id) bkgnd_id = in_field.get_attr('bkgnd_id');
	
	/* is this invocation of "find" different to the last? */
	if (in_mode !== DataQueries._find_mode ||
		in_text !== DataQueries._find_search ||
		in_mark_state !== DataQueries._find_mark_state ||
		field_id !== DataQueries._find_field_id ||
		bkgnd_id !== DataQueries._find_bkgnd_id)
	{
		/* initialise a new search */
		DataQueries._find_mode = in_mode;
		DataQueries._find_search = in_text;
		DataQueries._find_mark_state = in_mark_state;
		DataQueries._find_field_id = field_id;
		DataQueries._find_bkgnd_id = bkgnd_id;
		DataQueries._stop_card_id = View.current.get_card().get_attr('id');
		DataQueries._find_terms = DataQueries.SearchTerm.text_to_terms(in_text);
		
		DataQueries.reset_search();
	}
	
	/* initialise this invocation */
	DataQueries.clear_match();
	
	/* begin the find process */
	DataQueries._set_initial_state();
	window.setTimeout(DataQueries._find_step, 0);
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

