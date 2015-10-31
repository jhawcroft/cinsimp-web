<?php
/*
CinsImp
Error Handling

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


class CinsImpError extends Exception
{
	protected $debug_detail;
	protected $id;
	
	public function __construct($in_error, $in_http_code = 500, $in_detail = '', $in_previous = null)
	{
		global $config;
		if (is_object($in_error))
		{
			if (is_a($in_error, 'CinsImpError'))
			{
				$this->debug_detail = $in_error->debug_detail;
				$this->id = $in_error->id;
				parent::__construct($in_error->getMessage(), $in_error->getCode(), $in_error->getPrevious());
			}
			else
			{
				$this->id = -1; /* only CinsImp errors have a valid ID */
				parent::__construct($in_error->getMessage(), $in_http_code, $in_error);
			}
		}
		else
		{
			if ($config->debug) $this->debug_detail = $in_detail;
			else $this->debug_detail = '';
			$this->id = $in_http_code;
			parent::__construct($in_error, $in_http_code, $in_previous);
		}
	}
	
	public function getDetail()
	{
		global $config;
		if (!$config->debug) return '';
		return $this->debug_detail . '; ' . $this->getFile() . ':' . $this->getLine() . 
			'; ' . $this->getTraceAsString();
	}
	
	
	public function getID()
	{
		return $this->id;
	}
	
	
	public static function unimplemented($in_detail = '')
	{
		throw new CinsImpError('Not Implemented', 501, $in_detail);
	}
	
	public static function malformed($in_detail)
	{
		throw new CinsImpError('Bad Request', 400, $in_detail);
	}
	
	public static function unauthorised($in_detail = '')
	{
		throw new CinsImpError('Authentication Required', 401, $in_detail);
	}
	
	public static function forbidden($in_detail = '')
	{
		throw new CinsImpError('Forbidden', 403, $in_detail);
	}
	
	public static function internal($in_detail)
	{
		throw new CinsImpError('Internal Application Error', 500, $in_detail);
	}
	
	public static function general($in_message, $in_detail = '')
	{
		throw new CinsImpError($in_message, 520, $in_detail);
	}
	
	public static function missing($in_what, $in_detail = '')
	{
		throw new CinsImpError($in_what . ' Not Found', 404, $in_detail);
	}
}



