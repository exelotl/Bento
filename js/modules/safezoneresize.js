/**
 * @moduleName SafezoneResize
 * Similar to the AutoResize, this module aids in rescaling the canvas. The 
 * difference is that this resizer fits an area of the desired size as snugly as 
 * possible in the center of the screen
 *
 * <br>Exports: Constructor
 * @module bento/safezoneresize
 * @moduleName SafezoneResize
 * @param {Object} settings - Required
 * @param {Number} settings.width - Width of the safezone
 * @param {Number} settings.height - Height of the safezone
 * @param {Boolena} settings.landscape - Wether the device orientation should be landscape or not
 * @param {Vector2} settings.anchor - Where to anchor the safezone in the screen. Default is centered (0.5, 0.5) 
 * @returns {Object} Object with two properties: screen and safezone dimensions (Rectangles)
 */
bento.define('modules/safezoneresize', [
    'bento',
    'bento/math/vector2',
    'bento/math/rectangle'
], function (
    Bento,
    Vector2,
    Rectangle
) {
    'use strict';
    return function (settings) {
        var screen = new Rectangle(0, 0, settings.width, settings.height);
        var safezone = new Rectangle(0, 0, settings.width, settings.height);

        var anchor = settings.anchor || new Vector2(0.5, 0.5);

        var innerWidth = window.innerWidth;
        var innerHeight = window.innerHeight;

        var devicePixelRatio = window.devicePixelRatio;

        var deviceWidth = innerWidth * devicePixelRatio;
        var deviceHeight = innerHeight * devicePixelRatio;

        if (settings.landscape) {
            (function () {
                var tmp = deviceWidth;
                deviceWidth = deviceHeight;
                deviceHeight = tmp;
            })();
        }

        var screenRatio = deviceWidth / deviceHeight;
        var desiredRatio = settings.width / settings.height;

        if (screenRatio > 1) {
            //user is holding device wrong
            screenRatio = 1 / screenRatio;
        }

        if (screenRatio > desiredRatio) {
            //screen is too wide, clip to height
            screen.width = settings.height * screenRatio;
        } else {
            //screen is too tall, clip to width
            screen.height = settings.width / screenRatio;
        }

        safezone.x = (screen.width - settings.width) * anchor.x;
        safezone.y = (screen.height - settings.height) * anchor.y;

        return {
            screen: screen,
            safezone: safezone
        }
    };
});