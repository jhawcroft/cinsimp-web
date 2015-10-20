<?php
/*
CinsImp
Web Application

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

class Application
{
	public static function open_stack($in_stack)
	{
		global $config;
		
		$stack_handle = null;
		$stack = null;
		$card = null;
		try 
		{
			$stack_handle = new Stack($in_stack);
			$stack = $stack_handle->stack_load();
			$card = $stack_handle->stack_load_card($stack_handle->stack_get_first_card_id());
		}
		catch (Exception $err)
		{
			$stack_handle = null;
		}
		
		$page = file_get_contents($config->base.'html/template.html');
		
		$one = 1;
		//$page = str_replace('var gBase = \'../\';', 'var gBase = \'\';', $page, $one);
		//$page = str_replace('href="../css/', 'href="css/', $page);
		//$page = str_replace('src="../js/', 'src="js/', $page);
		//$page = str_replace('src="../gfx/', 'src="gfx/', $page);
		
		$page = str_replace('<!-- INSERT META -->', '', $page);
		$page = str_replace('<!-- INSERT STATIC CARD -->', '', $page);
		
		
		if ($stack_handle)
		{
			$one = 1;
			//$page = str_replace('width: 800px; height: 600px;', 
			//	'width: '.$stack['card_width'].'px; height: '.$stack['card_height'].'px;', $page, $one);
				
			$one = 1;
			$page = str_replace('/* INSERT PRE-LOAD SCRIPT */',
				'var _g_init_stack = '.json_encode($stack).";\n".
				'var _g_init_card = '.json_encode($card).';', 
				$page, $one);
		}
		else
		{
			$one = 1;
			$page = str_replace('/* INSERT PRE-LOAD SCRIPT */',
				'alert("No such stack or stack corrupt.");', 
				$page, $one);
		}
		
		
		//$page = 'hello';
		print $page;
	}

}


