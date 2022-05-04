var self = ((a) => {
	a.onsuccess = function () {
		self = this.result;
	};
})(navigator.mozApps.getSelf());

const getId = (e) => document.getElementById(e),
	qs = (e) => document.querySelector(e),
	qsa = (e) => [...document.querySelectorAll(e)],
	unix_epoch = () => new Date().getTime(),
	last = (e) => e[e.length - 1];
Element.prototype.qs = Element.prototype.querySelector;
Element.prototype.qsa = function (e) {
	return [...this.querySelectorAll(e)];
};
const actEl = (e) => document.activeElement;
