/** Split only between complete top-level TeX terms so inline math can wrap. */
export function splitQuizMath(source: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  const flush = () => {
    if (current.trim()) parts.push(current.trim());
    current = "";
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!;
    if (character === "\\" && index + 1 < source.length) {
      current += character + source[++index];
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;

    // A command such as \mathrm still needs its argument. Keep the separator
    // with it instead of creating a MathJax expression containing only a macro.
    const danglingCommand = /\\[A-Za-z]+\s*$/.test(current);
    if (depth === 0 && !danglingCommand && /[=+−,~]/.test(character)) {
      flush();
      if (character !== "~") parts.push(character);
    } else {
      current += character;
    }
  }
  flush();

  // An incomplete expression must stay intact for MathJax to report it once.
  return depth === 0 ? parts : [source];
}
