/*
CinsImp
Plug-in Loader

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


var Plugins = {

/*****************************************************************************************
??
*/

	_plugin_commands: [],
	
	_last_plugin: null,
	

	_load_required: function(in_handler)
	{
		/* if the end of the requirements list is reached,
		initalize the plugin */
		var required = CinsImpPlugin.required_files;
		if (required.length == 0) 
		{
			var ok = false;
			try { Plugins._last_plugin.init(); ok = true; }
			catch (err) { Plugins._last_plugin.errors.push(err.message); }
			in_handler();
			return;
		}
		
		var file_name = required.pop();
		Util.get_url('plugins/commands/'+this._last_plugin.name+'/'+file_name, 
		function(in_file)
		{
			Util.load_source(in_file, file_name);
			Plugins._load_required(in_handler);
		});
	},
	

	_init_command: function(in_name, in_handler)
	{
		/* verify the plugin */
		this._last_plugin = CinsImpPlugin;
		this._last_plugin.name = in_name;
		this._last_plugin.url = CinsImp._base + 'plugins/commands/'+in_name+'/';
		this._last_plugin.errors = [];
		// **TODO
		
		/* register the plugin */
		this._plugin_commands.push(this._last_plugin);
		
		/* configure the plugin */
		this._last_plugin.register_syntax = Xtalk.Dict.register_command_syntax;
		
		/* load the plugin's required files (if any) */
		Plugins._load_required(in_handler);
	},
	

	load_command: function(in_name)
	{
		Progress.status('Loading plugin: '+in_name+'...');
		Util.get_url('?plugin=command/' + in_name, function(in_def)
		{
			if (in_def)
			{
				var ok = false;
				try { eval(in_def); ok = true; }
				catch (err) {}
				if (ok) Plugins._init_command(in_name, Plugins.load_commands);
			}
			else 
			{
				Plugins.load_commands();
			}
		});
	},
	

	load_commands: function()
	{
		var commands = CinsImp._params.plugin_commands;
		if (commands.length > 0)
			this.load_command( commands.pop() );
	},


	init: function()
	{
		Progress.status('Loading plug-ins...');
		Xtalk.Dict._loading_plugins = true;
		this._base = CinsImp._base + 'plugins/';
		this._base_cmds = this._base + 'commands/';
		this.load_commands();
	}


}



CinsImp._script_loaded('plugins');

