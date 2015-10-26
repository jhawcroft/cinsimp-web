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




Application._handle_choose_colour = function(in_event)
{
	var e = in_event || window.event;
	var dom_swatch = e.target;
	var color = dom_swatch.style.backgroundColor.replace('rgb(','').replace(')','').split(',');
	color[0] = color[0] * 1;
	color[1] = color[1] * 1;
	color[2] = color[2] * 1;
	Application.choose_color(color);
}


Application.choose_color = function(in_color)
{
	if (Application._view) Application._view.choose_color(in_color);
}



Application.invoke_message = function()
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


Application.do_message = function()
{
	if (Palette.MessageBox.getVisible())
		Palette.MessageBox.hide();
	else
	{
		Palette.MessageBox.show();
		document.getElementById('MessageBoxText').selectionStart = 0;
		document.getElementById('MessageBoxText').selectionEnd = document.getElementById('MessageBoxText').value.length;
		document.getElementById('MessageBoxText').focus();
	}
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


Application.do_card_size = function()
{
	Application._csw.set_card_size([this._stack.card_width, this._stack.card_height]);
	Dialog.CardSize.show();
}


Application.save_card_size = function()
{
	Dialog.dismiss();
	Progress.operation_begun('Resizing card...');
	
	var sz = Application._csw.get_card_size();
	this._stack.card_width = sz[0];
	this._stack.card_height = sz[1];
	this._view._container.style.width = sz[0] + 'px';
	this._view._container.style.height = sz[1] + 'px';
	
	var msg = {
		cmd: 'save_stack',
		stack_id: this._stack.stack_id,
		stack: this._stack
	};
	Ajax.send(msg, function(msg, status)
	{
		Progress.operation_finished();
		if ((status != 'ok') || (msg.cmd != 'save_stack'))
			alert('Saving stack changes, error: '+status+"\n"+JSON.stringify(msg));
		else
			this._stack = msg.stack;
	});
}


Application._card_size_picked = function()
{
	var picklist = document.getElementById('CardSizeList');
	var t_sz = picklist.value;
	if (t_sz == '?,?') this._card_size_changed(this._csw.get_card_size());
	else this._csw.set_card_size(t_sz.split(','));
}


Application._card_size_changed = function(in_new_size)
{
	if (Application._csc) return;
	Application._csc = true;
	document.getElementById('CardSizeSize').textContent = in_new_size[0] + ' x ' + in_new_size[1];
	var t_sz = in_new_size[0] + ',' + in_new_size[1];
	var picklist = document.getElementById('CardSizeList');
	var found = false;
	for (var i = 0; i < picklist.children.length; i++)
	{
		var item = picklist.children[i];
		if (item.value == t_sz) { found = true; break; }
	}
	if (!found)
		picklist.value = '?,?';
	else
		picklist.value = t_sz;
	Application._csc = false;
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


Application.do_edit_script = function(in_subject, in_prior)
{
	if (Application._view) Application._view.do_edit_script(in_subject, in_prior);
}


Application.save_script = function()
{
	if (Application._view) Application._view.save_script();
}


Application.open_app_menu = function(el) //don't take an argument - do lookup
{
	PopupMenu.ApplicationMenu.item(0).checkmark = Palette.Navigator.getVisible();
	PopupMenu.ApplicationMenu.item(1).checkmark = Palette.MessageBox.getVisible();
	PopupMenu.ApplicationMenu.item(2).checkmark = Palette.Tools.getVisible();
	PopupMenu.ApplicationMenu.item(3).checkmark = Palette.Authoring.getVisible();
	PopupMenu.ApplicationMenu.item(4).checkmark = Palette.Colours.getVisible();
	
	var r = Application._btn_config.getBoundingClientRect();
	PopupMenu.ApplicationMenu.open([r.left - 4,20], 'right');
}


Application.view = function()
{
	if (Application._view) return Application._view;
	return null;
}





Application._init_message_box = function()
{
	Palette.MessageBox = new Palette(document.getElementById('PaletteMessageBox'), 0);
	Application._msgtxt = document.getElementById('MessageBoxText');
	Application._msgtxt.addEventListener('keydown', function(e) { if (e.keyCode == 13) Application.invoke_message(); });
}


Application._init_colours = function()
{
	Palette.Colours = new Palette(document.getElementById('PaletteColours'), 0);
	
	var dom_table = document.createElement('div');
	dom_table.className = 'ColourSwatchTable';
	for (var c = 0; c < Colours.DEFAULT_SET.length; c++)
	{
		var colour = Colours.DEFAULT_SET[c];
		
		var dom_swatch = document.createElement('div');
		dom_swatch.style.backgroundColor = 'rgba('+colour[0]+','+colour[1]+','+colour[2]+',1)';
		dom_table.appendChild(dom_swatch);
		
		dom_swatch.addEventListener('mousedown', Application._handle_choose_colour);
	}
	
	Palette.Colours._root.appendChild(dom_table);
	
	var cell_size = dom_table.children[0].clientWidth;
	var per_row = Math.floor(dom_table.clientWidth / dom_table.children[0].clientWidth);
	var rows = Math.ceil(Colours.DEFAULT_SET.length / per_row);
	
	Palette.Colours.setSize([per_row * cell_size, rows * cell_size]);
	Palette.Colours._div.style.opacity = 1.0; /* not appropriate to have translucent colour swatches */
}


Application._set_default_positions = function(in_card_width, in_card_height)
{
	Palette.Navigator.setLoc([20, in_card_height + 40]);
	Palette.Authoring.setLoc([20, in_card_height + 40 + Palette.Navigator._div.clientHeight + 2 + 8]);
	Palette.Tools.setLoc([in_card_width + 40, 50]);
	Palette.Colours.setLoc([in_card_width + 45, 50 + Palette.Tools._div.clientHeight + 14]);
	Palette.MessageBox.setLoc([40, in_card_height - 70]);
}


Application._init_palettes = function()
{
	Application._init_message_box();
	Application._init_colours();
	
	Palette.LinkTo = new Palette(document.getElementById('PaletteLinkTo'), 0);
	Palette.Navigator = new Palette(document.getElementById('PaletteNavigator'), Palette.TITLE_VERTICAL);
	Palette.Tools = new Palette(document.getElementById('PaletteTools'), 0);
	Palette.Authoring = new Palette(document.getElementById('PaletteAuthoring'), Palette.TITLE_VERTICAL);
}


Application._init_card_size_widget = function()
{
	Application._csw = new CardSizeWidget(document.getElementById('CardSizeWidg'),
		Application._card_size_changed);
	var picklist = document.getElementById('CardSizeList');
	picklist.addEventListener('change', Application._card_size_picked.bind(Application));
}


Application._init_dialogs = function()
{
	Dialog.About = new Dialog('About CinsImp', document.getElementById('DialogAbout'));
	Dialog.Alert = new Dialog('', document.getElementById('DialogAlert'), Dialog.FLAG_NOCLOSE);
	Dialog.Log = new Dialog('Log', document.getElementById('DialogLog'), 0);
	Dialog.Progress = new Dialog('Please Wait', document.getElementById('DialogProgress'), Dialog.FLAG_NOCLOSE);

	Dialog.HCImport = new Dialog('HyperCard Import', document.getElementById('DialogHCImport'), 0);
	Dialog.Recent = new Dialog('Recent Cards', document.getElementById('DialogRecent'));

	Dialog.AskPassword = new Dialog('', document.getElementById('DialogAskPassword'));
	Dialog.StackInfo = new Dialog('Stack Info', document.getElementById('DialogStackInfo'));
	Application._init_card_size_widget();
	Dialog.CardSize = new Dialog('Card Size', document.getElementById('DialogCardSize'));
	
	Dialog.SetPassword = new Dialog('Set Stack Password', document.getElementById('DialogSetPassword'));
	Dialog.BkgndInfo = new Dialog('Bkgnd Info', document.getElementById('DialogBkgndInfo'));
	Dialog.CardInfo = new Dialog('Card Info', document.getElementById('DialogCardInfo'));
	Dialog.FieldInfo = new Dialog('Field Info', document.getElementById('DialogFieldInfo'), 0,
		function() { 
		Application._objects = null; 
		document.getElementById('FieldInfoBkgndOnly').style.visibility = 'hidden'; });
	Dialog.TextStyle = new Dialog('Text Properties', document.getElementById('DialogTextStyle'));
	Dialog.ButtonInfo = new Dialog('Button Info', document.getElementById('DialogButtonInfo'), 0,
		function() { 
		Application._objects = null; 
		document.getElementById('ButtonInfoBkgndOnly').style.visibility = 'hidden'; });

	Dialog.ScriptEditor = new Dialog('', document.getElementById('DialogScriptEditor'));
	// temporarily disabled due to causing mammoth slowdown on mobile devices - suspect the ruler with line numbers is too large:
	Dialog.ScriptEditor._codeeditor = new JCodeEdit(document.getElementById('ScriptEditorContainer'));
	
	Dialog.Effect = new Dialog('Visual Effect', document.getElementById('DialogEffect'));
	//Dialog.Effect.show();
	
	AppDialogs.init();
}



Application._create_stack_window = function()
{
	Application._stack_window = document.createElement('div');
	Application._stack_window.classList.add('CursBrowse');
	Application._stack_window.id = 'stackWindow';
	
	document.body.appendChild(Application._stack_window);
}



Application._init_app_menu = function()
{
	PopupMenu.ApplicationMenu = new PopupMenu();
	var m = PopupMenu.ApplicationMenu;

	m.appendItem('Navigator', Palette.Navigator.toggle.bind(Palette.Navigator));
	m.appendItem('Message', Palette.MessageBox.toggle.bind(Palette.MessageBox));
	m.appendItem('Tools', Palette.Tools.toggle.bind(Palette.Tools));
	m.appendItem('Authoring', Palette.Authoring.toggle.bind(Palette.Authoring));
	m.appendItem('Colours', Palette.Colours.toggle.bind(Palette.Colours));
	//m.appendItem('Line Sizes', Palette.LineSizes.toggle.bind(Palette.LineSizes));
	m.appendItem('-', null);
	/*m.appendItem('New Stack', null);
	m.appendItem('Save a Copy', null);
	m.appendItem('Delete Stack', null);
	m.appendItem('-', null);*/
	//m.appendItem('HyperCard Import', Dialog.HCImport.show.bind(Dialog.HCImport));
	//m.appendItem('-', null);
	m.appendItem('About CinsImp', function() { Dialog.About.centre(); Dialog.About.show(); });
}


Application._init_share_menu = function()
{
	PopupMenu.ShareMenu = new PopupMenu();
	var m = PopupMenu.ShareMenu;
	
	m.appendItem('Print Field...', AppDialogs.do_print_field);
	m.appendItem('Print Card', View.do_print_card);
	m.appendItem('Print Stack...', AppDialogs.do_print_stack);
	m.appendItem('Print Report...', AppDialogs.do_print_report);
	//m.appendItem('-', null);
	//m.appendItem('Test 5', null);
}


Application._init_app_bar = function()
{
	Application._init_app_menu();

	var app_bar = document.createElement('div');
	app_bar.id = 'applicationBar';
	
	var btn_config = document.createElement('img');
	btn_config.src = gBase+'gfx/cog.png';
	btn_config.classList.add('Clickable');
	btn_config.style.width = '16px';
	btn_config.alt = 'Configure';
	btn_config.title = 'Configure';
	btn_config.addEventListener('click', Application.open_app_menu);
	app_bar.appendChild(btn_config);
	this._btn_config = btn_config;
	
	document.body.appendChild(app_bar);
}



Application._show_default_palettes = function()
{
	Palette.Navigator.show();
	//Palette.Authoring.show();
	//Palette.Tools.show();
	
	//Dialog.ScriptEditor.show();
}


Application._configure_initial_stack = function()
{
	Application._stack = _g_init_stack;
	Application._card = _g_init_card;
	
	var stack_window = document.getElementById('stackWindow');
	stack_window.style.width = Application._stack.card_width + 'px';
	stack_window.style.height = Application._stack.card_height + 'px';
	
	Application._set_default_positions(stack_window.clientWidth, stack_window.clientHeight);
}


Application._load_initial_stack = function()
{
	Application._view = new View(Application._stack, Application._card);
	Application._view.refresh();
}


Application.init = function()
{
	//Progress.status('Initalizing CinsImp application...');
	Application._create_stack_window();
	
	Application._init_palettes();
	Application._init_dialogs();
	Application._init_app_bar();
	
	Application._init_share_menu();
	
	Progress.operation_begun('Loading stack...', true);
	Application._configure_initial_stack();
	Application._load_initial_stack();
	
	Progress.status('Configuring environment...');
	Application._show_default_palettes();
	
	Progress.operation_finished();
}







CinsImp._script_loaded('application');





