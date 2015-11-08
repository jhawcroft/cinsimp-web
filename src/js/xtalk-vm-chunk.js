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


TChunk._word_offset = function(in_text, in_word)
{

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
		
		break;
	}
		
	case 'item':
	{
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



CinsImp._script_loaded('xtalk-vm-chunk');