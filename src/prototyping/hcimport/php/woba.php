<?php
/*
 Prototype WOBA Decoder for PHP
 (c) 2015 Joshua Hawcroft
 
 May all beings have happiness and the cause of happiness.
 May all beings be free of suffering and the cause of suffering.
 May all beings rejoice for the supreme happiness which is without suffering.
 May all beings abide in the great equanimity; free of attachment and delusion.
 
 based upon WOBA Decoder for C++
 (c) 2005 Jonathan Bettencourt / Kreative Korporation

 This code is under the MIT license.

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in the
 Software without restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies
 or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Call this at each point of interest, passing a descriptive string
function prof_flag($str)
{
    global $prof_timing, $prof_names;
    $prof_timing[] = microtime(true);
    $prof_names[] = $str;
}

// Call this when you're done and want to see the results
function prof_print()
{
    global $prof_timing, $prof_names;
    $size = count($prof_timing);
    for($i=0;$i<$size - 1; $i++)
    {
        echo "<b>{$prof_names[$i]}</b><br>";
        echo sprintf("&nbsp;&nbsp;&nbsp;%f<br>", $prof_timing[$i+1]-$prof_timing[$i]);
    }
    echo "<b>{$prof_names[$size-1]}</b><br>";
}



class WOBAPicture
{
	private $width;
	private $height;
	
	private $rowlength;
	private $maskrowlength;
	
	private $bitmaplength;
	private $masklength;
	
	private $bitmap;
	private $mask;
	
	private $use_bitmap;
	
	
	public function write_pbm()
	{
		$header = "P4\n$this->width $this->height\n";
		
		$fp = fopen('picture.pbm', 'wb');
		fwrite($fp, $header);
		$data = '';
		for ($b = 0; $b < $this->bitmaplength; $b++)
			$data .= chr($this->bitmap[$b]);
		fwrite($fp, $data);
		fclose($fp);
		
		$fp = fopen('mask.pbm', 'wb');
		fwrite($fp, $header);
		$data = '';
		for ($b = 0; $b < $this->masklength; $b++)
			$data .= chr($this->mask[$b]);
		fwrite($fp, $data);
		fclose($fp);
	}
	
	
	public function write_xbm()
	{
		$BitReverseTable256 = Array( 
		  0x00, 0x80, 0x40, 0xC0, 0x20, 0xA0, 0x60, 0xE0, 0x10, 0x90, 0x50, 0xD0, 0x30, 0xB0, 0x70, 0xF0, 
		  0x08, 0x88, 0x48, 0xC8, 0x28, 0xA8, 0x68, 0xE8, 0x18, 0x98, 0x58, 0xD8, 0x38, 0xB8, 0x78, 0xF8, 
		  0x04, 0x84, 0x44, 0xC4, 0x24, 0xA4, 0x64, 0xE4, 0x14, 0x94, 0x54, 0xD4, 0x34, 0xB4, 0x74, 0xF4, 
		  0x0C, 0x8C, 0x4C, 0xCC, 0x2C, 0xAC, 0x6C, 0xEC, 0x1C, 0x9C, 0x5C, 0xDC, 0x3C, 0xBC, 0x7C, 0xFC, 
		  0x02, 0x82, 0x42, 0xC2, 0x22, 0xA2, 0x62, 0xE2, 0x12, 0x92, 0x52, 0xD2, 0x32, 0xB2, 0x72, 0xF2, 
		  0x0A, 0x8A, 0x4A, 0xCA, 0x2A, 0xAA, 0x6A, 0xEA, 0x1A, 0x9A, 0x5A, 0xDA, 0x3A, 0xBA, 0x7A, 0xFA,
		  0x06, 0x86, 0x46, 0xC6, 0x26, 0xA6, 0x66, 0xE6, 0x16, 0x96, 0x56, 0xD6, 0x36, 0xB6, 0x76, 0xF6, 
		  0x0E, 0x8E, 0x4E, 0xCE, 0x2E, 0xAE, 0x6E, 0xEE, 0x1E, 0x9E, 0x5E, 0xDE, 0x3E, 0xBE, 0x7E, 0xFE,
		  0x01, 0x81, 0x41, 0xC1, 0x21, 0xA1, 0x61, 0xE1, 0x11, 0x91, 0x51, 0xD1, 0x31, 0xB1, 0x71, 0xF1,
		  0x09, 0x89, 0x49, 0xC9, 0x29, 0xA9, 0x69, 0xE9, 0x19, 0x99, 0x59, 0xD9, 0x39, 0xB9, 0x79, 0xF9, 
		  0x05, 0x85, 0x45, 0xC5, 0x25, 0xA5, 0x65, 0xE5, 0x15, 0x95, 0x55, 0xD5, 0x35, 0xB5, 0x75, 0xF5,
		  0x0D, 0x8D, 0x4D, 0xCD, 0x2D, 0xAD, 0x6D, 0xED, 0x1D, 0x9D, 0x5D, 0xDD, 0x3D, 0xBD, 0x7D, 0xFD,
		  0x03, 0x83, 0x43, 0xC3, 0x23, 0xA3, 0x63, 0xE3, 0x13, 0x93, 0x53, 0xD3, 0x33, 0xB3, 0x73, 0xF3, 
		  0x0B, 0x8B, 0x4B, 0xCB, 0x2B, 0xAB, 0x6B, 0xEB, 0x1B, 0x9B, 0x5B, 0xDB, 0x3B, 0xBB, 0x7B, 0xFB,
		  0x07, 0x87, 0x47, 0xC7, 0x27, 0xA7, 0x67, 0xE7, 0x17, 0x97, 0x57, 0xD7, 0x37, 0xB7, 0x77, 0xF7, 
		  0x0F, 0x8F, 0x4F, 0xCF, 0x2F, 0xAF, 0x6F, 0xEF, 0x1F, 0x9F, 0x5F, 0xDF, 0x3F, 0xBF, 0x7F, 0xFF
		);
	
		$header = "#define test_width $this->width\n".
			"#define test_height $this->height\n".
			"static char test_bits[] = {\n";
		$footer = " };";
			
		$fp = fopen('picture.xbm', 'wb');
		fwrite($fp, $header);
		prof_flag("Beginning Export Composition");
		$data = '';
		for ($b = 0; $b < $this->bitmaplength; $b++)
			$data .= '0x'.str_pad(dechex($BitReverseTable256[$this->bitmap[$b]]), 2, '0', STR_PAD_LEFT).', ';
		$data = substr($data, 0, strlen($data)-2);
		prof_flag("Finished Export Composition");
		fwrite($fp, $data);
		fwrite($fp, $footer);
		fclose($fp);
		
		$fp = fopen('mask.xbm', 'wb');
		fwrite($fp, $header);
		$data = '';
		for ($b = 0; $b < $this->masklength; $b++)
			$data .= '0x'.str_pad(dechex($BitReverseTable256[$this->mask[$b]]), 2, '0', STR_PAD_LEFT).', ';
		$data = substr($data, 0, strlen($data)-2);
		fwrite($fp, $data);
		fwrite($fp, $footer);
		fclose($fp);
		
		unset($data);
		
		$image = imagecreatefromxbm('picture.xbm');
		imagepng($image, 'picture.png');
		//imagejpeg($image, 'picture.jpeg');
		imagedestroy($image);
		
		$image = imagecreatefromxbm('mask.xbm');
		imagepng($image, 'mask.png');
		imagedestroy($image);
	}


	public function __construct($width, $height)
	{
		$this->width = $width;
		$this->height = $height;
		
		$this->rowlength = WOBAPicture::_bitmap_row_width($width, $height);
		$this->maskrowlength = WOBAPicture::_bitmap_row_width($width, $height);
		
		$this->bitmaplength = WOBAPicture::_bitmap_size($width, $height);
		$this->masklength = WOBAPicture::_bitmap_size($width, $height);
		
		$this->bitmap = array_fill(0, $this->bitmaplength, 0);
		$this->mask = array_fill(0, $this->masklength, 0);
		
		$this->use_bitmap = true;
	}
	
	
	public function set_use_bitmap($use_bitmap)
	{
		$this->use_bitmap = $use_bitmap;
	}
	
	
	private function &_bitmap()
	{
		return ($this->use_bitmap ? $this->bitmap : $this->mask);
	}
	
	
	public function memcopyin(&$src, $offset, $x, $y, $count)
	{
		if ($this->use_bitmap)
			array_splice($this->bitmap, $this->coordbyteoffset($x, $y), $count, array_slice($src, $offset, $count));
		else
			array_splice($this->mask, $this->coordbyteoffset($x, $y), $count, array_slice($src, $offset, $count));
		//WOBA::_memcpy($this->_bitmap(), $this->coordbyteoffset($x, $y), $src, $offset, $count);	
	}
	
	
	public function memcopyout(&$dest, $x, $y, $count)
	{
		if ($this->use_bitmap)
			array_splice($dest, 0, $count, array_slice($this->bitmap, $this->coordbyteoffset($x, $y), $count));
		else
			array_splice($dest, 0, $count, array_slice($this->mask, $this->coordbyteoffset($x, $y), $count));
		//WOBA::_memcpy($dest, 0, $this->_bitmap(), $this->coordbyteoffset($x,$y), $count);
	}


	public function memfill($ch, $x, $y, $count)
	{
		if ($this->use_bitmap)
			array_splice($this->bitmap, $this->coordbyteoffset($x,$y), $count, array_fill(0, $count, $ch));
		else
			array_splice($this->mask, $this->coordbyteoffset($x,$y), $count, array_fill(0, $count, $ch));
		//WOBA::_memset($this->_bitmap(), $this->coordbyteoffset($x,$y), $ch, $count);
	}


	public function copyrow($dest, $src)
	{
		if ($this->use_bitmap)
			array_splice($this->bitmap, $this->coordbyteoffset(0, $dest), $this->rowlength, 
				array_slice($this->bitmap, $this->coordbyteoffset(0, $src), $this->rowlength));
		else
			array_splice($this->mask, $this->coordbyteoffset(0, $dest), $this->maskrowlength, 
				array_slice($this->mask, $this->coordbyteoffset(0, $src), $this->maskrowlength));
		//WOBA::_memcpy($this->_bitmap(), $this->coordbyteoffset(0, $dest),
		//	   		  $this->_bitmap(), $this->coordbyteoffset(0,src),
		//	   		  $this->rowlength);
	}


	public function directcopybmptomask()
	{
		array_splice($this->mask, 0, $this->masklength, array_slice($this->bitmap, 0, $this->masklength));
		//WOBA::memcpy($this->mask, $this->bitmap, $this->masklength);
	}
	
	
	private function coordbyteoffset($x, $y)
	{
		return (($this->use_bitmap ? $this->rowlength : $this->maskrowlength) * $y) + ($x / 8);
	}

	
	private static function _bitmap_row_width($width, $height)
	{
		return ($width / 8) + ( ($width  % 8) ? 1 : 0 );
	}


	private static function _bitmap_size($width, $height)
	{
		return WOBAPicture::_bitmap_row_width($width, $height) * $height;
	}
	
	
	public function debug()
	{
		print '<p>PICTURE DATA ('.$this->bitmaplength.' bytes)</p>';
		print '<pre style="font-family: monaco; font-size: 8pt;">';
		$c = 0;
		for ($i = 0; $i < $this->bitmaplength; $i++, $c++)
		{
			if ($c % 4 == 0) print ' ';
			print strtoupper(str_pad(dechex($this->bitmap[$i]), 2, 0, STR_PAD_LEFT));
			if ($c == 15) 
			{
				$c = -1;
				print "\n";
			}
		}
		print '</pre>';
	}
}



class WOBA
{
	public static function decode(&$data)
	{
		print "<p>Decoding WOBA</p>";
		
		$bytes = array_merge( unpack('C*', $data) );  /* (array_merge reindexes from zero) */
		$header = WOBA::decode_header($bytes);		
		
		$picture = new WOBAPicture(
			$header['image_bounds']['right'] - $header['image_bounds']['left'],
			$header['image_bounds']['bottom'] - $header['image_bounds']['top']
		);
		
		$BMAP_HEADER_OFFSET = 64;
		
		
		/* decode mask */
		$picture->set_use_bitmap(false);
		if ($header['mask_length'])
		{
			WOBA::decode_woba($picture, $bytes, $BMAP_HEADER_OFFSET, $header['mask_length'], $header['mask_bounds']);
			print 'Decoding full mask<br>';
		}
		else if ($header['mask_bounds']['top'] | $header['mask_bounds']['left'] | 
				$header['mask_bounds']['bottom'] | $header['mask_bounds']['right'])
		{
			/* mask bounds != 0, but no mask data,
			 so use simple bounds rect for mask */
			$bx = $header['mask_bounds']['left'] / 8;
			$x = 0;
			$rowwidth = ($header['mask_bounds']['right'] - $header['mask_bounds']['left'] ) / 8;
			$buffer1 = array_fill(0, $rowwidth, 0); 
		
			for ($k=$bx; $x<$rowwidth; $k++, $x++) /* make a row of 0xFF */
				$buffer1[$k] = 0xFF;
		
			$bottom = $header['mask_bounds']['bottom'];
			for ($k=$header['mask_bounds']['top']; $k<$bottom; $k++) /* copy the row to all rows of mask output buffer */
				$picture->memcopyin($buffer1, 0, 0, $k, $rowwidth);
			
			print 'Using simple mask<br>';
		}

		/* decode bitmap */
		$picture->set_use_bitmap(true);
		if ($header['picture_length'])
		{
			WOBA::decode_woba($picture, $bytes, $BMAP_HEADER_OFFSET + $header['mask_length'], $header['picture_length'], $header['picture_bounds']);
			print 'Decoding full picture<br>';
		}
        	
        
        if (! ($header['mask_length'] | 
        		$header['mask_bounds']['top'] | $header['mask_bounds']['left'] | 
				$header['mask_bounds']['bottom'] | $header['mask_bounds']['right']))
		{
			/* if there was no mask data and no mask boundary of any kind:
			 use the picture itself for the mask */
			$picture->directcopybmptomask();
			print 'Using image as mask<br>';
		}
        	
        //$picture->debug();
        //$picture->write_pbm();
        $picture->write_xbm();
        	
	}
	
	
	/* xor source data with destination data, for n bytes;
 	dest := dest ^ src (for n) */
	private static function _xornstr(&$dest, &$src, $n)
	{
		for ($i=0; $i<$n; $i++)
			$dest[$i] = ($dest[$i] ^ $src[$i]) & 0xFF;
	}


	/* apparently, shift row right by sh bits;
	 row length = n 
	 (according to HC File Format 2010 notes) */
	private static function _shiftnstr(&$s, $n, $sh)
	{
		$p = 1;
		$x = 0;
		for ($i=0; $i<$sh; $i++) { $p += $p; }
		//print("<p>n = $n, sh = $sh, p = $p</p>\n");
		for ($i=0; $i<$n; $i++) 
		{
			$x += ($s[$i] << 16) / $p;
			$s[$i] = ($x >> 16) & 0xFF;
			$x = ($x & 0xFFFF) << 8;
			
			/*$x += ($s[$i] * 65536) / $p;
			$s[$i] = ord(chr($x / 65536));
			$x = ($x % 65536) * 256;*/
		}
	}
	
	
	public static function _memcpy(&$dest, $dest_offset, &$src, $src_offset, $size)
	{
		array_splice($dest, $dest_offset, $size, array_slice($src, $src_offset, $size));
	}
	
	
	public static function _memset(&$dest, $dest_offset, $byte, $count)
	{
		array_splice($dest, $dest_offset, $count, array_fill(0, $count, $byte));
	}
	
	
	private static function decode_woba($p, &$woba, $bmap_offset, $woba_length, &$bounds)
	{
		prof_flag("WOBA block decode");
	
		/* WOBA initalization */
    
		$woba_offset = 0; /* offset into the WOBA-encoded data for either picture or mask;
							  allows us to halt at the end (woba_length) */
	
		/* left & top: */
		$bx8 = $bounds['left'] & (~ 0x1F); /* round bounding left down to x32 */
	
		/* width & height: */
		
		/* round bounding right up to x32;
		 subtract bounding left -> width */
		$rowwidth8 = ( ($bounds['right'] & 0x1F) ? (($bounds['right'] | 0x1F)+1) : $bounds['right'] )
			- ($bounds['left'] & (~ 0x1F));
		$rowwidth = $rowwidth8 / 8; /* row-width (bytes) -> row-width (bits) */
	
		/* woba state initalization: */
		$repeat = 1; /* part of the WOBA format allows for the repetition of previous operations;
					 this is the number of times the next operation should repeat */
		$dx = 0; /* dx & dy are part of the WOBA codec */
		$dy = 0;
		$patternbuffer = Array(0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA);
		$buffer1 = array_fill(0, $rowwidth, 0); /* buffer rows sufficient to hold one row of pixel bitmap data */
		$buffer2 = array_fill(0, $rowwidth, 0);
		$x = 0;  /* horizontal offset into temporary row decoding buffer, ie. buffer1 */
		$y = $bounds['top']; /* vertical offset into output picture buffer */
		
		
		/* WOBA decode */
    
		/* working data:  */
		$operandata = array_fill(0, 256, 0);
    
    
		/* continue until end of this WOBA image data */
		$step = 0;
		while ($woba_offset < $woba_length)
		{
			//if ($step ==11) return;
		
			/* get next 'opcode' */
			//print '<strong>STEP '.$step.'</strong><br>';
			//$step++;
			
			$opcode = $woba[$bmap_offset];			
			$bmap_offset++; $woba_offset++;
		
			//print 'Y offset = '.($y * $rowwidth).'<br>';
			//print 'OP: '.strtoupper(str_pad(dechex($opcode), 2, ' ', STR_PAD_LEFT)).
			//	'  @ '.$bmap_offset. ' ';
		
		
			/* partial row decode - horizontal accumulation in temporary buffer: */
			if ( ($opcode & 0x80) == 0 )
			{
				/* zeros followed by data */
				prof_flag('WOBA: Zeros + Data');
				//print 'Zeros + Data<br>';
				$nd = $opcode >> 4;
				$nz = $opcode & 15;
				//print ' nd = '.$nd.'  nz = '.$nz.'<br>';
				if ($nd)
				{
					array_splice($operandata, 0, $nd, array_slice($woba, $bmap_offset, $nd));
					//WOBA::_memcpy($operandata, 0, $woba, $bmap_offset, $nd); /* @bmap_offset:nd;
					//										   				ie. inline data with instruction */
					$bmap_offset+=$nd; $woba_offset+=$nd;
				}
			
				while ($repeat)
				{
					for ($k=$nz; $k>0; $k--) /* make a block of zeros @x:nz */
					{
						$buffer1[$x]=0;
						$x++;
					}
				
					array_splice($buffer1, $x, $nd, array_slice($operandata, 0, $nd));
					//WOBA::_memcpy($buffer1, $x, $operandata, 0, $nd); /* @x:nd,
					//									             ie. zeros followed by data */
					$x+=$nd;
				
					$repeat--;
				}
				$repeat=1;
			
				prof_flag('End');
			}
			else if ( ($opcode & 0xE0) == 0xC0 )
			{
				/* opcode & 1F * 8 bytes of data */
				prof_flag('WOBA: x8 Data');
				
				$nd = ($opcode & 0x1F)*8;
				//print $nd.' (x8) of Data<br>';
				if ($nd)
				{
					array_splice($operandata, 0, $nd, array_slice($woba, $bmap_offset, $nd));
					//WOBA::_memcpy($operandata, 0, $woba, $bmap_offset, $nd); /* inline data */
					$bmap_offset+=$nd; $woba_offset+=$nd;
				}
			
				while ($repeat)
				{
					array_splice($buffer1, $x, $nd, array_slice($operandata, 0, $nd));
					//WOBA::_memcpy($buffer1, $x, $operandata, 0, $nd);
					$x+=$nd;
				
					$repeat--;
				}
				$repeat=1;
				
				prof_flag('End');
			}
			else if ( ($opcode & 0xE0) == 0xE0 )
			{
				/* opcode & 1F * 16 bytes of zero */
				prof_flag('WOBA: x16 Zeros');
				
				$nz = ($opcode & 0x1F)*16;
				//print $nz.' (x16) of Zero<br>';
			
				while ($repeat)
				{
					for ($k=$nz; $k>0; $k--) {
						$buffer1[$x]=0;
						$x++;
					}
				
					$repeat--;
				}
				$repeat=1;
				
				prof_flag('End');
			}
		
		
			if ( ($opcode & 0xE0) == 0xA0 )
			{
				/* repeat opcode */
				prof_flag('WOBA: Repeat');
				
				$repeat = ($opcode & 0x1F);
				//print 'Repeat '.$repeat.'<br>';
				
				prof_flag('End');
				continue;
			}
		
		
			switch ($opcode)
			{
				case 0x80:
					/* uncompressed data */
					prof_flag('WOBA: Uncompressed');
					//print 'Uncompressed<br>';
					
					$x=0;
				
					while ($repeat)
					{
						$p->memcopyin($woba, $bmap_offset, $bx8, $y, $rowwidth);
						$y++;
						
						$flag = false;
					
						$repeat--;
					}
					$repeat=1;
					$bmap_offset+=$rowwidth; $woba_offset+=$rowwidth;
					
					prof_flag('End');
					break;
				
				case 0x81:
					/* white row */
					prof_flag('WOBA: White');
					//print 'White Row<br>';
					$x=0;
				
					while ($repeat)
					{
						$p->memfill(0, $bx8, $y, $rowwidth);
						$y++;
					
						$repeat--;
					}
					$repeat=1;
					
					prof_flag('End');
					break;
				
				case 0x82:
					/* black row */
					prof_flag('WOBA: Black');
					//print 'Black Row<br>';
					$x=0;
				
					while ($repeat)
					{
						$p->memfill(0xFF, $bx8, $y, $rowwidth);
						$y++;
					
						$repeat--;
					}
					$repeat=1;
					
					prof_flag('End');
					break;
				
				case 0x83:
					/* pattern */
					prof_flag('WOBA: Pattern');
					
					//print 'Pattern<br>';
					$operand = $woba[$bmap_offset];
					$bmap_offset++; $woba_offset++;
				
					$x=0;
				
					while ($repeat)
					{
						$patternbuffer[$y & 7] = $operand;
						$p->memfill($operand, $bx8, $y, $rowwidth);
						$y++;
					
						$repeat--;
					}
					$repeat=1;
					
					prof_flag('End');
					break;
				
				case 0x84:
					/* last pattern */
					prof_flag('WOBA: Last Pattern');
					
					//print 'Last Pattern<br>';
					$x=0;
				
					while ($repeat)
					{
						$operand = $patternbuffer[$y & 7];
						$p->memfill($operand, $bx8, $y, $rowwidth);
						$y++;
					
						$repeat--;
					}
					$repeat=1;
					
					prof_flag('End');
					break;
				
				case 0x85:
					/* previous row */
					prof_flag('WOBA: Previous Row');
					//print 'Previous Row<br>';
					$x=0;
				
					while ($repeat)
					{
						$p->copyrow($y, $y-1);
						$y++;
					
						$repeat--;
					}
					$repeat=1;
					
					prof_flag('End');
					break;
				
				case 0x86:
					/* two rows back */
					prof_flag('WOBA: Previous -2 Row');
					
					//print 'Two Rows Back<br>';
					$x=0;
				
					while ($repeat)
					{
						$p->copyrow($y, $y-2);
						$y++;
					
						$repeat--;
					}
					$repeat=1;
					
					prof_flag('End');
					break;
				
				case 0x87:
					/* three rows back */
					prof_flag('WOBA: Previous -3 Row');
					//print 'Three Rows Back<br>';
					$x=0;
				
					while ($repeat)
					{
						$p->copyrow($y, $y-3);
						$y++;
					
						$repeat--;
					}
					$repeat=1;
					
					prof_flag('End');
					break;
				
				case 0x88:
					//print 'dx,dy = 16,0<br>';
					$dx = 16; $dy = 0;
					break;
				case 0x89:
					//print 'dx,dy = 0,0<br>';
					$dx = 0; $dy = 0;
					break;
				case 0x8A:
					//print 'dx,dy = 0,1<br>';
					$dx = 0; $dy = 1;
					break;
				case 0x8B:
					//print 'dx,dy = 0,2<br>';
					$dx = 0; $dy = 2;
					break;
				case 0x8C:
					//print 'dx,dy = 1,0<br>';
					$dx = 1; $dy = 0;
					break;
				case 0x8D:
					//print 'dx,dy = 1,1<br>';
					$dx = 1; $dy = 1;
					break;
				case 0x8E:
					//print 'dx,dy = 2,2<br>';
					$dx = 2; $dy = 2;
					break;
				case 0x8F:
					//print 'dx,dy = 8,0<br>';
					$dx = 8; $dy = 0;
					break;
				
				default:
					/* it's not a repeat or a whole row */
					if ($x >= $rowwidth)
					{
						prof_flag('WOBA: Finishing Partial');
						/* ie. a row has been gradually constructed in buffer1,
						 now that row needs to be output to the picture buffer */
						$x=0;
						//print 'Finish partial row<br>';
					
						if ($dx) /* if not zero */
						{
							$buffer2 = array_slice($buffer1, 0, $rowwidth);
							//array_splice($buffer2, 0, $rowwidth, array_slice($buffer1, 0, $rowwidth));
							//WOBA::_memcpy($buffer2, 0, $buffer1, 0, $rowwidth); /* make a copy of the completed row */
						
							for ($k = $rowwidth8/$dx; $k>0; $k--) /* repeat until end of row??? */
							{
								WOBA::_shiftnstr($buffer2, $rowwidth, $dx); /* shift copy right by dx bits??? */
							
								WOBA::_xornstr($buffer1, $buffer2, $rowwidth); /* temp row 1 XOR temp row 2;
																	  buffer1 := buffer1 ^ buffer2 for rowwidth bytes */
							}
						}
					
						if ($dy) /* if not zero */
						{
							$p->memcopyout($buffer2, $bx8, $y-$dy, $rowwidth);
							WOBA::_xornstr($buffer1, $buffer2, $rowwidth); /* temp row 1 XOR temp row 2;
																  buffer1 := buffer1 ^ buffer2 for rowwidth bytes */
						}
					
						$p->memcopyin($buffer1, 0, $bx8, $y, $rowwidth);
						$y++;
						
						
						prof_flag('End');
					}
					break;
			}
		}

		prof_flag("End");
	}
	
	
	// check function arguments, as some modified slightly *****
	
	
	private static function decode_header(&$bytes)
	{
		if (($bytes[4]!=ord('B')) || ($bytes[5]!=ord('M')) || ($bytes[6]!=ord('A')) || ($bytes[7]!=ord('P')))
			throw new Exception("WOBA: Not a BMAP resource.");
			
		$header = Array();
		$header['image_bounds'] = Array(
			'top' => $bytes[24] * 256 + $bytes[25],
			'left' => $bytes[26] * 256 + $bytes[27],
			'bottom' => $bytes[28] * 256 + $bytes[29],
			'right' => $bytes[30] * 256 + $bytes[31]
			);
		$header['mask_bounds'] = Array(
			'top' => $bytes[32] * 256 + $bytes[33],
			'left' => $bytes[34] * 256 + $bytes[35],
			'bottom' => $bytes[36] * 256 + $bytes[37],
			'right' => $bytes[38] * 256 + $bytes[39]
			);
		$header['picture_bounds'] = Array(
			'top' => $bytes[40] * 256 + $bytes[41],
			'left' => $bytes[42] * 256 + $bytes[43],
			'bottom' => $bytes[44] * 256 + $bytes[45],
			'right' => $bytes[46] * 256 + $bytes[47]
			);
			
		$header['mask_length'] = ((($bytes[56] * 256) + $bytes[57]) * 256 + $bytes[58]) * 256 + $bytes[59];
		$header['picture_length'] = ((($bytes[60] * 256) + $bytes[61]) * 256 + $bytes[62]) * 256 + $bytes[63];
		
		return $header;
	}
	
}



//phpinfo();
?>

WOBA decoder

<?php

//$v = 0x20;
//$v = $v >> 4;
//print dechex($v).'<br>';

error_reporting(E_ALL & ~E_NOTICE);


$filename = 'input.bmap';
$handle = fopen($filename, "rb");
$contents = fread($handle, filesize($filename));
fclose($handle);

WOBA::decode($contents);

prof_print();

?>