<?php
/*
CinsImp
Art Gateway

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

	

class Art
{	
	public static function handle_request()
	{
		global $db,$config;
		
		$id = preg_replace('/[^0-9CBcb]/', '', $_REQUEST['art']);
		$path = Art::create_path($id);

		//print $path;
		header('Content-type: image/png');
		readfile($path); 
	}
	
	
	private static function create_path($ident)
	{
		global $config;
		$ident = strtolower($ident);
		$path = $config->art->path . substr($ident, 0, 1) . '/';
		$parts = str_split(substr($ident, 1), 2);
		foreach ($parts as $part)
			$path .= $part . '/';
		$path = substr($path, 0, strlen($path)-1) . '.png';
		return $path;
	}
	
	
	//mkdir( dirname(Art::create_path($_REQUEST['art'])), 0777, true );
	
	/*private static function create_directories($ident)
	{
		global $config;
		$ident = strtolower($ident);
		$path = $config->art->path . substr($ident, 0, 1) . '/';
		$parts = str_split(substr($ident, 1), 2);
		foreach ($parts as $part)
		{
			$path .= $part . '/';
			if (!file_exists($path))
				mkdir(
		}
	}*/
}



