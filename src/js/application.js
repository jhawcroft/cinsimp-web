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
	Xtalk.VM.handle_message_box(Application._msgtxt.value);
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
	Application._msgtxt.addEventListener('keydown', function(e) { if (e.keyCode == 13) {Application.invoke_message(); e.preventDefault(); e.stopPropagation();} });
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
	//Application._init_card_size_widget();
	
	
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

	
	
	Dialog.Effect = new Dialog('Visual Effect', document.getElementById('DialogEffect'));
	//Dialog.Effect.show();
	
	
	//Dialog.TextInspect.show();
	
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
	m.appendItem('Message', Application.do_message.bind(Application));
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
	
	var btn = document.createElement('img');
	btn.src = CinsImp._base + 'gfx/cog.png';
	btn.classList.add('Clickable');
	btn.style.width = '16px';
	btn.alt = 'Configure';
	btn.title = 'Configure';
	btn.addEventListener('click', Application.open_app_menu);
	app_bar.appendChild(btn);
	this._btn_config = btn;
	
	var btn = document.createElement('img');
	btn.src = CinsImp._base + 'gfx/dirty-black.png';
	btn.classList.add('Clickable');
	btn.style.width = '16px';
	btn.alt = 'Dirty';
	btn.title = 'Unsaved Changes';
	btn.addEventListener('click', View.do_save);
	btn.style.display = 'none';
	app_bar.appendChild(btn);
	this._btn_dirty = btn;
	
	var btn = document.createElement('img');
	btn.src = CinsImp._base + 'gfx/readonly-black.png';
	btn.classList.add('Clickable');
	btn.style.width = '16px';
	btn.alt = 'Locked';
	btn.title = 'Read-only';
	btn.style.display = 'none';
	app_bar.appendChild(btn);
	this._btn_ro = btn;
	
	document.body.appendChild(app_bar);
}


Application.FILE_STATUS_READONLY = 1;
Application.FILE_STATUS_DIRTY = 2;


Application.file_status = function(in_status)
{
	if (in_status & Application.FILE_STATUS_READONLY)
	{
		this._btn_dirty.style.display = 'none';
		this._btn_ro.style.display = 'inline-block';
	}
	else if (in_status & Application.FILE_STATUS_DIRTY)
	{
		this._btn_ro.style.display = 'none';
		this._btn_dirty.style.display = 'inline-block';
	}
	else
	{
		this._btn_ro.style.display = 'none';
		this._btn_dirty.style.display = 'none';
	}
}



Application._show_default_palettes = function()
{
	Palette.Navigator.show();
	Palette.Authoring.show();
	Palette.Tools.show();
	
	//Dialog.ScriptEditor.show();
}



/*
	Loads the stack from the definitions included in the static HTML
	from whence this application is initially invoked.
*/
Application._load_initial_stack = function()
{
	/* load the model */
	var stack = new CinsImp.Model.Stack(CinsImp._params.stack);
	var bkgnd = new CinsImp.Model.Bkgnd(stack, CinsImp._params.bkgnd);
	var card = new CinsImp.Model.Card(stack, CinsImp._params.card);
	
	/* define the single stack window;
	!  In future there may be support for more than one stack to be open. */
	var stack_window = document.getElementById('stackWindow');
	Util.set_dom_size(stack_window, stack.get_attr('card_size'));
	
	/* arrange the palettes around the stack window */
	Application._set_default_positions(stack_window.clientWidth, stack_window.clientHeight);
	
	/* init the view of the first card */
	Application._view = new View(stack, bkgnd, card);
	//Application._view.refresh();
}


Application._xtalk_error_alert = function(in_message, in_object, in_line, in_can_script, in_can_debug)
{
	Application._xtalk_error_object = in_object;
	Application._xtalk_error_line = in_line;
	
	var alert = new Alert();
	alert.title = 'CinsTalk Error';
	alert.prompt = in_message;
	alert.button1_label = 'Cancel';
	
	if (in_can_script)
	{
		alert.button2_label = 'Script';
		alert.button2_handler = null; // **TODO** will need to modify the edit script routine to be more general and maybe move elsewhere
		
		if (in_can_debug)
		{
			alert.button3_label = 'Debug';
			alert.button3_handler = null; // **TODO**
		}
	}

	alert.show();	
}


Application._init_xtalk = function()
{
	Xtalk.VM.onError = function(in_error)
	{
		/* check for unhandled javascript errors */
		if (!(in_error instanceof Xtalk.Error))
		{
			Application._xtalk_error_alert('Unhandled javascript exception: '+in_error.message+"\n"+
				in_error.fileName +': '+in_error.lineNumber, null, 0, false, false);
			return;
		}

		/* figure out which buttons should be enabled */
		var canScript = false;
		var canDebug = false;
		if (in_error.type == 'runtime') canDebug = true;
		if (in_error.owner) canScript = true;
		else canDebug = false;
	
		// would do user-level checks here if we actually were running within the authoring environment
	
		/* display an appropriate alert */
		Application._xtalk_error_alert(in_error.message, in_error.owner, in_error.line, canScript, canDebug);
	};
	
	
	Xtalk.VM.onMessageWrite = function(in_what)
	{
		Application._msgtxt.value = in_what;
		Palette.MessageBox.show();
	};
}


Application._idle = function()
{
	if (View.current) View.current.do_idle();
	Xtalk.VM.reset_globals();
}


Application.init = function()
{
	this.locale = null;

	Progress.status('Initalizing CinsImp application...');
	Application._create_stack_window();
	
	Application._init_palettes();
	Application._init_dialogs();
	Application._init_app_bar();
	
	Application._init_share_menu();
	
	Application._init_xtalk();
	
	Progress.operation_begun('Loading stack...');
	Application._load_initial_stack();
	
	Progress.status('Configuring environment...');
	Application._show_default_palettes();
	
	Xtalk.VM.init();
	
	Application._idle_timer = window.setInterval(Application._idle, 50);
	
	Plugins.init();
	
	Progress.operation_finished();
}







CinsImp._script_loaded('application');





