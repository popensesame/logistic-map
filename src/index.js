
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

class LogMapCanvas {
	constructor(conf) {
		Object.assign(this, conf)
		this.canvas = document.getElementById(conf.id || 'canvas')
		this.canvas.width = conf.width
		this.canvas.height = conf.height
		this.ctx = this.canvas.getContext('2d')
		this.fillStyleWhite = 'rgb(255, 255, 255, 100)'
		this.fillStylePurple = 'rgb(94, 92, 202, 100)'
		this.fillStyleBlack = 'rgb(0, 0, 0)'
		this.graph = this.newGraph(conf.r0, conf.r1, conf.rStep, conf.xSize)
		this.initControls()
		this.renderPointLocations()
		this.currentFrame = 0
	}

	renderPointLocations() {
		console.log('Computing point locations...')
		this.frames = []
		for (let i=0; i<this.computeRate; i++) {
			this.graph.next()
			this.frames.push(this.graph.slices.map(slice => {
				return {
					x: xScale(slice.r),
					Y: slice.get().map(v => yScale(v))
				}
			}))
		}
		console.log('Done.')
	}

	newGraph(conf) {
		conf = conf || {}
		return new LGraph(
			conf.r0 || this.r0,
			conf.r1 || this.r1,
			conf.rStep || this.rStep,
			conf.xSize || this.xSize
		)
	}

	resetGraph() {
		this.animating = false
		this.graph = this.newGraph()
		this.clear(this.ctx)	
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	resetCanvas(conf={}) {
		this.canvas.width = conf.width || this.canvas.width
		this.canvas.height = conf.height || this.canvas.height
		this.clear()
		this.graph = this.newGraph()
	}

	drawPoint (x, y) {
		this.ctx.fillRect(x, y, POINT_SIZE, POINT_SIZE)
	}

	async loop () {
		this.graph.next()
		this.points = this.graph.slices.map(slice => {
			return {
				x: xScale(slice.r),
				Y: slice.get().map(data => data.map(v => yScale(v)))
			}
		})
		this.ctx.fillStyle = this.fillStyleWhite
		this.ctx.clearRect(0, 0, this.width, this.height)
		this.ctx.fill()
		for (let i=0; i<this.slices.length; i++) {
			//	const xNext = xScale(parseFloat(slice.r+this.rStep))
			this.ctx.rect(x, 0, POINT_SIZE, this.height);
			//this.ctx.clearRect(xNext, 0, POINT_SIZE*this.rStep*this.sliceRenderRate, this.height);
			this.ctx.fillStyle = this.fillStyleBlack
			this.points.forEach(slice => {
				slice.Y.map(y => this.drawPoint(slice.x, y))
				requestAnimationFrame()
			})
		}
		if (this.animating) {
			await this.loop()
		}
	}

	draw() {
		/* Render all slices at once */
		this.ctx.fillStyle = this.fillStyleWhite
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.rect(0, 0, this.width, this.height);
		this.ctx.fill()
		this.ctx.fillStyle = this.fillStyleBlack
		//this.ctx.restore();
		for (let frameSlice of this.frames[this.currentFrame]) {
			for (let y of frameSlice.Y) {
				this.ctx.fillRect(frameSlice.x, y, POINT_SIZE, POINT_SIZE)
			}
		}

		//this.graph.next()

		// Render one slice at a time
		/*
		this.ctx.fillStyle = this.fillStyleWhite
		this.graph.nextSlice()
		const slice = this.graph.slices[this.graph.sliceIndex]
		const data = slice.get()
		const x = xScale(parseFloat(slice.r))
		const xNext = xScale(parseFloat(slice.r+this.rStep))
		this.ctx.rect(x, 0, POINT_SIZE, this.height);
		this.ctx.clearRect(xNext, 0, POINT_SIZE, this.height);
		this.ctx.fillStyle = this.fillStyleBlack
		const Y = data.map(v => yScale(v))
		//await Promise.all(Y.map(y => this.drawPoint(x, y)))
		*/

		this.currentFrame++
		if (this.currentFrame === this.computeRate) {
			this.animating = false
			console.log(`Finished rendering ${this.computeRate} frames.`)
		}

		if (this.animating) {
			window.requestAnimationFrame(this.draw.bind(this))
		} else {
			console.log('Stopping...')
		}
	}

	initControls() {
		this.ctl = {
			play: document.getElementById('play'),
			start: document.getElementById('start'),
			stop: document.getElementById('stop'),
			next: document.getElementById('next'),
			clear: document.getElementById('clear'),
			save: document.getElementById('save'),

			computeRate: document.getElementById('computeRate'),
			r0: document.getElementById('r0'),
			r1: document.getElementById('r1'),
			rStep: document.getElementById('rStep'),
			xSize: document.getElementById('xSize'),
			width: document.getElementById('width'),
			height: document.getElementById('height')
		}

		const keys = [ 'r0', 'r1', 'rStep', 'xSize', 'width', 'height', 'computeRate' ]
		keys.forEach(k => {
			this.ctl[k].value = this[k]
			this.ctl[k].addEventListener('change', e => {
				this[k] = parseInt(e.target.value)
				this.resetGraph()
				this.resetCanvas()
			})
		})

		this.ctl.start.addEventListener('click', e => {
			this.graph = this.graph || this.newGraph()
			console.log('Starting...')
			window.requestAnimationFrame(this.draw.bind(this));
		})

		this.ctl.play.addEventListener('click', e => {
			this.animating = true
			this.graph = this.graph || this.newGraph()
			console.log('Starting...')
			window.requestAnimationFrame(this.draw.bind(this));
		})

		this.ctl.stop.addEventListener('click', e => {
			this.animating = false
		})

		this.ctl.next.addEventListener('click', e => {
			window.requestAnimationFrame(this.draw.bind(this));
		})

		this.ctl.clear.addEventListener('click', e => {
			this.resetGraph()
		})

		this.ctl.save.addEventListener('click', e => {
			this.animating = false
			const url = this.canvas.toDataURL('image/jpeg', 1.0)
			const link = document.getElementById('link')
			link.href = url //URL.createObjectURL(canvas.toBlob())
			link.download = 'image.jpg'
			link.classList.remove('hidden')
			link.dispatchEvent(new Event('click'))
		})
	}
}

const canvas = new LogMapCanvas(config)
