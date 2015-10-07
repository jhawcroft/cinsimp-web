<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

/*
RewriteEngine On
RewriteRule (.*) test.php [QSA]
*/

require('php/stack.php');


//Stack::create_file('test');
//exit;





/* figure out what stack is being requested
if using modrewrite */

$basepath = dirname($_SERVER['SCRIPT_NAME']);
$subpath = substr($_SERVER['REQUEST_URI'], strlen($basepath));
$realpath = realpath(dirname(__FILE__).$subpath);

$legalpath = $_SERVER['DOCUMENT_ROOT'];
$checkpath = substr($legalpath, 0, strlen($realpath));

/// ***** POTENTIALLY IN FUTURE, IF YOU'RE LOGGED IN,
// ACCESSING A FILE THAT DOESN'T EXIST COULD CREATE A STACK WITH THAT NAME? 
// POSSIBLY A BIT TOO SILLY, BUT INTERESTING ALL THE SAME *****

if ( ($realpath === false) ||
	(strlen($realpath) < strlen($legalpath)) ||
	($legalpath != $checkpath) )
{
	print '<p>CinsImp: 404 Not Found.</p>';
	exit;
}

/* check if it's actually a stack file,
ie. has extension .stak, .stack, or no extension
and is a valid SQLite database */
$pathext = pathinfo($realpath, PATHINFO_EXTENSION);
if (! (($pathext == '') || ($pathext == 'stak') || ($pathext == 'stack')) )
{
	/* it's something else, try to determine file type and handle;
	ie. could support js, pdf, html, php, txt, css,
	or if it's a directory, look for a default file, or else produce
	an index */
	print '<p>CinsImp: Ordinary File / Directory Index.</p>';
	exit;
}


// USE $realpath here
print '<p>CinsImp: '.$realpath.'</p>';
$s = new Stack($realpath);

$stack = $s->stack_load();
var_dump($stack);

/*
$stack['cant_delete'] = false;
$stack['cant_abort'] = false;
$s->stack_save($stack);
*/

print '<p>';


//$card_id = $s->stack_get_nth_card_id(2);

//$card_id = $s->stack_delete_card(4);

$card = $s->stack_load_card(2);
//var_dump($card);
/*
$card['card_cant_delete'] = true;
$card['card_marked'] = true;
$card['card_script'] = array('content'=>'on opencard\n  answer "Hello World!"\nend opencard\n', 
	'selection'=>0);
$card['bkgnd_name'] = 'Initial Bkgnd';
$card['bkgnd_object_data'] = '';
$card['bkgnd_dont_search'] = true;
$s->stack_save_card($card);
*/

$card = $s->stack_load_card(2);
var_dump($card);



//$card_id = $s->stack_new_card(3, true);
//print '<p>New ID: '.$card_id;

//Stack::create_file('test.stak');


?>