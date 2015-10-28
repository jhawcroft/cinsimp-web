TODO: CinsImp -> Toward 1.0
===========================

* proper client-side model objects for Stack, Bkgnd and Card
  * card dirty flag including visible pencil icon
  * only transmit dirty information for:
    * separate layer info blocks
    * separate layer object definitions and content
    * card content for bkgnd objects
    * separate layer artwork
  * model object references so objects are unloaded when ref count == 0
  * methods to provoke persistence (automatically taking the required action(s))
  * methods to provoke loading
  * don't download bkgnds repeatedly whilst navigating within bkgnd

* object reference internals for xTalk, Link To
  and inter-stack resolution
  (delayed reference evaluation, application mechanism to 
  resolve reference path/chain to actual model object)

* general cleanup

* visual effect transition engine using CSS

* xTalk:
  * script indexes using the appropriate module
  * handler compilation
  * handler execution and message passing hierarchy
  * "answer" command
  * chunk expressions
  * variables
  * remaining built-ins hook up and implementations
  * proper code auto-formatter (migrate the 2013 prototype)
  * completing button tasks
  
* button and field menus/picklists
* multi-column fields

* security:
  * server-side password restrictions, set & clear
  * server-side private access and denial of search engine access to raw content
  * user-levels
  * authenticate feature; temporarily authenticate for duration of session
    to get user-level 5 equivalent access to an otherwise protected stack

* palettes:
  * line sizes
  * text?
  * disabled buttons on main palettes

* printing:
  * print field
  * print card
  * print stack
  * report template design
  * report printing

* server-side VM and script execution

* web 'one-click' access:
  * export of handlers/functions for SOAP/RPC
  * export of reports
  * export of card(s) as HTML 5 forms

* paint:
  * lasso tool
  * textures (single color +/-)
  * effects via options menu
  * copy/cut
  
* type manager
  * use bundled fonts within stacks

* HyperCard import completion

* about box expansion to include more room for other credits
  * add font licenses to credits
  
* xTalk debugger

* optimisations
  * button/field load often causes rebuild of DOM object multiple times as configuration occurs

