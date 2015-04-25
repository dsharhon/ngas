"use strict";

// Canvas stuff ************************************************************************************

// Get canvas object.
var canvas	= document.getElementById("canvas");

// Get canvas object's 2D rendering context.
var context = canvas.getContext('2d');

// Gas simulator ***********************************************************************************

// Particle data
var i, index, x = [], y = [], xp = [], yp = [], phi, vx = [], vy = [];

// Initial conditions
for (i = 0; i < 25; i++)
{
	// Initially put them in a circle.
	x[i] = 40 + 200 + 150*Math.cos(i*2*Math.PI/25);
	y[i] = 40 + 200 + 150*Math.sin(i*2*Math.PI/25);
	
	// Give the particle a random initial velocity.
	phi = Math.random()*2*Math.PI;
	vx[i] = Math.cos(phi);
	vy[i] = Math.sin(phi);
}

// Specify collision count and iteration step data.
var ncoll = 0, iter = 1;

// Display box
context.strokeRect(40,40,360,360)

function step()
{	
	// Clear box
	context.clearRect(40,40,360,360);
	
	// Draw a histogram of particle velocity-square values *****************************************
	
	// Calculate and show average particle energy.
	var sumEnergy = 0;
	for(i = 0; i < 25; i++)
	{
		var velocitySquared = Math.pow(vx[i], 2) + Math.pow(vy[i], 2);
		sumEnergy += velocitySquared;
	}
	var averageEnergy = sumEnergy/25;
	document.getElementById("averageEnergy").innerHTML = averageEnergy;
	
	// Bin energy levels from 0.2 - 2.0
	var energyLevels = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	for(i = 0; i < 25; i++)
	{
		var energyLevel = Math.pow(vx[i], 2) + Math.pow(vy[i], 2);
		// Convert energy level of, say 0.9 to 9 (or something, change energyLevel*x to x = ?)
		var bin = Math.floor(energyLevel*4);
		if(0 <= bin && bin < 30)
		{
			energyLevels[bin] += 1;
		}
	}
	
	// Show histogram
	context.clearRect(420,0,200,300);
	for(i = 0; i < energyLevels.length; i++)
	{
		var count = energyLevels[i];
		context.fillRect(420 + 5*i, 200 - 5*count, 5, 5*count);
	}
	
	// Draw a circle at the position of each particle. *********************************************
	var kx, ky;
	for (var i = 0; i < 25; i++)
	{
		kx = x[i];
		ky = y[i];
		context.beginPath();
		context.arc(kx, ky, 10, 0, Math.PI*2, true);
		context.stroke();
	}
	
	// Calculate particles' next positions assuming free flight. ***********************************
	for (var i = 0; i < 25; i++)
	{
		xp[i] = x[i]+vx[i];
		yp[i] = y[i]+vy[i];
	}
	
	// Check for wall collisions. ******************************************************************
	var j, rx = [], ry = [];
	for (var i = 0; i < 25; i++)
	{
		rx[i] = 0;
		ry[i] = 0;
	}
	for (i = 0; i < 25; i++)
	{
		if (xp[i] < 50) rx[i] = -1;
		if (yp[i] < 50) ry[i] = -1;
		if (xp[i] > 390) rx[i] = 1;
		if (yp[i] > 390) ry[i] = 1;
	}
	
	// Check for two-particle collisions. **********************************************************
	var dsq;
	
	// Initialize particle collision array.
	var bang = [];
	for (i = 0; i < 24; i++)
	{
		bang[i] = [];
		for (j = i + 1; j < 25; j++)
		{
			bang[i][j] = 0;
		}
	}
	
	// Create a diagonal matrix of particle collisions.
	// e.g. particle 5's list only includes flags for collisions with particles 6 and up
	for (i = 0; i < 24; i++)
	{
		for (j = i + 1; j < 25; j++)
		{
			// Calculate distance squared between the two particles.
			dsq = Math.pow((xp[i] - xp[j]), 2) + Math.pow((yp[i] - yp[j]), 2);
			
			// Flag the intersection
			if (dsq < 400.)
			{
				bang[i][j] = 1;
				ncoll += 1;
			}
		}
	}
	
	// Check for three-particle collisions. ********************************************************
	
	// Flag two-particle collisions "working down the list".
	var n2bc = [];
	for (i = 0; i < 25; i++)
	{
		n2bc[i] = 0;
	}
	for (i = 0; i < 24; i++)
	{
		for (j = i + 1; j < 25; j++)
		{
			n2bc[i] += bang[i][j];
		}
	}
	
	// Flag two-particle collsions "working up the list".
	for (i = 1; i < 25; i++)
	{
		for (j = 0; j < i; j++)
		{
			n2bc[i] += bang[j][i];
		}
	}
	
	// Calculate effects of particle collisions. ***************************************************
	var x1i,x2i,y1i,y2i, x1f,x2f,y1f,y2f, di,df, tc,x1c,y1c,x2c,y2c, ex,ey, proj;
	for (i = 0; i < 24; i++)
	{
		for (j = i + 1; j < 25; j++)
		{
			if (bang[i][j] == 1)
			{
				// Take current positions (before collision).
				x1i = x[i];
				x2i = x[j];
				y1i = y[i];
				y2i = y[j];
				
				// Take proposed positions (for free flight).
				x1f = xp[i];
				x2f = xp[j];
				y1f = yp[i];
				y2f = yp[j];
				
				// Calculate current separation (before collision).
				di = Math.sqrt(Math.pow((x2i - x1i), 2) + Math.pow((y2i - y1i), 2));
				
				// Calculate proposed separation (already found to be too close.)
				df = Math.sqrt(Math.pow((x2f - x1f), 2) + Math.pow((y2f - y1f), 2));
				
				// Calculate time of collision?
				tc = (di - 20.)/(di - df);
				
				// Calculate position of collision.
				x1c = x1i + tc*vx[i];
				x2c = x2i + tc*vx[j];
				y1c = y1i + tc*vy[i];
				y2c = y2i + tc*vy[j];
				
				// Calculate energy????
				ex = (x2c - x1c)/20.;
				ey = (y2c - y1c)/20.;
				proj = (vx[j] - vx[i])*ex + (vy[j] - vy[i])*ey;
				
				// Propose new ???current??? particle velocities and positions?
				vx[i] = vx[i] + proj*ex;
				vy[i] = vy[i] + proj*ey;
				vx[j] = vx[j] - proj*ex;
				vy[j] = vy[j] - proj*ey;
				x[i] = x1c + (1. - tc)*vx[i];
				y[i] = y1c + (1. - tc)*vy[i];
				x[j] = x2c + (1. - tc)*vx[j];
				y[j] = y2c + (1. - tc)*vy[j];
			}
		}
	}
	
	// Calculate effects of wall collisions. *******************************************************
	
	// For every particle, going down the list:
	for (i = 0; i < 25; i++)
	{
		// If the particle is colliding with the left wall:
		if (rx[i] == -1)
		{
			// Reverse its horizontal velocity.
			vx[i] = -vx[i];
			
			// Propose a new current position to the right instead, plus 100 units of distance.
			x[i] = 100. - xp[i];
			
			// Update vertical velocity as if no vertical collision.
			y[i] = yp[i];
		}
		
		// Similar to above. (Doesn't work if colliding with two walls.)
		if (ry[i] == -1)
		{
			vy[i] = -vy[i];
			y[i] = 100.-yp[i];
			x[i] = xp[i];
		}
		if (rx[i] == 1)
		{
			vx[i] = -vx[i];
			x[i] = 780.-xp[i];
			y[i] = yp[i];
		}
		if (ry[i] == 1)
		{
			vy[i] = -vy[i];
			y[i] = 780.-yp[i];
			x[i] = xp[i];
		}
	}
	
	// Update positions for particles that have had no collisions. *********************************
	for (i = 0; i < 25; i++)
	{
		if ((rx[i] == 0) && (ry[i] == 0) && (n2bc[i] == 0))
		{
			x[i] = xp[i];
			y[i] = yp[i];
		}
	}
}

setInterval(step, 25);