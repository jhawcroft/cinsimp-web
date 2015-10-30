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
	
	
	private static function _evl($value, $ifempty = null)
	{
		if ($value === '') return $ifempty;
		return $value;
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
	public function __construct($in_ident, $in_auth_hash = null)
	{
		/* configure the instance */
		$this->stack_id = $in_ident;
		$this->name = basename($in_ident);
		$this->stack_path = $_SERVER['DOCUMENT_ROOT'].$in_ident;
		
		// really could use a function here to grab config->stacks and find the server bit
		// that is missing at the beginning of ident, and add it
		
		
		/* check if the supplied stack file exists */
		if (!file_exists($this->stack_path))
			throw new Exception('Stack Not Found', 404);
			
		/* check if the file is read-only */
		$fp = fopen($this->stack_path, 'a'); // for some weird reason is_writable doesn't work properly
		$this->file_read_only = (!$fp);
		if ($fp) fclose($fp);
		//$this->file_read_only = false;//(!is_writable($in_ident));
		
		/* open the file as a SQLite database */
		try
		{	
			$this->file_db = new PDO('sqlite:'.$this->stack_path);
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
		
		/* authenticate if hash provided */
		if ($in_auth_hash !== null)
			$this->stack_authenticate($in_auth_hash);
		
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
		
		$this->record_version = intval($row[5]);
	}
	
	
/*
	Creates a Stack with the supplied file path name.
*/
	public static function create_file($in_ident)
	{
		$in_path = $_SERVER['DOCUMENT_ROOT'].$in_ident;
		
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
			CinsImpError::general('Cannot Create Stack', $err->getMessage());
		}
		
		/* create and populate the schema */
		try
		{
			$file_db->beginTransaction();
		
		// ***TODO *** need some indexes
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
	seq INTEGER NOT NULL,
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
	name TEXT NOT NULL DEFAULT '',
	shared INTEGER NOT NULL DEFAULT 0,
	searchable INTEGER NOT NULL DEFAULT 1,
	visible INTEGER NOT NULL DEFAULT 1,
	script TEXT NOT NULL DEFAULT '',
	disabled INTEGER NOT NULL DEFAULT 0,
	txt_align TEXT NOT NULL DEFAULT 'left',
	txt_font TEXT NOT NULL DEFAULT 'sans-serif',
	txt_size INTEGER NOT NULL DEFAULT 12,
	txt_style TEXT NOT NULL DEFAULT '',
	color_rgb TEXT NOT NULL DEFAULT '1.0,1.0,1.0',
	shadow INTEGER NOT NULL DEFAULT 1,
	content TEXT NOT NULL DEFAULT '',
	
	style TEXT NOT NULL DEFAULT 'rounded',
	family INTEGER NOT NULL DEFAULT 0,
	menu TEXT NOT NULL DEFAULT '',
	icon INTEGER NOT NULL DEFAULT 0,
	show_name INTEGER NOT NULL DEFAULT 1,
	hilite INTEGER NOT NULL DEFAULT 0,
	auto_hilite INTEGER NOT NULL DEFAULT 0,
	
	PRIMARY KEY (id, layer_id)
);
 
CREATE TABLE field (
	id INTEGER NOT NULL,
	layer_id INTEGER NOT NULL,
	part_num INTEGER NOT NULL,
	location TEXT NOT NULL,
	size TEXT NOT NULL,
	name TEXT NOT NULL DEFAULT '',
	shared INTEGER NOT NULL DEFAULT 0,
	searchable INTEGER NOT NULL DEFAULT 1,
	visible INTEGER NOT NULL DEFAULT 1,
	script TEXT NOT NULL DEFAULT '',
	disabled INTEGER NOT NULL DEFAULT 0,
	txt_align TEXT NOT NULL DEFAULT 'left',
	txt_font TEXT NOT NULL DEFAULT 'sans-serif',
	txt_size INTEGER NOT NULL DEFAULT 12,
	txt_style TEXT NOT NULL DEFAULT '',
	color_rgb TEXT NOT NULL DEFAULT '1.0,1.0,1.0',
	shadow INTEGER NOT NULL DEFAULT 0,
	content TEXT NOT NULL DEFAULT '',
	
	border INTEGER NOT NULL DEFAULT 1,
	scroll INTEGER NOT NULL DEFAULT 0,
	locked INTEGER NOT NULL DEFAULT 0,
	dont_wrap INTEGER NOT NULL DEFAULT 0,
	auto_tab INTEGER NOT NULL DEFAULT 0,
	wide_margins INTEGER NOT NULL DEFAULT 0,
	auto_select INTEGER NOT NULL DEFAULT 0,
	selection TEXT NOT NULL DEFAULT '',
	picklist TEXT NOT NULL DEFAULT '',
	
	PRIMARY KEY (id, layer_id)
);

INSERT INTO cinsimp_stack (format_version) VALUES (1);
INSERT INTO bkgnd (id) VALUES (1);
INSERT INTO card (id, bkgnd_id, seq) VALUES (1, 1, 1);

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
					{ CinsImpError::internal('Statement '.$s_num.': '.$err->getMessage()); }
					$s_num++;
				}
			}
			
			$file_db->commit();
			
			//chmod($in_path, 0755);
			
		}
		catch (Exception $err)
		{
			CinsImpError::general('Cannot Create Stack', $err->getMessage());
		}
	}
	
	
	public static function stack_delete($in_ident)
	{
		CinsImpError::unimplemented();
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
			CinsImpError::unauthorised();
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
			CinsImpError::unauthorised();
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
		if (filesize($this->stack_path) >= $config->restrictions->max_stack_size)
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
			'size'=>filesize($this->stack_path),
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
		global $config;
		
		$stmt = $this->file_db->prepare('SELECT * FROM cinsimp_stack');
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_ASSOC);
	
		//$stack_url = $this->stack_path;
		//print '<p>'.$stack_url.'</p>';
	
		$record = array(
			'name'=>$this->name,
			'path'=>$this->stack_id,
			'id'=>$this->stack_id,
			
			'record_version'=>$this->record_version,
			
			'file_locked'=>$this->file_read_only,
			'cant_modify'=>$this->cant_modify,
			'cant_delete'=>$this->cant_delete,
			'private_access'=>$this->private_access,
			
			'cant_peek'=>Stack::decode_bool($row['cant_peek']),
			'cant_abort'=>Stack::decode_bool($row['cant_abort']),
			'user_level'=>intval($row['user_level']),
			
			'card_width'=>intval($row['card_width']),
			'card_height'=>intval($row['card_height']),
			
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
	Verifies the supplied value is or can be cast to the specified logical type.
	Throws an exception if it cannot.
*/

// *** TODO this needs better actual checking of supplied types and enforcement
	private static function _sql_type_verify(&$field_value, $field_type, $allow_null = true)
	{
		/* check for null */
		if (!$allow_null && $field_value === null)
			CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": cannot be null');
		
		/* check for literal sets */
		if (substr($field_type, 0, 1) == '[')
		{
			$field_type = substr($field_type, 1, strlen($field_type)-2);
			$set = explode(',', $field_type);
			$field_value = strval($field_value);
			if (!in_array($field_value, $set))
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": not in allowed set '.
					implode(', ', $set));
			return;
		}
		
		/* check for various logical types */
		switch ($field_type)
		{
		case 'bool':
			$field_value = Stack::encode_bool($field_value);
			break;
		case 'rgb':
			$field_value = strval($field_value);
			if (strlen($field_value) > 16)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": exceeds 16 bytes');
			$components = explode(',', $field_value);
			if (count($components) != 3)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": illegal Color (r,g,b)');
			$components[0] = floatval($components[0]);
			$components[1] = floatval($components[1]);
			$components[2] = floatval($components[2]);
			$field_value = implode(',', $components);
			break;
		case 'uint8':
			$field_value = intval($field_value);
			if ($field_value < 0 || $field_value > 255)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": overflow 8-bit unsigned int');
			break;
		case 'uint16':
			$field_value = intval($field_value);
			if ($field_value < 0 || $field_value > 32767)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": overflow 16-bit unsigned int');
			break;
		case 'int':
			$field_value = intval($field_value);
			break;
		case 'text16':
			$field_value = strval($field_value);
			if (strlen($field_value) > 32000)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": exceeds 32 K characters');
			break;
		case 'text20':
			$field_value = strval($field_value);
			if (strlen($field_value) > 1024 * 1024)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": exceeds 1 MB');
			break;
		case 'str255':
			$field_value = strval($field_value);
			if (strlen($field_value) > 255)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": exceeds 255 characters');
			break;
		case 'data16':
			$field_value = strval($field_value);
			if (strlen($field_value) > 16)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": exceeds 16 bytes');
			break;
		case 'point':
			$field_value = strval($field_value);
			if (strlen($field_value) > 16)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": exceeds 16 bytes');
			$components = explode(',', $field_value);
			if (count($components) != 2)
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": illegal Point');
			$components[0] = intval($components[0]);
			$components[1] = intval($components[1]);
			$field_value = implode(',', $components);
			break;
		case 'image':
			if ($field_value === null) $field_value = '';
			$field_value = strval($field_value);
			if (strlen($field_value) > 104857600) // 100 MB
				CinsImpError::malformed('_sql_type_verify: field "'.$field_name.'": exceeds 100 MB');
			break;
		default:
			CinsImpError::internal('_sql_type_verify: field "'.$field_name.'": type '.$field_type.' invalid');
		}
	}


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
			if (count($parts) < 2)
				CinsImpError::internal('_sql_optional_update: field "'.$parts[0].'": type unspecified');
			$field_name = $parts[0];
			$field_type = $parts[1];
			
			if (array_key_exists($field_name, $data))
			{
				$sql_fields[] = $field_name . '=?';
				
				$field_value = $data[$field_name];
				Stack::_sql_type_verify($field_value, $field_type);
				
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
	Prepares a simple SQL INSERT statement, given the supplied key-value pairs
	and the list of fields which may be included in the statement.
*/
	private static function _sql_optional_insert($table, &$data, $optional_fields)
	{
		$sql_fields = array();
		$sql_values = array();
		$sql_params = array();
		
		foreach ($optional_fields as $field_def)
		{
			$parts = explode(':', $field_def);
			if (count($parts) < 2)
				CinsImpError::internal('_sql_optional_insert: field "'.$parts[0].'": type unspecified');
			$field_name = $parts[0];
			$field_type = $parts[1];
			
			if (array_key_exists($field_name, $data))
			{
				$sql_fields[] = $field_name;
				
				$field_value = $data[$field_name];
				Stack::_sql_type_verify($field_value, $field_type);
				
				$sql_values[] = $field_value;
				$sql_params[] = '?';
			}
		}
		
		if (count($sql_fields) == 0) return null;
		
		return array(
			'sql'=>'INSERT INTO '.$table.' ('.implode(', ', $sql_fields).') VALUES ('.implode(', ', $sql_params).')',
			'params'=>$sql_values
		);
	}
	
	
/*
	Applies the specified password to the stack, provided the stack access 
	is sufficiently authenticated already.
*/
	public function stack_set_password($in_password_hash)
	{
		$this->_check_mutability();
		$this->_check_authenticated();
		
		/* verify the input */
		Stack::_sql_type_verify($in_password_hash, 'str255');
		if (trim($in_password_hash) == '' || $in_password_hash === null) $in_password_hash = '';
		
		/* update the stack */
		$this->file_db->beginTransaction();
		
		$sql = 'UPDATE cinsimp_stack SET password_hash=?';
		$stmt = $this->file_db->prepare($sql);
		$stmt->execute(array($in_password_hash));
		
		$this->file_db->exec('UPDATE cinsimp_stack SET record_version=record_version + 1');
		$this->file_db->commit();
		
		/* reload essentials */
		$this->load_check_essentials();
		
		return $this->record_version;
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
				'cant_abort:bool', 'user_level:uint8', 'private_access:bool'));
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
	public function stack_import_icon($in_icon_def)
	{
		/* verify supplied definition */
		Util::keys_required($in_icon_def, array('id','name','data'));
		$in_preferred_id = $in_icon_def['id'];
		$this->_sql_type_verify($in_preferred_id, 'int', false);
		$in_name = $in_icon_def['name'];
		$this->_sql_type_verify($in_name, 'str255', false);
		$in_data = $in_icon_def['data'];
		$this->_sql_type_verify($in_data, 'image', false);
	
		/* try to import with supplied ID */
		$this->file_db->beginTransaction();
		$stmt = $this->file_db->prepare('INSERT INTO icon (id,name,png_data) VALUES (?,?,?)');
		if ($stmt->execute(array(intval($in_preferred_id), $in_name, $in_data)) === false)
		{
			/* resort to an automatically allocated ID */
			$stmt = $this->file_db->prepare('INSERT INTO icon (id,name,png_data) VALUES (NULL,?,?)');
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
		$this->_check_mutability();
		$this->file_db->exec('VACUUM');
		
		return $this->stack_stats();
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
		return intval($row[0]);
	}


/*
	Returns the number of backgrounds in the stack.
*/
	public function stack_get_count_bkgnds()
	{
		$stmt = $this->file_db->prepare('SELECT COUNT(*) FROM bkgnd');
		$stmt->execute();
		$row = $stmt->fetch(PDO::FETCH_NUM);
		return intval($row[0]);
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
/*
	public function stack_get_first_card_id()
	{
		$stmt = $this->file_db->prepare('SELECT card_id FROM card WHERE card_seq=10');
		Stack::sl_ok($stmt, $this->file_db, 'Getting First Card (1)');
		Stack::sl_ok($stmt->execute(), $this->file_db, 'Getting First Card (2)');
		$row = $stmt->fetch(PDO::FETCH_NUM);
		Stack::sl_ok($row, $this->file_db, 'Getting First Card(3)');
		return $row[0];
	}
	
	*/

/*
	Looks up the card ID for the Nth card within either the stack or the 
	supplied background.
*/
	public function stack_get_nth_card_id($number, $in_bkgnd = null)
	{
		if ($in_bkgnd === null)
			$sql = 'SELECT id FROM card WHERE seq=?';
		else
			$sql = 'SELECT id FROM card WHERE bkgnd_id=? ORDER BY seq LIMIT ?,1';
		$stmt = $this->file_db->prepare($sql);
		if ($in_bkgnd === null)
			$stmt->execute(array( intval($number) ));
		else
			$stmt->execute(array( intval($in_bkgnd), (intval($number) - 1) ));
		$row = $stmt->fetch(PDO::FETCH_NUM);
		if ($row === false) return 0;
		return $row[0];
	}




// also, getting cards should support server-side ordinals
// because the total number is never accurately known if the stack is accessed by 
// multiple users - thus the server should provide it

// +ve is bkgnd, -ve is card

/*
	Returns a list of the buttons and fields within the specified card/background layer.
	If layer ID is -ve, it's a card ID, if it's +ve, it's a bkgnd ID.
*/
	private function _layer_parts($layer_id)
	{
		$objects = array();
		$stmt = $this->file_db->prepare('SELECT * FROM button WHERE layer_id=? ORDER BY part_num');
		$stmt->execute(array( intval($layer_id) ));
		while ($row = $stmt->fetch(PDO::FETCH_ASSOC))
		{
			unset($row['layer_id']);
			$row['type'] = 'button';
			
			$row['shared'] = Stack::decode_bool($row['shared']);
			$row['searchable'] = Stack::decode_bool($row['searchable']);
			$row['visible'] = Stack::decode_bool($row['visible']);
			$row['disabled'] = Stack::decode_bool($row['disabled']);
			$row['shadow'] = Stack::decode_bool($row['shadow']);
			
			$row['show_name'] = Stack::decode_bool($row['show_name']);
			$row['hilite'] = Stack::decode_bool($row['hilite']);
			$row['auto_hilite'] = Stack::decode_bool($row['auto_hilite']);
			
			$objects[] = $row;
		}
		
		$stmt = $this->file_db->prepare('SELECT * FROM field WHERE layer_id=? ORDER BY part_num');
		$stmt->execute(array( intval($layer_id) ));
		while ($row = $stmt->fetch(PDO::FETCH_ASSOC))
		{
			unset($row['layer_id']);
			$row['type'] = 'field';
			
			$row['shared'] = Stack::decode_bool($row['shared']);
			$row['searchable'] = Stack::decode_bool($row['searchable']);
			$row['visible'] = Stack::decode_bool($row['visible']);
			$row['disabled'] = Stack::decode_bool($row['disabled']);
			$row['shadow'] = Stack::decode_bool($row['shadow']);
			
			$row['border'] = Stack::decode_bool($row['border']);
			$row['scroll'] = Stack::decode_bool($row['scroll']);
			$row['locked'] = Stack::decode_bool($row['locked']);
			$row['dont_wrap'] = Stack::decode_bool($row['dont_wrap']);
			$row['auto_tab'] = Stack::decode_bool($row['auto_tab']);
			$row['wide_margins'] = Stack::decode_bool($row['wide_margins']);
			$row['auto_select'] = Stack::decode_bool($row['auto_select']);
			
			$objects[] = $row;
		}
		
		return $objects;
	}
	
	
/*
	Replaces the buttons and fields within the specified card/background layer.
	If layer ID is -ve, it's a card ID, if it's +ve, it's a bkgnd ID.
*/
	public function _save_layer_parts($layer_id, $objects)
	{
		$this->file_db->exec('DELETE FROM field WHERE layer_id='.intval($layer_id));
		$this->file_db->exec('DELETE FROM button WHERE layer_id='.intval($layer_id));
		
		if (!is_array($objects))
			CinsImpError::malformed('layer objects must be an array');
		foreach ($objects as $object_def)
		{
			Util::keys_required($object_def, array('id', 'type', 'part_num', 'location', 'size'));
			$general_keys = array(
				// required general:
				'id:int', 'layer_id:int', 'part_num:uint16', 'location:point', 'size:point', 
				
				// optional general:
				'name:str255', 'shared:bool', 'searchable:bool', 'visible:bool', 'disabled:bool',
				'txt_align:[left,center,right,justify]', 'txt_font:str255', 'txt_size:uint8', 'txt_style:str255',
				'color_rgb:rgb', 'shadow:bool', 'script:text16', 'content:text20'
			);
			
			$object_type = $object_def['type'];
			if ($object_type == 'button')
				$specific_keys = array(
					// optional button:
					'style:[borderless,rectangle,rounded,check_box,radio]', 'family:uint8', 
					'menu:text16', 'icon:int', 'show_name:bool', 'hilite:bool', 'auto_hilite:bool'
				);
			else if ($object_type = 'field')
				$specific_keys = array(
					// optional field:
					'border:bool', 'scroll:bool', 'locked:bool', 'dont_wrap:bool', 'auto_tab:bool',
					'wide_margins:bool', 'auto_select:bool', 'selection:str255', 'picklist:text16'
				);
			else
				CinsImpError::malformed('illegal object type: '.$object_type);
			
			$object_def['layer_id'] = $layer_id;
			$sql = Stack::_sql_optional_insert($object_type, $object_def, 
				array_merge($general_keys, $specific_keys));
			
			$stmt = $this->file_db->prepare($sql['sql']);
			$stmt->execute($sql['params']);
		}
	}


/*
	Retrieves the bkgnd data for the supplied bkgnd ID.
*/
	public function stack_load_bkgnd($bkgnd_id)
	{
		$stmt = $this->file_db->prepare(
'SELECT id,name,cant_delete,dont_search,script,art,art_hidden FROM bkgnd WHERE id=?'
		);
		$stmt->execute(array( intval($bkgnd_id) ));
		$row = $stmt->fetch(PDO::FETCH_NUM);
		if ($row === false || count($row) == 0) CinsImpError::missing('Background');
		
		$bkgnd = array(
			'id'=>intval($row[0]),
			'name'=>$row[1],
			'cant_delete'=>Stack::decode_bool($row[2]),
			'dont_search'=>Stack::decode_bool($row[3]),
			'script'=>$row[4],
			'art'=>Stack::_evl($row[5]),
			'art_hidden'=>Stack::decode_bool($row[6]),
			'count_cards'=>$this->stack_get_count_cards($row[0])
		);
		
		$bkgnd['objects'] = Stack::_layer_parts($row[0]);
		
		return $bkgnd;
	}
	
	
/*
	Accepts a card reference and converts to a card ID.
	A reference can be either:
	-	an ID integer (no conversion necessary)
	-	a number, relative to the stack or supplied background ID
		Must be prefixed with a hash '#'
	-	a name, relative to the stack or supplied background ID
		Any non-numeric string
*/
	private function _card_ref_to_id($in_ref, $in_bkgnd_id = null)
	{
		if ($in_ref === null || strlen($in_ref) > 256)
			CinsImpError::malformed('Invalid card reference');
		if ($in_bkgnd_id !== null && strlen($in_bkgnd_id) > 50)
			CinsImpError::malformed('Invalid bkgnd reference');
			
		$in_ref = trim($in_ref);
		$first_char = substr($in_ref, 0, 1);
		if ( Util::is_digit($first_char) )
		{
			/* ID */
			return intval($in_ref);
		}
		else if ($first_char == '#')
		{
			/* number or ordinal */
			$in_ref = trim(substr($in_ref, 1));
			switch ($in_ref)
			{
			case 'last':
				CinsImpError::unimplemented('ordinal card access');
				break;
			case 'middle':
				CinsImpError::unimplemented('ordinal card access');
				break;
			case 'any':
				CinsImpError::unimplemented('ordinal card access');
				break;
			default:
				$number = intval($in_ref);
				return $this->stack_get_nth_card_id($number, $in_bkgnd_id);
			}
		}
		else
		{
			/* name */
			$name = substr($in_ref, 0, 255);
			CinsImpError::unimplemented('named card access');
		}
	}
	
	
/*
	Retrieves the card data for the supplied card ID.
*/
	public function stack_load_card($card_id)
	{
		$card_id = $this->_card_ref_to_id($card_id);
		
		$stmt = $this->file_db->prepare(
'SELECT id,bkgnd_id,seq,name,cant_delete,dont_search,marked,script,art,art_hidden FROM card WHERE id=?'
		);
		$stmt->execute(array( intval($card_id) ));
		$row = $stmt->fetch(PDO::FETCH_NUM);
		if ($row === false || count($row) == 0) CinsImpError::missing('Card');
		
		$card = array(
			'id'=>intval($row[0]),
			'bkgnd_id'=>intval($row[1]),
			'seq'=>intval($row[2]),
			'name'=>$row[3],
			'cant_delete'=>Stack::decode_bool($row[4]),
			'dont_search'=>Stack::decode_bool($row[5]),
			'marked'=>Stack::decode_bool($row[6]),
			'script'=>$row[7],
			'art'=>Stack::_evl($row[8]),
			'art_hidden'=>Stack::decode_bool($row[9])
		);
		
		$content = array();
		$stmt = $this->file_db->prepare(
'SELECT bkgnd_object_id,content FROM card_data WHERE card_id=?'
		);
		$stmt->execute(array( $row[0] ));
		while ($row = $stmt->fetch(PDO::FETCH_NUM))
		{
			$content[] = $row;
		}
		$card['content'] = $content;
		
		$card['objects'] = Stack::_layer_parts( - intval($card['id']) );
		
		return $card;		
	}
	
	
/*
	Saves the supplied bkgnd data to the stack.
*/
	public function stack_save_bkgnd($bkgnd)
	{
		$this->_check_growability();
		
		Util::keys_required($bkgnd, array('id'));
		$bkgnd_id = intval($bkgnd['id']);
		
		$this->file_db->beginTransaction();
		
		$sql = Stack::_sql_optional_update('bkgnd', $bkgnd,
			array('name:str255', 'cant_delete:bool', 'dont_search:bool',
				'script:text16', 'art:image', 'art_hidden:bool'));
		if ($sql !== null)
		{
			$stmt = $this->file_db->prepare($sql['sql'] . ' WHERE id=?');
			$sql['params'][] = $bkgnd_id;
			$stmt->execute($sql['params']);
		}
		
		if (array_key_exists('objects', $bkgnd))
			$this->_save_layer_parts($bkgnd_id, $bkgnd['objects']);
		
		$this->file_db->commit();
		return $bkgnd_id;
	}



/*
	Saves the supplied card data to the stack.
*/
	public function stack_save_card($card)
	{
		$this->_check_growability();
		
		Util::keys_required($card, array('id'));
		$card_id = intval($card['id']);
		
		$this->file_db->beginTransaction();
		
		$sql = Stack::_sql_optional_update('card', $card,
			array('name:str255', 'cant_delete:bool', 'dont_search:bool', 'marked:bool',
				'script:text16', 'art:image', 'art_hidden:bool'));
		if ($sql !== null)
		{
			$stmt = $this->file_db->prepare($sql['sql'] . ' WHERE id=?');
			$sql['params'][] = $card_id;
			$stmt->execute($sql['params']);
		}
		
		if (array_key_exists('objects', $card))
			$this->_save_layer_parts(- $card_id, $card['objects']);
		
		if (array_key_exists('content', $card))
		{
			if (!is_array($card['content']))
				CinsImpError::malformed('layer content must be an array');
			$this->file_db->exec('DELETE FROM card_data WHERE card_id='.$card_id);
			$stmt = $this->file_db->prepare('INSERT INTO card_data (card_id,bkgnd_object_id,content) VALUES (?,?,?)');
			foreach ($card['content'] as $content_def)
			{
				if (count($content_def) != 2)
					CinsImpError::malformed('card content form is not [id,content]');
				$content = $content_def[1];
				$content_def[1] = null;
				Stack::_sql_type_verify($content, 'text20');
				$def = array($card_id, intval($content_def[0]), $content);
				$stmt->execute($def);
			}
		}
		
		$this->file_db->commit();
		return $card_id;
	}
	
	
/*
	Creates a new card and optionally an accompanying new background.
	Returns the ID of the new card.
*/
	public function stack_new_card($after_card_id, $new_bkgnd_too)
	{
		$this->_check_growability();
		
	
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
	


/*****************************************************************************************
HyperCard Import Support (Revise Later)
*/

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





}
