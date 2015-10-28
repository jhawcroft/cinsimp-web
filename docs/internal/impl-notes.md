Implementor Notes
=================

Object References - Internals
-----------------------------

Path format.
(ie. compiler/parser output is flattened)

Each path component consists of a type, and a payload.
Types:
* Stack
  * url
* Bkgnd / Card / Button / Field / Report Template
  * id / name / number / ordinal
* Palette

Resolution is delayed until access is required.
Reference is immutable once created.

Resolution performed by the top-level manager of the model, and components supplied to the xTalk engine by this same mechanism and/or in concert with the application/top level stack controller.


PUT Command
-----------

Central xTalk mechanism for changing the content of an object or variable.

Chunk expression object nodes evaluate to a character range, and are evaluated within an existing range (possibly from another such preceding node).

Expression evaluation mechanism is responsible for resolving to value, by requesting the relevant range from the chunk expression and extracting the content from the target.

Writing is performed in three steps:
* a priming step, wherein whatever elements are not yet valid are necessarily created within a cached copy of the target's content.
* the writing step, wherein the new content is actually written around/into the range computed during evaluation.
* replacing the target's content with the new content, or if it's a field, using the final range to specify what needs to be modified and ensuring HTML/styles are appropriately maintained in the unmodified content.

