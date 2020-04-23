/* Flock Poly
Simon Schödler
Source by p5.js examples & daniel shiffman
19.12.2018

TODO :
[ ] Max Boid restrictor
[ ] Boid lifetime
*/

var flock;
var flock_amount;
const pgHeightDiv = 1; // Not needed, because we want the full height of the div we place it in

const flockpoly_sketch = function(p)
{
    p.setup = function()
    {
      p.createCanvas(document.getElementById("anim_flockpoly").offsetWidth, document.getElementById("anim_flockpoly").offsetHeight / pgHeightDiv);
      flock = new Flock();

      if (isMobile.any() === null)
      {
        flock_amount = 150
      }
      else
      {
        flock_amount = 50
      };
      console.log(isMobile.any());

      // Add an initial set of boids into the system
      for (var i = 0; i < flock_amount; i++)
      {
        var b = new Boid(document.getElementById("anim_flockpoly").offsetWidth/i,document.getElementById("anim_flockpoly").offsetHeight / (2 * pgHeightDiv) );
        flock.addBoid(b);
      }
    };

    // Update canvas size in case the user resizes his browser window
    window.addEventListener('resize', function(event)
    {
      p.resizeCanvas(document.getElementById("anim_flockpoly").offsetWidth, document.getElementById("anim_flockpoly").offsetHeight / pgHeightDiv);
    });

    var isMobile =
    {
      Android: function()
      {
        return navigator.userAgent.match(/Android/i);
      },
      BlackBerry: function()
      {
        return navigator.userAgent.match(/BlackBerry/i);
      },
      iOS: function()
      {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      },
      Opera: function()
      {
        return navigator.userAgent.match(/Opera Mini/i);
      },
      Windows: function()
      {
        return navigator.userAgent.match(/IEMobile/i);
      },
      any: function()
      {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
      }
    };

    p.draw = function()
    {
      p.background(53,53,53);
      flock.run();
    };

    // Add a new boid into the System
    p.mouseDragged = function()
    {
      //flock.addBoid(new Boid(p.mouseX,p.mouseY));
    };
};

var flockpoly_canvas = new p5(flockpoly_sketch, 'anim_flockpoly');

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids

function Flock()
{
  // An array for all the boids
  this.boids = []; // Initialize the array
}

Flock.prototype.run = function()
{
  for (var i = 0; i < this.boids.length; i++)
  {
    this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
  }
}

Flock.prototype.addBoid = function(b)
{
  this.boids.push(b);
}


// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x,y)
{
  this.acceleration = flockpoly_canvas.createVector(0,0);
  this.velocity = flockpoly_canvas.createVector(flockpoly_canvas.random(-1,1),flockpoly_canvas.random(-1,1));
  this.position = flockpoly_canvas.createVector(x,y);
  this.r = 3.0;
  this.maxspeed = 1;    // Maximum speed
  this.maxforce = 0.05; // Maximum steering force
}

Boid.prototype.run = function(boids)
{
  this.flock(boids);
  this.update();
  this.borders();
  this.render();
}

Boid.prototype.applyForce = function(force)
{
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids)
{
  var sep = this.separate(boids);   // Separation
  var ali = this.align(boids);      // Alignment
  var coh = this.cohesion(boids);   // Cohesion
  // Arbitrarily weight these forces
  sep.mult(1.5);
  ali.mult(1.0);
  coh.mult(1.0);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
}

// Method to update location
Boid.prototype.update = function()
{
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target)
{
  var desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  var steer = p5.Vector.sub(desired,this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

Boid.prototype.render = function()
{
  // Draw a triangle rotated in the direction of velocity
  var theta = this.velocity.heading() + flockpoly_canvas.radians(90);
  flockpoly_canvas.fill(233, 30, 99, 100);
  flockpoly_canvas.stroke(233, 30, 99);
  flockpoly_canvas.push();
  flockpoly_canvas.translate(this.position.x,this.position.y);
  flockpoly_canvas.rotate(theta);
  flockpoly_canvas.beginShape();
  flockpoly_canvas.vertex(0, -this.r*2);
  flockpoly_canvas.vertex(-this.r, this.r*2);
  flockpoly_canvas.vertex(this.r, this.r*2);
  flockpoly_canvas.endShape(flockpoly_canvas.CLOSE);
  flockpoly_canvas.pop();
}

// Wraparound
Boid.prototype.borders = function()
{
  if (this.position.x < -this.r)  this.position.x = document.getElementById("anim_flockpoly").offsetWidth +this.r;
  if (this.position.y < -this.r)  this.position.y = (document.getElementById("anim_flockpoly").offsetHeight / pgHeightDiv)+this.r;
  if (this.position.x > document.getElementById("anim_flockpoly").offsetWidth +this.r) this.position.x = -this.r;
  if (this.position.y > (document.getElementById("anim_flockpoly").offsetHeight / pgHeightDiv)+this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids)
{
  var desiredseparation = 25.0;
  var steer = flockpoly_canvas.createVector(0,0);
  var count = 0;
  // For every boid in the system, check if it's too close
  for (var i = 0; i < boids.length; i++)
  {
    var d = p5.Vector.dist(this.position,boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation))
    {
      // Calculate vector pointing away from neighbor
      var diff = p5.Vector.sub(this.position,boids[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0)
  {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0)
  {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids)
{
  var neighbordist = 50;
  var sum = flockpoly_canvas.createVector(0,0);
  var count = 0;
  for (var i = 0; i < boids.length; i++)
  {
    var d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist))
    {
      sum.add(boids[i].velocity);
      count++;
    }
  }

  if (count > 0)
  {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    var steer = p5.Vector.sub(sum,this.velocity);
    steer.limit(this.maxforce);
    return steer;
  }
  else
  {
    return flockpoly_canvas.createVector(0,0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids)
{
  var neighbordist = 50;
  var sum = flockpoly_canvas.createVector(0,0);   // Start with empty vector to accumulate all locations
  var count = 0;
  for (var i = 0; i < boids.length; i++)
  {
    var d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist))
    {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }

  if (count > 0)
  {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  }
  else
  {
    return flockpoly_canvas.createVector(0,0);
  }
}