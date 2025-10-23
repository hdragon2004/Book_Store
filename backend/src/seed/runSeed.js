#!/usr/bin/env node

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🌱 Starting database seeding...')
console.log('📁 Seed file location:', path.join(__dirname, 'seedData.js'))

// Run the seed script
const seedProcess = spawn('node', ['--loader', '@babel/register', path.join(__dirname, 'seedData.js')], {
  stdio: 'inherit',
  cwd: process.cwd()
})

seedProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Seeding completed successfully!')
  } else {
    console.error('❌ Seeding failed with code:', code)
    process.exit(code)
  }
})

seedProcess.on('error', (error) => {
  console.error('❌ Error running seed:', error.message)
  process.exit(1)
})
