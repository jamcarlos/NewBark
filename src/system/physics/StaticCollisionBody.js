'use strict';
import {Melon} from 'externals';

/**
 * Represents a body that does not have a velocity when collides with another,
 * so it stops moving on collision but it does not bounce.
 *
 * @type {(me.Body|me.Rect)}
 */
let StaticCollisionBody = Melon.Body.extend({
  respondToCollision(response) {
    let overlap = response.overlapV;

    // Move out of the other object shape
    this.entity.pos.sub(overlap);
    // TODO: move to a full tile, calculating that pos.y/32 and pos.x/32 are integers

    // adjust velocity
    if (overlap.x !== 0) {
      this.vel.x = 0;
    }
    if (overlap.y !== 0) {
      this.vel.y = 0;
    }
    // Cancel falling and jumping
    this.falling = false;
    this.jumping = false;
  },

  /**
   * Collision handler. This needs to be called manually by any entity onCollision hook.
   *
   * @param {me.collision.ResponseObject.prototype} collisionResponse
   * @param {me.Entity|me.Renderable} collisionObject
   * @returns {boolean} Return false to avoid collision, return true or nothing to collide.
   */
  onStaticCollision(collisionResponse, collisionObject) {
    if (collisionResponse.overlap === 0) {
      return false;
    }

    collisionResponse.a.body.gravity = 0;
    collisionResponse.b.body.accel.set(0, 0);
    collisionResponse.a.body.friction.set(0, 0);
    collisionResponse.a.body.jumping = false;
    collisionResponse.a.body.falling = false;

    collisionResponse.b.body.gravity = 0;
    collisionResponse.b.body.accel.set(0, 0);
    collisionResponse.b.body.friction.set(0, 0);
    collisionResponse.b.body.jumping = false;
    collisionResponse.b.body.falling = false;

    collisionObject.body.gravity = 0;
    collisionObject.body.accel.set(0, 0);
    collisionObject.body.friction.set(0, 0);
    collisionObject.body.jumping = false;
    collisionObject.body.falling = false;

    // TODO: make the objects stop inside the scope of this method (vel = 0)
    // @see StaticCollisionBody
  }
});

export default StaticCollisionBody;
