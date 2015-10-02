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

function custom_error_handler($errno, $errstr, $errfile, $errline, $errcontext)
{
	//header('Content-type: application/json');
	$g_error_log .= json_encode(Array('cmd'=>'error', 'msg'=>'PHP Error: '.$errfile.':'.$errline.': '.$errno.': '.$errstr));
	return true;
}
	

class Gateway
{	
	public static function handle_request($inbound = '')
	{
		global $db, $g_error_log;
		
		error_reporting(E_ALL);
		ini_set('display_errors', 0);
		ini_set('log_errors', 0);
		set_error_handler(custom_error_handler);
		
		$db->begin_transaction();
		
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
			$db->commit();
		}
		catch (Exception $err) {
			$outbound['cmd'] = 'error';
			$outbound['msg'] = 'Server: '.$err->getMessage();
			$db->rollback();
		}
		
		if ($g_error_log != '')
		{
			$outbound['cmd'] = 'error';
			$outbound['msg'] = $g_error_log;
		}
		
		if (defined('CINSIMP_TESTING'))
			return $outbound;
		header('Content-type: application/json');
		print json_encode($outbound);
	}
	
	
	public static function test($inbound, $outbound)
	{
		//$outbound = $inbound;
		$outbound['echo'] = $inbound['echo'];
		return $outbound;
	}
	
	
	public static function open_stack($inbound, $outbound)
	{
		$outbound['stack'] = Stack::stack_load($inbound['stack_id']);
		return $outbound;
	}
	
	
	public static function load_card($inbound, $outbound)
	{
		$outbound['card'] = Stack::stack_load_card($inbound['card_id']);
		return $outbound;
	}
	
	
	public static function nth_card($inbound, $outbound)
	{
		$inbound['card_id'] = Stack::stack_get_nth_card_id($inbound['stack_id'], $inbound['num'], null);
		return Gateway::load_card($inbound, $outbound);
	}
	
	
	public static function save_card($inbound, $outbound)
	{
		Stack::stack_save_card($inbound['card']);
		return $outbound;
	}
	
	
	public static function new_card($inbound, $outbound)
	{
		$inbound['card_id'] = Stack::stack_new_card($inbound['card_id'], false);
		return Gateway::load_card($inbound, $outbound);
	}
	
	
	public static function new_bkgnd($inbound, $outbound)
	{
		$inbound['card_id'] = Stack::stack_new_card($inbound['card_id'], true);
		return Gateway::load_card($inbound, $outbound);
	}
	
	
	public static function delete_card($inbound, $outbound)
	{
		$inbound['card_id'] = Stack::stack_delete_card($inbound['card_id']);
		return Gateway::load_card($inbound, $outbound);
	}
	

/*
	public static function list_stacks($inbound, $outbound)
	{
		$outbound->list = CIStack::getList();
	}
	
	public static function new_stack($inbound, $outbound)
	{
		$stack = new CIStack;
		$outbound->id = $stack->createNew();
		$outbound->data = $stack->getOpenData();
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



