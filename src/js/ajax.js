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


Ajax._do_error_msg = function(in_title, in_message, in_handler)
{
	var alert = new Alert();
	alert.icon = Alert.ICON_WARNING;
	alert.title = in_title;
	alert.prompt = in_message;
	alert.button1_label = 'Cancel';
	alert.button1_handler = function() { 
		if (!in_handler) return;
		in_handler({ cmd: 'error', 'msg': in_title + ': ' + in_message }); 
	};
	alert.show();
}


Ajax.request = function(in_msg, in_handler, in_timeout)
{
//alert('r');

	if (Ajax._ajaxRequest)
		return Ajax._do_error_msg('Internal Error', 'Ajax adapter already in use.', in_handler);
	
	Ajax._timeoutVar = window.setTimeout(Ajax._handle_timeout, 
		(in_timeout ? in_timeout * 1000 : Ajax._timeout * 1000));
	Ajax._responseHandler = in_handler;
	Ajax._cmd = in_msg.cmd;
	
	var in_msg = JSON.stringify(in_msg);
	
	Ajax._ajaxRequest = new XMLHttpRequest();
	Ajax._ajaxRequest.open('POST', Ajax._url, true);
	Ajax._ajaxRequest.setRequestHeader('Content-type', 'application/json');
	Ajax._ajaxRequest.setRequestHeader('Content-length', in_msg.length);
	Ajax._ajaxRequest.setRequestHeader('Connection', 'close');

	Ajax._ajaxRequest.onreadystatechange = Ajax._handle_reply;
	Ajax._ajaxRequest.send(in_msg);
}


Ajax._handle_timeout = function()
{
	if (Ajax._responseHandler)
	{
		Ajax._ajaxRequest = null;
		Ajax._do_error_msg('Network Error', 'Request timed out.', Ajax._responseHandler);
	}
}


Ajax._handle_reply = function()
{
	if (!Ajax._ajaxRequest) return;
	
	var handler = Ajax._responseHandler;
	
	if ((Ajax._ajaxRequest.readyState == 4) && (Ajax._ajaxRequest.status == 200)) 
	{
		var msg = Ajax._ajaxRequest.responseText;
		
		window.clearTimeout(Ajax._timeoutVar);
		Ajax._ajaxRequest = null;
		Ajax._responseHandler = null;
		
		try { msg = JSON.parse(msg); }
		catch (err) 
		{
			Ajax._do_error_msg('Server Error', 'Malformed server response.', handler);
			return;
		}
		
		if (msg.cmd == 'error')
		{
			Ajax._do_error_msg('Server Error', (msg.msg ? msg.msg : 'Unknown server error.'), handler);
			return;
		}
		
		if (msg.cmd != Ajax._cmd)
		{
			Ajax._do_error_msg('Server Error', 'Unknown server error. ' + (msg.msg ? msg.msg : ''), handler);
			return;
		}
		
		if (handler) handler(msg);
	}
	else if (Ajax._ajaxRequest.readyState == 4)
	{
		var status = Ajax._ajaxRequest.status;
		
		window.clearTimeout(Ajax._timeoutVar);
		Ajax._ajaxRequest = null;
		Ajax._responseHandler = null;
		
		Ajax._do_error_msg('Server Error', 'Server returned error '+status, handler);
	}
}



/*****************************************************************************************
Old Handler - Deprecated - Use .request in future
*/

Ajax.send = function(msg, responseHandler, in_timeout)
{
//alert('s');
	if (Ajax._ajaxRequest)
	{
		responseHandler('Internal error (Ajax adapter already in-use)', 'in-use');
		return;
	}
	
	var timeout = (in_timeout ? in_timeout * 1000 : Ajax._timeout * 1000);

	Ajax._timeoutVar = setTimeout(function() { Ajax._handleTimeout(); }, timeout);
	Ajax._responseHandler = responseHandler;
	
	var msg = JSON.stringify(msg);
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


Ajax.init('?io=1', 10);


CinsImp._script_loaded('ajax');

