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
		
		// hack for now...
		$_REQUEST['stack'] = $config->stacks_url . $_REQUEST['stack'];
		
		/* check request variables */
		try
		{
			Util::check_request_vars(array(
				'stack'=>Util::REQUIRED
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
			$parts = explode(';', $_REQUEST['stack']);
			if (count($parts) >= 1)
				$in_stack = Util::safe_stack_id($parts[0]);
			if (count($parts) >= 2)
				$in_card = Util::safe_card_ref($parts[1]);
			else
				$in_card = null;
			
			$in_layer_art = '';
			if (count($parts) >= 3)
			{
				if ($parts[2] == 'card.png') $in_layer_art = 'card';
				else if ($parts[2] == 'bkgnd.png') $in_layer_art = 'bkgnd';
				else
					Util::respond_with_http_error(400, 'Bad Request');
			}
		}
		catch (Exception $err)
		{
			Util::respond_with_http_error($err->getCode(), $err->getMessage(), 
				'Error: ' . $err->getMessage() . "\nTrace: " . $err->getTraceAsString());
		}
		
		/* check if the input is a directory */
		if ($in_card == null && is_dir($in_stack))
		{
			Application::do_dir_list($in_stack);
			exit;
		}
		
		/* try to open the specified stack and load the specified card */
		$stack_handle = null;
		$stack = null;
		$card = null;
		$bkgnd = null;
		try 
		{
			$stack_handle = new Stack($in_stack);
			$stack = $stack_handle->stack_load();
			if ($in_card === null) $in_card = $stack_handle->stack_get_nth_card_id(1);
			$card = $stack_handle->stack_load_card($in_card);
			if ($card === null)
				throw new Exception('Card Not Found', 404);
			$bkgnd = $stack_handle->stack_load_bkgnd($card['bkgnd_id']);
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
		
		/* if a resource has been requested, provide it instead of the card */
		if ($in_layer_art != '')
		{
			if ($in_layer_art == 'card') Application::layer_art($card, false);
			else Application::layer_art($card, true);
			exit;
		}
		
		/* prepare the response for the loaded stack and card */
		Util::response_is_html();
		
		/* load the basic page template */
		$page = file_get_contents($config->base.'html/stack.html');
		
		/* populate the template with the static card and appropriate meta information */
		$page = str_replace('js/', $config->url . 'js/', $page);
		$page = str_replace('icon/', $config->url . 'icon/', $page);
		$page = str_replace('?browser-warning=1', $config->url . '?browser-warning=1', $page);
		$page = str_replace('<!-- INSERT STATIC CARD -->', Application::static_page($stack, $card), $page);
		$page = str_replace('<!-- INSERT META -->', Application::meta($stack, $card), $page);
		
		/* compute the stack URL */
		//$stack['url'] = substr($stack['path'], strlen($config->url . 'stacks/'));
		
		/* populate the template with stack and card data sufficient to start the
		web application environment on the client */
		$one = 1;
		$client_param_block = array(
			'base'=>$config->url,
			'icon_collections'=>Application::list_icon_collections(),
			'stack'=>$stack,
			'card'=>$card,
			'bkgnd'=>$bkgnd
		);
		$page = str_replace('<!-- INSERT CLIENT LOAD SCRIPT -->',
			'<script type="text/javascript">'.
			'CinsImp.init('.json_encode($client_param_block, JSON_PRETTY_PRINT).');'.
			'</script>', $page, $one);
		
		/* send the static response page */
		print $page;
	}
	
	
/*
	Returns an array of install icon collections, including the built-in.
*/
	public static function list_icon_collections()
	{
		global $config;
		
		$list = array();
		$list[] = 'CinsImp'; // the built-in icons
		$list[] = 'Stack'; // the stack's icons
		
		/* enumerate any plug-in packs */
		if ($handle = opendir($config->base . 'plugins/icons/')) 
		{
			while (false !== ($entry = readdir($handle))) 
			{
				if ($entry != "." && $entry != ".." && 
						is_dir($config->base . 'plugins/icons/' . $entry)) 
					$list[] = str_replace('_', ' ', $entry);
			}
			closedir($handle);
		}
		
		return $list;
	}


/*
	Provides a HTML directory listing of the files within the specified stack directory.
*/
	public static function do_dir_list($in_path)
	{
		global $config;
		
		$title = substr(realpath($in_path), strlen($_SERVER['DOCUMENT_ROOT']));
		
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
			
			$is_dir = is_dir($sub_path);
			if ($is_dir && substr($url_path, strlen($url_path)-1, 1) != '/')
				$url_path .= '/';
			
			$contents[] = array($name, $url_path, $is_dir);
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
	
	
/*
	Opens the specified stack card and returns the content of the specified layer art
	in PNG format.
*/
	public static function layer_art($card, $is_bkgnd)
	{
		if (!$is_bkgnd) $data = $card['card_art'];
		else $data = $card['bkgnd_art'];
		if ($data === null)
			Util::respond_with_http_error(404, 'Art Not Found');
		
		$data = substr($data, strlen('data:image/png;base64,'));
		$data = base64_decode($data);
		
		// ideally, references to bkgnd art will use a bkgnd ID, maybe negative?
		
		header('Content-type: image/png');
		print $data;
	}
	
	
/*
	Returns static HTML content and layout generated from the content of a specific card.
*/
	public static function static_page($stack, $card)
	{
		$content = '';
		return '';
		// **TODO ** sort this out later
		
		$content .= '<!-- card size: '.$stack['card_width'].'x'.$stack['card_height'].' -->'."\n";
	
		$card_content = array();
		$card_data = json_decode($card['data'], true);
		if (is_array($card_data))
		{
			foreach ($card_data as $def)
				$card_content[$def[0]] = $def[1];
		}
		unset($card_data);
		
		$objects = json_decode($card['bkgnd_object_data'], true);
		$no_content = array();
		if (is_array($objects))
		{
			foreach ($objects as $def)
				$content .= Application::static_object($def, $no_content) . "\n";
		}
		
		$objects = json_decode($card['card_object_data'], true);
		if (is_array($objects))
		{
			foreach ($objects as $def)
				$content .= Application::static_object($def, $card_content) . "\n";
		}
	
		return $content;
	}
	
	
/*
	Returns HTML content appropriate for static output of a specific layer object.
*/
	private static function static_object($def, &$card_content)
	{
		if (!$def[-9]) return ''; /* don't output non-searchable fields,
								so they're not indexed by web crawlers */
		if (!$def[-10]) return ''; /* don't output an invisible object */
								
		if ($def[-1] == 0) /* button */
		{
			return '';
			if (!$def[5]) return ''; /* no output for buttons with Show Name = false */
			// need handling for checkboxes and icon buttons, when implemented, and shared hilite (as below)
			return '<a href="">'.$def[-7].'</a>';
			
			// also, only output buttons where the functionality can be easily determined,
			// for example, simple links with visual effects
			// or history moving (browser history)
		}
		else /* field */
		{
			if (isset($card_content[$def[-2]]))
				$def[-99] = $card_content[$def[-2]];
			return '<div>'.$def[-99].'</div>';
		}
	}
	
	
/*
	Returns HTML meta tags appropriate for static generation of a specific card.
*/
	public static function meta($stack, $card)
	{
		return '<meta name="robots" content="index, follow">';
		//return '<meta name="description" content="">';
	}
	
}


