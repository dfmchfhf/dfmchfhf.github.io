import argparse;
import sys;

class WordDFA:
    """Simple DFA that accepts only words from a given lexicon."""
    def __init__(self, letters, words, minimise = 1):
        self.alphabet = letters;
        self.accepts = set();
        self.transitions = [[0] * len(self.alphabet), [0] * len(self.alphabet)];
        for word in words:
            state = 1;
            for c in word:
                cind = self.alphabet.find(c)
                if cind == -1:
                    raise KeyError('{0} contains {1}, a letter not in the alphabet.'.format(word, c))
                if self.transitions[state][cind] == 0:
                    self.transitions[state][cind] = len(self.transitions);
                    self.transitions.append([0] * len(self.alphabet));
                state = self.transitions[state][cind];
            self.accepts.add(state);
        self.minimise(minimise);
    
    def minimise(self, level):
        """Preprocess the DFA to minimise its size.  Amount of preprocessing specified by `level`."""
        def mergeTransitions(partition):
            """Merges each set of equivalences of `partition` and deletes later ones"""
            mv = {};
            for equiv in partition:
                if len(equiv) <= 1:
                    continue;
                [t, *rs] = sorted(equiv);
                mv.update({r: t for r in rs});
                for r in rs:
                    self.transitions[r] = [];
                    if r in self.accepts:
                        self.accepts.remove(r);
            self.transitions = [[mv.get(tr, tr) for tr in transition] for transition in self.transitions];
        def collapseTransitions():
            """Fill in deleted states (by moving in elements from the end) and updates references."""
            i = 0;
            j = len(self.transitions) - 1;
            mv = {};
            while True:
                while self.transitions[i] and i < j:
                    i += 1;
                while not self.transitions[j] and j > i:
                    j -= 1;
                if i >= j:
                    break;
                self.transitions[i] = self.transitions[j];
                self.transitions[j] = [];
                mv[j] = i;
            self.transitions = [[mv.get(tr, tr) for tr in transition] for transition in self.transitions if transition];
            self.accepts = {mv.get(a, a) for a in self.accepts}

        if (level <= 0):
            return;
        print('merging degenerate states: {0} total states'.format(len(self.transitions)), file=sys.stderr);
        changed = 1;
        while changed:
            changed = 0;
            partition = {};
            disp_gran = 1000.0; disp_nxt = 0.0;
            for i, transition in enumerate(self.transitions):
                if i >= disp_nxt:
                    print('looking for degenerate states: {0:>{2}} / {1}'.format(i, len(self.transitions), len(str(len(self.transitions)))), end="\r", file=sys.stderr);
                    disp_nxt += len(self.transitions) / disp_gran;
                digest = sum(transition);  # use a simple digest to avoid repeated expensive array comparisons
                for j, e in enumerate(partition.get(digest, [])):
                    if (e[0] in self.accepts) == (i in self.accepts) and self.transitions[e[0]] == transition:
                        changed += 1;
                        e.append(i);
                        break;
                else:
                    if digest not in partition:
                        partition[digest] = [];
                    partition[digest].append([i])
            print('looking for degenerate states: {0} / {0}'.format(len(self.transitions)), file=sys.stderr);
            flat_p = [v for l in partition.values() for v in l if len(v) > 1]
            print('merging {0} degenerate cases'.format(len(flat_p)), file=sys.stderr);
            mergeTransitions(flat_p);
            collapseTransitions();
            print('{0} degenerate states found and merged'.format(changed), file=sys.stderr);
        print('degenerate states merged, down to {0} total states'.format(len(self.transitions)), file=sys.stderr);

        if (level <= 1):
            return;
        print('applying hopcroft\'s algorithm', file=sys.stderr);
        states = range(2, len(self.transitions));
        partition = [set(self.accepts), set(states) - set(self.accepts)];
        workset = partition.copy()
        itr = 0; estitr = len(states); maxitr = len(states) * (len(bin(len(states))) - 2);
        while workset:
            a = workset.pop();
            print('partitioning states: {0:>{3}} / ~{1:>{3}} / {2}'.format(itr, estitr, maxitr, len(str(maxitr))), end="\r", file=sys.stderr);
            itr += 1;
            for cind, c in enumerate(self.alphabet):
                x = {s for s in states if self.transitions[s][cind] in a};
                olen = len(partition);
                for yi in range(0, olen):
                    y = partition[yi];
                    if len(y) <= 1:
                        continue;
                    intersect = x.intersection(y);
                    diff = y - x;
                    if intersect and diff:
                        if len(intersect) == 1:
                            partition[yi] = diff;
                        else:
                            partition[yi] = intersect;
                            if len(diff) != 1:
                                partition.append(diff);
                        if y in workset:
                            workset.remove(y);
                            workset.append(intersect);
                            workset.append(diff);
                        else:
                            workset.append(intersect if len(intersect) < len(diff) else diff);
        print('partitioning states: {0:>{1}} / {0:>{1}} (estimated {2:>{1}})'.format(itr, len(str(maxitr)), estitr), file=sys.stderr);
        print('merging partitions', file=sys.stderr);
        mergeTransitions(partition);
        collapseTransitions();
        print('dfa minimised, down to {0} total states'.format(len(self.transitions)), file=sys.stderr);

    def isWord(self, word, state = 1):
        """Checks if a given `word` of input leads to an accept state from `state`."""
        if len(word) and state:
            return self.isWord(word[1:], self.transitions[state][self.alphabet.find(word[0])]);
        else:
            return state in self.accepts;

    def getWords(self, state = 1, prefix = ''):
        """Returns all acceptable words from `state`."""
        if state == 0:
            return [];
        ret = [];
        if self.isWord('', state):
            ret.append(prefix);
        for c in self.alphabet:
            ret += self.getWords(self.transitions[state][self.alphabet.find(c)], prefix + c);
        return ret;

def main(letters, words, minimise, skiptest, output):
    wa = WordDFA(letters, words, minimise);
    if not skiptest:
        print('running sanity check...', file=sys.stderr);
        dfawords = wa.getWords()
        print('input: {0} words; output: {1} words'.format(len(words), len(dfawords)), file=sys.stderr);
        if len(words) != len(dfawords):
            print('extra words: {0}'.format(set(wa.getWords()) - set(words)), file=sys.stderr);
            print('missed words: {0}'.format(set(words) - set(wa.getWords())), file=sys.stderr);
            return;
    output.write('{{"alphabet": "{alphabet}", "accepts": {accepts}, "transitions": {transitions}}}'.format(alphabet=wa.alphabet, accepts=list(wa.accepts), transitions=wa.transitions))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Produce a DFA that accepts only a given lexicon.');
    parser.add_argument('--minimise', '-m', action='count', default=0, help='Preprocess the DFA to minimise its size.');
    parser.add_argument('--skiptest', action='store_true', help='Skips the sanity check before saving.');
    parser.add_argument('-f', help='File of the lexicon; uses stdin if none given.');
    parser.add_argument('-o', help='File to output the DFA; outputs to stdout if none given.');
    args = parser.parse_args()
    if args.f:
        with open(args.f, 'r') as fp:
            words = [l.strip() for l in fp.readlines()];
    else:
        words = [l.strip() for l in sys.stdin.readlines()];
    letters = ''.join(list(set(''.join(''.join(words)))));
    if args.o:
        with open(args.o, 'w') as fp:
            main(letters, words, args.minimise, args.skiptest, fp);
    else:
        main(letters, words, args.minimise, args.skiptest, sys.stdout);
