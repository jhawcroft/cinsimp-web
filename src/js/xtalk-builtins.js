/*
CinsImp
CinsTalk Virtual Machine

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
Built-in commands, properties, constants and functions that are part of the CinsTalk
language environment.


Dependencies
------------

xtalk.js

*/

Xtalk.Builtins = {

/*****************************************************************************************
Generic to CinsTalk Implementation
*/

	the_date: function(in_context, in_id, in_variant)
	{
		var now = new Date(); 
		switch (in_variant)
		{
		case 'shrt':
		{
			var yr = now.getFullYear() + '';
			return now.getDate() + '/' + (now.getMonth()+1) + '/' + yr.substr(yr.length - 2, 2);
		}
		case 'abbr':
		{
			var abbr_days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
			var abbr_months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			return abbr_days[now.getDay()] + ', ' + abbr_months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
		}
		case 'long':
		{
			var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
			var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
			return days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
		}
		}
	},



/*****************************************************************************************
Specific to CinsImp Environment
*/

	command_answer: function(in_message)
	{
		Xtalk.VM.wait();
		
		var alert = new Alert();
		alert.prompt = in_message.params[0].toString()._value;
		if (in_message.params[1].type == 'Nothing')
		{
			alert.button1_label = 'OK';
			alert.button1_handler = Xtalk.Builtins._command_answer_end.bind(this, new Xtalk.VM.TString(alert.button1_label));
		}
		else
		{
			alert.button1_label = in_message.params[1].toString()._value;
			alert.button1_handler = Xtalk.Builtins._command_answer_end.bind(this, in_message.params[1].toString());
			if (in_message.params[2].type != 'Nothing')
			{
				alert.button2_label = in_message.params[2].toString()._value;
				alert.button2_handler = Xtalk.Builtins._command_answer_end.bind(this, in_message.params[2].toString());
				if (in_message.params[3].type != 'Nothing')
				{
					alert.button3_label = in_message.params[3].toString()._value;
					alert.button3_handler = Xtalk.Builtins._command_answer_end.bind(this, in_message.params[3].toString());
				}
			}
		}
		alert.show();
	},
	
	_command_answer_end: function(in_response)
	{
		Xtalk.VM.unwait( in_response );
	},
	
	
	command_visual: function(in_message)
	{
		var effect = in_message.params[0].toValue();
		var speed = in_message.params[1].toValue();
		if (speed === null) speed = 'normal';
		var dest = in_message.params[2].toValue();
		if (dest === null) dest = 'card';
		View.current.queue_visual_effect(effect, speed, dest);
	},
	
	
	command_go_which: function(in_message)
	{
		var which = in_message.params[0].toValue();
		var marked = (in_message.params[1].toValue() === 'true');
		View.current.go_nth_card(which, null, marked);  // **TODO ensure we have a syntax that supports bkgnd specification
	},
	
	
	command_go_where: function(in_message)
	{
		var where = in_message.params[0].resolve();
		alert('GO WHERE - to be implemented once object references working - obtain a card ID');
	}

};

/*

Desktop prototype syntax definitions:

{"beep [<times> [times]]","times", (XTECommandImp)&_cmd_beep},
    
    {"find [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] "
        "<text> [in <field>]","text,mode,field", (XTECommandImp)&_cmd_find},
    
    {"sort [[the] cards] of <bkgnd> [`dir``asc`ascending|`des`descending] by <sortKey>",
        "sortKey<,dir,bkgnd", (XTECommandImp)&_cmd_sort},
    {"sort [[the] cards] [`dir``asc`ascending|`des`descending] by <sortKey>",
        "sortKey<,dir", (XTECommandImp)&_cmd_sort},
    {"sort <bkgnd> [`dir``asc`ascending|`des`descending] by <sortKey>",
        "sortKey<,dir,bkgnd", (XTECommandImp)&_cmd_sort},
    
    {"visual [effect] {`effect``0`cut|`1`dissolve|`2`wipe left|`3`wipe right|`4`wipe up|`5`wipe down} "
        "[`speed``-2`very slowly|`-2`very slow|`-1`slowly|`-1`slow|`0`normal|`2`very fast|`1`fast] "
        "[to {`dest``0`card|`1`black|`2`white|`3`grey|`3`gray}]",
        "effect,speed,dest",
        (XTECommandImp)&_cmd_visual},
    
    // must use this to capture cases where [card] is missing on the end, and prev & next which aren't
     handled via ordinal referencing //
    //"go [to] {`which``-2`next|`-1`prev|`-1`previous|`1`first|`2`second|`3`third|`4`forth|`5`fifth|"
    //"`6`sixth|`7`seventh|`8`eighth|`9`ninth|`10`tenth|`-3`middle|`-4`any|`-5`last} [[`marked``1`marked] card]
    // "ANY" is missing from this syntax, because in 1.0 we can't be bothered with the machinery that
    // would be require to make this work; for starters, the go command would have to be implemented
    // more on the thread side of things, to make use of the xtalk engine to resolve the random() need
    // all this really means is that you must say go any card, rather than just saying go any.
    //"
    {"go [to] {`which``-2`next|`-1`prev|`-1`previous|`1`first|`2`second|`3`third|`4`forth|`5`fifth|"
        "`6`sixth|`7`seventh|`8`eighth|`9`ninth|`10`tenth|`-3`middle|`-5`last} [[`marked``1`marked] card]",
        "which,marked",
        (XTECommandImp)&_cmd_go_which}, // this definition is causing a leak ***
    {"go [to] <where>", "where", (XTECommandImp)&_cmd_go_where},
    
    {"answer file <prompt> [of type <type1> [or <type2> [or <type3>]]]", "prompt,type1,type2,type3", (XTECommandImp)&_cmd_answer_file},
    {"answer folder <prompt>", "prompt", (XTECommandImp)&_cmd_answer_folder},
    {"answer <prompt> [with <btn1> [or <btn2> [or <btn3>]]]", "prompt,btn1,btn2,btn3", (XTECommandImp)&_cmd_answer_choice},
    
    {"ask file <prompt> [with <defaultFilename>]", "prompt,defaultFilename", (XTECommandImp)&_cmd_ask_file},
    {"ask [`password``1`password] <prompt> [with <response>]", "prompt,response,password", (XTECommandImp)&_cmd_ask_text},
    
    {"open file <filepath>", "filepath", (XTECommandImp)&_cmd_file_open},
    {"close file <filepath>", "filepath", (XTECommandImp)&_cmd_file_close},
    {"read line from file <filepath>", "filepath", (XTECommandImp)&_cmd_file_read_line},
    {"read from file <filepath> [at <charBegin>] {for <charCount> | until {end|eof|<charEnd>}}", "filepath,charBegin,charEnd,charCount", (XTECommandImp)&_cmd_file_read_chars},
    {"write <text> to file <filepath> [at {end|eof|<charBegin>}]", "filepath,text,charBegin", (XTECommandImp)&_cmd_file_write_chars},
    
    */



CinsImp._script_loaded('xtalk-builtins');


