## Dapper SQL Colorizer

Inline SQL syntax highlighting in C# strings using explicit markers.

**Usage**: Wrap your SQL code with marker comments:

```csharp
// sql begin
var rows = await connection.QueryAsync(@$"
    SELECT id, name
    FROM users
    WHERE id = @UserId
");
// sql end
```

The SQL content between `// sql begin` and `// sql end` is highlighted with SQL syntax coloring.

### Customization

You can customize all colors in VS Code settings. Go to Settings (Ctrl+,) and search for "Dapper SQL Colorizer":

- **Keywords Color**: Color for SQL keywords (SELECT, FROM, WHERE, etc.)
- **Identifiers Color**: Color for column names, table names, aliases
- **Parameters Color**: Color for SQL parameters (@UserId, @Id, etc.)
- **Functions Color**: Color for SQL functions (COUNT, MAX, etc.)
- **Strings Color**: Color for SQL string literals
- **Numbers Color**: Color for numeric literals
- **Booleans Color**: Color for true/false literals
- **Keywords Bold**: Whether to make keywords bold (default: true)

Or edit your `settings.json`:

```json
{
  "dapperSqlColorizer.colors.keywords": "#ef836eff",
  "dapperSqlColorizer.colors.identifiers": "#FFFFFF",
  "dapperSqlColorizer.colors.parameters": "#9CDCFE",
  "dapperSqlColorizer.colors.functions": "#DCDCAA",
  "dapperSqlColorizer.colors.strings": "#CE9178",
  "dapperSqlColorizer.colors.numbers": "#B5CEA8",
  "dapperSqlColorizer.colors.booleans": "#569CD6",
  "dapperSqlColorizer.keywords.bold": true
}
```

### How it works

This extension uses text decorations to overlay SQL syntax highlighting (keywords, parameters, functions, strings, numbers) on the C# code between the marker comments. 

For interpolated strings (`@$"..."`, `$@"..."`), C# expressions inside `{...}` maintain their normal syntax highlighting.

### Notes

- Use `// sql begin` and `// sql end` to mark the exact scope.
- Supports all C# string types (`@"..."`, `$"..."`, `$@"..."`, `"""..."""`).
- The markers are just comments, so they don't affect your code compilation.
- Colors update automatically when you change settings.