/*
CinsImp
Drag helper utilities; for dragging & resizing DIVs around the webpage

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


function Drag() {}

Drag._gObjResize = null;
Drag._gDragStart = Array(0,0);
Drag._gDragCurrent = Array(0,0);
Drag._gDragInitSz = Array(0,0);


Drag.beginObjectResize = function(e, o)
{
	Drag._gObjResize = o;
	Drag._gDragInitSz = o.getSize();
	
	Drag._gDragStart[0] = e.pageX;
	Drag._gDragStart[1] = e.pageY;
		
	document.addEventListener('mousemove', Drag.handleObjectResize);
	document.addEventListener('mouseup', Drag.endObjectResize);
}


Drag.beginObjectMove = function(e, o)
{
	Drag._gObjResize = o;
	Drag._gDragInitSz = o.getLoc();	
	
	Drag._gDragStart[0] = e.pageX;
	Drag._gDragStart[1] = e.pageY;
	
	document.addEventListener('mousemove', Drag.handleObjectMove);
	document.addEventListener('mouseup', Drag.endObjectMove);
}


Drag.handleObjectResize = function(e)
{
	Drag._gDragCurrent[0] = e.pageX;
	Drag._gDragCurrent[1] = e.pageY;
	
	var deltaX = Drag._gDragCurrent[0] - Drag._gDragStart[0];
	var deltaY = Drag._gDragCurrent[1] - Drag._gDragStart[1];
	
	Drag._gObjResize.setSize(Drag._gDragInitSz[0] + deltaX, Drag._gDragInitSz[1] + deltaY);
}


Drag.handleObjectMove = function(e)
{
	Drag._gDragCurrent[0] = e.pageX;
	Drag._gDragCurrent[1] = e.pageY;
	
	var deltaX = Drag._gDragCurrent[0] - Drag._gDragStart[0];
	var deltaY = Drag._gDragCurrent[1] - Drag._gDragStart[1];
	
	Drag._gObjResize.moveTo(Drag._gDragInitSz[0] + deltaX, Drag._gDragInitSz[1] + deltaY);
}


Drag.endObjectResize = function()
{
	document.removeEventListener('mousemove', Drag.handleObjectResize);
	document.removeEventListener('mouseup', Drag.endObjectResize);
	Drag._gObjResize = null;
}


Drag.endObjectMove = function()
{
	document.removeEventListener('mousemove', Drag.handleObjectMove);
	document.removeEventListener('mouseup', Drag.endObjectMove);
	Drag._gObjResize = null;
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





