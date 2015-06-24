(function(){

var questionsNode;
var lastQuestionRow = null;
var addQuestion = function _addQuestion(question, answer){
	var row = kkjs.node.create({
		tag: "tr",
		parentNode: questionsNode,
		childNodes: [
			{tag: "td", childNodes: [{tag: "input", name: "question[]", value: question}]},
			{tag: "td", childNodes: [{tag: "input", name: "answer[]", value: answer}]}
		]
	});
	row.question = kkjs.css.$("input[name^=question]", {node: row})[0];
	row.answer = kkjs.css.$("input[name^=answer]", {node: row})[0];
	lastQuestionRow = row;
	
	kkjs.event.add(row.answer, "blur", function(ev){
		if (this.parentNode.parentNode === lastQuestionRow && this.value){
			addQuestion();
		}
	});
	kkjs.event.add.key(row, "ENTER", "down", function(ev){
		if (ev.target === row.question){
			row.answer.focus();
		}
		if (ev.target === row.answer){
			if (this === lastQuestionRow){
				ev.target.blur();
				lastQuestionRow.question.focus();
			}
			else {
				this.nextSibling.question.focus();
			}
		}
	});
	
	kkjs.node.create({
		tag: "td",
		parentNode: row,
		childNodes: [{
			tag: "button",
			innerHTML: "&minus;",
			onclick: function(){
				removeQuestion(row);
			}
		}]
	});
}.setDefaultParameter("", "");
function removeQuestion(row){
	kkjs.node.remove(row);
	lastQuestionRow = questionsNode.rows[questionsNode.rows.length - 1];
}
var getQuestions = function getQuestions(filter){
	var questionNodes = kkjs.css.$("input[name^=question]", {node: questionsNode});
	var questions = kkjs.css.$("input[name^=answer]", {node: questionsNode}).map(function(node, i){
		return {question: questionNodes[i].value, answer: node.value};
	});
	if (filter){
		questions = questions.filter(function(o){
			return o.answer.length !== 0;
		});
	}
	questions.forEach(function(question, i){
		question.number = i;
	});
	return questions;
}.setDefaultParameter(true);

kkjs.event.onWindowLoad(function(){
	questionsNode = kkjs.$("questions");
	
	
	var lastGrid;
	function placeSolution(){
		if (lastGrid){
			lastGrid.solution = [];
			var solution = Grid.normalizeWord(kkjs.$("solution").value);
			if (solution){
				var chars = {};
				
				for (var i = 0; i < 26; i++){
					var c = String.fromCharCode("a".charCodeAt(0) + i);
					chars[c] = lastGrid.chars[c].slice();
				}
				
				for (var i = 0; i < solution.length; i++){
					var c = solution[i];
					if (chars[c].length){
						var idx = Math.floor(Math.random() * chars[c].length);
						lastGrid.solution.push(chars[c][idx].clone());
						chars[c].splice(idx, 1);
					}
					else {
						lastGrid.solution = [];
						alert("L\xF6sungwort ist nicht in Antworten enthalten");
						break;
					}
				}
			}
			lastGrid.update();
		}
		else {
			alert("Es muss erst ein Kreuzwortr\xE4tsel erstellt werden.");
		}
	}
	function generate(){
		kkjs.node.clear(kkjs.$("schema"));
		
		var questions = getQuestions();
		
		if (questions.length === 0){
			alert("Keine W\xF6rter angegeben.");
			return;
		}
		
		kkjs.random.array.shuffle(questions);
		
		lastGrid = Grid.create(questions);
		
		questions.sort(function(a, b){
			a = a.number;
			b = b.number;
			return a > b? 1: (b > a? -1: 0);
		});
		
		
		kkjs.$("placeSolution").disabled =  !lastGrid;
		if (lastGrid){
			lastGrid.trim();
			placeSolution();
			
			kkjs.$("schema").appendChild(lastGrid.createNode());
			var list = kkjs.node.create({
				tag: "ol",
				parentNode: kkjs.$("schema")
			});
			questions.forEach(function(q){
				kkjs.node.create({
					tag: "li",
					parentNode: list,
					childNodes: [q.question]
				});
			});
		}
		else {
			kkjs.$("downloadImage").href = "";
			alert("Kein zusammneh\xE4ngendes R\xE4tsel m\xF6glich.");
		}
	}
	
	kkjs.event.add(kkjs.$("generate"), "click", generate);
	kkjs.event.add(kkjs.$("downloadImage"), "mouseover", function(){
		if (lastGrid){
			this.href = Grid.tableToCanvas(kkjs.$("schema").firstChild).toDataURL();
		}
		else {
			this.removeAttribute("href");
		}
	});
	kkjs.event.add(kkjs.$("downloadImage"), "click", function(ev){
		if (kkjs.is.ie || navigator.userAgent.indexOf("Trident") !== -1){
			var form = kkjs.node.create({
				tag: "form",
				action: "http://bounce.kkapsner.de/echoToDownload.php",
				method: "POST",
				target: "_blank",
				childNodes: [
					{
						tag: "input",
						type: "hidden",
						name: "dataURL",
						value: this.href
					},
					{
						tag: "input",
						type: "hidden",
						name: "filename",
						value: "grid.png"
					}
				],
				parentNode: document.body
			});
			form.submit();
			kkjs.node.remove(form);
			ev.preventDefault();
		}
	});
	kkjs.event.add(kkjs.$("placeSolution"), "click", placeSolution);
	kkjs.event.add(kkjs.$("addQuestion"), "click", function(){addQuestion();});
	
	kkjs.event.add(kkjs.$("displayAnswer"), ["change", "click"], function(){
		kkjs.css.className[this.checked? "add": "remove"](kkjs.$("schema"), "answered");
	});
	kkjs.event.fireOwn(kkjs.$("displayAnswer"), {type: "click"});
});

kkjs.event.onWindowLoad(function(){
	kkjs.$("solution").value = kkjs.cookie.getValue("crosswordSolution");
	var data = kkjs.cookie.getValue("crosswordData");
	if (data){
		try {
			data = JSON.parse(data);
			data.forEach(function(q){
				addQuestion(q.question, q.answer);
			});
			return;
		}
		catch(e){}
	}
	addQuestion();
});
kkjs.event.add(window, "unload", function(){
	kkjs.cookie.setValue("crosswordData", JSON.stringify(getQuestions(false)));
	kkjs.cookie.setValue("crosswordSolution", kkjs.$("solution").value);
});

})();