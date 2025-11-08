import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'services', 'gitlab.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Substituir o tipo inline pela interface SprintsQueryResponse
const lines = content.split('\n');
let startIdx = -1;
let endIdx = -1;
let braceCount = 0;
let foundStart = false;

for (let i = 321; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('const response = await this.client.query<{')) {
    startIdx = i;
    foundStart = true;
  }
  if (foundStart) {
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    if (line.includes('query: createSprintsQuery')) {
      // Encontrar o fechamento do objeto
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        braceCount += (nextLine.match(/\{/g) || []).length;
        braceCount -= (nextLine.match(/\}/g) || []).length;
        if (braceCount === 0 && nextLine.includes('})')) {
          endIdx = j + 1;
          break;
        }
      }
      if (endIdx !== -1) break;
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  const before = lines.slice(0, startIdx);
  const after = lines.slice(endIdx);
  const newLines = [
    ...before,
    '      const response = await this.client.query<SprintsQueryResponse>({',
    '        query: createSprintsQuery(getNumber(user.id)),',
    '      })',
    ...after
  ];
  fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
  console.log('Substituição realizada com sucesso');
} else {
  console.log('Não foi possível encontrar o padrão');
  console.log('startIdx:', startIdx, 'endIdx:', endIdx);
}

