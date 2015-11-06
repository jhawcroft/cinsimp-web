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
	
	command_answer: function(in_message)
	{
		alert('ANSWER!');
	}

};




CinsImp._script_loaded('xtalk-builtins');


