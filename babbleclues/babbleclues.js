class WordDFA {
  constructor(letters, words) {
    this.alphabet = letters;
    this.accepts = new Set();
    this.transitions = [new Array(this.alphabet.length).fill(0), new Array(this.alphabet.length).fill(0)];
    for (const word of words) {
      let state = 1;
      for (const c of word) {
        let cind = this.alphabet.indexOf(c);
        if (cind == -1) {
          throw 'Error: "' + word + '" contains "' + c + '", a letter not in the alphabet';
        }
        if (this.transitions[state][cind] == 0) {
          this.transitions[state][cind] = this.transitions.length;
          this.transitions.push(new Array(this.alphabet.length).fill(0));
        }
        state = this.transitions[state][cind];
      }
      this.accepts.add(state);
    }
  }
  static loadFromJson(obj) {
    let worddfa = new WordDFA(obj.alphabet, []);
    worddfa.accepts = new Set(obj.accepts);
    worddfa.transitions = obj.transitions;
    return worddfa;
  }
  lookUpLetter(c) {
    if (!this.alphabet.includes(c)) {
      throw 'Error: "' + c + '" is not a letter in the alphabet.';
    }
    return this.alphabet.indexOf(c);
  }
  advanceState(word, state = 1) {
    return word && state ? this.advanceState(word.slice(1), this.transitions[state][this.lookUpLetter(word[0])]) : state;
  }
  isPrefix(word, state = 1) {
    return word && state ? this.isPrefix(word.slice(1), this.transitions[state][this.lookUpLetter(word[0])]) : this.transitions[state].filter((x) => x != 0).length != 0;
  }
  isWord(word, state = 1) {
    return this.accepts.has(this.advanceState(word, state));
  }
  * genWords(state = 1, prefix = '') {
    if (this.isWord('', state)) {
      yield prefix;
    }
    if (this.isPrefix('', state)) {
      for (let i = 0; i < this.alphabet.length; ++i) {
        yield* this.getWords(this.transitions[state][i], prefix + this.alphabet[i]);
      }
    }
  }
  getWords(state = 1, prefix = '') {
    return new Set(this.genWords(state, prefix));
  }
}

function scoreBabbleRaw(word, base = 0) {
  const babbleScores = {'a': 1, 'b': 3, 'c': 2, 'd': 2, 'e': 1, 'f': 4, 'g': 3,
                        'h': 2, 'i': 1, 'j': 6, 'k': 5, 'l': 1, 'm': 2, 'n': 1,
                        'o': 1, 'p': 2, 'q': 3, 'r': 1, 's': 1, 't': 1, 'u': 2,
                        'v': 4, 'w': 5, 'x': 6, 'y': 3, 'z': 6};
  return word.split('').reduce((a, c) => a += babbleScores[c], base);
}

function hashFNV1a_32(str, seed = 0x811c9dc5) {
  let hval = seed;
  for (const c of str) {
    hval ^= c.charCodeAt(0);
    hval *= 0x01000193
  }
  return hval & 0xffff;
}
function HASH(str) {
  return str.slice(0, 2) + hashFNV1a_32(str);
}

class LetterGrid {
  constructor(letters, dict) {
    this.letters = letters.map(l => l == 'q' ? 'qu' : l);
    this.dict = dict;
  }
  findAllWords() {
    return new Set(this.genAllWords());
  }
  * genAllWords() {
    for (let i = 0; i < this.letters.length; ++i) {
      yield* this.genWordsFrom(i);
    }
  }
  * genNeighbours(ind) {
    let dxs = [0];
    let dys = [0];
    ind % 5 == 0 || dxs.push(-1);
    ind % 5 == 4 || dxs.push( 1);
    ind <= 4 || dys.push(-5);
    ind >= 20 || dys.push(5);
    for (const dx of dxs) {
      for (const dy of dys) {
        if (dx || dy) { yield ind + dx + dy; }
      }
    }
  }
  * genWordsFrom(i, visited = 0, state = 1, prev = '') {
    visited |= 1 << i;
    prev += this.letters[i];
    state = this.dict.advanceState(this.letters[i], state);
    if (this.dict.isWord('', state) && prev.length >= 4) { yield prev; }
    if (this.dict.isPrefix('', state)) {
      for (const nx of this.genNeighbours(i)) {
        if (visited & 1 << nx) { continue; }
        yield* this.genWordsFrom(nx, visited, state, prev);
      }
    }
  }
}

class PageLoader {
  constructor() {
    this.dict = null;
    this.letters = null;
    this.grid = null;
  }
  load() {
    this.loadDict();
    this.loadGrid();
  }
  loadDict() {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if ((xhr.status == 200 || xhr.status == 0) && xhr.readyState == 4) {
        this.dict = WordDFA.loadFromJson(JSON.parse(xhr.responseText));
        this.loadClues();
      }
    };
    xhr.open('GET', 'bwl.dfa');
    xhr.send();
  }
  loadGrid() {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if ((xhr.status == 200 || xhr.status == 0) && xhr.readyState == 4) {
        try {
          const res = xhr.responseText;
          const doc = new DOMParser().parseFromString(res, 'text/html');
          const gridTable = doc.getElementById('left_column').getElementsByTagName('table')[0];
          this.letters = Array.from(gridTable.getElementsByTagName('img')).map(img => img.src.slice(-5)[0]);
        } catch (e) {
          this.letters = 'aaaaaaaaaaaaaaaaaaaaaaaaa'.split('');
        }
        this.loadClues();
      }
    };
    xhr.open('GET', 'https://cors-anywhere.herokuapp.com/http://www.playbabble.com');
    xhr.setRequestHeader('X-Requested-With','XMLHttpRequest')
    xhr.send();
  }
  loadClues() {
    if (!this.letters || !this.dict) {
      return;
    }
    this.grid = new LetterGrid(this.letters, this.dict);
    let foundWords = Array(...this.grid.findAllWords()).sort();
    const foundWordsCount = foundWords.length;
    let cbs = {};
    const clueList = document.createElement('div');
    const correctCountSpan = document.createElement('span');
    clueList.classList.add('cluelist');
    let prev = null;
    for (const word of foundWords) {
      const cur = word.slice(0, 2);
      prev = prev || cur;
      if (prev != cur) {
        let sep = document.createElement('div');
        sep.classList.add(prev[0] == cur[0] ? 'minisep' : 'majsep');
        clueList.appendChild(sep);
        prev = cur;
      }
      const hsh = HASH(word);
      const score = scoreBabbleRaw(word) * (word.length - 3);
      const clue = cur + word.length + ',' + score;
      const clueWrapper = document.createElement('div');
      clueWrapper.classList.add('clue');
      const clueLabel = document.createElement('label');
      clueLabel.appendChild(document.createTextNode(clue));
      clueWrapper.appendChild(clueLabel);
      const clueBox = document.createElement('input');
      clueBox.id = clueLabel.htmlFor = 'clue' + hsh;
      clueBox.placeholder = cur;
      clueBox.addEventListener('change', e => {
        if (!clueBox.value) {
          clueWrapper.classList.remove('correct', 'wrong');
        } else if (clueBox.value.toLowerCase() == word) {
          clueWrapper.classList.add('correct');
          clueWrapper.classList.remove('wrong');
        } else {
          clueWrapper.classList.add('wrong');
          clueWrapper.classList.remove('correct');
        }
        correctCountSpan.innerText = document.getElementsByClassName('clue correct').length;
      });
      clueWrapper.appendChild(clueBox);
      clueList.appendChild(clueWrapper);
      cbs[hsh] = clueBox;
    }
    const clueAddPane = document.createElement('div');
    clueAddPane.classList.add('clueaddpane');
    const clueAddBox = document.createElement('input');
    clueAddBox.classList.add('addwordbox');
    const addWord = (word, scroll = true) => {
      try {
        if (!this.dict.isWord(word)) {
          return;
        }
      } catch (e) {
        return;
      }
      const word_hsh = HASH(word);
      if (!(word_hsh in cbs) || !word.startsWith(cbs[word_hsh].placeholder)) {
        return;
      }
      cbs[word_hsh].value = word;
      cbs[word_hsh].parentNode.classList.remove('wrong');
      cbs[word_hsh].parentNode.classList.add('correct');
      scroll && cbs[word_hsh].scrollIntoView({block: 'nearest'});
      clueAddBox.value = '';
      correctCountSpan.innerText = document.getElementsByClassName('clue correct').length;
    }
    clueAddBox.addEventListener('keydown', e => {
      if (e.keyCode == 13) {
        addWord(clueAddBox.value.toLowerCase());
      }
    });
    const clueAddSubmit = document.createElement('input');
    clueAddSubmit.type = 'submit';
    clueAddSubmit.value = 'Add';
    clueAddSubmit.addEventListener('click', e => addWord(clueAddBox.value.toLowerCase()));
    const addWordWrapper = document.createElement('div');
    addWordWrapper.appendChild(clueAddBox);
    addWordWrapper.appendChild(clueAddSubmit);
    const clueFilterAll = document.createElement('input');
    clueFilterAll.type = 'radio';
    clueFilterAll.name = 'filter';
    clueFilterAll.id = 'filterall';
    clueFilterAll.checked = true;
    clueFilterAll.addEventListener('click', e => {
      clueList.classList.remove('filtered', 'filtered-off', 'filtered-on');
    });
    const clueFilterAllLabel = document.createElement('label');
    clueFilterAllLabel.appendChild(document.createTextNode('All'));
    clueFilterAllLabel.htmlFor = clueFilterAll.id;
    const clueFilterOn = document.createElement('input');
    clueFilterOn.type = 'radio';
    clueFilterOn.name = 'filter';
    clueFilterOn.id = 'filteron';
    clueFilterOn.addEventListener('click', e => {
      clueList.classList.add('filtered', 'filtered-on');
      clueList.classList.remove('filtered-off');
    });
    const clueFilterOnLabel = document.createElement('label');
    clueFilterOnLabel.appendChild(document.createTextNode('On'));
    clueFilterOnLabel.htmlFor = clueFilterOn.id;
    const clueFilterOff = document.createElement('input');
    clueFilterOff.type = 'radio';
    clueFilterOff.name = 'filter';
    clueFilterOff.id = 'filteroff';
    clueFilterOff.addEventListener('click', e => {
      clueList.classList.add('filtered', 'filtered-off');
      clueList.classList.remove('filtered-on');
    });
    const clueFilterOffLabel = document.createElement('label');
    clueFilterOffLabel.appendChild(document.createTextNode('Off'));
    clueFilterOffLabel.htmlFor = clueFilterOff.id;
    const clueFilterWrapper = document.createElement('div');
    clueFilterWrapper.classList.add('cluefilters');
    clueFilterWrapper.appendChild(document.createTextNode('Show:'));
    clueFilterWrapper.appendChild(clueFilterAll);
    clueFilterWrapper.appendChild(clueFilterAllLabel);
    clueFilterWrapper.appendChild(clueFilterOn);
    clueFilterWrapper.appendChild(clueFilterOnLabel);
    clueFilterWrapper.appendChild(clueFilterOff);
    clueFilterWrapper.appendChild(clueFilterOffLabel);
    const clueStatsWrapper = document.createElement('div');
    clueStatsWrapper.classList.add('wordsfound');
    correctCountSpan.innerText = '0';
    const totalCountSpan = document.createElement('span');
    totalCountSpan.innerText = foundWordsCount;
    clueStatsWrapper.appendChild(correctCountSpan);
    clueStatsWrapper.appendChild(document.createTextNode('/'));
    clueStatsWrapper.appendChild(totalCountSpan);
    clueStatsWrapper.appendChild(document.createTextNode(' words found'));
    clueAddPane.appendChild(addWordWrapper);
    clueAddPane.appendChild(clueFilterWrapper);
    clueAddPane.appendChild(clueStatsWrapper);
    const cluePane = document.createElement('div');
    cluePane.style.height = "100%";
    cluePane.appendChild(clueAddPane);
    cluePane.appendChild(clueList);
    document.getElementById('cluepane').children[0].replaceWith(cluePane);

    const gridTable = document.createElement('table');
    gridTable.classList.add('grid');
    for (let i = 0; i < 5; ++i) {
      const gridRow = document.createElement('tr');
      for (let j = 0; j < 5; ++j) {
        const ltridx = i * 5 + j;
        const ltr = this.letters[ltridx];
        const gridCell = document.createElement('td');
        const gridImg = document.createElement('img');
        gridImg.classList.add('gridletter');
        gridImg.src = 'images/' + ltr + '.gif';
        gridImg.addEventListener('click', e => {
          clueAddBox.value += this.grid.letters[ltridx];
          clueAddBox.focus();
        });
        gridImg.addEventListener('contextmenu', e => {
          e.preventDefault();
          const newLetterInput = document.createElement('input');
          newLetterInput.classList.add('gridletter');
          newLetterInput.value = ltr.toUpperCase();
          newLetterInput.maxLength = 1;
          const replaceLetter = e => {
            const newLetter = newLetterInput.value[0].toLowerCase();
            if (newLetter != ltr && this.dict.alphabet.indexOf(newLetter) != -1) {
              this.letters[ltridx] = newLetter;
              const reloadingClues = document.createElement('span');
              reloadingClues.classList.add('loading');
              reloadingClues.appendChild(document.createTextNode('Reloading clues...'));
              document.getElementById('cluepane').children[0].replaceWith(reloadingClues);
              const reloadingGrid = document.createElement('span');
              reloadingGrid.classList.add('loading');
              reloadingGrid.appendChild(document.createTextNode('Reloading grid...'));
              document.getElementById('gridpane').children[0].replaceWith(reloadingGrid);
              this.loadClues();
            } else {
              newLetterInput.replaceWith(gridImg);
            }
          };
          newLetterInput.addEventListener('blur', replaceLetter);
          newLetterInput.addEventListener('keydown', e => {
            newLetterInput.select();
            switch (e.keyCode) {
              case 27: // ESCAPE
                newLetterInput.value = ltr;
              case 13: // ENTER
                newLetterInput.blur();
            }
          });
          gridImg.replaceWith(newLetterInput);
          newLetterInput.select();
        });
        gridCell.appendChild(gridImg);
        gridRow.appendChild(gridCell);
      }
      gridTable.appendChild(gridRow);
    }
    const gridFooter = document.createElement('div');
    gridFooter.classList.add('gridfootnote');
    gridFooter.appendChild(document.createTextNode('Right-click a tile to edit.  "Q" works for the "Qu" tile.'));
    const bulkOpsWrapper = document.createElement('div');
    bulkOpsWrapper.classList.add('bulkops');
    const bulkOpsLink = document.createElement('a');
    bulkOpsLink.href = '#';
    bulkOpsLink.innerText = 'Hide/Show bulk operations';
    bulkOpsLink.addEventListener('click', e => {
      bulkOpsWrapper.classList.toggle('hidden');
    });
    const bulkOpsBox = document.createElement('textarea');
    const bulkAddSubmit = document.createElement('input');
    bulkAddSubmit.type = 'submit';
    bulkAddSubmit.value = 'Bulk Add';
    bulkAddSubmit.addEventListener('click', e => {
      const bulkAddSubmissions = bulkOpsBox.value.split('\n').map(s => s.replace('Look Up Word', '').trim().split(/\s/, 2)[0]).filter(s => s);
      bulkOpsBox.value = '';
      if (bulkAddSubmissions.length > foundWordsCount + 3) {
        alert('Bulk-adding more words than in the grid is considered cheating!  Please check that you have fewer lines than words in the grid.');
        return;
      }
      const origCorrect = document.getElementsByClassName('clue correct').length;
      for (const word of bulkAddSubmissions) {
        addWord(word, false);
      }
      const nowCorrect = document.getElementsByClassName('clue correct').length;
      alert('Checked ' + bulkAddSubmissions.length + ' word(s) and added ' + (nowCorrect - origCorrect) + ' new word(s).');
    });
    const bulkGrabSubmit = document.createElement('input');
    bulkGrabSubmit.type = 'submit';
    bulkGrabSubmit.value = 'Bulk Grab';
    bulkGrabSubmit.addEventListener('click', e => {
      bulkOpsBox.value = Object.values(cbs).map(cb => cb.parentNode.classList.contains('correct') && cb.value).filter(s => s).join('\n');
    });
    const bulkOpsControls = document.createElement('div');
    bulkOpsControls.appendChild(bulkAddSubmit);
    bulkOpsControls.appendChild(bulkGrabSubmit);
    bulkOpsWrapper.appendChild(bulkOpsLink);
    bulkOpsWrapper.appendChild(bulkOpsBox);
    bulkOpsWrapper.appendChild(bulkOpsControls);
    const gridPane = document.createElement('div');
    gridPane.appendChild(gridTable);
    gridPane.appendChild(gridFooter);
    gridPane.appendChild(bulkOpsWrapper);
    document.getElementById('gridpane').children[0].replaceWith(gridPane);
  }
}

function init() {
  let pageLoader = new PageLoader();
  pageLoader.load();
}

document.body.onload = init;
