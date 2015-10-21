<?php
/*
CinsImp
Application bootstrap

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

/* configure the application */
require(dirname(__FILE__).'/config.php');


/* include essential utility code */
require($config->base.'php/util.php');


/*
	Returns the browser warning page which will be displayed along-side the stack
	content if the browser has insufficient capabilities to run the application.
*/
if (isset($_REQUEST['browser-warning']))
{
	Util::response_is_html();
	$page = '';
	$page .= file_get_contents($config->base.'html/browser.html');
	print $page;
	exit;
}


/*
	Returns the user interface templates (dialogs and palettes) which the client-side
	code will use to construct these resources.
*/
if (isset($_REQUEST['ui']))
{
	Util::response_is_ajax_only();
	$page = '';
	$page .= file_get_contents($config->base.'html/ui.html');
	print $page;
	exit;
}


/* include stack database API */
require($config->base.'php/stack.php');


/*
	Returns the results of handling the supplied AJAX request.
*/
if (isset($_REQUEST['io']))
{
	require($config->base.'php/gateway.php');
	Gateway::handle_request();
	exit;
}


/*
	Handles the upload of a HyperCard stack and initial preparation for the import
	of it's content, structure and art in co-operation with the client.
*/
if (isset($_REQUEST['hcimport']))
{
	Util::response_is_ajax_only();
	require($config->base.'php/hcimport.php');
	HCImport::handle_upload();
	exit;
}


/*
	Returns a static page for the specified stack, along with appropriate data and
	instructions to invoke the client-side application if the environment is sufficient.
	
	The static page is search-engine-friendly.
*/
if (isset($_REQUEST['stack']))
{
	Util::response_is_html();
	require($config->base.'php/application.php');
	Application::open_stack(Util::safe_stack_id($_REQUEST['stack']));
	exit;
}


/*
	If the request is anything else, the client has err'd.
*/
Util::respond_with_http_error(400, 'Bad Request');

