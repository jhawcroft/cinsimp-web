/*
CinsImp
Application Dialog Manager

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


function AppDialogs() {}


AppDialogs.init = function()
{
	Dialog.SetIcon = new Dialog('Set Icon', document.getElementById('DialogSetIcon'));
	Dialog.SetIcon._grid = new IconGrid(document.getElementById('SetIconGrid'));
	Dialog.SetIcon._grid.onchange = AppDialogs._icon_selected;
	
	AppDialogs._icon_selected(0, '');
	
	var collection_selector = document.getElementById('SetIconCollection');
	var collections_data = CinsImp._params.icon_collections;
	for (var i = 0; i < collections_data.length; i++)
	{
		var collection_option = document.createElement('option');
		collection_option.value = collections_data[i];
		collection_option.appendChild(document.createTextNode(collections_data[i]));
		collection_selector.appendChild(collection_option);
	}
	collection_selector.value = 'CinsImp';
	
	
	Dialog.PrintField = new Dialog('Print Field', document.getElementById('DialogPrintField'));
	//Dialog.PrintField.show();
	
	Dialog.PrintStack = new Dialog('Print Stack', document.getElementById('DialogPrintStack'));
	document.getElementById('PrintStackHeader').contentEditable = true;
	
	Dialog.PrintReport = new Dialog('Print Report', document.getElementById('DialogPrintReport'));
	document.getElementById('PrintReportHeader').contentEditable = true;
	//Dialog.PrintReport.show();
	
	Dialog.ReportItems = new Dialog('Define Report Items', document.getElementById('DialogReportItems'));
	//Dialog.ReportItems.show();
	
	Dialog.ReportItemInfo = new Dialog('Report Item Info', document.getElementById('DialogReportItemInfo'));
	//Dialog.ReportItemInfo.show();
	
	
	Dialog.ProtectStack = new Dialog('Protect Stack', document.getElementById('DialogProtectStack'));
	
	
	Dialog.TextInspect = new Dialog('', document.getElementById('DialogTextInspect'));
	
	
	Dialog.CardSize = new Dialog('Card Size', document.getElementById('DialogCardSize'));
	AppDialogs._csw = new CardSizeWidget(document.getElementById('CardSizeWidg'),
		AppDialogs._card_size_changed);
	var picklist = document.getElementById('CardSizeList');
	picklist.addEventListener('change', AppDialogs._card_size_picked.bind(AppDialogs));


	Dialog.ScriptEditor = new Dialog('Script Editor', document.getElementById('DialogScriptEditor'));
	Dialog.ScriptEditor._codeeditor = new JCodeEdit(document.getElementById('ScriptEditorContainer'));
	
	
	Dialog.Ask = new Dialog('', document.getElementById('DialogAsk'));
	
}



AppDialogs.do_print_field = function()
{
	Dialog.PrintField.show();
}


AppDialogs.do_print_stack = function()
{
	Dialog.PrintStack.show();
}


AppDialogs.do_print_report = function()
{
	Dialog.PrintReport.show();
}


AppDialogs._icon_selected = function(in_id, in_name)
{
	if (in_id == 0)
		var desc = 'None';
	else
		var desc = 'Icon ID ' + in_id + (in_name != '' ? ' "'+in_name+'"' : '');
	document.getElementById('SetIconInfo').textContent = desc;
}


AppDialogs.choose_button_icon = function()
{
	AppDialogs._object = View.current.get_current_object(true);
	Dialog.dismiss(true);
	
	document.getElementById('SetIconCollection').value = 'Stack';
	AppDialogs.show_icon_collection();
	Dialog.SetIcon._grid.set_icon_id( AppDialogs._object.get_attr('icon') );
	
	Dialog.SetIcon.show();
}


AppDialogs.show_icon_collection = function()
{
	var collection_name = document.getElementById('SetIconCollection').value;
	if (collection_name == 'Stack')
	{
		Dialog.SetIcon._grid.load_grid( View.current.get_stack().get_icons_table() );
		return;
	}
	
	// ** TODO ** ought to display some kind of mini animated progress widget here,
	// possibly in the grid itself, to show it's being refreshed
	
	Dialog.SetIcon._grid.load_grid([]);
	View.current.get_stack().gateway(
	{
		cmd: 'list_icons',
		pack: collection_name
	},
	function (in_reply)
	{
		if (in_reply.cmd != 'error')
		{
			Dialog.SetIcon._grid.load_grid(in_reply.list);
		}
	});
}


AppDialogs.clear_icon = function()
{
	AppDialogs._object.set_attr('icon', 0);
	Dialog.dismiss();
}


AppDialogs.set_icon = function()
{
	/* if the icon isn't in the stack collection, we need to first import it,
	and potentially change it's ID locally */
	var collection_name = document.getElementById('SetIconCollection').value;
	if (collection_name != 'Stack')
	{
		View.current.get_stack().import_icon(
			Dialog.SetIcon._grid.get_icon_id(), 
			Dialog.SetIcon._grid.get_icon_name(),
			Dialog.SetIcon._grid.get_icon_data(),
			function(in_id)
			{
				if (in_id != 0)
				{
					AppDialogs._object.set_attr('icon', in_id);
					Dialog.dismiss();
				}
			}
		);
		return;
	}

	/* finally, set the object icon ID */
	AppDialogs._object.set_attr('icon', Dialog.SetIcon._grid.get_icon_id());
	Dialog.dismiss();
}
//AppDialogs._importing_icon_data = Dialog.SetIcon._grid.get_icon_data();

AppDialogs.edit_text_attr = function(in_attr_id, in_prior, in_title)
{
	this._text_attr_id = in_attr_id;
	AppDialogs._object = View.current.get_current_object(true);
	
	if (in_prior) in_prior();
	
	Dialog.TextInspect.element('text').value = AppDialogs._object.get_attr(in_attr_id);
	Dialog.TextInspect.set_title(in_title);
	
	Dialog.TextInspect.set_onclose(function(in_dialog, in_close_code)
	{
		if (in_close_code)
		{
			AppDialogs._object.set_attr(in_attr_id, in_dialog.element('text').value);
		}
	});
	
	Dialog.TextInspect.show();
}

/*
AppDialogs.save_text_attr = function()
{
	Dialog.dismiss();
	
	AppDialogs._object.set_attr(this._text_attr_id, document.getElementById('TextInspect').value);
}*/




AppDialogs.do_card_size = function()
{
	AppDialogs._csw.set_card_size(View.current._stack.get_attr('card_size'));
	Dialog.CardSize.show();
}


AppDialogs.save_card_size = function()
{
	Dialog.dismiss();
	
	Progress.operation_begun('Resizing card...');
	View.current._stack.resize(AppDialogs._csw.get_card_size(), function(in_new_size) 
	{
		Progress.operation_finished();
		if (in_new_size)
		{
			View.current._container.style.width = in_new_size[0] + 'px';
			View.current._container.style.height = in_new_size[1] + 'px';
		}
	});
	/*View.current.
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
	});*/
}


AppDialogs._card_size_picked = function()
{
	var picklist = document.getElementById('CardSizeList');
	var t_sz = picklist.value;
	if (t_sz == '?,?') this._card_size_changed(this._csw.get_card_size());
	else this._csw.set_card_size(t_sz.split(','));
}


AppDialogs._card_size_changed = function(in_new_size)
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





CinsImp._script_loaded('app-dialogs');

