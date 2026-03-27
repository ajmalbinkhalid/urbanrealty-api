import path from "node:path";
import { replaceInFile } from "replace-in-file";

const distDir = path.resolve("./dist");

const options = {
  files: `${distDir}/**/*.js`,
  // Match relative imports without .js (import/from statements only)
  from: /(import\s+(?:.*\s+)?from\s+["'])((?:\.\.\/|\.\/)[^'"]+?)(?<!\.js)(["'])/g,
  to: "$1$2.js$3",
};

async function fixImports() {
  try {
    await replaceInFile(options);
  } catch (error) {
    console.error("Error fixing imports:", error);
    process.exit(1);
  }
}

fixImports();
