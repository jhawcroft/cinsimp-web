/*
CinsImp
Application Controller

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


function Application() {}

Application._stack = {"stack_name":"test","cant_peek":false,"cant_abort":false,"user_level":5,"card_width":600,"card_height":400,"script":{"content":"","selection":0},"cant_delete":false,"cant_modify":false,"private_access":false,"first_card_id":"1","stack_path":"test","stack_id":"test","count_cards":"2","count_bkgnds":"1","stack_size":4096,"stack_free":0}; 
Application._card = {"card_id":1,"card_name":"First Card","card_seq":1,"card_cant_delete":false,"card_dont_search":false,"card_marked":false,"card_script":{"content":"","selection":0},"card_has_art":false,"card_object_data":"","bkgnd_id":"1","bkgnd_name":"Initial Bkgnd","bkgnd_cant_delete":false,"bkgnd_dont_search":true,"bkgnd_script":{"content":"","selection":0},"bkgnd_has_art":false,"bkgnd_object_data":"","stack_count":"2","bkgnd_count":"2"};
Application._view = null;



Application.init = function()
{
	Application._view = new View(Application._stack, Application._card);
	Application._view.refresh();
	
	
	Application._msgtxt = document.getElementById('MessageBoxText');
	Application._msgtxt.addEventListener('keydown', function(e) { if (e.keyCode == 13) Application.do_message(); });
}


Application.do_message = function()
{
	alert('Do message: '+Application._msgtxt.value);
}


Application.choose_tool = function(in_tool)
{
	if (Application._view) Application._view.choose_tool(in_tool);
}


Application.edit_bkgnd = function()
{
	if (Application._view) Application._view.edit_bkgnd( !Application._view.is_edit_bkgnd() );
}


Application.do_new = function()
{
	if (Application._view) Application._view.do_new();
}


Application.do_delete = function()
{
	if (Application._view) Application._view.do_delete();
}


Application.go_first = function()
{
	if (Application._view) Application._view.go_first();
}

Application.go_prev = function()
{
	if (Application._view) Application._view.go_prev();
}

Application.go_next = function()
{
	if (Application._view) Application._view.go_next();
}

Application.go_last = function()
{
	if (Application._view) Application._view.go_last();
}

// must wait for all CSS to load BEFORE 
// initalizing the application & it's resources, otherwise we'll get weird palettes
// and other issues


Application.do_info = function()
{
	if (Application._view) Application._view.do_info();
}



Application.compact = function()
{
	var msg = {
		cmd: 'compact_stack',
		stack_id: this._stack.stack_id
	};
	
	Progress.operation_begun('Compacting this stack...', true);
	Ajax.send(msg, function(msg, status) 
	{
		Progress.operation_finished();
		
		if ((status != 'ok') || (msg.cmd != 'compact_stack'))
			alert('Compact error: '+status+"\n"+JSON.stringify(msg));
		else
		{
			Application._stack = msg.stack;
			if (Application._view) Application._view._stack = msg.stack;
		}
	});
}


Application.save_info = function()
{
	if (Application._view) Application._view.save_info();
}


Application.showStackInfo = function()
{
	//alert(JSON.stringify(Application._initialStackData));
	
	try
	{
		document.getElementById('StackInfoName').value = Application._stack.stack_name;
		document.getElementById('StackInfoWhere').innerHTML = 'Where: '+Application._stack.stack_path;
		
		document.getElementById('StackInfoCardCount').innerHTML = 'Stack contains '+
			(Application._stack.count_cards == 1 ? 
			Application._stack.count_cards+' card.' :
			Application._stack.count_cards+' cards.');
		document.getElementById('StackInfoBkgndCount').innerHTML = 'Stack contains '+
			(Application._stack.count_bkgnds == 1 ? 
			Application._stack.count_bkgnds+' background.' :
			Application._stack.count_bkgnds+' backgrounds.');
		
		document.getElementById('StackInfoSize').innerHTML = 'Size of stack: ' + 
			Util.niceSize(Application._stack.stack_size);
		document.getElementById('StackInfoFree').innerHTML = 'Free in stack: ' + 
			Util.niceSize(Application._stack.stack_free);
		
		document.getElementById('StackInfoCardSize').innerHTML = 'Card size: ' +
			Application._stack.card_width + ' x ' +
			Application._stack.card_height;
	}
	catch (e) {}
	
	Dialog.StackInfo.show();
}


Application.do_find = function()
{
	document.getElementById('MessageBoxText').value = 'find ""';
	Palette.MessageBox.show();
	//var r = document.createRange();
	document.getElementById('MessageBoxText').selectionStart = 6;
	document.getElementById('MessageBoxText').selectionEnd = 6;
	document.getElementById('MessageBoxText').focus();
}


Application.show_protect_stack = function()
{
	Dialog.ProtectStack.show();
}


Application.setDefaultPositions = function(in_card_width, in_card_height)
{
	Palette.Navigator.setLoc([20, in_card_height + 40]);
	Palette.Authoring.setLoc([20, in_card_height + 40 + Palette.Navigator._div.clientHeight + 2]);
	Palette.Tools.setLoc([in_card_width + 40, 50]);
	Palette.Colours.setLoc([in_card_width + 45, 50 + Palette.Tools._div.clientHeight + 14]);
	Palette.MessageBox.setLoc([40, in_card_height - 70]);
}


Application.save_stack_info = function()
{
	var do_rename = false;
	if (this._stack.stack_name != document.getElementById('StackInfoName').value)
		do_rename = true;	
	this._stack.stack_name = document.getElementById('StackInfoName').value;
	Dialog.dismiss();
	
	if (do_rename)
	{
		Progress.operation_begun('Renaming Stack...');
		var msg = {
			cmd: 'rename_stack',
			stack_id: this._stack.stack_id
		};
		Ajax.send(msg, function(msg, status)
		{
			Progress.operation_finished();
			if ((status != 'ok') || (msg.cmd != 'load_card'))
				alert('Rename stack error: '+status+"\n"+JSON.stringify(msg));
			else
				this._stack = msg.stack;
		});
	}
}

Application.handleSaveCardSize = function()
{
	Dialog.dismiss();
}


Application.send_to_front = function()
{
	if (Application._view) Application._view.send_to_front();
}


Application.send_forward = function()
{
	if (Application._view) Application._view.send_forward();
}


Application.send_backward = function()
{
	if (Application._view) Application._view.send_backward();
}


Application.send_to_back = function()
{
	if (Application._view) Application._view.send_to_back();
}




