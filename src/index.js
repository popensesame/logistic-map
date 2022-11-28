
import { scaleLinear } from "d3"

import { LGraph } from './log_map'
import { config } from './config'

const POINT_SIZE = .5

const margin = {top: 20, right: 20, bottom: 30, left: 30}

const height = config.height
const width = config.width

// Start

class LogMapCanvas {
	constructor(conf) {
		Object.assign(this, conf)

		this.boxZoomMode = false
		this.boxZoomBox = {
			xtart: 0,
			ystart: 0,
			xend: 0,
			yend: 0
		}

		// Scales for drawing points
		this.xScale = scaleLinear()
				.domain([config.r0, config.r1])
				.range([0, width])
		this.yScale = scaleLinear()
				.domain([this.yend, this.ystart])
				.range([0, height])

		// Initialize canvas
		this.canvas = document.getElementById(conf.id || 'canvas')
		this.canvas.width = conf.width
		this.canvas.height = conf.height
		this.ctx = this.canvas.getContext('2d')
		this.fillStyleWhite = 'rgb(255, 255, 255, 100)'
		this.fillStyleBlack = 'rgb(0, 0, 0)'
		this.fillStylePurple = 'rgb(94, 92, 202, 100)'

		// Initialize the graph data
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
					x: this.xScale(slice.r),
					Y: slice.get().map(v => this.yScale(v))
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

	draw() {
		this.ctx.fillStyle = this.fillStyleWhite
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.rect(0, 0, this.width, this.height);
		this.ctx.fill()
		this.ctx.fillStyle = this.fillStyleBlack
		for (let frameSlice of this.frames[this.currentFrame]) {
			for (let y of frameSlice.Y) {
				this.ctx.fillRect(frameSlice.x, y, POINT_SIZE, POINT_SIZE)
			}
		}
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

	drawBoxZoomBox() {
		const box = this.boxZoomBox
		const top = Math.min(box.ystart, box.yend)
		const left = Math.min(box.xstart, box.xend)
		const width = Math.abs(box.xstart - box.xend)
		const height = Math.abs(box.ystart - box.yend)

		const rect = this.ctl.boxZoomRect
		rect.style.top = top
		rect.style.left = left
		rect.style.width = width
		rect.style.height = height
	}

	mouseMoveListener(e) {
		if (!this.drawingBoxZoom) return
		console.log('boxzoom:mousemove')
		this.boxZoomBox.xend = e.clientX
		this.boxZoomBox.yend = e.clientY
		this.drawBoxZoomBox()
	}

	mouseDownListener(e) {
		if (!this.boxZoomMode) return
		console.log('boxzoom:mousedown')
		this.drawingBoxZoom = true
		this.boxZoomBox.xstart = e.clientX
		this.boxZoomBox.ystart = e.clientY
		this.ctl.boxZoomRect.classList.remove('hidden')
		this.canvas.addEventListener('mousemove', this.mouseMoveListener.bind(this))
	}

	mouseUpListener(e) {
		if (this.drawingBoxZoom) {
			console.log('boxzoom:mouseup')
			this.drawingBoxZoom = false
			this.ctl.boxZoomRect.classList.add('hidden')
			this.zoom()
		}
	}

	zoom() {
		const box = this.boxZoomBox
		const canRect = this.canvas.getBoundingClientRect()
		// Box rectangle in canvas coordinates
		const xstart = box.xstart - canRect.left
		const ystart = box.ystart - canRect.top
		const width = box.xend - box.xstart
		const height = box.yend - box.ystart
		const xend = xstart + width
		const yend = ystart + yend
		this.r0 = this.xScale.invert(xstart)
		this.r1 = this.xScale.invert(xend)
		this.ystart = this.yScale.invert(ystart)
		this.yend = this.yScale.invert(yend)
		this.xScale.domain([ this.r0, this.r1 ])
		this.yScale.domain([ this.yend, this.ystart ])
		this.resetGraph()
		this.renderPointLocations()
	}

	initControls() {
		this.canvas.addEventListener('mousedown', e => this.mouseDownListener(e))
		this.canvas.addEventListener('mouseup', e => this.mouseUpListener(e))

		this.ctl = {
			play: document.getElementById('play'),
			start: document.getElementById('start'),
			stop: document.getElementById('stop'),
			next: document.getElementById('next'),
			clear: document.getElementById('clear'),
			save: document.getElementById('save'),

			boxZoomMode: document.getElementById('boxZoomMode'),
			boxZoomRect: document.getElementById('boxZoomRect'),

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

		this.ctl.boxZoomMode.addEventListener('click', e => {
			this.boxZoomMode = !this.boxZoomMode
			this.ctl.boxZoomMode.classList.toggle('selected')
			if (this.boxZoomMode) {
				this.animating = false
				this.canvas.style.cursor = 'crosshair'
			} else {
				this.drawingBoxZoom = false
				this.canvas.style.cursor = 'auto'
				this.ctl.boxZoomRect.classList.add('hidden')
				console.log('tickedy-to')
			}
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
