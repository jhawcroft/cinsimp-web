<?php
/*
CinsImp
Web-based application entry point

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

require('lib/cinsimp.php');

//Gateway::handle_request('{"cmd":"delete_card","card_id":29}');
//exit;



?><!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>CinsImp</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" type="text/css" href="css/Base.css">
<link rel="stylesheet" type="text/css" href="css/Dialog.css">
<link rel="stylesheet" type="text/css" href="css/CardLayout.css">
<script language="javascript" type="text/javascript" src="js/Ajax.js"></script>
<script language="javascript" type="text/javascript" src="js/Screen.js"></script>
<script language="javascript" type="text/javascript" src="js/Menu.js"></script>
<script language="javascript" type="text/javascript" src="js/Dialog.js"></script>
<script language="javascript" type="text/javascript" src="js/CardWindow.js"></script>
<script language="javascript" type="text/javascript" src="js/Util.js"></script>
<script language="javascript" type="text/javascript" src="js/Drag.js"></script>
<script language="javascript" type="text/javascript" src="js/Object.js"></script>
<script language="javascript" type="text/javascript" src="js/CardLayout.js"></script>
<script language="javascript" type="text/javascript" src="js/Button.js"></script>
<script language="javascript" type="text/javascript" src="js/Field.js"></script>
</head>
<body>

<?php require('wnd/OpenStack.php'); ?>
<script>

</script>


<script>

Screen.onReady.push( function() 
{
	CardWindow.main.openStack(1, true);
	//Dialog.OpenStack.show();
} );

/*
msg = {
		cmd: 'open_stack',
		stack_id: 1
	};
	Ajax.send(msg, function(msg, status)
	{
		if ((status != 'ok') || (msg && msg.cmd && (msg.cmd == 'error')))
			alert("Couldn't open test stack: "+(status!='ok'?status:'')+"\n"+msg.msg);
		else
		{
			
			alert("Opened!"+status+"\n"+JSON.stringify(msg.stack));
		}
	});
	*/
/*
msg = {
	cmd: 'test',
	echo: 'Hello World!'
};
CIAjax.send(msg, function(msg, status) {
	alert('Got status='+status+', msg='+JSON.stringify(msg));
});*/
</script>


</body>
</html>