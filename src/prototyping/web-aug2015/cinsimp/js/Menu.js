/*
CinsImp
Main menu management and popup menu mechanism

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

function MenuItem(inTitle, inHandler)
{
	this._title = inTitle;
	this._parent = null;
	this.submenu = null;
	this.handler = inHandler;
}


MenuItem.prototype.getTitle = function()
{
	return this._title;
}


MenuItem.prototype._handleAction = function(inEvent)
{
	if (this.submenu)
	{
		this._parent._closeSubmenus();
		itemRect = this._a.getBoundingClientRect();
		this.submenu.open(Array(itemRect.right, itemRect.top));
		
		inEvent.preventDefault();
		inEvent.stopPropagation();
		return;
	}
	
	Menu.closeAll();
	
	if (this.handler) this.handler(this);
	
	inEvent.preventDefault();
	inEvent.stopPropagation();
}


MenuItem.prototype._handleEnter = function(inEvent)
{
	if (this.submenu)
		this._handleAction(inEvent);
	else
		this._parent._closeSubmenus();
	inEvent.preventDefault();
	inEvent.stopPropagation();
}


MenuItem.prototype._installEventHandlers = function()
{
	var me = this;
	this._a.addEventListener('click', function(e) { me._handleAction(e); });
	this._a.addEventListener('mouseenter', function(e) { me._handleEnter(e); });
}


function Menu()
{
	this._div = document.createElement('div');
	this._div.className = 'Menu';
	this._div.style.zIndex = Screen.ZINDEX_MENU_BASE;
	
	this._ul = document.createElement('ul');
	this._ul.className = 'Menu';
	
	this._div.appendChild(this._ul);
	document.body.appendChild(this._div);
	
	this._items = Array();
}


Menu.closeAll = function()
{
	Menu.mainMenu._closeSubmenus();
	/*for (var i = 0; i < Menu._open.length; i++)
	{
		Menu._open[i].close();
	}
	Menu._open = Array();*/
}


Menu.prototype.close = function()
{
	this._closeSubmenus();
	this._div.style.visibility = 'hidden';
	
	for (var i = 0; i < Menu._open.length; i++)
	{
		if (Menu._open[i] == this)
		{
			Menu._open.splice(i,1);
			return;
		}
	}
}


Menu.prototype._closeSubmenus = function()
{
	for (var i = 0; i < this._items.length; i++)
	{
		if (this._items[i].submenu)
			this._items[i].submenu.close();
	}
}


Menu.prototype.open = function(inAtLoc)
{
	//if (this !== Menu.mainMenu)
		//Menu._open.push(this);
		
	this._rebuild();
	
	if (!inAtLoc) inAtLoc = Array(0,0);
	this._div.style.left = inAtLoc[0]+'px';
	this._div.style.top = inAtLoc[1]+'px';
	this._div.style.visibility = 'visible';
}


Menu.prototype._rebuild = function()
{
	this._ul.innerHTML = '';
	for (var i = 0; i < this._items.length; i++)
	{
		item = this._items[i];
		li = document.createElement('li');
		if (item._title.substr(0,1) == '-')
			li.className = 'MenuSeparator';
		else
		{
			li.className = 'MenuItem';
			item._a = document.createElement('a');
			if (item.bold) item._a.style.fontWeight = 'bold';
			item._a.appendChild(document.createTextNode(item._title));
			item._installEventHandlers();
			li.appendChild(item._a);
		}
		this._ul.appendChild(li);
	}
}


Menu.prototype.append = function(inItem)
{
	this._items.push(inItem);
	inItem._parent = this;
	this._rebuild();
}


Menu.init = function()
{
	Menu._open = Array();

	Menu.mainMenu = new Menu();
	Menu.mainMenu.open();
	Menu.mainMenu._div.style.width = Screen._west.clientWidth+'px';
	
	Screen.contentArea.addEventListener('mousedown', Menu.closeAll);
	Screen._west.addEventListener('mousedown', Menu.closeAll);
	
	theMenu = new MenuItem('CinsImp');
	theMenu.bold = true;
	Menu.mainMenu.append(theMenu);
	theMenu.submenu = new Menu();
	theMenu.submenu.append(new MenuItem('About CinsImp', function(inItem) {  }));
	theMenu.submenu.append(new MenuItem('Exit', function(inItem) { 
		CardWindow.main.closeStack(); 
		//window.location.href='/';
		 }));
	
	theMenu = new MenuItem('File');
	Menu.mainMenu.append(theMenu);
	theMenu.submenu = new Menu();
	theMenu.submenu.append(new MenuItem('New Stack', function(inItem) { CardWindow.main.newStack(); }));
	theMenu.submenu.append(new MenuItem('Open Stack...', function(inItem) { Dialog.OpenStack.show(); }));
	//theMenu.submenu.append(new MenuItem('Save a Copy...', function(inItem) { CardWindow.main.saveACopy(); }));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('Protect Stack...', function(inItem) { CardWindow.main.protectStack(); }));
	//theMenu.submenu.append(new MenuItem('Delete Stack...', function(inItem) { CardWindow.main.deleteStack(); }));
	//theMenu.submenu.append(new MenuItem('-'));
	//theMenu.submenu.append(new MenuItem('Page Setup...', function(inItem) {  }));
	//theMenu.submenu.append(new MenuItem('Print Field...', function(inItem) {  }));
	//theMenu.submenu.append(new MenuItem('Print Card', function(inItem) {  }));
	//theMenu.submenu.append(new MenuItem('Print Stack...', function(inItem) {  }));
	//theMenu.submenu.append(new MenuItem('Print Report...', function(inItem) {  }));
	
	theMenu = new MenuItem('Edit');
	Menu.mainMenu.append(theMenu);
	theMenu.submenu = new Menu();
	//theMenu.submenu.append(new MenuItem('Undo'));
	//theMenu.submenu.append(new MenuItem('-'));
	//theMenu.submenu.append(new MenuItem('Cut'));
	//theMenu.submenu.append(new MenuItem('Copy'));
	//theMenu.submenu.append(new MenuItem('Paste'));
	//theMenu.submenu.append(new MenuItem('Delete'));
	//theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('New Card', function(inItem) { CardWindow.main.newCard(); }));
	theMenu.submenu.append(new MenuItem('Delete Card', function(inItem) { CardWindow.main.deleteCard(); }));
	//theMenu.submenu.append(new MenuItem('Cut Card'));
	//theMenu.submenu.append(new MenuItem('Copy Card'));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('Background', function(inItem) { CardWindow.main.toggleEditBkgnd(); }));
	
	theMenu = new MenuItem('Go');
	Menu.mainMenu.append(theMenu);
	theMenu.submenu = new Menu();
	theMenu.submenu.append(new MenuItem('Back', function(inItem) { CardWindow.main.goBack(); }));
	theMenu.submenu.append(new MenuItem('Home', function(inItem) { CardWindow.main.openStack(1); }));
	//theMenu.submenu.append(new MenuItem('Help'));
	//theMenu.submenu.append(new MenuItem('Recent', function(inItem) { CardWindow.main.goRecent(); }));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('First', function(inItem) { CardWindow.main.goFirst(); }));
	theMenu.submenu.append(new MenuItem('Previous', function(inItem) { CardWindow.main.goPrevious(); }));
	theMenu.submenu.append(new MenuItem('Next', function(inItem) { CardWindow.main.goNext(); }));
	theMenu.submenu.append(new MenuItem('Last', function(inItem) { CardWindow.main.goLast(); }));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('Find...', function(inItem) { CardWindow.main.find(); }));
	theMenu.submenu.append(new MenuItem('Message', function(inItem) { CardWindow.main.showMessage(); }));
	
	theMenu = new MenuItem('Tool');
	Menu.mainMenu.append(theMenu);
	theMenu.submenu = new Menu();
	theMenu.submenu.append(new MenuItem('Browse', function(inItem) { CardWindow.main.manager.setTool(CardLayout.TOOL_BROWSE); }));
	theMenu.submenu.append(new MenuItem('Field', function(inItem) { CardWindow.main.manager.setTool(CardLayout.TOOL_FIELD); }));
	theMenu.submenu.append(new MenuItem('Button', function(inItem) { CardWindow.main.manager.setTool(CardLayout.TOOL_BUTTON); }));
	
	theMenu = Menu.objectMenuItem = new MenuItem('Card');
	Menu.mainMenu.append(theMenu);
	theMenu.submenu = new Menu();
	theMenu.submenu.append(new MenuItem('Send to Back', function(inItem) { CardWindow.main.sendToBack(); }));
	theMenu.submenu.append(new MenuItem('Send to Front', function(inItem) { CardWindow.main.sendToFront(); }));
	theMenu.submenu.append(new MenuItem('Send Forward', function(inItem) { CardWindow.main.sendForward(); }));
	theMenu.submenu.append(new MenuItem('Send Back', function(inItem) { CardWindow.main.sendBack(); }));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('Show Tab Order', function(inItem) { CardWindow.main.toggleShowTabOrder(); }));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('New Field', function(inItem) { CardWindow.main.newField(); }));
	theMenu.submenu.append(new MenuItem('New Button', function(inItem) { CardWindow.main.newButton(); }));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('Properties', function(inItem) { CardWindow.main.showProperties(); }));
	theMenu.submenu.append(new MenuItem('Card Properties', function(inItem) { CardWindow.main.showCardProperties(); }));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('Bkgnd Properties', function(inItem) { CardWindow.main.showBkgndProperties(); }));
	theMenu.submenu.append(new MenuItem('New Background', function(inItem) { CardWindow.main.newBackground(); }));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('Stack Properties', function(inItem) { CardWindow.main.showStackProperties(); }));
	
	//theMenu2 = new MenuItem('Resources');
	//theMenu.submenu.append(theMenu2);
	//theMenu2.submenu = new Menu();
	//theMenu2.submenu.append(new MenuItem('Icons'));
	
	theMenu = Menu.objectMenuItem = new MenuItem('Utility');
	Menu.mainMenu.append(theMenu);
	theMenu.submenu = new Menu();
	theMenu.submenu.append(new MenuItem('Message Box', function(inItem) { CardWindow.main.toggleMessageBox(); }));
	theMenu.submenu.append(new MenuItem('-'));
	theMenu.submenu.append(new MenuItem('Tools', function(inItem) { CardWindow.main.toggleTools(); }));
	theMenu.submenu.append(new MenuItem('Colors', function(inItem) { CardWindow.main.toggleColors(); }));
	//theMenu.submenu.append(new MenuItem('Fonts'));
	//theMenu.submenu.append(new MenuItem('Message Watcher'));
	//theMenu.submenu.append(new MenuItem('Variable Watcher'));
	
	//theMenu = new MenuItem('Help');
	//Menu.mainMenu.append(theMenu);
	//theMenu.submenu = new Menu();
	//theMenu.submenu.append(new MenuItem('CinsImp Help'));
	//theMenu.submenu.append(new MenuItem('CinsTalk Reference'));
}


Screen.onReady.push(Menu.init);


