function isHanCharacter(character: string): boolean {
  return /\p{Script=Han}/u.test(character);
}

function isAsciiWordCharacter(character: string): boolean {
  return /[A-Za-z0-9]/.test(character);
}

export function countChineseWords(text: string): number {
  const input = String(text ?? '').normalize('NFC');
  let count = 0;
  let index = 0;

  while (index < input.length) {
    const character = input[index];

    if (/\s/u.test(character) || /[^\p{L}\p{N}]/u.test(character)) {
      index += 1;
      continue;
    }

    if (isHanCharacter(character)) {
      count += 1;
      index += 1;
      continue;
    }

    if (isAsciiWordCharacter(character)) {
      count += 1;
      index += 1;
      while (index < input.length && /[A-Za-z0-9'_’-]/.test(input[index])) {
        index += 1;
      }
      continue;
    }

    count += 1;
    index += 1;
    while (index < input.length && /[\p{L}\p{N}]/u.test(input[index]) && !isHanCharacter(input[index])) {
      index += 1;
    }
  }

  return count;
}
