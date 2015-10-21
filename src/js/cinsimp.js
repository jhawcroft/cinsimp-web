/*
CinsImp
Bootstrap Script; browser detection, dynamic loading of scripts and styles

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

var gBase = '';


var CinsImp = {

	_count_scripts: 0,
	_count_stylesheets: 0,
	
	_loaded_scripts: 0,
	_loaded_stylesheets: 0,


/*
	'Tests' if Javascript is enabled.
	Of course, if this function is running, it obviously is!
*/
	_javascript_test: function() {},


/*
	Tests for a selection of key feature requirements within the browser environment,
	to successfully run the CinsImp application.
*/
	_browser_test: function()
	{
		// at some point we'll have to find out what features CinsImp uses that
		// are worth testing for, and which will successfully exclude crap like IE
		// (or most versions of it)
	},
	
	
/*
	Hides the browser warning if Javascript is enabled and the browser has the required
	features to run the CinsImp application.
*/
	_hide_warning: function()
	{
		var warning = document.getElementById('BrowserWarning');
		warning.style.display = 'none';
	},
	
	
/*

*/
	_script_loaded: function(in_name)
	{
		console.log('Loaded script '+in_name);
		CinsImp._loaded_scripts++;
	},


/*

*/	
	_stylesheet_loaded: function()
	{
		CinsImp._loaded_stylesheets++;
	},
	

/*
	Dynamically loads a Javascript source file.
*/
	load_script: function(in_name)
	{
		var script = document.createElement('script');
		script.type = 'text/javascript';
		//script.addEventListener('load', CinsImp._script_loaded);
		script.src = 'js/'+in_name;
		document.getElementsByTagName('head')[0].appendChild(script);
		CinsImp._count_scripts++;
	},
	

/*
	Dynamically loads a stylesheet source file.
*/
	load_stylesheet: function(in_name)
	{
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.addEventListener('load', CinsImp._stylesheet_loaded);
		link.href = 'css/'+in_name;
		document.getElementsByTagName('head')[0].appendChild(link);
		CinsImp._count_stylesheets++;
	},
	
	
/*
	Dynamically load the HTML dialog and palette templates.
*/
	_load_templates: function()
	{
		var ui_templates = document.createElement('div');
		ui_templates.style.visibility = 'hidden';
		document.body.appendChild(ui_templates);
	
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '?ui=1', true);
		xhr.onreadystatechange= function() 
		{
			if (this.readyState !== 4) return;
			if (this.status !== 200) return;
			ui_templates.innerHTML = this.responseText;
			CinsImp._init2();
		};
		xhr.send();
	},
	

/*
	The third init function - loads the remainder of the CinsImp application.
*/
	_init3: function()
	{
		/* the remainder of the application environment: */
		this.load_stylesheet('override.css');
		this.load_stylesheet('codeedit.css');
		
		this.load_script('application.js');//
		this.load_script('palette.js');//
		this.load_script('popup-menu.js');//
		this.load_script('ajax.js');//
		this.load_script('codeedit.js');//
		this.load_script('cardsize-widg.js');//
		this.load_script('colours.js');//
		
		/* the stack view and authoring: */
		this.load_stylesheet('objects.css');
		
		this.load_script('object.js');//
		this.load_script('field.js');//
		this.load_script('button.js');//
		this.load_script('view.js');//
		
		/* the paint sub-system: */
		this.load_stylesheet('paint.css');
		
		this.load_script('paint.js');//
		
		/* the HyperCard importer: */
		this.load_script('hcimport.js');//
		
		/* start the application once everything is loaded */
		this._when_loaded(function() {
			Application.init();
		});
	},
	

/*
	The second init function - loads the actual CinsImp application scripts and styles
	once the environment has been verified.
*/
	_init2: function()
	{
		/* essentials to show progress and alert boxes: */
		this.load_stylesheet('base.css');
		this.load_stylesheet('widgets.css');
		
		this.load_script('util.js');
		this.load_script('drag.js');
		this.load_script('dialog.js');
		this.load_script('progress.js');
		this.load_script('alert.js');
		
		/* bring up a progress box for the remainder of the loading process: */
		this._when_loaded(function() {
			//Progress.operation_begun('Loading CinsImp application...', true);
			CinsImp._init3();
		});
	},
	

/*
	Start the CinsImp application once all required components have loaded.
*/
	_when_loaded: function(in_action)
	{
		var me = this;
		this._when_loaded_int = setInterval(function() 
		{
			if (me._count_scripts == me._loaded_scripts)//&&me._count_stylesheets == me._loaded_stylesheets
			{
				window.clearInterval(me._when_loaded_int);
				me._when_loaded_int = null;
				in_action();
			}
		}
		, 200);
	},


/*
	The first init function - initialize the environment and run some tests.
*/
	init: function()
	{
		/* check for browser and environment capabilities */
		this._javascript_test();
		this._browser_test();
		CinsImp._hide_warning();
		
		/* load the required components of the CinsImp application */
		this._load_templates();
		//this._init2();
	},

};





