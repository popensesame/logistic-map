
import * as d3 from "d3";

console.log('hi')

const xScale = d3.scaleLinear()
    .domain([config.r0, config.r1])
    .range([margin.left, width - margin.right])

const yScale = d3.scaleLinear()
    .domain([1, 0])
    .range([margin.top, height - margin.bottom])

const margin = {top: 20, right: 20, bottom: 30, left: 30}

const height = 600
const width = 1000

const config = {
  r0     : 2.8,
  r1     : 4,
  rStep  : .0005,
  x0     : .001,
  x1     : .999,
  xStep  : .4,
  nStart : 100,
  nStop  : 150
}

const LogisticMap = (r, x0) => {
  const L = (r, x) => r*x*(1 - x)
  var n = 0
  var Xn = x0
  return {
    next: () => {
      Xn = L(r, Xn)
      n += 1
      return Xn
    },
    get_N: () => n,
    get_Xn: () => Xn
  }
}

const L_seq = (r, x0, n) => {
  let data = []
  const L = LogisticMap(r, x0)
  while (L.get_N() != n) {
    data.push(L.next())
  }
  return data
}

const L_grid = (c) => {
  let r0=c.r0, r1=c.r1, x0=c.x0, x1=c.x1, rStep=c.rStep, xStep=c.xStep, nStart=c.nStart, nStop=c.nStop
  let data = {}
  for (let r=r0; r<r1; r += rStep) {
    data[r] = {}
    for (let x=x0; x<x1; x+= xStep) {
      let seq = L_seq(r, x, nStop)
      data[r][x] = seq.splice(nStart, nStop)
    }
  }
  return {
    grid: () => data,
    all: () => {
      let all_data = []
      for (let r of Object.keys(data)) {
        for (let x of Object.keys(data[r])) {
          all_data.push({
            r: r,
            x: x,
            data: data[r][x]
          })
        }
      }
      return all_data
    }
  }
}


const svg = `<svg viewBox="0 0 ${width} ${height}" style="max-width: ${width}px; font: 10px sans-serif;">
  ${d3.select(svg`<g transform="translate(0,${height - margin.bottom})">`)
    .call(d3.axisBottom(xScale))
    .call(g => g.select(".domain").remove())
    .node()}
  ${d3.select(svg`<g transform="translate(${margin.left}, 0)">`)
    .call(d3.axisLeft(yScale))
    .call(g => g.select(".domain").remove())
    .node()}
  ${
    grid.all().map(o => {
      return o.data.map(d => d3.select(svg`<circle cx="${xScale(o.r)}" cy="${yScale(d)}" r=".15" style="fill: black;" />`).node() )
    }).flat()
  }
`


