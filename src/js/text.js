/*
CinsImp
Text Utilities

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


function Text() {}

Text.ALIGN_LEFT = 0;
Text.ALIGN_CENTRE = 1;
Text.ALIGN_RIGHT = 2;
Text.ALIGN_JUSTIFY = 3;


Text.STYLE_BOLD = 0x1;
Text.STYLE_ITALIC = 0x2;
Text.STYLE_UNDERLINE = 0x4;
Text.STYLE_SHADOW = 0x8;
Text.STYLE_CONDENSE = 0x10;
Text.STYLE_EXTEND = 0x20;


Text.is_attribute = function(in_style, in_attribute)
{
	var attrs = in_style.split(',');
	return (attrs.indexOf(in_attribute) != -1);
}


Text.apply_attributes_to_dom = function(in_element, in_attributes)
{
	if ('txt_font' in in_attributes)
		in_element.style.fontFamily = in_attributes['txt_font'];
	if ('txt_size' in in_attributes)
		in_element.style.fontSize = in_attributes['txt_size'] +'pt';
	if ('txt_style' in in_attributes)
	{
		var style = in_attributes['txt_style'];
		in_element.style.fontWeight = (Text.is_attribute(style, 'bold') ? 'bold' : 'normal');
		in_element.style.fontStyle = (Text.is_attribute(style, 'italic') ? 'italic' : 'normal');
		in_element.style.textShadow = (Text.is_attribute(style, 'shadow') ? '2px 2px 1px #AAA' : 'none');
		if (Text.is_attribute(style, 'extend')) in_element.style.letterSpacing = '1px';
		else in_element.style.letterSpacing = (Text.is_attribute(style, 'condense') ? '-1px' : 'normal');
	}
	if ('txt_align' in in_attributes)
		in_element.style.textAlign = in_attributes['txt_align'];
}


Text.edit_style = function(in_objects, in_prior)
{
	Text._objects = in_objects;
	var obj = Text._objects[0]; // hack ** in future this should handle multiple objects
	
	if (in_prior) in_prior();

	Dialog.TextStyle.populate_with(obj);
	
	var style = obj.get_attr('txt_style');
	Dialog.TextStyle.element('bold').checked = Text.is_attribute(style, 'bold');
	Dialog.TextStyle.element('italic').checked = Text.is_attribute(style, 'italic');
	Dialog.TextStyle.element('shadow').checked = Text.is_attribute(style, 'shadow');
	Dialog.TextStyle.element('extend').checked = Text.is_attribute(style, 'extend');
	Dialog.TextStyle.element('condense').checked = Text.is_attribute(style, 'condense');
	
	Text._update_sample();
	
	Dialog.TextStyle.set_onclose(function(in_dialog, in_save)
	{
		if (in_save) 
		{
			in_dialog.apply();
			
			var style = [];
			if (in_dialog.element('bold').checked) style.push('bold');
			if (in_dialog.element('italic').checked) style.push('italic');
			if (in_dialog.element('shadow').checked) style.push('shadow');
			if (in_dialog.element('extend').checked) style.push('extend');
			if (in_dialog.element('condense').checked) style.push('condense');
			in_dialog.get_object().set_attr('txt_style', style.join(','));
			
			View.current.rebuild(); // this should happen automatically in future **TODO**
		}
	});
	Dialog.TextStyle.show();
	/*
	
	
	document.getElementById('TextFont').value = obj.get_attr(ViewObject.ATTR_TFONT);
	document.getElementById('TextSize').value = obj.get_attr(ViewObject.ATTR_TSIZE);
	switch (obj.get_attr(ViewObject.ATTR_TALIGN))
	{
	case Text.ALIGN_LEFT:
		document.getElementById('TextAlign1').checked = true;
		break;
	case Text.ALIGN_CENTRE:
		document.getElementById('TextAlign2').checked = true;
		break;
	case Text.ALIGN_RIGHT:
		document.getElementById('TextAlign3').checked = true;
		break;
	case Text.ALIGN_JUSTIFY:
		document.getElementById('TextAlign4').checked = true;
		break;
	}
	var style = obj.get_attr(ViewObject.ATTR_TSTYLE);
	document.getElementById('TextStyle1').checked = (style & Text.STYLE_BOLD);
	document.getElementById('TextStyle2').checked = (style & Text.STYLE_ITALIC);
	document.getElementById('TextStyle3').checked = (style & Text.STYLE_SHADOW);
	document.getElementById('TextStyle4').checked = (style & Text.STYLE_CONDENSE);
	document.getElementById('TextStyle5').checked = (style & Text.STYLE_EXTEND);
	
	Text._update_sample();
	Dialog.TextStyle.show();*/
}


Text._save_style = function()
{
	var obj = Text._objects[0];
	
	obj.set_attr(ViewObject.ATTR_TFONT, document.getElementById('TextFont').value);
	obj.set_attr(ViewObject.ATTR_TSIZE, document.getElementById('TextSize').value);
	if (document.getElementById('TextAlign1').checked)
		obj.set_attr(ViewObject.ATTR_TALIGN, Text.ALIGN_LEFT);
	else if (document.getElementById('TextAlign2').checked)
		obj.set_attr(ViewObject.ATTR_TALIGN, Text.ALIGN_CENTRE);
	else if (document.getElementById('TextAlign3').checked)
		obj.set_attr(ViewObject.ATTR_TALIGN, Text.ALIGN_RIGHT);
	else if (document.getElementById('TextAlign4').checked)
		obj.set_attr(ViewObject.ATTR_TALIGN, Text.ALIGN_JUSTIFY);
	var style = 0;
	if (document.getElementById('TextStyle1').checked) style |= Text.STYLE_BOLD;
	if (document.getElementById('TextStyle2').checked) style |= Text.STYLE_ITALIC;
	if (document.getElementById('TextStyle3').checked) style |= Text.STYLE_SHADOW;
	if (document.getElementById('TextStyle4').checked) style |= Text.STYLE_CONDENSE;
	if (document.getElementById('TextStyle5').checked) style |= Text.STYLE_EXTEND;
	obj.set_attr(ViewObject.ATTR_TSTYLE, style);

	Dialog.dismiss();
}


Text._update_sample = function()
{
	var sample = document.getElementById('TextSample');
	
	sample.style.fontFamily = document.getElementById('TextFont').value;
	sample.style.fontSize = document.getElementById('TextSize').value + 'pt';
	if (document.getElementById('TextAlign1').checked)
		sample.style.textAlign = 'left';
	else if (document.getElementById('TextAlign2').checked)
		sample.style.textAlign = 'center';
	else if (document.getElementById('TextAlign3').checked)
		sample.style.textAlign = 'right';
	else if (document.getElementById('TextAlign4').checked)
		sample.style.textAlign = 'justify';
	sample.style.fontWeight = (document.getElementById('TextStyle1').checked ? 'bold' : 'normal');
	sample.style.fontStyle = (document.getElementById('TextStyle2').checked ? 'italic' : 'normal');
	sample.style.textShadow = (document.getElementById('TextStyle3').checked ? '2px 2px 1px #CCC' : 'none');
	
	/*
	Possible Outline implementation:
	.strokeme
{
    color: white;
    text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;  
}
	*/
	
	if (document.getElementById('TextStyle5').checked)
		sample.style.letterSpacing = '1px';
	else
		sample.style.letterSpacing = (document.getElementById('TextStyle4').checked ? '-1px' : 'normal');
}



CinsImp._script_loaded('text');

