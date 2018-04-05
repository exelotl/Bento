/**
 * Audio manager to play sounds and music. The audio uses WebAudio API when possible, though it's mostly based on HTML5 Audio for
 * CocoonJS compatibility. To make a distinction between sound effects and music, you must prefix the audio
 * asset names with sfx_ and bgm_ respectively.
 * <br>Exports: Constructor, can be accessed through Bento.audio namespace.
 * @module bento/managers/audio
 * @moduleName AudioManager
 * @returns AudioManager
 */

import Utils from 'bento/utils';

export default function (bento) {
    var volume = 1,
        mutedSound = false,
        mutedMusic = false,
        preventSounds = false,
        isPlayingMusic = false,
        howler,
        musicLoop = false,
        lastMusicPlayed = '',
        currentMusicId = 0,
        saveMuteSound,
        saveMuteMusic,
        assetManager = bento.assets,
        canvasElement = bento.getCanvas(),
        onVisibilityChanged = function (hidden) {
            if (hidden) {
                // save audio preferences and mute
                saveMuteSound = mutedSound;
                saveMuteMusic = mutedMusic;
                obj.muteMusic(true);
                obj.muteSound(true);
            } else {
                // reload audio preferences and replay music if necessary
                mutedSound = saveMuteSound;
                mutedMusic = saveMuteMusic;
                if (lastMusicPlayed) {
                    obj.playMusic(lastMusicPlayed, musicLoop);
                }
            }
        },
        obj = {
            /**
             * Sets the volume (0 = minimum, 1 = maximum)
             * @name setVolume
             * @instance
             * @function
             * @param {Number} value - the volume
             * @param {String} name - name of the sound to change volume
             */
            setVolume: function (value, name) {
                var audio = assetManager.getAudio(name);
                if (!audio) {
                    return;
                }
                audio.volume = value;
            },
            /**
             * Gets the volume (0 = minimum, 1 = maximum)
             * @name getVolume
             * @instance
             * @function
             * @param {String} name - name of the sound
             */
            getVolume: function (name) {
                var audio = assetManager.getAudio(name);
                if (!audio) {
                    Utils.log('ERROR: Could not find audio file');
                    return 0;
                }
                return audio.volume;
            },
            /**
             * Plays a sound effect
             * @name playSound
             * @instance
             * @function
             * @param {String} name - name of the audio asset
             * @param {Boolean} [loop] - should the audio loop (defaults to false)
             * @param {Function} [onEnd] - callback when the audio ends
             * @param {Boolean} [stopSound] - stops the sound if true
             */
            playSound: function (name, loop, onEnd, stopSound) {
                var audio = assetManager.getAudio(name);
                var slashIndex = name.lastIndexOf('/');
                if (!audio) {
                    Utils.log('ERROR: Could not find audio file');
                    return;
                }

                if (name.substr(slashIndex + 1, 4) !== 'sfx_') {
                    Utils.log("Warning: file names of sound effects should start with 'sfx_'");
                }

                if (!mutedSound && !preventSounds) {
                    if (stopSound)
                        obj.stopSound(name);
                    if (Utils.isDefined(loop)) {
                        audio.loop = loop;
                    }
                    if (Utils.isDefined(onEnd)) {
                        audio.onended = onEnd;
                    }
                    audio.play();
                }
            },
            /**
             * Stops a specific sound effect
             * @name stopSound
             * @instance
             * @function
             */
            stopSound: function (name) {
                var i, l, node;
                var audio = assetManager.getAudio(name);
                if (!audio) {
                    Utils.log('ERROR: Could not find audio file');
                    return;
                }
                audio.stop();
            },
            /**
             * Plays a music
             * @name playMusic
             * @instance
             * @function
             * @param {String} name - name of the audio asset
             * @param {Boolean} [loop] - should the audio loop (defaults to true)
             * @param {Function} [onEnd] - callback when the audio ends
             * @param {Boolean} [stopAllMusic] - stops all music if true
             */
            playMusic: function (name, loop, onEnd, stopAllMusic) {
                var audio;
                var slashIndex = name.lastIndexOf('/');

                if (stopAllMusic) {
                    obj.stopAllMusic();
                }

                if (name.substr(slashIndex + 1, 4) !== 'bgm_') {
                    Utils.log("Warning: file names of music tracks should start with 'bgm_'");
                }

                lastMusicPlayed = name;
                if (Utils.isDefined(loop)) {
                    musicLoop = loop;
                } else {
                    musicLoop = true;
                }
                // set end event
                if (!mutedMusic && lastMusicPlayed !== '') {
                    audio = assetManager.getAudio(name);
                    if (!audio) {
                        Utils.log('ERROR: Could not find audio file');
                        return;
                    }
                    if (onEnd) {
                        audio.onended = onEnd;
                    }
                    audio.loop = musicLoop;
                    audio.play();
                    isPlayingMusic = true;
                }
            },
            /**
             * Stops a specific music
             * @name stopMusic
             * @param {String} name - name of the audio asset
             * @instance
             * @function
             */
            stopMusic: function (name) {
                var i, l, node;
                assetManager.getAudio(name).stop();
                isPlayingMusic = false;
            },
            /**
             * Mute or unmute all sound
             * @name muteSound
             * @instance
             * @function
             * @param {Boolean} mute - whether to mute or not
             */
            muteSound: function (mute) {
                mutedSound = mute;
                if (mutedSound) {
                    // we stop all sounds because setting volume is not supported on all devices
                    this.stopAllSound();
                }
            },
            /**
             * Mute or unmute all music
             * @instance
             * @name muteMusic
             * @function
             * @param {Boolean} mute - whether to mute or not
             * @param {Boolean} continueMusic - whether the music continues
             */
            muteMusic: function (mute, continueMusic) {
                var last = lastMusicPlayed;
                mutedMusic = mute;

                if (!Utils.isDefined(continueMusic)) {
                    continueMusic = false;
                }
                if (mutedMusic) {
                    obj.stopAllMusic();
                    lastMusicPlayed = last;
                } else if (continueMusic && lastMusicPlayed !== '') {
                    obj.playMusic(lastMusicPlayed, musicLoop);
                }
            },
            /**
             * Stop all sound effects currently playing
             * @instance
             * @name stopAllSound
             * @function
             */
            stopAllSound: function () {
                var sound,
                    sounds = assetManager.getAssets().audio;
                for (sound in sounds) {
                    if (sounds.hasOwnProperty(sound) && sound.indexOf('sfx_') >= 0) {
                        sounds[sound].stop();
                    }
                }
            },
            /**
             * Stop all music currently playing
             * @instance
             * @name stopAllMusic
             * @function
             */
            stopAllMusic: function () {
                var sound,
                    sounds = assetManager.getAssets().audio;
                for (sound in sounds) {
                    if (sounds.hasOwnProperty(sound) && sound.indexOf('bgm_') >= 0) {
                        sounds[sound].stop(sound === lastMusicPlayed ? currentMusicId : void(0));
                    }
                }
                lastMusicPlayed = '';
                isPlayingMusic = false;
            },
            /**
             * Prevents any sound from playing without interrupting current sounds
             * @instance
             * @name preventSounds
             * @function
             */
            preventSounds: function (bool) {
                preventSounds = bool;
            },
            /**
             * Returns true if any music is playing
             * @instance
             * @name isPlayingMusic
             * @param {String} [name] - Check whether this particular music is playing
             * @function
             */
            isPlayingMusic: function (name) {
                if (name) {
                    return lastMusicPlayed === name;
                }
                return isPlayingMusic;
            }
        };
    // https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API
    if ('hidden' in document) {
        document.addEventListener("visibilitychange", function () {
            onVisibilityChanged(document.hidden);
        }, false);
    } else if ('mozHidden' in document) {
        document.addEventListener("mozvisibilitychange", function () {
            onVisibilityChanged(document.mozHidden);
        }, false);
    } else if ('webkitHidden' in document) {
        document.addEventListener("webkitvisibilitychange", function () {
            onVisibilityChanged(document.webkitHidden);
        }, false);
    } else if ('msHidden' in document) {
        document.addEventListener("msvisibilitychange", function () {
            onVisibilityChanged(document.msHidden);
        }, false);
    } else if ('onpagehide' in window) {
        window.addEventListener('pagehide', function () {
            onVisibilityChanged(true);
        }, false);
        window.addEventListener('pageshow', function () {
            onVisibilityChanged(false);
        }, false);
    } else if ('onblur' in document) {
        window.addEventListener('blur', function () {
            onVisibilityChanged(true);
        }, false);
        window.addEventListener('focus', function () {
            onVisibilityChanged(false);
        }, false);
    } else if ('onfocusout' in document) {
        window.addEventListener('focusout', function () {
            onVisibilityChanged(true);
        }, false);
        window.addEventListener('focusin', function () {
            onVisibilityChanged(false);
        }, false);
    }
    return obj;
};
