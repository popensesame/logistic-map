
class LogisticMap {
	constructor(r) {
		this.r = r
		this.X = []
		this.X.push(Math.random())
	}
	render(scale) {
		return this.X.map(x => scale(x))
	}
	renderFrame(index, scale) {
		return scale(this.X[index])
	}
	f(r, x) { return r*x*(1-x) }
	get n() { return this.X.length - 1 }
	next() { this.X.push(this.f(this.r, this.X[this.n])) }
}

export class LGraph {
	constructor(conf) {
		const { r0, r1, rStep, sampleSize } = conf
		this.slices = {}
		for (let r=0; r<r1; r+=rStep) {
			this.slices[r] = [...Array(sampleSize)].map(d => {
				return new LogisticMap(r)
			})
		}
		this.R = Object.keys(this.slices)
		this.R.sort()
	}
	renderFrame(index, rScale, xScale) {
		return {
			R: this.R.map(r => rScale(r)),
			slices: this.R.map(r => {
				return this.slices[r]
					.map(lmap => lmap.renderFrame(index, xScale))
			})
		}
	}
	render(rScale, xScale) {
		return {
			R: this.R.map(r => {
				return rScale(r)
			}),
			slices: this.R.map(r => {
				return this.slices[r].map(lmap => {
					return lmap.render(xScale)
				})
			})
		}
	}
	compute(num) { for (let i=0; i<num; i++) { this.next() } }
	get n () { return this.slices[0][0].n }
	next() {
		this.R.forEach(r => {
			this.slices[r].forEach(map => { map.next () })
		})
	}
}

