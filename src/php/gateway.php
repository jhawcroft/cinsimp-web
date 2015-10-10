<?php
/*
CinsImp
AJAX Gateway

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
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS AND CONTRIBUTORS BE LIABLE 
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


$g_error_log = '';
	

class Gateway
{	

	public static function custom_error_handler($errno, $errstr, $errfile, $errline, $errcontext)
	{
		global $g_error_log;
		$g_error_log .= json_encode(Array('cmd'=>'error', 'msg'=>'PHP Error: '.$errfile.':'.$errline.': '.$errno.': '.$errstr));
		return true;
	}
	
	
	public static function print_test_form($response)
	{
header("Content-type: text/html\n");
?><!DOCTYPE html>
<html>
<head>
<title>Gateway Test Utility</title>
</head>
<body>
<form method="post" action="?">
<h1>Gateway Test Utility</h1>
<p>JSON Request:</p>
<p><textarea name="request" style="width: 500px; height: 400px;"><?php print (isset($_REQUEST['request']) ? $_REQUEST['request'] : '{"cmd":"test","echo":"Hello"}' ); ?></textarea></p>
<p><input type="submit" value="Submit JSON Request"></p>
<input type="hidden" name="io" value="1">
<input type="hidden" name="debug" value="true">

<h3>Last Server Response</h3>
<p><pre style="width: 500px;"><?php print $response; ?></pre></p>
</form>
</body>
</html><?php
	}


	public static function handle_request()
	{
		global $g_error_log;
		
		$debug = false;
		if (isset($_REQUEST['debug']) && ($_REQUEST['debug'] == true))
			$debug = true;
		
		if ($_REQUEST['io'] == 'test')
		{
			$debug = true;
			Gateway::print_test_form('');
			exit;
		}
		
		if (isset($_REQUEST['request']))
			$inbound = $_REQUEST['request'];
		else
			$inbound = '';
		
		set_error_handler(array('Gateway', 'custom_error_handler'));
		
		$outbound = Array();
		try {
			if ($inbound != '')
				$inbound = json_decode($inbound, true);
			else
				$inbound = json_decode(@file_get_contents('php://input'), true);
			$outbound['cmd'] = $inbound['cmd'];
			
			try {
				$action_method = new ReflectionMethod('Gateway', $inbound['cmd']);
			}
			catch (Exception $err) {
				throw new Exception("Gateway: Command ".$inbound['cmd']." unrecognised.");
			}
			$outbound = $action_method->invoke(null, $inbound, $outbound);
		}
		catch (Exception $err) {
			$outbound['cmd'] = 'error';
			$outbound['msg'] = 'Server: '.$err->getMessage();
		}
		
		if ($g_error_log != '')
		{
			$outbound['cmd'] = 'error';
			$outbound['msg'] = $g_error_log;
		}
		
		if ($debug)
		{
			//if ($testing)
			Gateway::print_test_form(json_encode($outbound));
			//print '<h3>Server Response:</h3><p><pre>'.json_encode($outbound).'</pre></p>';
		}
		else
		{
			header('Content-type: application/json');
			print json_encode($outbound);
		}
	}
	
	
	public static function test($inbound, $outbound)
	{
		//$outbound = $inbound;
		$outbound['echo'] = $inbound['echo'];
		$outbound['date'] = date('Y-m-d');
		return $outbound;
	}
	
	
	public static function load_stack($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$outbound['stack'] = $stack->stack_load();
		//$outbound['card'] = $stack->stack_load_card($outbound['stack']['first_card_id']);
		return $outbound;
	}
	
	
	public static function save_stack($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$stack->stack_save($inbound['stack']);
		$outbound['stack_id'] = $inbound['stack_id'];
		return Gateway::load_stack($inbound, $outbound);
	}
	
	
	public static function load_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$outbound['card'] = $stack->stack_load_card($inbound['card_id']);
		return $outbound;
	}
	
	
	public static function nth_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$inbound['card_id'] = $stack->stack_get_nth_card_id($inbound['num'], null);
		return Gateway::load_card($inbound, $outbound);
	}
	
	
	public static function save_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$stack->stack_save_card($inbound['card']);
		return $outbound;
	}
	
	
	public static function new_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$inbound['card_id'] = $stack->stack_new_card($inbound['card_id'], false);
		return Gateway::load_card($inbound, $outbound);
	}
	
	
	public static function new_bkgnd($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$inbound['card_id'] = $stack->stack_new_card($inbound['card_id'], true);
		return Gateway::load_card($inbound, $outbound);
	}
	
	
	public static function delete_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$inbound['card_id'] = $stack->stack_delete_card($inbound['card_id']);
		return Gateway::load_card($inbound, $outbound);
	}
	


	public static function new_stack($inbound, $outbound)
	{
		Stack::create_file(Util::safe_stack_id($inbound['stack_id']));
		if (file_exists($inbound['stack_id']))
			$outbound['stack_id'] = $inbound['stack_id'];
		else
			throw new Exception("Couldn't create stack.");
		return $outbound;
	}
	
/*
	public static function list_stacks($inbound, $outbound)
	{
		$outbound->list = CIStack::getList();
	}
	
	
	
	public static function open_stack($inbound, $outbound)
	{
		$stack = new CIStack;
		$outbound->id = $stack->openExisting($inbound->id);
		// should check for password here!
		
		$outbound->data = $stack->getOpenData();
	}
	
	public static function save_card($inbound, $outbound)
	{
		$stack = new CIStack;
		$stack->openExisting($inbound->stack_id);
		

		
		$card = new CICard($stack);
		$card->load($inbound->card->id);
		$card->setData($inbound->card);
		$card->save();
		
		
	}
	*/
}



