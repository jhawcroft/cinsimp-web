TODO: CinsImp -> Toward 1.0
===========================

* object reference internals for xTalk, Link To -> actually just need the stack's URL and card ID number
* completing button tasks

* xTalk:
  * complete chunk expression support
  * remaining built-ins hook up and implementations [95%]
  * proper code auto-formatter (migrate the 2013 prototype)
  * massive scripting cleanup + complete error handling

* consider switching Content Editable for styled Text-area as there are numerous complications
	with handling a content editable div in this kind of environment, including:
	-	getting a searchable/indexable version
	- 	handling pastes safely
	-	providing a palette/UI mechanisms to apply different styles  

* button and field menus/picklists
* multi-column fields

* massive general cleanup

* about box expansion to include more room for other credits
  * add font licenses to credits

* security:
  * user-levels
  * authenticate feature; temporarily authenticate for duration of session
    to get user-level 5 equivalent access to an otherwise protected stack

* palettes:
  * line sizes
  * text?
  * disabled buttons on main palettes
  * textures?

* printing:
  * print field
  * print card
  * print stack
  * report template design
  * report printing
  
* static pages for Google searchability/indexing

* server-side VM and script execution 
	- some kind of expression evaluation will be needed for sort, even if simplified/restricted

* server-side find implementation for faster find & more capable mark/unmark

* paint:
  * lasso tool
  * textures (single color +/-)
  * effects via options menu
  * copy/cut
  
======= END version 1.0 =======

* web 'one-click' access:
  * export of handlers/functions for SOAP/RPC
  * export of reports
  * export of card(s) as HTML 5 forms

* type manager
  * use bundled fonts within stacks

* HyperCard import completion
  
* xTalk debugger

