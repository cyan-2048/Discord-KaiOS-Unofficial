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

// focus - focusOptions - preventScroll polyfill
// prettier-ignore
!function(){HTMLElement.prototype.nativeFocus=HTMLElement.prototype.focus;var t=function(t){for(var e=0;e<t.length;e++)t[e][0].scrollTop=t[e][1],t[e][0].scrollLeft=t[e][2];t=[]};HTMLElement.prototype.focus=function(e){if(e&&e.preventScroll){var o=function(t){for(var e=t.parentNode,o=[],n=document.scrollingElement||document.documentElement;e&&e!==n;)(e.offsetHeight<e.scrollHeight||e.offsetWidth<e.scrollWidth)&&o.push([e,e.scrollTop,e.scrollLeft]),e=e.parentNode;return e=n,o.push([e,e.scrollTop,e.scrollLeft]),o}(this);if("function"==typeof setTimeout){var n=this;setTimeout(function(){n.nativeFocus(),t(o)},0)}else this.nativeFocus(),t(o)}else this.nativeFocus()}}();
