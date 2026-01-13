import * as vscode from 'vscode';

export function createSqlDecoration(): vscode.TextEditorDecorationType {
   return vscode.window.createTextEditorDecorationType({
      color: new vscode.ThemeColor('editor.foreground')
   });
}