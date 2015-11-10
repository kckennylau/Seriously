function genUni() {
	var code = prompt("Generate Unicode Character:");
	$('#code').val($('#code').val() + String.fromCharCode(parseInt(code)));
	updateByteCount();
};

function getByteCount(s) {
	var count = 0, stringLength = s.length;
	s = String(s || "");
	for (var i = 0; i < stringLength; i++) {
		var partCount = encodeURI(s[i]).split("%").length;
		count += partCount == 1 ? 1 : partCount - 1;
	}
	return count;
}

function t(s){for(var i=0;i<s.length;i++){console.log(s.charCodeAt(i));}}

function updateByteCount() {
	var c = $('#code').val();
	var byteCount = getByteCount(c);
	var charCount = c.length;
	var s = byteCount + " bytes and " + charCount + " chars long.";
	$('#byteCount').html(s);
}

function getStrippedCode() {
	var stripped = $('#code').val().replace(/\s/g, '');
	$('#stripped').html(
			'Stripped code: <code>' + stripped + '</code> Byte count: '
					+ getByteCount(stripped));
}

var string = false;
var codeBlock = false;
var math = false;
var file = false;

function getExplanantion() {
	$('#explanation').html('');
	var code = $('#code').val().replace(/\s/g, '');
	for (var x = 0, c = ''; c = code.charAt(x); x++) {
		var original = $('#explanation').html();
		var spaces = "";
		$('#explanation').html(
				original
						+ " "
                        + explanations[c]
								+ "\r\n"));
	}

}

function updateUtils() {
	updateByteCount();
	getStrippedCode();
	getExplanantion();
}

updateUtils();

$(document).ready(
		function() {
			$("#permalink").click(
					function() {
						var code = $.param({
							code : $('#code').val(),
							input : $('#input').val()
						});
						prompt("Permalink:", "http://"
								+ window.location.hostname + "/link/" + code);
						window.location.pathname = "/link/" + code;
					});
			$('#code').on('input propertychange paste', function() {
				updateUtils();
			});
		});