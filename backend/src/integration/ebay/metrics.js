/**
 * metrics.js
 * In-process metrics: counters, gauges, timestamps, simple histograms, last errors.
 * Intentionally lightweight (no external deps) and snapshot-based.
 */
const counters = Object.create(null);
const gauges = Object.create(null);
const timestamps = Object.create(null); // name -> epoch ms
const histograms = Object.create(null); // name -> { buckets: [numbers], counts: number[], sum }
const lastErrors = Object.create(null); // name -> { message, ts }

function inc(name, value = 1){ counters[name] = (counters[name] || 0) + value; }
function setGauge(name, value){ gauges[name] = value; }
function mark(name){ timestamps[name] = Date.now(); }
function recordError(name, err){ lastErrors[name] = { message: (err && err.message) ? err.message : String(err), ts: Date.now() }; inc(name + '.errors'); mark(name + '.last_error'); }

function observe(name, value){
	if (!histograms[name]) {
		// Default buckets (ms): 5,10,25,50,100,250,500,1000,2500,5000,10000
		const buckets = [5,10,25,50,100,250,500,1000,2500,5000,10000];
		histograms[name] = { buckets, counts: new Array(buckets.length + 1).fill(0), sum: 0 };
	}
	const h = histograms[name];
	h.sum += value;
	let placed = false;
	for (let i=0;i<h.buckets.length;i++){ if (value <= h.buckets[i]) { h.counts[i]++; placed = true; break; } }
	if (!placed) { h.counts[h.counts.length - 1]++; }
}

function histogramSnapshot(){
	const out = {};
	for (const [k,h] of Object.entries(histograms)) {
		out[k] = { buckets: h.buckets, counts: h.counts.slice(), sum: h.sum };
	}
	return out;
}

function snapshot(){
	return {
		ts: Date.now(),
		counters: { ...counters },
		gauges: { ...gauges },
		timestamps: { ...timestamps },
		histograms: histogramSnapshot(),
		lastErrors: { ...lastErrors }
	};
}

module.exports = { inc, setGauge, mark, observe, recordError, snapshot };
