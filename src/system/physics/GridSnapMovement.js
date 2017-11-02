'use strict';
import {Melon} from 'externals';
import Calc from 'system/physics/Calc';
import Controls from "system/Controls";

/**
 * Snap to grid-tiles movement style
 */
class GridSnapMovement {

  /**
   * @param {me.Body.prototype} body
   * @param {Object} config Instance configuration
   */
  constructor(body, config) {
    this.body = body;
    this.spriteWidth = config.spriteWidth;
    this.distancePerMove = (config.distancePerMove === undefined) ? this.spriteWidth : config.distancePerMove;
    this.speed = (config.speed === undefined) ? 1 : config.speed;

    if (config.velocity === undefined) {
      let vel = Calc.velocity(this.spriteWidth, this.fps);
      vel = ((vel <= 0.5) ? 1 : Math.round(vel)) * this.speed; // assure minimum of 1 and multiply by speed.
      this.velocity = Math.ceil(vel / 2) * 2; // assure velocity is always multiple of 2
    } else {
      this.velocity = config.velocity;
    }

    this.buffer = 0;
    this.lastDirection = null;
    this.lastVelocity = null;

    // the body should be initially static
    this.body.vel.set(0, 0);
    this.body.maxVel.set(this.velocity, this.velocity);
    this.body.accel.set(0, 0);
    this.body.friction.set(0, 0);

    // the body should not fall
    this.body.gravity = 0;
    this.body.jumping = false;
    this.body.falling = false;

    this.onIdle = function () {
    };
    this.onMove = function () {
    };
    this.onStop = function () {
    };
  }

  /**
   * @return {Number}
   */
  get fps() {
    return Melon.sys.fps;
  }

  isMoving() {
    return (this.buffer > 0);
  }

  hasVelocity() {
    return (this.body.vel.x !== 0 || this.body.vel.y !== 0);
  }

  /**
   * @returns {Integer}
   */
  get bufferedVelocity() {
    if (this.buffer === 0) {
      return 0;
    }

    if (this.buffer >= this.velocity) {
      // Move with constant velocity
      this.buffer -= this.velocity;
      return this.velocity;
    } else if (this.buffer !== 0 && this.buffer < this.velocity) {
      // Move with remaining pixels
      let vel = this.buffer;
      this.buffer = 0;
      return vel;
    }

    // Do not move
    return 0;
  }

  get direction() {
    // todo: calc quick/long press
    if (this.isMoving() && this.lastDirection) {
      return this.lastDirection;
    }

    // todo: add support for changing direction before completing move (respecting snapping)
    let pressedButton = Controls.getPressed();
    if (pressedButton && (Controls.getPressedAxis(pressedButton) !== false)) {
      return pressedButton;
    }

    return false;
  }

  update() {
    this.lastVelocity = 0;

    if (!this.isMoving()) {
      this.body.vel.x = 0;
      this.body.vel.y = 0;

      if (this.lastDirection) {
        // Stopped moving
        this.onStop(this.lastDirection);
      }

      this.lastDirection = null;
    }

    let direction = this.direction;

    if (!direction && !this.isMoving()) {
      // No action and no pending animation
      this.onIdle();
      return false;
    }

    // Assign last button
    if (direction && !this.lastDirection) {
      this.lastDirection = direction;
    }

    // Buffer new movement
    if (direction && !this.isMoving()) {
      this.buffer = this.distancePerMove;
    }

    // ---------- MOVE():
    let velocity = this.bufferedVelocity;

    // No direction or velocity to apply
    if (!direction || isNaN(velocity) || (velocity === 0)) {
      return false;
    }

    let axis = Controls.getPressedAxis(direction);

    // Button is not assigned to an axis
    if (!axis) {
      return false;
    }

    let oppositeAxis = Controls.getPressedOppositeAxis(axis);

    // Disable diagonal movement
    this.body.vel[oppositeAxis] = 0;

    // Apply velocity to the body
    if (direction === Controls.LEFT || direction === Controls.UP) {
      this.body.vel[axis] -= velocity;
    } else {
      this.body.vel[axis] += velocity;
    }

    this.lastVelocity = velocity;
    this.onMove(velocity, direction, axis);

    return this.hasVelocity();
  }
}

export default GridSnapMovement;
