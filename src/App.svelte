<script>
	import { onMount } from 'svelte';

	import { scaleLinear } from 'd3'
	import { LGraph } from './log_map'
	import * as Config from './config'

	const white = 'rgb(255, 255, 255, 100)'
	const black = 'rgb(0, 0, 0)'

	let { r0, r1, fnMin, fnMax, rStep, sampleSize } = Config.config

	let width = 1200
	let height = 600

	let POINT_SIZE = .5

	let x = scaleLinear()
			.domain([r0, r1])
			.range([0, width])

	let y = scaleLinear()
			.domain([fnMax, fnMin])
			.range([0, height])

	let graph
	let canvas
	let ctx
	let boxZoomRect

	let animating = false
	let boxZooming = false
	let drawZoomBox = false
	let zoomingIn = false
	let zoomingOut = false

	let frameIndex = -1
	let computeRate = 100

	function draw() {
		console.log(`Rendering frame ${frameIndex}...`)
		ctx.fillStyle = white
		ctx.clearRect(0, 0, width, height);
		ctx.rect(0, 0, width, height);
		ctx.fill()
		ctx.fillStyle = black
		const { R, slices } = graph.renderFrame(frameIndex, x, y)
		slices.forEach((slice, i) => {
			const x = R[i]
			for (let y of slice) {
				ctx.fillRect(x, y, POINT_SIZE, POINT_SIZE)
			}
		})
		if (animating) {
			frameIndex += 1
			requestAnimationFrame(draw)
		}
	}

	function resetGraph() {
		graph = new LGraph({ r0, r1, rStep, sampleSize })
		console.log(`Computing ${computeRate} iterations...`)
		graph.compute(computeRate)
	}

	function resetZoom() {
		({r0, r1, fnMin, fnMax, rStep} = Config.config);
		//resetGraph()
		x.domain([r0, r1])
		y.domain([fnMax, fnMin])
		requestAnimationFrame(draw)
	}

	function next() {
		frameIndex++
		requestAnimationFrame(draw)
	}

	function play() {
		console.log('Playing...')
		animating = true
		next()
	}

	let zoomBox = {
		xstart: 0,
		xend: 0,
		ystart: 0,
		yend: 0
	}

	function drawBoxZoomBox() {
		const box = zoomBox
		const top = Math.min(box.ystart, box.yend)
		const left = Math.min(box.xstart, box.xend)
		const width = Math.abs(box.xstart - box.xend)
		const height = Math.abs(box.ystart - box.yend)

		boxZoomRect.style.top = top
		boxZoomRect.style.left = left
		boxZoomRect.style.width = width
		boxZoomRect.style.height = height
	}

	function mouseMove(e) {
		if (!boxZooming || !drawZoomBox) return
		console.log('mousemove')
		zoomBox.xend = e.clientX
		zoomBox.yend = e.clientY
		drawBoxZoomBox()
	}

	function mouseDown(e) {
		if (!boxZooming) return
		console.log('mousedown')
		drawZoomBox = true
		zoomBox.xstart = e.clientX
		zoomBox.ystart = e.clientY
	}

	function mouseUp(e) {
		if (drawZoomBox) {
			console.log('mouseup')
			drawZoomBox = false
			boxZooming = false
			zoomToBox()
		}
	}

	function zoomToBox() {
		const canRect = canvas.getBoundingClientRect()
		// Get box rectangle in canvas coordinates
		// (zoomBox is in viewport coordinates)
		const xstart = zoomBox.xstart - canRect.left
		const ystart = zoomBox.ystart - canRect.top
		const width = zoomBox.xend - zoomBox.xstart
		const height = zoomBox.yend - zoomBox.ystart
		const xend = xstart + width
		const yend = ystart + height
		//const oldRWidth = r1-r0
		r0 = x.invert(xstart)
		r1 = x.invert(xend)
		//rStep = rStep*(r1-r0)/oldRWidth*5
		//console.log(rStep)
		fnMin = y.invert(yend)
		fnMax = y.invert(ystart)
		x.domain([ r0, r1 ])
		y.domain([ fnMax, fnMin ])
		//resetGraph()
		requestAnimationFrame(draw)
	}

	function zoomOut(e) {
		r0 = x.invert(width*1.25)
		r1 = x.invert(width*1.75)
		x.domain([r0, r1])
		fnMax = y.invert(height*1.25)
		fnMin = y.invert(height*1.75)
		y.domain([fnMax, fnMin])
		requestAnimationFrame(draw)
	}

	function zoomIn(e) {
		const canRect = canvas.getBoundingClientRect()
		const mouseX = e.clientX - canRect.left
		const mouseY = e.clientY - canRect.top
		const r = x.invert(mouseX)
		const fn = y.invert(mouseY)
		const len = r1-r0
		r0 = x.invert(width)
		r1 = x.invert(width)
		x.domain([r0, r1])
		fnMax = y.invert(height*.25)
		fnMin = y.invert(height*.75)
		y.domain([fnMax, fnMin])
		requestAnimationFrame(draw)
	}

	onMount(() => {
		ctx = canvas.getContext('2d')
		resetGraph()
	})
</script>

<main>
	<div id="menu">
		<button on:click={next}>Next</button>
		<button on:click={play}>Play</button>
		<button on:click={e => animating = false}>Stop</button>
		<button on:click={e => zoomingIn = true} class:active={zoomingIn}>Zoom In</button>
		<button on:click={e => zoomingOut = false} class:active={zoomingOut}>Zoom Out</button>
		<button on:click={e => boxZooming = !boxZooming} id="boxZoom" class:active={boxZooming}>Box Zoom</button>
		<button on:click={resetZoom}>Reset Zoom</button>
	</div>

	<div class="container">
		<canvas class:zoomingIn={zoomingIn} class:zoomingOut={zoomingOut} clas:boxZooming={boxZooming} on:mousedown={mouseDown} on:mouseup={mouseUp} on:mousemove={mouseMove} bind:this={canvas} id="canvas" width={width} height={height}>
	<div id="boxZoomRect" bind:this={boxZoomRect} class:hidden={boxZooming}></div>
</canvas>
	</div>
</main>

<style>
	canvas {
		margin: 20px;
		background-color: white;
	}

	canvas.zoomingIn {
		cursor: zoom-in;
	}

	canvas.zoomingOut {
		cursor: zoom-out;
	}

	canvas.boxZooming {
		cursor: crosshair;
	}	

	button.active {
		background-color: lightblue;
	}

	#boxZoomRect {
		border: 1px solid black;
	}

	#boxZoomRect.hidden {
		display: none;
	}

</style>
