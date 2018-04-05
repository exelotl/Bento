/**
 * Sprite component with a pixi sprite exposed. Must be used with pixi renderer.
 * Useful if you want to use pixi features.
 * <br>Exports: Constructor
 * @module bento/components/pixi/sprite
 * @moduleName PixiSprite
 * @returns Returns a component object to be attached to an entity.
 */
import Bento from 'bento';
import Utils from 'bento/utils';
import Sprite from 'bento/components/sprite';

var PixiSprite = function (settings) {
    if (!(this instanceof PixiSprite)) {
        return new PixiSprite(settings);
    }
    Sprite.call(this, settings);
    this.sprite = new window.PIXI.Sprite();
};
PixiSprite.prototype = Object.create(Sprite.prototype);
PixiSprite.prototype.constructor = PixiSprite;
PixiSprite.prototype.draw = function (data) {
    var entity = data.entity;

    if (!this.currentAnimation || !this.visible) {
        return;
    }
    this.updateFrame();
    this.updateSprite(
        this.spriteImage,
        this.sourceX,
        this.sourceY,
        this.frameWidth,
        this.frameHeight
    );

    // draw with pixi
    data.renderer.translate(-Math.round(this.origin.x), -Math.round(this.origin.y));
    data.renderer.drawPixi(this.sprite);
    data.renderer.translate(Math.round(this.origin.x), Math.round(this.origin.y));
};
PixiSprite.prototype.updateSprite = function (packedImage, sx, sy, sw, sh) {
    var rectangle;
    var sprite;
    var texture;
    var image;

    if (!packedImage) {
        return;
    }
    image = packedImage.image;
    if (!image.texture) {
        // initialize pixi baseTexture
        image.texture = new window.PIXI.BaseTexture(image, window.PIXI.SCALE_MODES.NEAREST);
    }
    rectangle = new window.PIXI.Rectangle(sx, sy, sw, sh);
    texture = new window.PIXI.Texture(image.texture, rectangle);
    texture._updateUvs();

    this.sprite.texture = texture;
};

PixiSprite.prototype.toString = function () {
    return '[object PixiSprite]';
};

return PixiSprite;
