/*
CinsImp
CinsTalk Virtual Machine Types

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

/*

Synopsis
--------
The virtual machine (VM) will use various Javascript object types to encapsulate the 
full variety of potential internal data types in CinsTalk.

Although native Javascript types could be used, the author felt the necessary type 
checking and identification was less than ideal and it doesn't buy much simplicity because
all operands must always be checked, converted and possibly resolved (as is the case
for references, property accesses, etc.)


Dependencies
------------

xtalk.js

*/

Xtalk.VM.TString = function(in_string) 
{
	this._value = in_string + '';
	this.type = 'String';
};


Xtalk.VM.TString.prototype.contains = function(in_string)
{
	in_string = Xtalk._escape_regex(in_string._value);
	return this._value.search(new RegExp(in_string, 'i')) >= 0;
}


Xtalk.VM.TString.prototype.resolve = function()
{
	return this;
}


Xtalk.VM.TString.prototype.toText = function()
{
	return this._value;
}


Xtalk.VM.TString.prototype.toValue = function()
{
	return this._value;
}


Xtalk.VM.TString.prototype.toInteger = function()
{
	return new Xtalk.VM.TInteger(Math.floor(this._value));
}


Xtalk.VM.TString.prototype.toReal = function()
{
	return new Xtalk.VM.TReal(this._value + 0.0);
}


Xtalk.VM.TString.prototype.toString = function()
{
	return this;
}


Xtalk.VM.TString.prototype.toBoolean = function()
{
	var v = this._value.toLowerCase();
	if (v == 'true') return new Xtalk.VM.TBoolean(true);
	return new Xtalk.VM.TBoolean(false);
}




Xtalk.VM.TInteger = function(in_integer)
{
	this._value = Math.floor(in_integer);
	this.type = 'Integer';
}


Xtalk.VM.TInteger.prototype.resolve = function()
{
	return this;
}


Xtalk.VM.TInteger.prototype.toText = function()
{
	return this.toString()._value;
}


Xtalk.VM.TInteger.prototype.toReal = function()
{
	return new Xtalk.VM.TReal(this._value + 0.0);
}


Xtalk.VM.TInteger.prototype.toString = function()
{
	return new Xtalk.VM.TString(this._value);  // todo *** number format observance
}


Xtalk.VM.TInteger.prototype.toBoolean = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}

Xtalk.VM.TInteger.prototype.toValue = function()
{
	return this._value;
}




Xtalk.VM.TReal = function(in_real)
{
	this._value = in_real;
	this.type = 'Real';
}


Xtalk.VM.TReal.prototype.resolve = function()
{
	return this;
}


Xtalk.VM.TReal.prototype.toText = function()
{
	return this.toString()._value;
}


Xtalk.VM.TInteger.prototype.toInteger = function()
{
	return new Xtalk.VM.TInteger(Math.floor(this._value));
}


Xtalk.VM.TReal.prototype.toString = function()
{
	return new Xtalk.VM.TString(this._value);  // todo *** number format observance
}


Xtalk.VM.TReal.prototype.toBoolean = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}

Xtalk.VM.TReal.prototype.toValue = function()
{
	return this._value;
}





Xtalk.VM.TBoolean = function(in_bool)
{
	this._value = in_bool;
	this.type = 'Boolean';
}


Xtalk.VM.TBoolean.prototype.resolve = function()
{
	return this;
}


Xtalk.VM.TBoolean.prototype.toText = function()
{
	return (this._value ? 'true' : 'false');
}


Xtalk.VM.TBoolean.prototype.toString = function()
{
	return new Xtalk.VM.TString(this.toText());
}


Xtalk.VM.TBoolean.prototype.toBoolean = function()
{
	return this;
}


Xtalk.VM.TBoolean.prototype.toValue = function()
{
	return this._value;
}



