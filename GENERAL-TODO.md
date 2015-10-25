In Progress/Todo
================

* HyperCard import [Partial]
* Drag guides [DONE]
* Field info [DONE]
* Rejigging button and field attributes [DONE]
* Card and bkgnd info [DONE]
* Stack info [DONE]
* Script editor; need to write the JS code formatter [Better formatter needs porting from 2013 prototype]
* Card resize [DONE]
* Picklist/content dialog
* Alerts [DONE]
* Icons for buttons; import via server from server list, preload somewhere? all icons in stack? track use in stack and preload all < certain #  
	eventually list in resources screen, ensuring the headers for the supplied images are designed to enable caching
	probably keep a client-side stack cache of icons and add to it whenever a card downloads with buttons having icons
	scripts will probably have to change this cache, otherwise it should be relatively straight-forward
	the server-side code ought to inspect what buttons have icons and supply the appropriate information

(can do these prior to scripting enabled:)
* Button tasks; link, ? hide for now until can think of things for it to do.;
	visual transition effects, text to speech (via 'mespeak' javascript library or similar)
	opening a URL, playing a sound (stack resources), playing a movie 
	Alternately, a visual effect window to accompany the Link button.
* Button link to?

* Protect stack, incl. Password   <== if we get security up, then it'll be easier to share with others the progress
	(could do user lists? or could simply allow certain exported/guest web priviliges, and use an alternative,
	external login mechanism to apply more complicated security w/ plug-ins later)

* Options menu?
* Core navigation vs browser nav?

* nice loading screen behaviour and stack transitions within a single session

* HC-style reporting functionality

* New Web accessible handlers and functions exporting via whatever standards are common today RPC, SOAP, etc.
* New Web forms - exportable card(s) with working handlers
* New Web accessible reports with PDF, HTML, CSV outputs and charts/graphics
* New Web accessible HTML content for embedding within other statically/dynamically generated pages

* need to avoid saving everytime navigation occurs (very stupid) - only save when things have changed
* need a visible dirty flag and auto-save feature (backgrounding)
* need a save button to ensure all information is manually returned to the server if not changing cards
* it'd be good to avoid downloading the bkgnd image if the bkgnd is the same ID (server-side code can check in concert with client request, and send a special designation which the client will use to utilise the last bkgnd image, which will be separately cached prior to loading the next card's details)

* Paint tools! [Partial]
  * Cut/Copy/Paste + Rectangular Selection [Done Paste, TODO Cut/Copy]
  * Lasso [TODO]
  * Paint tools
  * Shape tools
  * Text tool ?

* Integration of xTalk engine
  * Caching compiled handlers and index
  * Core commands and functions
  * Chunks implementation

* Debugging