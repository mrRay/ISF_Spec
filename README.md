# What is ISF?

ISF stands for "Interactive Shader Format", and is a file format that describes a GLSL fragment shader, as well as how to execute and interact with it. The goal of this file format is to provide a simple and minimal interface for image filters and generative video sources that allows them to be interacted with and reused in a generic and modular fashion. ISF is nothing more than a [slightly modified] GLSL fragment shader with a JSON blob at the beginning that describes how to interact with the shader (how many inputs/uniform variables it has, what their names are, what kind of inputs/variables they are, that sort of thing). ISF isn't some crazy new groundbreaking technology- it's just a simple and useful combination of two things that have been around for a while to make a minimal- but highly effective- filter format.

### Spec Overview:
- You are limited only to what you can accomplish in a GLSL program (vertex + fragment shader, but the frag shader is where most of the action happens in most of the ISF files we've seen so far). Fragment shaders are enormously powerful, relatively simple, and there's a burgeoning community of people who are eager to teach, learn, and share knowledge about them. GLSL shaders aren't specific to any one platform/application/purpose- they're used by a lot of different people for a lot of different things, so there's a wide variety of artists and developers who are making them for all sorts of different purposes (for some inspiring and mind-blowing examples, grab a WebGL-enabled browser and take a look at ShaderToy and GLSL Sandbox). The ISF Editor has a feature that will attempt to automatically convert the shaders from these sites to ISF files.
- Frag shaders are easily recompiled dynamically- experimenting with changes to filters is completely painless. An ISF filter can be as little as a single .fs file, and you only need a text editor to create or edit filters. A sample app is provided (the ISF Editor) that lets you test and edit ISF files (both filters and sources).
- One of ISF's defining characteristics is the JSON dict at the beginning of your shader which describes it. This is a very loose, open-ended file format: it can easily be extended by recognizing more keys in the future if we think of new things that might be nice to have. For example, here are some of the base features of ISF, all of which were made possible by adding a couple items to the JSON dict:
  - The ISF format allows multiple render passes at different sizes (the same shader can be run several times on a variety of inputs). This is optional- all you have to do if you want multiple passes is add an appropriately-populated array at the `PASSES` key in your JSON dict.
  - The ISF format allows persistent buffers of arbitrary dimensions: you can render into a buffer, and keep that buffer with your filter for later use (like a "backbuffer" or an "image accumulator"). This is also optional- to use it, you just have to add an appropriately-populated array to the `PERSISTENT_BUFFERS` key of the JSON dict.
  - Importing static image resources is equally easy: just add something under the `IMPORTED` key of the JSON dict (details in the spec).
  - etc.- If you have any ideas or requests, please get in touch!
- Many of the GLSL frag shaders you'll encounter on the internet may require slight modification before they can be used as ISF files. A later section in this document ("Converting Non-ISF GLSL shaders) has notes on the more common changes we've encountered. While many GLSL shaders would benefit from slight modification before they're used as ISF files, these modifications are minimal (we didn't trade "boilerplate code" for "lots of modifications"), and they exist first and foremost because they're extremely convenient- they make it a lot easier to write compatible filters that run under a wide variety of circumstances. For example:
  - "uniform" variables that ISF is expected to interact with can't be declared in your shader because the declaration is automatically prepended to your code when your shader is loaded. If you want to change a data type, you only have to change it in one place (in your JSON dict).
  - Replacing `texture2D()` and `texture2DRect()` is convenient because their replacements work with both 2D and RECT samplers, images that aren't full-frame in their textures (like 1080p images in 2048x2048 texture) and images that are flipped vertically in their texture. As a shader author, you no longer have to wonder what kind of sampler you're working with- you can access pixels transparently using either their pixel-based coords (`IMG_PIXEL()`) or their normalized coords (`IMG_NORM_PIXEL()`), whichever's more convenient in a given situation. and if you really don't like change, you don't have to do this and your code will still run as written.

### ISF source code/hosts:

- I've made the ISF implementation I wrote for VDMX and the ISF Editor app freely available as VVISFKit.framework in my open-source repos here: github.com/mrRay/vvopensource.
- A friend linked me to an OpenFrameworks-based ISF loader here: github.com/satoruhiga/ofxISF
- The code for this website (written by Michael Feldstein) is also open-source and is freely available here: github.com/msfeldstein/ISF-JS-Renderer
- ...and I was happy to learn that Cycling74's Gen can export to ISF files 

### Downloads: ISF editor/test app, Sample filters

An ISF editor and test app is available here: 
[ISF Editor.app.zip](http://www.vidvox.net/rays_oddsnends/ISF%20Editor_2.9.2.zip)

Basic features:
- Renders and displays ISF files. Has a built-in video source, and can also use any QC comps, movie files, image files, Syphon video servers, or AVCapture-compatible video inputs as a video source for testing ISF-based image filters.
- Automatically publishes the rendered output as a Syphon source
- Can render ISF files to movie files, with optional anti-aliasing
- UI items are automatically created for inputs, allowing you to interact with your ISF file
- Built-in shader editor with syntax coloring and integrated error display along with plenty of logging to facilitate creating and debugging shaders.
- Output window can be paused, and can also be used to view the output of the individual render passes in your ISF file, which facilitates debugging by providing shader devs with a quick and easy way to visualize values being used in their shaders
- "Import from Shadertoy/GLSL Sandbox" feature can be used to automatically convert the vast majority of shaders found on Shadertoy and GLSL Sandbox to ISF sources and filters. Some shaders may need further modification, but it's shocking how many will "just work".

Here are a bunch of simple test ISF files that demonstrate ISF's basic features (these are test filters, and we don't expect them to have signifcant creative use):
[ISF Test/Tutorial filters](http://vidvox.net/rays_oddsnends/ISF%20tests+tutorials.zip)

Here are a bunch of sample ISF files (both sources and filters) which you may find more interesting:
[Sample ISF image filters (and a couple sources)](http://vidvox.net/rays_oddsnends/ISF%20files.zip)

### Creating ISF Files

The ISF Editor app can automatically create an "empty" ISF file with a basic template, but all you really need to create an ISF file is a text editor: an ISF file is nothing more than a text file with a .fs or .frag extension. While ISF files can technically be loaded from anywhere on your drive, the default global repository of ISF files will be either /Library/Graphics/ISF or ~/Library/Graphics/ISF.

### How ISF works behind the scenes

When you load an ISF file, the shader code in your file is modified slightly- some variables are declared, and some code is find-and-replaced. If you haven't explicitly created a vertex shader, one will automatically be generated. Each time you render a frame, the `INPUTS` variable values are passed to the shader, and then the shader is rendered (more than once if desired, potentially into image buffers accessible from different rendering passes and across different frames). All the changes to the fragment and vertex shaders you write can be viewed in the editor- among other things, the tab view in the bottom splitter (collapsed by default) can display the compiled fragment and vertex shaders as they're being used.

### Automatically-Created Variables

- "uniform" variables of the appropriate type are automatically declared for any `INPUTS` you define. You shouldn't declare uniform variables you want ISF to create UI items for- if you do this, your shader won't work (and the error displayed in the ISF Editor app will indicate that you've redeclared a variable). "uniform" samplers are also declared for any persistent or temporary buffers (samplers are automatically declared of the appropriate type- the shader will be recompiled behind the scenes if a texture type for any of the textures in use changes).
- The uniform int `PASSINDEX` is automatically declared, and set to 0 on the first rendering pass. Subsequent passes (defined by the dicts in your `PASSES` array) increment this int.
- The uniform vec2 `RENDERSIZE` is automatically declared, and is set to the rendering size (in pixels) of the current rendering pass.
- The uniform vec2 `vv_FragNormCoord` is automatically declared. This is a convenience variable, and repesents the normalized coordinates of the current fragment ([0,0] is the bottom-left, [1,1] is the top-right).
- The uniform float `TIME` is automatically declared, and is set to the current rendering time (in seconds) of the shader. This variable is updated once per rendered frame- if a frame requires multiple rendering passes, the variable is only updated once for all the passes.
- "image"-type inputs automatically declare other additional uniform vars (for passing the image resolution and other associated properties)- if you want to see these, just use the "ISF Editor" app listed above to view the compiled fragment shader source of your filter. 

### Recognized Input Types

Boolean, float, long (presented as a pop-up button), event (single-frame-on boolean), 2d point (vec2), color (vec4), and image (behind the scenes, images are either sampler2D or sampler2DRect- the shader will be modified automatically).

### Additional Functions

```
<vec4> pixelColor = IMG_PIXEL(<image> imageName, <vec2> pixelCoord); 
<vec4> pixelColor = IMG_NORM_PIXEL(<image> imageName, <vec2> normalizedPixelCoord);
```

There are really only two functions worth mentioning: `IMG_PIXEL()` and `IMG_NORM_PIXEL()`, which fetch the color of a pixel in an image using either pixel-based coords or normalized coords, respectively, and should be used *instead of* `texture2D()` or `texture2DRect()`. In both functions, "imageName" refers to the variable name of the image you want to work with. This image can come from a variety of sources- an "image"-type input, a persistent buffer, an imported image, etc: all of these sources of images have a name value associated with them, and this name is what you pass to these functions. For several examples, please check out this .zip of extremely simple shaders that demonstrate the features of ISF, one at a time:
[ISF Test/Tutorial filters](http://vidvox.net/rays_oddsnends/ISF%20tests+tutorials.zip)

### Persistent Buffers

ISF files can define persistent buffers. These buffers are images (GL textures) that stay with the ISF file for as long as it exists. This is useful if you want to "build up" an image over time- you can repeatedly query and update the contents of persistent buffers by rendering into them- or if you want to perform calculations across the entire image, storing the results somewhere for later evaluation. Details on exactly how to do this are in the spec (below).

### Multiple Rendering Passes, Rendering to Buffers

The ISF file format defines the ability to execute a shader multiple times in the process of rendering a frame for output- each time the shader's executed (each pass), the uniform int variable `PASSINDEX` is incremented. Details on how to accomplish this are described below in the spec, but the basic process involves adding an array of dicts to the `PASSES` key in your top-level JSON dict. Each dict in the `PASSES` array describes a different rendering pass- you can render into a persistent buffer, or you can make up a new name, and the ISF host will create a new temporary buffer to render into (after you render into it you can read from the temp buffer again in subsequent render passes like any other buffer/input image/imported image, but the buffer will be deleted once ISF has finished rendering a frame).

### Converting Non-ISF GLSL shaders to ISF

- You should probably replace any calls in your shader to `texture2D()` or `texture2DRect()` with `IMG_NORM_PIXEL()` or `IMG_PIXEL()`, respectively. Images in ISF- inputs, persistent buffers, etc- can be accessed by either `IMG_NORM_PIXEL()` or `IMG_PIXEL()`, depending on whether you want to use normalized or non-normalized coordinates to access the colors of the image. If your shader isn't using these- if it's using `texture2D()` or `texture2DRect()`- it won't compile if the host application tries to send it a different type of texture.
- Many shaders pass in the resolution of the image being rendered (knowing where the fragment being evaluated is located within the output image is frequently useful). By default, ISF automatically declares a uniform vec2 named `RENDERSIZE` which is passed the dimensions of the image being rendered.
- If the shader you're converting requires a time value, note that the uniform float `TIME` is declared, and passed the duration (in seconds) which the shader's been runing when the shader's rendered.
- Many shaders don't use (or even acknowledge) the alpha channel of the image being rendered. There's nothing wrong with this- but when the shader's loaded in an application that uses the alpha channel, the output of the shader can look bizarre and unpredictable (though it usually involves something being darker than it should be). If you run into this, try setting gl_FragColor.a to 1.0 at the end of your shader.
- `gl_FragCoord.xy` contains the coordinates of the fragment being evaluated. `vv_FragNormCoord.xy` contains the normalized coordinates of the fragment being evaluated.
- While ISF files are fragment shaders, and the host environment automatically generates a vertex shader, you can use your own vertex shader if you'd like. If you go this route, your vertex shader should have the same base name as your ISF file (just use the extension .vs), and the first thing you do in your vertex shader's main function is call `vv_vertShaderInit();`.
- If the shader you're converting requires imported graphic resources, note that the ISF format defines the ability to import image files by adding objects to your JSON dict under the `IMPORTED` key. The imported images are accessed via the usual `IMG_PIXEL()` or `IMG_NORM_PIXEL()` methods. Details on how to do this are listed below, and examples are included.
- If your texture doesn't look right, make sure your texture coordinates are ranged properly (textures are typically "clamped" by the host implementation, if you specify an out-of-range texture coordinate it may look funny).

### The ISF "specification"

First of all, there are super-simple examples that cover all of this- check out the various "Test____.fs" sample filters located here:
[ISF Test/Tutorial filters](http://vidvox.net/rays_oddsnends/ISF%20tests+tutorials.zip)
...you will probably learn more, faster, from the examples than you'll get by reading this document: each example describes a single aspect of the ISF file format, and they're extremely handy for testing, reference, or as a tutorial (the ISF file format is very small).

- The first thing in your ISF file needs to be a comment (delineated using "/\*" and "\*/") containing a JSON dict. If the comment doesn't exist- or the JSON dict is malformed or can't be parsed- your ISF file can't be loaded (ISF files can be tested with the ISF Editor linked to elsewhere on this page). This JSON dict is referred to as your "top-level dict" throughout the rest of this document. - If there's a string in the top-leve dict stored at the `DESCRIPTION` key, this string will be displayed as a description associated with this filter in the host app. the use of this key is optional.
- The `CATEGORIES` key in your top-level dict should store an array of strings. The strings are the category names you want the filter to appear in (assuming the host app displays categories).
- The `INPUTS` key of your top-level dict should store an array of dictionaries (each dictionary describes a different input- the inputs should appear in the host app in the order they're listed in this array). For each input dictionary:
  - The value stored with the key `NAME` must be a string, and it must not contain any whitespaces. This is the name of the input, and will also be the variable name of the input in your shader.
  - The value stored with the key `TYPE` must be a string. This string describes the type of the input, and must be one of the following values: "event", "bool", "long", "float", "point2D", "color", or "image".
  - Where appropriate, `DEFAULT`, `MIN`, `MAX`, and `IDENTITY` may be used to further describe value attributes of the input. Note that "image"-type inputs don't have any of these, and that "color"-type inputs use an array of floats to describe min/max/default colors. Everywhere else values are stored as native JSON values where possible (float as float, bool as bool, etc).
  - The value stored with the key `LABEL` must be a string. This key is optional- the `NAME` of an input is the variable name, and as such it can't contain any spaces/etc. The `LABEL` key provides host sofware with the opportunity to display a more human-readable name. This string is purely for display purposes and isn't used for processing at all.
  - Other notes:
    - "event" type inputs describe events that do not have an associated value- a momentary click button.
    - The "long" type input is used to implement pop-up buttons/pop-up menus in the host UI. As such, "long"-type input dictionaries have a few extra keys:
      - The `VALUES` key stores an array of integer values. This array may have repeats, and the values correspond to the labels. When you choose an item from the pop-up menu, the corresponding value from this array is sent to your shader.
      - The `LABELS` key stores an array of strings. This array may have repeats, and the strings/labels correspond to the array of values.
- The `PERSISTENT_BUFFERS` key describes persistent buffers: these are buffers that will stay with your effect until it's deleted. This key is optional: you don't need to include it. The object at this key needs to be either an array or a dictionary:
  - If the item at `PERSISTENT_BUFFERS` is an array, each item in that array must be a string. This string is the name of the persistent buffer in your shader (the variable name). This is the easiest/fastest way to add a persistent dict. If you ask the filter to render a frame at a different resolution, persistent buffers are resized to accommodate.
  - If the item at `PERSISTENT_BUFFERS` is a dictionary, then each key-value pair in that dictionary describes a persistent buffer (the key is the name of the buffer, the value is a dictionary with its properties).
    - If the buffer dictionary has a value for the key `FLOAT` (this key is optional), the persistent buffer that will be created with have 32bit float per channel precision. As you might expect float buffers are proportionally slower to work with, but if you need precision- if you're working with an image accumulator, or visual persistence project, for example- then you may want to consider using this. This can also be used to store variables between passes/between frames- each pixel can store four 32-bit floats, so you can render a low-res pass to a float buffer to store values, and then read them back in subsequent rendering passes.
    - If the buffer dictionary has a value for the keys `WIDTH` or `HEIGHT` (these keys are optional), that value is expected to be a string with an equation describing the width/height of the buffer. This equation may reference variables: the width and height of the image requested from this filter are passed to the equation as `$WIDTH` and `$HEIGHT`, and the value of any other inputs declared in `INPUTS` can also be passed to this equation (for example, the value from the float input "blurAmount" would be represented in an equation as "$blurAmount"). This equation is evaluated once per frame, when you initially pass the filter a frame (it's not evaluated multiple times if the ISF file describes multiple rendering passes to produce a sigle frame). For more information (constants, built-in functions, etc) on math expression evaluations, please see the documentation for the excellent DDMathParser by Dave DeLong, which is what we're presently using.
- The `PASSES` key should store an array of dictionaries. Each dictionary describes a different rendering pass. This key is optional: you don't need to include it, and if it's not present your effect will be assumed to be single-pass.
  - If any of the dicts in `PASSES` has a string stored at the key `TARGET`, this string describes the name of the buffer this pass should render into. You can specify that a pass should render into a persistent buffer by putting its name in here. Alternately, you could make up a different name and put it here- the ISF host will automatically create a temporary buffer using this name, and you can read the pixels from this temporary buffer back in your shader in a subsequent rendering pass. Temporary buffers are deleted (or returned to a buffer pool) after the ISF file has finished rendering a frame of output (only persistent buffers last between frames).
  - If one of the dicts in `PASSES` has a string stored at the keys `WIDTH` or `HEIGHT` (these keys are optional), that string is an equation used to describe the width or height of the target buffer this pass is rendering into. For more info, see the description of the `WIDTH` and `HEIGHT` keys from `PERSISTENT_BUFFERS` (above).
  - If one of the dicts in `PASSES` has a value stored at the `FLOAT` key (this key is optional), that value is used to indicate whether or not this pass renders into a float-precision buffer. For more info, see the description of the `FLOAT` key from `PERSISTENT_BUFFERS` (above).
- The `IMPORTED` key describes buffers that will be created for image files that you want ISF to automatically import. This key is optional: you don't need to include it, and if it's not present your ISF file just won't import any external images. The item stored at this key should be a dictionary.
  - Each key-value pair in the `IMPORTED` dictionary describes a single image file to import. The key for each item in the `IMPORTED` dictionary is the name of the buffer as it will be used in your ISF file, and the value for each item in the `IMPORTED` dictionary is another dictionary describing the file to be imported.
    - The dictionary describing the image to import must have a `PATH` key, and the object stored at that key must be a string. This string should describe the path to the image file, relative to the ISF file being evaluated. For example, a file named "asdf.jpg" in the same folder as the ISF file would have the `PATH` "asdf.jpg", or "./asdf.jpg" (both describe the same location). If the jpg were located in your ISF file's parent directory, its `PATH` would be "../asdf.jpg", etc.
