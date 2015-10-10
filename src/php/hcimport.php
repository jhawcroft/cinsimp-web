<?php
/*
CinsImp
HyperCard Import

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

class HCImport
{
	private static $contents = '';
	private static $offset = 0;
	private static $length = 0;
	
	private static $block_index = Array();
	private static $stack = Array();
	
	private static $fonts = Array();
	private static $styles = Array();
	

	public static function handle_upload()
	{
		if ($_FILES['HCStackFile']['size'] > 100 * 1024 * 1024)
			return;
		
		if (!move_uploaded_file($_FILES['HCStackFile']['tmp_name'], HCImport::upload_temp())) 
			return;
	}
	
	
	public static function create_stack()
	{
		$filename = HCImport::stack_temp();
		if (file_exists($filename)) unlink($filename);
		Stack::create_file($filename);
	}
	
	
	public static function scan_stack()
	{
		$result = Array();
		
		HCImport::$block_index = HCImport::index_blocks();
		HCImport::$stack = HCImport::decode_stak();
		
		HCImport::decode_font_table();
		HCImport::decode_style_table();
		
		$result['info'] = HCImport::$stack;
		$result['fonts'] = HCImport::$fonts;
		$result['styles'] = HCImport::$styles;
		$result['seq'] = HCImport::decode_sequence();
		$result['index'] = HCImport::$block_index;
		
		return $result;
	}
	
	
	private static function decode_sequence()
	{
		$sequence = Array();
		
		$list_id = HCImport::$stack['list_id'];
		$list_data = substr(HCImport::$contents, 
				HCImport::$block_index['LIST'][$list_id]['offset'], 
				HCImport::$block_index['LIST'][$list_id]['size']);
		
		$fields = unpack('Ncount', substr($list_data, 4, 4));
		$count = $fields['count'];
		
		$fields = unpack('nsz', substr($list_data, 16, 2));
		$block_size = $fields['sz'];
		
		//print 'Count page tables: '.$count.','.$block_size.'<br>';
		$seq = 1;
		$list_data = substr($list_data, 34);
		for ($i = 0; $i < $count; $i++)
		{
			$fields = unpack('Nid', substr($list_data, ($i * 6) + 2, 4));
			$id = $fields['id'];
			//print '['.$id.']';
			
			$page_data = substr(HCImport::$contents, 
				HCImport::$block_index['PAGE'][$id]['offset'], 
				HCImport::$block_index['PAGE'][$id]['size']);
			$length = strlen($page_data);
			
			for ($offset = 12; $offset < $length; $offset += $block_size)
			{
				$fields = unpack('Nid/Cflags', substr($page_data, $offset, 5));
				$marked = (($fields['flags'] & 0x10) != 0);
				$card_id = $fields['id'];
				if ($card_id != 0)
				{
					if (isset(HCImport::$block_index['CARD'][$card_id]))
					{
						//if ($seq == 1)
						//	$this->stack['first_card_id'] = $card_id;
							
						HCImport::$block_index['CARD'][$card_id]['marked'] = $marked;
						HCImport::$block_index['CARD'][$card_id]['seq'] = $seq;
						
						$sequence[] = $card_id;
						//$card = Array('card_id'=>$card_id);
						//$this->decode_card($card);
						//$this->stack['cards'][] = $card;
						
						$seq++;
					}
				}
			}	
		}
		
		return $sequence;
	}
	
	
	private static function decode_font_table()
	{
		$font_table_id = HCImport::$block_index['STAK'][-1]['font_table_id'];
		$table_data = substr(HCImport::$contents, 
			HCImport::$block_index['FTBL'][$font_table_id]['offset'], 
			HCImport::$block_index['FTBL'][$font_table_id]['size']);
		
		$fields = unpack('Ncount', substr($table_data, 4, 4));
		$count = $fields['count'];
		
		$offset = 12;
		for ($f = 0; $f < $count; $f++)
		{
			list($id) = array_values(unpack('nid', substr($table_data, $offset, 2)));
			$name = HCImport::cstring(substr($table_data, $offset + 2));
			$sz = strlen($name) + 1 + 2;
			$name = HCImport::macroman_decode($name);
			if (($sz % 2) != 0) $sz++;
			$offset += $sz;
			
			HCImport::$fonts[$id] = $name;
		}
	}
	
	
	private static function decode_style_bits($bits)
	{
		$output = Array('b'=>false,'i'=>false,'u'=>false,'o'=>false,'s'=>false,'c'=>false,'e'=>false,'g'=>false);
		if ($bits & 0x80) $output['g'] = true;
		if ($bits & 0x40) $output['e'] = true;
		if ($bits & 0x20) $output['c'] = true;
		if ($bits & 0x10) $output['s'] = true;
		if ($bits & 0x08) $output['o'] = true;
		if ($bits & 0x04) $output['u'] = true;
		if ($bits & 0x02) $output['i'] = true;
		if ($bits & 0x01) $output['b'] = true;
		return $output;
	}
	
	
	private static function decode_style_table()
	{
		$style_table_id = HCImport::$block_index['STAK'][-1]['style_table_id'];
		$table_data = substr(HCImport::$contents, 
			HCImport::$block_index['STBL'][$style_table_id]['offset'], 
			HCImport::$block_index['STBL'][$style_table_id]['size']);
		
		$fields = unpack('Ncount', substr($table_data, 4, 4));
		$count = $fields['count'];
		
		$offset = 12;
		for ($s = 0; $s < $count; $s++)
		{
			$entry = Array();
			
			list($id) = array_values(unpack('Nid', substr($table_data, $offset, 4)));
			list($font_id, $style_bits, $crap2, $size) = array_values(
				unpack('nfont/Cstyle/C/nsize', substr($table_data, $offset + 12, 6)));
			
			if ($font_id != 65535)
				$entry['font_change'] = HCImport::$fonts[$font_id];
			if ($size != 65535) 
				$entry['size_change'] = $size;
			if ($style_bits != 255) 
				$entry['style_change'] = HCImport::decode_style_bits($style_bits);
	
			HCImport::$styles[$id] = $entry;
			$offset += 24;
		}
	}
	
	
	private static function decode_stak()
	{
		$stack = Array();
		
		$stak_data = substr(HCImport::$contents, 
			HCImport::$block_index['STAK'][-1]['offset'], 
			HCImport::$block_index['STAK'][-1]['size']);
		$fields = unpack('Ncards/Ncrap/Nlist', substr($stak_data, 32, 24));
		$stack['card_count'] = $fields['cards'];
		$stack['list_id'] = $fields['list'];
		
		$fields = unpack('nuserlevel', substr($stak_data, 60, 2));
		$stack['user_level'] = $fields['userlevel'];
		
		$fields = unpack('nflags', substr($stak_data, 64, 2));
		$stack['cant_peek'] = (($fields['flags'] & 0x0400) != 0);
		$stack['cant_abort'] = (($fields['flags'] & 0x0800) != 0);
		$stack['private_access'] = (($fields['flags'] & 0x2000) != 0);
		$stack['cant_delete'] = (($fields['flags'] & 0x4000) != 0);
		$stack['cant_modify'] = (($fields['flags'] & 0x8000) != 0);
		
		$fields = unpack('nheight/nwidth', substr($stak_data, 428, 4));
		$stack['card_width'] = $fields['width'];
		$stack['card_height'] = $fields['height'];
		
		$stack['script'] = HCImport::macroman_decode( HCImport::cstring(substr($stak_data, 1524)) );
		
		$fields = unpack('Nftbl/Nstbl', substr($stak_data, 420, 8));
		HCImport::$block_index['STAK'][-1]['font_table_id'] = $fields['ftbl'];
		HCImport::$block_index['STAK'][-1]['style_table_id'] = $fields['stbl'];
		
		return $stack;
	}
	
	
	private static function index_blocks()
	{
		$block_index = Array();
		
		HCImport::$offset = 0;
		HCImport::$length = filesize(HCImport::upload_temp());
		$fp = fopen(HCImport::upload_temp(), 'rb');
		HCImport::$contents = fread($fp, HCImport::$length);
		fclose($fp);
		
		while ($info = HCImport::read_next_block())
		{
			if ((count($block_index) == 0) && ($info['type'] != 'STAK'))
				throw new Exception("Not a stack.");
			
			if (!isset($block_index[$info['type']]))
				$block_index[$info['type']] = Array();
			$block_index[$info['type']][$info['id']] = $info;
		}
		
		return $block_index;
	}
	
	
	private static function read_next_block()
	{
		if (HCImport::$offset >= HCImport::$length) return false;
		
		//print 'block<br>';
		$fields = unpack('Nsize/C4type/Nid', substr(HCImport::$contents, HCImport::$offset, 12));
		$block_size = $fields['size'];
		$block_id = $fields['id'];
		if ($block_id > 2147483647) $block_id -= 4294967296;
		$block_type = chr($fields['type1']).chr($fields['type2']).chr($fields['type3']).chr($fields['type4']);
		$block_offset = HCImport::$offset + 12;
		HCImport::$offset += $block_size;
		
		return Array('type'=>$block_type, 'id'=>$block_id, 'size'=>($block_size - 12), 'offset'=>$block_offset);
	}
	

	private static function upload_temp()
	{
		global $config;
		return $config->base.'tmp/hcstack.tmp';
	}
	
	private static function stack_temp()
	{
		global $config;
		return $config->base.'tmp/stack';
	}
	
	
	private static $MACROMAN_DECODE_TABLE = Array(
		"\x00", "\x01", "\x02", "\x03", "\x04", "\x05", "\x06", "\x07", "\x08", "\x09", "\x0A", "\x0B", "\x0C", "\x0D", "\x0E", "\x0F",
		"\x10", '⌘', '⇧', '⌥', '⌃', "\x15", "\x16", "\x17", "\x18", "\x19", "\x1A", "\x1B", "\x1C", "\x1D", "\x1E", "\x1F",
		' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
		'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
		'@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
		'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_',
		'`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
		'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', "\x7F",
		'Ä', 'Å', 'Ç', 'É', 'Ñ', 'Ö', 'Ü', 'á', 'à', 'â', 'ä', 'ã', 'å', 'ç', 'é', 'è',
		'ê', 'ë', 'í', 'ì', 'ì', 'ï', 'ñ', 'ó', 'ò', 'ô', 'ö', 'õ', 'ú', 'ù', 'û', 'ü',
		'†', '°', '¢', '£', '§', '•', '¶', 'ß', '®', '©', '™', '´', '¨', '≠', 'Æ', 'Ø',
		'∞', '±', '≤', '≥', '¥', 'µ', '∂', '∑', '∏', 'π', '∫', 'ª', 'º', 'Ω', 'æ', 'ø',
		'¿', '¡', '¬', '√', 'ƒ', '≈', '∆', '«', '»', '…', ' ', 'À', 'Ã', 'Õ', 'Œ', 'œ',
		'–', '—', '“', '”', '‘', '’', '÷', '◊', 'ÿ', 'Ÿ', '⁄', '¤', '‹', '›', 'ﬁ', 'ﬂ',
		'‡', '·', '‚', '„', '‰', 'Â', 'Ê', 'Á', 'Ë', 'È', 'Í', 'Î', 'Ï', 'Ì', 'Ó', 'Ô',
		'', 'Ò', 'Ú', 'Û', 'Ù', 'ı', 'ˆ', '˜', '¯', '˘', '˙', '˚', '¸', '˝', '˛', 'ˇ',
	);
	
	private static function macroman_decode($text)
	{
		$output = '';
		$length = strlen($text);
		for ($i = 0; $i < $length; $i++)
			$output .= HCImport::$MACROMAN_DECODE_TABLE[ord(substr($text, $i, 1))];
		return $output;
	}
	
	
	private static function cstring($input)
	{
		$input = substr($input, 0, 32768);
		list($input) = explode("\0", $input, 2);
		return $input;
	}
	
}


