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
