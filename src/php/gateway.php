<?php
/*
CinsImp
AJAX Gateway

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
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS AND CONTRIBUTORS BE LIABLE 
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


/* errors that occur during gateway processing are logged and explicitly handled */
$g_error_log = '';
	

class Gateway
{

/*****************************************************************************************
Generic Processing
*/

/*
	During gateway processing, any PHP errors will be accumulated within a log variable 
	and output at the conclusion of processing.
*/
	public static function custom_error_handler($errno, $errstr, $errfile, $errline, $errcontext)
	{
		global $g_error_log;
		$g_error_log .= json_encode(Array('cmd'=>'error', 'msg'=>'PHP Error: '.$errfile.':'.$errline.': '.$errno.': '.$errstr));
		return true;
	}
	
	
/*
	A test form is available to make debugging gateway requests easier: ?io=test
	(This form is only accessible when $config->debug = true.)
*/	
	public static function print_test_form($response)
	{
header("Content-type: text/html\n");
?><!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>CinsImp Gateway Test Utility</title>
<style>
body
{
	font-family: Helvetica Neue, sans-serif;
	background-color: #CCCCCC;
}
h1
{
	margin: 0;
	font-size: 18pt;
}
</style>
</head>
<body>
<form method="post" action="?">
<h1>Gateway Test Utility</h1>
<p>JSON Request:</p>
<p><textarea name="request" style="width: 700px; height: 300px;"><?php print (isset($_REQUEST['request']) ? $_REQUEST['request'] : '{"cmd":"test","echo":"Hello"}' ); ?></textarea></p>
<p><input type="submit" value="Submit JSON Request"></p>
<input type="hidden" name="io" value="1">
<input type="hidden" name="debug" value="true">

<h3>Last Server Response</h3>
<p><pre style="display: block; width: 500px;"><?php print $response; ?></pre></p>
</form>
</body>
</html><?php
	}


/*
	Determines and decodes the inbound Ajax request, and calls the appropriate functions
	to service the result.
*/
	public static function handle_request()
	{
		global $g_error_log;
		global $config;
		
		/* handle debug test mode; ?io=test */
		$debug = false;
		if (isset($_REQUEST['debug']) && ($_REQUEST['debug'] == true))
			$debug = true;
		if (!$config->debug && $debug)
			Util::respond_with_http_error(403, 'Forbidden');
		if ($_REQUEST['io'] == 'test')
		{
			$debug = true;
			if (!$config->debug && $debug)
				Util::respond_with_http_error(403, 'Forbidden');
			Gateway::print_test_form('');
			exit;
		}
		
		/* normal processing of AJAX request */
		Util::response_is_ajax_only();
		
		/* log errors with custom handler and process at conclusion of request */
		set_error_handler(array('Gateway', 'custom_error_handler'));
		
		/* in testing, it may be useful to be able to submit a request in this way */
		if (isset($_REQUEST['request']))
			$inbound = $_REQUEST['request'];
		else
			$inbound = '';
		
		/* invoke the method as specified in the cmd field of the request */
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
		
		/* if error(s) occurred during processing, change the response to an error
		response and reply with the contents of the logged errors */
		if ($g_error_log != '')
		{
			$outbound['cmd'] = 'error';
			$outbound['msg'] = $g_error_log;
		}
		
		/* if we're debugging the gateway, output the response on the test form,
		otherwise send a standard JSON response */
		if ($debug)
			Gateway::print_test_form(json_encode($outbound, JSON_PRETTY_PRINT));
		else
		{
			header('Content-type: application/json');
			print json_encode($outbound);
		}
	}
	

/*****************************************************************************************
Regular Command Handlers
*/

/*
	cmd: test
	Echos the 'echo' field and returns the server date.
	Intended for gateway testing only.
*/
	public static function test($inbound, $outbound)
	{
		$outbound['echo'] = $inbound['echo'];
		$outbound['date'] = date('Y-m-d');
		return $outbound;
	}
	

/*
	cmd: load_stack
	Loads the stack as specified in the 'stack_id' field.
	Returns the stack record in the 'stack' field.
*/
	public static function load_stack($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$outbound['stack'] = $stack->stack_load();
		return $outbound;
	}
	

/*
	cmd: save_stack
	Saves the stack as specified in the 'stack_id' field, using the supplied data
	in the 'stack' field.
*/	
	public static function save_stack($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$stack->stack_save($inbound['stack']);
		$outbound['stack_id'] = $inbound['stack_id'];
		return Gateway::load_stack($inbound, $outbound);
	}
	

	public static function rename_stack($inbound, $outbound)
	{
		throw Exception('Unimplemented');
	}
	

/*
	cmd: compact_stack
	Causes the unused space within the stack database to be eliminated.
*/
	public static function compact_stack($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$stack->stack_compact();
		return Gateway::load_stack($inbound, $outbound);
	}
	

/*
	cmd: load_card
	Returns the specified 'card' as specified by 'stack_id' and either 'card_id' or 
	'stack_num' (the number of the card within the stack).
*/
	public static function load_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		if (isset($inbound['stack_num']))
			$inbound['card_id'] = $stack->stack_get_nth_card_id($inbound['stack_num']);
		$outbound['card'] = $stack->stack_load_card($inbound['card_id']);
		return $outbound;
	}
	

/*
	cmd: nth_card
	Returns the specified 'card' as specified by 'stack_id' and 'num'
	(the number of the card within the stack).
*/
	public static function nth_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$inbound['card_id'] = $stack->stack_get_nth_card_id($inbound['num'], null);
		return Gateway::load_card($inbound, $outbound);
	}
	

/*
	cmd: save_card
	Saves the specified 'card' as specified by 'stack_id'.
*/
	public static function save_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$stack->stack_save_card($inbound['card']);
		return $outbound;
	}
	

/*
	cmd: new_card
	Creates a new card in the specified 'stack_id', immediately following the specified
	'card_id'.  Returns the same result as cmd:'load_card'.
*/
	public static function new_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$inbound['card_id'] = $stack->stack_new_card($inbound['card_id'], false);
		return Gateway::load_card($inbound, $outbound);
	}
	

/*
	cmd: new_bkgnd
	Creates a new background in the specified 'stack_id', immediately following the 
	specified 'card_id'.  Returns the same result as cmd:'load_card'.
*/
	public static function new_bkgnd($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$inbound['card_id'] = $stack->stack_new_card($inbound['card_id'], true);
		return Gateway::load_card($inbound, $outbound);
	}
	

/*
	cmd: delete_card
	Deletes the specified 'card_id' from 'stack_id' and returns the following card.
	Returns the same result as cmd:'load_card' and cmd:'load_stack'.
*/
	public static function delete_card($inbound, $outbound)
	{
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']));
		$inbound['card_id'] = $stack->stack_delete_card($inbound['card_id']);
		$outbound = Gateway::load_card($inbound, $outbound);
		$outbound['stack'] = $stack->stack_load();
		return $outbound;
	}
	

/*
	cmd: new_stack
	Creates a stack database file with the specified pathname 'stack_id'.
	If successful, returns the path, otherwise returns an error 'Couldn't create stack.'
*/
	public static function new_stack($inbound, $outbound)
	{
		Stack::create_file(Util::safe_stack_id($inbound['stack_id']));
		if (file_exists($inbound['stack_id']))
			$outbound['stack_id'] = $inbound['stack_id'];
		else
			throw new Exception("Couldn't create stack.");
		return $outbound;
	}
	

/*****************************************************************************************
HyperCard Import Command Handlers
*/

/*
	cmd: hcimport_data
	Accepts and saves a file upload of a HyperCard stack.
	Returns a JSON summary of the stack.
*/
	public static function hcimport_data($inbound, $outbound)
	{
		global $config;
		require($config->base.'php/hcimport.php');
		$outbound['result'] = HCImport::import_stack_data();
		return $outbound;
	}
	

/*
	cmd: hcimport_create
	Creates a temporary CinsImp stack suitable for importing the previously uploaded
	HyperCard stack.
*/
	public static function hcimport_create($inbound, $outbound)
	{
		global $config;
		require($config->base.'php/hcimport.php');
		$outbound['result'] = HCImport::create_stack();
		return $outbound;
	}
	

/*
	cmd: hcimport_list
	Returns a list of cards and backgrounds within the previously uploaded
	HyperCard stack.
*/
	public static function hcimport_list($inbound, $outbound)
	{
		global $config;
		require($config->base.'php/hcimport.php');
		$outbound['result'] = HCImport::list_layers();
		return $outbound;
	}
	

/*
	cmd: hcimport_bkgnd
	Causes the specified HyperCard stack background ID to be imported into the current
	temporary CinsImp stack.
*/
	public static function hcimport_bkgnd($inbound, $outbound)
	{
		global $config;
		require($config->base.'php/hcimport.php');
		$outbound['result'] = HCImport::import_bkgnd($inbound['id']);
		return $outbound;
	}
	

/*
	cmd: hcimport_card
	Causes the specified HyperCard stack card ID to be imported into the current
	temporary CinsImp stack.
*/

	public static function hcimport_card($inbound, $outbound)
	{
		global $config;
		require($config->base.'php/hcimport.php');
		$outbound['result'] = HCImport::import_card($inbound['id'], $inbound['seq']);
		return $outbound;
	}
	
}



