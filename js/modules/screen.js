/**
 * Screen object. Screens are convenience modules that are similar to levels/rooms/scenes in games.
 * Tiled Map Editor can be used to design the levels {@link http://www.mapeditor.org/}.
 * Note: in Tiled, you must export as json file and leave uncompressed as CSV (for now)
 * <br>Exports: Constructor
 * @module bento/screen
 * @moduleName Screen
 * @param {Object} settings - Settings object
 * @param {String} settings.tiled - Asset name of the json file
 * @param {String} settings.onShow - Callback when screen starts
 * @param {String} settings.onHide - Callback when screen is removed
 * @param {Rectangle} [settings.dimension] - Set dimension of the screen (overwritten by tmx size)
 * @returns Screen
 */

import Utils from 'bento/utils';
import Bento from 'bento';
import Rectangle from 'bento/math/rectangle';
import Vector2 from 'bento/math/vector2';
import Tiled from 'bento/tiled';

var Screen = function (settings) {
    /*settings = {
        dimension: Rectangle, [optional / overwritten by tmx size]
        tiled: String
    }*/
    var viewport = Bento.getViewport(),
        module = {
            /**
             * Name of the screen
             * @instance
             * @name name
             */
            name: null,
            /**
             * Reference to Tiled object (if tiled was used)
             * @instance
             * @see module:bento/tiled
             * @name tiled
             */
            tiled: null,
            /**
             * Dimension of the screen
             * @instance
             * @name dimension
             */
            dimension: (settings && settings.dimension) ? settings.dimension : viewport.clone(),
            extend: function (object) {
                return Utils.extend(this, object);
            },
            /**
             * Loads a tiled map
             * @function
             * @instance
             * @returns {String} name - Name of the JSON asset
             * @name loadTiled
             */
            loadTiled: function (name) {
                this.tiled = new Tiled({
                    assetName: name,
                    spawnBackground: true,
                    spawnEntities: true
                });
                this.dimension = this.tiled.dimension;
            },
            /**
             * Callback when the screen is shown (called by screen manager)
             * @function
             * @instance
             * @returns {Object} data - Extra data to be passed
             * @name onShow
             */
            onShow: function (data) {
                if (settings) {
                    // load tiled map if present
                    if (settings.tiled) {
                        this.loadTiled(settings.tiled);
                    }
                    // callback
                    if (settings.onShow) {
                        settings.onShow.call(module, data);
                    }
                }
            },
            /**
             * Removes all objects and restores viewport position
             * @function
             * @instance
             * @returns {Object} data - Extra data to be passed
             * @name onHide
             */
            onHide: function (data) {
                var viewport = Bento.getViewport();
                // 1st callback
                if (settings.onHide) {
                    settings.onHide.call(module, data);
                }
                // reset viewport scroll when hiding screen
                viewport.x = 0;
                viewport.y = 0;
                // remove all objects
                Bento.removeAll();

                // 2nd callback
                if (settings.onHidden) {
                    settings.onHidden.call(module, data);
                }
                // reset pause level
                Bento.objects.resume();
            }
        };

    return module;
};
export default Screen;
