# SCHEMA 
```json
{
	"CATEGORIES": {
		"type": "array",
		"description": "Descriptive category tags",
		"items": {
			"type": "string",
			"examples": [
				"3d",
				"mask"
			]
		}
	},
	"CREDIT": {
		"type": "string",
		"description": "Name of creator"
	},
	"ISFVSN": {
		"type": "integer",
		"description": "ISF specification version",
		"default": 1,
		"oneOf": [
			1,
			2
		]
	},
	"INPUTS": {
		"type": "array",
		"default": [],
		"description": "Declaration of GUI uniforms",
		"items": {
			"type": "object",
			"description": "Declaration of each GUI uniform",
			"uniqueItems": true,
			"properties": {
				"NAME": {
					"type": "string",
					"description": "Name as is used inside shader code"
				},
				"TYPE": {
					"type": "string",
					"description": "GUI and variable type, where: event=bool, bool=bool, long=int|long, float=float, point2D=vec2, color=vec4, image=texture2D, audio=texture2D, audioFFT=texture2D",
					"oneOf": [
						"event",
						"bool",
						"long",
						"float",
						"point2D",
						"color",
						"image",
						"audio",
						"audioFFT"
					]
				},
				"DEFAULT": {
					"type": "bool|number|array",
					"description": "Default value for the parameter, where: "
				},
				"MIN": {
					"type": "number|array",
					"description": "Same format as DEFAULT"
				},
				"MAX": {
					"type": "number|array",
					"description": "Same format as DEFAULT"
				},
				"LABELS": {
					"type": "array",
					"description": "Converts long uniform type into dropdown menu",
					"items": {
						"type": "string",
						"description": "Visual label for integer value",
						"examples": [
							"Option 1",
							"Option 2",
							"Option 3"
						]
					}
				}
			}
		}
	},
	"PASSES": {
		"type": "array",
		"description": "Declaration of names and amount of buffer render passes",
		"uniqueItems": true,
		"maxItems": 16,
		"items": {
			"type": "object",
			"description": "Declaration of each render pass",
			"properties": {
				"TARGET": {
					"type": "string",
					"description": "Name of render pass as is used inside shader code"
				},
				"DESCRIPTION": {
					"type": "string",
					"description": "Description of what the shader pass is used for"
				},
				"WIDTH": {
					"type": "string|integer",
					"default": "$WIDTH",
					"description": "Width of render pass as an integer or GLSL function, ie. floor($WIDTH/2.0)"
				},
				"HEIGHT": {
					"type": "string|integer",
					"default": "$HEIGHT",
					"description": "Height of render pass as an integer or GLSL function, ie. floor($HEIGHT/2.0)"
				},
				"PERSISTENT": {
					"type": "boolean",
					"default": false,
					"description": "Flag for render pass persistence"
				},
				"FLOAT": {
					"type": "boolean",
					"default": false,
					"description": "Buffer type is floating point"
				}
			}
		}
	},
	"IMPORTED": {
		"type": "object",
		"patternProperties": {
			"^": {
				"type": "object",
				"description": "Arbitrary key is name of imported image inside shader code",
				"properties": {
					"PATH": {
						"type": "string",
						"description": "Local path to image file"
					}
				}
			}
		},
		"additionalProperties": false
	}
}
````
# UNIFORMS 
```glsl
vec2 gl_FragCoord
// Current fragment coordinate [0,0] to [$WIDTH,$HEIGHT]
vec2 isf_FragNormCoord
// Current normalised fragment coordinate [0,0] to [1,1]
int PASSINDEX
// Current pass index, in order of PASSES array
vec2 RENDERSIZE
// Current width and height of rendering pass
float TIME
// Current time in seconds
float TIMEDELTA
// Current time elapsed since last frame was rendered
vec4 DATE
// Current date as [ $YEAR, $MONTH, $DAY, $TIME ]
int FRAMEINDEX
// Counter for each frame rendered
````
# FUNCTIONS 
```glsl
vec2 IMG_SIZE( texture2D )
// Returns width and height of image
vec2 IMG_NORM_PIXEL( texture2D )
// Returns normalised fragment coordinate of image[0,0] to [1,1]
vec2 IMG_PIXEL( texture2D )
// Returns fragment coordinate of image[0,0] to [$WIDTH,$HEIGHT]
````
