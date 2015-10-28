<?php
/*
CinsImp
Stack database adapter

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




// re scripts and locking and caching:
// should probably take stack script and anything that is presently loaded as-is
// with caches and indexes on the client-side at runtime, for the duration of the event
// handling, with a reload of changable data (such as stack script) automatically
// when card/bkgnd information is retrieved and the script has been modified.


// bear in mind, need to be able to temporarily lock a script from writing
// for a specific user, which might feed into this...

// what needs to be lockable?

// icons are imported/deleted, not particularly bothered about locking..
// if an icon is deleted and another user is using it, it wont disappear until
// they close and re-open the stack anyway.

// stats are calculated

// scripts need locking during editing

// card size is fairly major and needs to be reported almost immediately,
// or only changable when no one else is in the file?


// Go the simple locking model:

// a simpler locking model allows only one person at a time to author the stack
// and many people to modify data on different cards, with only locks on stack and card

// locking, request the attribute/object via a locking handler
// which returns the value and whether it's read/only or read/write,
// and the name of who has locked it.
// if it's read-only, can force read-write, but then when a save is 
// commited by another user, it will see the owner is different 
// and return an error that the lock was broken by that user

// figure out later.


*/


class Stack
{
/*****************************************************************************************
Private Properties
*/

	private $file_db;			/* the SQLite database handle */
	private $name;				/* the title of the stack */
	private $stack_id;			/* the file pathname */
	private $stack_path; 		/* public representation of where file is */
	
	private $file_read_only;	/* the file or file system is read-only */
	
	private $cant_modify;		/* the user has set the stack to be read-only */
	private $password_hash;		/* users with this password can override any access
								restrictions for the duration of their session */
	private $private_access;	/* only users with the password can open the stack */
	private $cant_delete;		/* is stack allowed to be deleted by the user
								or a CinsTalk script? */
	
	private $record_version;	/* everytime the stack record is modified,
								this integer gets incremented.
								a client transmits a copy for each gateway operation,
								which if different to the stored version implies the
								client stack block is out-of-date and needs to be
								pushed to the client (someone else modified it.) */
	
	private $authenticated;		/* true if authentication was successful */

	
/*****************************************************************************************
Public Constants
*/
	 const FLAG_STACK_INFO = 1;
	 const FLAG_STACK_SCRIPT = 2;
	 const FLAG_STACK_ICONS = 4;
	 const FLAG_STACK_OPTS = 8;
	
	
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
	
	
	private static function sl_err($in_result, $in_db, $in_message, $in_code)
	{
		if (($in_result === false) || ($in_result === null))
		{
			throw new Exception($in_message, $in_code);
		}
	}
	

	
	
/*****************************************************************************************
Creating and Opening Stacks
*/

/*
	Opens the Stack with the supplied file path name.
	
	Throws: 
		404 Stack Not Found
		520 Invalid Stack or Stack Corrupt
		520 Stack Too New
*/
	public function __construct($in_ident)
	{
		/* configure the instance */
		$this->stack_id = $in_ident;
		$this->name = basename($in_ident);
		$this->stack_path = substr($in_ident, strlen($_SERVER['DOCUMENT_ROOT']));
		
		/* check if the supplied stack file exists */
		if (!file_exists($in_ident))
			throw new Exception('Stack Not Found', 404);
			
		/* check if the file is read-only */
		$this->file_read_only = (!is_writable($in_ident));
		
		/* open the file as a SQLite database */
		try
		{	
			$this->file_db = new PDO('sqlite:'.$in_ident);
			if ($this->file_db === false)
				throw new Exception('Invalid Stack or Stack Corrupt', 520);
			$this->file_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$this->file_db->exec('PRAGMA encoding = "UTF-8"');
		}
		catch (Exception $err)
		{
			throw new Exception('Invalid Stack or Stack Corrupt', 520);
		}
		
		/* preload security info and check file version */
		try
		{
			$this->load_check_essentials();
		}
		catch (Exception $err)
		{
			throw new Exception('Stack Too New; '.$err->getMessage(), 520);
		}
		
		/* if the stack has private access,
		raise an exception and request private access */
		if ($this->private_access)
			CinsImpError::_unauthenticated('Private access flag is enabled');
	}
	
	
/*
	Preloads vital security information and checks the file format version
	is supported by this version of CinsImp.
*/
	private function load_check_essentials()
	{
		$stmt = $this->file_db->prepare(
'SELECT format_version,password_hash,private_access,cant_modify,cant_delete,record_version FROM cinsimp_stack'
		);
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_NUM);
		
		if ($row[0] > 1)
			CinsImpError::_general('Stack Too New', 'Stack was created with a newer version of CinsImp');
				
		$this->password_hash = $row[1];
		$this->private_access = Stack::decode_bool($row[2]);
		$this->cant_modify = Stack::decode_bool($row[3]);
		$this->cant_delete = Stack::decode_bool($row[4]);
		
		$this->record_version = $row[5];
	}
	
	
/*
	Creates a Stack with the supplied file path name.
*/
	public static function create_file($in_path)
	{
		/* create the SQLite database file */
		try
		{
			$file_db = new PDO('sqlite:'.$in_path);
			if ($file_db === false)
				throw new Exception('Cannot Create Database');
			$file_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$file_db->exec('PRAGMA encoding = "UTF-8"');
		}
		catch (Exception $err)
		{
			CinsImpError::_general('Cannot Create Stack', $err->getMessage());
		}
		
		/* create and populate the schema */
		try
		{
			$file_db->beginTransaction();
		
			$create_table_sql = "
		
CREATE TABLE cinsimp_stack (
	format_version INTEGER NOT NULL,
	
	record_version INTEGER NOT NULL DEFAULT 0,
	
	password_hash TEXT NOT NULL DEFAULT '',
	private_access INTEGER NOT NULL DEFAULT 0,
	cant_modify INTEGER NOT NULL DEFAULT 0,
	cant_delete INTEGER NOT NULL DEFAULT 0,
	cant_abort INTEGER NOT NULL DEFAULT 0,
	cant_peek INTEGER NOT NULL DEFAULT 0,
	user_level INTEGER NOT NULL DEFAULT 5,
	
	card_width INTEGER NOT NULL DEFAULT 800,
	card_height INTEGER NOT NULL DEFAULT 600,
	
	script TEXT NOT NULL DEFAULT ''
);

CREATE TABLE bkgnd (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL DEFAULT '',
	cant_delete INTEGER NOT NULL DEFAULT 0,
	dont_search INTEGER NOT NULL DEFAULT 0,
	script TEXT NOT NULL DEFAULT '',
	art TEXT NOT NULL DEFAULT '',
	art_hidden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE card (
	id INTEGER PRIMARY KEY,
	bkgnd_id INTEGER NOT NULL,
	card_seq INTEGER NOT NULL,
	name TEXT NOT NULL DEFAULT '',
	cant_delete INTEGER NOT NULL DEFAULT 0,
	dont_search INTEGER NOT NULL DEFAULT 0,
	marked INTEGER NOT NULL DEFAULT 0,
	script TEXT NOT NULL DEFAULT '',
	art TEXT NOT NULL DEFAULT '',
	art_hidden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE card_data (
	card_id INTEGER NOT NULL,
	bkgnd_object_id INTEGER NOT NULL,
	content TEXT NOT NULL DEFAULT ''
);

CREATE TABLE icon (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL DEFAULT '',
	png_data TEXT NOT NULL DEFAULT ''
);

CREATE TABLE button (
	id INTEGER NOT NULL,
	layer_id INTEGER NOT NULL,
	part_num INTEGER NOT NULL,
	location TEXT NOT NULL,
	size TEXT NOT NULL,
	name TEXT NOT NULL,
	shared INTEGER NOT NULL,
	searchable INTEGER NOT NULL,
	visible INTEGER NOT NULL,
	script TEXT NOT NULL,
	disabled INTEGER NOT NULL,
	txt_align TEXT NOT NULL,
	txt_font TEXT NOT NULL,
	txt_size INTEGER NOT NULL,
	txt_style TEXT NOT NULL,
	color_rgb TEXT NOT NULL,
	shadow INTEGER NOT NULL,
	content TEXT NOT NULL,
	
	style TEXT NOT NULL,
	family INTEGER NOT NULL,
	menu TEXT NOT NULL,
	icon INTEGER NOT NULL,
	show_name INTEGER NOT NULL,
	hilite INTEGER NOT NULL,
	auto_hilite INTEGER NOT NULL,
	
	PRIMARY KEY (id, layer_id)
);

CREATE TABLE field (
	id INTEGER NOT NULL,
	layer_id INTEGER NOT NULL,
	part_num INTEGER NOT NULL,
	location TEXT NOT NULL,
	size TEXT NOT NULL,
	name TEXT NOT NULL,
	shared INTEGER NOT NULL,
	searchable INTEGER NOT NULL,
	visible INTEGER NOT NULL,
	script TEXT NOT NULL,
	disabled INTEGER NOT NULL,
	txt_align TEXT NOT NULL,
	txt_font TEXT NOT NULL,
	txt_size INTEGER NOT NULL,
	txt_style TEXT NOT NULL,
	color_rgb TEXT NOT NULL,
	shadow INTEGER NOT NULL,
	content TEXT NOT NULL,
	
	border INTEGER NOT NULL,
	scroll INTEGER NOT NULL,
	locked INTEGER NOT NULL,
	dont_wrap INTEGER NOT NULL,
	auto_tab INTEGER NOT NULL,
	wide_margins INTEGER NOT NULL,
	auto_select INTEGER NOT NULL,
	selection TEXT NOT NULL,
	picklist TEXT NOT NULL,
	
	PRIMARY KEY (id, layer_id)
);

INSERT INTO cinsimp_stack (format_version) VALUES (1);
INSERT INTO bkgnd (id) VALUES (1);
INSERT INTO card (id, bkgnd_id, card_seq) VALUES (1, 1, 1);

";

			$stmts = explode(';', $create_table_sql);
			$s_num = 1;
			foreach ($stmts as $stmt)
			{
				$stmt = trim($stmt);
				if ($stmt != '')
				{
					try { $file_db->exec($stmt); }
					catch (Exception $err) 
					{ CinsImpError::_internal('Statement '.$s_num.': '.$err->getMessage()); }
					$s_num++;
				}
			}
			
			$file_db->commit();
			
		}
		catch (Exception $err)
		{
			CinsImpError::_general('Cannot Create Stack', $err->getMessage());
		}
	}
	
	
	public static function stack_delete($in_ident)
	{
		CinsImpError::_unimplemented();
	} 
	


/*****************************************************************************************
Security and Restrictions Management
*/

/*
	Checks if the supplied password hash matches the hash stored in the database.
	If not, throws an exception requesting authentication.
*/
	public function stack_authenticate($in_password_hash)
	{
		global $config;
		if ($in_password_hash === $this->password_hash)
			$this->authenticated = true;
		else
		{
			$this->authenticated = false;
			throw new Exception('Authentication Required', 401); 
			// this must be converted to an appropriate JSON response, not HTTP
		}
	}
	

/*
	Checks if authentication is required (private access = true) but not provided.
	If required but not provided, circumvents whatever routine is running and throws an
	exception that demands authentication.
*/
	private function _check_access()
	{
		global $config;
		if (!$this->private_access) return;
		if ($this->authenticated) return;
		throw new Exception('Authentication Required', 401); 
		// this must be converted to an appropriate JSON response, not HTTP
	}
	

/*
	Checks if not authenticated and authentication required for sensitive changes.
*/
	private function _check_authenticated()
	{
		if (!$this->authenticated && $this->password_hash != '')
			throw new Exception('Authentication Required', 401); 
	}
	
	
/*
	Raises an exception if the stack cannot be modified.
*/
	private function _check_mutability()
	{
		$this->_check_access();
		if (!$this->stack_mutability())
			throw new Exception('Stack Can\'t Be Modified', 403);
	}
	

/*
	Raises an exception if the stack cannot be grown.
*/
	private function _check_growability()
	{
		$this->_check_mutability();
		if (!$this->stack_growability())
			throw new Exception('Stack Too Big', 403);
	}
	
	
/*
	Returns true if the stack can be modified at all.
*/
	public function stack_mutability()
	{
		if ($this->file_read_only) return false;
		if (!$this->cant_modify) return true;
		if ($this->authenticated) return true;
	}
	

/*
	Returns true if the stack can be grown (increased substantially in size).
*/
	public function stack_growability()
	{
		global $config;
		if (filesize($this->stack_id) >= $config->restrictions->max_stack_size)
			return false;
		return true;
	}
	
	


/*****************************************************************************************
Accessors and Mutators
*/

/*
	Retrieves statistics about the stack that change as the stack is used and modified.
*/
	public function stack_stats()
	{
		$this->_check_access();
		
		/* calculate approximately how much free 'wasted' space is used by the file */
		try 
		{
			$stmt = $this->file_db->prepare('PRAGMA freelist_count');
			$stmt->execute();
			$row = $stmt->fetch(PDO::FETCH_NUM);
			$page_count = $row[0];
			$stmt = $this->file_db->prepare('PRAGMA page_size');
			$stmt->execute();
			$row = $stmt->fetch(PDO::FETCH_NUM);
			$page_size = $row[0];
			$approx_free_space = $page_count * $page_size;
		}
		catch (Exception $err)
			{ throw new Exception('Cannot Calculate Free Space; '.$err->getMessage(), 520); }
		
		/* return the statistics */
		$stats = array(
			'size'=>filesize($this->stack_id),
			'free'=>$approx_free_space,
			'count_cards'=>$this->stack_get_count_cards(),
			'count_bkgnds'=>$this->stack_get_count_bkgnds()
		);
		
		return $stats;
	}

	
	
/*
	Retrieves the most up-to-date stack record information.
*/
	private function _record()
	{
		$stmt = $this->file_db->prepare('SELECT * FROM cinsimp_stack');
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
	
		$record = array(
			'name'=>$this->name,
			'path'=>$this->stack_path,
			'id'=>$this->stack_path, // should probably be a full URL, generated from configuration for security
			
			'record_version'=>$this->record_version,
			
			'file_locked'=>$this->file_read_only,
			'cant_modify'=>$this->cant_modify,
			'cant_delete'=>$this->cant_delete,
			'private_access'=>$this->private_access,
			
			'cant_peek'=>Stack::decode_bool($row['cant_peek']),
			'cant_abort'=>Stack::decode_bool($row['cant_abort']),
			'user_level'=>$row['user_level'],
			
			'card_width'=>$row['card_width'],
			'card_height'=>$row['card_height'],
			
			'script'=>$row['script']
		);
		
		$record = array_merge($record, $this->stack_stats());
		
		return $record;
	}
	
	
/*
	Returns a complete table of icons within the stack.
*/
	private function _icons()
	{
		$table = array();
		$stmt = $this->file_db->prepare(
			'SELECT id,name,png_data FROM icon'
		);
		$stmt->execute();
		while (($row = $stmt->fetch(PDO::FETCH_NUM)) !== false)
		{
			$table[] = $row;
		}
		return $table;
	}
	
							
/*
	Retrieves the stack data for the stack, such as would generally be required to 
	open the stack.
*/
	public function stack_load()
	{
		$this->_check_access();
		$stack = $this->_record();
		$stack['icons'] = $this->_icons();
		return $stack;
	}


// what kinds of updates needed here?
// name, cant modify, cant_delete, private_access, cant_peek, cant_abort, user_level,
// card_width, card_height, script
// ONLY the fields supplied should be updated
// ONLY record version should be returned if successful (and incremented)
// don't allow authoring changes if the stack's user level is restricted
// and don't allow security changes if a password is set and not yet authenticated
// changing name is highly questionable, since it makes other user's access broken


/*
	Prepares a simple SQL UPDATE statement, given the supplied key-value pairs
	and the list of fields which may be included in the statement.
*/
	private static function _sql_optional_update($table, &$data, $optional_fields)
	{
		$sql_fields = array();
		$sql_values = array();
		
		foreach ($optional_fields as $field_def)
		{
			$parts = explode(':', $field_def);
			$field_name = $parts[0];
			$field_type = $parts[1];
			
			if (array_key_exists($field_name, $data))
			{
				$sql_fields[] = $field_name . '=?';
				
				$field_value = $data[$field_name];
				
				switch ($field_type)
				{
				case 'bool':
					$field_value = Stack::encode_bool($field_value);
					break;
				case 'uint16':
					$field_value = intval($field_value);
					if ($field_value < 0 || $field_value > 32000)
						CinsImpError::malformed('_sql_optional_update: field "'.$field_name.'": out of range');
					break;
				case 'text16':
					$field_value = strval($field_value);
					if (strlen($field_value) > 32000)
						CinsImpError::malformed('_sql_optional_update: field "'.$field_name.'": exceeds 32 KB');
					break;
				default:
					CinsImpError::internal('_sql_optional_update: field "'.$field_name.'": type unspecified');
				}
					
				$sql_values[] = $field_value;
			}
		}
		
		if (count($sql_fields) == 0) return null;
		
		return array(
			'sql'=>'UPDATE '.$table.' SET '.implode(', ', $sql_fields),
			'params'=>$sql_values
		);
	}


/*
	Saves the supplied stack data to the stack.
*/
	public function stack_save($data)
	{
		$this->_check_mutability();
	
		/* do the rename before any other changes */
		if (array_key_exists('name', $data))
			Stack::_unimplemented();
		
		$this->file_db->beginTransaction();
		
		/* update the stack; security fields */
		$did_update_something = false;
		$sql = Stack::_sql_optional_update('cinsimp_stack', $data, 
			array('cant_modify:bool', 'cant_delete:bool', 'cant_peek:bool', 
				'cant_abort:bool', 'user_level:bool', 'private_access:bool'));
		if ($sql !== null)
		{
			$this->_check_authenticated();
			$stmt = $this->file_db->prepare($sql['sql']);
			$stmt->execute($sql['params']);
			$did_update_something = true;
		}
		
		/* update the stack; general fields */
		$sql = Stack::_sql_optional_update('cinsimp_stack', $data,
			array('card_width:uint16', 'card_height:uint16', 'script:text16'));
		if ($sql !== null)
		{
			$stmt = $this->file_db->prepare($sql['sql']);
			$stmt->execute($sql['params']);
			$did_update_something = true;
		}
		
		/* increment the record version */
		if ($did_update_something)
			$this->file_db->exec('UPDATE cinsimp_stack SET record_version=record_version + 1');
		$this->file_db->commit();
		
		/* reload essentials */
		$this->load_check_essentials();
		
		return $this->record_version;
	}
	
	
/*
	Returns the allocated icon ID if successful,
	or raises an exception otherwise and returns 0.
*/
	public function stack_import_icon($in_preferred_id, $in_name, $in_data)
	{
		/* try to import with supplied ID */
		$this->file_db->beginTransaction();
		$stmt = $this->file_db->prepare('INSERT INTO icon (icon_id,icon_name,icon_data) VALUES (?,?,?)');
		if ($stmt->execute(array(intval($in_preferred_id), $in_name, $in_data)) === false)
		{
			/* resort to an automatically allocated ID */
			$stmt = $this->file_db->prepare('INSERT INTO icon (icon_id,icon_name,icon_data) VALUES (NULL,?,?)');
			Stack::sl_ok($stmt->execute(array($in_name, $in_data)), $this->file_db, 'Importing Icon (2)');
			$in_preferred_id = $this->file_db->lastInsertId();
		}
		if (!$this->file_db->commit())
			throw new Exception('Couldn\'t import icon');
		return $in_preferred_id;
	}



/*
Eventually methods for icon deletion/rename:

				case 2: // delete icon - removes it from the stack database
					$stmt2 = $this->file_db->prepare('DELETE FROM icon WHERE icon_id=?');
					Stack::sl_ok($stmt2->execute(array(intval($task[1]))), $this->file_db, 'Saving Stack Delete Icon');
					break;
				case 3: // renames an icon - changes ID and name
					$stmt2 = $this->file_db->prepare('UPDATE ICON set icon_id=?, icon_name=? WHERE icon_id=?');
					Stack::sl_ok($stmt2->execute(array(intval($task[2]), $task[3], $task[1])), $this->file_db, 'Saving Stack Rename Icon');
					break;
				}
*/
	

/*
	Causes the free space that is unused but allocated within the disk file to be 
	removed.
	
	(May also run diagnostics and minor repairs in future)
*/
	public function stack_compact()
	{
		$this->stack_will_be_modified();
		Stack::sl_ok($this->file_db->exec('VACUUM'), $this->file_db, 'Compacting Stack (1)');
	}
	



/*
	Returns the number of cards in either the stack, or the specified background.
*/
	public function stack_get_count_cards($in_bkgnd_id = null)
	{
		if ($in_bkgnd_id === null)
			$sql = 'SELECT COUNT(*) FROM card';
		else
			$sql = 'SELECT COUNT(card.id) FROM card JOIN bkgnd ON card.bkgnd_id=bkgnd.id WHERE bkgnd.id=?';
		$stmt = $this->file_db->prepare($sql);
		if ($in_bkgnd_id === null) $stmt->execute();
		else $stmt->execute(array( intval($in_bkgnd_id) ));
		$row = $stmt->fetch(PDO::FETCH_NUM);
		return $row[0];
	}


/*
	Returns the number of backgrounds in the stack.
*/
	public function stack_get_count_bkgnds()
	{
		$stmt = $this->file_db->prepare('SELECT COUNT(*) FROM bkgnd');
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_NUM);
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

// also, getting cards should support server-side ordinals
// because the total number is never accurately known if the stack is accessed by 
// multiple users - thus the server should provide it




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
		if (isset($row[13]) && ($row[13] !== '') && ($row[13] !== null)) $card['card_art'] = $row[13];
		
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
		if (isset($row[14]) && ($row[14] !== '') && ($row[14] !== null)) $card['bkgnd_art'] = $row[14];
		
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
		$this->stack_will_be_modified();
		$existing = $this->stack_load_card($card['card_id']);
		if ( strlen(json_encode($card)) > strlen(json_encode($existing)) )
			$this->stack_will_be_grown();
		unset($existing);
		
		$this->file_db->beginTransaction();
		
		$data = array();
		$data['card_script'] = $card['card_script'];
		$data['card_has_art'] = $card['card_has_art'];
		$data['data'] = $card['data'];
	
		$sql = 'UPDATE card SET object_data=?,card_name=?,cant_delete=?,dont_search=?,marked=?,card_data=?';
		if (array_key_exists('card_art', $card)) $sql .= ',card_art=?';
		$sql .= ' WHERE card_id=?';
		
		/* workaround stupid bug with PDO in PHP... */
		//if (isset($card['card_art']) && is_null($card['card_art'])) $card['card_art'] = '';
		//if (isset($card['bkgnd_art']) && is_null($card['bkgnd_art'])) $card['bkgnd_art'] = '';

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
		if (array_key_exists('card_art', $card)) $params[] = $card['card_art'];
		$params[] = intval($card['card_id']);
		
		/*var_dump($params);
		print '<p>';
		var_dump($sql);
		exit;*/
		
		$rows = $stmt->execute($params);
		//throw new Exception('Err: '.$this->file_db->errorInfo()[2]);
		if ($rows == 0) Stack::sl_ok(false, $this->file_db, 'Saving Card (2)');
		Stack::sl_ok($rows, $this->file_db, 'Saving Card (3)');
		
		$data = array();
		$data['bkgnd_script'] = $card['bkgnd_script'];
		$data['bkgnd_has_art'] = $card['bkgnd_has_art'];
		
		$sql = 'UPDATE bkgnd SET object_data=?,bkgnd_name=?,cant_delete=?,dont_search=?,bkgnd_data=?';
		if (array_key_exists('bkgnd_art', $card)) $sql .= ',bkgnd_art=?';
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
		if (array_key_exists('bkgnd_art', $card)) $params[] = $card['bkgnd_art'];
		$params[] = intval($card['card_id']);
		
		$rows = $stmt->execute($params);
		if ($rows == 0) Stack::sl_ok(false, $this->file_db, 'Saving Bkgnd (2)');
		Stack::sl_ok($rows, $this->file_db, 'Saving Bkgnd (3)');
		
		$this->file_db->commit();
		//throw new Exception('SQL : '.$this->file_db->errorInfo()[2]);
	}
	

/*
	Allows 'direct injection' of a complete background into the stack.
	(currently used for HC Import)
*/
	public function stack_inject_bkgnd($card)
	{
		$this->stack_will_be_modified();
	
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
		$this->stack_will_be_grown();
	
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
		$this->stack_will_be_modified();
		
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
		$this->stack_will_be_grown();
	
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
		$this->stack_will_be_modified();
	
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
