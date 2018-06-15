# THIS IS A DRAFT SPEC

This is a draft of v3 of the ISF spec.  It is speculative, and the contents of this document may change significantly between now and whenever the spec is updated to v3.  Some of the language may be vague, and there may be technical errors- please open an issue for any conflicts or problems you notice!

# What is ISF?

ISF stands for "Interactive Shader Format", and is a file format that describes a GLSL fragment shader, as well as how to execute and interact with it. The goal of this file format is to provide a simple and minimal interface for image filters and generative video sources that allows them to be interacted with and reused in a generic and modular fashion. At its core, ISF is nothing more than a JSON blob that describes how to interact with one or more GLSL shader files (how many inputs/uniform variables it has, what their names are, what kind of inputs/variables they are, that sort of thing).  ISF isn't some crazy new groundbreaking technology- it's just a simple and useful combination of two things that have been around for a while to make a minimal- but highly effective- filter format.

## Downloads, sample files, and source code

#### Downloads

- An ISF editor and test app is available here: 
[ISF Editor.app.zip](http://www.vidvox.net/rays_oddsnends/ISF%20Editor_2.9.3.zip).  These are some of its basic features:
  - Browses, renders and displays ISF files. Has a built-in video source, and can also use any QC comps, movie files, image files, Syphon video servers, or AVCapture-compatible video inputs as a video source for testing ISF-based image filters.
  - Automatically publishes the rendered output as a Syphon source
  - Can render ISF files to movie files, with optional anti-aliasing
  - UI items are automatically created for inputs, allowing you to interact with your ISF file
  - Built-in shader editor with syntax coloring and integrated error display along with plenty of logging to facilitate creating and debugging shaders.
  - Output window can be paused, and can also be used to view the output of the individual render passes in your ISF file, which facilitates debugging by providing shader devs with a quick and easy way to visualize values being used in their shaders
  - "Import from Shadertoy/GLSL Sandbox" feature can be used to automatically convert the vast majority of shaders found on Shadertoy and GLSL Sandbox to ISF sources and filters. Some shaders may need further modification, but it's shocking how many will "just work".

#### Sample Files

- Here are a bunch of simple test ISF files that demonstrate ISF's basic features (these are test filters, and we don't expect them to have signifcant creative use):
[ISF Test/Tutorial filters](http://vidvox.net/rays_oddsnends/ISF%20tests+tutorials.zip)
- [Here's an installer](http://www.vidvox.net/rays_oddsnends/Vidvox%20ISF%20resources.pkg.zip) for over a hundred different ISF files, both images and filters.  The installer places them in /Library/Graphics/ISF where they can be accessed by all users.


#### Source Code

- I've made the ISF implementation I wrote for VDMX and the ISF Editor app freely available as VVISFKit.framework in my open-source repos here: [github.com/mrRay/vvopensource](https://www.github.com/mrRay/vvopensource).
- A friend linked me to an OpenFrameworks-based ISF loader here: [github.com/satoruhiga/ofxISF](https://www.github.com/satoruhiga/ofxISF)
- There's a [https://www.interactiveshaderformat.com](WebGL-based ISF website)! The code for this website (written by Michael Feldstein) is also open-source and is freely available here: [github.com/msfeldstein/ISF-JS-Renderer](https://www.github.com/msfeldstein/ISF-JS-Renderer).

## Spec Overview:

Functionally, you are limited only to what you can accomplish in a GLSL program.  ISF's defining characteristic is the JSON dict at the beginning of your shader which contains the information describing how to interact with your shader- all the inputs, how many rendering passes there are and how to render them, etc.  As a result of this, ISF is a very loose, open-ended file format: it can easily be extended by recognizing more keys in the future if we think of new things that might be nice to have.

## How ISF works

When you load an ISF file, the shader code in your file is modified in memory during loading- some variables are declared, and some code is find-and-replaced. If you haven't explicitly created a vertex shader, one will automatically be generated.  Each time you render a frame, the `INPUTS` variable values are passed to the shader, and then the shader is rendered (more than once if desired, potentially into image buffers accessible from different rendering passes and across different frames).

#### ISF and OpenGL

ISF was originally written against an old version of OpenGL (GL 2.1/GLSL 1.2), and as such, most of the content written for it is compatible with a wide variety of OpenGL flavors and versions.  Some of the newer additions to ISF add support for functionality that isn't as widely available across GL distributions (transform feedbacks and geometry shaders in particular)- between this and a growing user community that increasingly desires modern GLSL, some ISFs may not be inherently universal.  As always, simpler is better- if an ISF file can be written against GL 2.1/GLSL 1.2, it is more likely to be compatible on a wider variety of platforms.  If shader authors want to require a specific version of GLSL they can do so via the `MIN_GLSL_VERSION` key in the top-level dict.

#### ISF-created variables

- "uniform" variables of the appropriate type are automatically declared for any `INPUTS` you define. You shouldn't declare uniform variables you want ISF to create UI items for- if you do this, your shader won't work (and the error displayed in the ISF Editor app will indicate that you've redeclared a variable). "uniform" samplers are also declared for any persistent or temporary buffers (samplers are automatically declared of the appropriate type- the shader will be recompiled behind the scenes if a texture type for any of the textures in use changes).
- The uniform int `PASSINDEX` is automatically declared, and set to 0 on the first rendering pass. Subsequent passes (defined by the dicts in your `PASSES` array) increment this int.
- The uniform vec2 `RENDERSIZE` is automatically declared, and is set to the rendering size (in pixels) of the current rendering pass.
- The uniform vec2 `isf_FragNormCoord` is automatically declared. This is a convenience variable, and repesents the normalized coordinates of the current fragment ([0,0] is the bottom-left, [1,1] is the top-right).
- The uniform float `TIME` is automatically declared, and is set to the current rendering time (in seconds) of the shader. This variable is updated once per rendered frame- if a frame requires multiple rendering passes, the variable is only updated once for all the passes.
- The uniform float `TIMEDELTA` is automatically declared, and is set to the time (in seconds) that have elapsed since the last frame was rendered.  This value will be 0.0 when rendering the first frame.
- The uniform vec4 `DATE` is automatically declared, and is used to pass the date and time to the shader.  The first element of the vector is the year, the second element is the month, the third element is the day, and the fourth element is the time (in seconds) within the day.
- The uniform int `FRAMEINDEX` is automatically declared, and is used to pass the index of the frame being rendered to the shader- this value is 0 when the first frame is rendered, and is incremented after each frame has finished rendering.
- "image"-, "cubemap"-, and "image3D"-type inputs automatically declare other additional uniform vars (for passing the image resolution and other associated properties)- if you want to see these, just use the "ISF Editor" app listed above to view the compiled fragment shader source of your filter.
- If the `VERTEX_INGEST` key in the top-level dict has a value of `GENERATOR`, the uniform long `VERTEX_COUNT` is automatically declared, and is set to the number of vertices that the host is drawing in a given render pass.

#### Additional Functions

```
<vec4> pixelColor = IMG_PIXEL(<image> imageName, <vec2> pixelCoord); 
<vec4> pixelColor = IMG_NORM_PIXEL(<image> imageName, <vec2> normalizedPixelCoord);
<vec2> imageSize = IMG_SIZE(<image> imageName);
<int> listLength = LIST_LENGTH(<list-type variable>);
```

- `IMG_PIXEL()` and `IMG_NORM_PIXEL()` fetch the color of a pixel in an image using either pixel-based coords or normalized coords, respectively, and should be used *instead of* `texture2D()` or `texture2DRect()`. In both functions, "imageName" refers to the variable name of the image you want to work with. This image can come from a variety of sources- an "image"-type input, the target of a previous render pass or a persistent buffer, an imported image, etc: all of these sources of images have a name value associated with them, and this name is what you pass to these functions. For several examples, please check out this .zip of extremely simple shaders that demonstrate the features of ISF, one at a time:
[ISF Test/Tutorial filters](http://vidvox.net/rays_oddsnends/ISF%20tests+tutorials.zip)
- `IMG_SIZE()` returns a two-element vector describing the size of the image in pixels.
- `LIST_LENGTH()` returns the length (the number of elements in the list) of a list-type INPUT (like "float[]", etc).

#### Multiple Rendering Passes, Rendering to Buffers

The ISF file format defines the ability to execute a shader multiple times in the process of rendering a frame for output- each time the shader's executed (each pass), the uniform int variable `PASSINDEX` is incremented. Details on how to accomplish this are described below in the spec, but the basic process involves adding an array of dicts to the `PASSES` key in your top-level JSON dict. Each dict in the `PASSES` array describes a different rendering pass- the ISF host will automatically create buffers to render into, and those buffers (and therefore the results of those rendering passes) can be accessed like any other buffer/input image/imported image (you can render to a texture in one pass, and then read that texture back in and render something else in another pass).  The dicts in `PASSES` recognize a number of different keys to specify different properties of the rendering passes- more details are in the spec below.

#### Persistent Buffers

ISF files can define persistent buffers. These buffers are images (GL textures) that stay with the ISF file for as long as it exists. This is useful if you want to "build up" an image over time- you can repeatedly query and update the contents of persistent buffers by rendering into them- or if you want to perform calculations across the entire image, storing the results somewhere for later evaluation. Details on exactly how to do this are in the spec (below).

## ISF Conventions

- ISF shaders that are to be used as image filters are expected to pass the image to be filtered using the "inputImage" variable name.  This input needs to be declared like any other image input, and host developers can assume that any ISF shader specifying an "image"-type input named "inputImage" can be operated as an image filter.
- ISF shaders that are to be used as transitions require three inputs: two image inputs ("startImage" and "endImage"), and a normalized float input ("progress") used to indicate the progress of the transition.  Like image filters, all of these inputs need to be declared as you would declare any other input, and any ISF that implements "startImage", "endImage", and "progress" can be assumed to operate as a transition.
- INPUTS that do not explicitly specify a MIN and MAX are, where appropriate, assumed to be normalized.

## What is an ISF file?

- ISF was initially developed to facilitate the creation of image generators and image filters- the first two versions of the ISF specification explicitly defined an "ISF file" as a fragment shader file (a text file with the extention .fs containing GLSL shader code) that started with a comment containing a JSON object describing the properties of the ISF file (we'll refer to this descriptive metadata object as the "JSON descriptor").  Bundling the metadata with the shader source code like this is convenient for obvious reasons, and support for this will continue for the forseeable future.
- Version 3 of the ISF spec introduces new functionality, and with that new functionality the definition of what is considered an "ISF file" is widening.
  - As before, a fragment shader file will be considered an "ISF file" if it begins with a comment (delineated using "/\*" and "\*/") containing a JSON object that describes the ISF file (the JSON descriptor).  As before, if your filter requires a vertex shader or geometry shader in addition to the frag shader, just give them the same name (with the appropriate extension- .vs for vertex shader, .gs for geometry shader) and the host will compile and link them in.  As before, if the ISF file consists only of a fragment shader- the most common situation at this time- the host is expected to generate the minimal passthrough vertex shader necessary to execute the fragment shader.
  - In addition to fragment shader files, vertex shader files (.vs) and geometry shader files (.gs) can now also be used to define "ISF files" if they begin with the same JSON descriptor previously only found in fragment shader files.  This modification was made to allow for the creation of ISF files that do not have fragment shaders- either because their fragment shader is trivial and most of the work is being done in the vertex shader (a relatively common situation if VERTEX_INGEST is GENERATOR) or because a raster image isn't being produced at all and the ISF file is operating solely on geometry (as is the case if OUTPUT_TYPE is set to VERTEX).
  - Version 3 of the ISF spec also introduces the ISF file type, which is nothing more than a text file that has the extension .isf.  This text file contains the JSON descriptor previously only found at the top of fragment shader files, but it does not contain any shader source code- instead, it lists the source files in the descriptor using the keys "SRC_VS", "SRC_GS", and "SRC_FS".  While this file type is a new addition, it is not intended to be a requirement or replacement.  We expect- and encourage- that most ISF files will continue to be simple fragment or vertex shaders with a JSON blob in a comment at the top, but more complex ISFs that require specialized resources or want to heavily re-use code may benefit from using a central .isf file that describes 
- ISF files can be located anywhere- but ideally they should be installed on the host system in a location where they are generally available to all applications that support ISF.  On macs, the default locations are `/Library/Graphics/ISF` (for ISF files that will be visible to all users) and `~/Library/Graphics/ISF` (for ISF files that will only be visible to the currently-logged-in user).  As per Apple's developer guidelines, ISFs that are app-specific should be installed in the "Application Support" folder- application authors should not create app-specific folders in global locations.
- Sometimes, the ISF host needs to locate external files used by an ISF file- images that need to be imported, or source code in an external file that was #included, for example.  These files are specified in ISF using partial paths- when locating these files, the ISF host should first check for files matching the partial path relative to the ISF file.  If the resource cannot be located, the partial path should then be evaluated relative to the user-specific ISF resources directory, and finally relative to the global ISF resources directory.

# The ISF Specification vsn 3.0

First of all, there are super-simple examples that cover all of this- check out the various "Test____.fs" sample filters located here:
[ISF Test/Tutorial filters](http://vidvox.net/rays_oddsnends/ISF%20tests+tutorials.zip)
...you will probably learn more, faster, from the examples than you'll get by reading this document: each example describes a single aspect of the ISF file format, and they're extremely handy for testing, reference, or as a tutorial (the ISF file format is very small).

- The first thing in your ISF file needs to be a comment (delineated using "/\*" and "\*/") containing a JSON dict. If the comment doesn't exist- or the JSON dict is malformed or can't be parsed- your ISF file can't be loaded (ISF files can be tested with the ISF Editor linked to elsewhere on this page). This JSON dict is referred to as your "top-level dict" throughout the rest of this document.
- If there's a string in the top-level dict stored at the `ISFVSN` key, this string will describe the version of the ISF specification this shader was written for.  This key should be considered mandatory- if it's missing, the assumption is that the shader was written for version 1.0 of the ISF spec (which didn't specify this key).  The string is expected to contain one or more integers separated by dots (eg: '2', or '2.1', or '2.1.1').
- If there's a string in the top-level dict stored at the `VSN` key, this string will describe the version of this ISF file.    This key is completely optional, and its use is up to the host or editor- the goal is to provide a simple path for tracking changes in ISF files.  Like the `ISFVSN` key, this string is expected to contain one or more integers separated by dots.
- If there's a string in the top-level dict stored at the `DESCRIPTION` key, this string will be displayed as a description associated with this filter in the host app. the use of this key is optional.
- The `CATEGORIES` key in your top-level dict should store an array of strings. The strings are the category names you want the filter to appear in (assuming the host app displays categories).
- The `KEYWORDS` key in your top-level dict should store an array of strings to be used explicitly for searching.  It is assumed that other properties of the ISF file (DESCRIPTION, name, INPUT names, etc) are already searchable, and don't need to be duplicated in the KEYWORDS array.
- The `MIN_GLSL_VERSION` key in your top-level dict is optional- if it exists, it contains a string describing the minimum version of GLSL required to run the shader.  If the ISF file is being executed on a desktop version of GLSL, the string will simply contain the GLSL version number- if the ISF file is being executed in a GLSL ES environment (mobile devices, WebGL) then the version string will be prefaced by the letters "ES".  ISF hosts will probably use this key to avoid listing ISF files that are viewed as incompatible, so if you aren't sure what to put here and don't want to prematurely limit the scope of your ISF file, just omit this key entirely and let the host determine compatibility by attempting to compile the ISF file.
- The `INPUTS` key of your top-level dict should store an array of dictionaries (each dictionary describes a different input- the inputs should appear in the host app in the order they're listed in this array). For each input dictionary:
  - The value stored with the key `NAME` must be a string, and it must not contain any whitespaces. This is the name of the input, and will also be the variable name of the input in your shader.
  - The value stored with the key `DESCRIPTION` must be a string- this string should describe the input's effect on the output of the ISF file.  This key is not required, but it's recommended.
  - The value stored with the key `TYPE` must be a string. This string describes the type of the input, and must be one of the following values: "event", "bool", "long", "float", "point2D", "point3D", "point4D", "color", "image", "audio", "audioFFT", "imageCube", or "image3D".  Lists are also available for some data types ("bool[]", "long[]", "float[]", "point2D[]", "point3D[]", "point4D[]", and "color[]");
    - The input types "audio" and "audioFFT" specify that the input will be sent audio data of some sort from an audio source- "audio" expects to receive a raw audio wave, and "audioFFT" expects the results of an FFT performed on the raw audio wave.  This audio data is passed to the shader as an image, so "audio"- and "audioFFT"-type inputs should be treated as if they were images within the actual shader.  By default, hosts should try to provide this data at a reasonably high precision (32- or 16-bit float GL textures, for example), but if this isn't possible then lower precision is fine.
      - The images sent to "audio"-type inputs contains one row of image data for each channel of audio data (multiple channels of audio data can be passed in a single image), while each column of the image represents a single sample of the wave, the value of which is centered around 0.5.
      - The images sent to "audioFFT"-type inputs contains one row of image data for each channel of audio data (multiple channels of audio data can be passed in a single image), while each column of the image represents a single value in the FFT results.
      - Both "audio"- and "audioFFT"-type inputs allow you to specify the number of samples (the "width" of the images in which the audio data is sent) via the `MAX` key (more on this later in the discussion of `MAX`).
    - List types support the optional use of the `MAX_ITEMS` key- if not present, the list will be declared to have 16 items in it.  If present, the value stored at this key is expected to be an integer.
      - The actual number of elements in the list can be queried from within the shader using the function `LIST_LENGTH()`.
  - Where appropriate, `DEFAULT`, `MIN`, `MAX`, and `IDENTITY` may be used to further describe value attributes of the input. Note that "image"-type inputs don't have any of these, and that "color"-type inputs use an array of floats to describe min/max/default colors. Everywhere else values are stored as native JSON values where possible (float as float, bool as bool, etc).
    - "audio"- and "audioFFT"-type inputs support the use of the `MAX` key- but in this context, `MAX` specifies the number of samples that the shader wants to receive.  This key is optional- if `MAX` is not defined then the shader will receive audio data with the number of samples that were provided natively.  For example, if the `MAX` of an "audio"-type input is defined as 1, the resulting 1-pixel-wide image is going to accurately convey the "total volume" of the audio wave; if you want a 4-column FFT graph, specify a `MAX` of 4 on an "audioFFT"-type input, etc.
  - The value stored with the key `LABEL` must be a string. This key is optional- the `NAME` of an input is the variable name, and as such it can't contain any spaces/etc. The `LABEL` key provides host sofware with the opportunity to display a more human-readable name. This string is purely for display purposes and isn't used for processing at all.
  - Other notes:
    - "event" type inputs describe events that do not have an associated value- a momentary click button.
    - The "long" type input is used to implement pop-up buttons/pop-up menus in the host UI. As such, "long"-type input dictionaries have a few extra keys:
      - The `VALUES` key stores an array of integer values. This array may have repeats, and the values correspond to the labels. When you choose an item from the pop-up menu, the corresponding value from this array is sent to your shader.
      - The `LABELS` key stores an array of strings. This array may have repeats, and the strings/labels correspond to the array of values.
- The `PASSES` key should store an array of dictionaries. Each dictionary describes a different rendering pass. This key is optional: you don't need to include it, and if it's not present your effect will be assumed to be single-pass.
  - The `TARGET` string in the pass dict describes the name of the buffer this pass renders to.  The ISF host will automatically create a temporary buffer using this name, and you can read the pixels from this temporary buffer back in your shader in a subsequent rendering pass using this name.  By default, these temporary buffers are deleted (or returned to a pool) after the ISF file has finished rendering a frame of output- they do not persist from one frame to another.  No particular requirements are made for the default texture format- it's assumed that the host will use a common texture format for images of reasonable visual quality.
  - If the pass dict has a positive value stored at the `PERSISTENT` key, it indicates that the target buffer will be persistent- that it will be saved across frames, and stay with your effect until its deletion.  If you ask the filter to render a frame at a different resolution, persistent buffers are resized to accommodate.  Persistent buffers are useful for passing data from one frame to the next- for an image accumulator, or motion blur, for example.  This key is optional- if it isn't present (or contains a 0 or false value), the target buffer isn't persistent.
  - If the pass dict has a positive value stored at the `FLOAT` key, it indicates that the target buffer created by the host will have 32bit float per channel precision.  Float buffers are proportionally slower to work with, but if you need precision- for image accumulators or visual persistence projects, for example- then you should use this key.  Float-precision buffers can also be used to store variables or values between passes or between frames- each pixel can store four 32-bit floats, so you can render a low-res pass to a float buffer to store values, and then read them back in subsequent rendering passes.   This key is optional- if it isn't present (or contains a 0 or false value), the target buffer will be of normal precision.
  - If the pass dictionary has a value for the keys `WIDTH` or `HEIGHT` (these keys are optional), that value is expected to be a string with an equation describing the width/height of the buffer. This equation may reference variables: the width and height of the image requested from this filter are passed to the equation as `$WIDTH` and `$HEIGHT`, and the value of any other inputs declared in `INPUTS` can also be passed to this equation (for example, the value from the float input "blurAmount" would be represented in an equation as "$blurAmount"). This equation is evaluated once per frame, when you initially pass the filter a frame (it's not evaluated multiple times if the ISF file describes multiple rendering passes to produce a sigle frame). For more information (constants, built-in functions, etc) on math expression evaluations, please see the documentation for the excellent DDMathParser by Dave DeLong, which is what we're presently using.
- The `IMPORTED` key describes buffers that will be created for image files that you want ISF to automatically import. This key is optional: you don't need to include it, and if it's not present your ISF file just won't import any external images. The item stored at this key should be a dictionary.
  - Each key-value pair in the `IMPORTED` dictionary describes a single image file to import. The key for each item in the `IMPORTED` dictionary is the name of the buffer as it will be used in your ISF file, and the value for each item in the `IMPORTED` dictionary is another dictionary describing the file to be imported.
  	- The dictionary describing the image to import has a couple optional keys:
  	  - If there is a non-zero value at the key `FLOAT`, it indicates that the image to be loaded should be loaded using floating-point per channel precision.
  	  - If there is a non-zero value at the key `CUBE`, it indicates that the images to be loaded should be loaded into a cubemap texture.  It also indicates that several images must be loaded, and changes slightly the semantics of the `PATH` key.
  	  - If there is a non-zero value at the key `3D`, it indicates that the images to be loaded should be loaded into a 3d texture.  Like `CUBE`, it also changes the semantics of the `PATH` key.
  	- The dictionary describing the image to import must have a `PATH` key- the value stored with this key is expected to specify the partial path of the file to be imported.  This is relatively straightforward for simple images, which expect the value stored with "PATH" to be a string.  However, cubemaps and 3d textures may require multiple images- so the value stored with "PATH" may also be an array of strings, each string containing a partial path to a file to load.  ISF hosts should examine the file or files specified and make a best-faith attempt to populate an image of the specified format (FLOAT/CUBE/3D) with the provided content.
- The `SRC_VS`, `SRC_GS`, and `SRC_FS` keys are used to indicate shader source files that should be used with the ISF.
  - If your ISF is specified in a .vs, .gs, or .fs then these keys will be ignored.  These keys are only used if the ISF consists of an .isf file.
  - At least one of these keys must appear at least once in an .isf file- these keys are how you provide the source used to compile the ISF shader, so logically it follows that an .isf file must include some minimal amount of source code to be viable.
  - The value at these keys must be strings, and these strings are expected to be partial paths to the source files to be loaded.  The partial paths are expected to be relative to one of the ISF host's default search paths.
  - These keys can appear in one of two places:
    - If these keys are used in the top-level dict then the shader is either single-pass, or the same source code is expected to be used for all render passes.
    - As an alternative, these keys may also be used in the dictionaries stored in the PASSES array- if you take this approach, each pass must explicitly specify all the source files they require.  This is a substantial change from previous versions of ISF, in that each render pass can potentially consist of a separate shader.
- The `VERTEX_INGEST` key in the top-level dict describes the vertices that the ISF host is expected to use with the shader/shaders associated with the ISF file.  This key is not required.  The value stored with this key is always a string, and must be one of the following values:
  - `QUAD`- If the VERTEX_INGEST key is missing, hosts shall assume this behavior by default.  This value is consistent with the behavior of earlier versions of ISF- if you're not sure what to specify, then you probably want QUAD.  The host software is expected to draw vertices consistent with a full-screen quad, which would cause every visible fragment to be calculated.  This is appropriate for image filters, image generators, and anything that just wants to run a simple fragment shader.
  - `GENERATOR`- This value indicates that the vertex shader will generate the vertex data dynamically at runtime.  The number of vertices drawn is a variable that hosts are encouraged to expose to user interfaces, and is available within shaders as the uniform long `VERTEX_COUNT`.  Per-vertex data will include the index of the vertex being processed, available within vertex and geometry shaders as the long `VERTEX_ID`.  ISF files that specify this value must include at least one vertex or geometry shader- if they do not, the host should simply not list them- but geometry and fragment shaders are optional.
  - `MODEL`- This value indicates that the host will draw model data using a consistent, predictable format that the various shader types can expect and interact with.
  - `CUSTOM`- This value indicates that the ISF file is intended to be used with custom geometry provided by the host that doesn't fit any of the other definitions.  ISFs specifying this value may not be easily or widely compatible, and their DESCRIPTION should be consulted for further information.
- The `OUTPUT_TYPE` key in the top-level dict describes the intended output type of the ISF file.  This key is not required.  The value stored with this key is always a string, and must be one of the following values:
  - `IMAGE`- If the OUTPUT_TYPE key is missing or unrecognized, hosts shall assume this value by default.  This value is consistent with the behavior of earlier versions of ISF- if you're not sure what to specify, then you probably want IMAGE.  The host software is expected to capture the raster image output in a buffer of some sort (a texture or renderbuffer is most common).  In some circumstances, this image is made available to the shader itself (when performing multi-pass rendering, later passes are able to access the rendered output of earlier passes).
  - `CUBEMAP`- If the OUTPUT_TYPE key is "CUBEMAP", the host software is expected to render the provided geometry and texture data to a cubemap texture.
  - `IMAGE3D`- If the OUTPUT_TYPE key is "IMAGE3D", the host software is expected to render the provided geometry and texture data to a 3D texture.
  - `VERTEX`- If the OUTPUT_TYPE key is VERTEX, the host software is expected to capture the output of the geometry shader (if one was supplied) or the vertex shader.  Rasterization can be skipped entirely- this value was created to allow ISFs to be used generate or act as a filter on geometry in the same manner it would on images.
- Outside of the top-level dict- within the actual shader source code- the ISF host needs to implement support for the `#include <filename>` macro.  The supplied filename should be a partial path to the file to be included.  This path can be relative to any of the default search locations for that host's native environment- thus a "#include <common.fs>" would include the file "common.fs" whether that file were located in "~/Library/Graphics/ISF" or "/Library/Graphics/ISF".

# Converting Non-ISF GLSL shaders to ISF

- You should probably replace any calls in your shader to `texture2D()` or `texture2DRect()` with `IMG_NORM_PIXEL()` or `IMG_PIXEL()`, respectively. Images in ISF- inputs, persistent buffers, etc- can be accessed by either `IMG_NORM_PIXEL()` or `IMG_PIXEL()`, depending on whether you want to use normalized or non-normalized coordinates to access the colors of the image. If your shader isn't using these- if it's using `texture2D()` or `texture2DRect()`- it either won't compile or won't run if the host application tries to send it a different type of texture.
- Many shaders pass in the resolution of the image being rendered (knowing where the fragment being evaluated is located within the output image is frequently useful). By default, ISF automatically declares a uniform vec2 named `RENDERSIZE` which is passed the dimensions of the image being rendered.
- If the shader you're converting requires a time value, note that the uniform float `TIME` is declared, and passed the duration (in seconds) which the shader's been runing when the shader's rendered.
- Many shaders don't use (or even acknowledge) the alpha channel of the image being rendered. There's nothing wrong with this- but when the shader's loaded in an application that uses the alpha channel, the output of the shader can look bizarre and unpredictable (though it usually involves something being darker than it should be). If you run into this, try setting gl_FragColor.a to 1.0 at the end of your shader.
- `gl_FragCoord.xy` contains the coordinates of the fragment being evaluated. `isf_FragNormCoord.xy` contains the normalized coordinates of the fragment being evaluated.  
- While ISF files are fragment shaders, and the host environment automatically generates a vertex shader, you can use your own vertex shader if you'd like. If you go this route, your vertex shader should have the same base name as your ISF file (just use the extension .vs), and the first thing you do in your vertex shader's main function is call `isf_vertShaderInit();`.
- If the shader you're converting requires imported graphic resources, note that the ISF format defines the ability to import image files by adding objects to your JSON dict under the `IMPORTED` key. The imported images are accessed via the usual `IMG_PIXEL()` or `IMG_NORM_PIXEL()` methods. Details on how to do this are listed below, and examples are included.
- If your texture doesn't look right, make sure your texture coordinates are ranged properly (textures are typically "clamped" by the host implementation, if you specify an out-of-range texture coordinate it may look funny).

# Differences from the second version of the ISF spec:

This is a draft spec- please do a diff between this file and the current 2.0 spec.  A summary of the changes will be assembled when this is no longer a draft.

# Differences between the first and second version of the ISF spec:

The first version of the ISF spec did some confusing and silly things that the second version improves on.  If you want to write your own ISF host, and you want that host to support "old" ISF files, here's a link to [the original ISF spec.](http://www.vidvox.net/rays_oddsnends/ISF_v1.md)

...and here's a list of the specific changes that were made from ISFVSN 1 to ISFVSN 2:

- The `PERSISTENT_BUFFERS` object in the top-level dict has been removed- it was redundant and confusing. Anything describing a property of the buffer a pass renders to is in the appropriate pass dictionary (`PERSISTENT`, `FLOAT`, `WIDTH`, `HEIGHT`, etc).
- The uniform vec2 `vv_FragNormCoord` has been renamed `isf_FragNormCoord`, and the function `vv_vertShaderInit()` has been renamed `isf_vertShaderInit()`.  ISF is open-source, the use of "vv" for terms in the spec is inappropriate.
- The `INPUT` types "audio" and "audioFFT" didn't exist in the first version of the ISF spec.
- The `IMG_SIZE` function didn't exist in the first version of the ISF spec.
- The `TIMEDELTA`, `DATE`, and `FRAMEINDEX` uniforms didn't exist in the first version of the ISF spec.
- The first version of the ISF spec didn't have any sort of versioning label- `VSN` and `ISFVSN` didn't exist.
- The first version of the ISF spec didn't codify any conventions with respect to image filters.  The second version sets forth the basic requirement for ISF shaders that are expected to be used as image filters or transitions.
