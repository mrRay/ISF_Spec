# What is ISF?

ISF stands for "Interactive Shader Format", and is a file format that describes a GLSL fragment shader, as well as how to execute and interact with it. The goal of this file format is to provide a simple and minimal interface for image filters and generative video sources that allows them to be interacted with and reused in a generic and modular fashion. ISF is nothing more than a [slightly modified] GLSL fragment shader with a JSON blob at the beginning that describes how to interact with the shader (how many inputs/uniform variables it has, what their names are, what kind of inputs/variables they are, that sort of thing). ISF isn't some crazy new groundbreaking technology- it's just a simple and useful combination of two things that have been around for a while to make a minimal- but highly effective- filter format.

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
Functionally, you are limited only to what you can accomplish in a GLSL program (vertex + fragment shader, but the frag shader is where most of the action happens in most of the ISF files we've seen so far).

ISF's defining characteristic is the JSON dict at the beginning of your shader which describes it.  This JSON dict contains the information describing how to interact with your shader- all the inputs, how many rendering passes there are and how to render them, etc.  As a result of this, ISF is a very loose, open-ended file format: it can easily be extended by recognizing more keys in the future if we think of new things that might be nice to have.

## How ISF works

When you load an ISF file, the shader code in your file is modified in memory during loading- some variables are declared, and some code is find-and-replaced. If you haven't explicitly created a vertex shader, one will automatically be generated.  Each time you render a frame, the `INPUTS` variable values are passed to the shader, and then the shader is rendered (more than once if desired, potentially into image buffers accessible from different rendering passes and across different frames).

#### ISF-created variables

- "uniform" variables of the appropriate type are automatically declared for any `INPUTS` you define. You shouldn't declare uniform variables you want ISF to create UI items for- if you do this, your shader won't work (and the error displayed in the ISF Editor app will indicate that you've redeclared a variable). "uniform" samplers are also declared for any persistent or temporary buffers (samplers are automatically declared of the appropriate type- the shader will be recompiled behind the scenes if a texture type for any of the textures in use changes).
- The uniform int `PASSINDEX` is automatically declared, and set to 0 on the first rendering pass. Subsequent passes (defined by the dicts in your `PASSES` array) increment this int.
- The uniform vec2 `RENDERSIZE` is automatically declared, and is set to the rendering size (in pixels) of the current rendering pass.
- The uniform vec2 `isf_FragNormCoord` is automatically declared. This is a convenience variable, and repesents the normalized coordinates of the current fragment ([0,0] is the bottom-left, [1,1] is the top-right).
- The uniform float `TIME` is automatically declared, and is set to the current rendering time (in seconds) of the shader. This variable is updated once per rendered frame- if a frame requires multiple rendering passes, the variable is only updated once for all the passes.
- The uniform float `TIMEDELTA` is automatically declared, and is set to the time (in seconds) that have elapsed since the last frame was rendered.  This value will be 0.0 when rendering the first frame.
- The uniform vec4 `DATE` is automatically declared, and is used to pass the date and time to the shader.  The first element of the vector is the year, the second element is the month, the third element is the day, and the fourth element is the time (in seconds) within the day.
- The uniform int `FRAMEINDEX` is automatically declared, and is used to pass the index of the frame being rendered to the shader- this value is 0 when the first frame is rendered, and is incremented after each frame has finished rendering.
- "image"-type inputs automatically declare other additional uniform vars (for passing the image resolution and other associated properties)- if you want to see these, just use the "ISF Editor" app listed above to view the compiled fragment shader source of your filter. 

#### Additional Functions

```
<vec4> pixelColor = IMG_PIXEL(<image> imageName, <vec2> pixelCoord); 
<vec4> pixelColor = IMG_NORM_PIXEL(<image> imageName, <vec2> normalizedPixelCoord);
<vec2> imageSize = IMG_SIZE(<image> imageName);
```

- `IMG_PIXEL()` and `IMG_NORM_PIXEL()` fetch the color of a pixel in an image using either pixel-based coords or normalized coords, respectively, and should be used *instead of* `texture2D()` or `texture2DRect()`. In both functions, "imageName" refers to the variable name of the image you want to work with. This image can come from a variety of sources- an "image"-type input, the target of a previous render pass or a persistent buffer, an imported image, etc: all of these sources of images have a name value associated with them, and this name is what you pass to these functions. For several examples, please check out this .zip of extremely simple shaders that demonstrate the features of ISF, one at a time:
[ISF Test/Tutorial filters](http://vidvox.net/rays_oddsnends/ISF%20tests+tutorials.zip)
- `IMG_SIZE()` returns a two-element vector describing the size of the image in pixels.

#### Multiple Rendering Passes, Rendering to Buffers

The ISF file format defines the ability to execute a shader multiple times in the process of rendering a frame for output- each time the shader's executed (each pass), the uniform int variable `PASSINDEX` is incremented. Details on how to accomplish this are described below in the spec, but the basic process involves adding an array of dicts to the `PASSES` key in your top-level JSON dict. Each dict in the `PASSES` array describes a different rendering pass- the ISF host will automatically create buffers to render into, and those buffers (and therefore the results of those rendering passes) can be accessed like any other buffer/input image/imported image (you can render to a texture in one pass, and then read that texture back in and render something else in another pass).  The dicts in `PASSES` recognize a number of different keys to specify different properties of the rendering passes- more details are in the spec below.

#### Persistent Buffers

ISF files can define persistent buffers. These buffers are images (GL textures) that stay with the ISF file for as long as it exists. This is useful if you want to "build up" an image over time- you can repeatedly query and update the contents of persistent buffers by rendering into them- or if you want to perform calculations across the entire image, storing the results somewhere for later evaluation. Details on exactly how to do this are in the spec (below).

## ISF Conventions

- ISF shaders that are to be used as image filters are expected to pass the image to be filtered using the "inputImage" variable name.  This input needs to be declared like any other image input, and host developers can assume that any ISF shader specifying an "image"-type input named "inputImage" can be operated as an image filter.
- ISF shaders that are to be used as transitions require three inputs: two image inputs ("startImage" and "endImage"), and a normalized float input ("progress") used to indicate the progress of the transition.  Like image filters, all of these inputs need to be declared as you would declare any other input, and any ISF that implements "startImage", "endImage", and "progress" can be assumed to operate as a transition.

# The ISF Specification vsn 2.0

First of all, there are super-simple examples that cover all of this- check out the various "Test____.fs" sample filters located here:
[ISF Test/Tutorial filters](http://vidvox.net/rays_oddsnends/ISF%20tests+tutorials.zip)
...you will probably learn more, faster, from the examples than you'll get by reading this document: each example describes a single aspect of the ISF file format, and they're extremely handy for testing, reference, or as a tutorial (the ISF file format is very small).

- The first thing in your ISF file needs to be a comment (delineated using "/\*" and "\*/") containing a JSON dict. If the comment doesn't exist- or the JSON dict is malformed or can't be parsed- your ISF file can't be loaded (ISF files can be tested with the ISF Editor linked to elsewhere on this page). This JSON dict is referred to as your "top-level dict" throughout the rest of this document.
- If there's a string in the top-level dict stored at the `ISFVSN` key, this string will describe the version of the ISF specification this shader was written for.  This key should be considered mandatory- if it's missing, the assumption is that the shader was written for version 1.0 of the ISF spec (which didn't specify this key).  The string is expected to contain one or more integers separated by dots (eg: '2', or '2.1', or '2.1.1').
- If there's a string in the top-level dict stored at the `VSN` key, this string will describe the version of this ISF file.    This key is completely optional, and its use is up to the host or editor- the goal is to provide a simple path for tracking changes in ISF files.  Like the `ISFVSN` key, this string is expected to contain one or more integers separated by dots.
- If there's a string in the top-level dict stored at the `DESCRIPTION` key, this string will be displayed as a description associated with this filter in the host app. the use of this key is optional.
- The `CATEGORIES` key in your top-level dict should store an array of strings. The strings are the category names you want the filter to appear in (assuming the host app displays categories).
- The `INPUTS` key of your top-level dict should store an array of dictionaries (each dictionary describes a different input- the inputs should appear in the host app in the order they're listed in this array). For each input dictionary:
  - The value stored with the key `NAME` must be a string, and it must not contain any whitespaces. This is the name of the input, and will also be the variable name of the input in your shader.
  - The value stored with the key `TYPE` must be a string. This string describes the type of the input, and must be one of the following values: "event", "bool", "long", "float", "point2D", "color", "image", "audio", or "audioFFT".
    - The input types "audio" and "audioFFT" specify that the input will be sent audio data of some sort from an audio source- "audio" expects to receive a raw audio wave, and "audioFFT" expects the results of an FFT performed on the raw audio wave.  This audio data is passed to the shader as an image, so "audio"- and "audioFFT"-type inputs should be treated as if they were images within the actual shader.  By default, hosts should try to provide this data at a reasonably high precision (32- or 16-bit float GL textures, for example), but if this isn't possible then lower precision is fine.
      - The images sent to "audio"-type inputs contains one row of image data for each channel of audio data (multiple channels of audio data can be passed in a single image), while each column of the image represents a single sample of the wave, the value of which is centered around 0.5.
      - The images sent to "audioFFT"-type inputs contains one row of image data for each channel of audio data (multiple channels of audio data can be passed in a single image), while each column of the image represents a single value in the FFT results.
      - Both "audio"- and "audioFFT"-type inputs allow you to specify the number of samples (the "width" of the images in which the audio data is sent) via the `MAX` key (more on this later in the discussion of `MAX`).
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
    - The dictionary describing the image to import must have a `PATH` key, and the object stored at that key must be a string. This string should describe the path to the image file, relative to the ISF file being evaluated. For example, a file named "asdf.jpg" in the same folder as the ISF file would have the `PATH` "asdf.jpg", or "./asdf.jpg" (both describe the same location). If the jpg were located in your ISF file's parent directory, its `PATH` would be "../asdf.jpg", etc.

# Converting Non-ISF GLSL shaders to ISF

- You should probably replace any calls in your shader to `texture2D()` or `texture2DRect()` with `IMG_NORM_PIXEL()` or `IMG_PIXEL()`, respectively. Images in ISF- inputs, persistent buffers, etc- can be accessed by either `IMG_NORM_PIXEL()` or `IMG_PIXEL()`, depending on whether you want to use normalized or non-normalized coordinates to access the colors of the image. If your shader isn't using these- if it's using `texture2D()` or `texture2DRect()`- it won't compile if the host application tries to send it a different type of texture.
- Many shaders pass in the resolution of the image being rendered (knowing where the fragment being evaluated is located within the output image is frequently useful). By default, ISF automatically declares a uniform vec2 named `RENDERSIZE` which is passed the dimensions of the image being rendered.
- If the shader you're converting requires a time value, note that the uniform float `TIME` is declared, and passed the duration (in seconds) which the shader's been runing when the shader's rendered.
- Many shaders don't use (or even acknowledge) the alpha channel of the image being rendered. There's nothing wrong with this- but when the shader's loaded in an application that uses the alpha channel, the output of the shader can look bizarre and unpredictable (though it usually involves something being darker than it should be). If you run into this, try setting gl_FragColor.a to 1.0 at the end of your shader.
- `gl_FragCoord.xy` contains the coordinates of the fragment being evaluated. `isf_FragNormCoord.xy` contains the normalized coordinates of the fragment being evaluated.  
- While ISF files are fragment shaders, and the host environment automatically generates a vertex shader, you can use your own vertex shader if you'd like. If you go this route, your vertex shader should have the same base name as your ISF file (just use the extension .vs), and the first thing you do in your vertex shader's main function is call `isf_vertShaderInit();`.
- If the shader you're converting requires imported graphic resources, note that the ISF format defines the ability to import image files by adding objects to your JSON dict under the `IMPORTED` key. The imported images are accessed via the usual `IMG_PIXEL()` or `IMG_NORM_PIXEL()` methods. Details on how to do this are listed below, and examples are included.
- If your texture doesn't look right, make sure your texture coordinates are ranged properly (textures are typically "clamped" by the host implementation, if you specify an out-of-range texture coordinate it may look funny).

# Differences from the first version of the ISF spec

The first version of the ISF spec did some confusing and silly things that the second version improves on.  If you want to write your own ISF host, and you want that host to support "old" ISF files, here's a link to [the original ISF spec.](http://www.vidvox.net/rays_oddsnends/ISF_v1.md)

...and here's a list of the specific changes that were made from ISFVSN 1 to ISFVSN 2:

- The `PERSISTENT_BUFFERS` object in the top-level dict has been removed- it was redundant and confusing. Anything describing a property of the buffer a pass renders to is in the appropriate pass dictionary (`PERSISTENT`, `FLOAT`, `WIDTH`, `HEIGHT`, etc).
- The uniform vec2 `vv_FragNormCoord` has been renamed `isf_FragNormCoord`, and the function `vv_vertShaderInit()` has been renamed `isf_vertShaderInit()`.  ISF is open-source, the use of "vv" for terms in the spec is inappropriate.
- The `INPUT` types "audio" and "audioFFT" didn't exist in the first version of the ISF spec.
- The `IMG_SIZE` function didn't exist in the first version of the ISF spec.
- The `TIMEDELTA`, `DATE`, and `FRAMEINDEX` uniforms didn't exist in the first version of the ISF spec.
- The first version of the ISF spec didn't have any sort of versioning label- `VSN` and `ISFVSN` didn't exist.
- The first version of the ISF spec didn't codify any conventions with respect to image filters.  The second version sets forth the basic requirement for ISF shaders that are expected to be used as image filters or transitions.
