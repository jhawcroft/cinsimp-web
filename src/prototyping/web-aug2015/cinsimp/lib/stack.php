<?php
/*
CinsImp
Stack database adapter

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
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


// could eventually do some simple session management on the server
// and provide a means for an authentication cookie to be obtained,
// which verifies that the client in possession of said cookie has
// successfully provided the current password and is thereby
// permitted to make changes to various stack protection/sensitive
// settings.


class Stack
{

	private static function decode_bool($expr)
	{
		return ($expr == 'Y' ? true : false);
	}


	private static function encode_bool($bool)
	{
		return ($bool ? 'Y' : 'N');
	}
	
	
	private static function nvl($value, $ifnull)
	{
		if (is_null($value)) return $ifnull;
		return $value;
	}


	public static function stack_new()
	{
		global $db,$config;
	
		$stack_id = null;
	
		$sql = 'INSERT INTO ??stack (stack_name,stack_data) VALUES (?,?)';
		$stmt = DB::prepare($sql);
		$stack_title = 'Untitled Stack';
		$stack_data = json_encode(Array('user_level'=>5, 'card_width'=>800, 'card_height'=>600, 'cant_peek'=>false, 'cant_abort'=>false));
		$null = null;
		$stmt->bind_param('ss', $stack_title, $null);
		$stmt->send_long_data(1, $stack_data);
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


	public static function stack_delete($stack_id)
	{
		global $db,$config;
	
		$sql = 'DELETE FROM ??stack WHERE stack_id='.intval($stack_id);
		$sql = str_replace('??', $config->database->prefix, $sql);
		$stmt = $db->prepare($sql);
		if (!$stmt->execute()) throw new Exception($stmt->error);
		$stmt->close();
	}


	public static function stack_load($stack_id)
	{
		global $db,$config;

		$sql = 'SELECT stack_name,stack_data,cant_delete,cant_modify,private_access FROM ??stack WHERE stack_id=?';
		$stmt = DB::prepare($sql);
		$stmt->bind_param('i', $stack_id);
		$stmt->execute();
		$stmt->bind_result($stack_name, $stack_data, $cant_delete, $cant_modify, $private_access);
		if (!$stmt->fetch())
			throw new Exception($stmt->error);
		$stmt->close();
	
		$stack = json_decode($stack_data, true);
		$stack['stack_id'] = $stack_id;
		$stack['stack_name'] = $stack_name;
		$stack['cant_delete'] = Stack::decode_bool($cant_delete);
		$stack['cant_modify'] = Stack::decode_bool($cant_modify);
		$stack['cant_peek'] = Stack::decode_bool($stack['cant_peek']);
		$stack['cant_abort'] = Stack::decode_bool($stack['cant_abort']);
		$stack['private_access'] = Stack::decode_bool($private_access);
		$stack['first_card_id'] = Stack::stack_get_first_card_id($stack_id);
	
		return $stack;
	}


	public static function stack_save($stack_data)
	{
		global $db,$config;
	
		$stack_id = $stack_data['stack_id'];
		$stack_name = $stack_data['stack_name'];
		$cant_delete = Stack::encode_bool($stack_data['cant_delete']);
		$cant_modify = Stack::encode_bool($stack_data['cant_modify']);
		$private_access = Stack::encode_bool($stack_data['private_access']);
		unset($stack_data['stack_id']);
		unset($stack_data['stack_name']);
		unset($stack_data['cant_delete']);
		unset($stack_data['cant_modify']);
		unset($stack_data['private_access']);
		unset($stack_data['first_card_id']);
		$stack_data['cant_peek'] = Stack::encode_bool($stack_data['cant_peek']);
		$stack_data['cant_abort'] = Stack::encode_bool($stack_data['cant_abort']);
	
		$stack_data = json_encode($stack_data);
	
		$sql = 'UPDATE ??stack SET stack_name=?,stack_data=?,cant_delete=?,cant_modify=?,private_access=? WHERE stack_id=?';
		$sql = str_replace('??', $config->database->prefix, $sql);
		$stmt = $db->prepare($sql);
		$null = null;
		$stmt->bind_param('sssssi', $stack_name, $null, $cant_delete, $cant_modify, $private_access, $stack_id);
		$stmt->send_long_data(1, $stack_data);
		if (!$stmt->execute())
			throw new Exception($stmt->error);
		$stmt->close();
	}


	public static function stack_get_list()
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


	public static function stack_get_count_cards($stack_id, $in_bkgnd_id = null)
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


	public static function stack_get_bkgnd_rel_seq($bkgnd_id, $card_seq, $direction)
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


	public static function stack_get_bkgnd_rel_card_id($stack_id, $bkgnd_count, $bkgnd_id, $card_seq, $direction)
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


	public static function stack_get_first_card_id($stack_id)
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

	public static function stack_get_nth_card_id($stack_id, $number, $in_bkgnd = null)
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


	public static function stack_load_card($card_id)
	{
		global $db,$config;
		$card = null;
	
		$sql = 'SELECT stack_id,??card.bkgnd_id,??bkgnd.bkgnd_name,??bkgnd.cant_delete,??bkgnd.dont_search,??bkgnd.bkgnd_data,??card.card_data,'.
			'card_name,card_seq,??card.object_data,??bkgnd.object_data,??card.cant_delete,??card.dont_search,??card.marked '.
			' FROM ??card JOIN ??bkgnd ON ??card.bkgnd_id=??bkgnd.bkgnd_id WHERE card_id=?';
		$sql = str_replace('??', $config->database->prefix, $sql);
		$stmt = $db->prepare($sql);
		$stmt->bind_param('i', $card_id);
		$stmt->execute();
		$stmt->bind_result($stack_id, $bkgnd_id, $bkgnd_name, $bg_cant_delete, $bg_dont_search, $bkgnd_data, $card_data,
			$card_name, $card_seq, $card_object_data, $bkgnd_object_data, $cd_cant_delete, $cd_dont_search, $marked);
		$stmt->fetch();
		$card['card_id'] = $card_id;
		$card['stack_id'] = $stack_id;
		$card['bkgnd_id'] = $bkgnd_id;
		$card['bkgnd_name'] = $bkgnd_name;
		$card['bkgnd_cant_delete'] = Stack::decode_bool($bg_cant_delete);
		$card['bkgnd_dont_search'] = Stack::decode_bool($bg_dont_search);
		$card['card_name'] = $card_name;
		$card['card_seq'] = $card_seq / 10;
		$card['card_object_data'] = $card_object_data;
		$card['bkgnd_object_data'] = $bkgnd_object_data;
		$card['card_cant_delete'] = Stack::decode_bool($cd_cant_delete);
		$card['card_dont_search'] = Stack::decode_bool($cd_dont_search);
		$card['card_marked'] = Stack::decode_bool($marked);
		
		$data = json_decode($bkgnd_data, true);
		$card['bkgnd_script'] = Stack::nvl($data['bkgnd_script'], Array('content'=>'','selection'=>0));
		$card['bkgnd_has_art'] = Stack::nvl($data['bkgnd_has_art'], false);
		
		$data = json_decode($card_data, true);
		$card['card_script'] = Stack::nvl($data['card_script'], Array('content'=>'','selection'=>0));
		$card['card_has_art'] = Stack::nvl($data['card_has_art'], false);
	
		$stmt->close();
		
		$card['stack_count'] = Stack::stack_get_count_cards($card['stack_id'], null);
		$card['bkgnd_count'] = Stack::stack_get_count_cards($card['stack_id'], $card['bkgnd_id']);
	
		return $card;
	}


	public static function stack_save_card($card)
	{
		global $db,$config;
		
		$card_id = $card['card_id'];
		$card_object_data = $card['card_object_data'];
		$card_name = $card['card_name'];
		$cd_cant_delete = Stack::encode_bool($card['card_cant_delete']);
		$cd_dont_search = Stack::encode_bool($card['card_dont_search']);
		$marked = Stack::encode_bool($card['card_marked']);
		
		$card_data = Array();
		$card_data['card_script'] = $card['card_script'];
		$card_data['card_has_art'] = $card['card_has_art'];
		$card_data = json_encode($card_data);
	
		$sql = 'UPDATE ??card SET object_data=?,card_name=?,cant_delete=?,dont_search=?,marked=?,card_data=? WHERE card_id=?';
		$stmt = DB::prepare($sql);
		$null = null;
		$stmt->bind_param('ssssssi', $null, $card_name, $cd_cant_delete, $cd_dont_search, $marked, $null, $card_id);
		$stmt->send_long_data(0, $card_object_data);
		$stmt->send_long_data(5, $card_data);
		if (!$stmt->execute())
			throw new Exception($stmt->error);
		$stmt->close();
		
		$bkgnd_object_data = $card['bkgnd_object_data'];
		$bkgnd_name = $card['bkgnd_name'];
		$bg_cant_delete = Stack::encode_bool($card['bkgnd_cant_delete']);
		$bg_dont_search = Stack::encode_bool($card['bkgnd_dont_search']);
		
		$bkgnd_data = Array();
		$bkgnd_data['bkgnd_script'] = $card['bkgnd_script'];
		$bkgnd_data['bkgnd_has_art'] = $card['bkgnd_has_art'];
		$bkgnd_data = json_encode($bkgnd_data);
	
		$sql = 'UPDATE ??bkgnd SET object_data=?,bkgnd_name=?,cant_delete=?,dont_search=?,bkgnd_data=? '.
			'WHERE bkgnd_id=(SELECT bkgnd_id FROM ??card WHERE card_id=?)';
		$stmt = DB::prepare($sql);
		$null = null;
		$stmt->bind_param('sssssi', $null, $bkgnd_name, $bg_cant_delete, $bg_dont_search, $null, $card_id);
		$stmt->send_long_data(0, $bkgnd_object_data);
		$stmt->send_long_data(4, $bkgnd_data);
		if (!$stmt->execute())
			throw new Exception($stmt->error);
		$stmt->close();
	}


	public static function stack_new_card($after_card_id, $new_bkgnd_too)
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
		//print $sql;
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

	public static function stack_delete_card($card_id)
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
		//print '<p>'.$sql.'</p>';
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


}
