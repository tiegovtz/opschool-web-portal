import test from 'node:test';
import assert from 'node:assert/strict';
import { splitMathJaxText } from '../app/utilities/parsers/mathJaxText.ts';

test('preserves the API ordered-pair answer as prose followed by inline math', () => {
  const source = 'Two elements written in a specific order, usually in the form $(a, b)$';
  assert.deepEqual(splitMathJaxText(source), [
    { kind: 'text', value: 'Two elements written in a specific order, usually in the form ' },
    { kind: 'math', value: '$(a, b)$' },
  ]);
  assert.equal(splitMathJaxText(source).map(segment => segment.value).join(''), source);
});

test('preserves the API question with two inline sets and its relation answer', () => {
  const question = 'Let $A={1,2,3}$ and $B={4,5,6}$. Which of the following is an example of a relation from set A to set B?';
  assert.deepEqual(splitMathJaxText(question), [
    { kind: 'text', value: 'Let ' },
    { kind: 'math', value: '$A={1,2,3}$' },
    { kind: 'text', value: ' and ' },
    { kind: 'math', value: '$B={4,5,6}$' },
    { kind: 'text', value: '. Which of the following is an example of a relation from set A to set B?' },
  ]);
  const answer = '${(1, 4), (2, 5), (3, 6)}$';
  assert.deepEqual(splitMathJaxText(answer), [{ kind: 'math', value: answer }]);
});

test('wraps raw text commands before the ordered-pair formula from the quiz', () => {
  const source = String.raw`\text{Two elements written in a specific order}, \text{usually in the form} \(a,b\)`;
  assert.deepEqual(splitMathJaxText(source), [
    { kind: 'math', value: String.raw`\(\text{Two elements written in a specific order}, \text{usually in the form}\)` },
    { kind: 'text', value: ' ' },
    { kind: 'math', value: String.raw`\(a,b\)` },
  ]);
});

test('formats raw TeX between and after existing formulas', () => {
  assert.deepEqual(splitMathJaxText(String.raw`\(a\) \text{and} \(b\) \text{are elements}`), [
    { kind: 'math', value: String.raw`\(a\)` },
    { kind: 'text', value: ' ' },
    { kind: 'math', value: String.raw`\(\text{and}\)` },
    { kind: 'text', value: ' ' },
    { kind: 'math', value: String.raw`\(b\)` },
    { kind: 'text', value: ' ' },
    { kind: 'math', value: String.raw`\(\text{are elements}\)` },
  ]);
});

test('keeps ordinary prose outside all supported math delimiters', () => {
  for (const formula of [String.raw`\(a,b\)`, String.raw`\[a,b\]`, '$a,b$', '$$a,b$$', String.raw`\begin{equation}a+b\end{equation}`]) {
    assert.deepEqual(splitMathJaxText(`The pair is ${formula}.`), [
      { kind: 'text', value: 'The pair is ' },
      { kind: 'math', value: formula },
      { kind: 'text', value: '.' },
    ]);
  }
});

test('supports raw text commands beside dollar-delimited formulas', () => {
  for (const formula of ['$a,b$', '$$a,b$$']) {
    assert.deepEqual(splitMathJaxText(String.raw`\text{The pair is} ` + formula), [
      { kind: 'math', value: String.raw`\(\text{The pair is}\)` },
      { kind: 'text', value: ' ' },
      { kind: 'math', value: formula },
    ]);
  }
});

test('preserves raw formulas and plain quiz answers', () => {
  assert.deepEqual(splitMathJaxText(String.raw`\frac{1}{2}`), [
    { kind: 'math', value: String.raw`\(\frac{1}{2}\)` },
  ]);
  const prose = 'Two elements that must always have the same value.';
  assert.deepEqual(splitMathJaxText(prose), [{ kind: 'text', value: prose }]);
});

test('keeps an array with its surrounding prose', () => {
  assert.deepEqual(splitMathJaxText(String.raw`Use \begin{array}{cc}a&b\\c&d\end{array} here.`), [
    { kind: 'text', value: 'Use' },
    { kind: 'math', value: String.raw`\[\begin{array}{cc}a&b\\c&d\end{array}\]` },
    { kind: 'text', value: 'here.' },
  ]);
});
