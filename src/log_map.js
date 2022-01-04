
function LMap (r, x0) {
  this.Xn = x0
  this.n = 0
  this.next = () => {
    this.n += 1
    return this.Xn = r * this.Xn * (1-this.Xn)
  }
  return this
}

function LSlice (r, size) {
  this.r = r
  this.maps = []
  for (let i=0; i<size; i++) {
    const rand = Math.random()
    this.maps.push(new LMap(r, rand))
  }
  this.next = () => { this.maps.forEach(lmap => lmap.next()) }
  this.get = () => this.maps.map(lmap => lmap.Xn)
  this.n = () => this.maps[0].n
  this.size = size
  return this
}

function LGraph (r0, r1, rStep, sliceSampleSize) {
  this.slices = []
  for (let r=r0; r<r1; r+=rStep) {
    this.slices.push(new LSlice(r, sliceSampleSize))
  }
  this._next = () => { this.slices.forEach(slice => slice.next()) }
  this.next = (iterations) => {
    for (let i of Array(iterations || 1)) { this._next() }
  }
  this.n = () => this.steps[0].n()
}

function LSeq (r, x0) {
  this.LMap = new LMap(r, x0)
  this.data = new Float32Array()
  this.next = () => {
    const Xn = this.LMap.next()
    this.data.push(Xn)
    return Xn
  }
  this.n = () => L.n
  return this
}

export { LGraph, LSlice, LSeq, LMap }
