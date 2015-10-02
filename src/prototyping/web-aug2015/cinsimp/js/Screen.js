/*
CinsImp
Management of the screen real-estate

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


function Screen() {}

Screen.ZINDEX_MENU_BASE = 100;
Screen.ZINDEX_DIALOG_BASE = 150;
Screen.ZINDEX_POPUP_BASE = 200;


Screen.init = function()
{
	Screen.contentArea = document.createElement('div');
	Screen.contentArea.className = 'ScreenContentArea';
	
	Screen._west = document.createElement('div');
	Screen._west.className = 'ScreenWestArea';
	
	Screen._stripes = document.createElement('div');
	Screen._stripes.className = 'DiagonalStripes';
	Screen._stripes.style.zIndex = Screen.ZINDEX_MENU_BASE+1;
	
	window.addEventListener('load', Screen._install);
	window.addEventListener('resize', Screen._resized);
	
	Screen._westSize = 0;
	
	Screen.onReady = Array();
	Screen.onResize = Array();
}


Screen._install = function()
{
	document.body.appendChild(Screen.contentArea);
	document.body.appendChild(Screen._west);
	Screen._west.appendChild(Screen._stripes);
	
	Screen._resized();
	
	for (var i = 0; i < Screen.onReady.length; i++)
		if (Screen.onReady[i]) Screen.onReady[i].call();
}


Screen._resized = function()
{
	if (!Screen.contentArea) return;
	
	Screen.contentArea.style.left = Screen._westSize + 'px';
	Screen.contentArea.style.width = (window.innerWidth - Screen._westSize) + 'px';
	Screen.contentArea.style.height = window.innerHeight + 'px';
	
	Screen._west.style.width = Screen._westSize + 'px';
	Screen._west.style.height = window.innerHeight + 'px';
	
	Screen._stripes.style.height = window.innerHeight + 'px';
	
	for (var i = 0; i < Screen.onResize.length; i++)
		if (Screen.onResize[i]) Screen.onResize[i].call();
}


Screen.setWest = function(inSize)
{
	Screen._westSize = inSize;
	Screen._resized();
}


Screen.init();
Screen.setWest(150);

