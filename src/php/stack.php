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


/*

Notes
=====

Stack content is generally accessed a card at a time, with the card data including
all relevant background data.

*/


class Stack
{
/*****************************************************************************************
Private Properties
*/

	private $file_db;
	private $name;
	private $stack_id;
	
	
/*****************************************************************************************
Utilities
*/

	private static function decode_bool($expr)
	{
		return ($expr == 1 ? true : false);
	}


	private static function encode_bool($bool)
	{
		return ($bool ? 1 : 0);
	}
	
	
	private static function nvl($value, $ifnull)
	{
		if (is_null($value)) return $ifnull;
		return $value;
	}
	
	
	private static function sl_ok($in_result, $in_db, $in_message)
	{
		if (($in_result === false) || ($in_result === null))
		{
			throw new Exception('Database Error: "'.($in_db === null ? '' : $in_db->errorInfo()[2]).'": '.$in_message.'.');
		}
	}
	
	
/*****************************************************************************************
Creating and Opening Stacks
*/
	/* takes either a database identifier or a file system path;
	the later is assumed to be an SQLite database, the former,
	a MySQL database or supported database connector. */
	public function __construct($in_ident)
	{
		$this->stack_id = $in_ident;
		$this->name = basename($in_ident);
		
		
		if (!file_exists($in_ident)) //die('NOT EXISTS');
			throw new Exception('No such stack');
		
		$this->file_db = new PDO('sqlite:'.$in_ident);
		if ($this->file_db === false)
			die('failed to open');
		
		$this->file_db->exec('PRAGMA encoding = "UTF-8"');
		
		//print 'Opened!';
		//print $in_ident;
	}
	
	
/*
	Creates a file-based stack with the supplied path name.
*/
	public static function create_file($in_path)
	{
		$file_db = new PDO('sqlite:'.$in_path);
		if ($file_db === false)
			die('failed to open');
			
		$file_db->exec('PRAGMA encoding = "UTF-8"');
		
		$file_db->beginTransaction();
		
		Stack::sl_ok($file_db->exec(
			'CREATE TABLE stack ('.
  			'password_hash TEXT DEFAULT NULL,'.
  			'private_access INTEGER NOT NULL DEFAULT 0,'.
  			'stack_data TEXT NOT NULL,'.
  			'cant_delete INTEGER NOT NULL DEFAULT 0,'.
  			'cant_modify INTEGER NOT NULL DEFAULT 0)'
  		), $file_db, 'Creating table: Stack');
  		
  		$stack_data = json_encode(Array('user_level'=>5, 'card_width'=>800, 'card_height'=>600, 'cant_peek'=>false, 'cant_abort'=>false,
  			'script'=>array('content'=>'', 'selection'=>0)));
  		Stack::sl_ok($file_db->exec(
  			'INSERT INTO stack '.
  			'(stack_data) VALUES '.
  			'('.$file_db->quote($stack_data).')'
  		), $file_db, 'Populating table: Stack');  		
  		
  		Stack::sl_ok($file_db->exec(
			'CREATE TABLE bkgnd ('.
			'bkgnd_id INTEGER PRIMARY KEY,'.
			'bkgnd_name TEXT NOT NULL DEFAULT \'\','.
			'object_data TEXT NOT NULL,'.
			'cant_delete INTEGER NOT NULL DEFAULT 0,'.
			'dont_search INTEGER NOT NULL DEFAULT 0,'.
			'bkgnd_data TEXT NOT NULL,'.
			'bkgnd_art TEXT)'
  		), $file_db, 'Creating table: Background');
  		
  		Stack::sl_ok($file_db->exec(
  			'INSERT INTO bkgnd '.
  			'(bkgnd_id, object_data, bkgnd_data) VALUES '.
  			'(1, \'\', \'\')'
  		), $file_db, 'Populating table: Background');
  		
  		Stack::sl_ok($file_db->exec(
			'CREATE TABLE card ('.
			'card_id INTEGER PRIMARY KEY,'.
			'bkgnd_id INTEGER NOT NULL,'.
			'card_name TEXT NOT NULL DEFAULT \'\','.
			'card_seq INTEGER NOT NULL,'.
			'object_data TEXT NOT NULL,'.
			'cant_delete INTEGER NOT NULL DEFAULT 0,'.
			'dont_search INTEGER NOT NULL DEFAULT 0,'.
			'marked INTEGER NOT NULL DEFAULT 0,'.
			'card_data TEXT NOT NULL,'.
			'card_art TEXT)'
  		), $file_db, 'Creating table: Card');
  		
  		Stack::sl_ok($file_db->exec(
  			'INSERT INTO card '.
  			'(card_id, bkgnd_id, card_seq, object_data, card_data) VALUES '.
  			'(1, 1, 10, \'\', \'\')'
  		), $file_db, 'Populating table: Card');
		
		$file_db->commit();
	}
	

	public static function stack_delete($in_ident)
	{
		throw new Exception('stack_delete: Unimplemented');
	} 
	
	
	/*

	// could possibly find stacks in current folder/ passed in folder path?
	
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
*/


/*****************************************************************************************
Accessors and Mutators
*/

/*
	Retrieves the stack data for the stack.
*/
	public function stack_load()
	{
		$stmt = $this->file_db->prepare(
			'SELECT stack_data,cant_delete,cant_modify,private_access FROM stack'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Loading Stack (1)');
		Stack::sl_ok($stmt->execute(), $this->file_db, 'Loading Stack (2)');
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
		Stack::sl_ok($row, $this->file_db, 'Loading Stack (3)');
	
		$stack = json_decode($row['stack_data'], true);
		$stack['stack_name'] = $this->name;
		$stack['cant_delete'] = Stack::decode_bool($row['cant_delete']);
		$stack['cant_modify'] = Stack::decode_bool($row['cant_modify']);
		$stack['private_access'] = Stack::decode_bool($row['private_access']);
		$stack['first_card_id'] = $this->stack_get_first_card_id();
		
		$stack['stack_id'] = $this->stack_id;
		$stack['stack_path'] = $this->stack_id;
		
		$stack['count_cards'] = $this->stack_get_count_cards();
		$stack['count_bkgnds'] = $this->stack_get_count_bkgnds();
		
		$stack['stack_size'] = filesize($this->stack_id);
		$stack['stack_free'] = $this->stack_get_free();
		
		/*$stack['cant_peek'] = Stack::decode_bool($data['cant_peek']);
		$stack['cant_abort'] = Stack::decode_bool($data['cant_abort']);
		$stack['user_level'] = $data['user_level'];
		$stack['card_width'] = $data['card_width'];
		$stack['card_height'] = $data['card_height'];*/
	
		return $stack;
	}


/*
	Saves the supplied stack data to the stack.
*/
	public function stack_save($stack_data)
	{
		$stmt = $this->file_db->prepare(
			'UPDATE stack SET stack_data=?,cant_delete=?,cant_modify=?,private_access=?'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Saving Stack');
		
		$cant_delete = Stack::encode_bool($stack_data['cant_delete']);
		$cant_modify = Stack::encode_bool($stack_data['cant_modify']);
		$private_access = Stack::encode_bool($stack_data['private_access']);
		
		unset($stack_data['cant_delete']);
		unset($stack_data['cant_modify']);
		unset($stack_data['private_access']);
		unset($stack_data['first_card_id']);
		
		unset($stack_data['stack_id']);
		unset($stack_data['stack_name']);
		unset($stack_data['stack_path']);
		unset($stack_data['stack_size']);
		unset($stack_data['stack_free']);
		unset($stack_data['count_cards']);
		unset($stack_data['count_bkgnds']);
	
		Stack::sl_ok($stmt->execute(array(
			json_encode($stack_data), $cant_delete, $cant_modify, $private_access
		)), $this->file_db, 'Loading Stack (2)');
	}
	

/*
	Causes the free space that is unused but allocated within the disk file to be 
	removed.
	
	(May also run diagnostics and minor repairs in future)
*/
	public function stack_compact()
	{
		Stack::sl_ok($this->file_db->exec('VACUUM'), $this->file_db, 'Compacting Stack (1)');
	}
	
	
/*
	Returns the approximate amount of free space in the stack (prior to compacting).
*/
	public function stack_get_free()
	{
		$stmt = $this->file_db->prepare('PRAGMA freelist_count');
		Stack::sl_ok($stmt, $this->file_db, 'Getting Free Space (1)');
		Stack::sl_ok($stmt->execute(), $this->file_db, 'Getting Free Space (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Getting Free Space (3)');
		$page_count = $row[0];
		
		$stmt = $this->file_db->prepare('PRAGMA page_size');
		Stack::sl_ok($stmt, $this->file_db, 'Getting Free Space (4)');
		Stack::sl_ok($stmt->execute(), $this->file_db, 'Getting Free Space (5)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Getting Free Space (6)');
		$page_size = $row[0];
		
		return $page_count * $page_size;
	}


/*
	Returns the number of cards in either the stack, or the specified background.
*/
	public function stack_get_count_cards($in_bkgnd_id = null)
	{
		$sql = 'SELECT COUNT(card_id) FROM card JOIN bkgnd ON card.bkgnd_id=bkgnd.bkgnd_id';
		if ($in_bkgnd_id !== null)
			$sql .= ' AND bkgnd.bkgnd_id=?';
		$stmt = $this->file_db->prepare($sql);
		Stack::sl_ok($stmt, $this->file_db, 'Getting Number of Cards (1)');
		if ($in_bkgnd_id === null)
			Stack::sl_ok($stmt->execute(), $this->file_db, 'Getting Number of Cards (2)');
		else
			Stack::sl_ok($stmt->execute(array(intval($in_bkgnd_id))), $this->file_db, 'Getting Number of Cards (3)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Getting Number of Cards (4)');
		return $row[0];
	}


/*
	Returns the number of backgrounds in the stack.
*/
	public function stack_get_count_bkgnds()
	{
		$stmt = $this->file_db->prepare('SELECT COUNT(bkgnd_id) FROM bkgnd');
		Stack::sl_ok($stmt, $this->file_db, 'Getting Number of Bkgnds (1)');
		Stack::sl_ok($stmt->execute(), $this->file_db, 'Getting Number of Bkgnds (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Getting Number of Bkgnds (3)');
		return $row[0];
	}


/*
	Looks up the card sequence for the card that is either immediately following or prior
	to the supplied sequence within the specified background. 
*/
	public function stack_get_bkgnd_rel_seq($bkgnd_id, $card_seq, $direction)//.($card_seq*10);
	{
		$card_seq *= 10;
		if ($direction > 0)
			$sql = 'SELECT MIN(card_seq) FROM card WHERE bkgnd_id = ? AND card_seq > ?';
		else
			$sql = 'SELECT MAX(card_seq) FROM card WHERE bkgnd_id = ? AND card_seq < ?';
		$stmt = $this->file_db->prepare($sql);
		Stack::sl_ok($stmt, $this->file_db, 'Getting Bkgnd Relative Sequence (1)');
		Stack::sl_ok($stmt->execute(array(intval($bkgnd_id), intval($card_seq))), $this->file_db, 'Getting Bkgnd Relative Sequence (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		if ($row === false) return null;
		return $row[0];
	}


/*
	Looks up the card ID for the card that is either immediately following or prior to the
	supplied sequence within the specified background.
*/
	public function stack_get_bkgnd_rel_card_id($bkgnd_count, $bkgnd_id, $card_seq, $direction)
	{
		$rel_seq = $this->stack_get_bkgnd_rel_seq($bkgnd_id, $card_seq, $direction);
		if ($rel_seq === null)
		{
			if ($direction > 0) return $this->stack_get_nth_card_id(1, $bkgnd_id);
			else return $this->stack_get_nth_card_id($bkgnd_count, $bkgnd_id);
		}
	
		$stmt = $this->file_db->prepare('SELECT card_id FROM card WHERE bkgnd_id=? AND card_seq=?');
		Stack::sl_ok($stmt, $this->file_db, 'Getting Relative Card (1)');
		Stack::sl_ok($stmt->execute(array(intval($bkgnd_id), $rel_seq)), $this->file_db, 'Getting Relative Card (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Getting Relative Card(3)');
		return $row[0];
	}


/*
	Looks up the first card ID for the stack.
*/
	public function stack_get_first_card_id()
	{
		$stmt = $this->file_db->prepare('SELECT card_id FROM card WHERE card_seq=10');
		Stack::sl_ok($stmt, $this->file_db, 'Getting First Card (1)');
		Stack::sl_ok($stmt->execute(), $this->file_db, 'Getting First Card (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Getting First Card(3)');
		return $row[0];
	}
	

/*
	Looks up the card ID for the Nth card within either the stack or the 
	supplied background.
*/
	public function stack_get_nth_card_id($number, $in_bkgnd = null)
	{
		if ($in_bkgnd === null)
			$sql = 'SELECT card_id FROM card WHERE card_seq=?';
		else
			$sql = 'SELECT card_id FROM card WHERE bkgnd_id=? ORDER BY card_seq LIMIT ?,1'; //'.(intval($number)-1).',1
		$stmt = $this->file_db->prepare($sql);
		Stack::sl_ok($stmt, $this->file_db, 'Getting Nth Card (1)');
		if ($in_bkgnd === null)
			Stack::sl_ok($stmt->execute(array( intval($number) * 10 )), $this->file_db, 'Getting Nth Card (2)');
		else
			Stack::sl_ok($stmt->execute(array( intval($in_bkgnd), (intval($number) - 1) )), $this->file_db, 'Getting Nth Card (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		if ($row === false) return 0;
		return $row[0];
	}


/*
	Retrieves the card data for the supplied card ID.
*/
	public function stack_load_card($card_id)
	{
		$stmt = $this->file_db->prepare(
			'SELECT card.bkgnd_id, bkgnd.bkgnd_name, bkgnd.cant_delete, bkgnd.dont_search, '.
			'bkgnd.bkgnd_data, card.card_data, card_name, card_seq, card.object_data, '.
			'bkgnd.object_data, card.cant_delete, card.dont_search, card.marked, card.card_art, bkgnd.bkgnd_art '.
			'FROM card JOIN bkgnd ON card.bkgnd_id=bkgnd.bkgnd_id WHERE card_id=?'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Loading Card (1)');
		Stack::sl_ok($stmt->execute(array(intval($card_id))), $this->file_db, 'Loading Card (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		if ($row === false) return null;
		
		$card['card_id'] = intval($card_id);
		$card['card_name'] = $row[6];
		$card['card_seq'] = $row[7] / 10;
		$card['card_cant_delete'] = Stack::decode_bool($row[10]);
		$card['card_dont_search'] = Stack::decode_bool($row[11]);
		$card['card_marked'] = Stack::decode_bool($row[12]);
		
		$data = json_decode($row[5], true);
		$card['card_script'] = Stack::nvl($data['card_script'], Array('content'=>'','selection'=>0));
		$card['card_has_art'] = Stack::nvl($data['card_has_art'], false);
		
		$card['data'] = '';
		if (isset($data['data'])) $card['data'] = $data['data'];
		
		$card['card_art'] = null;
		if (isset($row[13])) $card['card_art'] = $row[13];
		
		//if (isset($data['content']))
		//	$card['content'] = $data['content'];
		
		$card['card_object_data'] = $row[8];
		
		$card['bkgnd_id'] = $row[0];
		$card['bkgnd_name'] = $row[1];
		$card['bkgnd_cant_delete'] = Stack::decode_bool($row[2]);
		$card['bkgnd_dont_search'] = Stack::decode_bool($row[3]);
		
		$data = json_decode($row[4], true);
		$card['bkgnd_script'] = Stack::nvl($data['bkgnd_script'], Array('content'=>'','selection'=>0));
		$card['bkgnd_has_art'] = Stack::nvl($data['bkgnd_has_art'], false);
		
		$card['bkgnd_art'] = null;
		if (isset($row[14])) $card['bkgnd_art'] = $row[14];
		
		$card['bkgnd_object_data'] = $row[9];
		
		$card['stack_count'] = Stack::stack_get_count_cards(null);
		$card['bkgnd_count'] = Stack::stack_get_count_cards($card['bkgnd_id']);
	
		return $card;
	}


/*
	Saves the supplied card data to the stack.
*/
	public function stack_save_card($card)
	{
		$this->file_db->beginTransaction();
		
		$data = array();
		$data['card_script'] = $card['card_script'];
		$data['card_has_art'] = $card['card_has_art'];
		$data['data'] = $card['data'];
	
		$sql = 'UPDATE card SET object_data=?,card_name=?,cant_delete=?,dont_search=?,marked=?,card_data=?';
		if (isset($card['card_art'])) $sql .= ',card_art=?';
		$sql .= ' WHERE card_id=?';

		$stmt = $this->file_db->prepare($sql);
		Stack::sl_ok($stmt, $this->file_db, 'Saving Card (1)');
		$params = array(
			$card['card_object_data'],
			$card['card_name'],
			Stack::encode_bool($card['card_cant_delete']),
			Stack::encode_bool($card['card_dont_search']),
			Stack::encode_bool($card['card_marked']),
			json_encode($data)
		);
		if (isset($card['card_art'])) $params[] = $card['card_art'];
		$params[] = intval($card['card_id']);
		
		$rows = $stmt->execute($params);
		if ($rows == 0) Stack::sl_ok(false, $this->file_db, 'Saving Card (2)');
		Stack::sl_ok($rows, $this->file_db, 'Saving Card (3)');
		
		$data = array();
		$data['bkgnd_script'] = $card['bkgnd_script'];
		$data['bkgnd_has_art'] = $card['bkgnd_has_art'];
		
		$sql = 'UPDATE bkgnd SET object_data=?,bkgnd_name=?,cant_delete=?,dont_search=?,bkgnd_data=?';
		if (isset($card['bkgnd_art'])) $sql .= ',bkgnd_art=?';
		$sql .= ' WHERE bkgnd_id=(SELECT bkgnd_id FROM card WHERE card_id=?)';
		$stmt = $this->file_db->prepare($sql);
		
		Stack::sl_ok($stmt, $this->file_db, 'Saving Bkgnd (1)');
		$params = array(
			$card['bkgnd_object_data'],
			$card['bkgnd_name'],
			Stack::encode_bool($card['bkgnd_cant_delete']),
			Stack::encode_bool($card['bkgnd_dont_search']),
			json_encode($data)
		);
		if (isset($card['bkgnd_art'])) $params[] = $card['bkgnd_art'];
		$params[] = intval($card['card_id']);
		
		$rows = $stmt->execute($params);
		if ($rows == 0) Stack::sl_ok(false, $this->file_db, 'Saving Bkgnd (2)');
		Stack::sl_ok($rows, $this->file_db, 'Saving Bkgnd (3)');
		
		$this->file_db->commit();
	}
	

/*
	Allows 'direct injection' of a complete background into the stack.
	(currently used for HC Import)
*/
	public function stack_inject_bkgnd($card)
	{
		$data = array();
		$data['bkgnd_script'] = $card['bkgnd_script'];
		$data['bkgnd_has_art'] = $card['bkgnd_has_art'];
		
		$stmt = $this->file_db->prepare(
			'INSERT INTO bkgnd (bkgnd_id,object_data,bkgnd_name,cant_delete,dont_search,bkgnd_data) '.
			'VALUES (?,?,?,?,?,?)'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Injecting Bkgnd (1)');
		$rows = $stmt->execute(array(
			$card['bkgnd_id'],
			$card['bkgnd_object_data'],
			$card['bkgnd_name'],
			Stack::encode_bool($card['bkgnd_cant_delete']),
			Stack::encode_bool($card['bkgnd_dont_search']),
			json_encode($data)
		));
		if ($rows == 0) Stack::sl_ok(false, $this->file_db, 'Injecting Bkgnd (2)');
		Stack::sl_ok($rows, $this->file_db, 'Injecting Bkgnd (3)');
		
		return $this->file_db->lastInsertId();
	}
	

/*
	Allows 'direct injection' of a complete card into the stack.
	(currently used for HC Import)
*/
	public function stack_inject_card($card)
	{
		$data = array();
		$data['card_script'] = $card['card_script'];
		$data['card_has_art'] = $card['card_has_art'];
		$data['content'] = $card['content'];
		$data['data'] = $card['data'];
	
		$stmt = $this->file_db->prepare(
			'INSERT INTO card (card_id,object_data,card_name,cant_delete,dont_search,marked,card_data,bkgnd_id,card_seq) '.
			'VALUES (?,?,?,?,?,?,?,?,?)'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Injecting Card (1)');
		$rows = $stmt->execute(array(
			$card['card_id'],
			$card['card_object_data'],
			$card['card_name'],
			Stack::encode_bool($card['card_cant_delete']),
			Stack::encode_bool($card['card_dont_search']),
			0, // not marked
			json_encode($data),
			$card['card_bkgnd_id'],
			$card['card_seq']
		));
		if ($rows == 0) Stack::sl_ok(false, $this->file_db, 'Injecting Card (2)');
		Stack::sl_ok($rows, $this->file_db, 'Injecting Card (3)');
		
		return $this->file_db->lastInsertId();
	}
	
	
/*
	Deletes all cards and backgrounds from the stack.
	(currently used ONLY for HC Import, which requires a completely empty stack)
*/
	public function zap_all_cards()
	{
		$stmt = $this->file_db->prepare(
			'DELETE FROM card'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Deleting All Cards (1)');
		$rows = $stmt->execute();
		Stack::sl_ok($rows, $this->file_db, 'Deleting All Cards (2)');
	
		$stmt = $this->file_db->prepare(
			'DELETE FROM bkgnd'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Deleting All Cards (3)');
		$rows = $stmt->execute();
		Stack::sl_ok($rows, $this->file_db, 'Deleting All Cards (4)');
	}


/*
	Creates a new card and optionally an accompanying new background.
	Returns the ID of the new card.
*/
	public function stack_new_card($after_card_id, $new_bkgnd_too)
	{
		$card_id = null;
		$this->file_db->beginTransaction();
	
		$stmt = $this->file_db->prepare(
			'SELECT card.bkgnd_id, card_seq '.
			'FROM card JOIN bkgnd ON card.bkgnd_id=bkgnd.bkgnd_id '.
			'WHERE card_id=?'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Creating Card (1)');
		Stack::sl_ok($stmt->execute(array(intval($after_card_id))), $this->file_db, 'Creating Card (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Creating Card (3)');
		$bkgnd_id = $row[0];
		$existing_seq = $row[1];
		
		if ($new_bkgnd_too)
		{
			$stmt = $this->file_db->prepare(
				'INSERT INTO bkgnd (object_data, bkgnd_data) VALUES (\'\', ?)'
			);
			Stack::sl_ok($stmt, $this->file_db, 'Creating Bkgnd (1)');
			Stack::sl_ok($stmt->execute(array('')), $this->file_db, 'Creating Bkgnd (2)');
			$bkgnd_id = $this->file_db->lastInsertId();
		}
		if ($bkgnd_id === null) Stack::sl_ok(false, null, 'Creating Card (4)');
	   
	   	$stmt = $this->file_db->prepare(
			'UPDATE card SET card_seq=card_seq+10 WHERE card_seq>?'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Creating Card (5)');
		Stack::sl_ok($stmt->execute(array($existing_seq)), $this->file_db, 'Creating Card (6)');
	   
	   	$stmt = $this->file_db->prepare(
			'INSERT INTO card (bkgnd_id,card_seq,object_data,card_data) VALUES (?,?,\'\',\'\')'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Creating Card (7)');
		Stack::sl_ok($stmt->execute(array( $bkgnd_id, ($existing_seq + 10) )), $this->file_db, 'Creating Card (8)');
	   	$card_id = $this->file_db->lastInsertId();
	   
	   	$this->file_db->commit();
	
		return $card_id;
	}


/*
	Deletes the specified card from the stack, and if it's the last card in the
	background also deletes the background.
	
	Will not permit deleting the last card of the stack.
*/
	public function stack_delete_card($card_id)
	{
		$next_card_id = null;
		$this->file_db->beginTransaction();
		
		$stmt = $this->file_db->prepare(
			'SELECT bkgnd_id, card_seq FROM card WHERE card_id=?'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Deleting Card (1)');
		Stack::sl_ok($stmt->execute(array( intval($card_id) )), $this->file_db, 'Deleting Card (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Deleting Card (3)');
		$bkgnd_id = $row[0];
		$existing_seq = $row[1];
		
		$stmt = $this->file_db->prepare(
			'SELECT COUNT(card.card_id) FROM card WHERE bkgnd_id=?'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Deleting Card (4)');
		Stack::sl_ok($stmt->execute(array( intval($bkgnd_id) )), $this->file_db, 'Deleting Card (5)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Deleting Card (6)');
		$bkgnd_count = $row[0];
		$cleanup_bkgnd = ($bkgnd_count == 1);
		
		$stmt = $this->file_db->prepare(
			'SELECT COUNT(card.card_id) FROM card'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Deleting Card (7)');
		Stack::sl_ok($stmt->execute(), $this->file_db, 'Deleting Card (8)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Deleting Card (9)');
		$stack_count = $row[0];
		if ($stack_count == 1)
			Stack::sl_ok(false, null, 'Deleting Card (10); Last Card in Stack');
		
		$stmt = $this->file_db->prepare(
			'DELETE FROM card WHERE card_id=?'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Deleting Card (11)');
		$rows = $stmt->execute(array( intval($card_id) ));
		if ($rows === 0) $rows = false;
		Stack::sl_ok($rows, $this->file_db, 'Deleting Card (12)');
		
		$stmt = $this->file_db->prepare(
			'UPDATE card SET card_seq=card_seq-10 WHERE card_seq>?'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Deleting Card (13)');
		Stack::sl_ok($stmt->execute(array( intval($existing_seq) )), $this->file_db, 'Deleting Card (14)');
		
		if ($cleanup_bkgnd)
		{
			$stmt = $this->file_db->prepare(
				'DELETE FROM bkgnd WHERE bkgnd_id=?'
			);
			Stack::sl_ok($stmt, $this->file_db, 'Deleting Bkgnd (1)');
			$rows = $stmt->execute(array( $bkgnd_id ));
			if ($rows === 0) $rows = false;
			Stack::sl_ok($rows, $this->file_db, 'Deleting Bkgnd (2)');
		}
		
		$stmt = $this->file_db->prepare(
			'SELECT card_id FROM card WHERE card_seq=?'
		);
		Stack::sl_ok($stmt, $this->file_db, 'Deleting Card (15)');
		Stack::sl_ok($stmt->execute(array( intval($existing_seq) )), $this->file_db, 'Deleting Card (16)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		if ($row)
			$next_card_id = $row[0];
		else
			$next_card_id = $this->stack_get_first_card_id();
		
		$this->file_db->commit();
		return $next_card_id;
	}


}
