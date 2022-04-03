#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { exit } from 'process'
import readline from 'readline'

const srcDir = process.argv[2] || 'src'

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

const scan = (possibleDirectiveFile: string) => {
  const readStream = fs.createReadStream(
    path.join(srcDir, possibleDirectiveFile),
  )
  const readlineInterface = readline.createInterface({
    input: readStream,
    output: undefined,
  })
  readlineInterface.on('line', collectSelector)
  readlineInterface.on('close', showResult)
}

// Not all Angular projects puts files under src directory(e.g. monorepo app, library, .etc)
fs.readdir(path.join('./', srcDir), (err, files) => {
  if (err) {
    console.error(err)
    exit(1)
  } else {
    const possibleDirectiveFiles = files.filter(canBeDirectiveFile)
    for (const possibleDirectiveFile of possibleDirectiveFiles) {
      scan(possibleDirectiveFile)
    }
  }
})
