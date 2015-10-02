/*
CinsImp
Paint Subsystem

*********************************************************************************
Copyright (c) 2009-2015, Joshua Hawcroft
All rights reserved.

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


function get_page_offset(el) 
{
	el = el.getBoundingClientRect();
	return {
		x: el.left + window.scrollX,
		y: el.top + window.scrollY
	};
}


function get_mouse_coords(in_event)
{
	var element_offset = get_page_offset(in_event.target);
	return { 
		x: in_event.pageX - element_offset.x, 
		y: in_event.pageY - element_offset.y
	};
}


function get_touch_coords(in_event)
{
	var element_offset = get_page_offset(in_event.target);
	if (e.touches.length == 1) // Only deal with one finger/stylus point
	{
		var touch = e.touches[0];
		return {
			x: touch.pageX - element_offset.x,
			y: touch.pageY - element_offset.y
		};
	}
	return false;
}


function PaintSubsystem(in_container)
{
	this._canvas = document.createElement('canvas');
	this._ctx = this._canvas.getContext('2d');
	in_container.appendChild(this._canvas);
	
	this._canvas.style.cursor = 'crosshair';
	
	this._mouse_is_down = false;
	this._tool = PaintSubsystem.TOOL_BRUSH;
	this._color = {
		r: 0,
		g: 0,
		b: 0
	};
	
	var me = this;
	this._canvas.addEventListener('mousedown', function(e) { me._handle_mouse_down(e); });
	this._canvas.addEventListener('mousemove', function(e) { me._handle_mouse_move(e); });
	this._canvas.addEventListener('mouseup', function(e) { me._handle_mouse_up(e); });
	
	this._canvas.addEventListener('touchstart', function(e) { me._handle_touch_start(e); });
	this._canvas.addEventListener('touchmove', function(e) { me._handle_touch_move(e); });
}


PaintSubsystem.TOOL_BRUSH = 1;
PaintSubsystem.TOOL_PENCIL = 2;
PaintSubsystem.TOOL_ERASER = 3;
PaintSubsystem.TOOL_SPRAY = 4;
PaintSubsystem.TOOL_BUCKET = 5;
PaintSubsystem.TOOL_TEXT = 6;
PaintSubsystem.TOOL_LINE = 7;
PaintSubsystem.TOOL_SELECT = 8;
PaintSubsystem.TOOL_LASSO = 9;
PaintSubsystem.TOOL_RECT = 10;
PaintSubsystem.TOOL_ROUND_RECT = 11;
PaintSubsystem.TOOL_OVAL = 12;
PaintSubsystem.TOOL_FREE_SHAPE = 13;
PaintSubsystem.TOOL_REG_POLY = 14;
PaintSubsystem.TOOL_FREE_POLY = 15;


PaintSubsystem.prototype.choose_tool = function(in_tool)
{
	this._tool = in_tool;
	switch (in_tool)
	{
	case PaintSubsystem.TOOL_ERASER:
		this._canvas.style.cursor = 'url(curs-eraser.png), crosshair';
		break;
	default:
		this._canvas.style.cursor = 'crosshair';
	}
}


PaintSubsystem.prototype._draw_brush = function(x, y, size)
{
	this._ctx.fillStyle = "rgba(0,0,0,1)";
	this._ctx.beginPath();
	this._ctx.arc(x, y, size, 0, Math.PI * 2, true);
	this._ctx.closePath();
	this._ctx.fill();
}


PaintSubsystem.prototype._get_pixel = function(x, y)
{
	return this._ctx.getImageData(x, y, 1, 1).data;
}


PaintSubsystem.prototype._set_pixel = function(x, y, r, g, b, a)
{
	this._ctx.fillStyle = 'rgba('+r+','+g+','+b+','+a+')';
	this._ctx.fillRect( x, y, 1, 1 );
}


PaintSubsystem.prototype._clear_pixel = function(x, y)
{
	this._ctx.clearRect( x, y, 1, 1 );
}


PaintSubsystem.prototype._draw_pencil = function(x, y)
{
	var pixel = this._get_pixel(x, y);
	if (pixel[3] == 0)
		this._set_pixel(x, y, this._color.r, this._color.g, this._color.b, 1);
	else if (pixel[0] == this._color.r &&
			pixel[1] == this._color.g &&
			pixel[2] == this._color.b)
		this._clear_pixel(x, y);
	else
		this._set_pixel(x, y, this._color.r, this._color.g, this._color.b, 1);
}


PaintSubsystem.prototype._draw_eraser = function(x, y)
{
	this._ctx.clearRect(x, y, 16, 16);
}


PaintSubsystem.prototype._handle_mouse_down = function(in_event)
{
	var coords = get_mouse_coords(in_event);
	
	//alert(coords.x + ', '+ coords.y);
	
	this._mouse_is_down = true;
	
	if (this._tool == PaintSubsystem.TOOL_PENCIL)
		this._draw_pencil(coords.x, coords.y);
	else if (this._tool == PaintSubsystem.TOOL_ERASER)
		this._draw_eraser(coords.x, coords.y);
	else
		this._draw_brush(coords.x, coords.y, 6);
	
	in_event.preventDefault();
	in_event.stopPropagation();
}


PaintSubsystem.prototype._handle_mouse_move = function(in_event)
{
	var coords = get_mouse_coords(in_event);
	
	if (this._mouse_is_down)
	{
		if (this._tool == PaintSubsystem.TOOL_PENCIL)
			this._draw_pencil(coords.x, coords.y);
		else if (this._tool == PaintSubsystem.TOOL_ERASER)
			this._draw_eraser(coords.x, coords.y);
		else
			this._draw_brush(coords.x, coords.y, 6);
	}

	in_event.preventDefault();
	in_event.stopPropagation();
}


PaintSubsystem.prototype._handle_mouse_up = function(in_event)
{
	this._mouse_is_down = false;

	in_event.preventDefault();
	in_event.stopPropagation();
}


PaintSubsystem.prototype._handle_touch_start = function(in_event)
{
	var coords = get_touch_coords(in_event);
	if (coords === false) return;
	
	this._draw_brush(coords.x, coords.y, 12);
	
	in_event.preventDefault();
	in_event.stopPropagation();
}


PaintSubsystem.prototype._handle_touch_move = function(in_event)
{
	var coords = get_touch_coords(in_event);
	if (coords === false) return;
	
	this._draw_brush(coords.x, coords.y, 12);
	
	in_event.preventDefault();
	in_event.stopPropagation();
}


PaintSubsystem.prototype.set_size = function(in_width, in_height)
{
	this._size = { width: in_width, height: in_height};
	this._canvas.width = in_width;
	this._canvas.height = in_height;
	
	//this._ctx = this._canvas.getContext('2d');
}







