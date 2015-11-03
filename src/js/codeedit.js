/*
CinsImp
Javascript Code Editor

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



function JCodeEdit(containerElement)
{
	

	this._jce_container = containerElement;
	
	this._jce_div = document.createElement('div');
	this._jce_container.appendChild(this._jce_div);
	this._jce_div.className = 'codeedit';
	
	this._jce_marginbkgnd = document.createElement('div');
	this._jce_div.appendChild(this._jce_marginbkgnd);
	this._jce_marginbkgnd.className = 'codeedit-margin';
	
	this._jce_margin = document.createElement('div');
	this._jce_div.appendChild(this._jce_margin);
	this._jce_margin.className = 'codeedit-linenums';
	
	this._jce_content = document.createElement('div');
	this._jce_div.appendChild(this._jce_content);
	this._jce_content.className = 'codeedit-content';
	
	this._jce_ta = document.createElement('textarea');
	this._jce_ta.autocorrect = 'off';
	this._jce_ta.autocomplete = 'off';
	this._jce_ta.autocapitalize = 'off';
	this._jce_ta.spellcheck = false;
	this._jce_content.appendChild(this._jce_ta);
	this._jce_ta.className = 'codeedit-text';
	
	this._jce_breakpointList = Array();
	
	this._jce_handleContainerResize();
	this._jce_buildLineNumbers();
	
	this._jce_installEventHandlers();
}


JCodeEdit.prototype.focus = function()
{
	this._jce_ta.focus();
}


JCodeEdit.prototype.set_script = function(in_script, in_selection)
{
	this._jce_ta.value = in_script;
	this._jce_buildLineNumbers();
	if (in_selection !== undefined) this.set_selection(in_selection);
}


JCodeEdit.prototype.get_script = function()
{
	return this._jce_ta.value;
}


JCodeEdit.prototype.set_selection = function(in_selection)
{
	this._jce_ta.selectionStart = in_selection;
	this._jce_ta.selectionEnd = in_selection;
}


JCodeEdit.prototype._jce_handleContainerResize = function()
{
	this._jce_div.style.width = this._jce_container.clientWidth + 'px';
	this._jce_div.style.height = this._jce_container.clientHeight + 'px';
	
	this._jce_margin.style.height = this._jce_container.clientHeight + 'px';
	this._jce_marginbkgnd.style.height = this._jce_container.clientHeight + 4 + 'px';
	this._jce_content.style.height = this._jce_container.clientHeight + 'px';
	this._jce_ta.style.height = (this._jce_container.clientHeight - 4) + 'px';
	
	this._jce_content.style.width = (this._jce_container.clientWidth - 24) + 'px';
	this._jce_ta.style.width = (this._jce_container.clientWidth - 32) + 'px';
}


JCodeEdit.prototype._jce_buildLineNumbers = function()
{
	var line_count = this._jce_ta.value.split("\n").length;
	var margin_line_count = this._jce_margin.childNodes.length;
	
	if (line_count > margin_line_count)
	{
		for (var num = margin_line_count + 1; num <= line_count; num++)
		{
			var element = document.createElement('div');
			element.appendChild(document.createTextNode('  '));//num'  '
			this._jce_margin.appendChild(element);
		}
	}
}


JCodeEdit.prototype._jce_autoScrollMargin = function()
{
	this._jce_margin.style.top = (this._jce_ta.scrollTop * -1) + 'px';
}


JCodeEdit.prototype._jce_marginClick = function(evt)
{
	if (!evt.target) return;
	if (evt.target == this._jce_margin) return;
	var lineNum = evt.target.textContent.trim() * 1;
	if (!evt.target.classList.contains('breakpoint'))
	{
		evt.target.classList.add('breakpoint');
		evt.target.style.backgroundImage = 'url(\''+CinsImp._base+'gfx/bp-tick.png\')';
		if (this._jce_breakpointList.indexOf(lineNum) < 0)
			this._jce_breakpointList.push(lineNum);
	}
	else
	{
		evt.target.classList.remove('breakpoint');
		evt.target.style.backgroundImage = 'none';
		idx = this._jce_breakpointList.indexOf(lineNum);
		if (idx >= 0) this._jce_breakpointList.splice(idx, 1);
	}
}


JCodeEdit.prototype._jce_indent_code = function(in_text, in_indent)
{
	// on<space>
	// end<space>
	// repeat<space/eol>
	// if<space>
	// <space/eol>then<space/eol>
	// <space/eol>else<space/eol>
	
	// also need to strip off comment -- at end of line for word checks
	
	// begin a block:
	// ... then<eol>
	// else ... then<eol>
	// else<eol> 
	
	// [...] then ...  (no block)
	// 
	// problem is that these things work on proximity, so
	// without the parser, it's very difficult
	// may still end up porting the parser function from the previous attempt
	
	var SPACE = '                                                                      ';
	var SPACE_FACTOR = 2;
	
	var LEVEL_SCRIPT = 0;
	var LEVEL_HANDLER_COMMAND = 1;
	var LEVEL_HANDLER_FUNCTION = 2;
	var LEVEL_LOOP = 3;
	var LEVEL_IF = 4;
	
	var level = 0;
	var indent_stack = [
		[ LEVEL_SCRIPT ]
	];
	
	var lines = (in_text + ' ').split("\n");
	in_text = '';
	
	for (var l = 0; l < lines.length; l++)
	{
		var line = lines[l].trim();
		var words = line.split(/[\s]+/);
		
		var first = words[0].toLowerCase();
		if (first == 'on' || first == 'function')
		{
			lines[l] = SPACE.substr(0, level * SPACE_FACTOR + in_indent) + line;
			level ++;
			indent_stack.push( [ (first == 'on' ? LEVEL_HANDLER_COMMAND : LEVEL_HANDLER_FUNCTION) ] );
		}
		else if (first == 'end')
		{
			level --;
			indent_stack.pop();
			lines[l] = SPACE.substr(0, level * SPACE_FACTOR + in_indent) + line;
		}
		else if (first == 'repeat')
		{
			lines[l] = SPACE.substr(0, level * SPACE_FACTOR + in_indent) + line;
			level ++;
			indent_stack.push( [ LEVEL_LOOP ] );
		}
		else if (first == 'if')
		{
			lines[l] = SPACE.substr(0, level * SPACE_FACTOR + in_indent) + line;
			level ++;
			indent_stack.push( [ LEVEL_IF ] );
		}
		else if (first == 'else')
		{
			level --;
			indent_stack.pop
			lines[l] = SPACE.substr(0, level * SPACE_FACTOR + in_indent) + line;
			level ++;
			indent_stack.push( [ LEVEL_LOOP ] );
		}
		else
			lines[l] = SPACE.substr(0, level * SPACE_FACTOR + in_indent) + line;
	}
	
	in_text = lines.join("\n");
	
	return in_text;
}


JCodeEdit.prototype.reformat = function()
{
	this._jce_shouldFormatText(true);
}


JCodeEdit.prototype._jce_shouldFormatText = function(all)
{
	/* grab the original incorrectly formatted code */
	var text = this._jce_ta.value;
	
	/* save the selected line (sl) and offset to the selection (lo);
	also count the current spaces of indent on the selected line */
	var ss = this._jce_ta.selectionStart;
	var prior_lines = text.substr(0, ss).split('\n');
	var sl = prior_lines.length;
	var lo = prior_lines[sl-1].length;
	var oi = prior_lines[sl-1].match(/^\s*/)[0].length; // possibly should be counting non-truncated
	prior_lines = null;
	
	/* reformat all the code */
	var text = this._jce_indent_code(text, 0);
	this._jce_ta.value = text;
	
	/* reset the selection to where it was prior to formatting */
	var lines = text.split('\n');
	var line_offset = 0;
	for (var l = 1; l < sl; l++)
		line_offset += lines[l-1].length + 1;
	var ni = lines[sl-1].match(/^\s*/)[0].length;
	
	line_offset += lo - oi + ni;
	
	this._jce_ta.selectionStart = line_offset;
	this._jce_ta.selectionEnd = line_offset;
	
}


JCodeEdit.prototype._jce_checkForSpecialKeys = function(evt)
{
	var keycode = (evt.keyCode ? evt.keyCode :  evt.which);
	if (keycode == 9)
	{
		this._jce_buildLineNumbers();
		this._jce_shouldFormatText(true);
		evt.preventDefault();
	}
	else if (keycode == 13)
	{
		if (evt.metaKey)
			Util.insert_at_cursor(this._jce_ta, '\xAC\n');
		else
			Util.insert_at_cursor(this._jce_ta, '\n');
		this._jce_buildLineNumbers();
		this._jce_shouldFormatText(false);
		evt.preventDefault();
	}
}



JCodeEdit.prototype._jce_installEventHandlers = function()
{
	var ce = this;
	
	this._jce_ta.onkeydown = function(evt) { ce._jce_checkForSpecialKeys(evt); };
	this._jce_ta.onkeyup = function() { ce._jce_autoScrollMargin(); }
	this._jce_ta.onmousedown = function() { ce._jce_autoScrollMargin(); };
	this._jce_ta.onscroll = function() { ce._jce_autoScrollMargin(); };
	this._jce_ta.onblur = function() { ce._jce_autoScrollMargin(); };
	this._jce_ta.onfocus = function() { ce._jce_autoScrollMargin(); };
	this._jce_ta.onmouseover = function() { ce._jce_autoScrollMargin(); };
	
	this._jce_margin.onmousedown = function(evt) { ce._jce_marginClick(evt); };
}



CinsImp._script_loaded('codeedit');



