# Dapper SQL Colorizer - Developer Guide

## Development Setup

### Prerequisites

- Node.js installed
- VS Code

### Installation

```bash
npm install
```

### Build

Compile TypeScript to JavaScript:

```bash
npm run compile
```

Or watch for changes:

```bash
npm run watch
```

### Testing

Press `F5` in VS Code to launch the Extension Development Host. This will open a new VS Code window with your extension loaded.

Open a C# file and test the SQL highlighting with marker comments:

```csharp
// sql begin
var result = await connection.QueryAsync(@"SELECT * FROM users");
// sql end
```

## Publishing

### Create .vsix Package

```bash
# Install vsce globally (if not already installed)
npm install -g @vscode/vsce

# Build the extension
npm run compile

# Package into .vsix file
vsce package
```

This creates a file like `vscode-dapper-sql-colorizer-0.1.0.vsix`.

### Publish to Marketplace

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in and create a publisher (if you haven't already)
3. Ensure the `publisher` field in `package.json` matches your publisher name
4. Click **"+ New extension"** → **"Visual Studio Code"**
5. Upload the `.vsix` file

Alternatively, publish via command line:

```bash
# Login with your publisher name
vsce login your-publisher-name

# Publish directly
vsce publish
```

## Project Structure

```
├── src/
│   ├── extension.ts           # Extension entry point
│   ├── sqlHighlighter.ts      # Main highlighter logic
│   ├── highlighter/
│   │   ├── dapperDetector.ts  # Detects SQL regions
│   │   └── sqlDecorator.ts    # Applies decorations
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── syntaxes/
│   └── sql-inline.tmLanguage.json  # SQL grammar
├── package.json               # Extension manifest
└── tsconfig.json             # TypeScript configuration
```
