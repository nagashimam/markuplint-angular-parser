#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { exit } from 'process'
import readline from 'readline'

class DirectoryWalker {
  private readonly directories: string[] = []
  private readonly directiveSelectors: string[] = []

  walk(directory: string): void {
    this.searchDirectoryForDirectiveSelector(directory)
    const hasFinishedWalking = this.directories.length === 0
    if (hasFinishedWalking) {
      this.printResult()
    } else {
      for (const nextDirectory of this.directories) {
        this.walk(nextDirectory)
      }
    }
  }

  private searchDirectoryForDirectiveSelector(directory: string): void {
    fs.readdir(directory, (err, files) => {
      if (err) {
        console.error(err)
        exit(2)
      } else {
        for (const file of files) {
          const filePath = path.join(directory, file)
          const stats = fs.statSync(filePath)
          if (stats.isFile()) {
            this.seachFileForDirectiveSelector(filePath)
          } else {
            this.directories.push(filePath)
          }
        }
      }
    })
  }

  private seachFileForDirectiveSelector(filePath: string) {
    const readStream = fs.createReadStream(filePath)
    const readlineInterface = readline.createInterface({
      input: readStream,
      output: undefined,
    })
    readlineInterface.on('line', line => this.collectDirectiveSelector(line))
  }

  private collectDirectiveSelector(line: string) {
    const isDirectiveSelectorLine = line.includes('selector')
    const isComponentSelectorLine =
      isDirectiveSelectorLine && line.includes('-')

    if (isDirectiveSelectorLine && !isComponentSelectorLine) {
      this.directiveSelectors.push(this.extractDirectiveSelector(line))
    }
  }

  private extractDirectiveSelector(directiveSelectorLine: string): string {
    // extract "directiveName" from "selector:[directiveName],"
    return directiveSelectorLine
      .split(':')[1]
      .replace('[', '')
      .replace(']', '')
      .replace(',', '')
  }

  private printResult(): void {
    console.log(`Add the following to your markuplintrc
  {
    'invalid-attr': {
      'option': {
        'ignoreAttrNamePrefix': [
          'app',
          '*ng',
          'ng',
          '(',
          '[',
          '@',
          '#',`)
    for (const [index, selector] of this.directiveSelectors.entries()) {
      const isLastDirective = index === this.directiveSelectors.length - 1
      console.log(`       ${selector}${isLastDirective ? '' : ','}`)
    }
    console.log(`      ]
      }
    }
  }  
    `)
  }
}

// Not all Angular projects put files under src directory(e.g. monorepo app, library, .etc)
const srcDir = process.argv[2] || 'src'
new DirectoryWalker().walk(srcDir)
