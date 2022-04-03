#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { exit } from 'process'
import readline from 'readline'

const canBeDirectiveFile = (file: string) =>
  file.includes('.ts') && !file.includes('.spec.ts') && !file.includes('.d.ts')

const directiveSelectorLines: string[] = []

const collectSelector = (eachLine: string) => {
  if (eachLine.includes('selector') && !eachLine.includes('-')) {
    directiveSelectorLines.push(eachLine)
  }
}

const showResult = () => {
  const directiveSelectors = directiveSelectorLines.map(
    (line: string, index: number) =>
      `${line
        .split(':')[1]
        .replace('[', '')
        .replace(']', '')
        .replace(',', '')}${
        index === directiveSelectorLines.length - 1 ? '' : ','
      }`,
  )

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
  for (const selector of directiveSelectors) {
    console.log(`       ${selector}`)
  }
  console.log(`      ]
    }
  }
}  
  `)
}

const checkSelector = (possibleDirectiveFile: string) => {
  const readStream = fs.createReadStream(possibleDirectiveFile)
  const readlineInterface = readline.createInterface({
    input: readStream,
    output: undefined,
  })
  readlineInterface.on('line', collectSelector)
  readlineInterface.on('close', showResult)
}

const checkDirectory = (dir: string) => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(err)
      exit(2)
    } else {
      for (const file of files) {
        const filePath = path.join(dir, file)
        const stats = fs.statSync(filePath)
        if (stats.isFile()) {
          if (canBeDirectiveFile(filePath)) {
            checkSelector(filePath)
          }
        } else {
          checkDirectory(filePath)
        }
      }
    }
  })
}

// Not all Angular projects puts files under src directory(e.g. monorepo app, library, .etc)
const srcDir = process.argv[2] || 'src'
checkDirectory(srcDir)
