/*
CinsImp
Paint subsystem

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



function _PaintSelection(in_element)
{
	this._element = in_element;
}


_PaintSelection.prototype.get_loc = function()
{
	return [this._element.offsetLeft, this._element.offsetTop];
}


_PaintSelection.prototype.set_loc = function(in_loc)
{
	this._element.style.left = in_loc[0] + 'px';
	this._element.style.top = in_loc[1] + 'px';
}


_PaintSelection.prototype.get_size = function()
{
	return [this._element.clientWidth, this._element.clientHeight];
}


_PaintSelection.prototype.set_size = function(in_size)
{
	this._element.style.width = in_size[0] + 'px';
	this._element.style.height = in_size[1] + 'px';
}


_PaintSelection.prototype.is_zero = function()
{
	return (this._element.clientWidth == 0 && this._element.clientHeight == 0);
}


_PaintSelection.prototype.is_outline = function()
{
	return (this._element.children.length == 0);
}


_PaintSelection.prototype.hide = function()
{
	this._element.style.visibility = 'hidden';
}


_PaintSelection.prototype.show = function()
{
	this._element.style.visibility = 'visible';
}


_PaintSelection.prototype.is_active = function()
{
	return (this._element.style.visibility == 'visible');
}




function Paint(in_container, in_size)
{
	this._container = in_container;
	this._in_paint = false;
	this._size = in_size;
	this._touching = false;
	this._pt_start = [0,0];
	this._pt_end = [0,0];
	this._pt_prev = [0,0];
	this._brush_shape = null;
	this._prev_tool = View.TOOL_BROWSE;
	this._line_size = 1;
	this._dbl_click_check = null;
	
	this.ontoolchange = null;
	this.onchoosebrush = null;
	this.onchooseline = null;
	
	this._init();
	
	var brush = new Image();
	brush.src = 'gfx/brush_mask_1.png';
	this.set_brush(brush);
	
	this._spray_head = new Image();
	this._spray_head.src = 'gfx/spray-head.png';
	
	this._blank_url = this.get_data_png();
}



Paint.prototype._rel_loc = function(in_event)
{
	var loc = [0,0];
	
	if (in_event.pageX)
	{
		loc[0] = in_event.pageX;
		loc[1] = in_event.pageY;
	}
	else
	{
		loc[0] = in_event.touches[0].pageX;
		loc[1] = in_event.touches[0].pageY;
	}
	
	var cr = this._container.getBoundingClientRect();
	loc[0] -= cr.left;
	loc[1] -= cr.top;
	
	return loc;
}


Paint.prototype._page_loc = function(in_event)
{
	if (in_event.pageX)
		return [in_event.pageX, in_event.pageY];
	else
		return [in_event.touches[0].pageX, in_event.touches[0].pageY];
}


Paint.prototype.set_brush = function(in_image)
{
	this._brush_shape = in_image;
}


Paint.prototype._init = function()
{
	var me = this;
	
	this._main = document.createElement('canvas');
	this._main.style.position = 'absolute';
	this._main.style.left = '0px';
	this._main.style.top = '0px';
	this._main.width = this._size[0];
	this._main.height = this._size[1];
	
	this._main.addEventListener('mousedown', function(in_event) { 
		me._touching = true; me._handle_touch_begin(me._page_loc(in_event), me._rel_loc(in_event)); 
		in_event.preventDefault(); in_event.stopPropagation(); });
	this._main.addEventListener('mousemove', function(in_event) { 
		if (!me._touching) return; me._handle_touch_continue(me._page_loc(in_event), me._rel_loc(in_event)); 
		//in_event.preventDefault(); in_event.stopPropagation(); 
		});
	this._main.addEventListener('mouseup', function(in_event) { 
		me._touching = false;  
		//in_event.preventDefault(); in_event.stopPropagation();
		 });
		 
	this._main.addEventListener('touchstart', function(in_event) {
		me._touching = true; me._handle_touch_begin(me._page_loc(in_event), me._rel_loc(in_event)); 
		in_event.preventDefault(); in_event.stopPropagation();
	});
	this._main.addEventListener('touchmove', function(in_event) {
		if (!me._touching) return; me._handle_touch_continue(me._page_loc(in_event), me._rel_loc(in_event)); 
	});
	this._main.addEventListener('touchend', function(in_event) {
		me._touching = false; 
		if (me._poly_layer) me._poly_completion(me._poly_end); 
	});
	
	this._ctx = this._main.getContext('2d');
	this._ctx.clearRect(0, 0, me._size[0], me._size[1]);
	
	this._pastecatcher = document.createElement('div');
	this._pastecatcher.style.cssText = 'opacity: 0; position: fixed; top: 0px; left: 0px; width: 0px; height: 0px; overflow: hidden;';
	this._pastecatcher.contentEditable = true;
	this._pastecatcher.addEventListener('DOMSubtreeModified', this._handle_dom_paste.bind(this));
	document.body.appendChild(this._pastecatcher);
	
	this._selected = document.createElement('div');
	this._selected.className = 'SelectedGfx';
	this._selected.style.visibility = 'hidden';
	
	this._selected.addEventListener('mousedown', this._selection_grab.bind(this));
	this._selected.addEventListener('touchstart', this._selection_grab.bind(this));
	
	this._selection = new _PaintSelection(this._selected);
	
	this._container.appendChild(this._main);
	this._container.appendChild(this._selected);
}


Paint.prototype._selection_finish = function()
{
	if (this._selection.is_zero())
		this._selection.hide();
	//else
		//this.pickup_selection();
}


Paint.prototype.pickup_selection = function()
{
//alert('pickup');
	var loc = this._selection.get_loc();
	var size = this._selection.get_size();
	
	var temp = document.createElement('canvas');
	temp.width = size[0];
	temp.height = size[1];
	var ctx2 = temp.getContext('2d');
	
	ctx2.drawImage(this._main, loc[0]+2, loc[1]+2, size[0], size[1], 0, 0, size[0], size[1]);
	
	var source = temp.toDataURL("image/png");
	var img = document.createElement('img');
	img.src = source;
	
	this._selected.innerHTML = '';
	this._selected.appendChild(img);
	this._selected.style.width = size[0] + 'px';
	this._selected.style.height = size[1] + 'px';
	this._selection.show();
}


Paint.hyp = function(in_a, in_b)
{
	return Math.sqrt( Math.pow(in_a, 2.0) + Math.pow(in_b, 2.0) );
}


Paint.prototype._apply_between = function(in_loc1, in_loc2, in_func)
{
	if (in_loc1[0] == in_loc2[0] &&
		in_loc1[1] == in_loc2[1])
	{
		in_func([in_loc1[0], in_loc1[1]]);
		return;
	}

	var vector = [in_loc2[0] - in_loc1[0], in_loc2[1] - in_loc1[1]];
	var distance = Paint.hyp(vector[0], vector[1]);
   	vector[0] /= distance;
   	vector[1] /= distance;
   
    for (var i = 0; i < distance; i += 1.0) 
    {
    	in_func([in_loc1[0] + i * vector[0], in_loc1[1] + i * vector[1]]);
    }
}


Paint.prototype._apply_eraser = function(in_loc, in_initial)
{
	var me = this;
	this._apply_between(this._pt_prev, this._pt_end, function(in_loc) {
		me._ctx.clearRect(in_loc[0], in_loc[1], 16, 16);
	});
}


Paint.prototype._get_color = function(in_loc, in_with_alpha)
{
	var data = this._ctx.getImageData(in_loc[0], in_loc[1], 1, 1).data;
	if (in_with_alpha) return [data[0], data[1], data[2], data[3]];
	return [data[0], data[1], data[2]]; 
}


Paint.prototype._apply_pencil = function(in_loc, in_initial)
{
	this._pencil_erase = false;
	
	if (in_initial)
	{
		var data = this._ctx.getImageData(in_loc[0], in_loc[1], 1, 1).data;
		if (data[3] != 0 && 
			data[0] == this._color[0] &&
			data[1] == this._color[1] &&
			data[2] == this._color[2])
			this._pencil_erase = true;
		this._ctx.fillStyle = 'rgb('+this._color.join(',')+')';
	}
	
	var me = this;
	if (!this._pencil_erase)
		this._apply_between(this._pt_prev, this._pt_end, function(in_loc) {
			me._ctx.fillRect(in_loc[0] -1, in_loc[1], 1, 1);
		});
	else
		this._apply_between(this._pt_prev, this._pt_end, function(in_loc) {
			me._ctx.clearRect(in_loc[0] -1, in_loc[1], 1, 1);
		});
}


Paint.prototype._apply_brush = function(in_loc, in_initial)
{
	if (in_initial)
	{
		// setup the brush
		this._brush = document.createElement('canvas');
		this._brush.width = this._brush_shape.width;
		this._brush.height = this._brush_shape.height;
		var brush_ctx = this._brush.getContext('2d');
		brush_ctx.drawImage(this._brush_shape, 0, 0);
		brush_ctx.fillStyle = 'rgb('+this._color.join(',')+')';
		brush_ctx.globalCompositeOperation = 'source-in';
		brush_ctx.fillRect(0, 0, this._brush.width, this._brush.height);
	}
	
	var me = this;
	this._apply_between(this._pt_prev, this._pt_end, function(in_loc) {
		me._ctx.drawImage(me._brush, in_loc[0], in_loc[1]);
	});
}


Paint.prototype._apply_spray = function(in_loc, in_initial)
{
	if (in_initial)
	{
		// setup the brush
		this._brush = document.createElement('canvas');
		this._brush.width = this._spray_head.width;
		this._brush.height = this._spray_head.height;
		var brush_ctx = this._brush.getContext('2d');
		brush_ctx.drawImage(this._spray_head, 0, 0);
		brush_ctx.fillStyle = 'rgb('+this._color.join(',')+')';
		brush_ctx.globalCompositeOperation = 'source-in';
		brush_ctx.fillRect(0, 0, this._brush.width, this._brush.height);
	}
	
	this._ctx.drawImage(this._brush, in_loc[0], in_loc[1]);
}


Paint.prototype._redraw_poly = function()
{
	this._poly_ctx.clearRect(0, 0, this._size[0], this._size[1]);
	this._poly_ctx.strokeStyle = 'rgb('+this._color.join(',')+')';
	this._poly_ctx.beginPath();
	this._poly_ctx.moveTo(this._poly_points[0][0], this._poly_points[0][1]);
	for (var p = 1; p < this._poly_points.length; p++)
		this._poly_ctx.lineTo(this._poly_points[p][0], this._poly_points[p][1]);
	this._poly_ctx.lineTo(this._poly_end[0], this._poly_end[1]);
	this._poly_ctx.stroke();
}


Paint.prototype._begin_poly = function(in_loc, in_completion)
{
	this._poly_completion = in_completion;
	this._poly_points = [ [in_loc[0], in_loc[1]] ];
	this._poly_end = [in_loc[0], in_loc[1]];
	
	this._poly_layer = document.createElement('canvas');
	this._poly_layer.className = 'PaintOverlay CursCrosshair';
	this._poly_layer.width = this._container.clientWidth;
	this._poly_layer.height = this._container.clientHeight;
	this._poly_ctx = this._poly_layer.getContext('2d');
	this._container.appendChild(this._poly_layer);
	
	this._poly_ctx.lineWidth = this._line_size;
	
	var me = this;
	this._poly_layer.addEventListener('mousemove', function(in_event) { 
		me._handle_touch_continue(me._page_loc(in_event), me._rel_loc(in_event)); 
	});
	this._poly_layer.addEventListener('mouseup', function(in_event) { me._poly_completion(me._rel_loc(in_event)); });
	this._poly_layer.addEventListener('touchmove', function(in_event) {
		me._handle_touch_continue(me._page_loc(in_event), me._rel_loc(in_event)); 
	});
	this._poly_layer.addEventListener('touchend', function(in_event) { 
		//alert('touchend');
		me._poly_completion(me._rel_loc(in_event)); 
	});
	
	this._redraw_poly();
}


Paint.prototype._end_poly = function()
{
	this._poly_layer.parentElement.removeChild(this._poly_layer);
	this._poly_layer = null;
	this._poly_ctx = null;
	
	this._poly_points.push(this._poly_end);
	
	this._touching = false;
}


Paint.prototype._end_poly_seg = function()
{
	this._poly_points.push(this._poly_end);
}


Paint.prototype._begin_reg_shape = function(in_loc, in_completion)
{
	this._begin_poly(in_loc, in_completion);
}


Paint.prototype._end_reg_shape = function()
{
	this._end_poly();
}


Paint.prototype._stroke_poly = function()
{
	this._ctx.lineWidth = this._line_size;
	this._ctx.strokeStyle = 'rgb('+this._color.join(',')+')';
	this._ctx.beginPath();
	this._ctx.moveTo(this._poly_points[0][0], this._poly_points[0][1]);
	if (this._poly_points.length == 2)
	{
		for (var p = 1; p < this._poly_points.length; p++)
			this._ctx.lineTo(this._poly_points[p][0], this._poly_points[p][1]);
	}
	else
	{
		for (var p = 1; p < this._poly_points.length - 1; p++)
			this._ctx.lineTo(this._poly_points[p][0], this._poly_points[p][1]);
		this._ctx.closePath();
	}
	this._ctx.stroke();
}




Paint.prototype._finish_line = function(in_loc)
{
	this._end_poly();
	this._stroke_poly();
}


Paint.prototype._draw_line = function(in_loc, in_initial)
{
	if (in_initial)
	{
		this._begin_poly(in_loc, this._finish_line.bind(this));
		return;
	}
	
	this._poly_end = [in_loc[0], in_loc[1]];
	this._redraw_poly();
}


Paint.prototype._finish_free_poly = function()
{
	this._poly_end = [this._poly_points[0][0], this._poly_points[0][1]]; // close the shape
	this._end_poly();
	this._stroke_poly();
}


Paint.prototype._finish_free_poly_seg = function(in_loc)
{
	if (Math.abs(in_loc[0] - this._poly_points[0][0]) <= 15 &&
		Math.abs(in_loc[1] - this._poly_points[0][1]) <= 15 &&
		this._poly_points.length > 1)
	{
		this._finish_free_poly();
		return;
	}

	this._end_poly_seg();
	this._redraw_poly();
}


Paint.prototype._draw_free_poly = function(in_loc, in_initial)
{
	if (in_initial)
	{
		this._begin_poly(in_loc, this._finish_free_poly_seg.bind(this));
		return;
	}
	
	this._poly_end = [in_loc[0], in_loc[1]];
	this._redraw_poly();
}


Paint.prototype._finish_free_shape = function(in_loc)
{
	this._poly_end = [this._poly_points[0][0], this._poly_points[0][1]]; // close the shape
	this._end_poly();
	this._stroke_poly();
}


Paint.prototype._draw_free_shape = function(in_loc, in_initial)
{
	if (in_initial)
	{
		this._begin_poly(in_loc, this._finish_free_shape.bind(this));
		return;
	}
	
	this._poly_end = [in_loc[0], in_loc[1]];
	this._end_poly_seg();
	this._redraw_poly();
}


Paint.prototype._reg_shape_rect = function()
{
	return [this._poly_points[0][0], this._poly_points[0][1],
		this._poly_end[0]-this._poly_points[0][0],
		this._poly_end[1]-this._poly_points[0][1]];
}


/*
	Generates a path for an elipse.
	Based on code by Steve Tranby on StackOverflow:
	http://stackoverflow.com/questions/2172798/how-to-draw-an-oval-in-html5-canvas
*/
Paint.prototype._elipse = function(ctx, x, y, w, h)
{
	var kappa = .5522848,
	ox = (w / 2) * kappa, // control point offset horizontal
	oy = (h / 2) * kappa, // control point offset vertical
	xe = x + w,           // x-end
	ye = y + h,           // y-end
	xm = x + w / 2,       // x-middle
	ym = y + h / 2;       // y-middle

	ctx.moveTo(x, ym);
	ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
	ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
	ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
	ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
}


/*
	Generates a path for a round rectangle.
	Based on code by Grumdrig on StackOverflow:
	http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
*/
Paint.prototype._roundrect = function(ctx, x, y, w, h, r)
{
	if (w < 2 * r) r = w / 2;
	if (h < 2 * r) r = h / 2;
	ctx.beginPath();
	ctx.moveTo(x+r, y);
	ctx.arcTo(x+w, y,   x+w, y+h, r);
	ctx.arcTo(x+w, y+h, x,   y+h, r);
	ctx.arcTo(x,   y+h, x,   y,   r);
	ctx.arcTo(x,   y,   x+w, y,   r);
	ctx.closePath();
}


Paint.prototype._finish_reg_shape = function(in_loc)
{
	this._end_reg_shape();
	
	this._ctx.beginPath();
	this._ctx.lineWidth = this._line_size;
	this._ctx.strokeStyle = 'rgb('+this._color.join(',')+')';
	var rect = this._reg_shape_rect();
	switch (this._tool)
	{
	case View.TOOL_RECTANGLE:
		this._ctx.rect(rect[0], rect[1], rect[2], rect[3]);
		break;
	case View.TOOL_OVAL:
		this._elipse(this._ctx, rect[0], rect[1], rect[2], rect[3]);
		break;
	case View.TOOL_ROUND_RECT:
		this._roundrect(this._ctx, rect[0], rect[1], rect[2], rect[3], 10);
		break;
	}
	this._ctx.stroke();
}


Paint.prototype._draw_reg_shape = function(in_loc, in_initial, in_shape)
{
	if (in_initial)
	{
		this._begin_reg_shape(in_loc, this._finish_reg_shape.bind(this));
		return;
	}
	
	this._poly_end = [in_loc[0], in_loc[1]];
	
	this._poly_ctx.clearRect(0, 0, this._size[0], this._size[1]);
	this._poly_ctx.beginPath();
	this._poly_ctx.strokeStyle = 'rgb('+this._color.join(',')+')';
	var rect = this._reg_shape_rect();
	switch (this._tool)
	{
	case View.TOOL_RECTANGLE:
		this._poly_ctx.rect(rect[0], rect[1], rect[2], rect[3]);
		break;
	case View.TOOL_OVAL:
		this._elipse(this._poly_ctx, rect[0], rect[1], rect[2], rect[3]);
		break;
	case View.TOOL_ROUND_RECT:
		this._roundrect(this._poly_ctx, rect[0], rect[1], rect[2], rect[3], 10);
		break;
	}
	this._poly_ctx.stroke();
}



  
Paint.prototype._bucket_match_start_color = function(in_pos)
{
	in_pos = Math.trunc(in_pos);
	var r = this._bucket_pixel_data.data[in_pos];	
	var g = this._bucket_pixel_data.data[in_pos + 1];	
	var b = this._bucket_pixel_data.data[in_pos + 2];
	var a = this._bucket_pixel_data.data[in_pos + 3];
	if (this._bucket_startA == 0)
	{
		return (a == 0);
	}
	return (r == this._bucket_startR && g == this._bucket_startG && b == this._bucket_startB);
}


Paint.prototype._bucket_color_pixel = function(in_pos)
{
	in_pos = Math.trunc(in_pos);
	this._bucket_pixel_data.data[in_pos] = this._color[0];
	this._bucket_pixel_data.data[in_pos + 1] = this._color[1];
	this._bucket_pixel_data.data[in_pos + 2] = this._color[2];
	this._bucket_pixel_data.data[in_pos + 3] = 255;
}


/*
	Flood fill algorithm
	Based upon the algorithm published by William Malone here:
	http://www.williammalone.com/articles/html5-canvas-javascript-paint-bucket-tool/
*/
Paint.prototype._apply_bucket = function(in_loc)
{
	in_loc[0] = Math.round(in_loc[0]); // these need to be integers to work properly on mobile
	in_loc[1] = Math.round(in_loc[1]);

	var pixel = this._get_color(in_loc, true);
	this._bucket_startR = pixel[0];
	this._bucket_startG = pixel[1];
	this._bucket_startB = pixel[2];
	this._bucket_startA = pixel[3];

	this._bucket_pixel_data = this._ctx.getImageData(0, 0, this._size[0], this._size[1]);
	var stack = [ [in_loc[0], in_loc[1]] ];
	var canvas_width = this._size[0];
	var canvas_height = this._size[1];
	
	/* don't try to fill if the active color is the same as the clicked pixel color */
	if (pixel[0] == this._color[0] && pixel[1] == this._color[1] && pixel[2] == this._color[2] && pixel[3] != 0) return;
	
	while (stack.length)
	{
		var newPos, x, y, pixelPos, reachLeft, reachRight;
		newPos = stack.pop();
		x = newPos[0];
		y = newPos[1];

		pixelPos = (y * canvas_width + x) * 4;
		while(y-- >= 0 && this._bucket_match_start_color(pixelPos))
			pixelPos -= canvas_width * 4;
		pixelPos += canvas_width * 4;
		++y;
		reachLeft = false;
		reachRight = false;
		
		while (y++ < canvas_height-1 && this._bucket_match_start_color(pixelPos))
		{
			this._bucket_color_pixel(pixelPos);

			if (x > 0)
			{
				if (this._bucket_match_start_color(pixelPos - 4))
				{
					if (!reachLeft)
					{
						stack.push([x - 1, y]);
						reachLeft = true;
					}
				}
				else if (reachLeft)
					reachLeft = false;
			}

			if (x < canvas_width-1)
			{
				if (this._bucket_match_start_color(pixelPos + 4))
				{
					if(!reachRight)
					{
						stack.push([x + 1, y]);
						reachRight = true;
					}
				}
				else if(reachRight)
					reachRight = false;
			}

			pixelPos += canvas_width * 4;
		}
	}
	
	this._ctx.putImageData(this._bucket_pixel_data, 0, 0);
	this._bucket_pixel_data = null;
}


Paint.prototype._handle_touch_continue = function(in_page_loc, in_rel_loc)
{
	this._pt_prev = [this._pt_end[0], this._pt_end[1]];
	this._pt_end = [in_rel_loc[0], in_rel_loc[1]];
	
	switch (this._tool)
	{
	case View.TOOL_ERASER:
		this._apply_eraser(in_rel_loc, false);
		break;
	case View.TOOL_PENCIL:
		this._apply_pencil(in_rel_loc, false);
		break;
	case View.TOOL_BRUSH:
		this._apply_brush(in_rel_loc, false);
		break;
	case View.TOOL_SPRAY:
		this._apply_spray(in_rel_loc, false);
		break;
		
	case View.TOOL_LINE:
		this._draw_line(in_rel_loc, false);
		break;
	case View.TOOL_FREE_POLY:
		this._draw_free_poly(in_rel_loc, false);
		break;
	case View.TOOL_FREE_SHAPE:
		this._draw_free_shape(in_rel_loc, false);
		break;
	case View.TOOL_RECTANGLE:
	case View.TOOL_OVAL:
	case View.TOOL_ROUND_RECT:
		this._draw_reg_shape(in_rel_loc, false);
		break;
	}
}


Paint.prototype._handle_touch_begin = function(in_page_loc, in_rel_loc)
{
	this._pt_start = [in_rel_loc[0], in_rel_loc[1]];
	this._pt_end = [in_rel_loc[0], in_rel_loc[1]];
	this._pt_prev = [in_rel_loc[0], in_rel_loc[1]];

	this._drop_selection();
	
	switch (this._tool)
	{
	case View.TOOL_SELECT:
		this._selected.innerHTML = '';
		this._selection.set_loc(in_rel_loc);
		this._selection.set_size([0,0]);
		this._selected.style.visibility = 'visible';
		Drag.begin_resize(in_page_loc, [this._selection], null, this._selection_finish.bind(this));
		break;
	
	case View.TOOL_LASSO:
		/* can handle this by: a) allowing the construction of a path,
		b) filling the shape formed by the path, within an offscreen context,
		c) copying the pixels 1-by-1 from the main canvas to the selection canvas
			based on the presence of a non-white pixel in the offscreen context,
			or contained within the lasso path;
		Then selection operates as virtually as normal, even potentially with
		a rectangular outline. */
		break;
	
	case View.TOOL_ERASER:
		this._apply_eraser(in_rel_loc, true);
		break;
	case View.TOOL_PENCIL:
		this._apply_pencil(in_rel_loc, true);
		break;
	case View.TOOL_BRUSH:
		this._apply_brush(in_rel_loc, true);
		break;
	case View.TOOL_SPRAY:
		this._apply_spray(in_rel_loc, true);
		break;
	case View.TOOL_BUCKET:
		this._apply_bucket(in_rel_loc);
		break;
	case View.TOOL_EYEDROPPER:
		this.choose_color(this._get_color(in_rel_loc));
		this.choose_tool(this._prev_tool);
		break;
		
	case View.TOOL_LINE:
		this._draw_line(in_rel_loc, true);
		break;
	case View.TOOL_FREE_POLY:
		this._draw_free_poly(in_rel_loc, true);
		break;
	case View.TOOL_FREE_SHAPE:
		this._draw_free_shape(in_rel_loc, true);
		break;
		
	case View.TOOL_RECTANGLE:
	case View.TOOL_OVAL:
	case View.TOOL_ROUND_RECT:
		this._draw_reg_shape(in_rel_loc, true);
		break;
	}
}


Paint.prototype._drop_selection = function()
{
	if (!this._selection.is_active()) return;
	
	if (this._selected.children.length == 1)
		this._ctx.drawImage(this._selected.children[0], this._selected.offsetLeft + 2, this._selected.offsetTop + 2);
	
	this._selection.hide();
}


Paint.prototype._selection_grab = function(in_event)
{
	if (this._selection.is_outline())
	{
		this.pickup_selection();
		// also erase under the selection
		var loc = this._selection.get_loc();
		var size = this._selection.get_size();
		this._ctx.clearRect(loc[0], loc[1], size[0], size[1]);
	}
	
	Drag.begin_move(this._page_loc(in_event), [this._selection], null, null);
	
	in_event.preventDefault();
	in_event.stopPropagation();
}


Paint.prototype._enter_paint = function()
{
	this._in_paint = true;
	
	this._listeners = [
		this._handle_keydown.bind(this),
		this._handle_keydown.bind(this),
		this._handle_event_paste.bind(this)
		];
	document.addEventListener('keydown', this._listeners[0]);
	document.addEventListener('keyup', this._listeners[1]);
	document.addEventListener('paste', this._listeners[2]);
}


Paint.prototype._exit_paint = function()
{
	this._in_paint = false;
	
	document.removeEventListener('keydown', this._listeners[0]);
	document.removeEventListener('keyup', this._listeners[1]);
	document.removeEventListener('paste', this._listeners[2]);
}


Paint.prototype._handle_keydown = function(in_event)
{
	if (in_event.ctrlKey || in_event.metaKey)
		this._pastecatcher.focus();
}


Paint.prototype._handle_keyup = function(in_event)
{
	
}


Paint.prototype._centre_selection = function()
{
	this._selected.style.left = (this._container.clientWidth - this._selected.clientWidth) / 2 + 'px';
	this._selected.style.top = (this._container.clientHeight - this._selected.clientHeight) / 2 + 'px';
	this._selected.style.width = this._selected.clientWidth + 'px';
	this._selected.style.height = this._selected.clientHeight + 'px';
}


/*
	This receives an image source as the result of a paste or import paint operation.
*/
Paint.prototype._paste_create_image = function(in_source)
{
	if (!in_source) return;
	
	var me = this;
	var img = document.createElement('img');
	img.onload = function()
	{
		me.choose_tool(View.TOOL_SELECT);
		
		me._selected.innerHTML = '';
		me._selected.appendChild(img);
	
		me._selected.style.width = img.clientWidth + 'px';
		me._selected.style.height = img.clientHeight + 'px';
		me._centre_selection();
		me._selected.style.visibility = 'visible';
	}
	img.src = in_source;

	//document.getElementById('PasteCheck').src = in_source;
}


/*
	Allows a direct import by file selection.
*/
Paint.prototype.import_paint = function(in_input_element)
{
	this._paste_create_image(URL.createObjectURL(in_input_element.files[0]));
}


/*
	For browsers such as Firefox, where a pasted image must go into an editable
	content element, we retrieve the pasted image from this element.
*/
Paint.prototype._handle_dom_paste = function()
{
	if (this._pastecatcher.children.length == 1)
	{
		try 
		{
			var source = this._pastecatcher.firstElementChild.src;
			this._paste_create_image(source);
		}
		catch (err) {}
	}
    
    this._pastecatcher.innerHTML = '';
}


/*
	For browsers such as Chrome, which support the HTML5 Clipboard functionality,
	we retrieve the pasted image directly.
*/
Paint.prototype._handle_event_paste = function(in_event)
{
	if (!in_event.clipboardData) 
	{
		window.setTimeout(this._handle_dom_paste.bind(this), 1);
		return;
	}
	
	var items = in_event.clipboardData.items;
	if (!items) return;
	
	for (var i = 0; i < items.length; i++)
	{
		if (items[i].type.indexOf('image') == -1) continue;
		var blob = items[i].getAsFile();
		var url = window.URL || window.webkitURL;
		var source = url.createObjectURL(blob);
		
		this._paste_create_image(source);
		break;
	}
}


Paint.prototype._tool_double_click = function()
{
	switch (this._tool)
	{
	case View.TOOL_ERASER:
		this._ctx.clearRect(0, 0, this._size[0], this._size[1]);
		if (this._prev_tool != this._tool)
			this.choose_tool(this._prev_tool);
		break;
	case View.TOOL_LINE:
		if (this.onchooseline) this.onchooseline();
		if (this._prev_tool != this._tool)
			this.choose_tool(this._prev_tool);
		break;
	case View.TOOL_BRUSH:
		if (this.onchoosebrush) this.onchoosebrush();
		break;
	}
}


Paint.prototype.choose_tool = function(in_tool)
{
	if (this._notifying_tool_change) return;
	
	var dbl_click = false;
	if (this._dbl_click_check)
	{
		window.clearTimeout(this._dbl_click_check);
		this._dbl_click_check = null;
		dbl_click = true;
	}
	var me = this;
	this._dbl_click_check = window.setTimeout(function() { me._dbl_click_check = null; }, 500);
	
	if (this._tool == in_tool) 
	{
		// check for double-click
		if (dbl_click)
			this._tool_double_click();
		return;
	}
	
	if (this._tool != View.TOOL_EYEDROPPER)
		this._prev_tool = this._tool;
	
	this._tool = in_tool;
	if (in_tool == View.TOOL_BROWSE && this._in_paint)
		this._exit_paint();
	else if (in_tool != View.TOOL_BROWSE && (!this._in_paint))
	{
		this._enter_paint();
		this._prev_tool = this._tool;
	}
		
	//if (in_tool == View.TOOL_BROWSE) /* eventually may be able to use other tools within the selection - if it's canvas based */
		this._drop_selection();
		
	this._main.classList.remove('CursCrosshair');
	this._main.classList.remove('CursEraser');
	this._main.classList.remove('CursPencil');
	this._main.classList.remove('CursPaint');
	this._main.classList.remove('CursSpray');
	this._main.classList.remove('CursEyedropper');
	this._main.classList.remove('CursBucket');
	switch (in_tool)
	{
	case View.TOOL_SELECT:
	case View.TOOL_LASSO:
	case View.TOOL_LINE:
	case View.TOOL_RECTANGLE:
	case View.TOOL_ROUND_RECT:
	case View.TOOL_OVAL:
	case View.TOOL_FREE_SHAPE:
	case View.TOOL_REG_POLY:
	case View.TOOL_FREE_POLY:
		this._main.classList.add('CursCrosshair');
		break;
	case View.TOOL_ERASER:
		this._main.classList.add('CursEraser');
		break;
	case View.TOOL_PENCIL:
		this._main.classList.add('CursPencil');
		break;
	case View.TOOL_BRUSH:
		this._main.classList.add('CursPaint');
		break;
	case View.TOOL_SPRAY:
		this._main.classList.add('CursSpray');
		break;
	case View.TOOL_EYEDROPPER:
		this._main.classList.add('CursEyedropper');
		break;
	case View.TOOL_BUCKET:
		this._main.classList.add('CursBucket');
		break;
	}
	
	this._notifying_tool_change = true;
	try {
		if (this.ontoolchange)
			this.ontoolchange(this._tool);
	}
	catch (err) {}
	this._notifying_tool_change = false;
}


Paint.prototype.choose_color = function(in_color)
{
	this._color = in_color;
	
}


Paint.prototype.set_line_size = function(in_size)
{
	this._line_size = in_size;
}


Paint.prototype.get_data_png = function()
{
	var source = this._main.toDataURL();
	if (this._blank_url && this._blank_url == source) return '';
	return source;
}


Paint.prototype.set_data_png = function(in_data)
{
	if (in_data == '')
	{
		this._ctx.clearRect(0, 0, this._size[0], this._size[1]);
		return;
	}
	var temp = new Image();
	var me = this;
	temp.onload = function()
	{
		me._ctx.clearRect(0, 0, me._size[0], me._size[1]);
		me._ctx.drawImage(this, 0, 0);
	};
	temp.src = in_data;
}





