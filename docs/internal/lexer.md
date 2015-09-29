Lexical Analysis
================
The lexical analyser/scanner/'lexer' (xtalk-lex.js) is responsible for identifying the various basic units of CinsTalk language in a script, handler or expression.

This information is fed through to later stages of parsing and compilation to considerably simplify the implementation of these later modules.


Token Structure
---------------

All tokens have a common set of fields.  Many tokens also include additional fields that provide supplementary or key token specific detail.

Core fields:

* id  
  What specifically has been identified by the lexical analyser
* flags  
  Important supplementary information about the token
	
	
Token Flags
-----------
	
The flags field of a token may contain various flags (bitwise ORed together):

* FLAG_OPERATOR  
  documented binary and unary operators	
* FLAG_SPECIAL  
  special gramatical delimiters
* FLAG_ORDINAL  
  recognised numeric and functional ordinals
* FLAG_IDENTIFIER  
  suitable for use as a variable or handler identifier
* FLAG_KEYWORD  
  reserved keyword for core language constructs


Recognised Token IDs
--------------------

### Non-Specific

* LITERAL_STRING  
  A "quoted string" literal  
  Additional fields:
  * value
* LITERAL_INTEGER  
  An integer  
  Additional fields:
  * value
* LITERAL_REAL  
  A real number  
  Additional fields:
  * value
* WORD  
  Word not recognised by the lexical analyser; may be an identifier (FLAG_IDENTIFIER) or part of a command syntax  
  Additional fields:
  * text


### Line Delimiter

* EOL  
  End of line  
  Additional fields:
  * line  
  	The physical line number of the token relative to the start of the handler
  * offset
  	The character offset of the token relative to the start of the handler


### Operators

Flags: 

* FLAG_OPERATOR

Fields:

* text
  Provides a description suitable for error messages and debugging

IDs:

* ID_EQUAL
* ID_SUBTRACT
* ID_EXPONENT
* ID_MULTIPLY
* ID_ADD
* ID_RDIV
* ID_LESS_EQUAL
* ID_NOT_EQUAL
* ID_LESS
* ID_MORE_EQUAL
* ID_MORE
* ID_CONCAT_SPACE
* ID_CONCAT
* ID_NUMBER_OF
* ID_NOT_WITHIN
* ID_NOT_IN
* ID_NOT_EQUAL
* ID_WITHIN
* ID_IN
* ID_EQUAL
* ID_EXISTS
* ID_NOT_EXISTS
* ID_CONTAINS
* ID_IDIV
* ID_MODULUS
* ID_LAND
* ID_LOR
* ID_LNOT


### Special

These symbols fulfil an important gramatical role in the parsing of expressions and argument lists, but are not handled in the same way as other operators and may not be documented as such to the scripting user.

Flags: 

* FLAG_SPECIAL

IDs:

* ID_PAREN_OPEN
* ID_PAREN_CLOSE
* ID_COMMA


### Ordinals

These words are recognised ordinals and have a numeric value or associated function when used in a range or numbered object expression.  Elsewhere they have no special purpose and may be used as identifiers.

Flags:

* FLAG_ORDINAL
* FLAG_IDENTIFIER

IDs:

* ID_ANY
* ID_MIDDLE
* ID_LAST
* ID_FIRST
* ID_SECOND
* ID_THIRD
* ID_FOURTH
* ID_FIFTH
* ID_SIXTH
* ID_SEVENTH
* ID_EIGHTH,
* ID_NINTH
* ID_TENTH


### Auxiliary Syntax

These words are recognised by the lexical analyser because they may appear as part of the syntax for various language constructs and control structures.  Elsewhere they have no special purpose and may be used as identifiers.

Flags:

* FLAG_IDENTIFIER

IDs:

* ID_THE
* ID_IN
* ID_OF
* ID_DOWN
* ID_TO
* ID_ID
* ID_WHILE
* ID_UNTIL


### Keywords

These words are reserved keywords, which are used to explicitly denote control structures, runtime flow control directives and other essential language constructs.  Because of their position within the gramar of the language, they may not be used for variable or handler identifiers.

Flags:

* FLAG_KEYWORD

IDs:

* ID_END
* ID_EXIT
* ID_FUNCTION
* ID_GLOBAL
* ID_IF
* ID_THEN
* ID_ELSE
* ID_NEXT
* ID_ON
* ID_PASS
* ID_REPEAT
* ID_RETURN
	
	
	