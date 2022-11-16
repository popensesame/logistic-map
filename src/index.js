
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
		this.initControls(conf)
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

	resetCanvas(conf) {
		this.clear()
		this.canvas.width = conf.width || this.canvas.width
		this.canvas.height = conf.height || this.canvas.height
		this.graph = newGraph()
	}

	draw() {
		//this.ctx.save();
		this.ctx.fillStyle = this.fillStyleWhite
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.rect(0, 0, this.width, this.height);
		this.ctx.fill()
		this.ctx.fillStyle = this.fillStyleBlack
		//this.ctx.restore();
		for (let slice of this.graph.slices) {
			const data = slice.get()
			for (let v of data) {
				const x = xScale(parseFloat(slice.r))
				const y = yScale(parseFloat(v))
				this.ctx.fillRect(x, y, POINT_SIZE, POINT_SIZE)
			}
		}
		this.graph.next()
		if (this.animating) {
			window.requestAnimationFrame(this.draw.bind(this))
		} else {
			console.log('Stopping...')
		}
	}

	initControls(conf) {
		this.ctl = {
			play: document.getElementById('play'),
			start: document.getElementById('start'),
			stop: document.getElementById('stop'),
			next: document.getElementById('next'),
			clear: document.getElementById('clear'),
			save: document.getElementById('save'),

			r0: document.getElementById('r0'),
			r1: document.getElementById('r1'),
			rStep: document.getElementById('rStep'),
			xSize: document.getElementById('xSize'),
			width: document.getElementById('width'),
			height: document.getElementById('height')
		}

		const keys = [ 'r0', 'r1', 'rStep', 'xSize', 'width', 'height' ]
		keys.forEach(k => {
			this.ctl[k].value = conf[k]
			this.ctl[k].addEventListener('change', e => {
				this[k] = parseInt(e.target.value)
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
