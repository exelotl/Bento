/**
 * An entity that behaves like a toggle button.
 * <br>Exports: Constructor
 * @param {Object} settings - Required, can include Entity settings
 * @param {Sprite} settings.sprite - Same as clickbutton! See @link module:bento/gui/clickbutton}
 * @param {Bool} settings.active - Whether the button starts in the active state (default: true)
 * @param {Bool} settings.toggled - Initial toggle state (default: false)
 * @param {String} settings.onToggle - Callback when user clicks on the toggle ("this" refers to the clickbutton entity).
 * @param {String} [settings.sfx] - Plays sound when pressed
 * @module bento/gui/togglebutton
 * @moduleName ToggleButton
 * @returns Entity
 * @snippet ToggleButton|constructor
ToggleButton({
    z: ${1:0},
    name: '$2',
    sfx: '$3',
    imageName: '$4',
    frameCountX: ${5:1},
    frameCountY: ${6:3},
    position: new Vector2(${7:0}, ${8:0}),
    updateWhenPaused: ${9:0},
    float: ${10:false},
    onToggle: function () {
        ${11}
    }
});
 */

import Bento from 'bento';
import Vector2 from 'bento/math/vector2';
import Rectangle from 'bento/math/rectangle';
import Sprite from 'bento/components/sprite';
import Clickable from 'bento/components/clickable';
import Entity from 'bento/entity';
import Utils from 'bento/utils';
import Tween from 'bento/tween';
import EventSystem from 'bento/eventsystem';

export default function (settings) {
    var viewport = Bento.getViewport();
    var active = true;
    var toggled = false;
    var animations = settings.animations || {
        'up': {
            speed: 0,
            frames: [0]
        },
        'down': {
            speed: 0,
            frames: [1]
        }
    };
    var sprite = settings.sprite || new Sprite({
        image: settings.image,
        imageName: settings.imageName,
        originRelative: settings.originRelative || new Vector2(0.5, 0.5),
        padding: settings.padding,
        frameWidth: settings.frameWidth,
        frameHeight: settings.frameHeight,
        frameCountX: settings.frameCountX,
        frameCountY: settings.frameCountY,
        animations: animations
    });
    var clickable = new Clickable({
        sort: settings.sort,
        ignorePauseDuringPointerUpEvent: settings.ignorePauseDuringPointerUpEvent,
        onClick: function () {
            if (!active) {
                return;
            }
            sprite.setAnimation('down');
            EventSystem.fire('toggleButton-toggle-down', {
                entity: entity,
                event: 'onClick'
            });
        },
        onHoldEnter: function () {
            if (!active) {
                return;
            }
            sprite.setAnimation('down');
            EventSystem.fire('toggleButton-toggle-down', {
                entity: entity,
                event: 'onHoldEnter'
            });
        },
        onHoldLeave: function () {
            if (!active) {
                return;
            }
            sprite.setAnimation(toggled ? 'down' : 'up');
            EventSystem.fire('toggleButton-toggle-' + (toggled ? 'down' : 'up'), {
                entity: entity,
                event: 'onHoldLeave'
            });
        },
        pointerUp: function () {
            if (!active) {
                return;
            }
            sprite.setAnimation(toggled ? 'down' : 'up');
            EventSystem.fire('toggleButton-toggle-' + (toggled ? 'down' : 'up'), {
                entity: entity,
                event: 'pointerUp'
            });
        },
        onHoldEnd: function () {
            if (!active) {
                return;
            }
            if (toggled) {
                toggled = false;
            } else {
                toggled = true;
            }
            if (settings.onToggle) {
                settings.onToggle.apply(entity);
                if (settings.sfx) {
                    Bento.audio.stopSound(settings.sfx);
                    Bento.audio.playSound(settings.sfx);
                }
            }
            sprite.setAnimation(toggled ? 'down' : 'up');
            EventSystem.fire('toggleButton-onToggle', {
                entity: entity,
                event: 'onHoldEnd'
            });
        }
    });
    var entitySettings = Utils.extend({
        z: 0,
        name: 'toggleButton',
        position: new Vector2(0, 0),
        family: ['buttons']
    }, settings);

    // merge components array
    entitySettings.components = [
        sprite,
        clickable
    ].concat(settings.components || []);

    var entity = new Entity(entitySettings).extend({
        /**
         * Check if the button is toggled
         * @function
         * @instance
         * @name isToggled
         * @snippet #ToggleButton.isToggled|Boolean
            isToggled();
            * @returns {Bool} Whether the button is toggled
            */
        isToggled: function () {
            return toggled;
        },
        /**
         * Toggles the button programatically
         * @function
         * @param {Bool} state - Toggled or not
         * @param {Bool} doCallback - Perform the onToggle callback or not
         * @instance
         * @name toggle
         * @snippet #ToggleButton.toggle|snippet
            toggle(${1:true});
            * @snippet #ToggleButton.toggle|do callback
            toggle(${1:true}, true);
            */
        toggle: function (state, doCallback) {
            if (Utils.isDefined(state)) {
                toggled = state;
            } else {
                toggled = !toggled;
            }
            if (doCallback) {
                if (settings.onToggle) {
                    settings.onToggle.apply(entity);
                    if (settings.sfx) {
                        Bento.audio.stopSound(settings.sfx);
                        Bento.audio.playSound(settings.sfx);
                    }
                }
            }
            sprite.setAnimation(toggled ? 'down' : 'up');
        },
        mimicClick: function () {
            entity.getComponent('clickable').callbacks.onHoldEnd();
        },
        /**
         * Activates or deactives the button. Deactivated buttons cannot be pressed.
         * @function
         * @param {Bool} active - Should be active or not
         * @instance
         * @name setActive
         * @snippet #ToggleButton.setActive|snippet
            setActive(${1:true});
            */
        setActive: function (bool) {
            active = bool;
            if (!active && animations.inactive) {
                sprite.setAnimation('inactive');
            } else {
                sprite.setAnimation(toggled ? 'down' : 'up');
            }
        },
        /**
         * Performs the callback as if the button was clicked
         * @function
         * @instance
         * @name doCallback
         * @snippet #ToggleButton.doCallback|snippet
            doCallback();
            */
        doCallback: function () {
            settings.onToggle.apply(entity);
        },
        /**
         * Check if the button is active
         * @function
         * @instance
         * @name isActive
         * @returns {Bool} Whether the button is active
         * @snippet #ToggleButton.isActive|Boolean
            isActive();
            */
        isActive: function () {
            return active;
        }
    });

    if (Utils.isDefined(settings.active)) {
        active = settings.active;
    }
    // set intial state
    if (settings.toggled) {
        toggled = true;
    }

    animations = sprite.animations || animations;
    if (!active && animations.inactive) {
        sprite.setAnimation('inactive');
    } else {
        sprite.setAnimation(toggled ? 'down' : 'up');
    }

    // events for the button becoming active
    entity.attach({
        name: 'attachComponent',
        start: function () {
            EventSystem.fire('toggleButton-start', {
                entity: entity
            });
        },
        destroy: function () {
            EventSystem.fire('toggleButton-destroy', {
                entity: entity
            });
        }
    });

    // active property
    Object.defineProperty(entity, 'active', {
        get: function () {
            return active;
        },
        set: entity.setActive
    });

    return entity;
};
