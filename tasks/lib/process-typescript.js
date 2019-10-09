var ts = require('typescript');
var fs = require('fs');

module.exports.withTsConfig = withTsConfig;

/**
 * 
 * @param {ts.CompilerOptions} tsConfig 
 * @returns a function to used to compile TS sources into desired targets
 * @throws
 */
function withTsConfig (compilerOptions) {
  if(!compilerOptions) {
    throw new Error(`TypeScript config not provided`);
  }
  return (filepath) => {
    if (!compilerOptions.noEmitOnError) {
      console.log(`\x1b[33m Warning: Emitting TypeScript compiled result for ${filepath} despite errors\x1b[0m`);
      return compileToTargetAlwaysEmit(filepath, ts, compilerOptions);
    } else {
      const program = ts.createProgram([filepath], compilerOptions);
      const allDiagnostics = getAllDiagnostics(program);
      if (allDiagnostics.length) {
        logDiagnostics(ts, allDiagnostics);
        throw new Error(`TypeScript compilation failed with ${allDiagnostics.length} errors`);
      }
      return compileToTarget(program);
    }
  }
};

/**
 * Gets all compiler diagnostics
 * @param {ts.Program} program 
 * @returns {Array<ts.Diagnostic>} Compiler diagnostics
 */
function getAllDiagnostics(program) {
  const semanticDiagnostics = program.getSemanticDiagnostics();
  const syntacticDiagnostics = program.getSyntacticDiagnostics();
  return [...semanticDiagnostics, ...syntacticDiagnostics];
}

/**
 * Pretty prints compiler diagnostics to the standard output stream
 * @param {ts} typescript 
 * @param {Array<ts.Diagnostic>} allDiagnostics 
 */
function logDiagnostics(typescript, allDiagnostics) {
  const nonEmptyDiagnostics = allDiagnostics.filter(diagnostic => diagnostic.length);
  nonEmptyDiagnostics.map(diagnostic => {
    const message = typescript.flattenDiagnosticMessageText(`${diagnostic.messageText} TS${diagnostic.code}`, "\n");
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      console.log(`\x1b[31m Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}\x1b[0m`);
    } else {
      console.log(`\x1b[31m Error: ${message}\x1b[0m`);
    }
  });
}

/**
 * 
 * @param {ts.Program} program 
 * @returns {string} the compiled output for the specified target
 * @throws 
 */
function compileToTarget(program) {
  const result = program.emit();
  if (result.emitSkipped) {
    logDiagnostics(result.diagnostics);
    throw new Error(`TypeScript compilation failed with ${allDiagnostics.length} errors`);
  } else if(result.emittedFiles) {
    return result.emittedFiles[0];
  }
}

/**
 * Always emits the output from the TS compilation
 * @param {string} filepath 
 * @param {ts} typescript 
 * @param {ts.CompilerOptions} options 
 */
function compileToTargetAlwaysEmit(filepath, typescript, options) {
  const result = typescript.transpileModule(fs.readFileSync(filepath).toString(), options);
  return result.outputText;
}