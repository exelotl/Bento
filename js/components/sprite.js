/**
 * Sprite component. Draws an animated sprite on screen at the entity position.
 * <br>Exports: Constructor
 * @module bento/components/sprite
 * @moduleName Sprite
 * @param {Object} settings - Settings
 * @param {String} settings.imageName - Asset name for the image. Calls Bento.assets.getImage() internally.
 * @param {String} settings.imageFromUrl - Load image from url asynchronously. (NOT RECOMMENDED, you should use imageName)
 * @param {Function} settings.onLoad - Called when image is loaded through URL
 * @param {Number} settings.frameCountX - Number of animation frames horizontally (defaults to 1)
 * @param {Number} settings.frameCountY - Number of animation frames vertically (defaults to 1)
 * @param {Number} settings.frameWidth - Alternative for frameCountX, sets the width manually
 * @param {Number} settings.frameHeight - Alternative for frameCountY, sets the height manually
 * @param {Number} settings.paddding - Pixelsize between frames
 * @param {Object} settings.animations - Object literal defining animations, the object literal keys are the animation names
 * @param {Boolean} settings.animations[...].loop - Whether the animation should loop (defaults to true)
 * @param {Number} settings.animations[...].backTo - Loop back the animation to a certain frame (defaults to 0)
 * @param {Number} settings.animations[...].speed - Speed at which the animation is played. 1 is max speed (changes frame every tick). (defaults to 1)
 * @param {Array} settings.animations[...].frames - The frames that define the animation. The frames are counted starting from 0 (the top left)
 * @example
// Defines a 3 x 3 spritesheet with several animations
// Note: The default is automatically defined if no animations object is passed
var sprite = new Sprite({
        imageName: "mySpriteSheet",
        frameCountX: 3,
        frameCountY: 3,
        animations: {
            "default": {
                frames: [0]
            },
            "walk": {
                speed: 0.2,
                frames: [1, 2, 3, 4, 5, 6]
            },
            "jump": {
                speed: 0.2,
                frames: [7, 8]
            }
        }
     }),
    entity = new Entity({
        components: [sprite] // attach sprite to entity
                             // alternative to passing a components array is by calling entity.attach(sprite);
    });

// attach entity to game
Bento.objects.attach(entity);
 * @returns Returns a component object to be attached to an entity.
 */
bento.define('bento/components/sprite', [
    'bento',
    'bento/utils',
    'bento/math/vector2'
], function (
    Bento,
    Utils,
    Vector2
) {
    'use strict';
    var Sprite = function (settings) {
        if (!(this instanceof Sprite)) {
            return new Sprite(settings);
        }
        this.entity = null;
        this.name = 'sprite';
        this.visible = true;
        this.parent = null;
        this.rootIndex = -1;

        this.animationSettings = settings || {
            frameCountX: 1,
            frameCountY: 1
        };

        // sprite settings
        this.spriteImage = null;
        this.frameCountX = 1;
        this.frameCountY = 1;
        this.frameWidth = 0;
        this.frameHeight = 0;
        this.padding = 0;
        this.origin = new Vector2(0, 0);

        // drawing internals
        this.frameIndex = 0;
        this.sourceFrame = 0;
        this.sourceX = 0;
        this.sourceY = 0;


        // set to default
        this.animations = {};
        this.currentAnimation = null;
        this.currentAnimationLength = 0;

        this.onCompleteCallback = function () {};
        this.setup(settings);
    };
    /**
     * Sets up Sprite. This can be used to overwrite the settings object passed to the constructor.
     * @function
     * @instance
     * @param {Object} settings - Settings object
     * @name setup
     */
    Sprite.prototype.setup = function (settings) {
        var self = this,
            padding = 0,
            spriteSheet;

        if (settings && settings.spriteSheet) {
            //load settings from animation JSON, and set the correct image
            spriteSheet = Bento.assets.getSpriteSheet(settings.spriteSheet);
            settings = Utils.copyObject(spriteSheet.animation);
            settings.image = spriteSheet.image;
            if (settings.animation) {
                settings.animations = {
                    default: settings.animation
                };
            }
        }

        this.animationSettings = settings || this.animationSettings;
        padding = this.animationSettings.padding || 0;

        // add default animation
        if (!this.animations['default']) {
            if (!this.animationSettings.animations) {
                this.animationSettings.animations = {};
            }
            if (!this.animationSettings.animations['default']) {
                this.animationSettings.animations['default'] = {
                    frames: [0]
                };
            }
        }

        // get image
        if (settings.image) {
            this.spriteImage = settings.image;
        } else if (settings.imageName) {
            // load from string
            if (Bento.assets) {
                this.spriteImage = Bento.assets.getImage(settings.imageName);
            } else {
                throw 'Bento asset manager not loaded';
            }
        } else if (settings.imageFromUrl) {
            // load from url
            if (!this.spriteImage && Bento.assets) {
                Bento.assets.loadImageFromUrl(settings.imageFromUrl, settings.imageFromUrl, function (err, asset) {
                    self.spriteImage = Bento.assets.getImage(settings.imageFromUrl);
                    self.setup(settings);

                    if (settings.onLoad) {
                        settings.onLoad();
                    }
                });
                // wait until asset is loaded and then retry
                return;
            }
        } else {
            // no image specified
            return;
        }
        if (!this.spriteImage) {
            Utils.log("ERROR: something went wrong with loading the sprite.");
            return;
        }
        // use frameWidth if specified (overrides frameCountX and frameCountY)
        if (this.animationSettings.frameWidth) {
            this.frameWidth = this.animationSettings.frameWidth;
            this.frameCountX = Math.floor(this.spriteImage.width / this.frameWidth);
        } else {
            this.frameCountX = this.animationSettings.frameCountX || 1;
            this.frameWidth = (this.spriteImage.width - padding * (this.frameCountX - 1)) / this.frameCountX;
        }
        if (this.animationSettings.frameHeight) {
            this.frameHeight = this.animationSettings.frameHeight;
            this.frameCountY = Math.floor(this.spriteImage.height / this.frameHeight);
        } else {
            this.frameCountY = this.animationSettings.frameCountY || 1;
            this.frameHeight = (this.spriteImage.height - padding * (this.frameCountY - 1)) / this.frameCountY;
        }

        this.padding = this.animationSettings.padding || 0;

        if (this.animationSettings.origin) {
            this.origin.x = this.animationSettings.origin.x;
            this.origin.y = this.animationSettings.origin.y;
        }

        // set default
        Utils.extend(this.animations, this.animationSettings.animations, true);
        this.setAnimation('default');

        this.updateEntity();
    };

    Sprite.prototype.updateEntity = function () {
        if (!this.entity) {
            return;
        }
        var relOriginX = this.entity.origin.x / this.entity.dimension.width;
        var relOriginY = this.entity.origin.y / this.entity.dimension.height;

        this.entity.dimension.width = this.frameWidth;
        this.entity.dimension.height = this.frameHeight;
        //reset entity's origin
        this.entity.setOriginRelative(new Vector2(relOriginX, relOriginY));
    };

    Sprite.prototype.attached = function (data) {
        var animation,
            animations = this.animationSettings.animations,
            i = 0,
            len = 0,
            highestFrame = 0;

        this.entity = data.entity;
        // set dimension of entity object
        this.updateEntity();

        // check if the frames of animation go out of bounds
        for (animation in animations) {
            for (i = 0, len = animations[animation].frames.length; i < len; ++i) {
                if (animations[animation].frames[i] > highestFrame) {
                    highestFrame = animations[animation].frames[i];
                }
            }
            if (!Sprite.suppressWarnings && highestFrame > this.frameCountX * this.frameCountY - 1) {
                console.log("Warning: the frames in animation " + animation + " of " + (this.entity.name || this.entity.settings.name) + " are out of bounds. Can't use frame " + highestFrame + ".");
            }

        }
    };
    /**
     * Set component to a different animation. The animation won't change if it's already playing.
     * @function
     * @instance
     * @param {String} name - Name of the animation.
     * @param {Function} callback - Called when animation ends.
     * @param {Boolean} keepCurrentFrame - Prevents animation to jump back to frame 0
     * @name setAnimation
     */
    Sprite.prototype.setAnimation = function (name, callback, keepCurrentFrame) {
        var anim = this.animations[name];
        if (!Sprite.suppressWarnings && !anim) {
            console.log('Warning: animation ' + name + ' does not exist.');
            return;
        }
        if (anim && (this.currentAnimation !== anim || (this.onCompleteCallback !== null && Utils.isDefined(callback)))) {
            if (!Utils.isDefined(anim.loop)) {
                anim.loop = true;
            }
            if (!Utils.isDefined(anim.backTo)) {
                anim.backTo = 0;
            }
            // set even if there is no callback
            this.onCompleteCallback = callback;
            this.currentAnimation = anim;
            this.currentAnimation.name = name;
            this.currentAnimationLength = this.currentAnimation.frames.length;
            if (!keepCurrentFrame) {
                this.currentFrame = 0;
            }
            if (!Sprite.suppressWarnings && this.currentAnimation.backTo > this.currentAnimationLength) {
                console.log('Warning: animation ' + name + ' has a faulty backTo parameter');
                this.currentAnimation.backTo = this.currentAnimationLength;
            }
        }
    };
    /**
     * Bind another spritesheet to this sprite.
     * @function
     * @instance
     * @param {String} name - Name of the spritesheet.
     * @param {Function} callback - Called when animation ends.
     * @name setAnimation
     */
    Sprite.prototype.setSpriteSheet = function (name, callback) {
        var spriteSheet = Bento.assets.getSpriteSheet(name);
        var anim = spriteSheet.animation;

        this.spriteImage = spriteSheet.image;

        this.animations = {
            default: {
                frames: [0]
            }
        };

        if (anim.animation) {
            this.animations.default = anim.animation;
        } else if (anim.animations) {
            this.animations = anim.animations;
        }

        this.padding = anim.padding || 0;

        // use frameWidth if specified (overrides frameCountX and frameCountY)
        if (anim.frameWidth) {
            this.frameWidth = anim.frameWidth;
            this.frameCountX = Math.floor(this.spriteImage.width / this.frameWidth);
        } else {
            this.frameCountX = anim.frameCountX || 1;
            this.frameWidth = (this.spriteImage.width - this.padding * (this.frameCountX - 1)) / this.frameCountX;
        }
        if (anim.frameHeight) {
            this.frameHeight = anim.frameHeight;
            this.frameCountY = Math.floor(this.spriteImage.height / this.frameHeight);
        } else {
            this.frameCountY = anim.frameCountY || 1;
            this.frameHeight = (this.spriteImage.height - this.padding * (this.frameCountY - 1)) / this.frameCountY;
        }

        if (anim.origin) {
            this.origin.x = anim.origin.x;
            this.origin.y = anim.origin.y;
        } else {
            this.origin.x = 0;
            this.origin.y = 0;
        }

        this.updateEntity();

        this.setAnimation('default', callback);
    };
    /**
     * Returns the name of current animation playing
     * @function
     * @instance
     * @returns {String} Name of the animation playing, null if not playing anything
     * @name getAnimationName
     */
    Sprite.prototype.getAnimationName = function () {
        return this.currentAnimation.name;
    };
    /**
     * Set current animation to a certain frame
     * @function
     * @instance
     * @param {Number} frameNumber - Frame number.
     * @name setFrame
     */
    Sprite.prototype.setFrame = function (frameNumber) {
        this.currentFrame = frameNumber;
    };
    /**
     * Get speed of the current animation.
     * @function
     * @instance
     * @returns {Number} Speed of the current animation
     * @name getCurrentSpeed
     */
    Sprite.prototype.getCurrentSpeed = function () {
        return this.currentAnimation.speed;
    };
    /**
     * Set speed of the current animation.
     * @function
     * @instance
     * @param {Number} speed - Speed at which the animation plays.
     * @name setCurrentSpeed
     */
    Sprite.prototype.setCurrentSpeed = function (value) {
        this.currentAnimation.speed = value;
    };
    /**
     * Returns the current frame number
     * @function
     * @instance
     * @returns {Number} frameNumber - Not necessarily a round number.
     * @name getCurrentFrame
     */
    Sprite.prototype.getCurrentFrame = function () {
        return this.currentFrame;
    };
    /**
     * Returns the frame width
     * @function
     * @instance
     * @returns {Number} width - Width of the image frame.
     * @name getFrameWidth
     */
    Sprite.prototype.getFrameWidth = function () {
        return this.frameWidth;
    };
    Sprite.prototype.update = function (data) {
        var reachedEnd;
        if (!this.currentAnimation) {
            return;
        }

        // no need for update
        if (this.currentAnimationLength <= 1 || this.currentAnimation.speed === 0) {
            return;
        }

        var frameSpeed = this.currentAnimation.speed || 1;
        if (this.currentAnimation.frameSpeeds && this.currentAnimation.frameSpeeds.length - 1 >= this.currentFrame) {
            frameSpeed *= this.currentAnimation.frameSpeeds[Math.floor(this.currentFrame)];
        }

        reachedEnd = false;
        this.currentFrame += (frameSpeed) * data.speed;
        if (this.currentAnimation.loop) {
            while (this.currentFrame >= this.currentAnimation.frames.length) {
                this.currentFrame -= this.currentAnimation.frames.length - this.currentAnimation.backTo;
                reachedEnd = true;
            }
        } else {
            if (this.currentFrame >= this.currentAnimation.frames.length) {
                reachedEnd = true;
            }
        }
        if (reachedEnd && this.onCompleteCallback) {
            this.onCompleteCallback();
            //don't repeat callback on non-looping animations
            if (!this.currentAnimation.loop) {
                this.onCompleteCallback = null;
            }
        }
    };

    Sprite.prototype.updateFrame = function () {
        this.frameIndex = Math.min(Math.floor(this.currentFrame), this.currentAnimation.frames.length - 1);
        this.sourceFrame = this.currentAnimation.frames[this.frameIndex];
        this.sourceX = (this.sourceFrame % this.frameCountX) * (this.frameWidth + this.padding);
        this.sourceY = Math.floor(this.sourceFrame / this.frameCountX) * (this.frameHeight + this.padding);
    };

    Sprite.prototype.draw = function (data) {
        var entity = data.entity,
            eOrigin = entity.origin;

        if (!this.currentAnimation || !this.visible) {
            return;
        }

        this.updateFrame();

        data.renderer.drawImage(
            this.spriteImage,
            this.sourceX,
            this.sourceY,
            this.frameWidth,
            this.frameHeight,
            (-eOrigin.x - this.origin.x) | 0,
            (-eOrigin.y - this.origin.y) | 0,
            this.frameWidth,
            this.frameHeight
        );
    };
    Sprite.prototype.toString = function () {
        return '[object Sprite]';
    };

    /**
     * Ignore warnings about invalid animation frames
     * @instance
     * @static
     * @name suppressWarnings
     */
    Sprite.suppressWarnings = false;

    return Sprite;
});