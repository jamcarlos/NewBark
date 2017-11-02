'use strict';
import {Melon, _, config} from 'externals';
import Debug from 'system/Debug';
import GridSnapMovement from 'system/physics/GridSnapMovement';

let PlayerController = Melon.Entity.extend({
  initProperties() {
    this.defaultSettings = {
      anchorPoint: new Melon.Vector2d(0, 0)
    };

    // Define an animation per desired button e.g. animationType_buttonName
    this.animations = {
      debug: {frames: [0]},
      walk_up: {frames: []},
      walk_right: {frames: []},
      walk_down: {frames: []},
      walk_left: {frames: []},
      stand_up: {frames: []},
      stand_right: {frames: []},
      stand_down: {frames: []},
      stand_left: {frames: []}
    };

    this.initialAnimation = 'stand_down';
  },

  init(x, y, settings = {}) {
    this.initProperties();

    settings = _.extend(this.defaultSettings, settings);

    this._super(Melon.Entity, 'init', [x, y, settings]);

    this.currentDt = 0;

    this.movement = new GridSnapMovement(this.body, {
      spriteWidth: config.video.tile_size,
      distancePerMove: config.video.tile_size,
      speed: config.player.speed
    });

    // Register sprite animations
    _.forOwn(this.animations, (animation, animationName) => {
      if (animation.frames.length === 0) {
        return;
      }

      this.renderable.addAnimation(animationName, this.buildAnimation(
        this.movement.fps + (this.movement.fps / this.movement.velocity),
        animation.frames
      ));
    });

    // set a standing animation as default
    this.renderable.setCurrentAnimation(this.initialAnimation);

    // Set the sprite anchor point
    this.anchorPoint.set(settings.anchorPoint.x, settings.anchorPoint.y);

    // Assign callbacks to the movement events
    this.movement.onStop = this.onPlayerStop.bind(this);
    this.movement.onIdle = this.onPlayerIdle.bind(this);
    this.movement.onMove = this.onPlayerMove.bind(this);

    // set the display to follow our position on both axis
    Melon.game.viewport.follow(this.pos, Melon.game.viewport.AXIS.BOTH);

    // ensure the player is updated even when outside of the viewport
    this.alwaysUpdate = true;
  },

  onPlayerIdle() {
    Debug.debugUpdate(this.movement, this.currentDt);

    this.body.update(this.currentDt);

    this._super(Melon.Entity, 'update', [this.currentDt]);
  },

  onPlayerMove() {
    Debug.debugUpdate(this.movement, this.currentDt);

    // apply physics to the body (this moves the entity)
    this.body.update(this.currentDt);

    this._super(Melon.Entity, 'update', [this.currentDt]);

    // handle collisions against other shapes
    Melon.collision.check(this);
  },

  onPlayerStop(lastDirection) {
    this.renderable.setCurrentAnimation(`stand_${lastDirection.toLowerCase()}`);

    if (Debug.enabled) {
      // Show debug animation after 1s
      if (this.debugTimeout) {
        clearTimeout(this.debugTimeout);
      }
      this.debugTimeout = setTimeout(() => {
        this.renderable.setCurrentAnimation('debug');
      }, 1000);
    }
  },

  /**
   *
   * Collision handler
   * (called when colliding with other objects)
   * @param {me.collision.ResponseObject.prototype} collisionResponse
   * @param {me.Entity|me.Renderable} collisionObject
   * @returns {boolean} Return false to avoid collision, return true or nothing to collide.
   */
  onPlayerCollide(collisionResponse, collisionObject) {
    // To be implemented by children
  },

  /**
   * update the entity
   */
  update(dt) {
    this.currentDt = dt;

    let updated = this.movement.update();

    if (!updated) {
      return this._super(Melon.Entity, 'update', [dt]);
    }

    // apply physics to the body (this moves the entity)
    this.body.update(dt);

    // return true if we moved or if the renderable was updated
    return (this._super(Melon.Entity, 'update', [dt]) || this.movement.hasVelocity());
  },

  /**
   *
   * Collision handler
   * (called when colliding with other objects)
   * @param {me.collision.ResponseObject.prototype} collisionResponse
   * @param {me.Entity|me.Renderable} collisionObject
   * @returns {boolean} Return false to avoid collision, return true or nothing to collide.
   */
  onCollision(collisionResponse, collisionObject) {
    let cancelled = (this.body.onStaticCollision(collisionResponse, collisionObject) === false);

    if (!cancelled) {
      cancelled = (this.onPlayerCollide(collisionResponse, collisionObject) === false);
    }

    if (cancelled) {
      return false;
    }

    Debug.debugCollision(collisionResponse);
  },

  buildAnimation(delay, frames) {
    if (frames.length === 1) {
      // no delay needed
      return frames;
    }

    let animation = [];
    frames.forEach(function (frame) {
      if (frame.name) { // e.g. {name:7, delay: 100}
        animation.push(frame);
      } else if (_.isArray(frame) && (frame.length >= 2)) { // e.g. [7, 100]
        animation.push({
          name: frame[0],
          delay: frame[1]
        });
      } else { // e.g. 7
        animation.push({
          name: frame,
          delay: delay
        });
      }
    });
    return animation;
  }

});

export default PlayerController;
