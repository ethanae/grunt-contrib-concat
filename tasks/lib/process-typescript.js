var ts = require('typescript');
var fs = require('fs');

/**
 * Gets all compiler diagnostics
 * @param {ts.Program} program 
 * @returns {Array<ts.Diagnostic>} Compiler diagnostics
 */
function getAllDiagnostics(program) {
  var semanticDiagnostics = program.getSemanticDiagnostics();
  var syntacticDiagnostics = program.getSyntacticDiagnostics();
  return semanticDiagnostics.concat(syntacticDiagnostics);
}

/**
 * Pretty prints compiler diagnostics to the standard output stream
 * @param {ts} typescript 
 * @param {Array<ts.Diagnostic>} allDiagnostics 
 */
function logDiagnostics(typescript, allDiagnostics) {
  var nonEmptyDiagnostics = allDiagnostics.filter(function(diagnostic) { return diagnostic.length; });
  nonEmptyDiagnostics.map(function (diagnostic) {
    var message = typescript.flattenDiagnosticMessageText(diagnostic.messageText + ' TS' + diagnostic.code, "\n");
    if (diagnostic.file) {
      var lineAndChar = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      console.log('\x1b[31m Error ' + diagnostic.file.fileName + '(' + lineAndChar.line + 1 + ',' + lineAndChar.character + 1 + '):' + message + '\x1b[0m');
    } else {
      console.log('\x1b[31m Error: ' + message + '\x1b[0m');
    }
  });
}

/**
 * Always emits the output from the TS compilation
 * @param {string} filepath 
 * @param {ts} typescript 
 * @param {ts.CompilerOptions} options 
 */
function compileToTarget(typescript, filepath, options) {
  var result = typescript.transpileModule(fs.readFileSync(filepath).toString(), options);
  return result.outputText;
}

/**
 * 
 * @param {ts.CompilerOptions} tsConfig 
 * @returns a function to used to compile TS sources into desired targets
 * @throws
 */
module.exports = function withTsConfig (compilerOptions) {
  if(!compilerOptions) {
    throw new Error('TypeScript config not provided');
  }
  return function (filepath) {
    if (!compilerOptions.noEmitOnError) {
      console.log('\x1b[33m Warning: Emitting TypeScript compiled result for ' + filepath + ' despite errors\x1b[0m');
      return compileToTarget(ts, filepath, compilerOptions);
    } else {
      var program = ts.createProgram([filepath], compilerOptions);
      var allDiagnostics = getAllDiagnostics(program);
      if (allDiagnostics.length) {
        logDiagnostics(ts, allDiagnostics);
        throw new Error('TypeScript compilation failed with ' + allDiagnostics.length + ' errors');
      }
      return compileToTarget(ts, filepath, compilerOptions);
    }
  };
};