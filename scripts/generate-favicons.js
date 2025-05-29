const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = {
	'favicon-16x16.png': 16,
	'favicon-32x32.png': 32,
	'apple-touch-icon.png': 180,
	'android-chrome-192x192.png': 192,
	'android-chrome-512x512.png': 512,
}

async function generateFavicons() {
	const sourceIcon = path.join(__dirname, '../public/favicon.ico')
	const outputDir = path.join(__dirname, '../public')

	for (const [filename, size] of Object.entries(sizes)) {
		try {
			await sharp(sourceIcon).resize(size, size).toFile(path.join(outputDir, filename))
			console.log(`Generated ${filename}`)
		} catch (error) {
			console.error(`Error generating ${filename}:`, error)
		}
	}
}

generateFavicons().catch(console.error)
