<?php

$config = new stdClass;
$config->database = new stdClass;
require('config.php');

$db = new mysqli(
	$config->database->host, 
	$config->database->username,
	$config->database->password,
	$config->database->name
	);


function stack_new()
{
	global $db,$config;
	
	$stack_id = null;
	
	$sql = 'INSERT INTO ??stack (stack_name) VALUES (?)';
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stack_title = 'Untitled Stack';
	$stmt->bind_param('s', $stack_title);
	if ($stmt->execute())
		$stack_id = $stmt->insert_id;
	$stmt->close();
	
	if (is_null($stack_id)) throw new Exception("Couldn't create new stack");
	
	$sql = 'INSERT INTO ??bkgnd (stack_id) VALUES (?)';
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->bind_param('i', $stack_id);
	if (!$stmt->execute()) throw new Exception($stmt->error);
	$bkgnd_id = $stmt->insert_id;
	$stmt->close();
	
	$sql = 'INSERT INTO ??card (bkgnd_id,card_seq) VALUES (?,10)';
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->bind_param('i', $bkgnd_id);
	if (!$stmt->execute()) throw new Exception($stmt->error);
	$stmt->close();
	
	return $stack_id;
}


function stack_delete($stack_id)
{
	global $db,$config;
	
	$sql = 'DELETE FROM ??stack WHERE stack_id='.intval($stack_id);
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	if (!$stmt->execute()) throw new Exception($stmt->error);
	$stmt->close();
}


function stack_get_list()
{
	global $db,$config;
	$stmt = $db->prepare('SELECT stack_id,stack_name FROM '.$config->database->prefix.'stack');
	$stmt->execute();
	$list = Array();
	$stmt->bind_result($id, $name);
	while ($stmt->fetch())
		$list[] = Array($id, $name);
	$stmt->close();
	return $list;
}


function stack_get_count_cards($stack_id, $in_bkgnd_id = null)
{
	global $db,$config;
	$sql = 'SELECT COUNT(card_id) FROM ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id WHERE ??bkgnd.stack_id='.intval($stack_id);
	if ($in_bkgnd_id != null)
		$sql .= ' AND ??bkgnd.bkgnd_id='.intval($in_bkgnd_id);
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$count = null;
	$stmt->bind_result($count);
	$stmt->fetch();
	$stmt->close();
	return $count;
}


function stack_get_bkgnd_rel_seq($bkgnd_id, $card_seq, $direction)
{
	global $db,$config;
	if ($direction > 0)
		$sql = 'SELECT MIN(card_seq) FROM ??card WHERE bkgnd_id='.intval($bkgnd_id).' AND card_seq>'.($card_seq*10);
	else
		$sql = 'SELECT MAX(card_seq) FROM ??card WHERE bkgnd_id='.intval($bkgnd_id).' AND card_seq<'.($card_seq*10);
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$seq = null;
	$stmt->bind_result($seq);
	$stmt->fetch();
	$stmt->close();
	return $seq;
}

function stack_get_bkgnd_rel_card_id($stack_id, $bkgnd_count, $bkgnd_id, $card_seq, $direction)
{
	global $db,$config;
	$rel_seq = stack_get_bkgnd_rel_seq($bkgnd_id, $card_seq, $direction);
	if (is_null($rel_seq))
	{
		if ($direction > 0)
			return stack_get_nth_card_id($stack_id, 1, $bkgnd_id);
		else
			return stack_get_nth_card_id($stack_id, $bkgnd_count, $bkgnd_id);
	}
	$sql = 'SELECT card_id FROM ??card WHERE bkgnd_id='.intval($bkgnd_id).' AND card_seq='.$rel_seq;
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$card_id = null;
	$stmt->bind_result($card_id);
	$stmt->fetch();
	$stmt->close();
	return $card_id;
}


function stack_get_first_card_id($stack_id)
{
	global $db,$config;
	$sql = 'SELECT card_id FROM ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id WHERE stack_id=? AND card_seq=10';
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->bind_param('i', $stack_id);
	$stmt->execute();
	$card_id = null;
	$stmt->bind_result($card_id);
	$stmt->fetch();
	$stmt->close();
	return $card_id;
}

//select * from ci_card where card_seq=(select card_seq from ci_card where card_id=1) + 10

function stack_get_nth_card_id($stack_id, $number, $in_bkgnd = null)
{
	global $db,$config;
	if ($in_bkgnd == 0) $in_bkgnd = null;
	if (is_null($in_bkgnd))
		$sql = 'SELECT card_id FROM ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id WHERE card_seq='.
			(intval($number) * 10).' AND stack_id='.intval($stack_id);
	else
		$sql = 'SELECT card_id FROM ??card WHERE bkgnd_id='.intval($in_bkgnd).' ORDER BY card_seq LIMIT '.(intval($number)-1).',1';
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$card_id = null;
	$stmt->bind_result($card_id);
	$stmt->fetch();
	$stmt->close();
	return $card_id;
}


function stack_load_card($card_id)
{
	global $db,$config;
	$card = null;
	
	$sql = 'SELECT stack_id,??card.bkgnd_id,card_name,card_seq,??card.object_data,??bkgnd.object_data '.
		' FROM ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id WHERE card_id=?';
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->bind_param('i', $card_id);
	$stmt->execute();
	$stmt->bind_result($stack_id,$bkgnd_id, $card_name, $card_seq, $card_object_data, $bkgnd_object_data);
	$stmt->fetch();
	$card['card_id'] = $card_id;
	$card['stack_id'] = $stack_id;
	$card['bkgnd_id'] = $bkgnd_id;
	$card['card_name'] = $card_name;
	$card['card_seq'] = $card_seq / 10;
	$card['card_object_data'] = $card_object_data;
	$card['bkgnd_object_data'] = $bkgnd_object_data;
	$stmt->close();
	
	return $card;
}


function stack_save_card($card_id, $card_object_data, $bkgnd_object_data)
{
	global $db,$config;
	
	$sql = 'UPDATE ??card SET object_data=? WHERE card_id=?';
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$null = null;
	$stmt->bind_param('bi', $null, $card_id);
	$stmt->send_long_data(0, $card_object_data);
	if (!$stmt->execute())
		throw new Exception($stmt->error);
	$stmt->close();
	
	$sql = 'UPDATE ??bkgnd SET object_data=? WHERE bkgnd_id=(SELECT bkgnd_id FROM ??card WHERE card_id=?)';
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$null = null;
	$stmt->bind_param('bi', $null, $card_id);
	$stmt->send_long_data(0, $bkgnd_object_data);
	if (!$stmt->execute())
		throw new Exception($stmt->error);
	$stmt->close();
}


function stack_new_card($after_card_id, $new_bkgnd_too)
{
	global $db,$config;
	
	$sql = 'SELECT ??card.bkgnd_id,card_seq,stack_id '.
		'FROM ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id '.
		'WHERE card_id='.intval($after_card_id);
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$stmt->bind_result($bkgnd_id, $existing_seq, $stack_id);
	$stmt->fetch();
	$stmt->close();
	
	if ($new_bkgnd_too)
	{
		$sql = 'INSERT INTO ??bkgnd (stack_id) VALUES ('.$stack_id.')';
		$sql = str_replace('??', $config->database->prefix, $sql);
		$stmt = $db->prepare($sql);
		$stmt->execute();
		$bkgnd_id = $stmt->insert_id;
		$stmt->fetch();
		$stmt->close();
	}
	if (is_null($bkgnd_id)) throw new Exception('Bkgnd creation failed');
       
    $sql = 'UPDATE ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id SET card_seq=card_seq+10 WHERE card_seq>'.$existing_seq.' AND stack_id='.intval($stack_id);
	$sql = str_replace('??', $config->database->prefix, $sql);
	print $sql;
	$stmt = $db->prepare($sql);
	if (!$stmt->execute()) throw new Exception($stmt->error);
	$stmt->close();
	
	$sql = 'INSERT INTO ??card (bkgnd_id,card_seq) VALUES ('.$bkgnd_id.','.($existing_seq+10).')';
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$card_id = $stmt->insert_id;
	$stmt->fetch();
	$stmt->close();
	
	return $card_id;
}


// don't allow deleting last card of stack
// and obviously, if last card in bkgnd, delete the bkgnd

function stack_delete_card($card_id)
{
	global $db,$config;
	
	$sql = 'SELECT ??card.bkgnd_id,stack_id,card_seq FROM ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id WHERE card_id='.intval($card_id);
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$stmt->bind_result($bkgnd_id, $stack_id, $existing_seq);
	$stmt->fetch();
	$stmt->close();
	
	$sql = 'SELECT COUNT(??card.card_id) FROM ??card WHERE bkgnd_id='.$bkgnd_id;
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$bkgnd_count = null;
	$stmt->bind_result($bkgnd_count);
	$stmt->fetch();
	$stmt->close();
	$cleanup_bkgnd = ($bkgnd_count == 1);
	
	$sql = 'SELECT COUNT(??card.card_id) FROM ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id WHERE stack_id='.$stack_id;
	$sql = str_replace('??', $config->database->prefix, $sql);
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$stack_count = null;
	$stmt->bind_result($stack_count);
	$stmt->fetch();
	$stmt->close();
	if ($stack_count == 1) throw new Exception("Last card in stack can't be deleted");
	
	$sql = 'DELETE FROM ??card WHERE card_id='.intval($card_id);
	$sql = str_replace('??', $config->database->prefix, $sql);
	//print '<p>'.$sql.'</p>';
	$stmt = $db->prepare($sql);
	$stmt->execute();
	if ($stmt->affected_rows != 1) throw new Exception($stmt->error);
	$stmt->close();
	
	$sql = 'UPDATE ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id SET card_seq=card_seq-10 WHERE stack_id='.intval($stack_id).' AND card_seq>'.intval($existing_seq);
	$sql = str_replace('??', $config->database->prefix, $sql);
	//print '<p>'.$sql.'</p>';
	$stmt = $db->prepare($sql);
	if (!$stmt->execute()) throw new Exception($stmt->error);
	$stmt->close();
	
	if ($cleanup_bkgnd)
	{
		$sql = 'DELETE FROM ??bkgnd WHERE bkgnd_id='.intval($bkgnd_id);
		$sql = str_replace('??', $config->database->prefix, $sql);
		//print '<p>'.$sql.'</p>';
		$stmt = $db->prepare($sql);
		if (!$stmt->execute()) throw new Exception($stmt->error);
		$stmt->close();
	}
	
	$sql = 'SELECT card_id FROM ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id WHERE stack_id='.intval($stack_id).' AND card_seq='.intval($existing_seq);
	$sql = str_replace('??', $config->database->prefix, $sql);
	print '<p>'.$sql.'</p>';
	$stmt = $db->prepare($sql);
	$stmt->execute();
	$card_id = null;
	$stmt->bind_result($card_id);
	$stmt->fetch();
	$stmt->close();
	if (is_null($card_id) || ($card_id === 0))
		$card_id = stack_get_first_card_id($stack_id);
	
	return $card_id;
}





function handle_new_stack()
{
	$_REQUEST['card_id'] = stack_get_first_card_id(stack_new());
	handle_load_card();
}


function handle_delete_stack()
{
	stack_delete($_REQUEST['stack_id']);
	handle_stack_list();
}


function handle_stack_list()
{
	$list = stack_get_list();
	//print json_encode($list);
	print '<h1>Stack List</h1>';
	foreach ($list as $stack)
		print '<p><a href="?action=open_stack&stack_id='.$stack[0].'">'.$stack[1].'</a> | <a href="?action=delete_stack&stack_id='.$stack[0].'">Delete</a></p>';
	print '<p><a href="?action=new_stack">New Stack</a></p>';
}


function ord_prev($input, $total)
{
	$output = $input-1;
	if ($output < 1) $output = $total;
	return $output;
}

function ord_next($input, $total)
{
	$output = $input+1;
	if ($output > $total) $output = 1;
	return $output;
}


// previous in current bkgnd
// next in current bkgnd
// both need the current number within this bkgnd
// which must be looked up



function handle_load_card()
{
	$card = stack_load_card($_REQUEST['card_id']);
	$card['stack_count'] = stack_get_count_cards($card['stack_id'], null);
	$card['bkgnd_count'] = stack_get_count_cards($card['stack_id'], $card['bkgnd_id']);
	print '<p>'.json_encode($card).'</p>';
	print '<p><a href="?action=nth_card&stack_id='.$card['stack_id'].'&num=1&bkgnd_id=0">First</a> | <a href="?action=nth_card&stack_id='.$card['stack_id'].'&num='.ord_prev($card['card_seq'], $card['stack_count']).'&bkgnd_id=0">Previous</a> | <a href="?action=nth_card&stack_id='.$card['stack_id'].'&num='.ord_next($card['card_seq'], $card['stack_count']).'&bkgnd_id=0">Next</a> | <a href="?action=nth_card&stack_id='.$card['stack_id'].'&num='.$card['stack_count'].'&bkgnd_id=0">Last</a> | <form method="get" action="?"><input type="hidden" name="action" value="load_card">Go Card ID: <input type="text" name="card_id" value="" size="10"></form></p>';
	print '<p>In This Bkgnd: <a href="?action=nth_card&stack_id='.$card['stack_id'].'&num=1&bkgnd_id='.$card['bkgnd_id'].'">First</a> | <a href="?action=bkgnd_rel&stack_id='.$card['stack_id'].'&bkgnd_count='.$card['bkgnd_count'].'&bkgnd_id='.$card['bkgnd_id'].'&card_seq='.$card['card_seq'].'&direction=-1">Previous</a> | <a href="?action=bkgnd_rel&stack_id='.$card['stack_id'].'&bkgnd_count='.$card['bkgnd_count'].'&bkgnd_id='.$card['bkgnd_id'].'&card_seq='.$card['card_seq'].'&direction=1">Next</a> | <a href="?action=nth_card&stack_id='.$card['stack_id'].'&num='.$card['bkgnd_count'].'&bkgnd_id='.$card['bkgnd_id'].'">Last</a></p>';
	print '<p><a href="?action=new_card&card_id='.$card['card_id'].'">New Card</a> | <a href="?action=new_bkgnd&card_id='.$card['card_id'].'">New Bkgnd</a> | <a href="?action=delete_card&card_id='.$card['card_id'].'">Delete Card</a></p>';
	print '<p><form method="post" action="?"><textarea name="card_object_data" style="width: 400px;height:300px;">'.$card['card_object_data'].'</textarea><textarea name="bkgnd_object_data" style="width: 400px;height:300px;">'.$card['bkgnd_object_data'].'</textarea><input type="hidden" name="action" value="save_card"><input type="submit" value="Save Card Object Data"><input type="hidden" name="card_id" value="'.$card['card_id'].'"></form></p>';
}


function handle_save_card()
{
	stack_save_card($_REQUEST['card_id'], $_REQUEST['card_object_data'], $_REQUEST['bkgnd_object_data']);
	handle_load_card();
}


function handle_new_card()
{
	$_REQUEST['card_id'] = stack_new_card($_REQUEST['card_id'], false);
	handle_load_card();
}


function handle_new_bkgnd()
{
	$_REQUEST['card_id'] = stack_new_card($_REQUEST['card_id'], true);
	handle_load_card();
}


function handle_delete_card()
{
	$_REQUEST['card_id'] = stack_delete_card($_REQUEST['card_id']);
	handle_load_card();
}


function handle_bkgnd_rel()
{
	$_REQUEST['card_id'] = stack_get_bkgnd_rel_card_id($_REQUEST['stack_id'], $_REQUEST['bkgnd_count'], $_REQUEST['bkgnd_id'], 
		$_REQUEST['card_seq'], $_REQUEST['direction']);
	handle_load_card();
}


function handle_nth_card()
{
	$_REQUEST['card_id'] = stack_get_nth_card_id($_REQUEST['stack_id'], $_REQUEST['num'], $_REQUEST['bkgnd_id']);
	handle_load_card();
}


function handle_open_stack()
{
	$_REQUEST['card_id'] = stack_get_first_card_id($_REQUEST['stack_id']);
	handle_load_card();
}


//$list = stack_list();
//var_dump($list);

?><!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>CinsImp</title>
</head>
<body>

<?php

if (!isset($_REQUEST['action']))
	$_REQUEST['action'] = 'stack_list';
if (function_exists('handle_'.$_REQUEST['action']))
	call_user_func('handle_'.$_REQUEST['action']);
else die('Invalid action.');

?>


</body>
</html>

