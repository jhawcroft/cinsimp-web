/*
CinsImp
Alert dialog

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



function Alert()
{
	this.title = '';
	this.prompt = '';
	this.icon = Alert.ICON_NONE;
	this.button1_label = '';
	this.button1_handler = null;
	this.button2_label = '';
	this.button2_handler = null;
	this.button3_label = '';
	this.button3_handler = null;
}

Alert._current = null;

Alert.ICON_NONE = 0;
Alert.ICON_WARNING = 1;


Alert.prototype.show = function()
{
	var d_prompt = document.getElementById('AlertPrompt');
	
	var d_btn1 = document.getElementById('AlertBtn1');
	var d_btn2 = document.getElementById('AlertBtn2');
	var d_btn3 = document.getElementById('AlertBtn3');
	
	d_prompt.innerHTML = '';
	if (this.icon == Alert.ICON_WARNING)
	{
		var d_icon = document.createElement('img');
		d_icon.src = CinsImp._base + 'gfx/caution-icon.png';
		d_icon.style.width = '64px';
		d_icon.style.verticalAlign = 'top';
		d_icon.style.float = 'left';
		d_icon.style.marginRight = '20px';
		d_prompt.appendChild(d_icon);
		d_prompt.appendChild(document.createTextNode(this.prompt));
		d_prompt.style.width = '540px';
	}
	else
	{
		d_prompt.textContent = this.prompt;
		d_prompt.style.width = '624px';
	}
	//else d_icon.style.display = 'none';
	
	d_btn1.value = this.button1_label;
	d_btn2.value = this.button2_label;
	d_btn2.style.display = (this.button2_label != '' ? 'block' : 'none');
	d_btn3.value = this.button3_label;
	d_btn3.style.display = (this.button3_label != '' ? 'block' : 'none');
	
	Alert._current = this;
	Dialog.Alert.set_title(this.title);
	Dialog.Alert.show();
}


Alert.do_button = function(in_button)
{
	Dialog.dismiss();
	if (!Alert._current) return;
	if (in_button == 1 && Alert._current.button1_handler)
		Alert._current.button1_handler();
	else if (in_button == 2 && Alert._current.button2_handler)
		Alert._current.button2_handler();
	else if (in_button == 3 && Alert._current.button3_handler)
		Alert._current.button3_handler();
}


Alert.network_error = function(in_message)
{
	var alert = new Alert();
	alert.icon = Alert.ICON_WARNING;
	alert.title = 'Network Error';
	alert.prompt = in_message;
	alert.button1_label = 'Cancel';
	alert.show();
}


CinsImp._script_loaded('alert');


