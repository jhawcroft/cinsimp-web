<?php
/*
CinsImp
Configuration bootstrap

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

/* create the configuration object */
$config = new stdClass();

/* the default timezone */
$config->timezone = 'UTC';

/* set the base path to the CinsImp installation */
$config->base = realpath(dirname(__FILE__).'/../').'/';
$config->url = substr($config->base, strlen($_SERVER['DOCUMENT_ROOT']));

/* set the default stacks directory */
$config->host = '';
$config->stacks = $config->base.'stacks/';
$config->stacks_url = $config->url.'stacks/';

/* set the default state of debugging, ie. OFF */
$config->debug = false;

/* provide restrictions for public installations 
and for server sanity/security */
$config->restrictions = new stdClass();
$config->restrictions->enabled = true;
$config->restrictions->can_new_stack = true;
$config->restrictions->max_stack_size = '50 M';

/* load the administrator configuration */
require($config->base.'config.php');

/* fix urls and paths */
$config->base = realpath($config->base).'/';
$config->stacks = realpath($config->stacks).'/';

/* apply the timezone */
date_default_timezone_set($config->timezone);

/* fix restrictions */
$config->restrictions->max_stack_size = str_replace(' ', '', $config->restrictions->max_stack_size);
$config->restrictions->max_stack_size = str_replace('G', '000000000', $config->restrictions->max_stack_size);
$config->restrictions->max_stack_size = str_replace('M', '000000', $config->restrictions->max_stack_size);
$config->restrictions->max_stack_size = str_replace('K', '000', $config->restrictions->max_stack_size);

/* configure PHP error reporting based on the debug mode */
if ($config->debug)
{
	error_reporting(E_ALL);
	ini_set('display_errors', 1);
	ini_set('log_errors', 1);
}
else
{
	error_reporting(E_ALL);
	ini_set('display_errors', 0);
	ini_set('log_errors', 0);
}


