
function Dlog()
{
	
}


Dlog.installEventListeners = function()
{
	var dialog = document.getElementsByClassName('Dialog');
	dialog = dialog[0];
	var checkboxes = dialog.getElementsByClassName('Checkbox');
	var checkedList = [];
	for (var w = 0; w < checkboxes.length; w++)
	{
		var checkbox = checkboxes[w];
		checkbox.addEventListener('mouseup', Dlog.Checkbox.toggle.bind(checkbox));
		
		var input = checkbox.getElementsByTagName('input');
		input = input[0];
		if (input.checked)
			checkedList.push(checkbox);
		
		var label = checkbox.getElementsByTagName('label');
		label = label[0];
		label.addEventListener('click', function(e) { var event = e || window.event; e.preventDefault(); });
	}
	
	for (var c = 0; c < checkedList.length; c++)
		checkedList[c].className = 'CheckboxChecked';
}



Dlog.Checkbox = {

	toggle: function(in_event)
	{
		var e = in_event || window.event;
		if (this.className.indexOf('Checked') >= 0)
			this.className = 'Checkbox';
		else
			this.className = 'CheckboxChecked';
		var inputs = this.getElementsByTagName('input');
		if (inputs.length > 0)
			inputs[0].checked = !inputs[0].checked;
		e.stopPropagation();
		e.preventDefault();
	}

};






