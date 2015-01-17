bento.define('bento/components/sprite', [
    'bento/utils',
    'bento/components/translation',
    'bento/components/rotation',
    'bento/components/scale',
    'bento/components/animation'
], function (Utils, Translation, Rotation, Scale, Animation) {
    'use strict';
    return function (base, settings) {
        if (settings.sprite) {
            settings.animation = settings.sprite;
        }
        Translation(base, settings);
        Scale(base, settings);
        Rotation(base, settings);
        Animation(base, settings);
        base.sprite = base.animation;
        return base;
    };
});