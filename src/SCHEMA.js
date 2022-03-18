export const PASS = {
	type: 'object',
	description: 'Declaration of each render pass',
	required: ['TARGET'],
	properties: {
		TARGET: {
			type: 'string',
			description: 'Name of render pass as is used inside shader code'
		},
		DESCRIPTION: {
			type: 'string',
			description: 'Description of what the shader pass is used for'
		},
		WIDTH: {
			type: ['string','integer'],
			default: '$WIDTH',
			description: 'Width of render pass as an integer or GLSL function, ie. floor($WIDTH/2.0)'
		},
		HEIGHT: {
			type: ['string','integer'],
			default: '$HEIGHT',
			description: 'Height of render pass as an integer or GLSL function, ie. floor($HEIGHT/2.0)'
		},
		PERSISTENT: {
			type: 'boolean',
			default: false,
			description: 'Flag for render pass persistence'
		},
		FLOAT: {
			type: 'boolean',
			default: false,
			description: 'Buffer type is floating point'
		}
	}
}

export const LOCKED_TYPES = [ 'event', 'image', 'audio', 'audioFFT']
export const SETTABLE_TYPES = [ 'bool' ]
export const MINMAX_TYPES = [ 'long', 'float', 'point2D', 'color' ]

export const INPUT_TYPES = {
	event: 'bool',
	bool: 'bool',
	long: 'int',
	float: 'float',
	point2D: 'vec2',
	color: 'vec4',
	image: 'texture2D',
	audio: 'texture2D',
	audioFFT: 'texture2D'
}

export const INPUT = {
	type: 'object',
	description: 'Declaration of each GUI uniform',
	required:  ['NAME', 'TYPE'],
	properties: {
		NAME: {
			type: 'string',
			description: 'Name as is used inside shader code'
		},
		TYPE: {
			type: 'string',
			description: 'GUI and variable type, see list in IMPLEMENTATION.md',
			enum: [...SETTABLE_TYPES,...LOCKED_TYPES,...MINMAX_TYPES]
		},
		DEFAULT: {
			type: ['boolean','number','array'],
			description: `Default value for the parameter, applicable to only: ${[...SETTABLE_TYPES, ...MINMAX_TYPES]}`
		},
		MIN: {
			type: ['number','array'],
			description: `Same format as DEFAULT, applicable to only: ${[...MINMAX_TYPES]}`
		},
		MAX: {
			type: ['number','array'],
			description: `Same format as DEFAULT, applicable to only: ${[...MINMAX_TYPES]}`
		},
		LABEL: {
			type: 'string',
			description: 'Visual label of GUI input'
		},
		LABELS: {
			type: 'array',
			description: 'Converts long uniform type into dropdown menu',
			items: {
				type: 'string',
				description: 'Visual label for integer value',
				examples: ['Option 1', 'Option 2', 'Option 3']
			}
		}
	}
}

export const SCHEMA = {
	type: 'object',
	required: ['INPUTS'],
	properties: {
		CATEGORIES: {
			type: 'array',
			description: 'Descriptive category tags',
			items: {
				type: 'string',
				examples: [ '3d', 'mask' ]
			}
		},
		CREDIT: {
			type: 'string',
			description: 'Name of creator'
		},
		ISFVSN: {
			type: 'number',
			description: 'ISF specification version (max is 2.99 until V3 exists)',
			default: 1,
			maximum: 2.99
		},
		INPUTS: {
			type: 'array',
			default: [],
			description: 'Declaration of GUI uniforms',
			items: INPUT
		},
		PASSES: {
			type: 'array',
			description: 'Declaration of names and amount of buffer render passes',
			uniqueItems: true,
			maxItems: 16,
			items: PASS
		},
		IMPORTED: {
			type: 'object',
			patternProperties: {
				'^': {
					type: 'object',
					description: 'Arbitrary key is name of imported image inside shader code',
					properties: {
						PATH: {
							type: 'string',
							description: 'Local path to image file'
						}
					}
				} 
			},
			additionalProperties: false
		}
	}
}