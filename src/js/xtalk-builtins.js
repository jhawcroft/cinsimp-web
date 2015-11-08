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
	
	
	term_me: function(in_id)
	{
		return Xtalk.VM.get_me();
	},
	
	term_target_container: function(in_id)
	{
		return Xtalk.VM.get_target();
	},
	
	term_target_name: function(in_context, in_id, in_variant)
	{
		var obj = Xtalk.VM.get_target();
		return obj.get_attr('name', in_variant);
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





CinsImp._script_loaded('xtalk-builtins');


