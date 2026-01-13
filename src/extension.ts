import * as vscode from 'vscode';
import { registerSqlSemanticProvider } from './sqlHighlighter';

export function activate(_context: vscode.ExtensionContext) {
   console.log('dapper-sql-colorizer activated');
   // Register semantic tokens provider as a reliable fallback for inline SQL.
   registerSqlSemanticProvider(_context);
}

export function deactivate() {}