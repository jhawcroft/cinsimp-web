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

Xtalk.VM.Message = function(in_name, in_is_function, in_params, in_builtin, is_plugin)
{
	this.name = in_name;
	this.type = (in_is_function ? 
			Xtalk.Script.HANDLER_FUNCTION : 
			Xtalk.Script.HANDLER_COMMAND);
	this.params = in_params;
	this.builtin = in_builtin;
	this.is_plugin = is_plugin;
};
var Message = Xtalk.VM.Message;


Message.prototype.decode_params = function(in_param_map)
{
	
}







Xtalk.VM.TVariableRef = function(in_name)
{
	this.type = 'VariableRef';
	this.name = in_name;
};
var TVariableRef = Xtalk.VM.TVariableRef;


TVariableRef.prototype.get_type = function() { return this.type; }



// **TODO want to replace this & toText() with a more appropriate, read_content().
Xtalk.VM.TVariableRef.prototype.is_readable = function() { return true; }


TVariableRef.prototype.resolve = function()
{
	return Xtalk.VM._variable_read(this.name);
}


TVariableRef.prototype.write_content = function(in_content, in_mode, in_range)
{
	Xtalk.VM._variable_write(this.name, in_content, in_mode, in_range);
	//alert('write variable! mode='+in_mode);
}



/*
Xtalk.VM.TVariableRef.prototype.toText = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}


Xtalk.VM.TVariableRef.prototype.toInteger = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}


Xtalk.VM.TVariableRef.prototype.toString = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}


Xtalk.VM.TVariableRef.prototype.toBoolean = function()
{
	return this.toValue()
}*/

/*
Xtalk.VM.TVariableRef.prototype.toValue = function()
{
	return null;  /// DO THE ACTUAL VARIABLE READ HERE
}
*/





Xtalk.VM.TNothing = function()
{
	this.type = 'Nothing'
};


Xtalk.VM.TNothing.prototype.get_type = function() { return this.type; }


Xtalk.VM.TNothing.prototype.resolve = function()
{
	return this;
}


Xtalk.VM.TNothing.prototype.toText = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}


Xtalk.VM.TNothing.prototype.toInteger = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}


Xtalk.VM.TNothing.prototype.toNumber = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}


Xtalk.VM.TNothing.prototype.toString = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}


Xtalk.VM.TNothing.prototype.toBoolean = function()
{
	throw new Error(""); // ** TO FIX for type mismatch error
}

Xtalk.VM.TNothing.prototype.toValue = function()
{
	return null;
}




Xtalk.VM.TString = function(in_string) 
{
	this._value = in_string + '';
	this.type = 'String';
};


Xtalk.VM.TString.prototype.get_type = function() { return this.type; }

Xtalk.VM.TString.prototype.is_readable = function() { return true; }


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


Xtalk.VM.TString.prototype.toNumber = function()
{
	if (this._value.indexOf('.') < 0) return this.toInteger();
	else return this.toReal();
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


Xtalk.VM.TInteger.prototype.get_type = function() { return this.type; }

Xtalk.VM.TInteger.prototype.is_readable = function() { return true; }


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


Xtalk.VM.TInteger.prototype.toNumber = function()
{
	return this;
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


Xtalk.VM.TReal.prototype.get_type = function() { return this.type; }

Xtalk.VM.TReal.prototype.is_readable = function() { return true; }


Xtalk.VM.TReal.prototype.resolve = function()
{
	return this;
}


Xtalk.VM.TReal.prototype.toText = function()
{
	return this.toString()._value;
}


Xtalk.VM.TReal.prototype.toInteger = function()
{
	return new Xtalk.VM.TInteger(Math.floor(this._value));
}


Xtalk.VM.TReal.prototype.toNumber = function()
{
	return this;
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


Xtalk.VM.TBoolean.prototype.get_type = function() { return this.type; }

Xtalk.VM.TBoolean.prototype.is_readable = function() { return true; }


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




Xtalk.VM.LayerObjectRef = function(in_owner_type, in_obj_type, in_ref, in_context)
{
	this.owner_type = in_owner_type;
	this.obj_type = in_obj_type;
	this.ref = in_ref;
	this.card = null;
	this.bkgnd = null;
	this.obj = null;
	this.obj_id = 0;
	
	if (in_context === null || in_context.get_type() == 'Nothing')
	{
		// no context => provide current card and current bkgnd if the object is a bkgnd object
		this.card = View.current.get_card();
		this.bkgnd = View.current.get_bkgnd();
	}
	else if (in_context.get_type() == 'card')
	{
		// context is card => provide card and bkgnd if the object is a bkgnd object 
		// (will require second stage due to asyncronous load)
		this.card = context;
		
		// probably return the thing incomplete, but with a process underway to complete it
		// and telling VM to wait until unwait() called by that process
		// process could be wrapped by the adapter itself, ie. adapter.load_bkgnd() could encapsulate all calls
		if (in_owner_type == 'bg') this._load_bkgnd();		
	}
	else
	{
		// context is bkgnd => provide only bkgnd
		this.bkgnd = context;
	}
}


Xtalk.VM.LayerObjectRef.prototype._load_bkgnd = function()
{
	// must asyncrononously load bkgnd for card
	// call vm.wait() at beginning
	// have completion call vm.unwait() once loaded
}


Xtalk.VM.LayerObjectRef.prototype.resolve_object = function()
{
	// can't fully resolve, that must be done based on the type of property being accessed...
	// at least figure out the ID if we don't have one
	if (this.obj) return;
	if (typeof this.ref != 'number')
	{
		if (this.ref.substr(0, 1) == '#')
			this.obj = ( this.owner_type == 'card' ? 
				this.card.get_child_by_number(this.ref.substr(1), this.obj_type) : 
				this.bkgnd.get_child_by_number(this.ref.substr(1), this.obj_type) );
		else
			this.obj = ( this.owner_type == 'card' ? 
				this.card.get_child_by_name(this.ref, this.obj_type) : 
				this.bkgnd.get_child_by_name(this.ref, this.obj_type) );
	}
	else
		this.obj = ( this.owner_type == 'card' ? 
			this.card.get_child_by_id(this.ref, this.obj_type) : 
			this.bkgnd.get_child_by_id(this.ref, this.obj_type) );
	this.obj_id = this.obj.get_attr('id');
}


Xtalk.VM.LayerObjectRef.prototype.get_attr = function(in_attr, in_fmt)
{
	this.resolve_object();
	return this.obj.get_attr(in_attr, in_fmt, this.card);
}


Xtalk.VM.LayerObjectRef.prototype.toValue = function()
{
	this.resolve_object();
	return this.obj;
}


Xtalk.VM.LayerObjectRef.prototype.set_attr = function(in_attr, in_new_value)
{
	this.resolve_object();
	return this.obj.set_attr(in_attr, in_new_value, this.card);
}


Xtalk.VM.LayerObjectRef.prototype.get_type = function()
{
	return 'LayerObjectRef';
}


Xtalk.VM.LayerObjectRef.prototype.resolve = function()
{
	this.resolve_object();
	return this.toText();
}


Xtalk.VM.LayerObjectRef.prototype.is_readable = function() { return true; }

Xtalk.VM.LayerObjectRef.prototype.toText = function()
{
	this.resolve_object();
	return new Xtalk.VM.TString( this.obj.get_attr('content', 'xt', this.card) );
}


Xtalk.VM.LayerObjectRef.prototype.toString = function()
{
	return this.toText();
}


Xtalk.VM.LayerObjectRef.prototype.write_content = function(in_content, in_mode, in_range)
{
	this.resolve_object();
	this.obj.set_attr('content', in_content.resolve().toString().toValue(), this.card); 
	// **TODO, will need a more capable method (range, etc.)
}




CinsImp._script_loaded('xtalk-vm-type');