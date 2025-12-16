const fs = require('fs');
const glob = require('glob');

// Find all JSX files
const files = glob.sync('src/**/*.{jsx,js}');

let totalFixes = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  //Fix duplicate style attributes - simple cases
  const styleRegex = /style=\{([^}]+)\}\s+style=\{([^}]+)\}/g;
  if (styleRegex.test(content)) {
    content = content.replace(styleRegex, (match, style1, style2) => {
      // Merge the two style objects
      // This is a simple merge - the second one wins for conflicts
      modified = true;
      totalFixes++;
      return `style={{${style1}, ${style2}}}`;
    });
  }

  // Fix duplicate className attributes
  const classRegex = /className="([^"]*)"\s+className="([^"]*)"/g;
  if (classRegex.test(content)) {
    content = content.replace(classRegex, (match, class1, class2) => {
      modified = true;
      totalFixes++;
      return `className="${class1} ${class2}"`;
    });
  }

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
});

console.log(`\nTotal fixes applied: ${totalFixes}`);
