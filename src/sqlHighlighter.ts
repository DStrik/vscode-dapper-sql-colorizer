import * as vscode from 'vscode';

// Decoration types for SQL syntax - created dynamically from settings
let keywordDecoration: vscode.TextEditorDecorationType;
let paramDecoration: vscode.TextEditorDecorationType;
let stringDecoration: vscode.TextEditorDecorationType;
let numberDecoration: vscode.TextEditorDecorationType;
let functionDecoration: vscode.TextEditorDecorationType;
let booleanDecoration: vscode.TextEditorDecorationType;
let identifierDecoration: vscode.TextEditorDecorationType;

function createDecorations() {
  const config = vscode.workspace.getConfiguration('dapperSqlColorizer');
  
  // Dispose existing decorations if they exist
  keywordDecoration?.dispose();
  paramDecoration?.dispose();
  stringDecoration?.dispose();
  numberDecoration?.dispose();
  functionDecoration?.dispose();
  booleanDecoration?.dispose();
  identifierDecoration?.dispose();
  
  // Create new decorations with colors from settings
  keywordDecoration = vscode.window.createTextEditorDecorationType({
    color: config.get<string>('colors.keywords', '#ef836eff'),
    fontWeight: config.get<boolean>('keywords.bold', true) ? 'bold' : 'normal'
  });

  paramDecoration = vscode.window.createTextEditorDecorationType({
    color: config.get<string>('colors.parameters', '#9CDCFE')
  });

  stringDecoration = vscode.window.createTextEditorDecorationType({
    color: config.get<string>('colors.strings', '#CE9178')
  });

  numberDecoration = vscode.window.createTextEditorDecorationType({
    color: config.get<string>('colors.numbers', '#B5CEA8')
  });

  functionDecoration = vscode.window.createTextEditorDecorationType({
    color: config.get<string>('colors.functions', '#DCDCAA')
  });

  booleanDecoration = vscode.window.createTextEditorDecorationType({
    color: config.get<string>('colors.booleans', '#569CD6')
  });

  identifierDecoration = vscode.window.createTextEditorDecorationType({
    color: config.get<string>('colors.identifiers', '#FFFFFF')
  });
}

export function registerSqlSemanticProvider(context: vscode.ExtensionContext) {
  // Create initial decorations
  createDecorations();
  
  let timeout: NodeJS.Timeout | undefined = undefined;

  function triggerUpdateDecorations(editor: vscode.TextEditor) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    timeout = setTimeout(() => updateDecorations(editor), 100);
  }

  function updateDecorations(editor: vscode.TextEditor) {
    if (editor.document.languageId !== 'csharp') {
      return;
    }
    applySqlDecorations(editor);
  }

  // Recreate decorations when settings change
  vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('dapperSqlColorizer')) {
      createDecorations();
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        triggerUpdateDecorations(editor);
      }
    }
  }, null, context.subscriptions);

  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor) {
      triggerUpdateDecorations(editor);
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(event => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      triggerUpdateDecorations(editor);
    }
  }, null, context.subscriptions);

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    triggerUpdateDecorations(editor);
  }
}

function applySqlDecorations(editor: vscode.TextEditor) {
  const document = editor.document;
  const keywords: vscode.DecorationOptions[] = [];
  const params: vscode.DecorationOptions[] = [];
  const strings: vscode.DecorationOptions[] = [];
  const numbers: vscode.DecorationOptions[] = [];
  const functions: vscode.DecorationOptions[] = [];
  const booleans: vscode.DecorationOptions[] = [];
  const identifiers: vscode.DecorationOptions[] = [];

  const lineCount = document.lineCount;
  let i = 0;

  while (i < lineCount) {
    const lineText = document.lineAt(i).text;
    
    // Look for // sql begin
    if (/^\s*\/\/\s*sql\s+begin\s*$/i.test(lineText)) {
      // Find the matching // sql end
      let endLine = -1;
      for (let j = i + 1; j < lineCount; j++) {
        if (/^\s*\/\/\s*sql\s+end\s*$/i.test(document.lineAt(j).text)) {
          endLine = j;
          break;
        }
      }
      
      if (endLine > i) {
        // Find SQL string content within the marked region
        const sqlRanges = findSqlStringRanges(document, i + 1, endLine);
        
        for (const range of sqlRanges) {
          tokenizeSqlToDecorations(document, range, keywords, params, strings, numbers, functions, booleans, identifiers);
        }
        
        i = endLine + 1;
        continue;
      }
    }
    i++;
  }

  editor.setDecorations(identifierDecoration, identifiers);
  editor.setDecorations(keywordDecoration, keywords);
  editor.setDecorations(paramDecoration, params);
  editor.setDecorations(stringDecoration, strings);
  editor.setDecorations(numberDecoration, numbers);
  editor.setDecorations(functionDecoration, functions);
  editor.setDecorations(booleanDecoration, booleans);
}

// Find all SQL string content ranges within the begin/end markers
function findSqlStringRanges(document: vscode.TextDocument, startLine: number, endLine: number): vscode.Range[] {
  const ranges: vscode.Range[] = [];
  
  for (let line = startLine; line < endLine; line++) {
    const text = document.lineAt(line).text;
    
    // Check for multiline verbatim/interpolated strings
    const verbatimMatch = text.match(/(@\$?|\$@)"/);
    if (verbatimMatch && verbatimMatch.index !== undefined) {
      const quotePos = text.indexOf('"', verbatimMatch.index);
      const isInterpolated = verbatimMatch[0].includes('$');
      
      if (quotePos >= 0) {
        const range = findMultilineStringRange(document, line, quotePos, endLine);
        if (range) {
          if (isInterpolated) {
            // Split range to exclude {...} expressions
            ranges.push(...splitRangeExcludingInterpolations(document, range));
          } else {
            ranges.push(range);
          }
          line = range.end.line; // Skip to end of multiline string
        }
      }
    }
  }
  
  return ranges;
}

function findMultilineStringRange(document: vscode.TextDocument, startLine: number, quoteCol: number, maxLine: number): vscode.Range | null {
  const startText = document.lineAt(startLine).text;
  const contentStart = quoteCol + 1;
  
  let line = startLine;
  let col = contentStart;
  
  while (line <= maxLine) {
    const text = document.lineAt(line).text;
    
    for (let i = col; i < text.length; i++) {
      if (text[i] === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          i++; // Skip escaped quote
          continue;
        }
        // Found closing quote
        return new vscode.Range(startLine, contentStart, line, i);
      }
    }
    
    line++;
    col = 0;
  }
  
  return null;
}

// Split a string range into multiple ranges, excluding C# interpolation expressions {...}
function splitRangeExcludingInterpolations(document: vscode.TextDocument, range: vscode.Range): vscode.Range[] {
  const ranges: vscode.Range[] = [];
  const text = document.getText(range);
  const baseOffset = document.offsetAt(range.start);

  console.log('[SQL Colorizer] Splitting interpolated string, total length:', text.length);

  let currentStart = 0;
  let i = 0;
  let braceDepth = 0;
  let inInterpolation = false;
  let inString = false;
  let stringChar: '"' | '\'' | '' = '';

  while (i < text.length) {
    // If currently parsing inside an interpolation expression, handle nested string literals
    if (inInterpolation) {
      if (!inString && (text[i] === '"' || text[i] === '\'')) {
        inString = true;
        stringChar = text[i] as '"' | '\'';
        console.log('[SQL Colorizer] Entering string inside interpolation at pos', i, 'char:', text[i]);
        i++;
        continue;
      }
      if (inString) {
        // Support escaped characters within string literal
        if (text[i] === '\\' && i + 1 < text.length) {
          i += 2;
          continue;
        }
        if (text[i] === stringChar) {
          inString = false;
          stringChar = '';
          console.log('[SQL Colorizer] Exiting string inside interpolation at pos', i);
        }
        i++;
        continue;
      }
    }

    // Handle literal escaped braces in interpolated strings: {{ and }}
    if (text[i] === '{') {
      if (i + 1 < text.length && text[i + 1] === '{') {
        i += 2;
        continue;
      }
      if (!inInterpolation) {
        // Save preceding SQL segment
        if (currentStart < i) {
          const start = document.positionAt(baseOffset + currentStart);
          const end = document.positionAt(baseOffset + i);
          console.log('[SQL Colorizer] Adding SQL range before interpolation:', currentStart, 'to', i, '=', JSON.stringify(text.substring(currentStart, i)));
          ranges.push(new vscode.Range(start, end));
        }
        inInterpolation = true;
        braceDepth = 1;
        console.log('[SQL Colorizer] Starting interpolation at pos', i);
      } else {
        braceDepth++;
        console.log('[SQL Colorizer] Nested brace at pos', i, 'depth now:', braceDepth);
      }
      i++;
      continue;
    }
    if (text[i] === '}') {
      if (i + 1 < text.length && text[i + 1] === '}') {
        i += 2;
        continue;
      }
      if (inInterpolation) {
        braceDepth--;
        console.log('[SQL Colorizer] Closing brace at pos', i, 'depth now:', braceDepth);
        if (braceDepth === 0) {
          // End interpolation: next segment starts after this brace
          inInterpolation = false;
          currentStart = i + 1;
          console.log('[SQL Colorizer] Ended interpolation, next SQL starts at', currentStart);
        }
      }
      i++;
      continue;
    }

    i++;
  }

  // Remaining SQL segment after last interpolation
  if (!inInterpolation && currentStart < text.length) {
    const start = document.positionAt(baseOffset + currentStart);
    const end = document.positionAt(baseOffset + text.length);
    console.log('[SQL Colorizer] Adding final SQL range:', currentStart, 'to', text.length, '=', JSON.stringify(text.substring(currentStart)));
    ranges.push(new vscode.Range(start, end));
  }

  console.log('[SQL Colorizer] Total SQL ranges found:', ranges.length);
  return ranges;
}

function tokenizeSqlToDecorations(
  document: vscode.TextDocument,
  range: vscode.Range,
  keywords: vscode.DecorationOptions[],
  params: vscode.DecorationOptions[],
  strings: vscode.DecorationOptions[],
  numbers: vscode.DecorationOptions[],
  functions: vscode.DecorationOptions[],
  booleans: vscode.DecorationOptions[],
  identifiers: vscode.DecorationOptions[]
) {
  const text = document.getText(range);
  const startOffset = document.offsetAt(range.start);

  const keywordRegex = /\b(SELECT|FROM|WHERE|AND|OR|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|GROUP|BY|HAVING|ORDER|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|UNION|ALL|DISTINCT|TOP|LIMIT|OFFSET|CASE|WHEN|THEN|ELSE|END|AS|IS|NOT|NULL|LIKE|IN|EXISTS|WITH|CROSS|APPLY|BETWEEN)\b/gi;
  const functionRegex = /\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|COALESCE|NVL|LEN|SUBSTRING|ROUND|CAST|CONVERT)\b/gi;
  const booleanRegex = /\b(true|false)\b/gi;
  const paramRegex = /@[A-Za-z_][A-Za-z0-9_]*/g;
  const stringRegex = /'(?:''|[^'])*'/g;
  const numberRegex = /\b\d+(?:\.\d+)?\b/g;
  // Identifiers: table.column, column names, aliases (but not keywords, functions, booleans, params)
  const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*\b/g;

  // Apply identifiers first (base white color for all words)
  applyRegexToDecorations(document, text, startOffset, identifierRegex, identifiers);
  
  // Then overlay specific types (these will override the white where they match)
  applyRegexToDecorations(document, text, startOffset, keywordRegex, keywords);
  applyRegexToDecorations(document, text, startOffset, functionRegex, functions);
  applyRegexToDecorations(document, text, startOffset, booleanRegex, booleans);
  applyRegexToDecorations(document, text, startOffset, paramRegex, params);
  
  // Only apply string literal decoration if the range doesn't start/end with quotes
  // (to avoid matching across interpolation boundaries)
  const trimmed = text.trim();
  const startsWithQuote = trimmed.startsWith("'");
  const endsWithQuote = trimmed.endsWith("'");
  if (!startsWithQuote || !endsWithQuote || trimmed.length < 2) {
    applyRegexToDecorations(document, text, startOffset, stringRegex, strings);
  }
  
  applyRegexToDecorations(document, text, startOffset, numberRegex, numbers);
}

function applyRegexToDecorations(
  document: vscode.TextDocument,
  text: string,
  baseOffset: number,
  regex: RegExp,
  decorations: vscode.DecorationOptions[]
) {
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const start = baseOffset + match.index;
    const end = start + match[0].length;
    const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
    decorations.push({ range });
  }
}

type StringType = 'normal' | 'verbatim' | 'raw';
