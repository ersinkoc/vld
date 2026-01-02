const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/locales/*.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');

  if (!content.includes('invalidFunction')) {
    // Fix the broken format and add invalidFunction
    content = content.replace(
      /fileMimeType: \(allowed: string\[\]\) => `Invalid file type\. Expected: \${allowed\.join\(', '\)\}`\n\};  \/\/ Function validation messages\n  invalidFunction: 'Expected a function'\n/,
      "fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(', ')}`,\n\n  // Function validation messages\n  invalidFunction: 'Expected a function'\n};"
    );

    // Also handle the case where the file doesn't have the invalidFunction at all
    if (!content.includes('invalidFunction')) {
      content = content.replace(
        /fileMimeType: \(allowed: string\[\]\) => `Invalid file type\. Expected: \${allowed\.join\(', '\)\}`\n\};/,
        "fileMimeType: (allowed: string[]) => `Invalid file type. Expected: ${allowed.join(', ')}`,\n\n  // Function validation messages\n  invalidFunction: 'Expected a function'\n};"
      );
    }

    fs.writeFileSync(file, content);
  }
});

console.log('Done');
