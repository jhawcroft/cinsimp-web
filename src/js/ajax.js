/*
CinsImp
Asynchronous Client-Server Request Handler

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


function Ajax() {}
Ajax._url = '';
Ajax._timeout = 0;
Ajax._timeoutVar = null;
Ajax._ajaxRequest = null;



Ajax.init = function(url, timeout)
{
	Ajax._url = url;
	Ajax._timeout = timeout;
}


Ajax.send = function(msg, responseHandler)
{
	if (Ajax._ajaxRequest)
	{
		responseHandler('Internal error (Ajax adapter already in-use)', 'in-use');
		return;
	}

	Ajax._timeoutVar = setTimeout(function() { Ajax._handleTimeout(); }, Ajax._timeout * 1000);
	Ajax._responseHandler = responseHandler;
	
	msg = JSON.stringify(msg);
	//alert(msg);
	
	Ajax._ajaxRequest = new XMLHttpRequest();
	Ajax._ajaxRequest.open('POST', Ajax._url, true);
	Ajax._ajaxRequest.setRequestHeader('Content-type', 'application/json');
	Ajax._ajaxRequest.setRequestHeader('Content-length', msg.length);
	Ajax._ajaxRequest.setRequestHeader('Connection', 'close');

	Ajax._ajaxRequest.onreadystatechange = function() { Ajax._handleEvent(); };
	Ajax._ajaxRequest.send(msg);
}


Ajax._handleEvent = function()
{
	if (!Ajax._ajaxRequest) return;
	if ((Ajax._ajaxRequest.readyState == 4) && (Ajax._ajaxRequest.status == 200)) 
	{
		msg = null;
		status = 'ok';
		try {
			msg = JSON.parse(Ajax._ajaxRequest.responseText);
			if (msg.cmd == 'error')
			{
				status = 'error';
				msg = msg.msg;
			}
		}
		catch (err) {
			status = 'json-malformed';
			msg = 'Malformed server response (JSON)';
		}
		clearTimeout(Ajax._timeoutVar);
		Ajax._ajaxRequest = null;
		rh = Ajax._responseHandler;
		Ajax._responseHandler = null;
		if (rh) rh(msg, status);
	}
	else if (Ajax._ajaxRequest.readyState == 4)
	{
		msg = 'Server error ('+Ajax._ajaxRequest.status+')';
		status = 'error';
		clearTimeout(Ajax._timeoutVar);
		Ajax._ajaxRequest = null;
		rh = Ajax._responseHandler;
		Ajax._responseHandler = null;
		if (rh) rh(msg, status);
	}
}


Ajax._handleTimeout = function()
{
	if (Ajax._responseHandler)
	{
		//if (Ajax._ajaxRequest) Ajax._ajaxRequest.close();
		Ajax._ajaxRequest = null;
		Ajax._responseHandler(null, 'timeout');
	}
}


Ajax.init(gBase+'?io=1', 5);


CinsImp._script_loaded('ajax');

