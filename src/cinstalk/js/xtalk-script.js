/*
CinsImp
CinsTalk Script Utilities

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

xtalk.js

*/

Xtalk.Script = {

/*****************************************************************************************
Constants
*/

	HANDLER_COMMAND: 1,
	HANDLER_FUNCTION: 2,


	// can eventually include a script auto-formatter in here //


/*****************************************************************************************
Entry
*/

	/*
		Generates an index of the supplied CinsTalk script's handlers, including
		name, offset, length,  first line number and a list of any named parameters.
		
		If there is a parse problem for a recognised handler, an error message is
		also supplied to be reported when the handler is accessed at runtime.
	*/
	index: function(in_script)
	{
		var index = [];
		
		var lines = in_script.split("\n");
		var offset = 0;
		var line_raw;
		var handler = null;
		
		for (var i = 0; i < lines.length; i++, offset += (line_raw.length + 1))
		{
			line_raw = lines[i];
			var line = line_raw.trim();
			var type;
			if ( (line.substr(0, 2).toLowerCase() == 'on') && 
				Xtalk.Lexer._is_space(line.substr(2, 1)) )
				type = this.HANDLER_COMMAND;
			else if ( (line.substr(0, 8).toLowerCase() == 'function') && 
				Xtalk.Lexer._is_space(line.substr(8, 1)) )
				type = this.HANDLER_FUNCTION;
			else if ( (line.substr(0, 3).toLowerCase() == 'end') && 
				Xtalk.Lexer._is_space(line.substr(3, 1)) &&
				handler && (!handler.error) )
			{
				if (line.substr(3).trim().toLowerCase() != handler.name.toLowerCase())
					handler.error = "Expected \"end "+handler.name+"\".";
				else
					handler.length = offset - handler.offset;
				continue;
			}
			else continue;
			
			var tokens = Xtalk.Lexer.lex(line);
			if (tokens) tokens = tokens.items;
			
			if ((tokens.length < 2) ||
				(tokens[1].id != Xtalk.ID_WORD)) continue;
			
			handler = {
				type: type,
				name: tokens[1].text,
				offset: offset + line_raw.length + 1,
				line: i+1,
				length: -1,
				named_params: [],
				error: null,
			};
			
			if (tokens[tokens.length - 1].id == Xtalk.ID_EOL)
				tokens.length--;
			for (var t = 2; t < tokens.length; t += 2)
			{
				var token = tokens[t];
				if (token.id != Xtalk.ID_WORD)
				{
					handler.error = "Expected identifier but found \""+token.text+"\".";
					break;
				}
				handler.named_params.push( token.text );
				
				if (t + 1 >= tokens.length) break;
				token = tokens[t + 1];
				if (token.id != Xtalk.ID_COMMA)
				{
					handler.error = "Expected , but found \""+token.text+"\".";
					break;
				}
				if (t + 2 >= tokens.length)
				{
					handler.error = "Expected identifier but found end of line.";
					break;
				}
			}
			
			index.push(handler);
		}
		
		for (var i = 0; i < index.length; i++)
		{
			handler = index[i];
			if ((handler.length < 0) && (!handler.error))
				handler.error = "Expected \"end\".";
		}
		
		return index;
	}

};



