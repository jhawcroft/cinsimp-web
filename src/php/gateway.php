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
$g_error_log = array();
	

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
		$g_error_log[] = array($errstr, $errno, $errfile.':'.$errline);
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
		//set_error_handler(array('Gateway', 'custom_error_handler')); 
		
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
			if ($inbound === null) CinsImpError::malformed('JSON input malformed');
			$outbound['cmd'] = $inbound['cmd'];
			
			try {
				$action_method = new ReflectionMethod('Gateway', $inbound['cmd']);
			}
			catch (Exception $err) {
				throw new Exception("Gateway: Command ".$inbound['cmd']." unrecognised.");
			}
			
			$outbound = $action_method->invoke(null, $inbound, $outbound);
		}
		catch (Exception $err) 
		{
			$err = new CinsImpError($err);
			$outbound = array();
			$outbound['cmd'] = 'error';
			$outbound['msg'] = 'Server: '.$err->getMessage().': '.$err->getDetail();
			$outbound['cde'] = $err->getID();
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
		Util::keys_required($inbound, array('echo'));
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
		global $config;
		
		if (isset($inbound['url']))
		{
		
		// **TODO** if the parameter stack_host is specified,
		// we must act as a proxy for the remote server
		// and probably this code should be detected at the beginning of the gateway,
		// with the messages simply passed along
		
			$inbound['id'] = substr($inbound['url'], strlen($config->url . 'stacks/'));
		}
		
		Util::keys_required($inbound, array('id'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
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
		Util::keys_required($inbound, array('id','stack'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']));
		$outbound['record_version'] = $stack->stack_save($inbound['stack'], Util::optional($inbound, 'auth_hash'));
		return $outbound;
	}
	
	
/*
	cmd: set_password
	Sets/clears the password on the stack.
*/
	public static function set_password($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id','password'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
		$outbound['record_version'] = $stack->stack_set_password($inbound['password']);
		return $outbound;
	}
	

/*
	cmd: compact_stack
	Causes the unused space within the stack database to be eliminated.
*/
	public static function compact_stack($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
		$outbound['stats'] = $stack->stack_compact();
		return $outbound;
	}
	
	
	//private static function _return_card_and_bkgnd($stack, $card_ref, &$inbound, &$outbound)
	//{
	//	$outbound['card'] = $stack->stack_load_card($card_ref, 
	//}

/*
	cmd: load_card
	Returns the specified 'card' as specified by 'stack_id' and either 'card_id' or 
	'stack_num' (the number of the card within the stack).
*/
	public static function load_card($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id','ref'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
		$outbound['card'] = $stack->stack_load_card(
			$inbound['ref'], 
			Util::optional($inbound, 'mark_state'), 
			Util::optional($inbound, 'bkgnd_id'), 
			Util::optional($inbound, 'curr_card_id'),
			Util::optional($inbound, 'searchable')
		);
		$bkgnd = $stack->stack_load_bkgnd(
			$outbound['card']['bkgnd_id'],
			Util::optional($inbound, 'curr_card_id')
		);
		if ($bkgnd !== null) $outbound['bkgnd'] = $bkgnd;
		return $outbound;
	}
	
	
/*
	cmd: load_cards
	Returns a batch of cards in bulk (as required for client-side marking, sorting and searching).
	Card detail is returned without art (as this is not required for searching).
	Cards may be server-side filtered by marked and/or background.
	The bulk listing will also include all the relevant backgrounds (once).
*/
	public static function load_cards($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
		$outbound['cards'] = $stack->stack_load_cards(
			Util::optional($inbound, 'mark_state'),
			Util::optional($inbound, 'bkgnd_id')
		);
		$outbound['bkgnds'] = $stack->stack_load_bkgnds($outbound['cards']);
		return $outbound;
	}

	

/*
	cmd: nth_card
	Returns the specified 'card' as specified by 'stack_id' and 'num'
	(the number of the card within the stack).
*/
	/*public static function nth_card($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id','num'));
		$bkgnd_id = Util::optional($inbound, 'bkgnd_id');
		$stack = new Stack(Util::safe_stack_id($inbound['stack_id']), Util::optional($inbound, 'auth_hash'));
		$inbound['card_id'] = $stack->stack_get_nth_card_id($inbound['num'], $bkgnd_id);
		$outbound['card'] = $stack->stack_load_card($inbound['card_id']);
		$outbound['bkgnd'] = $stack->stack_load_bkgnd($outbound['card']['bkgnd_id']);
		return $outbound;
	}*/
	

/*
	cmd: save_card
	Saves the specified 'card' as specified by 'stack_id'.
*/
	public static function save_card($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
		if (array_key_exists('card', $inbound))
			$stack->stack_save_card($inbound['card']);
		if (array_key_exists('bkgnd', $inbound))
			$stack->stack_save_bkgnd($inbound['bkgnd']);
		return $outbound;
	}
	

/*
	cmd: new_card
	Creates a new card in the specified 'stack_id', immediately following the specified
	'card_id'.  Returns the same result as cmd:'load_card'.
*/
	public static function new_card($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id', 'card_id'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
		$card_id = $stack->stack_new_card(intval($inbound['card_id']), false);
		$outbound['card'] = $stack->stack_load_card($card_id);
		$outbound['bkgnd'] = $stack->stack_load_bkgnd($outbound['card']['bkgnd_id']);
		return $outbound;
	}
	

/*
	cmd: new_bkgnd
	Creates a new background in the specified 'stack_id', immediately following the 
	specified 'card_id'.  Returns the same result as cmd:'load_card'.
*/
	public static function new_bkgnd($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id', 'card_id'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
		$card_id = $stack->stack_new_card($inbound['card_id'], true);
		$outbound['card'] = $stack->stack_load_card($card_id);
		$outbound['bkgnd'] = $stack->stack_load_bkgnd($outbound['card']['bkgnd_id']);
		return $outbound;
	}
	

/*
	cmd: delete_card
	Deletes the specified 'card_id' from 'stack_id' and returns the following card.
	Returns the same result as cmd:'load_card' and cmd:'load_stack'.
*/
	public static function delete_card($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id', 'card_id'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
		$next_card_id = $stack->stack_delete_card($inbound['card_id']);
		$outbound['card'] = $stack->stack_load_card($next_card_id);
		$outbound['bkgnd'] = $stack->stack_load_bkgnd($outbound['card']['bkgnd_id']);
		return $outbound;
	}
	

/*
	cmd: new_stack
	Creates a stack database file with the specified pathname 'stack_id'.
	If successful, returns the path, otherwise returns an error 'Couldn't create stack.'
*/
	public static function new_stack($inbound, $outbound)
	{
		global $config;
		if (!$config->restrictions->can_new_stack)
			throw new Exception('Creating new stacks is not allowed.', 403);
		Util::keys_required($inbound, array('id'));
		$stack_id = Util::safe_stack_id($inbound['id'], true);
		Stack::create_file($stack_id);
		return $outbound;
	}
	
	
	
/*
	cmd: import_icon
	Imports an icon's data into the stack, and returns the ID it was actually allocated
	(in case of a preexisting icon with the requested ID).
*/
	public static function import_icon($inbound, $outbound)
	{
		Util::keys_required($inbound, array('id','icon'));
		$stack = new Stack(Util::safe_stack_id($inbound['id']), Util::optional($inbound, 'auth_hash'));
		$outbound['icon_id'] = $stack->stack_import_icon($inbound['icon']);
		return $outbound;
	}
	

// LIST ICONS ought to be moved to application
// and have only a wrapper in this file   ******************

	public static function _icon_sort($a, $b)
	{
		return strcasecmp($a[1], $b[1]);
	}

/*
	cmd: list_icons
	Returns an array list of icons within the specified named icon pack. 
	(format is [ID, name, url])
*/
	public static function list_icons($inbound, $outbound)
	{
		global $config;
		
		Util::keys_required($inbound, array('pack'));
		
		/* determine the path to the pack */
		$pack_path = '';
		if ($inbound['pack'] != 'CinsImp')
		{
			$pack_path = str_replace('/', '', urldecode($inbound['pack']));
			$pack_path = $config->base . 'plugins/icons/' . str_replace(' ', '_', $pack_path);
			$pack_path = realpath($pack_path);
			if ($pack_path === false) $pack_path = '';
			else if (substr($pack_path, 0, strlen($config->base)) != $config->base)
				$pack_path = '';
			if ($pack_path != '') $pack_path .= '/';
		}
		if ($pack_path == '') $pack_path = $config->base . 'icons/';
		
		/* enumerate the icons in the directory */
		$list = array();
		if ($handle = opendir($pack_path)) 
		{
			while (false !== ($entry = readdir($handle))) 
			{
				if ($entry != "." && $entry != ".." && 
						is_file($pack_path . $entry) &&
						strtolower(pathinfo($entry, PATHINFO_EXTENSION)) == 'png')
				{
					$parts = explode('.', $entry, 2);
					$icon_id = $parts[0];
					$icon_name = pathinfo($parts[1], PATHINFO_FILENAME);
					$icon_name = urldecode(str_replace('_', ' ', $icon_name));
					
					$icon_path = $pack_path . urlencode($entry);
					$icon_url = $config->url . substr($icon_path, strlen($config->base));
					
					
					$list[] = [$icon_id, $icon_name, $icon_url];
				}
			}
			closedir($handle);
		}
		
		usort($list, 'Gateway::_icon_sort');
		
		$outbound['list'] = $list;
		
		return $outbound;
	}
	
	
/*
	cmd: list_fonts
	Returns an array list of font collections, each containing an array list of fonts.
*/
	public static function list_fonts($inbound, $outbound)
	{
		global $config;
		
		$clist = array();
		
		$font_dir = $config->base . 'fonts/';
		if ($chandle = opendir($font_dir))
		{
			while (false !== ($entry = readdir($chandle)))
			{
				if (substr($entry, 0, 1) != '.' && 
						is_dir($font_dir . $entry))
				{
					$collection_name = str_replace('_', ' ', $entry);
					$collection = array(
						'collection'=>$collection_name,
						'generic'=>null,		/* CSS generic term for this collection */
						'default'=>null			/* default font name within this collection */
					);
					
					$path = $font_dir . $entry . '/manifest.json';
					if (file_exists($path))
					{
						$manifest = file_get_contents($path);
						$manifest = json_decode($manifest, true);
						if (is_array($manifest))
						{
							if (array_key_exists('generic', $manifest))
								$collection['generic'] = $manifest['generic'];
							if (array_key_exists('default', $manifest))
								$collection['default'] = str_replace('_', ' ', $manifest['default']);
						}
					}
					
					$flist = array();
					$path = $font_dir. $entry . '/';
					$url = $config->url . substr($path, strlen($config->base));
					if ($fhandle = opendir($path))
					{
						while (false !== ($fentry = readdir($fhandle)))
						{
							if (substr($fentry, 0, 1) != '.' &&
									is_dir($path . $fentry))
							{
								$font_name = str_replace('_', ' ', $fentry);
								$font_url = $url . $fentry . '/';
								$font_path = $path . $fentry . '/';
								$font = array(
									'font'=>$font_name
								);
								
								$variants = array();
								if ($vhandle = opendir($font_path))
								{
									while (false !== ($ventry = readdir($vhandle)))
									{
										if (substr($ventry, 0, 1) != '.' &&
												is_file($font_path . $ventry) &&
												strtolower(pathinfo($ventry, PATHINFO_EXTENSION)) == 'ttf')
										{
											$variants[] = $font_url . $ventry;
										}
									}
								}
								
								$font['variants'] = $variants;
								$flist[] = $font;
							}
						}
					}
					$collection['fonts'] = $flist;
					
					$clist[] = $collection;
				}
			}
		}
		
		//$list[] = 'CinsImp'; // the built-in icons
		
		/* enumerate any plug-in packs */
		/*if ($handle = opendir($config->base . 'plugins/icons/')) 
		{
			while (false !== ($entry = readdir($handle))) 
			{
				if ($entry != "." && $entry != ".." && 
						is_dir($config->base . 'plugins/icons/' . $entry)) 
					$list[] = str_replace('_', ' ', $entry);
			}
			closedir($handle);
		}*/
		
		$outbound['list'] = $clist;
		
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



