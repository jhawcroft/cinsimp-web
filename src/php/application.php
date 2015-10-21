<?php
/*
CinsImp
Web Application

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

class Application
{

/*
	Responsible for finding and loading the specified stack and card.
	
	The response is a static HTML page containing a simplified static, 
	search-engine-friendly extract of the specified card (or the first card if not 
	otherwise specified).
	
	The response will also contain the necessary information to load the web application
	in browsers where suitable capabilities exist (Javascript and HTML 5).
*/
	public static function open_stack($in_stack, $in_card)
	{
		global $config;
		
		/* try to open the specified stack and load the specified card */
		$stack_handle = null;
		$stack = null;
		$card = null;
		try 
		{
			$stack_handle = new Stack($in_stack);
			$stack = $stack_handle->stack_load();
			if ($in_card === null) $in_card = $stack_handle->stack_get_first_card_id();
			$card = $stack_handle->stack_load_card($in_card);
			if ($card === null)
				throw new Exception('Card Not Found', 404);
			if (!$stack_handle)
				throw new Exception('Stack Not Found', 404);
		}
		catch (Exception $err)
		{
			/* there was a problem opening the stack or card;
			return an appropriate HTTP response */
			$code = $err->getCode();
			$msg = $err->getMessage();
			$extra = '';
			if ($code == 0) 
			{
				$code = 500;
				$msg = 'Internal Application Error';
				$extra = 'Error: ' . $err->getMessage() . "\nTrace: " . $err->getTraceAsString();
			}
			Util::respond_with_http_error($code, $msg, $extra);
			exit;
		}
		
		/* prepare the response for the loaded stack and card */
		Util::response_is_html();
		
		/* load the basic page template */
		$page = file_get_contents($config->base.'html/template.html');
		
		/* populate the template with the static card and appropriate meta information */
		$page = str_replace('<!-- INSERT STATIC CARD -->', '', $page);
		$page = str_replace('<!-- INSERT META -->', '', $page);  //  ******** TODO *******
		
		/* populate the template with stack and card data sufficient to start the
		web application environment on the client */
		$one = 1;
		$page = str_replace('/* INSERT PRE-LOAD SCRIPT */',
			'var _g_init_stack = '.json_encode($stack).";\n".
			'var _g_init_card = '.json_encode($card).';', 
			$page, $one);
		
		/* send the static response page */
		print $page;
	}

}


