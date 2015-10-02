#include <iostream>
#include <fstream>
#include <cstring>
using namespace std;

char upper(char c) {
	return (c>0x60 && c<0x7B)?(c-32):c;
}

int lasc(char * b) {
	return (((((unsigned char)b[0]*256)+(unsigned char)b[1])*256+(unsigned char)b[2])*256+(unsigned char)b[3]);
}

int main (int argc, char * const argv[]) {
    char blocksize[4];
	char * buf;
	char * stakname;
	char outname[64];
	unsigned long int wantedblock = 0;
	unsigned long int wantedid = 0;
	unsigned long int bloksize;
	fstream stak;
	fstream out;
	if (argc<2) {
		std::cout << "Usage: hcextract stackname [blocktype [id]]" << endl;
		return 0;
	}
	stakname = argv[1];
	if (argc>2) {
		if (!strcmp(argv[2],"toc")) {
			stak.open(stakname, ios::binary|ios::in);
			while (!stak.eof()) {
				stak.read(blocksize,4);
				bloksize = lasc(blocksize);
				buf = new char[bloksize];
				memcpy(buf, blocksize, 4);
				stak.read(buf+4, bloksize-4);
				memcpy(outname, buf+4, 4);
				outname[4]=' ';
				outname[5]='#';
				snprintf(outname+6, 12, "%d", lasc(buf+8));
				std::cout << outname << endl;
				delete [] buf;
			}
			stak.close();
			return 0;
		}
		buf=argv[2];
		if (strlen(buf) != 4) {
			std::cout << "Invalid block type " << buf << endl;
			return 0;
		}
		wantedblock=((((upper(buf[0])*256)+upper(buf[1]))*256+upper(buf[2]))*256+upper(buf[3]));
	}
	if (argc>3) {
		wantedid = atoi(argv[3]);
	}
	stak.open(stakname, ios::binary|ios::in);
	while (!stak.eof()) {
		stak.read(blocksize,4);
		bloksize = lasc(blocksize);
		buf = new char[bloksize];
		memcpy(buf, blocksize, 4);
		stak.read(buf+4, bloksize-4);
		if ( ((!wantedblock) || (wantedblock == lasc(buf+4))) && ((!wantedid) || (wantedid == lasc(buf+8))) ) {
			memcpy(outname, buf+4, 4);
			outname[4]=' ';
			outname[5]='#';
			snprintf(outname+6, 12, "%d", lasc(buf+8));
			out.open(outname, ios::binary|ios::out);
			out.write(buf, bloksize);
			out.close();
		}
		delete [] buf;
	}
	stak.close();
    return 0;
}
