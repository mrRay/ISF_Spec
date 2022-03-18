export default `{
    "CATEGORIES": [
        "Glitch"
    ],
    "CREDIT": "by VIDVOX",
    "DESCRIPTION": "Pixels update only based on the masking image",
    "INPUTS": [
        {
            "NAME": "inputImage",
            "TYPE": "image"
        },
        {
            "LABEL": "mask image",
            "NAME": "maskImage",
            "TYPE": "image"
        },
        {
            "DEFAULT": 0,
            "LABEL": "mask size mode",
            "LABELS": [
                "Fit",
                "Fill",
                "Stretch",
                "Copy"
            ],
            "NAME": "maskSizingMode",
            "TYPE": "long",
            "VALUES": [
                0,
                1,
                2,
                3
            ]
        },
        {
            "DEFAULT": 0,
            "MAX": 1,
            "MIN": -1,
            "NAME": "bright",
            "TYPE": "float"
        },
        {
            "DEFAULT": 1,
            "MAX": 4,
            "MIN": -4,
            "NAME": "contrast",
            "TYPE": "float"
        },
        {
            "DEFAULT": 1,
            "NAME": "RGB_mode",
            "TYPE": "bool"
        }
    ],
    "ISFVSN": 2,
    "PASSES": [
        {
            "PERSISTENT": true,
            "TARGET": "bufferVariableNameA"
        }
    ]
}`