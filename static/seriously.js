if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    'use strict';
    if (this == null) {
      throw new TypeError('can\'t convert ' + this + ' to object');
    }
    var str = '' + this;
    count = +count;
    if (count != count) {
      count = 0;
    }
    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }
    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }
    count = Math.floor(count);
    if (str.length == 0 || count == 0) {
      return '';
    }
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    if (str.length * count >= 1 << 28) {
      throw new RangeError('repeat count must not overflow maximum string size');
    }
    var rpt = '';
    for (;;) {
      if ((count & 1) == 1) {
        rpt += str;
      }
      count >>>= 1;
      if (count == 0) {
        break;
      }
      str += str;
    }
    return rpt;
  }
}

function toHex(d) {
    return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}

var cp437 = {};

cp437.codepage = '\x00\u263a\u263b\u2665\u2666\u2663\u2660\u2022\u25d8\u25cb\u25d9\u2642\u2640\u266a\u266b\u263c\u25ba\u25c4\u2195\u203c\xb6\xa7\u25ac\u21a8\u2191\u2193\u2192\u2190\u221f\u2194\u25b2\u25bc !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\u2302\xc7\xfc\xe9\xe2\xe4\xe0\xe5\xe7\xea\xeb\xe8\xef\xee\xec\xc4\xc5\xc9\xe6\xc6\xf4\xf6\xf2\xfb\xf9\xff\xd6\xdc\xa2\xa3\xa5\u20a7\u0192\xe1\xed\xf3\xfa\xf1\xd1\xaa\xba\xbf\u2310\xac\xbd\xbc\xa1\xab\xbb\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510\u2514\u2534\u252c\u251c\u2500\u253c\u255e\u255f\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256b\u256a\u2518\u250c\u2588\u2584\u258c\u2590\u2580\u03b1\xdf\u0393\u03c0\u03a3\u03c3\xb5\u03c4\u03a6\u0398\u03a9\u03b4\u221e\u03c6\u03b5\u2229\u2261\xb1\u2265\u2264\u2320\u2321\xf7\u2248\xb0\u2219\xb7\u221a\u207f\xb2\u25a0\xa0';

cp437.encode = function(codePoint) {
    return cp437.codepage.charAt(codePoint);
};

cp437.decode = function(c) {
    return cp437.codepage.indexOf(c);
};

function genChar() {
    var code = prompt("Generate CP437 Character:");
    if(!code)
        return;
    $('#code').val($('#code').val() + cp437.encode(parseInt(code)));
    updateUtils();
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

function updateByteCount() {
    var c = $('#code').val();
    var byteCount = c.length;
    var charCount = c.length;
    var s = byteCount + " bytes and " + charCount + " chars long.";
    $('#byteCount').html(s);
}

function getExplanation(code, indent) {
    var string = false;
    var codeBlock = false;
    var listBlock = false;
    var numBlock = false;
    var evalBlock = false;
    var setexp = code == null;
    if(code == null) {
        code = $("#code").val();
    }
    var ind = (indent==null)?'':'\t';
    var explain = '';
    for(var x=0; x < code.length; x++) {
        var c = code.charAt(x);
        if(c === '"') {
            if(string) {
                var prev = code.lastIndexOf('"',x-1);
                var strval = code.slice(prev+1,x);
                explain += ind + 'push the string value "'+strval+'"\r\n'
            }
            string = !string;
            continue;
        } else if(c === '`') {
            if(codeBlock) {
                var prev = code.lastIndexOf('`',x-1);
                var strval = code.slice(prev+1,x);
                explain += ind + 'push the function value `'+strval+'`:\r\n'
                explain += ind + getExplanation(strval,true);
            }
            codeBlock = !codeBlock;
            continue;
        } else if(c === '[') {
            listBlock = true;
            continue;
        } else if(c === ':') {
            if(numBlock) {
                var prev = code.lastIndexOf(':',x-1);
                var strval = code.slice(prev+1,x);
                explain += ind + 'push the numeric value :'+strval+':\r\n'
            }
            numBlock = !numBlock;
            continue;
        } else if(c === cp437.encode(0xEC)) {
            if(evalBlock) {
                var prev = code.lastIndexOf(':',x-1);
                var strval = code.slice(prev+1,x);
                explain += ind + "push the result of eval'ing \""+strval+'"\r\n'
            }
            evalBlock = !evalBlock;
            continue;
        } else if(c === ']') {
            listBlock = false;
            var prev = code.lastIndexOf('[',x-1);
            var strval = code.slice(prev+1,x);
            explain += ind + 'push the list value ['+strval+']\r\n'
            continue;
        }
        if(codeBlock || string || listBlock || numBlock || evalBlock) {
            continue;
        }
        if(c == "'") {
            x++;
            explain += ind + "'" + code.charAt(x) + ": " + 'push the string "' + code.charAt(x) +'"'
        }
        else if(cp437.decode(c) > -1)
            explain += ind + c + ': ' + explanations[toHex(cp437.decode(c))] +'\r\n';
    }
    if(string) {
        var prev = code.lastIndexOf('"',x-1);
        var strval = code.slice(prev+1,x);
        explain += ind + 'push the string value "'+strval+'"\r\n'
    } else if(codeBlock) {
        var prev = code.lastIndexOf('"',x-1);
        var strval = code.slice(prev+1,x);
        explain += ind + 'push the function value `'+strval+'`:\r\n'
        explain += ind + getExplanation(strval,true);
    } else if(listBlock) {
        var prev = code.lastIndexOf('[',x-1);
        var strval = code.slice(prev+1,x);
        explain += ind + 'push the list value "'+strval+'"\r\n'
    } else if(numBlock) {
        var prev = code.lastIndexOf(':',x-1);
        var strval = code.slice(prev+1,x);
        explain += ind + 'push the numeric value "'+strval+'"\r\n'
    } else if(evalBlock) {
        var prev = code.lastIndexOf(cp437.encode(0xEC),x-1);
        var strval = code.slice(prev+1,x);
        explain += ind + 'push the result of eval\'ing "'+strval+'"\r\n'
    }
    if(setexp)
        $('#explanation').html(escapeHTML(explain));
    else
        return explain;
}

function updateHexDump() {
    var hex = '';
    var code = $('#code').val();
    for(var i = 0; i < code.length; i++) {
        var hexi = cp437.decode(code.charAt(i)).toString(16);
        if(hexi.length < 2) hexi = "0" + hexi;
        hex+=hexi;
    }
    $('#hexdump').val(hex);
}

function updateUtils() {
    updateByteCount();
    getExplanation(null);
    updateHexDump();
}

function updateUtilsHex() {
    if(updateCode())
        updateUtils();
}

function updateCode() {
    $("#hexwarn").html();
    var hex = $('#hexdump').val();
    if(hex.length % 2 != 0) {
        return false;
    }
    var code = '';
    for(var i = 0; i < hex.length; i += 2) {
        var val = parseInt(hex.substr(i,2),16);
        if(isNaN(val)) {
            $("#hexwarn").html("error: '"+hex.substr(i,2)+"' is not a valid hex byte (must be in 00-FF)")
            return false;
        }
        code += cp437.encode(val);
    }
    $("#code").val(code);
    return true;
}

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

function escapeHTML(s) {
    var pre = document.createElement('pre');
    var text = document.createTextNode(s);
    pre.appendChild(text);
    return pre.innerHTML;
}

function strtohex(s) {
    var res = '';
    for(var i = 0; i < s.length; i++) {
        res += ('0000'+s.charCodeAt(i).toString(16)).slice(-4);
    }
    return res
}

updateUtils();

$(document).ready(
        function() {
            $("#permalink").click(
                    function() {
                        var code = $("#hexdump").val() + ";" + strtohex($("#input").val());
                        prompt("Permalink:", "http://"
                                + window.location.hostname + "/link/" + code);
                        window.location.pathname = "/link/" + code;
                    });
            $('#code').on('input propertychange paste', function() {
                updateUtils();
            });
            $('#hexdump').on('input propertychange paste', function() {
                updateUtilsHex();
            });
            $("input").keypress(function(e){
                var charCode = !e.charCode ? e.which : e.charCode;
                var c = String.fromCharCode(charCode);
                if(cp437.decode(c) < 0)
                    e.preventDefault();
            });
        });