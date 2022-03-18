# Implementation of ISF Specification V2

Guide for implementing ISF shaders, in two parts: writing ISF shaders, and writing ISF shader software.

## Writing ISF Shaders - JSON

Each ISF shader has a commented out JSON configuration in the header.

**Input Types**

An `INPUTS` object `TYPE` defines the type of GUI that should be used as well as how that uniform should be treated inside the shader:

* `event` = `bool`
* `bool` = `bool`
* `long` = `int`
* `float` = `float`
* `point2D` = `vec2`
* `color` = `vec4`
* `image` = `texture2D`
* `audio` = `texture2D`
* `audioFFT` = `texture2D`

**Labels**

The property `LABELS` can be used with `long` to create a dropdown menu.

**Width & Height**

The tags `$WIDTH` and `$HEIGHT` can be used to set properties to the width and height of the renderer.

**Audio FFT**

All audio and FFT inputs are normalised to 0.0-1.0, with 0.5 as the center.

Type `audio` type produces an image with *one row per channel* with `each column a sample`:

```zsh
[ L1, L2, L3, L4, L5, L6
  R1, R2, R3, R4, R5, R6 ]
```

Type `audioFFT` type produces an image with *one row per channel* with `each column an FFT frequency value`:

```zsh
[ L20HZ, L_80HZ, L_300HZ, L_1200HZ, L_5000HZ, L20000HZ
  R20HZ, R_80HZ, R_300HZ, R_1200HZ, R_5000HZ, R20000HZ ]
```

**Persistent Buffers**

ISF specification V1 has a `PERSISTENT` array used in the root of the JSON config. ISF specification V2 has a `PERSISTENT` boolean set within each object inside `PASSES`.

## Writing ISF Shaders - GLSL

ISF shader code replaces GL-version-specific syntax, uniforms and functions with universal ones.

**Utility Uniforms**

* `vec2 isf_fragCoord` - current pixel fragment coordinate [0,$WIDTH] to [0,$HEIGHT]
* `vec2 isf_FragNormCoord` - current normalised fragment coordinate [0,0] to [1,1]
* `int PASSINDEX` - current pass index, in order of PASSES array
* `vec2 RENDERSIZE` - current width and height of rendering pass
* `float TIME` - current time in seconds
* `float TIMEDELTA` - current time elapsed since last frame was rendered
* `vec4 DATE` - current date as [ $YEAR, $MONTH, $DAY, $TIME ]
* `int FRAMEINDEX` - counter for each frame rendered

*Exception is `vec2 gl_FragCoord` which is consistent across all GL versions and used in ISF shaders*

**Utility Functions**

* `vec2 IMG_SIZE( texture2D )` - returns width and height of image
* `vec2 IMG_NORM_PIXEL( texture2D )` - returns normalised fragment coordinate of image[0,0] to [1,1]
* `vec2 IMG_PIXEL( texture2D )` - returns fragment coordinate of image[0,0] to [$WIDTH,$HEIGHT]

## Writing ISF Software - development

[Vidvox VDMX](https://vdmx.vidvox.net) natively implements ISFs for OSX. 

By looking at the compiled output of [ISF_Editor](https://isf.vidvox.net/desktop-editor) it's possible to understand the implementation:


**Utility Uniforms**

These uniforms must all be set on the update / draw loop:

* `uniform int PASSINDEX` - set to the passes loop index
* `uniform vec2 RENDERSIZE` - set to the size of the renderer
* `uniform float TIME` - set to time in seconds since inited
* `uniform float TIMEDELTA` - set to time since last draw loop
* `uniform vec4 DATE` - set to YEAR, MONTH, DAY, TIME
* `uniform int FRAMEINDEX` - set to a frame counter since inited

**Input Uniforms**

* `event` = `uniform bool $NAME$`
* `bool` = `uniform bool $NAME$`
* `long` = `uniform int $NAME$`
* `float` = `uniform float $NAME$`
* `point2D` = `uniform vec2 $NAME$`
* `color` = `uniform vec4 $NAME$`

**Input Images & Audio**

Texture inputs must be contextual for the GL version being used:

* `image` = `uniform $TYPE$ $NAME$`
* `audio` = `uniform $TYPE$ $NAME$`
* `audioFFT` = `uniform $TYPE$ $NAME$`

Where `$TYPE$` could be `sampler2D`, `sampler` etc based on GL version.

Each `image` type should also have uniforms set for the compilation of utility functions (see below):

* `uniform vec4 _$NAME$_imgRect` - left, top, width, height (?)
* `uniform vec4 _$NAME$_imgSize` - width and height
* `uniform vec4 _$NAME$_flip` - fix for flipping in different GL versions (?)

## Passes

* `WIDTH` and `HEIGHT` - allocate correct size to buffer
* `PERSISTENT` - make buffer persistent
* `FLOAT` - use floating point buffer

### Vertex Shader (.vs)

The function `isf_vertShaderInit` must be called in `main`, which is a function that sets `isf_FragNormCoord` and `isf_fragCoord`

```glsl

void main(void)	{	
	isf_vertShaderInit();	
}	
```

[ISF_Editor](https://isf.vidvox.net/desktop-editor) implementation is:

```glsl
void isf_vertShaderInit(void)	{	
	//	gl_Position should be equal to gl_ProjectionMatrix * gl_ModelViewMatrix * gl_Vertex	
	mat4 projectionMatrix = mat4(2./RENDERSIZE.x, 0., 0., -1.,	
		0., 2./RENDERSIZE.y, 0., -1.,	
		0., 0., -1., 0.,	
		0., 0., 0., 1.);	
	gl_Position = VERTEXDATA * projectionMatrix;	
	isf_FragNormCoord = vec2((gl_Position.x+1.0)/2.0, (gl_Position.y+1.0)/2.0);	
	vec2	isf_fragCoord = floor(isf_FragNormCoord * RENDERSIZE);	
	
}
```

### Fragment Shader (.fs)

The fragment shader should convert the helper functions `IMG_SIZE`, `IMG_NORM_PIXEL` and `IMG_PIXEL` into appropriate replacements:

```glsl
IMG_SIZE
========

vec4 IMG_SIZE( $SAMPLER_TYPE$ $NAME$ )`
=> (_$NAME$_imgSize.xy)

IMG_NORM_PIXEL
==============

vec4 IMG_NORM_PIXEL( $SAMPLER_TYPE$ $NAME$, vec2 location )
=> $IMG_NORM_PIXEL$( $SAMPLER_TYPE$ $NAME$, vec4 _$NAME$_imgRect, vec4 _$NAME$_imgSize, vec2 location  )

IMG_PIXEL
=========
vec4 IMG_PIXEL( $SAMPLER_TYPE$ $NAME$, vec2 location )
=> $IMG_PIXEL$( $SAMPLER_TYPE$ $NAME$, vec4 _$NAME$_imgRect, vec4 _$NAME$_imgSize, vec2 location  )`
```

[ISF_Editor](https://isf.vidvox.net/desktop-editor) implementation is:

```glsl
vec4 VVSAMPLER_2DBYPIXEL(sampler2D sampler, vec4 samplerImgRect, vec2 samplerImgSize, bool samplerFlip, vec2 loc)	{	
	return (samplerFlip)	
		? texture (sampler,vec2(((loc.x/samplerImgSize.x*samplerImgRect.z)+samplerImgRect.x), (samplerImgRect.w-(loc.y/samplerImgSize.y*samplerImgRect.w)+samplerImgRect.y)))	
		: texture (sampler,vec2(((loc.x/samplerImgSize.x*samplerImgRect.z)+samplerImgRect.x), ((loc.y/samplerImgSize.y*samplerImgRect.w)+samplerImgRect.y)));	
}	
vec4 VVSAMPLER_2DBYNORM(sampler2D sampler, vec4 samplerImgRect, vec2 samplerImgSize, bool samplerFlip, vec2 normLoc)	{	
	vec4 returnMe = VVSAMPLER_2DBYPIXEL( sampler,samplerImgRect,samplerImgSize,samplerFlip,vec2(normLoc.x*samplerImgSize.x, normLoc.y*samplerImgSize.y));	
	return returnMe;	
}	
```

*NB: in above example `sampler2D` would need to change for other GLSL versions*

## ISF Implementations

* [ofxISF](https://github.com/satoruhiga/ofxISF) - C++ openFrameworks addon
* [ofxVVISF](https://github.com/danzeeeman/ofxVVISF) - C++ openFrameworks addon
* [VVISF-GL](https://github.com/mrRay/VVISF-GL) - ObjC application
* [libisf](https://github.com/jcelerier/libisf) - C++ compiler
* [interactive-shader-format-js](https://github.com/msfeldstein/interactive-shader-format-js) - Javascript WebGL