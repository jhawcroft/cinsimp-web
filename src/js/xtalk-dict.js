/*
CinsImp
xTalk Compiler Dictionary

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


Xtalk.Dict = {

/*****************************************************************************************
Constants
*/
	
	/* two types of constant: */
	_TERM: 1,		/* a term is read-only, but may evaluate to different values depending
					   on when and where it is used */
	_CONSTANT: 2,   /* a constant always has the same value */


/*****************************************************************************************
Module Globals 
*/

	_constants: [],
	_properties: [],
	_references: [],
	_counts: [],

	/* Commands:
	
	   Two levels of access:
		 _commands[ <first word> ][n] := <definition>, where n is the definition index.
	   
	   Command definitions consist of:
	   -	pattern (a tree produced by the parse-bnf module which describes the syntax)
	   -	parameters (an array of named arguments in the order they will be presented
	   		to the handling function)
	   -    delayed (an array of boolean flags indicating whether the corresponding 
	   		argument value should be evaluated to a primitive type, or left as a 
	   		reference type for further processing)
	   -	handler (a function to implement the command behaviour and to which the
	   		arguments will be provided)
	*/
	_commands: [], 
	
	_loading_plugins: false,


/*****************************************************************************************
Registration 
*/

/*
	Registers a named read-only term handler.
 */
	register_term: function(in_name, in_id, in_handler)
	{
		var word_count = Xtalk._word_count(in_name);
		if (!this._constants[word_count])
			this._constants[word_count] = [];
		this._constants[word_count][in_name.toLowerCase()] = {
			type: 		this._TERM,
			id:			in_id,
			handler: 	in_handler
		};
	},


/*
	Registers a named constant value.
 */
	register_constant: function(in_name, in_value)
	{
		var word_count = Xtalk._word_count(in_name);
		if (!this._constants[word_count])
			this._constants[word_count] = [];
			
		this._constants[word_count][in_name.toLowerCase()] = {
			type: 		this._CONSTANT,
			value: 		in_value
		};
	},


/*
	Registers property handlers for a specific parent object context.
 */
	register_property: function(in_name, in_id, in_variant, in_context_type, in_getter, in_setter)
	{
		var in_name = in_name.toLowerCase();
		var word_count = Xtalk._word_count(in_name);
		
		if (!this._properties[word_count])
			this._properties[word_count] = [];
		var phrase_table = this._properties[word_count];
		
		if (!phrase_table[in_name])
			phrase_table[in_name] = {};
		var context_type_map = phrase_table[in_name];
		
		context_type_map[in_context_type] = {
			param:		in_id,
			variant:	in_variant,
			handler:	in_getter,
			setter:		(in_setter ? in_setter : null)
		};
	},


/*
	Registers a object reference handlers for a specific parent object context.
 */
	register_reference: function(in_name, in_id, in_context_type, in_handler)
	{
		var in_name = in_name.toLowerCase();
		var word_count = Xtalk._word_count(in_name);
		
		if (!this._references[word_count])
			this._references[word_count] = [];
		var phrase_table = this._references[word_count];
		
		if (!phrase_table[in_name])
			phrase_table[in_name] = {};
		var context_type_map = phrase_table[in_name];
		
		context_type_map[in_context_type] = {
			param:		in_id,
			handler:	in_handler
		};
	},


/*
	Registers an object counter for a specific parent object context.
 */
	register_count: function(in_name, in_id, in_context_type, in_handler)
	{
		var in_name = in_name.toLowerCase();
		var word_count = Xtalk._word_count(in_name);
		
		if (!this._counts[word_count])
			this._counts[word_count] = [];
		var phrase_table = this._counts[word_count];
		
		if (!phrase_table[in_name])
			phrase_table[in_name] = {};
		var context_type_map = phrase_table[in_name];
		
		context_type_map[in_context_type] = {
			param:		in_id,
			handler:	in_handler
		};
	},
	

/*
	Registers a command syntax, argument sequence, argument evaluation and handler.
 */
	register_command_syntax: function(in_syntax, in_arguments, in_handler)
	{
		var me = Xtalk.Dict; /* because this function may be invoked from a plugin */
		
		in_syntax = in_syntax.toLowerCase();
		var first_word = in_syntax.split(' ', 1)[0].trim().toLowerCase();
		
		var args = in_arguments.split(',');
		var delayed = [];
		for (var a = 0; a < args.length; a++)
		{
			var arg_name = args[a].trim().toLowerCase();
			if (arg_name.substr(0, 1) == '|' &&
				arg_name.substr(arg_name.length-1, 1) == '|')
			{
				arg_name = arg_name.replace('|','').trim();
				delayed.push(true);
			}
			else
				delayed.push(false);
			args[a] = arg_name;
		}
		
		var def = {
			pattern: Xtalk.Parser.BNF.parse(in_syntax),
			parameters: args,
			delayed: delayed,
			handler: in_handler,
			is_plugin: this._loading_plugins
		};
		
		if (me._commands['|'+first_word] === undefined)
			me._commands['|'+first_word] = [];
		me._commands['|'+first_word].push( def );
	},


/*****************************************************************************************
Language Built-in Initalization
*/

	init_builtins: function()
	{
/*
	Command syntax
 */
		this.register_command_syntax(
			'beep <number> [time | times]', 
			'number', 
			function(n) { alert('BEEP! ' + JSON.stringify(n)); }
		);
		
		
		
		this.register_command_syntax(
			'sort [[the] cards] [`dir``asc`ascending|`des`descending] by <sortKey>', 
			'dir,sortKey', 
			function(n) { alert('SORT! ' + JSON.stringify(n)); }
		);
		
		this.register_command_syntax(
			'find [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] <text> [in <field>]', 
			'mode,text,field', 
			function(n) { alert('FIND! ' + JSON.stringify(n)); }
		);
		
		
		this.register_command_syntax(
			'answer <prompt> [with <button1> [or <button2> [or <button3>]]]',
			'prompt,button1,button2,button3',
			Xtalk.Builtins.command_answer
		);
		
		this.register_command_syntax(
			'ask [`password``1`password] <prompt> [with <response>]', 
			'password,prompt,response', 
			function(n) { alert('ASK PASSWORD! ' + JSON.stringify(n)); }
		);
		
		
		this.register_command_syntax(
			'visual [effect] {`effect``cut`cut|`dissolve`dissolve|`wipe-left`wipe left|`wipe-right`wipe right|`slide-left`slide left|`slide-right`slide right} [`speed``very-slow`very slowly|`very-slow`very slow|`slow`slowly|`slow`slow|`normal`normal|`very-fast`very fast|`fast`fast] [to {`dest``card`card|`black`black|`white`white|`gray`gray|`gray`grey}]',
			'effect,speed,dest',
			Xtalk.Builtins.command_visual
		);
		
		
		this.register_command_syntax(
			'go [to] [the] {`which``#next`next|`#prev`prev|`#prev`previous|`#1`first|`#2`second|`#3`third|`#4`fourth|`#5`fifth|`#6`sixth|`#7`seventh|`#8`eighth|`#9`ninth|`#10`tenth|`#middle`middle|`#last`last|`#any`any} [[`marked``true`marked] card]',
        	'which,marked',
        	Xtalk.Builtins.command_go_which
        );
        this.register_command_syntax(
			'go [to] <where>',
        	'where',
        	Xtalk.Builtins.command_go_where
        );
	
	
		this.register_command_syntax(
			'set [the] <prop> [of <object>] to <value>',
        	'prop,object,value',
        	Xtalk.Builtins.command_set
        );
        
        this.register_command_syntax(
			'get <value>',
        	'value',
        	Xtalk.Builtins.command_get
        );
        
        this.register_command_syntax(
			'put <value> [{`mode``into`into|`after`after|`before`before} <dest>]',
        	'value,mode,dest',
        	Xtalk.Builtins.command_put
        );
        


/*
	Generic constants and terms
 */
    	this.register_term('me', 'me  ', Xtalk.Builtins.term_me);
    	this.register_term('target', 'tgtC', Xtalk.Builtins.term_target_container);
    	this.register_property('target', 'tgtN', 'norm', '----', Xtalk.Builtins.term_target_name);
    	
    	this.register_constant('pi', Math.PI);
    	this.register_constant('zero', 0);
		this.register_constant('one', 1);
		this.register_constant('two', 2);
		this.register_constant('three', 3);
		this.register_constant('four', 4);
		this.register_constant('five', 5);
		this.register_constant('six', 6);
		this.register_constant('seven', 7);
		this.register_constant('eight', 8);
		this.register_constant('nine', 9);
		this.register_constant('ten', 10);
		
		this.register_constant('true', true);
		this.register_constant('false', false);
		
		this.register_constant('empty', '');
		this.register_constant('space', ' ');
		this.register_constant('colon', ':');
		this.register_constant('comma', ',');
		this.register_constant('tab', '\t');
		this.register_constant('quote', '"');
		this.register_constant('newline', '\n');
		this.register_constant('return', '\r');

/*
	Generic properties
 */
 
		this.register_property('date', 'date', 'shrt', '----', Xtalk.Builtins.the_date);
		this.register_property('short date', 'date', 'shrt', '----', Xtalk.Builtins.the_date);
		this.register_property('abbr date', 'date', 'abbr', '----', Xtalk.Builtins.the_date);
		this.register_property('abbrev date', 'date', 'abbr', '----', Xtalk.Builtins.the_date);
		this.register_property('abbreviated date', 'date', 'abbr', '----', Xtalk.Builtins.the_date);
		this.register_property('long date', 'date', 'long', '----', Xtalk.Builtins.the_date);
		
		this.register_property('itemDelimiter', 'idel', null, '----', 
			Xtalk.Builtins.the_item_delimiter_get, Xtalk.Builtins.the_item_delimiter_set
		);
		
/*
	Chunk expressions
 */
		this.register_reference('char', 'char', 'String', Xtalk.Builtins.new_chunk);
		this.register_reference('character', 'char', 'String', Xtalk.Builtins.new_chunk);
		this.register_reference('word', 'word', 'String', Xtalk.Builtins.new_chunk);
		this.register_reference('item', 'item', 'String', Xtalk.Builtins.new_chunk);
		this.register_reference('line', 'line', 'String', Xtalk.Builtins.new_chunk);
		
		this.register_count('chars', 'chars', 'String', Xtalk.Builtins.count_chunks); // **TODO VM will need to auto-coerce types and try a few
		this.register_count('characters', 'chars', 'String', Xtalk.Builtins.count_chunks);
		this.register_count('words', 'words', 'String', Xtalk.Builtins.count_chunks);
		this.register_count('items', 'items', 'String', Xtalk.Builtins.count_chunks);
		this.register_count('lines', 'lines', 'String', Xtalk.Builtins.count_chunks);
		
	
/*
	Environment constants and terms
 */
		this.register_term('this cd', 'card', Xtalk.Builtins.term_this);
    	this.register_term('this card', 'card', Xtalk.Builtins.term_this);
    	this.register_term('this bg', 'bkgd', Xtalk.Builtins.term_this);
    	this.register_term('this bkgnd', 'bkgd', Xtalk.Builtins.term_this);
    	this.register_term('this background', 'bkgd', Xtalk.Builtins.term_this);
    	this.register_term('this stack', 'stak', Xtalk.Builtins.term_this);
    	
/*
	Environment counts
 */
		this.register_count('cards', 'cdct', '----', Xtalk.Builtins.count_cards);
		this.register_count('cards', 'cdct', Stack.TYPE, Xtalk.Builtins.count_cards);
		this.register_count('cards', 'cdct', Bkgnd.TYPE, Xtalk.Builtins.count_cards);
		
		
   
		
		/*
		register_term(<words>, <param>, <handler>)
			handler(<param>)
			
		register_constant(<words>, <value>)
			(may be Javascript or any other object type)
		
		register_property(<words>, <param>, <variant>, <context-type>, <handler>)
			mapping of words and handler for a specific data type of the context, or ---- for global
			handler(<context>, <param>, <variant>)
			
		register_count(<words>, <param>, <context-type>, <handler>)
			(as with property)
		
		register_reference(<words>, <param>, <context-type>, <handler>)
			handler(<context>, <param>, <mode>, <ident1>, <ident2>)
			mode := { REF_NAME, REF_ID, or REF_RANGE }  & ident2 may be null.
		
		*/
		
	/// testing
		
		this.register_reference('card button', 'cdbn', '----', 
		function(in_context, in_param, in_mode, in_ident1, in_ident2) { 
			alert('Card Button '+in_mode +'|'+in_ident1+'|'+in_ident2);
		});
		
		
	}

};



/*

Desktop prototype syntax definitions:

{"beep [<times> [times]]","times", (XTECommandImp)&_cmd_beep},
    
    {"find [`mode``b`normal|`c`chars|`c`characters|`w`word|`w`words|`s`string|`p`whole] "
        "<text> [in <field>]","text,mode,field", (XTECommandImp)&_cmd_find},
    
    {"sort [[the] cards] of <bkgnd> [`dir``asc`ascending|`des`descending] by <sortKey>",
        "sortKey<,dir,bkgnd", (XTECommandImp)&_cmd_sort},
    {"sort [[the] cards] [`dir``asc`ascending|`des`descending] by <sortKey>",
        "sortKey<,dir", (XTECommandImp)&_cmd_sort},
    {"sort <bkgnd> [`dir``asc`ascending|`des`descending] by <sortKey>",
        "sortKey<,dir,bkgnd", (XTECommandImp)&_cmd_sort},
    
    {"visual [effect] {`effect``0`cut|`1`dissolve|`2`wipe left|`3`wipe right|`4`wipe up|`5`wipe down} "
        "[`speed``-2`very slowly|`-2`very slow|`-1`slowly|`-1`slow|`0`normal|`2`very fast|`1`fast] "
        "[to {`dest``0`card|`1`black|`2`white|`3`grey|`3`gray}]",
        "effect,speed,dest",
        (XTECommandImp)&_cmd_visual},
    
    // must use this to capture cases where [card] is missing on the end, and prev & next which aren't
     handled via ordinal referencing //
    //"go [to] {`which``-2`next|`-1`prev|`-1`previous|`1`first|`2`second|`3`third|`4`forth|`5`fifth|"
    //"`6`sixth|`7`seventh|`8`eighth|`9`ninth|`10`tenth|`-3`middle|`-4`any|`-5`last} [[`marked``1`marked] card]
    // "ANY" is missing from this syntax, because in 1.0 we can't be bothered with the machinery that
    // would be require to make this work; for starters, the go command would have to be implemented
    // more on the thread side of things, to make use of the xtalk engine to resolve the random() need
    // all this really means is that you must say go any card, rather than just saying go any.
    //"
    {"go [to] {`which``-2`next|`-1`prev|`-1`previous|`1`first|`2`second|`3`third|`4`forth|`5`fifth|"
        "`6`sixth|`7`seventh|`8`eighth|`9`ninth|`10`tenth|`-3`middle|`-5`last} [[`marked``1`marked] card]",
        "which,marked",
        (XTECommandImp)&_cmd_go_which}, // this definition is causing a leak ***
    {"go [to] <where>", "where", (XTECommandImp)&_cmd_go_where},
    
    {"answer file <prompt> [of type <type1> [or <type2> [or <type3>]]]", "prompt,type1,type2,type3", (XTECommandImp)&_cmd_answer_file},
    {"answer folder <prompt>", "prompt", (XTECommandImp)&_cmd_answer_folder},
    {"answer <prompt> [with <btn1> [or <btn2> [or <btn3>]]]", "prompt,btn1,btn2,btn3", (XTECommandImp)&_cmd_answer_choice},
    
    {"ask file <prompt> [with <defaultFilename>]", "prompt,defaultFilename", (XTECommandImp)&_cmd_ask_file},
    {"ask [`password``1`password] <prompt> [with <response>]", "prompt,response,password", (XTECommandImp)&_cmd_ask_text},
    
    {"open file <filepath>", "filepath", (XTECommandImp)&_cmd_file_open},
    {"close file <filepath>", "filepath", (XTECommandImp)&_cmd_file_close},
    {"read line from file <filepath>", "filepath", (XTECommandImp)&_cmd_file_read_line},
    {"read from file <filepath> [at <charBegin>] {for <charCount> | until {end|eof|<charEnd>}}", "filepath,charBegin,charEnd,charCount", (XTECommandImp)&_cmd_file_read_chars},
    {"write <text> to file <filepath> [at {end|eof|<charBegin>}]", "filepath,text,charBegin", (XTECommandImp)&_cmd_file_write_chars},
    
    
    {
        "put <source> [{`mode``into`into|`after`after|`before`before} <dest>]",
        "source,mode,dest",
        &_xte_cmd_put,
    },
    {
        "set <prop> to <value>",
        "prop,value",
        &_xte_cmd_set,
    },
    {
        "get <expr>",
        "expr",
        &_xte_cmd_get,
    },
    
    
     { "abs", 1, &_xte_math_abs },
    { "sum", -1, &_xte_math_sum },
    { "average", -1, &_xte_math_average },
    { "min", -1, &_xte_math_min },
    { "max", -1, &_xte_math_max },
    { "atan", 1, &_xte_math_atan },
    { "cos", 1, &_xte_math_cos },
    { "sin", 1, &_xte_math_sin },
    { "tan", 1, &_xte_math_tan },
    { "sqrt", 1, &_xte_math_sqrt },
    { "round", 1, &_xte_math_round },
    { "trunc", 1, &_xte_math_trunc },
    { "random", 1, &_xte_math_random },
    
     {"system", 0, "system", 0, &bi_system, NULL},
    {"target", 0, "object", 0, &bi_target, NULL},
    {"result", 0, "value", 0, &bi_the_result, NULL},
    {"itemDelimiter", 0, "string", 0, &bi_item_delimiter_get, NULL, &bi_item_delimiter_set},
    {"numberFormat", 0, "string", 0, &bi_number_fmt_get, NULL, &bi_number_fmt_set},
    
    
     "convert <expr> to {`fmtto``-1`timestamp | `-2`dateitems | `0`short date | "
        "`1`abbr date | `1`abbrev date | `1`abbreviated date | `2`long date |"
        "`3`short time | `4`long time}",
        "expr,fmtto",
        &_xte_cmd_convert_date,
        
         { "date", 0, &_xte_fnc_date },
    { "time", 0, &_xte_fnc_time },
    { "timestamp", 0, &_xte_fnc_timestamp },
    { "dateitems", 0, &_xte_fnc_dateitems },
    { "month", 1, &_xte_fnc_month },
    { "weekday", 1, &_xte_fnc_weekday },
    NULL
};


struct XTEPropertyDef _xte_builtin_date_properties[] = {
    {"date", 0, "string", 0, &_xte_prp_date, NULL},
    {"time", 0, "string", 0, &_xte_prp_time, NULL},
    {"timestamp", 0, "real", 0, &_xte_prp_timestamp, NULL},
    {"dateitems", 0, "string", 0, &_xte_prp_dateitems, NULL},
    
    
   


static struct XTEPropertyDef _xte_builtin_int_properties[] = {
    {"month", 0, "string", 0, &_xte_prp_month, NULL},
    {"weekday", 0, "string", 0, &_xte_prp_weekday, NULL},
   
    NULL,
};

static struct XTEPropertyDef _xte_builtin_real_properties[] = {
    {"month", 0, "string", 0, &_xte_prp_month, NULL},
    {"weekday", 0, "string", 0, &_xte_prp_weekday, NULL},
   
    NULL,
};

static struct XTEPropertyDef _xte_builtin_str_properties[] = {
    {"month", 0, "string", 0, &_xte_prp_month, NULL},
    {"weekday", 0, "string", 0, &_xte_prp_weekday, NULL},
    
    NULL,
};



static struct XTEClassDef _class_integer = {
    "integer",
    0,
    sizeof(_xte_builtin_int_properties) / sizeof(struct XTEPropertyDef),
    _xte_builtin_int_properties,
    NULL,
};

static struct XTEClassDef _class_real = {
    "real",
    0,
    sizeof(_xte_builtin_real_properties) / sizeof(struct XTEPropertyDef),
    _xte_builtin_real_properties,
    NULL,
};

static struct XTEClassDef _class_boolean = {
    "boolean",
    0,
    0,
    NULL,
    NULL,
};

static struct XTEClassDef _class_string = {
    "string",
    0,
    sizeof(_xte_builtin_str_properties) / sizeof(struct XTEPropertyDef),
    _xte_builtin_str_properties,
    NULL,
};




static XTEVariant* _bi_system_version(XTE *in_engine, void *in_context, int in_prop, XTEVariant *in_owner, XTEPropRep in_representation)
{
    int major,minor,bugfix;
    char buffer[64];
    _xte_platform_sys_version(&major, &minor, &bugfix);
    switch (in_representation)
    {
        case XTE_PROPREP_NORMAL:
        case XTE_PROPREP_SHORT:
            sprintf(buffer, "%d.%02d%02d", major, minor, bugfix);
            return xte_string_create_with_cstring(in_engine, buffer);
            return xte_real_create(in_engine, atof(buffer));
        case XTE_PROPREP_ABBREVIATED:
        {
            char buffer[64];
            sprintf(buffer, "%d.%d", major, minor);
            return xte_string_create_with_cstring(in_engine, buffer);
        }
        case XTE_PROPREP_LONG:
        {
            char buffer[64];
            sprintf(buffer, "%d.%d.%d", major, minor, bugfix);
            return xte_string_create_with_cstring(in_engine, buffer);
        }
    }
}

static XTEVariant* _bi_system_name(XTE *in_engine, void *in_context, int in_prop, XTEVariant *in_owner, XTEPropRep in_representation)
{
    return xte_string_create_with_cstring(in_engine, _xte_platform_sys());
}

static XTEVariant* _bi_system_test(XTE *in_engine, void *in_context, int in_prop, XTEVariant *in_owner, XTEPropRep in_representation)
{
    return xte_string_create_with_cstring(in_engine, "OK");
}

static struct XTEPropertyDef _system_properties[] = {
    {"version", 0, "real", 0, &_bi_system_version, NULL},
    {"name", 0, "string", 0, &_bi_system_name, NULL},
    {"_test_parser", 0, "string", 0, &_bi_system_test, NULL},
    NULL
};

static struct XTEClassDef _class_system = {
    "system",
    0,
    sizeof(_system_properties) / sizeof(struct XTEPropertyDef),
    _system_properties,
    NULL,
    
    
    static struct XTEPropertyDef _chunk_props[] = {
    {"number", 0, "integer", 0, &_xte_chunk_count, NULL},
    NULL,
};


struct XTEClassDef _xte_builtin_class_chunk = {
    "chunk",
    0,
    sizeof(_chunk_props) / sizeof(struct XTEPropertyDef),
    _chunk_props,
    &_xte_chunk_read,
    &_xte_chunk_write,
    
    
     { "characters", "character", "string", 0, &_xte_chunk_chars, NULL, &_xte_chunk_count },
    { "words", "word", "string", 0, &_xte_chunk_words, NULL, &_xte_chunk_count },
    { "lines", "line", "string", 0, &_xte_chunk_lines, NULL, &_xte_chunk_count },
    { "items", "item", "string", 0, &_xte_chunk_items, NULL, &_xte_chunk_count },
    */
    
    
    

Xtalk.Dict.init_builtins();


CinsImp._script_loaded('xtalk-dict');

