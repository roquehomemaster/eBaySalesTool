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
		let buckets;
		if (name === 'queue.item_wait_ms' && process.env.QUEUE_ITEM_WAIT_BUCKETS) {
			try {
				buckets = process.env.QUEUE_ITEM_WAIT_BUCKETS.split(',')
					.map(s=>parseInt(s.trim(),10))
					.filter(n=>!Number.isNaN(n) && n>0)
					.sort((a,b)=>a-b);
				// De-duplicate
				buckets = buckets.filter((v,i,arr)=>i===0 || v!==arr[i-1]);
				if (!buckets.length) { buckets = undefined; }
			} catch(_) { /* fallback */ }
		}
		if (!buckets) {
			// Default buckets (ms): 5,10,25,50,100,250,500,1000,2500,5000,10000
			buckets = [5,10,25,50,100,250,500,1000,2500,5000,10000];
		}
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
		const total = h.counts.reduce((a,b)=>a+b,0);
		// Compute approximate percentiles (50,90,95,99) based on bucket boundaries
		const targets = [0.5,0.9,0.95,0.99];
		const percentiles = {};
		targets.forEach(t => {
			const threshold = total * t;
			let cumulative = 0; let value = null;
			for (let i=0;i<h.counts.length;i++) { cumulative += h.counts[i]; if (cumulative >= threshold) { value = (i < h.buckets.length) ? h.buckets[i] : h.buckets[h.buckets.length-1]; break; } }
			percentiles['p'+Math.round(t*100)] = value;
		});
		out[k] = { buckets: h.buckets, counts: h.counts.slice(), sum: h.sum, count: total, percentiles };
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

// _internal_state is a lightweight bag for cross-module ephemeral data (e.g., log cooldown timestamps)
const _internal_state = {};
module.exports = { inc, setGauge, mark, observe, recordError, snapshot, _internal_state };
