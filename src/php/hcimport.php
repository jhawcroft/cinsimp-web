<?php
/*
CinsImp
HyperCard Import

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
	
	
	private static function load_stack()
	{
		HCImport::$offset = 0;
		HCImport::$length = filesize(HCImport::upload_temp());
		$fp = fopen(HCImport::upload_temp(), 'rb');
		HCImport::$contents = fread($fp, HCImport::$length);
		fclose($fp);
	}
	
	
	public static function import_stack_data()
	{
		HCImport::create_stack();
		$lists = HCImport::list_layers();
		foreach ($lists['bkgnds'] as $bkgnd)
			HCImport::import_bkgnd($bkgnd);
		for ($i = 0; $i < count($lists['cards']); $i++)
			HCImport::import_card($lists['cards'][$i], $i + 1);
	}
	
	
	public static function create_stack()
	{
		$filename = HCImport::stack_temp();
		if (file_exists($filename)) unlink($filename);
		Stack::create_file($filename);
		
		HCImport::load_stack();
		HCImport::index_blocks();
		HCImport::decode_stak();
		
		$new_file = new Stack($filename);
		$new_stack = $new_file->stack_load();
		
		$new_stack['card_width'] = HCImport::$stack['card_width'];
		$new_stack['card_height'] = HCImport::$stack['card_height'];
		
		$new_file->stack_save($new_stack);
		
		$new_file->zap_all_cards();
		
		return HCImport::$stack;
	}
	
	
	public static function list_layers()
	{
		HCImport::load_stack();
		HCImport::index_blocks();
		HCImport::decode_stak();
		
		$result = Array();
		$result['cards'] = HCImport::decode_sequence();
		$result['bkgnds'] = HCImport::list_bkgnds();
		return $result;
	}
	
	
	private static function convert_part($part_data)
	{
		$new_part = Array();
		
		$new_part[-1] = ($part_data['type'] == 'button' ? 0 : 1);
		$new_part[-2] = $part_data['pid'];
		$new_part[-3] = -1; // invalid part #
		$new_part[-4] = -1; // invalid class #
		$new_part[-5] = Array($part_data['rect'][0], $part_data['rect'][1]);
		$new_part[-6] = Array($part_data['rect'][2] - $part_data['rect'][0],
			$part_data['rect'][3] - $part_data['rect'][1]);
		$new_part[-7] = $part_data['name'];
		$new_part[-8] = $part_data['shared'];
		$new_part[-9] = (! $part_data['dont_search']);
		$new_part[-10] = (! $part_data['invisible']);
		$new_part[-11] = $part_data['script'];
		switch ($part_data['text_align'])
		{
		case 'left':
			$new_part[-13] = 0;
			break;
		case 'right':
			$new_part[-13] = 2;
			break;
		default:
			$new_part[-13] = 1;
			break;
		}
		$new_part[-14] = $part_data['text_font'];
		$new_part[-15] = $part_data['text_size'];
		$new_part[-16] = 0;
		$style_flags = $part_data['text_style'];
		if ($style_flags['b']) $new_part[-16] = $new_part[-16] & 0x01;
		if ($style_flags['i']) $new_part[-16] = $new_part[-16] & 0x02;
		if ($style_flags['u']) $new_part[-16] = $new_part[-16] & 0x04;
		if ($style_flags['s']) $new_part[-16] = $new_part[-16] & 0x08;
		if ($style_flags['c']) $new_part[-16] = $new_part[-16] & 0x10;
		if ($style_flags['e']) $new_part[-16] = $new_part[-16] & 0x20;
		$new_part[-17] = $part_data['text_height'];
		
		if ($part_data['type'] == 'button')
		{
			$new_part[-12] = $part_data['disabled'];
			$new_part[3] = null; // no menu
			
			switch ($part_data['style'])
			{
			case 'opaque': // borderless, white, no shadow
				$new_part[1] = 0;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = false;
				break;
			case 'rectangle': // rectangular, white, no shadow
				$new_part[1] = 1;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = false;
				break;
			case 'roundRect': // rounded, white, shadow
				$new_part[1] = 2;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = true;
				break;
			case 'shadow': // rectangular, white, shadow
				$new_part[1] = 1;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = true;
				break;
			case 'checkBox': // checkbox, white, no shadow
				$new_part[1] = 3;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = false;
				break;
			case 'radioButton': // radio button, white, no shadow
				$new_part[1] = 4;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = false;
				break;
			case 'standard':
			case 'default': // rounded, opaque
				$new_part[1] = 2;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = false;
				break;
			case 'popup': // rectangle, opaque, shadow w/ menu
				$new_part[1] = 1;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = true;
				$new_part[3] = true; // has menu - should actually be the content, can replace later?
				break;
			default: // transparent/oval => transparent, borderless, no shadow
				$new_part[1] = 0;
				$new_part[-18] = null;
				$new_part[-19] = false;
				break;
			}
			
			$new_part[2] = $part_data['family'];
			$new_part[4] = $part_data['icon_id'];
			$new_part[5] = $part_data['show_name'];
			$new_part[6] = $part_data['hilite'];
			$new_part[7] = $part_data['auto_hilite'];
			
		}
		else /* field */
		{
			$new_part[-12] = false; // disabled
			
			$new_part[-18] = Array(1,1,1); // color
			$new_part[-19] = false; // shadow
			
			$new_part[2] = false;// no scroll
			
			switch ($part_data['style'])
			{
			case 'opaque': // no border, white, no shadow
				$new_part[1] = false;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = false;
				break;
			case 'rectangle':
				$new_part[1] = true;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = false;
				break;
			case 'shadow':
				$new_part[1] = true;
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = true;
				break;
			case 'scrolling':
				$new_part[1] = true;
				$new_part[2] = true;// scroll
				$new_part[-18] = Array(1,1,1);
				$new_part[-19] = false;
				break;
			default: // transparent
				$new_part[1] = false;
				$new_part[-18] = null;
				$new_part[-19] = false;
				break;
			}
			
			$new_part[3] = $part_data['lock_text'];
			$new_part[4] = $part_data['dont_wrap'];
			$new_part[5] = (! $part_data['flex_lines']);
			$new_part[6] = $part_data['auto_tab'];
			$new_part[7] = $part_data['wide_margins'];
			$new_part[8] = $part_data['show_lines'];
			$new_part[9] = $part_data['auto_select'];
			//$new_part[9] = $part_data['multiple_lines']; // no equiv at present - should be **
			$new_part[10] = $part_data['first_selected_line'];
			$new_part[11] = $part_data['last_selected_line'];
		}
	
		return $new_part;
	}
	
	
	public static function import_bkgnd($id)
	{
		//return 'BKGD: '.$id;
		
		HCImport::load_stack();
		HCImport::index_blocks();
		HCImport::decode_stak();
		
		HCImport::decode_font_table();
		HCImport::decode_style_table();
		
		$old_bkgnd = HCImport::decode_bkgnd(intval($id));
		
		$new_file = new Stack(HCImport::stack_temp());
		
		$new_bkgnd = Array();
		$new_bkgnd['bkgnd_id'] = intval($id);
		$new_bkgnd['bkgnd_name'] = $old_bkgnd['name'];
		$new_bkgnd['bkgnd_cant_delete'] = $old_bkgnd['cant_delete'];
		$new_bkgnd['bkgnd_dont_search'] = $old_bkgnd['dont_search'];
		$new_bkgnd['bkgnd_script'] = Array('content'=>$old_bkgnd['script'], 'selection'=>0);
		$new_bkgnd['bkgnd_has_art'] = false;
		
		$new_parts = Array();
		$part_index = Array();
		$n = 1;
		foreach ($old_bkgnd['parts'] as $part)
		{
			$new_part = HCImport::convert_part($part);
			$part_index[ $part['pid'] ] = count($new_parts);
			$new_parts[] = $new_part;
			$n++;
		}
		
		foreach ($old_bkgnd['content'] as $fdata)
		{
			if (isset($part_index[ $fdata['part_id'] ]))
			{
				$idx = $part_index[ $fdata['part_id'] ];
				$new_parts[$idx][-99] = nl2br($fdata['text'], false);
				//print 'IDX: '.$idx.' = '.$fdata['text'].'<br>';
			}
			
		}
		
		$new_bkgnd['bkgnd_object_data'] = json_encode($new_parts);
		
		$new_file->stack_inject_bkgnd($new_bkgnd);
		
		return $old_bkgnd;
		//$new_file = new Stack($filename);
	}
	
	
	public static function import_card($id, $seq)
	{
		//return 'CARD: '.$id;
		
		HCImport::load_stack();
		HCImport::index_blocks();
		HCImport::decode_stak();
		
		HCImport::decode_font_table();
		HCImport::decode_style_table();
		
		$old_card = HCImport::decode_card(intval($id));
		
		$new_file = new Stack(HCImport::stack_temp());
		
		$new_card = Array();
		$new_card['card_id'] = intval($id);
		$new_card['card_name'] = $old_card['name'];
		$new_card['card_cant_delete'] = $old_card['cant_delete'];
		$new_card['card_dont_search'] = $old_card['dont_search'];
		$new_card['card_script'] = Array('content'=>$old_card['script'], 'selection'=>0);
		$new_card['card_has_art'] = false;
		$new_card['card_bkgnd_id'] = $old_card['bkgnd_id'];
		$new_card['card_seq'] = intval($seq) * 10;
		
		$new_parts = Array();
		$part_index = Array();
		$n = 1;
		foreach ($old_card['parts'] as $part)
		{
			$new_part = HCImport::convert_part($part);
			$part_index[ $part['pid'] ] = count($new_parts);
			$new_parts[] = $new_part;
			$n++;
		}
		
		$datas = Array();
		foreach ($old_card['content'] as $fdata)
		{
			$pid = $fdata['part_id'];
			$is_bkgnd = true;
			if ($pid > 32765)
			{
				$pid = 65536 - $pid;
				$is_bkgnd = false;
				//print 'ID: '.$pid.' (card)<br>';
			}
			if (isset($part_index[ $pid ]) && (!$is_bkgnd))
			{
				$idx = $part_index[ $pid ];
				$new_parts[$idx][-99] = nl2br($fdata['text'], false);
				//print 'IDX: '.$idx.' = '.$fdata['text'].'<br>';
			}
			else
				$datas[] = Array($fdata['part_id'], nl2br($fdata['text'], false));
		}
		
		$new_card['card_object_data'] = json_encode($new_parts);
		$new_card['data'] = json_encode($datas);
		$new_card['content'] = '';
		
		$new_file->stack_inject_card($new_card);
		
		return $old_card;
	}
	
	/*
	public static function scan_stack()
	{
		$result = Array();
		
		HCImport::index_blocks();
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
	*/
	
	
	private static function decode_card($card_id)
	{
		//print '<p>';
		$card = Array();
		$card_data = substr(HCImport::$contents, 
			HCImport::$block_index['CARD'][$card_id]['offset'], 
			HCImport::$block_index['CARD'][$card_id]['size']);
		
		$fields = unpack('Nbmap/nflags', substr($card_data, 4, 6));
		$card['bmap_id'] = $fields['bmap'];
		$card['cant_delete'] = (($fields['flags'] & 0x4000) != 0);
		$card['hide_picture'] = (($fields['flags'] & 0x2000) != 0);
		$card['dont_search'] = (($fields['flags'] & 0x0800) != 0);
		
		$fields = unpack('Nbg/nparts', substr($card_data, 24, 6));
		$card['bkgnd_id'] = $fields['bg'];
		if (($card['bkgnd_id'] != 0) && isset(HCImport::$block_index['BKGD'][$card['bkgnd_id']]))
			HCImport::$block_index['BKGD'][$card['bkgnd_id']]['utilised'] = true;
		$part_count = $fields['parts'];
		
		$fields = unpack('npcc/Nstype', substr($card_data, 36, 6));
		$contents_count = $fields['pcc'];
		//$script_type = $fields['stype'];
		
		//print 'CARD: '.$card['card_id'].' BMAP: '.$card['bmap_id'].' BKGND: '.$card['bkgnd_id'].'  PARTS:'.$part_count.
		//	'  PCC: '.$contents_count.'<br>';

		$offset = 42;
		$card['parts'] = HCImport::decode_parts($part_count, $card_data, $offset);
		$card['content'] = HCImport::decode_content($contents_count, $card_data, $offset);
		
		$card['name'] = HCImport::cstring(substr($card_data, $offset));
		$card['script'] = HCImport::cstring(substr($card_data, $offset + strlen($card['name'])));
		$card['name'] = HCImport::macroman_decode( $card['name'] );
		$card['script'] = HCImport::macroman_decode( $card['script'] );
		
		return $card;
	}
	
	private static function decode_bkgnd($bkgnd_id)
	{
		$bkgnd_data = substr(HCImport::$contents, 
			HCImport::$block_index['BKGD'][$bkgnd_id]['offset'], 
			HCImport::$block_index['BKGD'][$bkgnd_id]['size']);
		$bkgnd = Array();
		
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
		$bkgnd['parts'] = HCImport::decode_parts($part_count, $bkgnd_data, $offset);
		$bkgnd['content'] = HCImport::decode_content($contents_count, $bkgnd_data, $offset);
		
		$bkgnd['name'] = HCImport::cstring(substr($bkgnd_data, $offset));
		$bkgnd['script'] = HCImport::cstring(substr($bkgnd_data, $offset + strlen($bkgnd['name'])));
		$bkgnd['name'] = HCImport::macroman_decode( $bkgnd['name'] );
		$bkgnd['script'] = HCImport::macroman_decode( $bkgnd['script'] );
		
		return $bkgnd;
	}
	
	
	private static function decode_parts($part_count, &$layer_data, &$offset)
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
			$part['rect'] = [$fields['left'], $fields['top'], $fields['right'], $fields['bot']];
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
			$part['text_font'] = HCImport::$fonts[$fields['font']];
			$part['text_size'] = $fields['tsize'];
			$part['text_height'] = $fields['theight'];
			
			$part['text_style'] = HCImport::decode_style_bits($fields['tstyle']);
			
			$part['name'] = HCImport::cstring( substr($layer_data, $offset + 30) );
			$part['script'] = HCImport::cstring( substr($layer_data, $offset + 30 + strlen($part['name']) + 2) );
			$part['name'] = HCImport::macroman_decode( $part['name'] );
			$part['script'] = HCImport::macroman_decode( $part['script'] );
				
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
	
	
	private static function decode_content($contents_count, &$layer_data, &$offset)
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
				$content['text'] = HCImport::macroman_decode( HCImport::cstring(substr($content_data, 1)) );
			else
			{
				$style_runs = Array();
				$fields = unpack('nslen', substr($layer_data, $offset + 4, 2));
				$styles_length = ($fields['slen'] & 0x7FFF) - 2;
				
				$text_offset = $offset + 6 + $styles_length;
				$content['text'] = HCImport::macroman_decode( HCImport::cstring(substr($content_data, 2 + $styles_length)) );
				
				$ref_offset = $offset + 4 + 2;
				$ref_limit = $ref_offset + $styles_length;
				for (; $ref_offset < $ref_limit; $ref_offset += 4)
				{
					$fields = unpack('npos/nstyle', substr($layer_data, $ref_offset, 4));
					$run = Array();
					
					$run['offset'] = $fields['pos'];
					$run['changes'] = HCImport::$styles[$fields['style']];
					
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
	
	
	private static function list_bkgnds()
	{
		$list = Array();
		$table = HCImport::$block_index['BKGD'];
		foreach ($table as $id => $entry)
		{
			$list[] = $id;
		}
		return $list;
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
		
		$fields = unpack('nheight/nwidth', substr($stak_data, 428, 4));//428
		$stack['card_width'] = $fields['width'];
		$stack['card_height'] = $fields['height'];
		if ($stack['card_width'] == 0) $stack['card_width'] = 512;
		if ($stack['card_height'] == 0) $stack['card_height'] = 342;
		
		$stack['script'] = HCImport::macroman_decode( HCImport::cstring(substr($stak_data, 1524)) );
		
		$fields = unpack('Nftbl/Nstbl', substr($stak_data, 420, 8));
		HCImport::$block_index['STAK'][-1]['font_table_id'] = $fields['ftbl'];
		HCImport::$block_index['STAK'][-1]['style_table_id'] = $fields['stbl'];
		
		HCImport::$stack = $stack;
	}
	
	
	private static function index_blocks()
	{
		$block_index = Array();
		
		while ($info = HCImport::read_next_block())
		{
			if ((count($block_index) == 0) && ($info['type'] != 'STAK'))
				throw new Exception("Not a stack.");
			
			if (!isset($block_index[$info['type']]))
				$block_index[$info['type']] = Array();
			$block_index[$info['type']][$info['id']] = $info;
		}
		
		HCImport::$block_index = $block_index;
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
		return str_replace("\r","\n",$input);
	}
	
}


