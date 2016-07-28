// @author dfmcfhf (dfmchfhf@gmail.com)
// @description a tool to solve the potionology event on DFOg

var div;
var step;
var hist;
var normIngredients;

var ingredients = [
  ["img/ing0.png", "Coral's Fishbowl Water"],
  ["img/ing1.png", "Marlene Kitzka's Dish"],
  ["img/ing2.png", "Albert's Handsomeness"],
  ["img/ing3.png", "Pungjin's Hair"],
  ["img/ing4.png", "Grubeck's Toenail"],
  ["img/ing5.png", "Kiri's Favorite Weapon"],
];
var remainingIngredients;

var results = [
  ["img/pot0.png", "Red Potion"],
  ["img/pot1.png", "Blue Potion"],
  ["img/pot2.png", "Purple Potion"],
  ["img/pot3.png", "Poison"],
];

var elements = [
  ["img/ele0.png", "Fire"],
  ["img/ele1.png", "Water"],
  ["img/ele2.png", "Light"],
  ["img/ele3.png", "Shadow"],
];

var order;

if (!Array.prototype.back) {
  Array.prototype.back = function() {
    return this[this.length - 1];
  };
  Object.defineProperty(Array.prototype, "back", {enumerable: false});
}
if (!Array.prototype.equals) {
  Array.prototype.equals = function (array) {
    if (!array || this.length != array.length) {
      return false;
    }

    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] instanceof Array && array[i] instanceof Array) {
        if (!this[i].equals(array[i]))
          return false;
      }
      else if (this[i] != array[i]) {
        return false;
      }
    }
    return true;
  }
  Object.defineProperty(Array.prototype, "equals", {enumerable: false});
}

function getImg(src, alt) {
  var img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  return img;
}

function getMatSelector(ingredientIds) {
  var selDiv = document.createElement("span");
  selDiv.id = "matSel";
  for (ingredientId of ingredientIds) {
    var ingredient = getImg.apply(this, ingredients[ingredientId]);
    ingredient.onclick = function(id) { return function() { next({id: id}); }; } (ingredientId);
    selDiv.appendChild(ingredient);
  }
  return selDiv;
}

function getResSelector(resultIds) {
  var selDiv = document.createElement("span");
  selDiv.id = "resSel";
  for (resultId of resultIds) {
    var result = getImg.apply(this, results[resultId]);
    result.onclick = function(id) { return function() { next({id: id}); }; } (resultId);
    selDiv.appendChild(result);
  }
  return selDiv;
}

function getSingleGuess(id, guessState, num) {
  if (!guessState) {
    return getImg.apply(this, ingredients[id]);
  } else {
    var span = document.createElement("span");
    var img = document.createElement("label");
    img.appendChild(getImg.apply(this, ingredients[id]));
    var check = document.createElement("input");
    check.type = "checkbox";
    check.id = "gc[" + num + "]";
    img.setAttribute("for", check.id);
    span.appendChild(img);
    span.appendChild(check);
    return span;
  }
}

function getGuess(normIds, ord, guessStates) {
  if (typeof(guessStates) === 'undefined') {
    guessStates = false;
  }
  if (typeof(guessStates) === 'boolean' || typeof(guessStates) === 'number') {
    guessStates = [guessStates,guessStates,guessStates,guessStates,guessStates,guessStates];
  }
  var guessDiv = document.createElement("div");
  guessDiv.id = "guess";
  guessDiv.appendChild(getImg.apply(this, elements[0]));
  guessDiv.appendChild(document.createTextNode(" : "));
  guessDiv.appendChild(getSingleGuess(normIds[ord[0]], guessStates[0], 0));
  guessDiv.appendChild(document.createTextNode(" , "));
  guessDiv.appendChild(getSingleGuess(normIds[ord[1]], guessStates[1], 1));
  guessDiv.appendChild(document.createElement("br"));
  guessDiv.appendChild(getImg.apply(this, elements[1]));
  guessDiv.appendChild(document.createTextNode(" : "));
  guessDiv.appendChild(getSingleGuess(normIds[ord[2]], guessStates[2], 2));
  guessDiv.appendChild(document.createTextNode(" , "));
  guessDiv.appendChild(getSingleGuess(normIds[ord[3]], guessStates[3], 3));
  guessDiv.appendChild(document.createElement("br"));
  guessDiv.appendChild(getImg.apply(this, elements[2]));
  guessDiv.appendChild(document.createTextNode(" : "));
  guessDiv.appendChild(getSingleGuess(normIds[ord[4]], guessStates[4], 4));
  guessDiv.appendChild(document.createElement("br"));
  guessDiv.appendChild(getImg.apply(this, elements[3]));
  guessDiv.appendChild(document.createTextNode(" : "));
  guessDiv.appendChild(getSingleGuess(normIds[ord[5]], guessStates[5], 5));

  if (guessStates.some(function(x) { return x; })) {
    guessDiv.appendChild(document.createElement("br"));
    var nextLink = document.createElement("a");
    nextLink.textContent = "next";
    nextLink.onclick = function() {
      for (var i = 0; i < 6; ++i) {
        if (document.getElementById("gc[" + i + "]")) {
          document.getElementById("gc[" + i + "]").disabled = true;
        }
      }
      nextLink.remove();
      div.appendChild(document.createElement("br"));
      next();
    }
    guessDiv.appendChild(nextLink);
  }

  return guessDiv;
}
function getGuessStatus() {
  result = [];
  for (var i = 0; i < 6; ++i) {
    result.push(document.getElementById("gc[" + i + "]") ? document.getElementById("gc[" + i + "]").checked : true);
  }
  return result;
}

function sadness() {
  div.appendChild(document.createTextNode("something went wrong, you shouldn't get here :o("));
}

function next(args) {
  if (step < 1000) {
    switch(step++) {
      case 0:
        div.appendChild(document.createTextNode("combine any 2 ingredients:"));
        div.appendChild(document.createElement("br"));
        div.appendChild(getMatSelector(remainingIngredients));
        break;
      case 1:
      case 4:
        document.getElementById("matSel").remove();
        remainingIngredients.splice(remainingIngredients.indexOf(args.id),1);
        div.appendChild(getImg.apply(this, ingredients[args.id]));
        div.appendChild(document.createTextNode(" + "));
        div.appendChild(getMatSelector(remainingIngredients));
        hist.push([args.id]);
        break;
      case 2:
      case 5:
      case 7:
        document.getElementById("matSel").remove();
        remainingIngredients.splice(remainingIngredients.indexOf(args.id),1);
        div.appendChild(getImg.apply(this, ingredients[args.id]));
        div.appendChild(document.createTextNode(" = "));
        div.appendChild(getResSelector([0,1,2,3]));
        hist.back().push(args.id);
        break;
      case 3:
        document.getElementById("resSel").remove();
        div.appendChild(getImg.apply(this, results[args.id]));
        div.appendChild(document.createElement("br"));
        div.appendChild(document.createElement("br"));
        div.appendChild(document.createTextNode("combine 2 new ingredients:"));
        div.appendChild(document.createElement("br"));
        div.appendChild(getMatSelector(remainingIngredients));
        hist.back().push(args.id);
        break;
      case 6:
        document.getElementById("resSel").remove();
        div.appendChild(getImg.apply(this, results[args.id]));
        div.appendChild(document.createElement("br"));
        div.appendChild(document.createElement("br"));
        hist.back().push(args.id);
        if (hist[0].back() > hist[1].back()) {
          [hist[0], hist[1]] = [hist[1], hist[0]];
        }
        var pairResults = [hist[0][2], hist[1][2]];
        if (pairResults.equals([0,1]) || pairResults.equals([0,2]) || pairResults.equals([1,2])) {
          hist.push([hist[0][0]]);
          div.appendChild(document.createTextNode("combine a new ingredient with " + ingredients[hist[0][0]][1] + ":"));
          div.appendChild(document.createElement("br"));
          div.appendChild(getImg.apply(this, ingredients[hist[0][0]]));
          div.appendChild(document.createTextNode(" + "));
          div.appendChild(getMatSelector(remainingIngredients));
        } else {
          normIngredients = [hist[0][0], hist[0][1], hist[1][0], hist[1][1], remainingIngredients[0], remainingIngredients[1]];
          step = 10000 + pairResults[0] * 1000 + pairResults[1] * 100;
        }
        break;
      case 8:
        document.getElementById("resSel").remove();
        div.appendChild(getImg.apply(this, results[args.id]));
        div.appendChild(document.createElement("br"));
        hist.back().push(args.id);
        normIngredients = [hist[0][0], hist[0][1], hist[1][0], hist[1][1], hist[2][1], remainingIngredients[0]];
        step = 10000 + hist[0][2] * 1000 + hist[1][2] * 100 + hist[2][2] * 10;
        break;
    }
  }
  if (step >= 1000) {
    if (step % 10 == 1) {
      if (getGuessStatus().equals([1,1,1,1,1,1])) {
        div.appendChild(document.createElement("br"));
        div.appendChild(document.createTextNode("you got it!"));
        return;
      } else {
        div.appendChild(document.createTextNode("this should be the solution:"));
      }
    } else if (step % 10 == 0) {
      div.appendChild(document.createTextNode("we can now make a guess (check ingredients which are correct):"));
    }
    div.appendChild(document.createElement("br"));

    var guessStates = false;
    var guessStatus = getGuessStatus();
    switch(step++) {
      case 10000:
        order = [0,3,1,5,2,4];
        guessStates = true;
        break;
      case 10001:
        if (guessStatus[3] != guessStatus[5] || guessStatus[0] == guessStatus[1] || (guessStatus[0] && guessStatus[2]) || (guessStatus[1] && guessStatus[4])) {
          sadness();
          return;
        }
        if (!guessStatus[3]) {
          [order[3],order[5]] = [order[5],order[3]];
        }
        if (!guessStatus[0]) {
          [order[0],order[4]] = [order[4],order[0]];
          if (!guessStatus[2]) {
            [order[2],order[4]] = [order[4],order[2]];
          }
        } else {
          [order[1],order[2]] = [order[2],order[1]];
          if (!guessStatus[4]) {
            [order[2],order[4]] = [order[4],order[2]];
          }
        }
        break;
      case 10300:
        order = [0,1,4,5,2,3];
        guessStates = [0,0,0,0,1,1];
        break;
      case 11300:
        order = [4,5,0,1,3,2];
        guessStates = [0,0,0,0,1,1];
        break;
      case 10301:
      case 11301:
        if (guessStatus.equals([1,1,1,1,0,0])) {
          [order[4],order[5]] = [order[5],order[4]];
        } else {
          sadness();
          return;
        }
        break;
      case 11100:
        order = [1,5,0,3,4,2];
        guessStates = true;
        break;
      case 11101:
        if (guessStatus[1] != guessStatus[4] || guessStatus[2] == guessStatus[3] || (guessStatus[2] && guessStatus[0]) || (guessStatus[3] && guessStatus[5])) {
          sadness();
          return;
        }
        if (!guessStatus[1]) {
          [order[1],order[4]] = [order[4],order[1]];
        }
        if (!guessStatus[2]) {
          [order[2],order[5]] = [order[5],order[2]];
          if (!guessStatus[0]) {
            [order[0],order[5]] = [order[5],order[0]];
          }
        } else {
          [order[3],order[0]] = [order[0],order[3]];
          if (!guessStatus[5]) {
            [order[0],order[5]] = [order[5],order[0]];
          }
        }
        break;
      case 12200:
        order = [0,2,1,3,4,5];
        guessStates = true;
        break;
      case 12300:
        order = [0,4,1,5,2,3];
        guessStates = true;
        break;
      case 12201:
      case 12301:
        if (guessStatus[0] != guessStatus[2] || guessStatus[1] != guessStatus[3] || guessStatus[4] != guessStatus[5]) {
          sadness();
          return;
        } else {
          if (!guessStatus[0]) {
            [order[0],order[2]] = [order[2],order[0]];
          }
          if (!guessStatus[1]) {
            [order[1],order[3]] = [order[3],order[1]];
          }
          if (!guessStatus[4]) {
            [order[4],order[5]] = [order[5],order[4]];
          }
        }
        break;
      case 13300:
        sadness();
        return;

      case 10200:
        order = [1,2,4,3,0,5];
        guessStates = [1,1,1,1,0,0];
        break;
      case 10210:
        order = [0,2,5,3,1,4];
        guessStates = [1,1,1,1,0,0];
        break;
      case 10220:
        order = [0,2,4,3,1,5];
        guessStates = [1,1,1,1,0,0];
        break;
      case 10230:
        order = [1,2,5,3,0,4];
        guessStates = [1,1,1,1,0,0];
        break;
      case 11200:
        order = [5,3,0,2,4,1];
        guessStates = [1,1,1,1,0,0];
        break;
      case 11210:
        order = [4,3,1,2,5,0];
        guessStates = [1,1,1,1,0,0];
        break;
      case 11220:
        order = [4,3,0,2,5,1];
        guessStates = [1,1,1,1,0,0];
        break;
      case 11230:
        order = [5,3,1,2,4,0];
        guessStates = [1,1,1,1,0,0];
        break;
      case 10201:
      case 10211:
      case 10221:
      case 10231:
      case 11201:
      case 11211:
      case 11221:
      case 11231:
        if (guessStatus[0] != guessStatus[2] || guessStatus[1] != guessStatus[3]) {
          sadness();
          return;
        }
        if (!guessStatus[0]) {
          [order[0],order[2]] = [order[2],order[0]];
        }
        if (!guessStatus[1]) {
          [order[1],order[3]] = [order[3],order[1]];
        }
        break;

      case 10100:
        order = [1,3,4,5,0,2];
        guessStates = true;
        break;
      case 10101:
        if (guessStatus[0]) {
          if (guessStatus[1]) {
            sadness();
            return;
          } else {
            var val = (guessStatus[2] ? 1 << 3 : 0) + (guessStatus[3] ? 1 << 2 : 0) + (guessStatus[4] ? 1 << 1 : 0) + (guessStatus[5] ? 1 : 0);
            switch(val) {
              case 0:
                order = [1,0,2,3,4,5];
                break;
              case 2:
                order = [1,4,2,3,0,5];
                break;
              case 4:
                order = [1,0,2,5,4,3];
                break;
              case 5:
                order = [1,0,3,5,4,2];
                break;
              case 6:
                order = [1,4,2,5,0,3];
                break;
              case 7:
                order = [1,4,3,5,0,2];
                break;
              case 10:
                order = [1,5,4,2,0,3];
                break;
              case 11:
                order = [1,5,4,3,0,2];
                break;
              case 14:
                order = [1,2,4,5,0,3];
                break;
              default:
                sadness();
                return;
            }
          }
        } else {
          if (guessStatus[1]) {
            if (guessStatus.equals([0,1,1,0,1,1])) {
              order = [5,3,4,1,0,2];
            } else if (guessStatus.equals([0,1,0,1,1,1])) {
              order = [4,3,1,5,0,2];
            } else {
              sadness();
              return;
            }
          } else {
            var val = (guessStatus[2] ? 1 << 3 : 0) + (guessStatus[3] ? 1 << 2 : 0) + (guessStatus[4] ? 1 << 1 : 0) + (guessStatus[5] ? 1 : 0);
            switch(val) {
              case 0:
                order = [0,4,2,3,1,5];
                break;
              case 2:
                order = [4,5,1,2,0,3];
                break;
              case 3:
                order = [4,5,1,3,0,2];
                break;
              case 4:
                order = [0,4,2,5,1,3];
                break;
              case 5:
                order = [0,4,3,5,1,2];
                break;
              case 6:
                order = [2,4,1,5,0,3];
                break;
              case 10:
                order = [2,5,4,1,0,3];
                break;
              default:
                sadness();
                return;
            }
          }
        }
        break;
      case 10110:
        order = [3,5,0,4,1,2];
        guessStates = true;
        break;
      case 10111:
        if (guessStatus[0] != guessStatus[5] && guessStatus[1] != guessStatus[4] || guessStatus[2] != guessStatus[3] || (guessStatus[0] && !guessStatus[2]) || (guessStatus[2] && !guessStatus[1])) {
          sadness();
          return;
        }
        if (!guessStatus[1]) {
          [order[1],order[4]] = [order[4],order[1]];
        }
        if (!guessStatus[0]) {
          [order[0],order[5]] = [order[5],order[0]];
        }
        if (!guessStatus[2]) {
          [order[0],order[2],order[3],order[5]] = [order[2],order[0],order[5],order[3]];
        }
        break;
      case 10120:
        order = [0,3,4,5,1,2];
        guessStates = true;
        break;
      case 10121:
        if (!guessStatus.equals([0,1,0,1,1,1]) && (guessStatus[1] || guessStatus[0] != guessStatus[2] || (guessStatus[3] && guessStatus[5]) || (!guessStatus[4] && (guessStatus[3] || (guessStatus[5] && !guessStatus[0]))))) {
          sadness();
          return;
        }
        if (!guessStatus[0]) {
          [order[0],order[2]] = [order[2],order[0]];
        }
        if (!guessStatus[4]) {
          [order[3],order[4]] = [order[4],order[3]];
        }
        if (!guessStatus[5]) {
          [order[1],order[5]] = [order[5],order[1]];
        }
        if (!guessStatus[3]) {
          [order[1],order[3]] = [order[3],order[1]];
        }
        break;
      case 10130:
        order = [1,5,2,3,0,4];
        break;
    }
    div.appendChild(getGuess(normIngredients, order, guessStates));
  }
}

function reset() {
  div = document.getElementById("procedureDiv");
  step = 0;
  remainingIngredients = [0,1,2,3,4,5];
  hist = [];
  normIngredients = [];
  order = [];
  next();
}
