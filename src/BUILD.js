import fs from 'fs'
import { SCHEMA, UNIFORMS, FUNCTIONS } from './SCHEMA.js'

const parse = o => {
	return `${o.is} ${o.name}\n// ${o.description}`
}

const run = async e => {
	await fs.writeFileSync('../SCHEMA.json', JSON.stringify(SCHEMA, null, '\t'))

	const def = {
		SCHEMA: JSON.stringify(SCHEMA,null,'\t'),
		UNIFORMS: UNIFORMS.map( parse ).join('\n'),
		FUNCTIONS: FUNCTIONS.map( parse ).join('\n')
	}
	const lang = {
		SCHEMA: 'json',
		UNIFORMS: 'glsl',
		FUNCTIONS: 'glsl'
	}

	let DOC = ''
	for (const [k,v] of Object.entries(def)) {
		DOC += `# ${k} \n\`\`\`${lang[k]}\n${v}\n\`\`\`\`\n`
	}

	await fs.writeFileSync('../SCHEMA.md', DOC)

	console.log('wrote SCHEMA.json and SCHEMA.md ✅')
}

run()