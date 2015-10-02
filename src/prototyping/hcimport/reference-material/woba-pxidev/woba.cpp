/*

 WOBA Decoder for C++
 (c) 2005 Jonathan Bettencourt / Kreative Korporation

 This decodes the compressed bitmap format that HyperCard uses to store card images.
 The format is called WOBA, which stands for Wrath Of Bill Atkinson, because it was
 written by Bill Atkinson and we had a heck of a time figuring it out.


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

/* #include <iostream> */
#include "picture.h"
#include "woba.h"
using namespace std;

/* char * __hex(int x)
{
	char * hex = "0123456789ABCDEF";
	char h[] = "ab";
	h[0]=hex[(x/16)%16];
	h[1]=hex[x%16];
	return strdup(h);
} */

inline int __min(int x, int y)
{
	return (x>y)?y:x;
}

void xornstr(char * dest, char * src, int n)
{
	int i;
	for (i=0; i<n; i++) {
		dest[i] ^= src[i];
	}
}

void xorstr(char * dest, char * src)
{
	int n = __min(strlen(dest),strlen(src));
	xornstr(dest, src, n);
}

void shiftnstr(char * s, int n, int sh)
{
	int i;
	int p = 1;
	int x = 0;
	for (i=0; i<sh; i++) { p += p; }
	for (i=0; i<n; i++) {
		x += ((unsigned char)s[i] * 65536) / p;
		s[i] = x / 65536;
		x = (x % 65536) * 256;
	}
}

void shiftstr(char * s, int sh)
{
	int n = strlen(s);
	shiftnstr(s, n, sh);
}

void woba_decode(picture & p, char * woba)
{
	int tt, tl, tb, tr; /* total rectangle for whole picture */
	int mt, ml, mb, mr; /* mask bounding rect */
	int pt, pl, pb, pr; /* picture bounding rect */
	int mlen, plen; /* mask and picture data length */
	
	int bx, bx8, x, y;
	int rowwidth, rowwidth8, height;
	int dx = 0;
	int dy = 0;
	int repeat = 1;
	char patternbuffer[8];
	char * buffer1;
	char * buffer2;
	int i, j;
	
	int opcode;
	int operand;
	char operandata[256];
	int nz, nd;
	int k;
	
	/*
		0 - block size & type
		8 - block ID & filler
		16 - something
		24 - total rect
		32 - mask rect
		40 - picture rect
		48 - nothing
		56 - length
		64 - start of mask (or bitmap if mask length == 0)
	*/
	if (woba[4]=='B' && woba[5]=='M' && woba[6]=='A' && woba[7]=='P') {
		tt = (unsigned char)woba[24]*256+(unsigned char)woba[25];
		tl = (unsigned char)woba[26]*256+(unsigned char)woba[27];
		tb = (unsigned char)woba[28]*256+(unsigned char)woba[29];
		tr = (unsigned char)woba[30]*256+(unsigned char)woba[31];
		mt = (unsigned char)woba[32]*256+(unsigned char)woba[33];
		ml = (unsigned char)woba[34]*256+(unsigned char)woba[35];
		mb = (unsigned char)woba[36]*256+(unsigned char)woba[37];
		mr = (unsigned char)woba[38]*256+(unsigned char)woba[39];
		pt = (unsigned char)woba[40]*256+(unsigned char)woba[41];
		pl = (unsigned char)woba[42]*256+(unsigned char)woba[43];
		pb = (unsigned char)woba[44]*256+(unsigned char)woba[45];
		pr = (unsigned char)woba[46]*256+(unsigned char)woba[47];
		mlen = (((((unsigned char)woba[56]*256)+(unsigned char)woba[57])*256+(unsigned char)woba[58])*256+(unsigned char)woba[59]);
		plen = (((((unsigned char)woba[60]*256)+(unsigned char)woba[61])*256+(unsigned char)woba[62])*256+(unsigned char)woba[63]);
		
		/* std::cout<<"Total Rect: "<<tl<<","<<tt<<","<<tr<<","<<tb<<endl; */
		/* std::cout<<"Bitmap Rect: "<<pl<<","<<pt<<","<<pr<<","<<pb<<endl; */
		/* std::cout<<"Mask Rect: "<<ml<<","<<mt<<","<<mr<<","<<mb<<endl; */
		/* std::cout<<"Bitmap Size: "<<plen<<endl; */
		/* std::cout<<"Mask Size: "<<mlen<<endl; */
		p.reinit(tr-tl,tb-tt,1,false);
		p.__directcopybmptomask(); /* clear the mask to zero */
		i=64;
		
		/* decode mask */
		if (mlen) {
			bx8 = ml & (~ 0x1F);
			bx = bx8/8;
			x = 0;
			y = mt;
			rowwidth8 = ( (mr & 0x1F)?((mr | 0x1F)+1):mr ) - (ml & (~ 0x1F));
			rowwidth = rowwidth8/8;
			height = mb - mt;
			dx = dy = 0;
			repeat = 1;
			patternbuffer[0]=patternbuffer[2]=patternbuffer[4]=patternbuffer[6]=170;
			patternbuffer[1]=patternbuffer[3]=patternbuffer[5]=patternbuffer[7]=85;
			buffer1 = new char[rowwidth];
			buffer2 = new char[rowwidth];
			j=0;
			
			/* std::cout<<"DECODE MASK:"<<endl; */
			/* std::cout<<"BX8: "<<bx8<<endl<<"BX: "<<bx<<endl<<"X: "<<x<<endl<<"Y: "<<y<<endl; */
			/* std::cout<<"RW8: "<<rowwidth8<<endl<<"RW: "<<rowwidth<<endl<<"H: "<<height<<endl; */
			while (j<mlen) {
				opcode = (unsigned char)woba[i];
				/* std::cout<<"Opcode: "<<__hex(opcode)<<endl; */
				/* std::cout<<"Repeat: "<<repeat<<endl; */
				/* std::cout<<"i: "<<i<<endl<<"j: "<<j<<endl; */
				/* std::cout<<"x: "<<x<<endl<<"y: "<<y<<endl; */
				/* std::cout<<"dx: "<<dx<<endl<<"dy: "<<dy<<endl; */
				i++; j++;
				if ( (opcode & 0x80) == 0 ) {
					/* zeros followed by data */
					nd = opcode >> 4;
					nz = opcode & 15;
					/* std::cout<<"nd: "<<nd<<endl<<"nz: "<<nz<<endl; */
					if (nd) {
						memcpy(operandata, woba+i, nd);
						i+=nd; j+=nd;
					}
					while (repeat) {
						for (k=nz; k>0; k--) {
							buffer1[x]=0;
							x++;
						}
						memcpy(buffer1+x, operandata, nd);
						x+=nd;
						repeat--;
					}
					repeat=1;
				} else if ( (opcode & 0xE0) == 0xC0 ) {
					/* opcode & 1F * 8 bytes of data */
					nd = (opcode & 0x1F)*8;
					/* std::cout<<"nd: "<<nd<<endl; */
					if (nd) {
						memcpy(operandata, woba+i, nd);
						i+=nd; j+=nd;
					}
					while (repeat) {
						memcpy(buffer1+x, operandata, nd);
						x+=nd;
						repeat--;
					}
					repeat=1;
				} else if ( (opcode & 0xE0) == 0xE0 ) {
					/* opcode & 1F * 16 bytes of zero */
					nz = (opcode & 0x1F)*16;
					/* std::cout<<"nz: "<<nz<<endl; */
					while (repeat) {
						for (k=nz; k>0; k--) {
							buffer1[x]=0;
							x++;
						}
						repeat--;
					}
					repeat=1;
				}
				
				if ( (opcode & 0xE0) == 0xA0 ) {
					/* repeat opcode */
					repeat = (opcode & 0x1F);
				} else { switch (opcode) {
				case 0x80: /* uncompressed data */
					x=0;
					while (repeat) {
						p.maskmemcopyin(woba+i, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					i+=rowwidth; j+=rowwidth;
					break;
				case 0x81: /* white row */
					x=0;
					while (repeat) {
						p.maskmemfill(0, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x82: /* black row */
					x=0;
					while (repeat) {
						p.maskmemfill(0xFF, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x83: /* pattern */
					operand = (unsigned char)woba[i];
					/* std::cout<<"patt: "<<__hex(operand)<<endl; */
					i++; j++;
					x=0;
					while (repeat) {
						patternbuffer[y & 7] = operand;
						p.maskmemfill(operand, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x84: /* last pattern */
					x=0;
					while (repeat) {
						operand = patternbuffer[y & 7];
						/* std::cout<<"patt: "<<__hex(operand)<<endl; */
						p.maskmemfill(operand, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x85: /* previous row */
					x=0;
					while (repeat) {
						p.maskcopyrow(y, y-1);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x86: /* two rows back */
					x=0;
					while (repeat) {
						p.maskcopyrow(y, y-2);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x87: /* three rows back */
					x=0;
					while (repeat) {
						p.maskcopyrow(y, y-3);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x88:
					dx = 16; dy = 0;
					break;
				case 0x89:
					dx = 0; dy = 0;
					break;
				case 0x8A:
					dx = 0; dy = 1;
					break;
				case 0x8B:
					dx = 0; dy = 2;
					break;
				case 0x8C:
					dx = 1; dy = 0;
					break;
				case 0x8D:
					dx = 1; dy = 1;
					break;
				case 0x8E:
					dx = 2; dy = 2;
					break;
				case 0x8F:
					dx = 8; dy = 0;
					break;
				default: /* it's not a repeat or a whole row */
					if (x >= rowwidth) {
						x=0;
						if (dx) {
							memcpy(buffer2, buffer1, rowwidth);
							for (k = rowwidth8/dx; k>0; k--) {
								shiftnstr(buffer2, rowwidth, dx);
								xornstr(buffer1, buffer2, rowwidth);
							}
						}
						if (dy) {
							p.maskmemcopyout(buffer2, bx8, y-dy, rowwidth);
							xornstr(buffer1, buffer2, rowwidth);
						}
						p.maskmemcopyin(buffer1, bx8, y, rowwidth);
						y++;
					}
					break;
				}}
			}
			
			delete [] buffer1;
			delete [] buffer2;
		} else if (mt | ml | mb | mr) {
			/* mask is a simple rectangle */
			bx = ml/8;
			x = 0;
			rowwidth = (mr-ml)/8;
			buffer1 = new char[rowwidth];
			for (k=bx; x<rowwidth; k++, x++) {
				buffer1[k] = 0xFF;
			}
			for (k=mt; k<mb; k++) {
				p.maskmemcopyin(buffer1, 0, k, rowwidth);
			}
			delete [] buffer1;
		}
		
		/* decode bitmap */
		if (plen) {
			bx8 = pl & (~ 0x1F);
			bx = bx8/8;
			x = 0;
			y = pt;
			rowwidth8 = ( (pr & 0x1F)?((pr | 0x1F)+1):pr ) - (pl & (~ 0x1F));
			rowwidth = rowwidth8/8;
			height = pb - pt;
			dx = dy = 0;
			repeat = 1;
			patternbuffer[0]=patternbuffer[2]=patternbuffer[4]=patternbuffer[6]=170;
			patternbuffer[1]=patternbuffer[3]=patternbuffer[5]=patternbuffer[7]=85;
			buffer1 = new char[rowwidth];
			buffer2 = new char[rowwidth];
			j=0;
			
			/* std::cout<<"DECODE BITMAP:"<<endl; */
			/* std::cout<<"BX8: "<<bx8<<endl<<"BX: "<<bx<<endl<<"X: "<<x<<endl<<"Y: "<<y<<endl; */
			/* std::cout<<"RW8: "<<rowwidth8<<endl<<"RW: "<<rowwidth<<endl<<"H: "<<height<<endl; */
			while (j<plen) {
				opcode = (unsigned char)woba[i];
				/* std::cout<<"Opcode: "<<__hex(opcode)<<endl; */
				/* std::cout<<"Repeat: "<<repeat<<endl; */
				/* std::cout<<"i: "<<i<<endl<<"j: "<<j<<endl; */
				/* std::cout<<"x: "<<x<<endl<<"y: "<<y<<endl; */
				/* std::cout<<"dx: "<<dx<<endl<<"dy: "<<dy<<endl; */
				i++; j++;
				if ( (opcode & 0x80) == 0 ) {
					/* zeros followed by data */
					nd = opcode >> 4;
					nz = opcode & 15;
					/* std::cout<<"nd: "<<nd<<endl<<"nz: "<<nz<<endl; */
					if (nd) {
						memcpy(operandata, woba+i, nd);
						i+=nd; j+=nd;
					}
					while (repeat) {
						for (k=nz; k>0; k--) {
							buffer1[x]=0;
							x++;
						}
						memcpy(buffer1+x, operandata, nd);
						x+=nd;
						repeat--;
					}
					repeat=1;
				} else if ( (opcode & 0xE0) == 0xC0 ) {
					/* opcode & 1F * 8 bytes of data */
					nd = (opcode & 0x1F)*8;
					/* std::cout<<"nd: "<<nd<<endl; */
					if (nd) {
						memcpy(operandata, woba+i, nd);
						i+=nd; j+=nd;
					}
					while (repeat) {
						memcpy(buffer1+x, operandata, nd);
						x+=nd;
						repeat--;
					}
					repeat=1;
				} else if ( (opcode & 0xE0) == 0xE0 ) {
					/* opcode & 1F * 16 bytes of zero */
					nz = (opcode & 0x1F)*16;
					/* std::cout<<"nz: "<<nz<<endl; */
					while (repeat) {
						for (k=nz; k>0; k--) {
							buffer1[x]=0;
							x++;
						}
						repeat--;
					}
					repeat=1;
				}
				
				if ( (opcode & 0xE0) == 0xA0 ) {
					/* repeat opcode */
					repeat = (opcode & 0x1F);
				} else { switch (opcode) {
				case 0x80: /* uncompressed data */
					x=0;
					while (repeat) {
						p.memcopyin(woba+i, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					i+=rowwidth; j+=rowwidth;
					break;
				case 0x81: /* white row */
					x=0;
					while (repeat) {
						p.memfill(0, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x82: /* black row */
					x=0;
					while (repeat) {
						p.memfill(0xFF, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x83: /* pattern */
					operand = (unsigned char)woba[i];
					/* std::cout<<"patt: "<<__hex(operand)<<endl; */
					i++; j++;
					x=0;
					while (repeat) {
						patternbuffer[y & 7] = operand;
						p.memfill(operand, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x84: /* last pattern */
					x=0;
					while (repeat) {
						operand = patternbuffer[y & 7];
						/* std::cout<<"patt: "<<__hex(operand)<<endl; */
						p.memfill(operand, bx8, y, rowwidth);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x85: /* previous row */
					x=0;
					while (repeat) {
						p.copyrow(y, y-1);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x86: /* two rows back */
					x=0;
					while (repeat) {
						p.copyrow(y, y-2);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x87: /* three rows back */
					x=0;
					while (repeat) {
						p.copyrow(y, y-3);
						y++;
						repeat--;
					}
					repeat=1;
					break;
				case 0x88:
					dx = 16; dy = 0;
					break;
				case 0x89:
					dx = 0; dy = 0;
					break;
				case 0x8A:
					dx = 0; dy = 1;
					break;
				case 0x8B:
					dx = 0; dy = 2;
					break;
				case 0x8C:
					dx = 1; dy = 0;
					break;
				case 0x8D:
					dx = 1; dy = 1;
					break;
				case 0x8E:
					dx = 2; dy = 2;
					break;
				case 0x8F:
					dx = 8; dy = 0;
					break;
				default: /* it's not a repeat or a whole row */
					if (x >= rowwidth) {
						x=0;
						if (dx) {
							memcpy(buffer2, buffer1, rowwidth);
							for (k = rowwidth8/dx; k>0; k--) {
								shiftnstr(buffer2, rowwidth, dx);
								xornstr(buffer1, buffer2, rowwidth);
							}
						}
						if (dy) {
							p.memcopyout(buffer2, bx8, y-dy, rowwidth);
							xornstr(buffer1, buffer2, rowwidth);
						}
						p.memcopyin(buffer1, bx8, y, rowwidth);
						y++;
					}
					break;
				}}
			}
			
			delete [] buffer1;
			delete [] buffer2;
		}
		
		if (! (mlen | mt | ml | mb | mr)) {
			/* mask needs to be copied from picture */
			p.__directcopybmptomask();
		}
	}
}
