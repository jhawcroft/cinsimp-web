/*
CinsImp
Javascript Icon Grid

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


function IconGrid(in_container)
{
	this._container = in_container;
	this._container.classList.add('WidgIconGrid');
	
	this._data = [];
	
	this._gridSize = [70,70];
	
	this._cols = Math.floor(this._container.clientWidth / this._gridSize[0]);
	
	this._container.addEventListener('mousedown', this._handle_point.bind(this));
	
	this._selected_cell = null;
	this._icon_id = 0;
	this._icon_name = '';
	
	this.onchange = null;
}


IconGrid.prototype.load_grid = function(in_icons)
{
	this._data = in_icons;

	this._container.innerHTML = '';
	
	var frag = document.createDocumentFragment();
	for (var i = 0; i < in_icons.length; i++)
	{
		var icon_def = in_icons[i];
		
		var icon_box = document.createElement('div');
		icon_box.id = 'WidgIconGrid;' + icon_def[0] + ';' + icon_def[1];
		icon_box.style.width = this._gridSize[0] + 'px';
		icon_box.style.height = this._gridSize[1] + 'px';
		
		var icon_img = document.createElement('img');
		icon_img.src = icon_def[2];
		
		icon_box.appendChild(icon_img);
		frag.appendChild(icon_box);
	}
	
	this._container.appendChild(frag);
}


IconGrid.prototype._handle_point = function(in_event)
{
	if (in_event.target == this._container) return;
	var icon_cell = in_event.target;
	if (icon_cell.tagName == 'IMG') icon_cell = icon_cell.parentElement;
	
	this._select(icon_cell);
}


IconGrid.prototype._handle_selected = function()
{
	this._icon_id = 0;
	this._icon_name = '';
	if (this._selected_cell != null)
	{
		var parts = this._selected_cell.id.split(';');
		this._icon_id = parts[1] * 1;
		this._icon_name = parts[2];
	}
	
	if (this.onchange) this.onchange(this._icon_id, this._icon_name);
}


IconGrid.prototype.get_icon_id = function()
{
	return this._icon_id;
}


IconGrid.prototype.get_icon_name = function()
{
	return this._icon_name;
}


IconGrid.prototype._select_none = function()
{
	if (this._selected_cell)
	{
		this._selected_cell.classList.remove('Selected');
		this._selected_cell = null;
	}
}


IconGrid.prototype._select = function(in_cell)
{
	this._select_none();
	
	in_cell.classList.add('Selected');
	this._selected_cell = in_cell;
	
	this._handle_selected();
}


IconGrid.prototype.set_icon_id = function(in_icon_id)
{
	for (var i = 0; i < this._data.length; i++)
	{
		if (this._data[i][0] == in_icon_id)
		{
			this._select(this._container.children[i]);
			return;
		}
	}
	
	this._select_none();
	this._handle_selected();
}
