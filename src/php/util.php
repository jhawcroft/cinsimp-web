<?php
/*
CinsImp
Utilities

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

class Util
{

	const REQUIRED = true;
	const OPTIONAL = false;

/*
	Sanitize the supplied stack ID.
*/
	public static function safe_stack_id($stack_id)
	{
		global $config;
		if ($stack_id == '') return $config->stacks;
		$path = realpath($config->stacks . $stack_id);
		if ($path == '')
			throw new Exception('Stack Not Found', 404);
		if (strpos($path, $config->stacks) !== 0)
			throw new Exception('Forbidden', 503);
		return $path;
	}
	

/*
	Sanitize the supplied card reference (ID or name).
*/
	public static function safe_card_ref($card_ref)
	{
		if ($card_ref === null) return null;
		if ($card_ref === '') return null;
		
		 /* we use parameterised queries, so no need to do further verification */
		if (is_numeric($card_ref))
		{
			/* it's an id number */
			return intval($card_ref);
		}
		else
		{
			/* it's a name */
			return strval($card_ref);
		}
	}
	

/*
	Uses the supplied table of request variables and their accompanying optionality
	to determine if the supplied request variables are within the allowable/required set.
*/
	public static function check_request_vars($vars)
	{
		foreach ($vars as $name => $optionality)
		{
			if ( $optionality && (!isset($_REQUEST[$name])) )
				throw new Exception('Bad Request; Missing '.$name, 400);
			else if ( (!$optionality) && (!isset($_REQUEST[$name])) )
				$_REQUEST[$name] = null;
		}
		foreach ($_GET as $name => $value)
		{
			if (!isset($vars[$name]))
				throw new Exception('Bad Request; '.$name.' Not Allowed', 400);
		}
		foreach ($_POST as $name => $value)
		{
			if (!isset($vars[$name]))
				throw new Exception('Bad Request; '.$name.' Not Allowed', 400);
		}
		return true;
	}
	
	
/*
	Outputs HTTP response headers appropriate to an AJAX response to help minimise
	security issues with the application/service.
*/
	public static function response_is_ajax_only()
	{
		/* if debugging is enabled; don't output any headers yet */
		global $config;
		if ($config->debug) return;
		
		/* headers to prevent 'Reflected File Download attacks' */
		header('X-Content-Type-Options: nosniff');
		header('Content-Disposition: attachment; filename="CinsImp.txt"');
	}
	

/*
	Outputs HTTP response headers appropriate to servicing a normal page request.
*/
	public static function response_is_html()
	{
		header('Content-Type: text/html');
	}
	
	
/*
	Returns an appropriately formatted and templated HTTP error response.
*/
	public static function respond_with_http_error($code, $description, $extra = '')
	{
		global $config;
		Util::response_is_html();
		$status = intval($code).' '.$description;
		header('HTTP/1.0 ' . $status);
		$page = file_get_contents($config->base.'html/error.html');
		$page = str_replace('<!--TITLE-->', $status, $page);
		$page = str_replace('<!--DESCRIPTION-->', $status, $page);
		if ($config->debug)
			$page = str_replace('<!--EXTRA-->', '<hr> <p>'.nl2br($extra).'</p>', $page);
		else
			$page = str_replace('<!--EXTRA-->', '', $page);
		$page = str_replace('gfx/', $config->url . 'gfx/', $page);
		print $page;
		exit;
	}

}


