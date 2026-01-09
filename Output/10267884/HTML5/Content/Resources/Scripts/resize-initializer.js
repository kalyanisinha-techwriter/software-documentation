$(document).ready(function() {
	$(".sidenav-wrapper").resizable({
		minWidth: 290,
		maxWidth: 800
	});
	$(".ui-resizable-e").prop("title", "Resize navigation");
});