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
	public static function open_stack()
	{
		global $config;
		
		/* check request variables */
		try
		{
			Util::check_request_vars(array(
				'stack'=>Util::REQUIRED,
				'card'=>Util::OPTIONAL
			));
		}
		catch (Exception $err)
		{
			Util::respond_with_http_error(400, 'Bad Request', 
				'Error: ' . $err->getMessage() . "\nTrace: " . $err->getTraceAsString());
		}
		
		/* sanitise input */
		try
		{
			$in_stack = Util::safe_stack_id($_REQUEST['stack']);
			$in_card = Util::safe_card_ref($_REQUEST['card']);
		}
		catch (Exception $err)
		{
			Util::respond_with_http_error($err->getCode(), $err->getMessage(), 
				'Error: ' . $err->getMessage() . "\nTrace: " . $err->getTraceAsString());
		}
		
		/* check if the input is a directory */
		if ($in_card == '' && is_dir($in_stack))
		{
			Application::do_dir_list($in_stack);
			exit;
		}
		
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
		$page = file_get_contents($config->base.'html/stack.html');
		
		/* populate the template with the static card and appropriate meta information */
		$page = str_replace('js/', $config->url . 'js/', $page);
		$page = str_replace('?browser-warning=1', $config->url . '?browser-warning=1', $page);
		$page = str_replace('<!-- INSERT STATIC CARD -->', '', $page);
		$page = str_replace('<!-- INSERT META -->', '', $page);  //  ******** TODO *******
		
		/* populate the template with stack and card data sufficient to start the
		web application environment on the client */
		$one = 1;
		$page = str_replace('/* INSERT PRE-LOAD SCRIPT */',
			'var gBase = \''.$config->url."';\n".
			'var _g_init_stack = '.json_encode($stack).";\n".
			'var _g_init_card = '.json_encode($card).';', 
			$page, $one);
		
		/* send the static response page */
		print $page;
	}


/*
	Provides a HTML directory listing of the files within the specified stack directory.
*/
	public static function do_dir_list($in_path)
	{
		global $config;
		
		$title = substr($in_path, strlen($_SERVER['DOCUMENT_ROOT']));
		
		$page = file_get_contents($config->base.'html/index.html');
		$page = str_replace('<!--TITLE-->', $title, $page);
		$page = str_replace('<!--PATH-->', $title, $page);
		
		$d = dir($in_path);
		$contents = array();
		
		while (($name = $d->read()) !== false)
		{
			$sub_path = realpath(str_replace('//', '/', $in_path.'/'.$name));
			$url_path = substr($sub_path, strlen($_SERVER['DOCUMENT_ROOT']));
			
			if (substr($name, 0, 1) == '.') continue;
			$contents[] = array($name, $url_path);
		}
		
		usort($contents, 'Application::_dir_list_sort');
		
		$parent = realpath($in_path.'/../').'/';
		if (substr($parent, 0, strlen($config->stacks)) == $config->stacks)
		{
			$parent = substr($parent, strlen($_SERVER['DOCUMENT_ROOT']));
			$contents = array_merge(array(array('Parent Directory', $parent)), $contents);
		}
		
		$list = '';
		foreach ($contents as $item)
		{
			$list .= '<li>';
			$list .= '<a href="'.$item[1].'">';
			$list .= $item[0];
			$list .= '</a></li>';
		}
		
		$page = str_replace('<!--LIST-->', $list, $page);
		
		print $page;
	}
	

/*
	Compares two directory index entries.
*/
	private static function _dir_list_sort($a, $b)
	{
		if ($a[0] == $b[0]) return 0;
		if ($a[0] < $b[0]) return -1;
		return 1;
	}
	
}


