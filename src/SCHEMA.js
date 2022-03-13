export const PASS = {
	type: 'object',
	description: 'Declaration of each render pass',
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
			type: 'string|integer',
			default: '$WIDTH',
			description: 'Width of render pass as an integer or GLSL function, ie. floor($WIDTH/2.0)'
		},
		HEIGHT: {
			type: 'string|integer',
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


export const INPUT = {
	type: 'object',
	description: 'Declaration of each GUI uniform',
	uniqueItems: true,
	properties: {
		NAME: {
			type: 'string',
			description: 'Name as is used inside shader code'
		},
		TYPE: {
			type: 'string',
			description: 'GUI and variable type, where: event=bool, bool=bool, long=int|long, float=float, point2D=vec2, color=vec4, image=texture2D, audio=texture2D, audioFFT=texture2D',
			oneOf: ['event', 'bool', 'long', 'float', 'point2D', 'color', 'image', 'audio', 'audioFFT']
		},
		DEFAULT: {
			type: 'bool|number|array',
			description: 'Default value for the parameter, where: '
		},
		MIN: {
			type: 'number|array',
			description: 'Same format as DEFAULT'
		},
		MAX: {
			type: 'number|array',
			description: 'Same format as DEFAULT'
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
		type: 'integer',
		description: 'ISF specification version',
		default: 1,
		oneOf: [1,2]
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


export const FUNCTIONS = [
	{
		name: 'IMG_SIZE( texture2D )',
		is: 'vec2',
		description: 'Returns width and height of image'
	},
	{
		name: 'IMG_NORM_PIXEL( texture2D )',
		is: 'vec2',
		description: 'Returns normalised fragment coordinate of image[0,0] to [1,1]'
	},
	{
		name: 'IMG_PIXEL( texture2D )',
		is: 'vec2',
		description: 'Returns fragment coordinate of image[0,0] to [$WIDTH,$HEIGHT]'
	}
]

export const UNIFORMS = [
	{
		name: 'gl_FragCoord',
		is: 'vec2',
		description: 'Current fragment coordinate [0,0] to [$WIDTH,$HEIGHT]'
	},
	{
		name: 'isf_FragNormCoord',
		is: 'vec2',
		description: 'Current normalised fragment coordinate [0,0] to [1,1]'
	},
	{
		name: 'PASSINDEX',
		is: 'int',
		description: 'Current pass index, in order of PASSES array'
	},
	{
		name: 'RENDERSIZE',
		is: 'vec2',
		description: 'Current width and height of rendering pass'
	},
	{
		name: 'TIME',
		is: 'float',
		description: 'Current time in seconds'
	},
	{
		name: 'TIMEDELTA',
		is: 'float',
		description: 'Current time elapsed since last frame was rendered'
	},
	{
		name: 'DATE',
		is: 'vec4',
		description: 'Current date as [ $YEAR, $MONTH, $DAY, $TIME ]'
	},
	{
		name: 'FRAMEINDEX',
		is: 'int',
		description: 'Counter for each frame rendered'
	}
]