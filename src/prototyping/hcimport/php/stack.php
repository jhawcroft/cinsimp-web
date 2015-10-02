<?php
/*
Prototype HyperCard Stack Extractor for PHP
Copyright (c) 2015, Joshua Hawcroft
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

ini_set('display_errors', 1);


class HCImporter
{
	private $contents = '';
	private $offset = 0;
	private $length = 0;
	
	private $block_index = Array();
	private $stack = Array();
	private $fonts = Array();
	private $styles = Array();
	
	public function __construct($stackPath)
	{
		
	
		$this->length = filesize($stackPath);
		$fp = fopen($stackPath, 'rb');
		$this->contents = fread($fp, $this->length);
		fclose($fp);
		
		$this->index_blocks();
		
		$this->decode_stak();
		
		$this->decode_font_table();
		$this->decode_style_table();
		
		$this->decode_sequence();
		$this->decode_bkgnds();
		
		
		
		
		
		/*
		print '<pre>';
		var_dump($this->fonts);
		print '</pre>';
		
		*/
		/*print '<pre>';
		var_dump($this->styles);
		print '</pre>';
		
		print '<pre>';
		var_dump($this->block_index);
		print '</pre>';
		*/
		print '<pre>';
		var_dump($this->stack);
		print '</pre>';
	}
	
	
	private function round_32_down($in)
	{
		if ($in % 32 == 0) return $in;
		return floor($in / 32) * 32;
		//return (int)($in / 32) * 32;
	}
	
	
	private function round_32_up($in)
	{
		if ($in % 32 == 0) return $in;
		return ceil($in / 32) * 32;
	}
	
	
	private function decode_bitmap(&$data, &$rect)
	{
		$rect[0] = $this->round_32_down($rect[0]);
		$rect[2] = $this->round_32_up($rect[2]);
		
		print '<ul>';
		$limit = strlen($data);
		$previous_bytes = Array(0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55);
		$dh = 0;
		$dv = 0;
		$row = 0;
		for ($offset = 0; $offset < $limit; $offset++)
		{
			$op = ord( substr($data, $offset, 1) );
			print '<li>';
			
			 /* 'multiple operation' rows (impacted by dh & dv */
			if ($op <= 0x7F)
			{
				$z = ($op & 0xF0) >> 4;
				$d = $op & 0x0F;
				print $z.' x zero, '.$d.' x data';
				$offset += $d;
			}
			
			/*
			After decompression of an entire 'multiple operation' row:
				Make a copy of the row.
				If dh != 0, repeat until the end of the row:
					Shift the copied row to the right dh bits.
					XOR the copied row with the original row.
				If dv != 0, XOR the copied row with the row dv rows back.
				Copy the row back to the original.
			(May need to reverse this process - check for reference implementation)
			*/
			
			/* 'single operation' rows */
			else if ($op == 0x80)
			{
				print 'Uncompressed Row';
			}
			else if ($op == 0x81)
			{
				print 'White Row';
			}
			else if ($op == 0x82)
			{
				print 'Black Row';
			}
			else if ($op == 0x83)
			{
				$d = ord( substr($data, $offset + 1, 1) );
				print 'Row of '.$d;
				$previous_bytes[ $row % 8 ] = $d;
				$offset += 1;
			}
			else if ($op == 0x84)
			{
				print 'Row of '.$previous_bytes[ $row % 8 ];
			}
			else if ($op == 0x85)
			{
				print 'Copy Previous Row';
			}
			else if ($op == 0x86)
			{
				print 'Copy Previous - 2 Row';
			}
			else if ($op == 0x87)
			{
				print 'Copy Previous - 3 Row';
			}
			
			/* decode control */
			else if ($op == 0x88)
			{
				$dh = 16;
				$dv = 0;
				print 'dh = '.$dh.', dv = '.$dv;
			}
			else if ($op == 0x89)
			{
				$dh = 0;
				$dv = 0;
				print 'dh = '.$dh.', dv = '.$dv;
			}
			else if ($op == 0x8A)
			{
				$dh = 0;
				$dv = 1;
				print 'dh = '.$dh.', dv = '.$dv;
			}
			else if ($op == 0x8B)
			{
				$dh = 0;
				$dv = 2;
				print 'dh = '.$dh.', dv = '.$dv;
			}
			else if ($op == 0x8C)
			{
				$dh = 1;
				$dv = 0;
				print 'dh = '.$dh.', dv = '.$dv;
			}
			else if ($op == 0x8D)
			{
				$dh = 1;
				$dv = 1;
				print 'dh = '.$dh.', dv = '.$dv;
			}
			else if ($op == 0x8E)
			{
				$dh = 2;
				$dv = 2;
				print 'dh = '.$dh.', dv = '.$dv;
			}
			else if ($op == 0x8F)
			{
				$dh = 8;
				$dv = 0;
				print 'dh = '.$dh.', dv = '.$dv;
			}
			
			else if ( ($op >= 0xA0) && ($op <= 0xBF) && ((ord( substr($data, $offset+1, 1) ) & 0xE0) == 10) )
			{
				$n = ord( substr($data, $offset+1, 1) ) & 0x1F;
				print 'Repeat next instruction '.$n;
				$offset += 1;
			}
			else if ( ($op >= 0xC0) && ($op <= 0xDF) && ((ord( substr($data, $offset+1, 1) ) & 0xE0) == 12) )
			{
				$d = ord( substr($data, $offset+1, 1) ) & 0x1F;
				$b = ord( substr($data, $offset+2, 1) );
				print $d.' x '.$b;
				$offset += 2;
			}
			else if ( ($op >= 0xE0) && ($op <= 0xFF) && ((ord( substr($data, $offset+1, 1) ) & 0xE0) == 14) )
			{
				$z = ord( substr($data, $offset+1, 1) ) & 0x1F;
				print $z.' x 16 bytes of Zero';
				$offset += 1;
			}
			else
			{
				print 'Illegal op, aborting';
				break;
			}

			print '</li>';
			//break;// debug
		}
		print '</ul>';
	}
	
	
	private function extract_bitmap($id)
	{
		$header = Array('hc_id'=>$id);

		$data = substr($this->contents, $this->block_index['BMAP'][$id]['offset'], $this->block_index['BMAP'][$id]['size']);
		
		$fields = unpack('nbtop/nbleft/nbbot/nbright/nmtop/nmleft/nmbot/nmright/nitop/nileft/nibot/niright', substr($data, 12, 24));
		$header['bitmap_rect'] = $fields['bleft'].','.$fields['btop'].','.$fields['bright'].','.$fields['bbot']; // position within card
		$mask_rect = Array($fields['mleft'],$fields['mtop'],$fields['mright'],$fields['mbot']);
		$image_rect = Array($fields['ileft'],$fields['itop'],$fields['iright'],$fields['ibot']);
		
		$fields = unpack('Nmsize/Nisize', substr($data, 44, 8));
		$mask_size = $fields['msize'];
		$image_size = $fields['isize'];
		
		$data_mask = substr($data, 52, $mask_size);
		$data_image = substr($data, 52 + $mask_size, $image_size);
		unset($data);
		
		//var_dump($header);
		//var_dump($data_mask);
		//var_dump($data_image);
		$this->decode_bitmap($data_image, $image_rect);
		
	}
	
	
	// need to implement own MacRoman -> UTF-8 converter,
	// since PHP doesn't have one that exactly matches
	// closest: mb_convert_encoding($input, 'UTF-8', 'ISO-8859-1')
	
	private $MACROMAN_DECODE_TABLE = Array(
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
	
	private function macroman_decode($text)
	{
		$output = '';
		$length = strlen($text);
		for ($i = 0; $i < $length; $i++)
			$output .= $this->MACROMAN_DECODE_TABLE[ord(substr($text, $i, 1))];
		return $output;
	}
	
	
	private function cstring($input)
	{
		$input = substr($input, 0, 32768);
		list($input) = explode("\0", $input, 2);
		return $input;
		//$input = strstr(substr($input, 0, 32768), "\0", true);
		//return $this->macroman_decode($input);
		//return mb_convert_encoding($input, 'UTF-8', 'ISO-8859-1');
	}
	
	
	private function decode_font_table()
	{
		$font_table_id = $this->block_index['STAK'][-1]['font_table_id'];
		$table_data = substr($this->contents, $this->block_index['FTBL'][$font_table_id]['offset'], $this->block_index['FTBL'][$font_table_id]['size']);
		
		$fields = unpack('Ncount', substr($table_data, 4, 4));
		$count = $fields['count'];
		
		$offset = 12;
		for ($f = 0; $f < $count; $f++)
		{
			list($id) = array_values(unpack('nid', substr($table_data, $offset, 2)));
			$name = $this->cstring(substr($table_data, $offset + 2));
			$sz = strlen($name) + 1 + 2;
			$name = $this->macroman_decode($name);
			if (($sz % 2) != 0) $sz++;
			$offset += $sz;
			
			$this->fonts[$id] = $name;
		}
	}
	
	
	private function decode_style_bits($bits)
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
	
	
	private function decode_style_table()
	{
		$style_table_id = $this->block_index['STAK'][-1]['style_table_id'];
		$table_data = substr($this->contents, $this->block_index['STBL'][$style_table_id]['offset'], $this->block_index['STBL'][$style_table_id]['size']);
		
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
				$entry['font_change'] = $this->fonts[$font_id];
			if ($size != 65535) 
				$entry['size_change'] = $size;
			if ($style_bits != 255) 
				$entry['style_change'] = $this->decode_style_bits($style_bits);
	
			$this->styles[$id] = $entry;
			$offset += 24;
		}
	}
	
	
	private function decode_stak()
	{
		$stak_data = substr($this->contents, $this->block_index['STAK'][-1]['offset'], $this->block_index['STAK'][-1]['size']);
		$fields = unpack('Ncards/Ncrap/Nlist', substr($stak_data, 32, 24));
		$this->stack['card_count'] = $fields['cards'];
		$this->stack['list_id'] = $fields['list'];
		
		$fields = unpack('nuserlevel', substr($stak_data, 60, 2));
		$this->stack['user_level'] = $fields['userlevel'];
		
		$fields = unpack('nflags', substr($stak_data, 64, 2));
		$this->stack['cant_peek'] = (($fields['flags'] & 0x0400) != 0);
		$this->stack['cant_abort'] = (($fields['flags'] & 0x0800) != 0);
		$this->stack['private_access'] = (($fields['flags'] & 0x2000) != 0);
		$this->stack['cant_delete'] = (($fields['flags'] & 0x4000) != 0);
		$this->stack['cant_modify'] = (($fields['flags'] & 0x8000) != 0);
		
		$fields = unpack('nheight/nwidth', substr($stak_data, 428, 4));
		$this->stack['card_width'] = $fields['width'];
		$this->stack['card_height'] = $fields['height'];
		
		$this->stack['script'] = $this->macroman_decode( $this->cstring(substr($stak_data, 1524)) );
		
		$fields = unpack('Nftbl/Nstbl', substr($stak_data, 420, 8));
		$this->block_index['STAK'][-1]['font_table_id'] = $fields['ftbl'];
		$this->block_index['STAK'][-1]['style_table_id'] = $fields['stbl'];
	}
	
	
	private function decode_sequence()
	{
		$this->stack['cards'] = Array();
		
		$list_id = $this->stack['list_id'];
		$list_data = substr($this->contents, $this->block_index['LIST'][$list_id]['offset'], 
				$this->block_index['LIST'][$list_id]['size']);
		
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
			
			$page_data = substr($this->contents, $this->block_index['PAGE'][$id]['offset'], 
				$this->block_index['PAGE'][$id]['size']);
			$length = strlen($page_data);
			
			for ($offset = 12; $offset < $length; $offset += $block_size)
			{
				$fields = unpack('Nid/Cflags', substr($page_data, $offset, 5));
				$marked = (($fields['flags'] & 0x10) != 0);
				$card_id = $fields['id'];
				if ($card_id != 0)
				{
					if (isset($this->block_index['CARD'][$card_id]))
					{
						if ($seq == 1)
							$this->stack['first_card_id'] = $card_id;
							
						$this->block_index['CARD'][$card_id]['marked'] = $marked;
						$this->block_index['CARD'][$card_id]['seq'] = $seq;
						
						$card = Array('card_id'=>$card_id);
						$this->decode_card($card);
						$this->stack['cards'][] = $card;
						
						$seq++;
					}
				}
			}	
		}
	}
	
	
	private function decode_bkgnds()
	{
		$this->stack['bkgnds'] = Array();
		foreach ($this->block_index['BKGD'] as $bkgnd_info)
		{
			if (!isset($bkgnd_info['utilised'])) continue;
			
			$bkgnd = Array('bkgnd_id'=>$bkgnd_info['id']);
			$this->decode_bkgnd($bkgnd);
			$this->stack['bkgnds'][] = $bkgnd;
		}
	}
	
	
	// this is virtually identical to decode_card!!
	
	private function decode_bkgnd(&$bkgnd)
	{
		$bkgnd_id = $bkgnd['bkgnd_id'];
		$bkgnd_data = substr($this->contents, $this->block_index['BKGD'][$bkgnd_id]['offset'], 
				$this->block_index['BKGD'][$bkgnd_id]['size']);
		
		$fields = unpack('Nbmap/nflags', substr($bkgnd_data, 4, 6));
		$bkgnd['bmap_id'] = $fields['bmap'];
		$bkgnd['cant_delete'] = (($fields['flags'] & 0x4000) != 0);
		$bkgnd['hide_picture'] = (($fields['flags'] & 0x2000) != 0);
		$bkgnd['dont_search'] = (($fields['flags'] & 0x0800) != 0);
		
		$fields = unpack('nparts/n3/npcc', substr($bkgnd_data, 24, 16));
		$part_count = $fields['parts'];
		$contents_count = $fields['pcc'];
		
		//print 'BKGD: '.$bkgnd['bkgnd_id'].' BMAP: '.$bkgnd['bmap_id'].'  PARTS:'.$part_count.
		//	'  PCC: '.$contents_count.'<br>';

		$offset = 38;
		$bkgnd['parts'] = $this->decode_parts($part_count, $bkgnd_data, $offset);
		$bkgnd['content'] = $this->decode_content($contents_count, $bkgnd_data, $offset);
		
		$bkgnd['name'] = $this->cstring(substr($bkgnd_data, $offset));
		$bkgnd['script'] = $this->cstring(substr($bkgnd_data, $offset + strlen($bkgnd['name'])));
		$bkgnd['name'] = $this->macroman_decode( $bkgnd['name'] );
		$bkgnd['script'] = $this->macroman_decode( $bkgnd['script'] );
		
		if ($bkgnd['bmap_id'])
		{
			$this->extract_bitmap($bkgnd['bmap_id']);
		}
	}
	
	
	private function decode_parts($part_count, &$layer_data, &$offset)
	{
		$parts = Array();
		
		//print '<ul>';
		
		for ($p = 0; $p < $part_count; $p++)
		{
			$part = Array();
			
			$fields = unpack('nsz/npid/Ctype/Cflag1/ntop/nleft/nbot/nright/Cflag2/Cstyle'.
				'/nlsl/nicon/ntalign/nfont/ntsize/Ctstyle/Ccrap2/ntheight', 
				substr($layer_data, $offset, 100));
			$sz = $fields['sz'];
			$part['pid'] = $fields['pid'];
			$part['type'] = ($fields['type'] == 1 ? 'button' : 'field');
			$part['rect'] = $fields['left'].','.$fields['top'].','.$fields['right'].','.$fields['bot'];
			switch ($fields['style'])
			{
			case 0:
				$part['style'] = 'transparent';
				break;
			case 1:
				$part['style'] = 'opaque';
				break;
			case 2:
				$part['style'] = 'rectangle';
				break;
			case 3:
				$part['style'] = 'roundRect';
				break;
			case 4:
				$part['style'] = 'shadow';
				break;
			case 5:
				$part['style'] = 'checkBox';
				break;
			case 6:
				$part['style'] = 'radioButton';
				break;
			case 7:
				$part['style'] = 'scrolling';
				break;
			case 8:
				$part['style'] = 'standard';
				break;
			case 9:
				$part['style'] = 'default';
				break;
			case 10:
				$part['style'] = 'oval';
				break;
			case 11:
				$part['style'] = 'popup';
				break;
			}
			if ($part['type'] == 'button')
			{
				$part['invisible'] = (($fields['flag1'] & 0x80) != 0);
				$part['dont_search'] = (($fields['flag1'] & 0x10) != 0);
				$part['disabled'] = (($fields['flag1'] & 0x01) != 0);
				
				$part['show_name'] = (($fields['flag2'] & 0x80) != 0);
				$part['hilite'] = (($fields['flag2'] & 0x40) != 0);
				$part['auto_hilite'] = (($fields['flag2'] & 0x20) != 0);
				$part['shared'] = (($fields['flag2'] & 0x10) == 0);
				
				$part['family'] = ($fields['flag2'] & 0x0F);
				
				$part['icon_id'] = $fields['icon'];
			}
			else /* field */
			{
				$part['invisible'] = (($fields['flag1'] & 0x80) != 0);
				$part['dont_wrap'] = (($fields['flag1'] & 0x20) != 0);
				$part['dont_search'] = (($fields['flag1'] & 0x10) != 0);
				$part['shared'] = (($fields['flag1'] & 0x08) != 0);
				$part['flex_lines'] = (($fields['flag1'] & 0x04) != 0);
				$part['auto_tab'] = (($fields['flag1'] & 0x02) != 0);
				$part['lock_text'] = (($fields['flag1'] & 0x01) != 0);
				
				$part['auto_select'] = (($fields['flag2'] & 0x80) != 0);
				$part['show_lines'] = (($fields['flag2'] & 0x40) != 0);
				$part['wide_margins'] = (($fields['flag2'] & 0x20) != 0);
				$part['multiple_lines'] = (($fields['flag2'] & 0x10) != 0);
				
				$part['last_selected_line'] = $fields['lsl'];
				$part['first_selected_line'] = $fields['icon'];
			}
			///nlsl/nicon/ntalign/n2font/ntsize/Ctstyle/Ccrap2/ntheight
			
			switch ($fields['talign'])
			{
			case 0:
				$part['text_align'] = 'left';
				break;
			case 1:
				$part['text_align'] = 'center';
				break;
			case 2:
				$part['text_align'] = 'right';
				break;
			}
			$part['text_font'] = $this->fonts[$fields['font']];
			$part['text_size'] = $fields['tsize'];
			$part['text_height'] = $fields['theight'];
			
			$part['text_style'] = $this->decode_style_bits($fields['tstyle']);
			
			$part['name'] = $this->cstring( substr($layer_data, $offset + 30) );
			$part['script'] = $this->cstring( substr($layer_data, $offset + 30 + strlen($part['name']) + 2) );
			$part['name'] = $this->macroman_decode( $part['name'] );
			$part['script'] = $this->macroman_decode( $part['script'] );
				
			//print '<li>';
			//print $part['pid'].' TYPE '.$part['type'].' RECT '.$part['rect'].' STYLE '.$part['style'];
			//var_dump($part);
			//print '</li>';
			
			$parts[] = $part;
			$offset += $sz;
		}
		
		//print '</ul>';
		
		return $parts;
	}
	
	
	// this is virtually identical to decode bkgnd!!
	
	private function decode_card(&$card)
	{
		//print '<p>';
		$card_id = $card['card_id'];
		$card_data = substr($this->contents, $this->block_index['CARD'][$card_id]['offset'], 
				$this->block_index['CARD'][$card_id]['size']);
		
		$fields = unpack('Nbmap/nflags', substr($card_data, 4, 6));
		$card['bmap_id'] = $fields['bmap'];
		$card['cant_delete'] = (($fields['flags'] & 0x4000) != 0);
		$card['hide_picture'] = (($fields['flags'] & 0x2000) != 0);
		$card['dont_search'] = (($fields['flags'] & 0x0800) != 0);
		
		$fields = unpack('Nbg/nparts', substr($card_data, 24, 6));
		$card['bkgnd_id'] = $fields['bg'];
		if (($card['bkgnd_id'] != 0) && isset($this->block_index['BKGD'][$card['bkgnd_id']]))
			$this->block_index['BKGD'][$card['bkgnd_id']]['utilised'] = true;
		$part_count = $fields['parts'];
		
		$fields = unpack('npcc/Nstype', substr($card_data, 36, 6));
		$contents_count = $fields['pcc'];
		//$script_type = $fields['stype'];
		
		//print 'CARD: '.$card['card_id'].' BMAP: '.$card['bmap_id'].' BKGND: '.$card['bkgnd_id'].'  PARTS:'.$part_count.
		//	'  PCC: '.$contents_count.'<br>';

		$offset = 42;
		$card['parts'] = $this->decode_parts($part_count, $card_data, $offset);
		$card['content'] = $this->decode_content($contents_count, $card_data, $offset);
		
		$card['name'] = $this->cstring(substr($card_data, $offset));
		$card['script'] = $this->cstring(substr($card_data, $offset + strlen($card['name'])));
		$card['name'] = $this->macroman_decode( $card['name'] );
		$card['script'] = $this->macroman_decode( $card['script'] );
	}
	
	
	private function decode_content($contents_count, &$layer_data, &$offset)
	{
		$contents = Array();
		
		for ($c = 0; $c < $contents_count; $c++)
		{
			$content = Array();
			
			$fields = unpack('npid/nsz/Cmarker', substr($layer_data, $offset, 5));
			$content['part_id'] = $fields['pid'];
			$sz = $fields['sz'];
			$content_data = substr($layer_data, $offset + 4, $sz);
			
			if ($fields['marker'] == 0)
				$content['text'] = $this->macroman_decode( $this->cstring(substr($content_data, 1)) );
			else
			{
				$style_runs = Array();
				$fields = unpack('nslen', substr($layer_data, $offset + 4, 2));
				$styles_length = ($fields['slen'] & 0x7FFF) - 2;
				
				$text_offset = $offset + 6 + $styles_length;
				$content['text'] = $this->macroman_decode( $this->cstring(substr($content_data, 2 + $styles_length)) );
				
				$ref_offset = $offset + 4 + 2;
				$ref_limit = $ref_offset + $styles_length;
				for (; $ref_offset < $ref_limit; $ref_offset += 4)
				{
					$fields = unpack('npos/nstyle', substr($layer_data, $ref_offset, 4));
					$run = Array();
					
					$run['offset'] = $fields['pos'];
					$run['changes'] = $this->styles[$fields['style']];
					
					$style_runs[] = $run;
				}
				
				$content['style_runs'] = $style_runs;
			}
			
			if ($sz % 2 != 0) $sz++; // align the size
			$offset += $sz + 4;
			$contents[] = $content;
		}
		
		return $contents;
	}
	
	
	private function index_blocks()
	{
		while ($info = $this->read_next_block())
		{
			if ((count($this->block_index) == 0) && ($info['type'] != 'STAK'))
				die("Not a stack.");
			
			if (!isset($this->block_index[$info['type']]))
				$this->block_index[$info['type']] = Array();
			$this->block_index[$info['type']][$info['id']] = $info;
		}
	}
	
	
	private function read_next_block()
	{
		if ($this->offset >= $this->length) return false;
		
		$fields = unpack('Nsize/C4type/Nid', substr($this->contents, $this->offset, 12));
		$block_size = $fields['size'];
		$block_id = $fields['id'];
		if ($block_id > 2147483647) $block_id -= 4294967296;
		$block_type = chr($fields['type1']).chr($fields['type2']).chr($fields['type3']).chr($fields['type4']);
		$block_offset = $this->offset + 12;
		$this->offset += $block_size;
		
		return Array('type'=>$block_type, 'id'=>$block_id, 'size'=>($block_size - 12), 'offset'=>$block_offset);
	}
	
	
}


?><!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>CinsImp::HC Import</title>
</head>
<body>


<?php
$hcimporter = new HCImporter('practice');
?>



</body>
</html>