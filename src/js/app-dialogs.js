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
	for (var i = 0; i < _g_icon_collections.length; i++)
	{
		var collection_option = document.createElement('option');
		collection_option.value = _g_icon_collections[i];
		collection_option.appendChild(document.createTextNode(_g_icon_collections[i]));
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
	AppDialogs._object = Application._objects[0];
	Application.save_info();
	
	document.getElementById('SetIconCollection').value = 'Stack';
	AppDialogs.show_icon_collection();
	Dialog.SetIcon._grid.set_icon_id( AppDialogs._object.get_attr(Button.ATTR_ICON) );
	
	Dialog.SetIcon.show();
}


AppDialogs.show_icon_collection = function()
{
	var collection_name = document.getElementById('SetIconCollection').value;
	if (collection_name == 'Stack')
	{
		Dialog.SetIcon._grid.load_grid(View.get_stack_icons());
		return;
	}
	
	// ** TODO ** ought to display some kind of mini animated progress widget here,
	// possibly in the grid itself, to show it's being refreshed
	
	Dialog.SetIcon._grid.load_grid([]);
	var msg = {
		cmd: 'list_icons',
		pack: collection_name
	};
	Ajax.send(msg, function(in_msg, in_status) 
	{
		if (in_status == 'ok' && in_msg.cmd == 'list_icons')
		{
			Dialog.SetIcon._grid.load_grid(in_msg.list);
		}
		else
			Alert.network_error('Couldn\'t fetch icon list.');
	});
}


AppDialogs.clear_icon = function()
{
	AppDialogs._object.set_attr(Button.ATTR_ICON, 0);
	Dialog.dismiss();
}


AppDialogs.set_icon = function()
{
	/* if the icon isn't in the stack collection, we need to first import it,
	and potentially change it's ID locally */
	var collection_name = document.getElementById('SetIconCollection').value;
	if (collection_name != 'Stack')
	{
		Progress.operation_begun('Importing icon into stack...');
		AppDialogs._importing_icon_data = Dialog.SetIcon._grid.get_icon_data();
		var msg = {
			cmd: 'import_icon',
			stack_id: Application._stack.stack_id,
			id: Dialog.SetIcon._grid.get_icon_id(),
			name: Dialog.SetIcon._grid.get_icon_name(),
			data: AppDialogs._importing_icon_data
		};
		Ajax.send(msg, function(in_msg, in_status)
		{
			Progress.operation_finished();
			if (in_status == 'ok' && in_msg.cmd == 'import_icon')
			{
				/* need to complete the import by manually adding the icon data
				to the loaded stack registry of icons */
				View.register_icon(in_msg.id, Dialog.SetIcon._grid.get_icon_name(), AppDialogs._importing_icon_data);
				
				AppDialogs._object.set_attr(Button.ATTR_ICON, in_msg.id);
				Dialog.dismiss();
			}
			else
				Alert.network_error('Couldn\'t import icon.');
		});
		return;
	}

	/* finally, set the object icon ID */
	AppDialogs._object.set_attr(Button.ATTR_ICON, Dialog.SetIcon._grid.get_icon_id());
	Dialog.dismiss();
}


CinsImp._script_loaded('app-dialogs');

