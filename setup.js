(function(){

var questions = function(){
	var questionsNode;
	var lastQuestionRow = null;
	kkjs.event.onDOMReady(function(){
		questionsNode = kkjs.$("questions");
		kkjs.event.add(kkjs.$("addQuestion"), "click", function(){api.add();});
	});
	var api = {
		add: function _addQuestion(question, answer){
			var row = kkjs.node.create({
				tag: "tr",
				parentNode: questionsNode,
				childNodes: [
					{tag: "td", childNodes: [{tag: "span", innerHTML: "&#x2195", className: "handle"}]},
					{tag: "td", childNodes: [{tag: "input", name: "question[]", value: question}]},
					{tag: "td", childNodes: [{tag: "input", name: "answer[]", value: answer}]}
				]
			});
			row.question = kkjs.css.$("input[name^=question]", {node: row})[0];
			row.answer = kkjs.css.$("input[name^=answer]", {node: row})[0];
			lastQuestionRow = row;
			
			kkjs.event.add(row.answer, "blur", function(ev){
				if (this.parentNode.parentNode === lastQuestionRow && this.value){
					api.add();
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
						api.remove(row);
					}
				}]
			});
			kkjs.sortable.dragNDrop.unset(questionsNode);
			kkjs.sortable.dragNDrop.set(questionsNode, {handleSelector: "span.handle"});
		}.setDefaultParameter("", ""),
		remove: function removeQuestion(row){
			kkjs.node.remove(row);
			lastQuestionRow = questionsNode.rows[questionsNode.rows.length - 1];
		},
		removeAll: function removeAllQuestions(){
			while (questionsNode.rows.length){
				api.remove(questionsNode.rows[0]);
			}
		},
		get: function getQuestions(filter){
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
		}.setDefaultParameter(true)
	};
	return api;
}();

var solution = function(){
	var solutionNode;
	var display;
	kkjs.event.onDOMReady(function(){
		solutionNode = kkjs.$("solution");
		display = kkjs.$("solutionDisplay")
		kkjs.event.add(solutionNode, "input", api.display);
		kkjs.event.add(kkjs.$("placeSolution"), "click", api.place);
		api.display();
	});
	var api = {
		set: function(solution){
			solutionNode.value = solution;
			api.display();
		},
		get: function(){
			return solutionNode.value;
		},
		display: function(){
			kkjs.node.clear(display);
			var solution = Grid.normalizeWord(solutionNode.value, true);
			var normalisedSolution = Grid.normalizeWord(solutionNode.value);
			
			var start = true;
			for (var idx = 0, nIdx = 0; idx < solution.length; idx += 1){
				if (solution[idx] === normalisedSolution[nIdx]){
					kkjs.node.create({
						tag: "span",
						parentNode: display,
						className: "char" + (start? " start": ""),
						childNodes: [
							{
								tag: "span",
								className: "number",
								childNodes: (nIdx + 1).toString()
							},
							{
								tag: "span",
								className: "answer",
								childNodes: solution[idx]
							}
						]
					});
					nIdx += 1;
					start = false;
				}
				else {
					kkjs.node.create({
						tag: "span",
						parentNode: display,
						childNodes: solution[idx]
					});
					start = true;
				}
			}
		},
		place: function(){
			var lastGrid = grid.get();
			if (lastGrid){
				lastGrid.solution = [];
				var solution = Grid.normalizeWord(solutionNode.value);
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
	};
	return api;
}();

var grid = function(){
	var lastGrid = null;
	var lastTable = null;
	var api = {
		generate: function(){
			var q = questions.get();
			
			if (q.length === 0){
				alert("Keine W\xF6rter angegeben.");
				return;
			}
			
			kkjs.random.array.shuffle(q);
			
			var grid = Grid.create(q);
			
			
			if (grid){
				grid.trim();
				api.set(grid);
				solution.place();
			}
			else {
				alert("Kein zusammneh\xE4ngendes R\xE4tsel m\xF6glich.");
			}
		},
		display: function(){
			if (lastGrid){
				kkjs.node.clear(kkjs.$("schema"));
				kkjs.$("placeSolution").disabled =  !lastGrid;
				
				var list = kkjs.node.create({
					tag: "ol",
					parentNode: kkjs.$("schema")
				});
				questions.get().forEach(function(q){
					kkjs.node.create({
						tag: "li",
						parentNode: list,
						childNodes: [q.question]
					});
				});
				lastTable = lastGrid.createNode();
				kkjs.$("schema").appendChild(lastTable);
			}
		},
		get: function(){
			return lastGrid;
		},
		set: function(grid){
			lastGrid = grid;
			lastTable = null;
			api.display();
		},
		getCanvas: function(){
			return Grid.tableToCanvas(lastTable);
		}
	};
	return api;
}();


kkjs.event.onWindowLoad(function(){
	kkjs.event.add(kkjs.$("generate"), "click", grid.generate);
	
	
	kkjs.localFile.bounce.URL = "http://bounce.kkapsner.de/echoToDownload.php";
	kkjs.event.add(kkjs.$("saveImage"), "click", function(ev){
		if (grid.get()){
			kkjs.localFile.save("grid.png", {dataURL: grid.getCanvas().toDataURL()});
		}
	});
	kkjs.event.add(kkjs.$("save"), "click", function(){
		var lastGrid = grid.get();
		if (lastGrid){
			var data = {
				grid: lastGrid,
				questions: questions.get(),
				solution: solution.get()
			};
			kkjs.localFile.save("crossword.json", JSON.stringify(data), "application/json");
		}
	});
	
	function loadFilePromiseCallback(){
		var data = JSON.parse(this.content);
		questions.removeAll();
		
		solution.set(data.solution);
		data.questions.forEach(function(q){
			questions.add(q.question, q.answer);
		});
		
		grid.set(Grid.fromObject(data.grid));
	}
	kkjs.event.add(kkjs.$("load"), "click", function(){
		kkjs.localFile.load(loadFilePromiseCallback);
	});
	kkjs.localFile.enableFileDrop(document, loadFilePromiseCallback);
	
	kkjs.event.add(kkjs.$("displayAnswer"), ["change", "click"], function(){
		kkjs.css.className[this.checked? "add": "remove"](kkjs.$("schema"), "answered");
		kkjs.css.className[this.checked? "add": "remove"](kkjs.$("solutionDisplay"), "answered");
	}).fireEvent("click");
	
	kkjs.event.add(kkjs.$("hideNumbers"), ["change", "click"], function(){
		kkjs.css.className[this.checked? "add": "remove"](kkjs.$("schema"), "hideNumbers");
	}).fireEvent("click");
});

// cookie storage
kkjs.event.onWindowLoad(function(){
	questionsNode = kkjs.$("questions");
	solution.set(kkjs.cookie.getValue("crosswordSolution"));
	var data = kkjs.cookie.getValue("crosswordData");
	if (data){
		try {
			data = JSON.parse(data);
			data.forEach(function(q){
				questions.add(q.question, q.answer);
			});
			return;
		}
		catch(e){}
	}
	questions.add();
});
kkjs.event.add(window, "unload", function(){
	kkjs.cookie.setValue("crosswordData", JSON.stringify(questions.get(false)));
	kkjs.cookie.setValue("crosswordSolution", solution.get());
});

})();