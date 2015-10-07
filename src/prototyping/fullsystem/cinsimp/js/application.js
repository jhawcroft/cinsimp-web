/*
CinsImp
Application Controller

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


function Application() {}

Application._stack = null; 

// must wait for all CSS to load BEFORE 
// initalizing the application & it's resources, otherwise we'll get weird palettes
// and other issues


Application.showStackInfo = function()
{
	//alert(JSON.stringify(Application._initialStackData));
	
	try
	{
		document.getElementById('StackInfoName').value = Application._stack.stack_name;
		document.getElementById('StackInfoWhere').innerHTML = 'Where: '+Application._stack.stack_path;
		
		document.getElementById('StackInfoCardCount').innerHTML = 'Stack contains '+
			(Application._stack.count_cards == 1 ? 
			Application._stack.count_cards+' card.' :
			Application._stack.count_cards+' cards.');
		document.getElementById('StackInfoBkgndCount').innerHTML = 'Stack contains '+
			(Application._stack.count_bkgnds == 1 ? 
			Application._stack.count_bkgnds+' background.' :
			Application._stack.count_bkgnds+' backgrounds.');
		
		document.getElementById('StackInfoSize').innerHTML = 'Size of stack: ' + 
			Util.niceSize(Application._stack.stack_size);
		document.getElementById('StackInfoFree').innerHTML = 'Free in stack: ' + 
			Util.niceSize(Application._stack.stack_free);
		
		document.getElementById('StackInfoCardSize').innerHTML = 'Card size: ' +
			Application._stack.card_width + ' x ' +
			Application._stack.card_height;
	}
	catch (e) {}
	
	Dialog.StackInfo.show();
}


Application.setDefaultPositions = function(in_card_width, in_card_height)
{
	Palette.Navigator.setLoc([20, in_card_height + 40]);
	Palette.Authoring.setLoc([20, in_card_height + 40 + Palette.Navigator._div.clientHeight + 2]);
	Palette.Tools.setLoc([in_card_width + 40, 50]);
	Palette.Colours.setLoc([in_card_width + 45, 50 + Palette.Tools._div.clientHeight + 14]);
}


Application.handleSaveStackInfo = function()
{
	Dialog.dismiss();
}

Application.handleSaveCardSize = function()
{
	Dialog.dismiss();
}



