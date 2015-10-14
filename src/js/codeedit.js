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
	this._jce_content.appendChild(this._jce_ta);
	this._jce_ta.className = 'codeedit-text';
	
	this._jce_breakpointList = Array();
	
	this._jce_handleContainerResize();
	this._jce_buildLineNumbers();
	
	this._jce_installEventHandlers();
}


JCodeEdit.prototype._jce_handleContainerResize = function()
{
	this._jce_div.style.width = this._jce_container.clientWidth + 'px';
	this._jce_div.style.height = this._jce_container.clientHeight + 'px';
	
	this._jce_margin.style.height = this._jce_container.clientHeight + 'px';
	this._jce_marginbkgnd.style.height = this._jce_container.clientHeight + 4 + 'px';
	this._jce_content.style.height = this._jce_container.clientHeight + 'px';
	this._jce_ta.style.height = (this._jce_container.clientHeight - 4) + 'px';
	
	this._jce_content.style.width = (this._jce_container.clientWidth - 44) + 'px';
	this._jce_ta.style.width = (this._jce_container.clientWidth - 54) + 'px';
}


JCodeEdit.prototype._jce_buildLineNumbers = function()
{
	var lineNums = '';
	for (var lineNum = 1; lineNum < 15000; lineNum++)
	{
		lineNums = lineNums + '<div class="codeedit-linemark">' + lineNum + '</div><br>';
	}
	this._jce_margin.innerHTML = lineNums;
}


JCodeEdit.prototype._jce_autoScrollMargin = function()
{
	this._jce_margin.style.top = (this._jce_ta.scrollTop * -1) + 'px';
}


JCodeEdit.prototype._jce_marginClick = function(evt)
{
	if (evt.target && (evt.target.className == 'codeedit-linemark'))
	{
		var lineNum = evt.target.textContent.trim() * 1;
		evt.target.className += ' codeedit-breakpoint';
		if (this._jce_breakpointList.indexOf(lineNum) < 0)
			this._jce_breakpointList.push(lineNum);
	}
	else if (evt.target && (evt.target.className == 'codeedit-linemark codeedit-breakpoint'))
	{
		var lineNum = evt.target.textContent.trim() * 1;
		evt.target.className = 'codeedit-linemark';
		idx = this._jce_breakpointList.indexOf(lineNum);
		if (idx >= 0) this._jce_breakpointList.splice(idx, 1);
	}
}


JCodeEdit.prototype._jce_shouldFormatText = function(all)
{
	//alert('Should format text');
	//this._jce_ta.selectionStart++;
	//this._jce_ta.selectionEnd = this._jce_ta.selectionStart + 1;
	
	// need to identify line number of selection
	// save offset
	// save number of preceeding whitespace characters
	
	
	// do the reformat using a custom format handler (language dependent)
	
	
	// move the cursor to the correct line
	// count the now preceeding whitepsace
	// set the cursor positon based on the difference in whitespace
	
	
	
}


JCodeEdit.prototype._jce_checkForSpecialKeys = function(evt)
{
	var keycode = (evt.keyCode ? evt.keyCode :  evt.which);
	if ( ((keycode == 9) || (keycode == 13)) && (!evt.metaKey) )
	{
		this._jce_shouldFormatText((keycode == 9));
		if (keycode == 9) evt.preventDefault();
	}
	else if ((keycode == 13) && evt.metaKey)
	{
		Util.insert_at_cursor(this._jce_ta, '\xAC\r');
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





