import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMathJaxText, splitMathJaxText } from '../app/utilities/parsers/mathJaxText.ts';

test('formatting the sequence questions and choices never adds TeX commands to ordinary prose', () => {
  const inputs = [
    'Find the next two terms of the sequence 2, 5, 8, 11, ...',
    'Find the nth term of the sequence 4, 7, 10, 13, ...',
    String.raw`What is the $12^{\text {th }}$ term of the sequence 1, -1, 1, -1, 1, ...? `,
    String.raw`Find the next two terms of the sequence $\frac{1}{2}, \frac{2}{3}, \frac{3}{4}, \frac{4}{5}, \ldots$ `,
    String.raw`A sequence has nth term $a$ ? $=\frac{1}{\left[2+(-1)^{n}\right]}$. Which statement correctly describes its first four terms and its behaviour?`,
    String.raw`$\frac{1}{3}, 1, \frac{1}{3}, 1$; it is increasing.`,
    String.raw`$1, \frac{1}{3}, \frac{1}{3}, 1$; it is decreasing.`,
    String.raw`$1, \frac{1}{3}, 1, \frac{1}{3}$; it is increasing.`,
    String.raw`$1, \frac{1}{3}, 1, \frac{1}{3}$; it is neither increasing nor decreasing.`,
  ];
  for (const input of inputs) {
    assert.equal(formatMathJaxText(input), input);
    const segments = splitMathJaxText(input);
    assert.equal(segments.map(segment => segment.value).join(''), input);
    assert.ok(segments.filter(segment => segment.kind === 'text').every(segment => !segment.value.includes('\\text')));
  }
});

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
