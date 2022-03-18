import fs from 'fs'
import Ajv from 'ajv'
import DUMMY from './DUMMY.js'
import { SCHEMA } from './SCHEMA.js'


const parse = o => {
	return `${o.is} ${o.name}\n// ${o.description}`
}

const run = async e => {

	const ajv = new Ajv( { allErrors: true, useDefaults: true, allowUnionTypes: true } )

	try {
		const validate = ajv.compile(SCHEMA)
		const valid = validate(JSON.parse(DUMMY))
		if (validate?.errors) console.error('❌', validate.errors)
		if (!validate?.errors) console.log('no errors ✅')
		const str = JSON.stringify(SCHEMA, null, '\t')
		await fs.writeFileSync('../SCHEMA.json', str)
		console.log('wrote schema json ✅')
		let template = {}
		validate(template)
		await fs.writeFileSync('../SCHEMA.template.json', JSON.stringify(template, null, '\t'))
		console.log('wrote template json ✅')

	} catch(err) {
		err.message.split(', ').forEach( line => {
			console.log('❌', line)
		})
	}

}

run()