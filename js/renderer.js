/*
 * Base functions for renderer. Has many equivalent functions to a canvas context.
 * <br>Exports: Constructor
 * @module bento/renderer
 * @moduleName Renderer
 */

import Utils from 'bento/utils';

export default function (rendererName, canvas, settings, callback) {
    var module = {
        save: function () {},
        restore: function () {},
        setTransform: function (a, b, c, d, tx, ty) {},
        translate: function () {},
        scale: function (x, y) {},
        rotate: function (angle) {},
        fillRect: function (color, x, y, w, h) {},
        fillCircle: function (color, x, y, radius) {},
        strokeRect: function (color, x, y, w, h) {},
        drawLine: function (color, ax, ay, bx, by, width) {},
        drawImage: function (spriteImage, sx, sy, sw, sh, x, y, w, h) {},
        begin: function () {},
        flush: function () {},
        setColor: function () {},
        getOpacity: function () {},
        setOpacity: function () {},
        createSurface: function () {},
        setContext: function () {},
        restoreContext: function () {}
    };
    
    import renderer from rendererName;
    Utils.extend(module, renderer(canvas, settings), true);
    callback(module);
};
