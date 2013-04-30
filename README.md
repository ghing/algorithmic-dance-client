Algorithmic Dance Client
========================

Render dancers' skeleton movement dressed in "costumes".

SKeleton data is received over a WebSocket graphics are rendered using 
HTML5 Canvas

Why Canvas
----------

From [Thoughts on when to use Canvas and SVG](http://blogs.msdn.com/b/ie/archive/2011/04/22/thoughts-on-when-to-use-canvas-and-svg.aspx): 

> While the above image could be fully created in SVG using circle or ellipse
> elements for the dots, the time to load many thousands of elements into the
> DOM would simply be too slow. Wherever you see a large number of pixels or
> images, this is a good clue that Canvas is the technology to use—whether
> this is astronomy, biological cellular movement, or voice modulation displays.
