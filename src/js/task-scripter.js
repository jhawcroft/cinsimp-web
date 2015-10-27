/*
CinsImp
Button Task Scripter

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

function TaskScripter() {}


TaskScripter._handler_lines = function(in_lines)
{
	var handler_lines = [-1, -1];
	for (var l = 0; l < in_lines.length; l++)
	{
		var words = in_lines[l].trim().toLowerCase().split(' ');
		if (handler_lines[0] < 0 && words.length >= 2 && words[0] == 'on' && words[1] == 'mouseup')
			handler_lines[0] = l + 1;
		else if (handler_lines[0] >= 0 && words.length >= 2 && words[0] == 'end' && words[1] == 'mouseup')
		{
			handler_lines[1] = l;
			break;
		}
	}
	if (handler_lines[0] >= 0 && handler_lines[1] >= 0) return handler_lines;
	return null;
}


TaskScripter.update_or_insert = function(in_script, in_code, in_line)
{
	/* break the script into lines */
	var lines = in_script.split("\n");
	in_script = null;
	
	/* find the handler */
	var handler_lines = TaskScripter._handler_lines(lines);
	
	/* if the handler doesn't even exist, create it */
	if (!handler_lines)
	{
		handler_lines = [-1,-1];
		lines.push('');
		lines.push('on mouseup');
		handler_lines[0] = lines.length;
		lines.push('  ');
		handler_lines[1] = lines.length;
		lines.push('end mouseup');
	}
	
	/* if the line doesn't yet exist, create a blank one
	or use an existing blank line prior to the handler end */
	if (in_line < 0)
	{
		if (handler_lines[1]-1 >= handler_lines[0] && lines[handler_lines[1]-1].trim() == '')
			in_line = handler_lines[1]-1;
		else
		{
			lines.splice(handler_lines[1], 0, '');
			in_line = handler_lines[1];
			handler_lines[1]++;
		}
	}
	
	/* replace the line with the new code */
	lines[in_line] = '  '+in_code;
	
	/* return the amended script */
	return lines.join("\n");
}


TaskScripter.find_command = function(in_script, in_command)
{
	/* break the script into lines */
	var lines = in_script.split("\n");
	in_script = null;
	
	/* find the handler */
	var handler_lines = TaskScripter._handler_lines(lines);
	
	/* if the handler isn't found, escape now */
	if (handler_lines == null) return -1;
	
	/* find the first command that matches */
	in_command = in_command.toLowerCase();
	for (var l = handler_lines[0]; l < handler_lines[1]; l++)
	{
		var words = lines[l].trim().toLowerCase().split(' ');
		if (words.length >= 1 && words[0] == in_command)
			return l;
	}
	
	/* if no match, return -1 */
	return -1;
}



CinsImp._script_loaded('task-scripter');

