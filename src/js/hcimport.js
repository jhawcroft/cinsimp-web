/*
CinsImp
HyperCard Import Controller

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


function HCImport() {}

HCImport._card_list = null;
HCImport._bkgnd_list = null;
HCImport._card_index = 0;
HCImport._bkgnd_index = 0;

/*
HCImport._show_scan_result = function(in_msg, in_status)
{
	Progress.operation_finished();
	document.getElementById('DialogLog').textContent = JSON.stringify(in_msg.result, null, 2);
	Dialog.Log.show();
}*/



HCImport._next_layer = function(in_msg, in_status)
{
	if (HCImport._bkgnd_index < HCImport._bkgnd_list.length)
	{
		Progress.status('Importing background '+(HCImport._bkgnd_index+1)+' of '+HCImport._bkgnd_list.length+'...');
		var msg = {
			cmd: 'hcimport_bkgnd',
			id: HCImport._bkgnd_list[HCImport._bkgnd_index++]
		};
		Ajax.send(msg, HCImport._next_layer);
	}
	else if (HCImport._card_index < HCImport._card_list.length)
	{
		Progress.status('Importing card '+(HCImport._card_index+1)+' of '+HCImport._card_list.length+'...');
		var msg = {
			cmd: 'hcimport_card',
			id: HCImport._card_list[HCImport._card_index++],
			seq: HCImport._card_index
		};
		Ajax.send(msg, HCImport._next_layer);
	}
	else 
	{
		Progress.operation_finished();
		window.location.href = '?stack=tmp/stack';
	}
}


HCImport._save_list = function(in_msg, in_status)
{
	HCImport._card_list = in_msg.result.cards;
	HCImport._bkgnd_list = in_msg.result.bkgnds;
	HCImport._next_layer(null, 'ok');
}

HCImport._list = function(in_msg, in_status)
{
	Progress.status('Scanning the HyperCard stack...');
	var msg = { cmd: 'hcimport_list' };
	Ajax.send(msg, HCImport._save_list);
}


HCImport._create = function(in_msg, in_status)
{
	Progress.status('Creating CinsImp stack...');
	
	HCImport._card_list = null;
	HCImport._bkgnd_list = null;
	HCImport._card_index = 0;
	HCImport._bkgnd_index = 0;
	
	var msg = { cmd: 'hcimport_create' };
	Ajax.send(msg, HCImport._list);
}


HCImport._create = function(in_msg, in_status)
{
	Progress.status('Importing CinsImp stack data...');
	
	HCImport._card_list = null;
	HCImport._bkgnd_list = null;
	HCImport._card_index = 0;
	HCImport._bkgnd_index = 0;
	
	var msg = { cmd: 'hcimport_data' };
	Ajax.send(msg, function() {
		Progress.operation_finished();
		window.location.href = '?stack=tmp/stack';
	});
}


HCImport.run = function()
{
	Dialog.dismiss(); 
	var files = document.getElementById('HCStackFile').files;
	if (files.length != 1) return;
	
	Progress.operation_begun('Uploading HyperCard stack...');
	
	var file = files[0];
	var formData = new FormData();
	
	formData.append('HCStackFile', file, file.name);
	
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '?hcimport=1', true);
	xhr.onload = function()
	{
		if (xhr.status == 200)
			HCImport._create();
		else
		{
			Progress.operation_finished();
			alert('There was a problem!');
		}
	}
	
	xhr.send(formData);
}



