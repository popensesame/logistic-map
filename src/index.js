
import * as d3 from "d3";

import { LGraph } from './log_map'
import { config } from './config'

const POINT_SIZE = .5
const STEPS_PER_FRAME = 5

const margin = {top: 20, right: 20, bottom: 30, left: 30}

const height = config.height
const width = config.width

const xScale = d3.scaleLinear()
    .domain([config.r0, config.r1])
    .range([0, width])

const yScale = d3.scaleLinear()
    .domain([1, 0])
    .range([margin.top, height - margin.bottom])

// Start

const canvas = document.getElementById('canvas')
canvas.width = config.width
canvas.height = config.height

var ctx = canvas.getContext('2d')
ctx.fillStyle = 'rgb(0, 0, 0)'

const graph = new LGraph(config.r0, config.r1, config.rStep, config.xSize)

let requestId

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fill();
  ctx.restore();
  for (let slice of graph.slices) {
    const data = slice.get()
    for (let v of data) {
      const x = xScale(parseFloat(slice.r))
      const y = yScale(parseFloat(v))
      ctx.fillRect(x, y, POINT_SIZE, POINT_SIZE)
    }
  }
  graph.next()
	if (animating) {
		window.requestAnimationFrame(draw)
	} else {
		console.log('Stopping...')
	}
  
}

let animating = true

document.getElementById('start')
	.addEventListener('click', e => {
		animating = true
		console.log('Starting...')
		window.requestAnimationFrame(draw);
	})

document.getElementById('stop')
	.addEventListener('click', e => {
		animating = false
	})

document.getElementById('next')
	.addEventListener('click', e => {
		window.requestAnimationFrame(draw);
	})

window.requestAnimationFrame(draw);
