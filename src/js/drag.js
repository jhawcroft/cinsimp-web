/*
CinsImp
Drag and resize helper utilities

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


function Drag() {}

Drag._gObjResize = null;
Drag._gDragStart = Array(0,0);
Drag._gDragCurrent = Array(0,0);
Drag._gDragInitSz = Array(0,0);




Drag._objects = [];
Drag._begin = [0,0];
Drag._curr = [0,0];
Drag._snap_handler = null;


Drag._snap_guide_x = null;
Drag._snap_guide_y = null;


Drag._init_snap_guides = function()
{
	if ((!Drag._snap_guide_x) || (!Drag._snap_guide_y))
	{
		Drag._snap_guide_x = document.createElement('div');
		Drag._snap_guide_x.className = 'SnapGuide';
		document.getElementById('stackWindow').appendChild(Drag._snap_guide_x);
		Drag._snap_guide_y = document.createElement('div');
		Drag._snap_guide_y.className = 'SnapGuide';
		document.getElementById('stackWindow').appendChild(Drag._snap_guide_y);
	}
	
	Drag._snap_guide_x.style.top = '1px';
	Drag._snap_guide_x.style.width = '1px';
	Drag._snap_guide_x.style.height = window.innerHeight + 'px';
	
	Drag._snap_guide_y.style.left = '1px';
	Drag._snap_guide_y.style.height = '1px';
	Drag._snap_guide_y.style.width = window.innerWidth + 'px';
}


Drag._hide_snap_guides = function()
{
	Drag._snap_guide_x.style.visibility = 'hidden';
	Drag._snap_guide_y.style.visibility = 'hidden';
}


Drag._show_snap_guides = function(in_snapped, in_new_loc)
{
	Drag._hide_snap_guides();
	if (in_snapped[0] != 0)
	{
		Drag._snap_guide_x.style.left = in_new_loc[0] + 'px';
		Drag._snap_guide_x.style.visibility = 'visible';
	}
	if (in_snapped[1] != 0)
	{
		Drag._snap_guide_y.style.top = in_new_loc[1] + 'px';
		Drag._snap_guide_y.style.visibility = 'visible';
	}
}



Drag.begin_move = function(in_coords, in_objects, in_snap_handler)
{
	Drag._snap_handler = in_snap_handler;
	Drag._init_snap_guides();

	Drag._objects.length = in_objects.length;
	for (var o = 0; o < in_objects.length; o++)
	{
		var obj = in_objects[o];
		Drag._objects[o] = [ obj, obj.get_loc(), obj.get_size() ];
	}
	
	Drag._begin = [in_coords[0], in_coords[1]];
	
	document.addEventListener('mousemove', Drag._handle_move);
	document.addEventListener('mouseup', Drag._end_move);
	
	document.addEventListener('touchmove', Drag._handle_move);
	document.addEventListener('touchend', Drag._end_move);
}


Drag.begin_resize = function(in_coords, in_objects, in_snap_handler)
{
	Drag._snap_handler = in_snap_handler;
	Drag._init_snap_guides();
	
	Drag._objects.length = in_objects.length;
	for (var o = 0; o < in_objects.length; o++)
	{
		var obj = in_objects[o];
		Drag._objects[o] = [ obj, obj.get_size(), obj.get_loc() ];
	}
	
	Drag._begin = [in_coords[0], in_coords[1]];
	
	document.addEventListener('mousemove', Drag._handle_resize);
	document.addEventListener('mouseup', Drag._end_resize);
	
	document.addEventListener('touchmove', Drag._handle_resize);
	document.addEventListener('touchend', Drag._end_resize);
}


Drag._handle_move = function(in_event)
{
	Drag._curr = [(in_event.pageX || in_event.touches[0].pageX), 
		(in_event.pageY || in_event.touches[0].pageY)];
	var deltaX = Drag._curr[0] - Drag._begin[0];
	var deltaY = Drag._curr[1] - Drag._begin[1];
	
	for (var o = 0; o < Drag._objects.length; o++)
	{
		var rec = Drag._objects[o];
		var new_loc = [ rec[1][0] + deltaX, rec[1][1] + deltaY ];
		if (Drag._snap_handler)
		{
			var did_snap = [0,0];
			Drag._snap_handler(rec[0], new_loc, false, did_snap); // consider both left-top and right-bottom of object
			
			var snap_loc = [new_loc[0], new_loc[1]];
			if (did_snap[0] > 0) snap_loc[0] += rec[2][0];
			if (did_snap[1] > 0) snap_loc[1] += rec[2][1];
			Drag._show_snap_guides(did_snap, snap_loc);
		}
		rec[0].set_loc(new_loc);
	}
	
	in_event.preventDefault();
	in_event.stopPropagation();
}


Drag._handle_resize = function(in_event)
{
	Drag._curr = [(in_event.pageX || in_event.touches[0].pageX), 
		(in_event.pageY || in_event.touches[0].pageY)];
	var deltaX = Drag._curr[0] - Drag._begin[0];
	var deltaY = Drag._curr[1] - Drag._begin[1];
	
	for (var o = 0; o < Drag._objects.length; o++)
	{
		var rec = Drag._objects[o];
		var new_size = [ rec[1][0] + deltaX, rec[1][1] + deltaY ];
		if (Drag._snap_handler)
		{
			var rb_loc = [new_size[0] + rec[2][0], new_size[1] + rec[2][1]];
			var new_loc = [rb_loc[0], rb_loc[1]];
			var did_snap = [0,0];
			Drag._snap_handler(rec[0], new_loc, true, did_snap); // only consider right-bottom of object
			new_size[0] += new_loc[0] - rb_loc[0];
			new_size[1] += new_loc[1] - rb_loc[1];
			Drag._show_snap_guides(did_snap, new_loc);
		}
		rec[0].set_size(new_size);
	}
	
	in_event.preventDefault();
	in_event.stopPropagation();
}


Drag._end_move = function(in_event)
{
	Drag._hide_snap_guides();
	
	document.removeEventListener('mousemove', Drag._handle_move);
	document.removeEventListener('mouseup', Drag._end_move);
	
	document.removeEventListener('touchmove', Drag._handle_move);
	document.removeEventListener('touchend', Drag._end_move);
	
	Drag._objects.length = 0;
	
	in_event.preventDefault();
	in_event.stopPropagation();
}


Drag._end_resize = function(in_event)
{
	Drag._hide_snap_guides();
	
	document.removeEventListener('mousemove', Drag._handle_resize);
	document.removeEventListener('mouseup', Drag._end_resize);
	
	document.removeEventListener('touchmove', Drag._handle_resize);
	document.removeEventListener('touchend', Drag._end_resize);
	
	Drag._objects.length = 0;
	
	in_event.preventDefault();
	in_event.stopPropagation();
}




Drag.beginObjectResize = function(e, o)
{
	Drag._gObjResize = o;
	Drag._gDragInitSz = o.getSize();
	
	Drag._gDragStart[0] = (e.pageX || e.touches[0].pageX);
	Drag._gDragStart[1] = (e.pageY || e.touches[0].pageY);
		
	document.addEventListener('mousemove', Drag.handleObjectResize);
	document.addEventListener('mouseup', Drag.endObjectResize);
	
	document.addEventListener('touchmove', Drag.handleObjectResize);
	document.addEventListener('touchend', Drag.endObjectResize);
}


Drag.beginObjectMove = function(e, o)
{
	Drag._gObjResize = o;
	Drag._gDragInitSz = o.getLoc();	
	
	Drag._gDragStart[0] = (e.pageX || e.touches[0].pageX);
	Drag._gDragStart[1] = (e.pageY || e.touches[0].pageY);
	
	document.addEventListener('mousemove', Drag.handleObjectMove);
	document.addEventListener('mouseup', Drag.endObjectMove);
	
	document.addEventListener('touchmove', Drag.handleObjectMove);
	document.addEventListener('touchend', Drag.endObjectMove);
}


Drag.handleObjectResize = function(e)
{
	Drag._gDragCurrent[0] = (e.pageX || e.touches[0].pageX);
	Drag._gDragCurrent[1] = (e.pageY || e.touches[0].pageY);
	
	var deltaX = Drag._gDragCurrent[0] - Drag._gDragStart[0];
	var deltaY = Drag._gDragCurrent[1] - Drag._gDragStart[1];
	
	Drag._gObjResize.setSize([Drag._gDragInitSz[0] + deltaX, Drag._gDragInitSz[1] + deltaY]);
	
	e.preventDefault();
	e.stopPropagation();
}


Drag.handleObjectMove = function(e)
{
	Drag._gDragCurrent[0] = (e.pageX || e.touches[0].pageX);
	Drag._gDragCurrent[1] = (e.pageY || e.touches[0].pageY);
	
	var deltaX = Drag._gDragCurrent[0] - Drag._gDragStart[0];
	var deltaY = Drag._gDragCurrent[1] - Drag._gDragStart[1];
	
	Drag._gObjResize.setLoc([Drag._gDragInitSz[0] + deltaX, Drag._gDragInitSz[1] + deltaY]);
	
	e.preventDefault();
	e.stopPropagation();
}


Drag.endObjectResize = function(e)
{
	document.removeEventListener('mousemove', Drag.handleObjectResize);
	document.removeEventListener('mouseup', Drag.endObjectResize);
	
	document.removeEventListener('touchmove', Drag.handleObjectResize);
	document.removeEventListener('touchend', Drag.endObjectResize);
	
	Drag._gObjResize = null;
	
	e.preventDefault();
	e.stopPropagation();
}


Drag.endObjectMove = function(e)
{
	document.removeEventListener('mousemove', Drag.handleObjectMove);
	document.removeEventListener('mouseup', Drag.endObjectMove);
	
	document.removeEventListener('touchmove', Drag.handleObjectMove);
	document.removeEventListener('touchend', Drag.endObjectMove);
	
	Drag._gObjResize = null;
	
	e.preventDefault();
	e.stopPropagation();
}





Drag.handleMouseMove = function(e)
{
	Drag._gDragCurrent[0] = e.pageX;
	Drag._gDragCurrent[1] = e.pageY;
}


Drag.currentMouseLoc = function()
{
	return Drag._gDragCurrent;
}


Drag.init = function()
{
	document.addEventListener('mousemove', Drag.handleMouseMove);
}
Drag.init();





