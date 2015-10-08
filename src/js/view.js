/*
CinsImp
Stack View

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


function View(in_stack, in_card) 
{
	this._stack = in_stack;
	this._card = in_card;
	this._edit_bkgnd = false;
	this._mode = View.MODE_BROWSE;
	this._tool = View.TOOL_BROWSE;
	this._container = document.getElementById('stackWindow');
	
	this._init_view();
}

View.MODE_BROWSE = 0;
View.MODE_AUTHORING = 1;
View.MODE_PAINTING = 2;

View.TOOL_BROWSE = 1;
View.TOOL_BUTTON = 2;
View.TOOL_FIELD = 3;
View.TOOL_SELECT = 4;
View.TOOL_LASSO = 5;
View.TOOL_PENCIL = 6;
View.TOOL_BRUSH = 7;
View.TOOL_ERASER = 8;
View.TOOL_LINE = 9;
View.TOOL_SPRAY = 10;
View.TOOL_RECTANGLE = 11;
View.TOOL_ROUND_RECT = 12;
View.TOOL_BUCKET = 13;
View.TOOL_OVAL = 14;
View.TOOL_FREE_SHAPE = 15;
View.TOOL_TEXT = 16;
View.TOOL_REG_POLY = 17;
View.TOOL_FREE_POLY = 18;
View.TOOL_EYEDROPPER = 19;


View.prototype._init_view = function()
{
	this._bkgnd_indicator = document.createElement('div');
	this._bkgnd_indicator.className = 'BkgndIndicator';
	this._bkgnd_indicator.style.left = this._container.offsetLeft - 4 + 'px';
	this._bkgnd_indicator.style.top = this._container.offsetTop - 4 + 'px';
	this._bkgnd_indicator.style.width = this._container.clientWidth + 8 + 'px';
	this._bkgnd_indicator.style.height = this._container.clientHeight + 8 + 'px';
	document.body.appendChild(this._bkgnd_indicator);
}


View.prototype._indicate_tool = function(in_tool)
{
	/* clear the current tool indication */
	var img_list = Palette.Tools._root.children[0].children;
	for (var t = 0; t < img_list.length; t++)
	{
		var palette_img = img_list[t].children[0];
		palette_img.src = palette_img.src.replace('hilite', 'normal');
	}
	
	/* set the new tool indication */
	var palette_img = Palette.Tools._root.children[0].children[in_tool - 1].children[0];
	palette_img.src = palette_img.src.replace('normal', 'hilite');
	
	/* change the cursor on the view */
	switch (in_tool)
	{
	case View.TOOL_BROWSE:
		this._container.className = 'CursBrowse';
		break;
	case View.TOOL_BUTTON:
	case View.TOOL_FIELD:
		this._container.className = 'CursAuthor';
		break;
	}
}


View.prototype.choose_tool = function(in_tool)
{
	this._tool = in_tool;
	
	/* determine the mode */
	if (this._tool == View.TOOL_BROWSE) this._mode = this.MODE_BROWSE;
	else if (this._tool == View.TOOL_BUTTON ||
		this._tool == View.TOOL_FIELD) this._mode = this.MODE_AUTHORING;
	else this._mode = this.MODE_PAINTING;
	
	this._indicate_tool(in_tool);
}


View.prototype.edit_bkgnd = function(in_edit_bkgnd)
{
	this._edit_bkgnd = in_edit_bkgnd;
	this._bkgnd_indicator.style.visibility = (this._edit_bkgnd ? 'visible' : 'hidden');
	//document.getElementById('EditBkgndLabel').textContent = (this._edit_bkgnd ? 'Edit Card' : 'Edit Bkgnd');
	
}


View.prototype.is_edit_bkgnd = function()
{
	return this._edit_bkgnd;
}


View.prototype.do_new = function()
{
	alert('New');
}


View.prototype.do_delete = function()
{
	alert('Delete');
}


View.prototype.go_first = function()
{
	alert('First');
}

View.prototype.go_prev = function()
{
	alert('Prev');
}

View.prototype.go_next = function()
{
	alert('Next');
}

View.prototype.go_last = function()
{
	alert('Last');
}


View.prototype.refresh = function()
{
	

	//alert(JSON.stringify(this._card));
}




