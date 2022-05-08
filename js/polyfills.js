var self = ((a) => {
	a.onsuccess = function () {
		self = this.result;
	};
})(navigator.mozApps.getSelf());

const getId = (e) => document.getElementById(e),
	qs = (e) => document.querySelector(e),
	qsa = (e) => [...document.querySelectorAll(e)],
	unix_epoch = () => (new Date()-0),
	last = (e) => e[e.length - 1],
	crel = (e) => document.createElement(e);
Element.prototype.qs = Element.prototype.querySelector;
Element.prototype.qsa = function (e) {
	return [...this.querySelectorAll(e)];
};
const actEl = (e) => document.activeElement;
// Element.prototype.prepend
Document.prototype.prepend = Element.prototype.prepend = function prepend() {
	function _mutation(nodes) {
		if (!nodes.length) throw new Error("DOM Exception 8");
		else if (nodes.length === 1) return typeof nodes[0] === "string" ? document.createTextNode(nodes[0]) : nodes[0];
		else {
			var fragment = document.createDocumentFragment(),
				length = nodes.length,
				index = -1,
				node;
			while (++index < length) {
				node = nodes[index];
				fragment.appendChild(typeof node === "string" ? document.createTextNode(node) : node);
			}
			return fragment;
		}
	}
	this.insertBefore(_mutation(arguments), this.firstChild);
};

function decimal2rgb(ns, arr) {
	let r = Math.floor(ns / (256 * 256)),
		g = Math.floor(ns / 256) % 256,
		b = ns % 256;
	return arr ? [r, g, b] : { r, g, b };
}
