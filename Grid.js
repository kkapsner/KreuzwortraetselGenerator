
var DIRECTION_RIGHT = 1;
var DIRECTION_DOWN = 2;
//var DIRECTION_LEFT = 4;
//var DIRECTION_UP = 8;

var Word = kkjs.oo.Base.extend(function Word(str, position, direction){
	this.str = str;
	this.position = position;
	this.direction = direction;
}).implement({
	clone: function clone(){
		var clone = new Word();
		clone.str = this.str;
		clone.direction = this.direction;
		clone.position = this.position.clone();
		return clone;
	}
});

var Grid = kkjs.NodeRepresentator.extend(function Grid(size){
	this.size = size.clone();
	this.data = new Array(size.width);
	this.directions = new Array(size.width);
	for (var i = size.width - 1; i >= 0; i--){
		this.data[i] = new Array(size.height);
		this.directions[i] = new Array(size.height);
		for (var j = size.height - 1; j >= 0; j--){
			this.data[i][j] = 0;
			this.directions[i][j] = DIRECTION_RIGHT | DIRECTION_DOWN;
		}
	}
	this.chars = {};
	this.words = [];
	
	for (var i = 0; i < 26; i++){
		var c = String.fromCharCode("a".charCodeAt(0) + i);
		this.chars[c] = [];
	};
	
	this.solution = [];
	
	this.boundingBox = new kkjs.Math.Range2D(Math.floor(size.width/2), Math.floor(size.width/2), Math.floor(size.height/2), Math.floor(size.height/2));
}).implement({
	toJSON: function(){
		return {size: this.size, words: this.words, solution: this.solution};
	},
	setField: function setField(value, pos, direction){
		this.boundingBox.expand(pos);
		if (this.data[pos.x][pos.y] !== value){
			this.data[pos.x][pos.y] = value;
			this.chars[value].push(pos.clone());
		}
		switch (direction){
			case DIRECTION_DOWN:
				this.directions[pos.x][pos.y] &= ~DIRECTION_DOWN;
				if (this.directions[pos.x - 1]){
					this.directions[pos.x - 1][pos.y] &= ~DIRECTION_DOWN;
				}
				if (this.directions[pos.x + 1]){
					this.directions[pos.x + 1][pos.y] &= ~DIRECTION_DOWN;
				}
				break;
			case DIRECTION_RIGHT:
				this.directions[pos.x][pos.y] &= ~DIRECTION_RIGHT;
				if (typeof this.directions[pos.x][pos.y - 1] !== "undefined"){
					this.directions[pos.x][pos.y - 1] &= ~DIRECTION_RIGHT;
				}
				if (typeof this.directions[pos.x][pos.y + 1] !== "undefined"){
					this.directions[pos.x][pos.y + 1] &= ~DIRECTION_RIGHT;
				}
				break;
		}
	},
	clone: function clone(){
		var clone = new Grid(this.size);
		for (var i = this.size.width - 1; i >= 0; i--){
			for (var j = this.size.height - 1; j >= 0; j--){
				clone.data[i][j] = this.data[i][j];
				clone.directions[i][j] = this.directions[i][j];
			}
		}
		for (var i = 0; i < 26; i++){
			var c = String.fromCharCode("a".charCodeAt(0) + i);
			var chars = this.chars[c];
			for (var j = chars.length - 1; j >= 0; j--){
				clone.chars[c][j] = new kkjs.Math.Vector2D(chars[j].x, chars[j].y);//chars[j].clone();
			}
		};
		clone.boundingBox = this.boundingBox.clone();
		for (var i = this.words.length - 1; i >= 0; i--){
			if (this.words[i]){
				clone.words[i] = this.words[i].clone();
			}
		}
		return clone;
	},
	addFirstWord: function(word, number){
		var l = word.length;
		var y = Math.floor(this.size.height / 2);
		var x0 = Math.floor(this.size.width / 2) - Math.floor(l/2);
		var pos = new kkjs.Math.Vector2D(x0, y);
		this.setWord(word, pos, DIRECTION_DOWN, number);
	},
	testWordPosition: function(word, position, direction){
		var l = word.length;
		switch (direction){
			case DIRECTION_RIGHT:
				var x0 = position.x;
				var y = position.y;
				if (this.data[x0 - 1][y] !== 0 || this.data[x0 + l][y] !== 0){
					return -1;
				}
				var sum = 0;
				for (var x = 0; x < l; x++){
					if (this.data[x0 + x][y] === word[x]){
						sum++;
					}
					else if (this.data[x0 + x][y] !== 0 || !(this.directions[x0 + x][y] & direction)){
						return -1;
					}
				}
				return sum;
			case DIRECTION_DOWN:
				var x = position.x;
				var y0 = position.y;
				if (this.data[x][y0 - 1] !== 0 || this.data[x][y0 + l] !== 0){
					return -1;
				}
				var sum = 0;
				for (var y = 0; y < l; y++){
					if (this.data[x][y0 + y] === word[y]){
						sum++;
					}
					else if (this.data[x][y0 + y] !== 0 || !(this.directions[x][y0 + y] & direction)){
						return -1;
					}
				}
				return sum;
		}
	},
	setWord: function(word, pos, direction, number){
		var pos1 = pos.clone();
		var l = word.length
		switch (direction){
			case DIRECTION_RIGHT:
				for (var x = 0; x < l; x++){
					pos1.x = pos.x + x;
					this.setField(word[x], pos1, direction);
				}
				if (this.directions[pos.x - 1]){
					this.directions[pos.x - 1][pos.y] = 0;
				}
				if (this.directions[pos.x + l]){
					this.directions[pos.x + l][pos.y] = 0;
				}
				break;
			case DIRECTION_DOWN:
				for (var y = 0; y < l; y++){
					pos1.y = pos.y + y;
					this.setField(word[y], pos1, direction);
				}
				if (typeof this.directions[pos.x][pos.y - 1] !== "undefined"){
					this.directions[pos.x][pos.y - 1] = 0;
				}
				if (typeof this.directions[pos.x][pos.y + l] !== "undefined"){
					this.directions[pos.x][pos.y + l] = 0;
				}
				break;
		}
		if (typeof number !== "undefined"){
			this.words[number] = new Word(word, pos, direction);
		}
		else {
			this.words.push(new Word(word, pos, direction));
		}
	},
	getPossiblePositions: function(word){
		var ret = [];
		var This = this;
		word.forEach(function(c, i){
			This.chars[c].forEach(function(p){
				p = p.clone();
				var dir = This.directions[p.x][p.y];
				switch (dir){
					case DIRECTION_RIGHT:
						p.x -= i;
						break;
					case DIRECTION_DOWN:
						p.y -= i;
						break;
					default:
						return;
				}
				var sum = This.testWordPosition(word, p, dir);
				
				if (sum > 0){
					ret.push({position: p, direction: dir, sum: sum});
				}
			});
		});
		ret.sort(function(a, b){
			a = a.sum;
			b = b.sum;
			return a > b? -1: a < b? 1: 0;
		});
		return ret;
	},
	
	trim: function(){
		var newWidth = this.boundingBox.rangeX.max - this.boundingBox.rangeX.min + 1;
		var newHeight = this.boundingBox.rangeY.max - this.boundingBox.rangeY.min + 1;
		this.size.width = newWidth;
		this.size.height = newHeight;
		this.data = this.data.splice(this.boundingBox.rangeX.min, newWidth);
		this.directions = this.directions.splice(this.boundingBox.rangeX.min, newWidth);
		for (var x = 0; x < this.size.width; x++){
			this.data[x] = this.data[x].splice(this.boundingBox.rangeY.min, newHeight);
			this.directions[x] = this.directions[x].splice(this.boundingBox.rangeY.min, newHeight);
		}
		var offset = new kkjs.Math.Vector2D(this.boundingBox.rangeX.min, this.boundingBox.rangeY.min);
		var This = this;
		"abcdefghijklmnopqrstuvwxyz".forEach(function(c){
			This.chars[c].forEach(function(v){
				v.sub(offset);
			});
		});
		this.words.forEach(function(word){
			word.position.sub(offset);
		});
		this.solution.forEach(function(sol){
			sol.sub(offset);
		});
		this.boundingBox = new kkjs.Math.Range2D(0, newWidth - 1, 0, newHeight - 1);
	},
	
	getFieldCount: function(){
		return this.data.reduce(function(sum, row){return row.reduce(function(sum, cell){return sum + (cell === 0? 0: 1)}, sum);}, 0);
	},
	// NodeRepresentator interface
	_createNode: function(){
		var table = kkjs.node.create({tag: "table"});
		for (var y = 0; y < this.size.height; y++){
			var row = kkjs.node.create({tag: "tr", parentNode: table});
			for (var x = 0; x < this.size.width; x++){
				var cell = kkjs.node.create({
					tag: "td",
					parentNode: row
				});
				var wrapper = kkjs.node.create({
					tag: "div",
					parentNode: cell,
					className: "wrapper",
				});
				cell.nodes = [
					kkjs.node.create({tag: "span", className: "answer", parentNode: wrapper}),
					kkjs.node.create({tag: "span", className: "wordNumber horizontal", parentNode: wrapper}),
					kkjs.node.create({tag: "span", className: "wordNumber vertical", parentNode: wrapper}),
					kkjs.node.create({tag: "span", className: "solution", parentNode: wrapper}),
				];
			}
		}
		this._updateNode(table);
		return table;
	},
	_updateNode: function(node){
		for (var y = 0; y < this.size.height; y++){
			var row = node.rows[y];
			for (var x = 0; x < this.size.width; x++){
				var cell = row.cells[x];
				cell.nodes[0].innerHTML = "";
				cell.nodes[1].innerHTML = "";
				cell.nodes[2].innerHTML = "";
				cell.nodes[3].innerHTML = "";
				cell.className =  "";
			}
		}
		this.words.forEach(function(word, i){
			var l = word.str.length;
			switch (word.direction){
				case DIRECTION_RIGHT:
					var x0 = word.position.x;
					var row = node.rows[word.position.y];
					kkjs.css.className.add(row.cells[x0], "directionRightStart");
					kkjs.css.className.add(row.cells[x0 + l - 1], "directionRightEnd");
					for (var x = 0; x < l; x++){
						var cell = row.cells[x0 + x];
						cell.nodes[0].innerHTML = word.str[x].toUpperCase();
						kkjs.css.className.add(cell, "directionRight filled");
					}
					break;
				case DIRECTION_DOWN:
					var x = word.position.x;
					var y0 = word.position.y;
					kkjs.css.className.add(node.rows[y0].cells[x], "directionDownStart");
					kkjs.css.className.add(node.rows[y0 + l - 1].cells[x], "directionDownEnd");
					for (var y = 0; y < l; y++){
						var cell = node.rows[y0 + y].cells[x];
						cell.nodes[0].innerHTML = word.str[y].toUpperCase();
						kkjs.css.className.add(cell, "directionDown filled");
					}
					break;
			}
			node.rows[word.position.y].cells[word.position.x].nodes[word.direction].innerHTML = i + 1;
		});
		this.solution.forEach(function(p, i){
			var cell = node.rows[p.y].cells[p.x];
			kkjs.css.className.add(cell, "solution");
			cell.nodes[3].innerHTML = i + 1;
		})
	}
}).implementStatic({
	fromObject: function(obj){
		var grid = new Grid(new kkjs.Math.Dimension(obj.size.width, obj.size.height));
		obj.words.forEach(function(word, i){
			grid.setWord(word.str, new kkjs.Math.Vector2D(word.position.x, word.position.y), word.direction, i);
		});
		grid.solution = obj.solution.map(function(pos){
			return new kkjs.Math.Vector2D(pos.x, pos.y);
		});
		return grid;
	},
	normalizeWord: function(word, keepWrong){
		word = word.toLowerCase().replace(/\xE4/g, "ae").replace(/\xF6/g, "oe").replace(/\xFC/g, "ue").replace(/\xDF/g, "ss");
		if (!keepWrong){
			word = word.replace(/[^a-z]/g, "");
		}
		return word;
	},
	create: function(questions){
		var maxSize = questions.reduce(function(r, question){return r + Grid.normalizeWord(question.answer).length;}, 0) + 2;

		var grid = new Grid(new kkjs.Math.Dimension(maxSize, maxSize));
		grid.addFirstWord(Grid.normalizeWord(questions[0].answer), questions[0].number);


		var bestGrid = null;
		var bestScore = maxSize;

		function recursion(grid, remainingQuestions){
			if (!bestGrid){
				var l = remainingQuestions.length;
				if (l === 0){
					var score = grid.getFieldCount();
					if (score < bestScore){
						bestGrid = grid;
					}
				}
				else {
					for (var i = 0; i < l && !bestGrid; i++){
					//var i = 0;
						var questions = remainingQuestions.slice();
						var question = questions[i];
						questions.splice(i, 1);
						var pos = grid.getPossiblePositions(Grid.normalizeWord(question.answer));
						for (var j = 0; j < pos.length && !bestGrid; j++){
							var wGrid = grid.clone();
							wGrid.setWord(Grid.normalizeWord(question.answer), pos[j].position, pos[j].direction, question.number);
							recursion(wGrid, questions);
						}
					}
				}
			}
		}

		recursion(grid, questions.slice(1));
		
		return bestGrid;
	},
	tableToCanvas: function(table){
		var cellSize = table.rows[0].cells[0].offsetWidth;
		var thinStroke = 2;
		var thickStroke = 4;
		
		function p(x){
			return x * cellSize + thickStroke / 2;
		}
		function border(x, y, side){
			var x1, x2, y1, y2;
			switch (side){
				case "top"   : x1 = x; y1 = y; x2 = x + 1; y2 = y; break;
				case "left"  : x1 = x + 1; y1 = y; x2 = x + 1; y2 = y + 1; break;
				case "bottom": x1 = x; y1 = y + 1; x2 = x + 1; y2 = y + 1; break;
				case "right" : x1 = x; y1 = y; x2 = x; y2 = y + 1; break;
			}
			context.beginPath();
			context.moveTo(p(x1), p(y1));
			context.lineTo(p(x2), p(y2));
			context.stroke();
		}
		function drawNodeText(node, x, y, xOffset, yOffset){
			var text = node.textContent.trim();
			if (text){
				var oldFill = context.fillStyle;
				context.font = kkjs.css.get(node, "font");
				context.fillStyle = kkjs.css.get(node, "color");
				context.fillText(text, p(x) + (xOffset || 0), p(y) + (yOffset || 0));
				context.fillStyle = oldFill;
			}
		}
		function drawCell(cell, x, y){
			context.font = kkjs.css.get(cell, "font");
			context.lineWidth = thinStroke;
			if (kkjs.css.className.has(cell, "solution")){
				context.fillStyle = "#AAAAAA";
				context.fillRect(p(x), p(y), cellSize, cellSize);
				context.fillStyle = "black";
			}
			if (kkjs.css.className.has(cell, "filled")){
				context.strokeRect(p(x), p(y), cellSize, cellSize);
			}
			context.lineWidth = thickStroke;
			var down = kkjs.css.className.has(cell, "directionDown");
			var right = kkjs.css.className.has(cell, "directionRight");
			if (kkjs.css.className.has(cell, "directionDownStart") || (right && !down)){
				border(x, y, "top");
			}
			if (kkjs.css.className.has(cell, "directionRightStart") || (!right && down)){
				border(x, y, "right");
			}
			if (kkjs.css.className.has(cell, "directionDownEnd") || (right && !down)){
				border(x, y, "bottom");
			}
			if (kkjs.css.className.has(cell, "directionRightEnd") || (!right && down)){
				border(x, y, "left");
			}
			context.textAlign = "center";
			context.textBaseline = "middle";
			if (kkjs.css.get(cell.nodes[0], "display") !== "none"){
				drawNodeText(cell.nodes[0],x + 0.5, y + 0.5);
			}
			else {
				drawNodeText(cell.nodes[3], x + 0.5,y + 0.5);
			}
			if (kkjs.css.get(cell.nodes[1], "display") !== "none"){
				context.textAlign = "left";
				drawNodeText(cell.nodes[1], x, y + 0.5, 1);
			}
			if (kkjs.css.get(cell.nodes[2], "display") !== "none"){
				context.textAlign = "center";
				context.textBaseline = "top";
				drawNodeText(cell.nodes[2], x + 0.5, y, 0, 1);
			}
		}
		var canvas = kkjs.node.create({
			tag: "canvas",
			height: table.rows.length * cellSize + thickStroke,
			width: table.rows[0].cells.length * cellSize + thickStroke,
		});
		var context = canvas.getContext("2d");
		context.lineCap = "round";
		[].forEach.call(table.rows, function(row, y){
			[].forEach.call(row.cells, function(cell, x){
				drawCell(cell, x, y);
			});
		});
		return canvas;
	},
});