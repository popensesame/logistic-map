
import * as d3 from "d3";

import { LGraph, LSeq } from './log_map'
import { config } from './config'

const POINT_SIZE = .5
const STEPS_PER_FRAME = 5

const margin = {top: 20, right: 20, bottom: 30, left: 30}

const height = 1000
const width = 2000

const xScale = d3.scaleLinear()
    .domain([config.r0, config.r1])
    .range([0, width])

const yScale = d3.scaleLinear()
    .domain([1, 0])
    .range([margin.top, height - margin.bottom])

// Start

const canvas = document.getElementById('canvas')

/*
var xAxis = d3.select('g')
  .attr('transform', `translate(0,${height - margin.bottom})`)
  .call(d3.axisBottom(xScale))

var yAxis = d3.select('g')
  .attr('transform', `translate(${margin.left}, 0)`) .call(d3.axisLeft(yScale))

svg.append(xAxis)
svg.append(yAxis)
*/

var ctx = canvas.getContext('2d')
ctx.fillStyle = 'rgb(0, 0, 0)'

//d3.select(ctx.canvas).call(d3.zoom()
//    .scaleExtent([1, 8])
//    .on("zoom", ({transform}) => zoomed(transform)));

//r0, r1, rStep, sliceSampleSize
const graph = new LGraph(config.r0, config.r1, config.rStep, config.xSize)

const seqR = 4.0
const seq = new LSeq(seqR, Math.random())

function draw() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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
  window.requestAnimationFrame(draw)
}

window.requestAnimationFrame(draw);

function zoomed(transform) {
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);
}

//zoomed(d3.zoomIdentity);
