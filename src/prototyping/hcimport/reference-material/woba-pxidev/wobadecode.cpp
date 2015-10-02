#include <iostream>
#include <fstream>
#include "picture.h"
#include "woba.h"

int main (int argc, char * const argv[]) {
	char * fni;
	char * fno;
	char * fnmo;
	fstream fpi;
	picture p;
	char * buf;
	int fs;
    if (argc < 2) {
		std::cout << "Not enough parameters." << endl;
	} else {
		fni = argv[1];
		if (argc > 2) {
			fno = argv[2];
		} else {
			fno = new char[strlen(fni)+4];
			strcpy(fno, fni);
			strcat(fno,".pbm");
			fnmo = new char[strlen(fni)+9];
			strcpy(fnmo, fni);
			strcat(fnmo,"_mask.pbm");
		}
		fpi.open(fni, ios::binary|ios::in);
		
		fpi.seekg(0, ios::end);
		fs=fpi.tellg();
		fpi.seekg(0, ios::beg);
		
		buf = new char[fs];
		fpi.read(buf, fs);
		fpi.close();
		
		woba_decode(p, buf);
		p.writebitmaptopbm(fno);
		p.writemasktopbm(fnmo);
		
		delete [] buf;
	}
    return 0;
}
