/*
CinsImp
CinsTalk Virtual Machine Chunks

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
The language support for chunk expressions, such as:

	word 1 to 5 of ...
	the first line of ...
	item 7 of ...
	any character of ...


Dependencies
------------

xtalk.js ?

*/


// this is a disgusting implementation and could use much cleaning and optimisation!  - Josh


Xtalk.VM.TChunk = function(in_type, in_from, in_to, in_subject)
{
	this.type = 'Chunk';
	this.kind = in_type;
	this.range_from = in_from;
	this.range_to = in_to;
	this.subject = in_subject;
	
	// **TODO validation of from and to?
};
var TChunk = Xtalk.VM.TChunk;


Xtalk.VM.TChunk.prototype.get_type = function() { return this.type; }

Xtalk.VM.TChunk.prototype.is_readable = function() { return true; }


Xtalk.VM.TChunk.prototype.resolve = function()
{
	return this;
}


Xtalk.VM.TChunk.prototype.toText = function()
{
	return this.toString()._value;
}


TChunk._line_offset = function(in_text, in_line)
{
	if (in_line == 1) return 0;
	var offset = 0;
	for (var c = 1; c < in_line; c++)
	{
		var off = in_text.indexOf("\n", offset);
		if (off < 0) return -1;
		offset = off + 1;
	}
	return offset;
}


TChunk._word_offset = function(in_text, in_word, in_right)
{
	if (in_word == 1) return 0;
	var offset = 0;
	var last_match_len = 0;
	var word_boundary = /[\s]+/;
	for (var c = 1; c < in_word; c++)
	{
		var off = Util.regex_index_of(in_text, word_boundary, offset);
		if (off < 0) return -1;
		var match = word_boundary.exec(in_text.substr(off))[0];
		last_match_len = match.length;
		offset = off + last_match_len;
	}
	if (!in_right) offset = offset - last_match_len + 1;
	return offset;
}


TChunk._word_count = function(in_subject)
{
	var count = 1;
	var offset = 0;
	var word_boundary = /[\s]+/;
	while (offset >= 0)
	{
		var off = Util.regex_index_of(in_subject, word_boundary, offset);
		if (off < 0) return count;
		var match = word_boundary.exec(in_subject.substr(off))[0];
		offset = off + match.length;
		count++;
	}
	return count;
}


TChunk._item_offset = function(in_text, in_word, in_right)
{
	if (in_word == 1) return 0;
	var offset = 0;
	var item_delim = Xtalk.VM._item_delimiter;
	for (var c = 1; c < in_word; c++)
	{
		var off = in_text.indexOf(item_delim, offset);
		if (off < 0) return -1;
		offset = off + item_delim.length;
	}
	if (!in_right) offset = offset - item_delim.length + 1;
	return offset;
}


TChunk._item_count = function(in_subject)
{
	var count = 1;
	var offset = 0;
	var item_delim = Xtalk.VM._item_delimiter;
	while (offset >= 0)
	{
		var off = in_subject.indexOf(item_delim, offset);
		if (off < 0) return count;
		offset = off + item_delim.length;
		count++;
	}
	return count;
}


TChunk._line_count = function(in_subject)
{
	var count = 1;
	var offset = 0;
	var word_boundary = /[\n\r]/;
	while (offset >= 0)
	{
		var off = Util.regex_index_of(in_subject, word_boundary, offset);
		if (off < 0) return count;
		var match = word_boundary.exec(in_subject.substr(off))[0];
		offset = off + match.length;
		count++;
	}
	return count;
}


TChunk.count = function(in_type, in_subject)
{
	switch (in_type)
	{
	case 'chars':
		return in_subject.length;
	case 'words':
		return TChunk._word_count(in_subject);
	case 'lines':
		return TChunk._line_count(in_subject);
	case 'items':
		return TChunk._item_count(in_subject);
	}
}



TChunk._calculate_char_range = function(in_chunk, in_subject)
{
	var range = { from: 0, to: 0, length: 0 };
	
	
	
	switch (in_chunk.kind)
	{
	case 'char':
		range.from = in_chunk.range_from - 1;
		if (in_chunk.range_to !== null)
			range.to = in_chunk.range_to - 1;
		else
			range.to = range.from;
		range.length = range.to - range.from + 1;
		break;
		
	case 'line':
	{
		//example: answer line 1 of ("apples" & newline & "oranges" & newline & "peaches")
		in_subject = in_subject.replace("\r", "\n");
		range.from = TChunk._line_offset(in_subject, in_chunk.range_from);
		if (range.from < 0) range.from = in_subject.length;
		if (in_chunk.range_to !== null)
			range.to = TChunk._line_offset(in_subject, in_chunk.range_to + 1);
		else
			range.to = TChunk._line_offset(in_subject, in_chunk.range_from + 1);
		if (range.to >= 0) range.to -= 2;
		else range.to = in_subject.length - 1;
		range.length = range.to - range.from + 1;
		break;
	}
		
	case 'word':
	{
		//example: answer word 1 of ("apples  " & newline & "oranges\t peaches")
		range.from = TChunk._word_offset(in_subject, in_chunk.range_from, true);
		if (range.from < 0) range.from = in_subject.length;
		if (in_chunk.range_to !== null)
			range.to = TChunk._word_offset(in_subject, in_chunk.range_to + 1, false);
		else
			range.to = TChunk._word_offset(in_subject, in_chunk.range_from + 1, false);
		if (range.to >= 0) range.to -= 2;
		else range.to = in_subject.length - 1;
		range.length = range.to - range.from + 1;
		break;
	}
		
	case 'item':
	{
		range.from = TChunk._item_offset(in_subject, in_chunk.range_from, true);
		if (range.from < 0) range.from = in_subject.length;
		if (in_chunk.range_to !== null)
			range.to = TChunk._item_offset(in_subject, in_chunk.range_to + 1, false);
		else
			range.to = TChunk._item_offset(in_subject, in_chunk.range_from + 1, false);
		if (range.to >= 0) range.to -= 2;
		else range.to = in_subject.length - 1;
		range.length = range.to - range.from + 1;
		break;
	}
	}
	
	if (range.length < 0)
	{
		range.length = 0;
		range.to = range.from - 1;
	}
	
	return range;
}


Xtalk.VM.TChunk.prototype.toString = function()
{
	/* first resolve the subject to a string */
	var subject = this.subject.toString().toValue();
	
	/* now access the specific chunk */
	var range = TChunk._calculate_char_range(this, subject);
	
	/* return the specific substring */
	return new Xtalk.VM.TString(subject.substr(range.from, range.length));
}


// non-recursive call - as this is already recursive.  
// just ensure that on our level, we change the content to make sure the chunk exists prior to write
// use this.subject.write_content() if necessary to modify the content prior to the actual write
Xtalk.VM.TChunk.prototype.ensure_chunk_exists = function()
{
	
}


Xtalk.VM.TChunk.range_of_range = function(in_range1, in_range2)
{
	var range = 
	{
		from: in_range2.from + in_range1.from,
		to: in_range2.from + in_range1.to,
		length: 0
	};
	
	if (range.from > range2.to)
		range = 
		{
			from: in_range2.to,
			to: in_range2.to,
			length: 0
		};
	
	range.length = range.to - range.from;
	
	return range;
}


Xtalk.VM.TChunk.prototype.write_content = function(in_content, in_mode, in_range)
{
	/* check the subject is actually writable */
	if (this.subject === null || !this.subject.write_content)
		Xtalk.VM._error("Expected container here.");
		
	/* convert the content to a string */
	in_content = in_content.resolve().toString();
	
	/* ensure the specific chunk is available to write; create it if not */
	this.ensure_chunk_exists();
	
	/* resolve the subject to a string */
	var subject = this.subject.resolve().toString().toValue();
	
	/* now access the specific chunk */
	var range = TChunk._calculate_char_range(this, subject);
	
	/* merge the ranges */
	if (in_range)
		range = Xtalk.VM.TChunk.range_of_range(in_range, range);
	
	/* adjust the range based on the mode */
	switch (in_mode)
	{
	case 'after':
		range.from = range.to;
		range.to--;
		range.length = 0;
		break;
	case 'before':
		range.to = range.from - 1;
		range.length = 0;
		break;
	}
	
	/* perform the actual write */
	this.subject.write_content(in_content, 'into', range);
}




CinsImp._script_loaded('xtalk-vm-chunk');