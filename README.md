CinsImp _Web_
=============

Introduction
------------
CinsImp (Web) is a web-based version of the CinsImp application, which was itself intended to be a faithful, contemporary open-source clone of the classic HyperCard application which ran on early Macintosh computers (from around 1988 through to around 1998).

CinsImp is currently under active development and is not yet ready for production.

The list of things that you will be able to do with the finished product will be _almost_ unlimited.  Use it as a virtual sketchpad, a presentation, an inventory, a planner, a journal, a database, a prototype or anything else you can imagine.

How it Works
------------
CinsImp works with documents/applications called 'Stacks'.  These are a virtual metaphor for collections of the old 3 x 5 index card.  Each stack consists of multiple 'cards' which can contain text, graphics and buttons.  Cards have a background layer, in which content to be shared between many cards may be placed.

The environment includes all the basic tools you need to edit, paint and author stacks.  From the start, CinsImp will include a decent collection of ready-made stacks that offer neat solutions to various common problems in much the same way as any other application for mobile/desktop.

What still makes all this really special is the language that brings it all together.  CinsImp uses a cool English-like scripting language called CinsTalk, which animates all the supplied example stacks as well as your own.

Here are some examples of valid CinsTalk code:

    visual effect dissolve slowly
    go to second card
    put field "Qty" * field "Rate" into field "Subtotal"
    sort cards by field "Name"
    if there is a file "Readme" then go card "Readme"
    answer "Hello World!"

Why a Web Edition?
------------------
Web applications are now quite popular and the technology to support them is sufficiently developed.  As a web application, CinsImp can run basically anywhere there is a reasonably capable, modern web browser.

I'm not entirely sure if I'll fix up and finish the desktop edition.  At the moment there doesn't seem a lot of point.  Though I'd love to see a desktop program with a 'classic mode' to emulate the program that started it all.

Why 'CinsImp'?
--------------
CinsImp stands for Cards IN Stacks Imp.  An imp is a mythological being that could be fun, helpful and sometimes mischievous.  It also has the English pronunciation, sins-imp, which is a play on the idea of being an application that helps you do things with your computer that perhaps the established commercial software distributors might find 'unhelpful' to their business model.

Development
-----------
The product is under active development.  It is far from complete.  Though there is substantially more work done than is presently available on GitHub.  I will be uploading significant sources over October 2015 as I complete development, testing and integration.

CinsImp (web) is currently built using Javascript, HTML and CSS, with a small amount of server-side PHP to support storage and HyperCard stack import.

More Information
----------------

More information will be available on the CinsImp website as things unfold:
http://cinsimp.joshhawcroft.org/


