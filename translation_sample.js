
var data;

var URL = "http://s3-ap-northeast-1.amazonaws.com/ecoka/JMdict_e.json";

var robot = robot || null;

if (robot) {
        robot.http(URL)
        .get(function (err, res, body) {
                data = JSON.parse(body);
                gotData();
        });
} else {
        // Running locally in node.js
        var http = require('http');
        console.log('beginning get');
        http.get(URL, function (response) {
                response.setEncoding('binary');
                var chunks = '';
                response.on('data', function (chunk) {
                        // console.log('got chunk' + Math.random());
                        chunks += chunk;
                });
                response.on('end', function () {
                        console.log('ended');
                        data = JSON.parse(chunks);
                        gotData();
                });
        });
}



var entries;
var glossesIndex = {};

//
//        {
//                "hello": [3, 4, 5]
//        }
//

function makeGlosseseIndex () {
        for (var i = 0, l = entries.length; i < l; i++) {
                var entry = entries[i];
                var senses = entry.sense;
                for (var i2 = 0, l2 = senses.length; i2 < l2; i2++) {
                        var sense = senses[i2];
                        var glosses = sense.gloss;
                        for (var i3 = 0, l3 = glosses.length; i3 < l3; i3++) {
                                var gloss = glosses[i3];
                                // glossesIndex[gloss] = i;
                                try {
                                        if (!glossesIndex['ecoka'+gloss]) {
                                                glossesIndex['ecoka'+gloss] = [];
                                        }
                                        glossesIndex['ecoka'+gloss].push(i);
                                } catch (e) {
                                        debugger;
                                }

                        }
                }
        }
}

function lookupWord (word) {
        var indicies = glossesIndex['ecoka'+word] || [];
        var ret = [];
        for (var i = 0, l = indicies.length; i < l; i++) {
                var index = indicies[i];
                var entry = entries[index];
                ret.push(entry);
        }
        return ret;
}

function easierWordsForWord(word) {
        var localEntries = lookupWord(word);
        localEntries.forEach(function (entry) {
                if (entry.r_ele) {
                        entry.r_ele.forEach(function (r_ele) {
                                if (r_ele.re_pri) {
                                        return null; // This word has a tag; assuming easy word
                                }
                        });
                }
        });
        // This is a difficult word, let's try to find an easier one

        var otherWords = [];
        localEntries.forEach(function(entry){entry.sense.forEach(function(sense){sense.gloss.forEach(function(gloss){otherWords.push(gloss);})})});
        console.log('otherWords'+otherWords.length);
        var ret = '';
        otherWords.forEach(function (otherWord) {
                var otherEntries = lookupWord(otherWord);
                console.log('otherWord'+otherWord);
                otherEntries.forEach(function(otherEntry){
                        if (otherEntry.r_ele) {
                                otherEntry.r_ele.forEach(function(r_ele){
                                        if (r_ele.re_pri) {
                                                if (ret.indexOf(otherWord) === -1) {
                                                        ret += otherWord + ", ";
                                                }
                                        }
                                });
                        }
                });
        });
        if (ret.indexOf(word) > -1) {return null;}
        return ret && ("Easier word for " + word + " is " + ret);
}


function gotData () {
        entries = data.entry;

        console.log('gotData');
        makeGlosseseIndex();

        lookupWord('hello');
        console.log(easierWordsForWord('acumen'));

}


/*


var tags = [];
tags["n"] = "noun";
tags["adv"] = "adverb";
tags["adj"] = "adjective";
tags["pos"] = "part of speech";
tags["freq"] = "frequency of use";
tags["ichi1"] = "words that are used often";
tags["ichi2"] = "words that are used less often";
tags["gai1"] = "common borrowed word (from another language)";
tags["gai2"] = "less common borrowed word";
tags["news1"] = "words that are used often in news";
tags["news2"] = "words that are used less often in news";
tags["spec1"] = "words that are considered less difficult";
tags["spec2"] = "words that are considered difficult";

*/




function isWordFilter(element) {
  var vowelCount = ("|"+element+"|").split(/[aieou]/i).length - 1;
  return element.length > 4 && vowelCount <= 4;
}



module.exports = function(robot) {
  robot.hear(/^(.*)+$/i, function(msg){ //  [a-z0-9]+

    var words_array = msg.match[1].split(' ');

    // lowercase
    var words_array_preprocessed = words_array.map(function(value) {
      return value.toLowerCase();
    });

    // sort according to the length of each word
    words_array_preprocessed.sort(
      function(a,b){
        if( a.length < b.length ) return 1;
        if( a.length > b.length ) return -1;
        return 0;
      }
    );

    // filter
    var words_array_filtered = words_array_preprocessed.filter(isWordFilter);


    console.log(words_array);
    console.log(words_array_preprocessed);
    console.log("----");
    console.log(words_array_filtered);





    words_array_filtered.forEach(function(elem, index, array){
      //console.log(elem, index, array);

      console.log(easierWordsForWord(elem));
      
      if(easierWordsForWord(elem)){
        msg.reply(easierWordsForWord(elem));        
      }


      
    });

    //synonyms_array = [];

    //var random_result = msg.random(words_array_preprocessed); 
    //msg.reply(" means " + words_array_preprocessed[1] + " means " + "something that you can eat" + ".");

  });
}








