(function() {
    const l = document.createElement("link").relList;
    if (l && l.supports && l.supports("modulepreload"))
        return;
    for (const c of document.querySelectorAll('link[rel="modulepreload"]'))
        o(c);
    new MutationObserver(c => {
        for (const f of c)
            if (f.type === "childList")
                for (const d of f.addedNodes)
                    d.tagName === "LINK" && d.rel === "modulepreload" && o(d)
    }
    ).observe(document, {
        childList: !0,
        subtree: !0
    });
    function r(c) {
        const f = {};
        return c.integrity && (f.integrity = c.integrity),
        c.referrerPolicy && (f.referrerPolicy = c.referrerPolicy),
        c.crossOrigin === "use-credentials" ? f.credentials = "include" : c.crossOrigin === "anonymous" ? f.credentials = "omit" : f.credentials = "same-origin",
        f
    }
    function o(c) {
        if (c.ep)
            return;
        c.ep = !0;
        const f = r(c);
        fetch(c.href, f)
    }
}
)();
const Rs = [];
let yg = !0;
const xg = console.error;
function am(i) {
    Rs.length > 5 || !yg || Rs.push(i)
}
function vg(i) {
    Rs.push({
        type: "runtime",
        args: i
    })
}
function bg(i) {
    i.preventDefault()
}
function ky(i) {
    try {
        const l = i.find(r => r instanceof Error);
        if (l && l.stack)
            am({
                type: "console.error",
                args: l
            });
        else if (i.length > 0) {
            const r = i.map(c => typeof c == "object" ? JSON.stringify(c) : String(c)).join(" ")
              , o = new Error(r);
            am({
                type: "console.error",
                args: o
            })
        }
    } catch (l) {
        console.warn(l)
    }
}
window.addEventListener("error", vg);
window.addEventListener("unhandledrejection", bg);
console.error = function(...l) {
    ky(l),
    xg.apply(this, l)
}
;
function Gy() {
    return window.removeEventListener("error", vg),
    window.removeEventListener("unhandledrejection", bg),
    console.error = xg,
    yg = !1,
    Rs
}
const Yy = 1e3
  , lm = Symbol("postMessageResponseTimeout");
let Ss = 0;
const su = "*";
class Za {
    client;
    baseTimeout;
    waitRes = new Map;
    removeListeners = new Set;
    clear;
    constructor(l, r) {
        this.client = l,
        this.baseTimeout = r?.timeout || Yy;
        const o = this.emitResponse.bind(this);
        this.clear = () => {
            window.removeEventListener("message", o)
        }
        ,
        window.addEventListener("message", o)
    }
    destroy() {
        this.clear(),
        this.removeListeners.forEach(l => l())
    }
    isTimeout(l) {
        return l === lm
    }
    post(l, r, o) {
        Ss++;
        const {timeout: c, origin: f=su} = o || {};
        return this.client.postMessage({
            data: r,
            id: Ss,
            type: l
        }, f),
        new Promise(d => {
            this.waitRes.set(Ss, m => {
                d(m)
            }
            ),
            setTimeout( () => {
                this.waitRes.delete(Ss),
                d(lm)
            }
            , c || this.baseTimeout)
        }
        )
    }
    on(l, r, o) {
        const {once: c, origin: f=su} = o || {}
          , d = async p => {
            const {id: y, type: S, data: v} = p.data;
            let w;
            S === l && (w = await r(v),
            console.log(l, c, w, v),
            (y && f === p.origin || f === su) && p.source?.postMessage({
                fromType: l,
                id: y,
                data: w
            }, p.origin),
            c && m())
        }
        ;
        window.addEventListener("message", d);
        const m = () => {
            window.removeEventListener("message", d),
            this.removeListeners.delete(m)
        }
        ;
        return this.removeListeners.add(m),
        m
    }
    emitResponse(l) {
        const r = l.data
          , {id: o, data: c} = r
          , f = this.waitRes.get(o);
        f && f(c)
    }
}
class Vy {
    #e = new WeakMap;
    #n;
    #a;
    #t = !1;
    constructor() {
        this.#n = HTMLElement.prototype.addEventListener,
        this.#a = HTMLElement.prototype.removeEventListener
    }
    patch() {
        if (this.#t)
            return;
        const l = this;
        HTMLElement.prototype.addEventListener = function(r, o, c) {
            return l.#l(this, r, o),
            l.#n.call(this, r, o, c)
        }
        ,
        HTMLElement.prototype.removeEventListener = function(r, o, c) {
            return l.#i(this, r, o),
            l.#a.call(this, r, o, c)
        }
        ,
        this.#t = !0,
        console.log("[EventListenerRegistry] ✅ addEventListener patched")
    }
    unpatch() {
        this.#t && (HTMLElement.prototype.addEventListener = this.#n,
        HTMLElement.prototype.removeEventListener = this.#a,
        this.#t = !1,
        console.log("[EventListenerRegistry] ⚠️ addEventListener unpatched"))
    }
    #l(l, r, o) {
        let c = this.#e.get(l);
        c || (c = new Map,
        this.#e.set(l, c));
        let f = c.get(r);
        f || (f = new Set,
        c.set(r, f)),
        f.add(o)
    }
    #i(l, r, o) {
        const c = this.#e.get(l);
        if (!c)
            return;
        const f = c.get(r);
        f && (f.delete(o),
        f.size === 0 && c.delete(r))
    }
    hasListeners(l, r) {
        const o = this.#e.get(l);
        return !o || o.size === 0 ? !1 : r ? r.some(c => {
            const f = o.get(c);
            return f && f.size > 0
        }
        ) : !0
    }
    getEventTypes(l) {
        const r = this.#e.get(l);
        return r ? Array.from(r.keys()) : []
    }
    getListenerCount(l, r) {
        const o = this.#e.get(l);
        if (!o)
            return 0;
        const c = o.get(r);
        return c ? c.size : 0
    }
    getDebugInfo() {
        return {
            patched: this.#t,
            note: "WeakMap is used for automatic memory cleanup. Cannot enumerate elements."
        }
    }
    getElementDebugInfo(l) {
        const r = this.#e.get(l);
        return r ? {
            element: l,
            tag: l.tagName,
            className: l.className,
            hasListeners: !0,
            eventTypes: Array.from(r.keys()),
            totalListeners: Array.from(r.values()).reduce( (o, c) => o + c.size, 0)
        } : {
            element: l,
            hasListeners: !1,
            eventTypes: [],
            totalListeners: 0
        }
    }
}
const Xa = new Vy
  , Sg = ["click", "dblclick", "contextmenu", "mousedown", "mouseup", "mousemove", "mouseenter", "mouseleave", "mouseover", "mouseout", "touchstart", "touchmove", "touchend", "touchcancel", "pointerdown", "pointerup", "pointermove", "pointerenter", "pointerleave", "pointerover", "pointerout", "pointercancel"];
function Hu(i) {
    return Xa.hasListeners(i, Sg)
}
function wg(i) {
    return Xa.getEventTypes(i).filter(r => Sg.includes(r))
}
function Eg(i) {
    const l = wg(i)
      , r = {};
    return l.forEach(o => {
        r[o] = Xa.getListenerCount(i, o)
    }
    ),
    {
        hasEvents: l.length > 0,
        eventTypes: l,
        listeners: r
    }
}
function Qy(i) {
    return Xa.getElementDebugInfo(i)
}
function Ng(i=window) {
    Xa.patch(),
    i.__eventListenerRegistry__ = {
        hasListeners: Hu,
        getEventTypes: wg,
        getDetail: Eg,
        getDebugInfo: () => Xa.getDebugInfo(),
        getElementDebugInfo: Qy
    },
    console.log("[EnhancedEventDetector] ✅ Initialized and patched addEventListener")
}
typeof window < "u" && Ng(window);
const Bu = ["onClick", "onDoubleClick", "onContextMenu", "onMouseDown", "onMouseUp", "onPointerDown", "onPointerUp", "onTouchStart", "onTouchEnd", "onDragStart", "onDrop", "onChange", "onSubmit", "onKeyDown", "onKeyUp"];
function qu(i) {
    const l = Object.keys(i).find(r => r.startsWith("__reactFiber$") || r.startsWith("__reactInternalInstance$"));
    return l ? i[l] : null
}
function Cg(i) {
    return !i || typeof i != "object" ? !1 : Bu.some(l => typeof i[l] == "function")
}
function Xy(i) {
    return !i || typeof i != "object" ? [] : Bu.filter(l => typeof i[l] == "function")
}
function _g(i) {
    let l = qu(i);
    for (; l; ) {
        if (l.memoizedProps && Cg(l.memoizedProps))
            return !0;
        l = l.return || null
    }
    return !1
}
function jg(i) {
    const l = {
        hasEvents: !1,
        events: []
    };
    let r = qu(i);
    for (; r; ) {
        if (r.memoizedProps) {
            const o = Xy(r.memoizedProps);
            if (o.length > 0) {
                l.hasEvents = !0;
                const c = r.type?.displayName || r.type?.name || r.elementType?.name || "Unknown";
                l.events.push({
                    componentName: c,
                    eventNames: o,
                    props: r.memoizedProps
                })
            }
        }
        r = r.return || null
    }
    return l
}
function Ag(i) {
    const l = qu(i);
    return !l || !l.memoizedProps ? !1 : Cg(l.memoizedProps)
}
function Tg(i=window) {
    i.__reactEventDetector__ = {
        hasReactInteractionEvents: _g,
        getReactInteractionEventsDetail: jg,
        hasReactInteractionEventsOnSelf: Ag,
        REACT_EVENT_PROPS: Bu
    },
    console.log("[ReactEventDetector] Injected to window.__reactEventDetector__")
}
typeof window < "u" && Tg(window);
function Og(i) {
    return i ? _g(i) || Hu(i) : !1
}
function Zy(i) {
    return i ? Ag(i) || Hu(i) : !1
}
function ku(i) {
    const l = jg(i)
      , r = Eg(i);
    return {
        hasEvents: l.hasEvents || r.hasEvents,
        react: l,
        native: r
    }
}
function Gu(i) {
    if (!i)
        return {
            error: "selector is required"
        };
    const l = document.querySelector(i);
    if (!l)
        return {
            error: "Element not found",
            selector: i
        };
    const r = ku(l);
    return {
        selector: i,
        hasEvents: r.hasEvents
    }
}
function Rg(i, l) {
    if (typeof i != "number" || typeof l != "number")
        return {
            error: "x and y must be numbers"
        };
    const r = document.elementFromPoint(i, l);
    if (!r)
        return {
            error: "No element at point",
            x: i,
            y: l
        };
    const o = ku(r);
    return {
        x: i,
        y: l,
        hasEvents: o.hasEvents
    }
}
function Ky(i) {
    return i.map(l => ({
        element: l,
        hasEvents: Og(l)
    }))
}
function Mg(i) {
    return i.map(l => ({
        selector: l,
        result: Gu(l)
    }))
}
const im = "1.0.0";
function Fy() {
    window.__interactionDetector__ = {
        hasInteractionEvents: Og,
        hasInteractionEventsOnSelf: Zy,
        getDetail: ku,
        checkBySelector: Gu,
        checkByPoint: Rg,
        checkMultiple: Ky,
        checkMultipleSelectors: Mg,
        version: im
    },
    console.log(`[InteractionDetector] Global API initialized (v${im})`)
}
function Jy() {
    const i = new Za(window.parent);
    i.on("checkInteraction", l => {
        const {selector: r, x: o, y: c} = l || {};
        return r ? Gu(r) : typeof o == "number" && typeof c == "number" ? Rg(o, c) : {
            error: "Invalid params: need selector or (x, y)"
        }
    }
    ),
    i.on("checkMultipleSelectors", l => {
        const {selectors: r} = l || {};
        return !r || !Array.isArray(r) ? {
            error: "selectors array is required"
        } : Mg(r)
    }
    ),
    console.log("[InteractionDetector] PostMessage listener initialized")
}
function $y() {
    Ng(),
    Tg(),
    Fy(),
    Jy(),
    console.log("[Continue] Module fully initialized")
}
function Wy(i) {
    return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i
}
function Iy(i) {
    if (Object.prototype.hasOwnProperty.call(i, "__esModule"))
        return i;
    var l = i.default;
    if (typeof l == "function") {
        var r = function o() {
            var c = !1;
            try {
                c = this instanceof o
            } catch {}
            return c ? Reflect.construct(l, arguments, this.constructor) : l.apply(this, arguments)
        };
        r.prototype = l.prototype
    } else
        r = {};
    return Object.defineProperty(r, "__esModule", {
        value: !0
    }),
    Object.keys(i).forEach(function(o) {
        var c = Object.getOwnPropertyDescriptor(i, o);
        Object.defineProperty(r, o, c.get ? c : {
            enumerable: !0,
            get: function() {
                return i[o]
            }
        })
    }),
    r
}
var Gl = {}, ru = {}, ou = {}, uu = {}, sm;
function Py() {
    if (sm)
        return uu;
    sm = 1;
    const i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    return uu.encode = function(l) {
        if (0 <= l && l < i.length)
            return i[l];
        throw new TypeError("Must be between 0 and 63: " + l)
    }
    ,
    uu
}
var rm;
function Dg() {
    if (rm)
        return ou;
    rm = 1;
    const i = Py()
      , l = 5
      , r = 1 << l
      , o = r - 1
      , c = r;
    function f(d) {
        return d < 0 ? (-d << 1) + 1 : (d << 1) + 0
    }
    return ou.encode = function(m) {
        let p = "", y, S = f(m);
        do
            y = S & o,
            S >>>= l,
            S > 0 && (y |= c),
            p += i.encode(y);
        while (S > 0);
        return p
    }
    ,
    ou
}
var Ut = {};
const ex = {}
  , tx = Object.freeze(Object.defineProperty({
    __proto__: null,
    default: ex
}, Symbol.toStringTag, {
    value: "Module"
}))
  , nx = Iy(tx);
var cu, om;
function ax() {
    return om || (om = 1,
    cu = typeof URL == "function" ? URL : nx.URL),
    cu
}
var um;
function Us() {
    if (um)
        return Ut;
    um = 1;
    const i = ax();
    function l(V, Q, F) {
        if (Q in V)
            return V[Q];
        if (arguments.length === 3)
            return F;
        throw new Error('"' + Q + '" is a required argument.')
    }
    Ut.getArg = l;
    const r = (function() {
        return !("__proto__"in Object.create(null))
    }
    )();
    function o(V) {
        return V
    }
    function c(V) {
        return d(V) ? "$" + V : V
    }
    Ut.toSetString = r ? o : c;
    function f(V) {
        return d(V) ? V.slice(1) : V
    }
    Ut.fromSetString = r ? o : f;
    function d(V) {
        if (!V)
            return !1;
        const Q = V.length;
        if (Q < 9 || V.charCodeAt(Q - 1) !== 95 || V.charCodeAt(Q - 2) !== 95 || V.charCodeAt(Q - 3) !== 111 || V.charCodeAt(Q - 4) !== 116 || V.charCodeAt(Q - 5) !== 111 || V.charCodeAt(Q - 6) !== 114 || V.charCodeAt(Q - 7) !== 112 || V.charCodeAt(Q - 8) !== 95 || V.charCodeAt(Q - 9) !== 95)
            return !1;
        for (let F = Q - 10; F >= 0; F--)
            if (V.charCodeAt(F) !== 36)
                return !1;
        return !0
    }
    function m(V, Q) {
        return V === Q ? 0 : V === null ? 1 : Q === null ? -1 : V > Q ? 1 : -1
    }
    function p(V, Q) {
        let F = V.generatedLine - Q.generatedLine;
        return F !== 0 || (F = V.generatedColumn - Q.generatedColumn,
        F !== 0) || (F = m(V.source, Q.source),
        F !== 0) || (F = V.originalLine - Q.originalLine,
        F !== 0) || (F = V.originalColumn - Q.originalColumn,
        F !== 0) ? F : m(V.name, Q.name)
    }
    Ut.compareByGeneratedPositionsInflated = p;
    function y(V) {
        return JSON.parse(V.replace(/^\)]}'[^\n]*\n/, ""))
    }
    Ut.parseSourceMapInput = y;
    const S = "http:"
      , v = `${S}//host`;
    function w(V) {
        return Q => {
            const F = D(Q)
              , ae = A(Q)
              , ce = new i(Q,ae);
            V(ce);
            const de = ce.toString();
            return F === "absolute" ? de : F === "scheme-relative" ? de.slice(S.length) : F === "path-absolute" ? de.slice(v.length) : k(ae, de)
        }
    }
    function b(V, Q) {
        return new i(V,Q).toString()
    }
    function E(V, Q) {
        let F = 0;
        do {
            const ae = V + F++;
            if (Q.indexOf(ae) === -1)
                return ae
        } while (!0)
    }
    function A(V) {
        const Q = V.split("..").length - 1
          , F = E("p", V);
        let ae = `${v}/`;
        for (let ce = 0; ce < Q; ce++)
            ae += `${F}/`;
        return ae
    }
    const N = /^[A-Za-z0-9\+\-\.]+:/;
    function D(V) {
        return V[0] === "/" ? V[1] === "/" ? "scheme-relative" : "path-absolute" : N.test(V) ? "absolute" : "path-relative"
    }
    function k(V, Q) {
        typeof V == "string" && (V = new i(V)),
        typeof Q == "string" && (Q = new i(Q));
        const F = Q.pathname.split("/")
          , ae = V.pathname.split("/");
        for (ae.length > 0 && !ae[ae.length - 1] && ae.pop(); F.length > 0 && ae.length > 0 && F[0] === ae[0]; )
            F.shift(),
            ae.shift();
        return ae.map( () => "..").concat(F).join("/") + Q.search + Q.hash
    }
    const G = w(V => {
        V.pathname = V.pathname.replace(/\/?$/, "/")
    }
    )
      , $ = w(V => {
        V.href = new i(".",V.toString()).toString()
    }
    )
      , W = w(V => {}
    );
    Ut.normalize = W;
    function J(V, Q) {
        const F = D(Q)
          , ae = D(V);
        if (V = G(V),
        F === "absolute")
            return b(Q, void 0);
        if (ae === "absolute")
            return b(Q, V);
        if (F === "scheme-relative")
            return W(Q);
        if (ae === "scheme-relative")
            return b(Q, b(V, v)).slice(S.length);
        if (F === "path-absolute")
            return W(Q);
        if (ae === "path-absolute")
            return b(Q, b(V, v)).slice(v.length);
        const ce = A(Q + V)
          , de = b(Q, b(V, ce));
        return k(ce, de)
    }
    Ut.join = J;
    function Z(V, Q) {
        const F = ie(V, Q);
        return typeof F == "string" ? F : W(Q)
    }
    Ut.relative = Z;
    function ie(V, Q) {
        if (D(V) !== D(Q))
            return null;
        const ae = A(V + Q)
          , ce = new i(V,ae)
          , de = new i(Q,ae);
        try {
            new i("",de.toString())
        } catch {
            return null
        }
        return de.protocol !== ce.protocol || de.user !== ce.user || de.password !== ce.password || de.hostname !== ce.hostname || de.port !== ce.port ? null : k(ce, de)
    }
    function we(V, Q, F) {
        V && D(Q) === "path-absolute" && (Q = Q.replace(/^\//, ""));
        let ae = W(Q || "");
        return V && (ae = J(V, ae)),
        F && (ae = J($(F), ae)),
        ae
    }
    return Ut.computeSourceURL = we,
    Ut
}
var fu = {}, cm;
function Lg() {
    if (cm)
        return fu;
    cm = 1;
    class i {
        constructor() {
            this._array = [],
            this._set = new Map
        }
        static fromArray(r, o) {
            const c = new i;
            for (let f = 0, d = r.length; f < d; f++)
                c.add(r[f], o);
            return c
        }
        size() {
            return this._set.size
        }
        add(r, o) {
            const c = this.has(r)
              , f = this._array.length;
            (!c || o) && this._array.push(r),
            c || this._set.set(r, f)
        }
        has(r) {
            return this._set.has(r)
        }
        indexOf(r) {
            const o = this._set.get(r);
            if (o >= 0)
                return o;
            throw new Error('"' + r + '" is not in the set.')
        }
        at(r) {
            if (r >= 0 && r < this._array.length)
                return this._array[r];
            throw new Error("No element indexed by " + r)
        }
        toArray() {
            return this._array.slice()
        }
    }
    return fu.ArraySet = i,
    fu
}
var du = {}, fm;
function lx() {
    if (fm)
        return du;
    fm = 1;
    const i = Us();
    function l(o, c) {
        const f = o.generatedLine
          , d = c.generatedLine
          , m = o.generatedColumn
          , p = c.generatedColumn;
        return d > f || d == f && p >= m || i.compareByGeneratedPositionsInflated(o, c) <= 0
    }
    class r {
        constructor() {
            this._array = [],
            this._sorted = !0,
            this._last = {
                generatedLine: -1,
                generatedColumn: 0
            }
        }
        unsortedForEach(c, f) {
            this._array.forEach(c, f)
        }
        add(c) {
            l(this._last, c) ? (this._last = c,
            this._array.push(c)) : (this._sorted = !1,
            this._array.push(c))
        }
        toArray() {
            return this._sorted || (this._array.sort(i.compareByGeneratedPositionsInflated),
            this._sorted = !0),
            this._array
        }
    }
    return du.MappingList = r,
    du
}
var dm;
function zg() {
    if (dm)
        return ru;
    dm = 1;
    const i = Dg()
      , l = Us()
      , r = Lg().ArraySet
      , o = lx().MappingList;
    class c {
        constructor(d) {
            d || (d = {}),
            this._file = l.getArg(d, "file", null),
            this._sourceRoot = l.getArg(d, "sourceRoot", null),
            this._skipValidation = l.getArg(d, "skipValidation", !1),
            this._sources = new r,
            this._names = new r,
            this._mappings = new o,
            this._sourcesContents = null
        }
        static fromSourceMap(d) {
            const m = d.sourceRoot
              , p = new c({
                file: d.file,
                sourceRoot: m
            });
            return d.eachMapping(function(y) {
                const S = {
                    generated: {
                        line: y.generatedLine,
                        column: y.generatedColumn
                    }
                };
                y.source != null && (S.source = y.source,
                m != null && (S.source = l.relative(m, S.source)),
                S.original = {
                    line: y.originalLine,
                    column: y.originalColumn
                },
                y.name != null && (S.name = y.name)),
                p.addMapping(S)
            }),
            d.sources.forEach(function(y) {
                let S = y;
                m != null && (S = l.relative(m, y)),
                p._sources.has(S) || p._sources.add(S);
                const v = d.sourceContentFor(y);
                v != null && p.setSourceContent(y, v)
            }),
            p
        }
        addMapping(d) {
            const m = l.getArg(d, "generated")
              , p = l.getArg(d, "original", null);
            let y = l.getArg(d, "source", null)
              , S = l.getArg(d, "name", null);
            this._skipValidation || this._validateMapping(m, p, y, S),
            y != null && (y = String(y),
            this._sources.has(y) || this._sources.add(y)),
            S != null && (S = String(S),
            this._names.has(S) || this._names.add(S)),
            this._mappings.add({
                generatedLine: m.line,
                generatedColumn: m.column,
                originalLine: p && p.line,
                originalColumn: p && p.column,
                source: y,
                name: S
            })
        }
        setSourceContent(d, m) {
            let p = d;
            this._sourceRoot != null && (p = l.relative(this._sourceRoot, p)),
            m != null ? (this._sourcesContents || (this._sourcesContents = Object.create(null)),
            this._sourcesContents[l.toSetString(p)] = m) : this._sourcesContents && (delete this._sourcesContents[l.toSetString(p)],
            Object.keys(this._sourcesContents).length === 0 && (this._sourcesContents = null))
        }
        applySourceMap(d, m, p) {
            let y = m;
            if (m == null) {
                if (d.file == null)
                    throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);
                y = d.file
            }
            const S = this._sourceRoot;
            S != null && (y = l.relative(S, y));
            const v = this._mappings.toArray().length > 0 ? new r : this._sources
              , w = new r;
            this._mappings.unsortedForEach(function(b) {
                if (b.source === y && b.originalLine != null) {
                    const N = d.originalPositionFor({
                        line: b.originalLine,
                        column: b.originalColumn
                    });
                    N.source != null && (b.source = N.source,
                    p != null && (b.source = l.join(p, b.source)),
                    S != null && (b.source = l.relative(S, b.source)),
                    b.originalLine = N.line,
                    b.originalColumn = N.column,
                    N.name != null && (b.name = N.name))
                }
                const E = b.source;
                E != null && !v.has(E) && v.add(E);
                const A = b.name;
                A != null && !w.has(A) && w.add(A)
            }, this),
            this._sources = v,
            this._names = w,
            d.sources.forEach(function(b) {
                const E = d.sourceContentFor(b);
                E != null && (p != null && (b = l.join(p, b)),
                S != null && (b = l.relative(S, b)),
                this.setSourceContent(b, E))
            }, this)
        }
        _validateMapping(d, m, p, y) {
            if (m && typeof m.line != "number" && typeof m.column != "number")
                throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");
            if (!(d && "line"in d && "column"in d && d.line > 0 && d.column >= 0 && !m && !p && !y)) {
                if (!(d && "line"in d && "column"in d && m && "line"in m && "column"in m && d.line > 0 && d.column >= 0 && m.line > 0 && m.column >= 0 && p))
                    throw new Error("Invalid mapping: " + JSON.stringify({
                        generated: d,
                        source: p,
                        original: m,
                        name: y
                    }))
            }
        }
        _serializeMappings() {
            let d = 0, m = 1, p = 0, y = 0, S = 0, v = 0, w = "", b, E, A, N;
            const D = this._mappings.toArray();
            for (let k = 0, G = D.length; k < G; k++) {
                if (E = D[k],
                b = "",
                E.generatedLine !== m)
                    for (d = 0; E.generatedLine !== m; )
                        b += ";",
                        m++;
                else if (k > 0) {
                    if (!l.compareByGeneratedPositionsInflated(E, D[k - 1]))
                        continue;
                    b += ","
                }
                b += i.encode(E.generatedColumn - d),
                d = E.generatedColumn,
                E.source != null && (N = this._sources.indexOf(E.source),
                b += i.encode(N - v),
                v = N,
                b += i.encode(E.originalLine - 1 - y),
                y = E.originalLine - 1,
                b += i.encode(E.originalColumn - p),
                p = E.originalColumn,
                E.name != null && (A = this._names.indexOf(E.name),
                b += i.encode(A - S),
                S = A)),
                w += b
            }
            return w
        }
        _generateSourcesContent(d, m) {
            return d.map(function(p) {
                if (!this._sourcesContents)
                    return null;
                m != null && (p = l.relative(m, p));
                const y = l.toSetString(p);
                return Object.prototype.hasOwnProperty.call(this._sourcesContents, y) ? this._sourcesContents[y] : null
            }, this)
        }
        toJSON() {
            const d = {
                version: this._version,
                sources: this._sources.toArray(),
                names: this._names.toArray(),
                mappings: this._serializeMappings()
            };
            return this._file != null && (d.file = this._file),
            this._sourceRoot != null && (d.sourceRoot = this._sourceRoot),
            this._sourcesContents && (d.sourcesContent = this._generateSourcesContent(d.sources, d.sourceRoot)),
            d
        }
        toString() {
            return JSON.stringify(this.toJSON())
        }
    }
    return c.prototype._version = 3,
    ru.SourceMapGenerator = c,
    ru
}
var Yl = {}, hu = {}, hm;
function ix() {
    return hm || (hm = 1,
    (function(i) {
        i.GREATEST_LOWER_BOUND = 1,
        i.LEAST_UPPER_BOUND = 2;
        function l(r, o, c, f, d, m) {
            const p = Math.floor((o - r) / 2) + r
              , y = d(c, f[p], !0);
            return y === 0 ? p : y > 0 ? o - p > 1 ? l(p, o, c, f, d, m) : m === i.LEAST_UPPER_BOUND ? o < f.length ? o : -1 : p : p - r > 1 ? l(r, p, c, f, d, m) : m == i.LEAST_UPPER_BOUND ? p : r < 0 ? -1 : r
        }
        i.search = function(o, c, f, d) {
            if (c.length === 0)
                return -1;
            let m = l(-1, c.length, o, c, f, d || i.GREATEST_LOWER_BOUND);
            if (m < 0)
                return -1;
            for (; m - 1 >= 0 && f(c[m], c[m - 1], !0) === 0; )
                --m;
            return m
        }
    }
    )(hu)),
    hu
}
var ws = {
    exports: {}
}, mm;
function Ug() {
    if (mm)
        return ws.exports;
    mm = 1;
    let i = null;
    return ws.exports = function() {
        if (typeof i == "string")
            return fetch(i).then(r => r.arrayBuffer());
        if (i instanceof ArrayBuffer)
            return Promise.resolve(i);
        throw new Error("You must provide the string URL or ArrayBuffer contents of lib/mappings.wasm by calling SourceMapConsumer.initialize({ 'lib/mappings.wasm': ... }) before using SourceMapConsumer")
    }
    ,
    ws.exports.initialize = l => {
        i = l
    }
    ,
    ws.exports
}
var mu, gm;
function sx() {
    if (gm)
        return mu;
    gm = 1;
    const i = Ug();
    function l() {
        this.generatedLine = 0,
        this.generatedColumn = 0,
        this.lastGeneratedColumn = null,
        this.source = null,
        this.originalLine = null,
        this.originalColumn = null,
        this.name = null
    }
    let r = null;
    return mu = function() {
        if (r)
            return r;
        const c = [];
        return r = i().then(f => WebAssembly.instantiate(f, {
            env: {
                mapping_callback(d, m, p, y, S, v, w, b, E, A) {
                    const N = new l;
                    N.generatedLine = d + 1,
                    N.generatedColumn = m,
                    p && (N.lastGeneratedColumn = y - 1),
                    S && (N.source = v,
                    N.originalLine = w + 1,
                    N.originalColumn = b,
                    E && (N.name = A)),
                    c[c.length - 1](N)
                },
                start_all_generated_locations_for() {
                    console.time("all_generated_locations_for")
                },
                end_all_generated_locations_for() {
                    console.timeEnd("all_generated_locations_for")
                },
                start_compute_column_spans() {
                    console.time("compute_column_spans")
                },
                end_compute_column_spans() {
                    console.timeEnd("compute_column_spans")
                },
                start_generated_location_for() {
                    console.time("generated_location_for")
                },
                end_generated_location_for() {
                    console.timeEnd("generated_location_for")
                },
                start_original_location_for() {
                    console.time("original_location_for")
                },
                end_original_location_for() {
                    console.timeEnd("original_location_for")
                },
                start_parse_mappings() {
                    console.time("parse_mappings")
                },
                end_parse_mappings() {
                    console.timeEnd("parse_mappings")
                },
                start_sort_by_generated_location() {
                    console.time("sort_by_generated_location")
                },
                end_sort_by_generated_location() {
                    console.timeEnd("sort_by_generated_location")
                },
                start_sort_by_original_location() {
                    console.time("sort_by_original_location")
                },
                end_sort_by_original_location() {
                    console.timeEnd("sort_by_original_location")
                }
            }
        })).then(f => ({
            exports: f.instance.exports,
            withMappingCallback: (d, m) => {
                c.push(d);
                try {
                    m()
                } finally {
                    c.pop()
                }
            }
        })).then(null, f => {
            throw r = null,
            f
        }
        ),
        r
    }
    ,
    mu
}
var pm;
function rx() {
    if (pm)
        return Yl;
    pm = 1;
    const i = Us()
      , l = ix()
      , r = Lg().ArraySet;
    Dg();
    const o = Ug()
      , c = sx()
      , f = Symbol("smcInternal");
    class d {
        constructor(w, b) {
            return w == f ? Promise.resolve(this) : y(w, b)
        }
        static initialize(w) {
            o.initialize(w["lib/mappings.wasm"])
        }
        static fromSourceMap(w, b) {
            return S(w, b)
        }
        static async with(w, b, E) {
            const A = await new d(w,b);
            try {
                return await E(A)
            } finally {
                A.destroy()
            }
        }
        eachMapping(w, b, E) {
            throw new Error("Subclasses must implement eachMapping")
        }
        allGeneratedPositionsFor(w) {
            throw new Error("Subclasses must implement allGeneratedPositionsFor")
        }
        destroy() {
            throw new Error("Subclasses must implement destroy")
        }
    }
    d.prototype._version = 3,
    d.GENERATED_ORDER = 1,
    d.ORIGINAL_ORDER = 2,
    d.GREATEST_LOWER_BOUND = 1,
    d.LEAST_UPPER_BOUND = 2,
    Yl.SourceMapConsumer = d;
    class m extends d {
        constructor(w, b) {
            return super(f).then(E => {
                let A = w;
                typeof w == "string" && (A = i.parseSourceMapInput(w));
                const N = i.getArg(A, "version")
                  , D = i.getArg(A, "sources").map(String)
                  , k = i.getArg(A, "names", [])
                  , G = i.getArg(A, "sourceRoot", null)
                  , $ = i.getArg(A, "sourcesContent", null)
                  , W = i.getArg(A, "mappings")
                  , J = i.getArg(A, "file", null)
                  , Z = i.getArg(A, "x_google_ignoreList", null);
                if (N != E._version)
                    throw new Error("Unsupported version: " + N);
                return E._sourceLookupCache = new Map,
                E._names = r.fromArray(k.map(String), !0),
                E._sources = r.fromArray(D, !0),
                E._absoluteSources = r.fromArray(E._sources.toArray().map(function(ie) {
                    return i.computeSourceURL(G, ie, b)
                }), !0),
                E.sourceRoot = G,
                E.sourcesContent = $,
                E._mappings = W,
                E._sourceMapURL = b,
                E.file = J,
                E.x_google_ignoreList = Z,
                E._computedColumnSpans = !1,
                E._mappingsPtr = 0,
                E._wasm = null,
                c().then(ie => (E._wasm = ie,
                E))
            }
            )
        }
        _findSourceIndex(w) {
            const b = this._sourceLookupCache.get(w);
            if (typeof b == "number")
                return b;
            const E = i.computeSourceURL(null, w, this._sourceMapURL);
            if (this._absoluteSources.has(E)) {
                const N = this._absoluteSources.indexOf(E);
                return this._sourceLookupCache.set(w, N),
                N
            }
            const A = i.computeSourceURL(this.sourceRoot, w, this._sourceMapURL);
            if (this._absoluteSources.has(A)) {
                const N = this._absoluteSources.indexOf(A);
                return this._sourceLookupCache.set(w, N),
                N
            }
            return -1
        }
        static fromSourceMap(w, b) {
            return new m(w.toString())
        }
        get sources() {
            return this._absoluteSources.toArray()
        }
        _getMappingsPtr() {
            return this._mappingsPtr === 0 && this._parseMappings(),
            this._mappingsPtr
        }
        _parseMappings() {
            const w = this._mappings
              , b = w.length
              , E = this._wasm.exports.allocate_mappings(b) >>> 0
              , A = new Uint8Array(this._wasm.exports.memory.buffer,E,b);
            for (let D = 0; D < b; D++)
                A[D] = w.charCodeAt(D);
            const N = this._wasm.exports.parse_mappings(E);
            if (!N) {
                const D = this._wasm.exports.get_last_error();
                let k = `Error parsing mappings (code ${D}): `;
                switch (D) {
                case 1:
                    k += "the mappings contained a negative line, column, source index, or name index";
                    break;
                case 2:
                    k += "the mappings contained a number larger than 2**32";
                    break;
                case 3:
                    k += "reached EOF while in the middle of parsing a VLQ";
                    break;
                case 4:
                    k += "invalid base 64 character while parsing a VLQ";
                    break;
                default:
                    k += "unknown error code";
                    break
                }
                throw new Error(k)
            }
            this._mappingsPtr = N
        }
        eachMapping(w, b, E) {
            const A = b || null
              , N = E || d.GENERATED_ORDER;
            this._wasm.withMappingCallback(D => {
                D.source !== null && (D.source = this._absoluteSources.at(D.source),
                D.name !== null && (D.name = this._names.at(D.name))),
                this._computedColumnSpans && D.lastGeneratedColumn === null && (D.lastGeneratedColumn = 1 / 0),
                w.call(A, D)
            }
            , () => {
                switch (N) {
                case d.GENERATED_ORDER:
                    this._wasm.exports.by_generated_location(this._getMappingsPtr());
                    break;
                case d.ORIGINAL_ORDER:
                    this._wasm.exports.by_original_location(this._getMappingsPtr());
                    break;
                default:
                    throw new Error("Unknown order of iteration.")
                }
            }
            )
        }
        allGeneratedPositionsFor(w) {
            let b = i.getArg(w, "source");
            const E = i.getArg(w, "line")
              , A = w.column || 0;
            if (b = this._findSourceIndex(b),
            b < 0)
                return [];
            if (E < 1)
                throw new Error("Line numbers must be >= 1");
            if (A < 0)
                throw new Error("Column numbers must be >= 0");
            const N = [];
            return this._wasm.withMappingCallback(D => {
                let k = D.lastGeneratedColumn;
                this._computedColumnSpans && k === null && (k = 1 / 0),
                N.push({
                    line: D.generatedLine,
                    column: D.generatedColumn,
                    lastColumn: k
                })
            }
            , () => {
                this._wasm.exports.all_generated_locations_for(this._getMappingsPtr(), b, E - 1, "column"in w, A)
            }
            ),
            N
        }
        destroy() {
            this._mappingsPtr !== 0 && (this._wasm.exports.free_mappings(this._mappingsPtr),
            this._mappingsPtr = 0)
        }
        computeColumnSpans() {
            this._computedColumnSpans || (this._wasm.exports.compute_column_spans(this._getMappingsPtr()),
            this._computedColumnSpans = !0)
        }
        originalPositionFor(w) {
            const b = {
                generatedLine: i.getArg(w, "line"),
                generatedColumn: i.getArg(w, "column")
            };
            if (b.generatedLine < 1)
                throw new Error("Line numbers must be >= 1");
            if (b.generatedColumn < 0)
                throw new Error("Column numbers must be >= 0");
            let E = i.getArg(w, "bias", d.GREATEST_LOWER_BOUND);
            E == null && (E = d.GREATEST_LOWER_BOUND);
            let A;
            if (this._wasm.withMappingCallback(N => A = N, () => {
                this._wasm.exports.original_location_for(this._getMappingsPtr(), b.generatedLine - 1, b.generatedColumn, E)
            }
            ),
            A && A.generatedLine === b.generatedLine) {
                let N = i.getArg(A, "source", null);
                N !== null && (N = this._absoluteSources.at(N));
                let D = i.getArg(A, "name", null);
                return D !== null && (D = this._names.at(D)),
                {
                    source: N,
                    line: i.getArg(A, "originalLine", null),
                    column: i.getArg(A, "originalColumn", null),
                    name: D
                }
            }
            return {
                source: null,
                line: null,
                column: null,
                name: null
            }
        }
        hasContentsOfAllSources() {
            return this.sourcesContent ? this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(w) {
                return w == null
            }) : !1
        }
        sourceContentFor(w, b) {
            if (!this.sourcesContent)
                return null;
            const E = this._findSourceIndex(w);
            if (E >= 0)
                return this.sourcesContent[E];
            if (b)
                return null;
            throw new Error('"' + w + '" is not in the SourceMap.')
        }
        generatedPositionFor(w) {
            let b = i.getArg(w, "source");
            if (b = this._findSourceIndex(b),
            b < 0)
                return {
                    line: null,
                    column: null,
                    lastColumn: null
                };
            const E = {
                source: b,
                originalLine: i.getArg(w, "line"),
                originalColumn: i.getArg(w, "column")
            };
            if (E.originalLine < 1)
                throw new Error("Line numbers must be >= 1");
            if (E.originalColumn < 0)
                throw new Error("Column numbers must be >= 0");
            let A = i.getArg(w, "bias", d.GREATEST_LOWER_BOUND);
            A == null && (A = d.GREATEST_LOWER_BOUND);
            let N;
            if (this._wasm.withMappingCallback(D => N = D, () => {
                this._wasm.exports.generated_location_for(this._getMappingsPtr(), E.source, E.originalLine - 1, E.originalColumn, A)
            }
            ),
            N && N.source === E.source) {
                let D = N.lastGeneratedColumn;
                return this._computedColumnSpans && D === null && (D = 1 / 0),
                {
                    line: i.getArg(N, "generatedLine", null),
                    column: i.getArg(N, "generatedColumn", null),
                    lastColumn: D
                }
            }
            return {
                line: null,
                column: null,
                lastColumn: null
            }
        }
    }
    m.prototype.consumer = d,
    Yl.BasicSourceMapConsumer = m;
    class p extends d {
        constructor(w, b) {
            return super(f).then(E => {
                let A = w;
                typeof w == "string" && (A = i.parseSourceMapInput(w));
                const N = i.getArg(A, "version")
                  , D = i.getArg(A, "sections");
                if (N != E._version)
                    throw new Error("Unsupported version: " + N);
                let k = {
                    line: -1,
                    column: 0
                };
                return Promise.all(D.map(G => {
                    if (G.url)
                        throw new Error("Support for url field in sections not implemented.");
                    const $ = i.getArg(G, "offset")
                      , W = i.getArg($, "line")
                      , J = i.getArg($, "column");
                    if (W < k.line || W === k.line && J < k.column)
                        throw new Error("Section offsets must be ordered and non-overlapping.");
                    return k = $,
                    new d(i.getArg(G, "map"),b).then(ie => ({
                        generatedOffset: {
                            generatedLine: W + 1,
                            generatedColumn: J + 1
                        },
                        consumer: ie
                    }))
                }
                )).then(G => (E._sections = G,
                E))
            }
            )
        }
        get sources() {
            const w = [];
            for (let b = 0; b < this._sections.length; b++)
                for (let E = 0; E < this._sections[b].consumer.sources.length; E++)
                    w.push(this._sections[b].consumer.sources[E]);
            return w
        }
        originalPositionFor(w) {
            const b = {
                generatedLine: i.getArg(w, "line"),
                generatedColumn: i.getArg(w, "column")
            }
              , E = l.search(b, this._sections, function(N, D) {
                const k = N.generatedLine - D.generatedOffset.generatedLine;
                return k || N.generatedColumn - (D.generatedOffset.generatedColumn - 1)
            })
              , A = this._sections[E];
            return A ? A.consumer.originalPositionFor({
                line: b.generatedLine - (A.generatedOffset.generatedLine - 1),
                column: b.generatedColumn - (A.generatedOffset.generatedLine === b.generatedLine ? A.generatedOffset.generatedColumn - 1 : 0),
                bias: w.bias
            }) : {
                source: null,
                line: null,
                column: null,
                name: null
            }
        }
        hasContentsOfAllSources() {
            return this._sections.every(function(w) {
                return w.consumer.hasContentsOfAllSources()
            })
        }
        sourceContentFor(w, b) {
            for (let E = 0; E < this._sections.length; E++) {
                const N = this._sections[E].consumer.sourceContentFor(w, !0);
                if (N)
                    return N
            }
            if (b)
                return null;
            throw new Error('"' + w + '" is not in the SourceMap.')
        }
        _findSectionIndex(w) {
            for (let b = 0; b < this._sections.length; b++) {
                const {consumer: E} = this._sections[b];
                if (E._findSourceIndex(w) !== -1)
                    return b
            }
            return -1
        }
        generatedPositionFor(w) {
            const b = this._findSectionIndex(i.getArg(w, "source"))
              , E = b >= 0 ? this._sections[b] : null
              , A = b >= 0 && b + 1 < this._sections.length ? this._sections[b + 1] : null
              , N = E && E.consumer.generatedPositionFor(w);
            if (N && N.line !== null) {
                const D = E.generatedOffset.generatedLine - 1
                  , k = E.generatedOffset.generatedColumn - 1;
                return N.line === 1 && (N.column += k,
                typeof N.lastColumn == "number" && (N.lastColumn += k)),
                N.lastColumn === 1 / 0 && A && N.line === A.generatedOffset.generatedLine && (N.lastColumn = A.generatedOffset.generatedColumn - 2),
                N.line += D,
                N
            }
            return {
                line: null,
                column: null,
                lastColumn: null
            }
        }
        allGeneratedPositionsFor(w) {
            const b = this._findSectionIndex(i.getArg(w, "source"))
              , E = b >= 0 ? this._sections[b] : null
              , A = b >= 0 && b + 1 < this._sections.length ? this._sections[b + 1] : null;
            return E ? E.consumer.allGeneratedPositionsFor(w).map(N => {
                const D = E.generatedOffset.generatedLine - 1
                  , k = E.generatedOffset.generatedColumn - 1;
                return N.line === 1 && (N.column += k,
                typeof N.lastColumn == "number" && (N.lastColumn += k)),
                N.lastColumn === 1 / 0 && A && N.line === A.generatedOffset.generatedLine && (N.lastColumn = A.generatedOffset.generatedColumn - 2),
                N.line += D,
                N
            }
            ) : []
        }
        eachMapping(w, b, E) {
            this._sections.forEach( (A, N) => {
                const D = N + 1 < this._sections.length ? this._sections[N + 1] : null
                  , {generatedOffset: k} = A
                  , G = k.generatedLine - 1
                  , $ = k.generatedColumn - 1;
                A.consumer.eachMapping(function(W) {
                    W.generatedLine === 1 && (W.generatedColumn += $,
                    typeof W.lastGeneratedColumn == "number" && (W.lastGeneratedColumn += $)),
                    W.lastGeneratedColumn === 1 / 0 && D && W.generatedLine === D.generatedOffset.generatedLine && (W.lastGeneratedColumn = D.generatedOffset.generatedColumn - 2),
                    W.generatedLine += G,
                    w.call(this, W)
                }, b, E)
            }
            )
        }
        computeColumnSpans() {
            for (let w = 0; w < this._sections.length; w++)
                this._sections[w].consumer.computeColumnSpans()
        }
        destroy() {
            for (let w = 0; w < this._sections.length; w++)
                this._sections[w].consumer.destroy()
        }
    }
    Yl.IndexedSourceMapConsumer = p;
    function y(v, w) {
        let b = v;
        typeof v == "string" && (b = i.parseSourceMapInput(v));
        const E = b.sections != null ? new p(b,w) : new m(b,w);
        return Promise.resolve(E)
    }
    function S(v, w) {
        return m.fromSourceMap(v, w)
    }
    return Yl
}
var gu = {}, ym;
function ox() {
    if (ym)
        return gu;
    ym = 1;
    const i = zg().SourceMapGenerator
      , l = Us()
      , r = /(\r?\n)/
      , o = 10
      , c = "$$$isSourceNode$$$";
    class f {
        constructor(m, p, y, S, v) {
            this.children = [],
            this.sourceContents = {},
            this.line = m ?? null,
            this.column = p ?? null,
            this.source = y ?? null,
            this.name = v ?? null,
            this[c] = !0,
            S != null && this.add(S)
        }
        static fromStringWithSourceMap(m, p, y) {
            const S = new f
              , v = m.split(r);
            let w = 0;
            const b = function() {
                const G = W()
                  , $ = W() || "";
                return G + $;
                function W() {
                    return w < v.length ? v[w++] : void 0
                }
            };
            let E = 1, A = 0, N = null, D;
            return p.eachMapping(function(G) {
                if (N !== null)
                    if (E < G.generatedLine)
                        k(N, b()),
                        E++,
                        A = 0;
                    else {
                        D = v[w] || "";
                        const $ = D.substr(0, G.generatedColumn - A);
                        v[w] = D.substr(G.generatedColumn - A),
                        A = G.generatedColumn,
                        k(N, $),
                        N = G;
                        return
                    }
                for (; E < G.generatedLine; )
                    S.add(b()),
                    E++;
                A < G.generatedColumn && (D = v[w] || "",
                S.add(D.substr(0, G.generatedColumn)),
                v[w] = D.substr(G.generatedColumn),
                A = G.generatedColumn),
                N = G
            }, this),
            w < v.length && (N && k(N, b()),
            S.add(v.splice(w).join(""))),
            p.sources.forEach(function(G) {
                const $ = p.sourceContentFor(G);
                $ != null && (y != null && (G = l.join(y, G)),
                S.setSourceContent(G, $))
            }),
            S;
            function k(G, $) {
                if (G === null || G.source === void 0)
                    S.add($);
                else {
                    const W = y ? l.join(y, G.source) : G.source;
                    S.add(new f(G.originalLine,G.originalColumn,W,$,G.name))
                }
            }
        }
        add(m) {
            if (Array.isArray(m))
                m.forEach(function(p) {
                    this.add(p)
                }, this);
            else if (m[c] || typeof m == "string")
                m && this.children.push(m);
            else
                throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + m);
            return this
        }
        prepend(m) {
            if (Array.isArray(m))
                for (let p = m.length - 1; p >= 0; p--)
                    this.prepend(m[p]);
            else if (m[c] || typeof m == "string")
                this.children.unshift(m);
            else
                throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + m);
            return this
        }
        walk(m) {
            let p;
            for (let y = 0, S = this.children.length; y < S; y++)
                p = this.children[y],
                p[c] ? p.walk(m) : p !== "" && m(p, {
                    source: this.source,
                    line: this.line,
                    column: this.column,
                    name: this.name
                })
        }
        join(m) {
            let p, y;
            const S = this.children.length;
            if (S > 0) {
                for (p = [],
                y = 0; y < S - 1; y++)
                    p.push(this.children[y]),
                    p.push(m);
                p.push(this.children[y]),
                this.children = p
            }
            return this
        }
        replaceRight(m, p) {
            const y = this.children[this.children.length - 1];
            return y[c] ? y.replaceRight(m, p) : typeof y == "string" ? this.children[this.children.length - 1] = y.replace(m, p) : this.children.push("".replace(m, p)),
            this
        }
        setSourceContent(m, p) {
            this.sourceContents[l.toSetString(m)] = p
        }
        walkSourceContents(m) {
            for (let y = 0, S = this.children.length; y < S; y++)
                this.children[y][c] && this.children[y].walkSourceContents(m);
            const p = Object.keys(this.sourceContents);
            for (let y = 0, S = p.length; y < S; y++)
                m(l.fromSetString(p[y]), this.sourceContents[p[y]])
        }
        toString() {
            let m = "";
            return this.walk(function(p) {
                m += p
            }),
            m
        }
        toStringWithSourceMap(m) {
            const p = {
                code: "",
                line: 1,
                column: 0
            }
              , y = new i(m);
            let S = !1
              , v = null
              , w = null
              , b = null
              , E = null;
            return this.walk(function(A, N) {
                p.code += A,
                N.source !== null && N.line !== null && N.column !== null ? ((v !== N.source || w !== N.line || b !== N.column || E !== N.name) && y.addMapping({
                    source: N.source,
                    original: {
                        line: N.line,
                        column: N.column
                    },
                    generated: {
                        line: p.line,
                        column: p.column
                    },
                    name: N.name
                }),
                v = N.source,
                w = N.line,
                b = N.column,
                E = N.name,
                S = !0) : S && (y.addMapping({
                    generated: {
                        line: p.line,
                        column: p.column
                    }
                }),
                v = null,
                S = !1);
                for (let D = 0, k = A.length; D < k; D++)
                    A.charCodeAt(D) === o ? (p.line++,
                    p.column = 0,
                    D + 1 === k ? (v = null,
                    S = !1) : S && y.addMapping({
                        source: N.source,
                        original: {
                            line: N.line,
                            column: N.column
                        },
                        generated: {
                            line: p.line,
                            column: p.column
                        },
                        name: N.name
                    })) : p.column++
            }),
            this.walkSourceContents(function(A, N) {
                y.setSourceContent(A, N)
            }),
            {
                code: p.code,
                map: y
            }
        }
    }
    return gu.SourceNode = f,
    gu
}
var xm;
function ux() {
    return xm || (xm = 1,
    Gl.SourceMapGenerator = zg().SourceMapGenerator,
    Gl.SourceMapConsumer = rx().SourceMapConsumer,
    Gl.SourceNode = ox().SourceNode),
    Gl
}
var Mu = ux();
function cx(i, l, r) {
    const o = i[l];
    if (!o)
        return {
            lineIndex: l,
            column: r
        };
    const c = o.trim()
      , f = /^<\/[A-Za-z][A-Za-z0-9\-_.]*\s*>$/.test(c)
      , d = /<\/[A-Za-z][A-Za-z0-9\-_.]*\s*>$/.test(c);
    let m = !1;
    if (r != null) {
        const p = o.substring(0, r);
        m = /<\/[A-Za-z][A-Za-z0-9\-_.]*\s*>$/.test(p)
    }
    if (f || d || m) {
        if (r != null) {
            const p = o.substring(r)
              , y = p.match(/<([A-Za-z][A-Za-z0-9\-_.]*)/);
            if (y && p[y.index + 1] !== "/")
                return {
                    lineIndex: l,
                    column: r + y.index + 1
                }
        }
        for (let p = l + 1; p < i.length && p < l + 50; p++) {
            const y = i[p]
              , S = y.match(/<([A-Za-z][A-Za-z0-9\-_.]*)/);
            if (S && y[S.index + 1] !== "/")
                return {
                    lineIndex: p,
                    column: S.index + 1
                }
        }
    }
    return {
        lineIndex: l,
        column: r
    }
}
function Yu(i, l, r) {
    let o = 0;
    for (let c = l; c < i.length; c++) {
        const f = i[c]
          , d = c === l ? r : 0;
        for (let m = d; m < f.length; m++) {
            const p = f[m];
            if (p === "{")
                o++;
            else if (p === "}")
                o--;
            else if (o === 0) {
                if (p === "/" && f[m + 1] === ">")
                    return {
                        lineIndex: c,
                        columnEnd: m + 2,
                        isSelfClosing: !0
                    };
                if (p === ">")
                    return {
                        lineIndex: c,
                        columnEnd: m + 1,
                        isSelfClosing: !1
                    }
            }
        }
    }
}
function Hg(i, l, r, o) {
    let c = 1;
    const f = new RegExp(`<${l}(?=\\s|>|/>)`,"g")
      , d = new RegExp(`</${l}\\s*>`,"g");
    for (let m = r; m < i.length; m++) {
        const p = m === r ? o : 0
          , y = i[m].substring(p)
          , S = [];
        let v;
        for (f.lastIndex = 0; (v = f.exec(y)) !== null; ) {
            const w = Yu([y], 0, v.index + v[0].length);
            w && !w.isSelfClosing && S.push({
                type: "open",
                index: v.index,
                length: v[0].length
            })
        }
        for (d.lastIndex = 0; (v = d.exec(y)) !== null; )
            S.push({
                type: "close",
                index: v.index,
                length: v[0].length
            });
        S.sort( (w, b) => w.index - b.index);
        for (const w of S)
            if (w.type === "open")
                c++;
            else if (w.type === "close" && (c--,
            c === 0))
                return {
                    lineIndex: m,
                    columnEnd: p + w.index + w.length
                }
    }
}
function vm(i, l, r) {
    let o;
    for (let c = l; c >= 0; c--) {
        const f = i[c]
          , d = /<([A-Za-z][A-Za-z0-9\-_.]*)/g;
        let m;
        for (; (m = d.exec(f)) !== null; ) {
            const p = m.index
              , y = m[1];
            if (f[p + 1] === "/" || !(c < l || c === l && p <= (r ?? f.length)))
                continue;
            const v = p + m[0].length
              , w = Yu(i, c, v);
            if (!w)
                continue;
            let b = c
              , E = w.columnEnd;
            if (!w.isSelfClosing) {
                const N = Hg(i, y, c, w.columnEnd);
                if (!N)
                    continue;
                b = N.lineIndex,
                E = N.columnEnd
            }
            (c < l || c === l && p <= (r ?? f.length)) && (b > l || b === l && E >= (r ?? 0)) && (!o || b - c < o.closeLineIndex - o.lineIndex || b - c === o.closeLineIndex - o.lineIndex && E - p < o.closeColumnEnd - o.columnStart) && (o = {
                tagName: y,
                lineIndex: c,
                columnStart: p,
                columnEnd: w.columnEnd,
                isSelfClosing: w.isSelfClosing,
                closeLineIndex: b,
                closeColumnEnd: E
            })
        }
    }
    return o
}
function fx(i, l, r) {
    const o = new RegExp(`<(${r})(?=\\s|>|/>)`,"i");
    for (let c = l + 1; c < i.length && c < l + 50; c++) {
        const f = i[c]
          , d = o.exec(f);
        if (d) {
            const m = d.index
              , p = d[1]
              , y = m + d[0].length
              , S = Yu(i, c, y);
            if (!S)
                continue;
            let v = c
              , w = S.columnEnd;
            if (!S.isSelfClosing) {
                const b = Hg(i, p, c, S.columnEnd);
                if (!b)
                    continue;
                v = b.lineIndex,
                w = b.columnEnd
            }
            return {
                tagName: p,
                lineIndex: c,
                columnStart: m,
                columnEnd: S.columnEnd,
                isSelfClosing: S.isSelfClosing,
                closeLineIndex: v,
                closeColumnEnd: w
            }
        }
    }
}
function dx(i, l, r, o, c) {
    if (l === o)
        return i[l].substring(r, c);
    let f = i[l].substring(r);
    for (let d = l + 1; d < o; d++)
        f += `
` + i[d];
    return f += `
` + i[o].substring(0, c),
    f
}
function hx(i, l, r=10) {
    const o = i.split(`
`)
      , c = Math.max(0, l - r - 1)
      , f = Math.min(o.length - 1, l + r - 1)
      , d = [];
    for (let m = c; m <= f; m++) {
        const p = m + 1
          , v = `${p === l ? ">>>" : "   "} ${p.toString().padStart(4, " ")} | ${o[m] || ""}`;
        d.push(v)
    }
    return d.join(`
`)
}
async function mx(i) {
    try {
        const l = await fetch(i);
        if (!l.ok)
            throw new Error(`Failed to load source map: ${l.status}`);
        return await l.json()
    } catch (l) {
        const r = l instanceof Error ? l.message : String(l);
        console.warn("Error loading source map from", i, r)
    }
}
let pu = !1;
const Qa = new Map
  , gx = 300 * 1e3
  , px = 1e3;
setInterval( () => {
    const i = Date.now();
    for (const [l,r] of Qa.entries())
        i - r.timestamp > gx && Qa.delete(l)
}
, 6e4);
async function yx() {
    if (!pu)
        try {
            await Mu.SourceMapConsumer.initialize({
                "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.6/lib/mappings.wasm"
            }),
            pu = !0
        } catch (i) {
            console.warn("Failed to initialize SourceMapConsumer:", i);
            try {
                await Mu.SourceMapConsumer.initialize({}),
                pu = !0
            } catch (l) {
                throw console.error("SourceMapConsumer initialization failed completely:", l),
                l
            }
        }
}
function xx(i) {
    if (!i || !i.stack)
        return `no-stack-${i?.message || "unknown"}`;
    const o = i.stack.split(`
`).slice(0, 6).map(c => c.replace(/\?t=\d+/g, "").replace(/\?v=[\w\d]+/g, "").replace(/\d{13,}/g, "TIMESTAMP"));
    return `${i.name || "Error"}-${i.message}-${o.join("|")}`
}
const vx = "preview-inject/";
async function Kl(i, l=10, r) {
    if (!i || !i.stack)
        return {
            errorMessage: i?.message || "",
            mappedStack: i?.stack || "",
            sourceContext: []
        };
    const o = xx(i);
    if (Qa.has(o)) {
        const v = Qa.get(o);
        return console.log("Using cached error mapping for:", o),
        v
    }
    if (Qa.size >= px)
        return null;
    await yx();
    const c = i.stack.split(`
`)
      , f = []
      , d = []
      , m = new Map
      , p = new Map;
    let y = 0;
    for (const v of c) {
        const w = v.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)|at\s+(.+?):(\d+):(\d+)|([^@]*)@(.+?):(\d+):(\d+)/);
        if (!w) {
            f.push(v);
            continue
        }
        let b, E, A, N;
        w[1] ? (b = w[1],
        E = w[2],
        A = parseInt(w[3]),
        N = parseInt(w[4])) : w[5] ? (b = "<anonymous>",
        E = w[5],
        A = parseInt(w[6]),
        N = parseInt(w[7])) : (b = w[8],
        E = w[9],
        A = parseInt(w[10]),
        N = parseInt(w[11]));
        try {
            const D = `${E}.map`;
            let k = m.get(D);
            if (!k) {
                const $ = await mx(D);
                k = await new Mu.SourceMapConsumer($),
                m.set(D, k)
            }
            const G = k.originalPositionFor({
                line: A,
                column: N
            });
            if (G.source) {
                if (G.source.includes(vx))
                    continue;
                const $ = G.source.split("/").filter(Z => Z !== "..").join("/")
                  , J = `    at ${G.name || b} (${$}:${G.line}:${G.column})`;
                if (f.push(J),
                G.line && G.column && y < l) {
                    y++;
                    try {
                        const Z = await bx(k, G.source, p);
                        if (Z) {
                            const ie = $.includes("node_modules")
                              , we = /\.(tsx|jsx)$/.test($);
                            let V;
                            if (!ie && we) {
                                const F = Sx(Z, G.line, G.column, r);
                                F && (V = {
                                    tagName: F.tagName,
                                    code: F.code,
                                    context: F.context,
                                    startLine: F.startLine,
                                    endLine: F.endLine
                                })
                            }
                            const Q = hx(Z, G.line, ie ? 1 : 10);
                            d.push({
                                file: $,
                                line: G.line,
                                column: G.column,
                                context: Q,
                                closedBlock: V
                            })
                        }
                    } catch (Z) {
                        console.warn("Failed to extract source context:", Z)
                    }
                }
            } else
                f.push(v)
        } catch (D) {
            console.warn("Failed to map stack line:", v, D),
            f.push(v)
        }
    }
    for (const v of m.values())
        v.destroy();
    const S = {
        errorMessage: i?.message || "",
        mappedStack: f.join(`
`),
        sourceContext: d
    };
    return S.timestamp = Date.now(),
    Qa.set(o, S),
    S
}
async function bx(i, l, r) {
    if (r.has(l))
        return r.get(l) || null;
    const o = i.sourceContentFor(l);
    return o ? (r.set(l, o),
    o) : null
}
function Sx(i, l, r, o) {
    const c = i.split(`
`);
    let f = l - 1;
    if (f < 0 || f >= c.length)
        return;
    let d = vm(c, f, r);
    if (o && d) {
        const b = o.toLowerCase()
          , E = d.tagName.toLowerCase();
        if (b !== E) {
            const A = fx(c, f, b);
            A && (d = A)
        }
    } else if (!d) {
        const b = cx(c, f, r);
        d = vm(c, b.lineIndex, b.column)
    }
    if (!d)
        return;
    const {tagName: m, lineIndex: p, columnStart: y, closeLineIndex: S, closeColumnEnd: v, isSelfClosing: w} = d;
    return {
        tagName: m,
        code: dx(c, p, y, S, v),
        context: c.slice(p, S + 1).join(`
`),
        startLine: p + 1,
        endLine: S + 1,
        isSelfClosing: w
    }
}
class wx {
    client;
    originalConsoleError;
    constructor() {
        const l = Gy();
        l.length > 0 && l.forEach(r => {
            r.type === "console.error" ? this.handleConsoleError(r.args) : r.type === "runtime" && this.handleError(r.args)
        }
        ),
        this.client = new Za(window.parent),
        this.originalConsoleError = console.error,
        this.initErrorHandlers()
    }
    initErrorHandlers() {
        window.addEventListener("error", this.handleError.bind(this)),
        window.addEventListener("unhandledrejection", this.handlePromiseRejection.bind(this)),
        this.interceptConsoleError()
    }
    async handleError(l) {
        const r = l.target;
        if (!(r && r instanceof HTMLElement && r.tagName && ["IMG", "SCRIPT", "LINK", "VIDEO", "AUDIO", "SOURCE", "IFRAME"].includes(r.tagName)) && l.error && l.error.stack)
            try {
                const o = await Kl(l.error);
                this.sendError(o)
            } catch (o) {
                console.warn("Failed to map error stack:", o)
            }
    }
    async handlePromiseRejection(l) {
        const r = l.reason instanceof Error ? l.reason : new Error(String(l.reason));
        if (r.stack)
            try {
                const o = await Kl(r);
                this.sendError(o)
            } catch (o) {
                console.warn("Failed to map promise rejection stack:", o)
            }
    }
    interceptConsoleError() {
        console.error = (...l) => {
            this.originalConsoleError.apply(console, l);
            const r = l.find(o => o instanceof Error);
            if (r && r.stack)
                this.handleConsoleError(r);
            else if (l.length > 0) {
                const o = l.map(f => typeof f == "object" ? JSON.stringify(f) : String(f)).join(" ")
                  , c = new Error(o);
                this.handleConsoleError(c)
            }
        }
    }
    async handleConsoleError(l) {
        try {
            const r = await Kl(l);
            this.sendError(r)
        } catch (r) {
            console.warn("Failed to map console error stack:", r)
        }
    }
    reportError(l) {
        this.handleReactError(l)
    }
    async handleReactError(l) {
        try {
            const r = await Kl(l);
            this.sendError(r)
        } catch (r) {
            console.warn("Failed to map React error stack:", r)
        }
    }
    async sendError(l) {
        if (!l) {
            console.warn("error is too many");
            return
        }
        if (l.sourceContext.length !== 0)
            try {
                await this.client.post("runtime-error", l)
            } catch (r) {
                console.warn("Failed to send error to parent:", r)
            }
    }
    destroy() {
        console.error = this.originalConsoleError,
        this.client.destroy()
    }
}
function Ex() {
    const i = new wx;
    return window.runtimeErrorCollector = i,
    i
}
class Nx {
    _client;
    constructor() {
        this._client = new Za(window.parent),
        this._domContentLoadedListener()
    }
    _domContentLoadedListener() {
        const l = () => {
            console.log("DOMContentLoaded"),
            this._client.post("DOMContentLoaded"),
            document.removeEventListener("DOMContentLoaded", l)
        }
        ;
        document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", l) : (console.log("DOMContentLoaded"),
        this._client.post("DOMContentLoaded"))
    }
}
function Cx() {
    return new Nx
}
const Vu = i => {
    const l = "/preview/1cc2edc0-ff54-4d53-b605-fd14dff6b00e/7632986";
    return i.startsWith(l) ? i.replaceAll(l, "") || "/" : i || "/"
}
  , _x = "modulepreload"
  , jx = function(i) {
    return "/preview/1cc2edc0-ff54-4d53-b605-fd14dff6b00e/7632986/" + i
}
  , bm = {}
  , Bg = function(l, r, o) {
    let c = Promise.resolve();
    if (r && r.length > 0) {
        let y = function(S) {
            return Promise.all(S.map(v => Promise.resolve(v).then(w => ({
                status: "fulfilled",
                value: w
            }), w => ({
                status: "rejected",
                reason: w
            }))))
        };
        var d = y;
        document.getElementsByTagName("link");
        const m = document.querySelector("meta[property=csp-nonce]")
          , p = m?.nonce || m?.getAttribute("nonce");
        c = y(r.map(S => {
            if (S = jx(S),
            S in bm)
                return;
            bm[S] = !0;
            const v = S.endsWith(".css")
              , w = v ? '[rel="stylesheet"]' : "";
            if (document.querySelector(`link[href="${S}"]${w}`))
                return;
            const b = document.createElement("link");
            if (b.rel = v ? "stylesheet" : _x,
            v || (b.as = "script"),
            b.crossOrigin = "",
            b.href = S,
            p && b.setAttribute("nonce", p),
            document.head.appendChild(b),
            v)
                return new Promise( (E, A) => {
                    b.addEventListener("load", E),
                    b.addEventListener("error", () => A(new Error(`Unable to preload CSS for ${S}`)))
                }
                )
        }
        ))
    }
    function f(m) {
        const p = new Event("vite:preloadError",{
            cancelable: !0
        });
        if (p.payload = m,
        window.dispatchEvent(p),
        !p.defaultPrevented)
            throw m
    }
    return c.then(m => {
        for (const p of m || [])
            p.status === "rejected" && f(p.reason);
        return l().catch(f)
    }
    )
};
async function Ax() {
    await await Bg( () => Promise.resolve().then( () => s2), []).then(l => l.navigatePromise).catch(l => (console.error(l),
    Promise.resolve( () => {}
    ))),
    window.REACT_APP_ROUTER = {
        push: (l, r) => {
            window.REACT_APP_NAVIGATE(l, r)
        }
        ,
        replace: (l, r, o) => {
            window.REACT_APP_NAVIGATE(l, {
                replace: !0,
                ...o
            })
        }
        ,
        forward: () => {
            window.REACT_APP_NAVIGATE(1)
        }
        ,
        back: () => {
            window.REACT_APP_NAVIGATE(-1)
        }
        ,
        refresh: () => {
            window.REACT_APP_NAVIGATE(0)
        }
        ,
        prefetch: (l, r) => {
            window.REACT_APP_NAVIGATE(l, r)
        }
    }
}
const qg = new Promise(i => {
    Ax().then( () => {
        i(window.REACT_APP_ROUTER)
    }
    )
}
)
  , Qu = () => window.REACT_APP_ROUTER
  , Xu = new Za(window.parent)
  , Du = async (i, l) => {
    await Xu.post("routeWillChange", {
        next: Vu(i)
    }, l)
}
;
function Tx(i) {
    const l = document.querySelector(i);
    l && l.scrollIntoView({
        behavior: "smooth"
    })
}
function Ox() {
    const i = window.open;
    return window.open = function(l, r, o) {
        return l && typeof l == "string" && l.startsWith("#") ? (Tx(l),
        null) : (i(l, "_blank", o),
        null)
    }
    ,
    () => {
        window.open = i
    }
}
function Rx() {
    const i = async l => {
        const o = l.target.closest("a");
        if (!o || o.tagName !== "A")
            return;
        const c = o.getAttribute("href");
        if (c && !["#", "javascript:void(0)", ""].includes(c) && !c.startsWith("#")) {
            if (l.preventDefault(),
            c.startsWith("/")) {
                const f = Qu();
                await Du(c, {
                    timeout: 500
                });
                const d = Vu(c);
                f.push(d);
                return
            }
            window.open(o.href, "_blank")
        }
    }
    ;
    return window.addEventListener("click", i, !0),
    () => {
        window.removeEventListener("click", i, !0)
    }
}
const Sm = i => i.startsWith("http://") || i.startsWith("https://");
function Mx(i) {
    return !i || typeof i != "string" ? !1 : i.indexOf("accounts.google.com") !== -1 || i.indexOf("googleapis.com/oauth") !== -1 || i.indexOf("/auth/") !== -1 && i.indexOf("provider=google") !== -1
}
function Dx() {
    const i = () => {
        const l = Qu()
          , r = l.push;
        l.push = async function(c, f, d) {
            return Sm(c) ? (window.open(c, "_blank"),
            Promise.resolve(!1)) : (await Du(c, {
                timeout: 500
            }),
            r.call(this, c, f, d))
        }
        ;
        const o = l.replace;
        l.replace = async function(c, f, d) {
            return Sm(c) ? (window.open(c, "_blank"),
            Promise.resolve(!1)) : (await Du(c, {
                timeout: 500
            }),
            o.call(this, c, f, d))
        }
    }
    ;
    return window.addEventListener("load", i),
    () => {
        window.removeEventListener("load", i)
    }
}
function Lx() {
    if (!("navigation"in window))
        return () => {}
        ;
    const i = l => {
        Mx(l.destination.url) && Xu.post("google-auth-blocked", {
            url: l.destination.url || ""
        })
    }
    ;
    return window.navigation.addEventListener("navigate", i),
    () => {
        window.navigation.removeEventListener("navigate", i)
    }
}
async function zx() {
    await qg;
    const i = Ox()
      , l = Rx()
      , r = Dx()
      , o = Lx();
    return () => {
        Xu.destroy(),
        i(),
        l(),
        r(),
        o()
    }
}
async function Ux() {
    const i = await Bg( () => Promise.resolve().then( () => l2), void 0).then(f => f.default).catch(f => []);
    let l = []
      , r = 0;
    function o(f, d) {
        const {path: m="", children: p, index: y} = f;
        r++;
        const S = y === !0 || m === ""
          , v = m && m[0] === "/"
          , w = S ? d.path : `${d.path}/${m}`
          , b = v && !S ? m : w
          , E = {
            id: r,
            parentId: d.id,
            path: "/" + b.split("/").filter(Boolean).join("/")
        };
        /\*/.test(E.path) || l.push(E),
        p && p.forEach(A => o(A, E))
    }
    i.forEach(f => o(f, {
        id: 0,
        path: ""
    }));
    const c = new Set;
    return l = l.filter(f => c.has(f.path) ? !1 : (c.add(f.path),
    !0)),
    l
}
async function Hx() {
    const i = new Za(window.parent)
      , l = await Ux();
    window.REACT_APP_ROUTES = l,
    i.post("routes", {
        routes: l
    }),
    i.on("getRouteInfo", async v => l),
    await qg,
    i.on("routeAction", async v => {
        const w = Qu()
          , {action: b, route: E} = v;
        switch (b) {
        case "goForward":
            w.forward();
            break;
        case "goBack":
            w.back();
            break;
        case "refresh":
            w.refresh();
            break;
        case "goTo":
            E && w.push(E);
            break;
        default:
            console.warn("Unknown action:", b)
        }
    }
    );
    function r() {
        const v = window.history.state?.index ?? 0
          , w = window.history.length > v + 1
          , b = v > 0
          , E = window.location.pathname;
        i.post("updateNavigationState", {
            canGoForward: w,
            canGoBack: b,
            currentRoute: Vu(E)
        })
    }
    function o() {
        const v = new MutationObserver(b => {
            b.forEach(E => {
                (E.type === "childList" || E.type === "characterData") && i.post("titleChanged", {
                    title: document.title
                })
            }
            )
        }
        )
          , w = document.querySelector("title");
        return i.post("titleChanged", {
            title: document.title
        }),
        w && v.observe(w, {
            childList: !0,
            characterData: !0,
            subtree: !0
        }),
        v
    }
    let c = o();
    function f() {
        c.disconnect(),
        setTimeout( () => {
            c = o()
        }
        , 100)
    }
    const d = window.history.pushState
      , m = window.history.replaceState
      , p = window.history.go
      , y = window.history.back
      , S = window.history.forward;
    return window.history.pushState = function(v, w, b) {
        d.apply(this, arguments),
        r(),
        f()
    }
    ,
    window.history.replaceState = function(v, w, b) {
        m.apply(this, arguments),
        r(),
        f()
    }
    ,
    window.history.go = function(v) {
        p.apply(this, arguments),
        setTimeout( () => {
            r(),
            f()
        }
        , 100)
    }
    ,
    window.history.back = function() {
        y.apply(this, arguments),
        setTimeout( () => {
            r(),
            f()
        }
        , 100)
    }
    ,
    window.history.forward = function() {
        S.apply(this, arguments),
        setTimeout( () => {
            r(),
            f()
        }
        , 100)
    }
    ,
    {
        destroy: () => {
            i.destroy(),
            c.disconnect()
        }
    }
}
var yu = {
    exports: {}
}
  , re = {};
var wm;
function Bx() {
    if (wm)
        return re;
    wm = 1;
    var i = Symbol.for("react.transitional.element")
      , l = Symbol.for("react.portal")
      , r = Symbol.for("react.fragment")
      , o = Symbol.for("react.strict_mode")
      , c = Symbol.for("react.profiler")
      , f = Symbol.for("react.consumer")
      , d = Symbol.for("react.context")
      , m = Symbol.for("react.forward_ref")
      , p = Symbol.for("react.suspense")
      , y = Symbol.for("react.memo")
      , S = Symbol.for("react.lazy")
      , v = Symbol.for("react.activity")
      , w = Symbol.iterator;
    function b(_) {
        return _ === null || typeof _ != "object" ? null : (_ = w && _[w] || _["@@iterator"],
        typeof _ == "function" ? _ : null)
    }
    var E = {
        isMounted: function() {
            return !1
        },
        enqueueForceUpdate: function() {},
        enqueueReplaceState: function() {},
        enqueueSetState: function() {}
    }
      , A = Object.assign
      , N = {};
    function D(_, B, K) {
        this.props = _,
        this.context = B,
        this.refs = N,
        this.updater = K || E
    }
    D.prototype.isReactComponent = {},
    D.prototype.setState = function(_, B) {
        if (typeof _ != "object" && typeof _ != "function" && _ != null)
            throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, _, B, "setState")
    }
    ,
    D.prototype.forceUpdate = function(_) {
        this.updater.enqueueForceUpdate(this, _, "forceUpdate")
    }
    ;
    function k() {}
    k.prototype = D.prototype;
    function G(_, B, K) {
        this.props = _,
        this.context = B,
        this.refs = N,
        this.updater = K || E
    }
    var $ = G.prototype = new k;
    $.constructor = G,
    A($, D.prototype),
    $.isPureReactComponent = !0;
    var W = Array.isArray;
    function J() {}
    var Z = {
        H: null,
        A: null,
        T: null,
        S: null
    }
      , ie = Object.prototype.hasOwnProperty;
    function we(_, B, K) {
        var I = K.ref;
        return {
            $$typeof: i,
            type: _,
            key: B,
            ref: I !== void 0 ? I : null,
            props: K
        }
    }
    function V(_, B) {
        return we(_.type, B, _.props)
    }
    function Q(_) {
        return typeof _ == "object" && _ !== null && _.$$typeof === i
    }
    function F(_) {
        var B = {
            "=": "=0",
            ":": "=2"
        };
        return "$" + _.replace(/[=:]/g, function(K) {
            return B[K]
        })
    }
    var ae = /\/+/g;
    function ce(_, B) {
        return typeof _ == "object" && _ !== null && _.key != null ? F("" + _.key) : B.toString(36)
    }
    function de(_) {
        switch (_.status) {
        case "fulfilled":
            return _.value;
        case "rejected":
            throw _.reason;
        default:
            switch (typeof _.status == "string" ? _.then(J, J) : (_.status = "pending",
            _.then(function(B) {
                _.status === "pending" && (_.status = "fulfilled",
                _.value = B)
            }, function(B) {
                _.status === "pending" && (_.status = "rejected",
                _.reason = B)
            })),
            _.status) {
            case "fulfilled":
                return _.value;
            case "rejected":
                throw _.reason
            }
        }
        throw _
    }
    function z(_, B, K, I, oe) {
        var he = typeof _;
        (he === "undefined" || he === "boolean") && (_ = null);
        var Ce = !1;
        if (_ === null)
            Ce = !0;
        else
            switch (he) {
            case "bigint":
            case "string":
            case "number":
                Ce = !0;
                break;
            case "object":
                switch (_.$$typeof) {
                case i:
                case l:
                    Ce = !0;
                    break;
                case S:
                    return Ce = _._init,
                    z(Ce(_._payload), B, K, I, oe)
                }
            }
        if (Ce)
            return oe = oe(_),
            Ce = I === "" ? "." + ce(_, 0) : I,
            W(oe) ? (K = "",
            Ce != null && (K = Ce.replace(ae, "$&/") + "/"),
            z(oe, B, K, "", function(Fa) {
                return Fa
            })) : oe != null && (Q(oe) && (oe = V(oe, K + (oe.key == null || _ && _.key === oe.key ? "" : ("" + oe.key).replace(ae, "$&/") + "/") + Ce)),
            B.push(oe)),
            1;
        Ce = 0;
        var at = I === "" ? "." : I + ":";
        if (W(_))
            for (var Be = 0; Be < _.length; Be++)
                I = _[Be],
                he = at + ce(I, Be),
                Ce += z(I, B, K, he, oe);
        else if (Be = b(_),
        typeof Be == "function")
            for (_ = Be.call(_),
            Be = 0; !(I = _.next()).done; )
                I = I.value,
                he = at + ce(I, Be++),
                Ce += z(I, B, K, he, oe);
        else if (he === "object") {
            if (typeof _.then == "function")
                return z(de(_), B, K, I, oe);
            throw B = String(_),
            Error("Objects are not valid as a React child (found: " + (B === "[object Object]" ? "object with keys {" + Object.keys(_).join(", ") + "}" : B) + "). If you meant to render a collection of children, use an array instead.")
        }
        return Ce
    }
    function X(_, B, K) {
        if (_ == null)
            return _;
        var I = []
          , oe = 0;
        return z(_, I, "", "", function(he) {
            return B.call(K, he, oe++)
        }),
        I
    }
    function ne(_) {
        if (_._status === -1) {
            var B = _._result;
            B = B(),
            B.then(function(K) {
                (_._status === 0 || _._status === -1) && (_._status = 1,
                _._result = K)
            }, function(K) {
                (_._status === 0 || _._status === -1) && (_._status = 2,
                _._result = K)
            }),
            _._status === -1 && (_._status = 0,
            _._result = B)
        }
        if (_._status === 1)
            return _._result.default;
        throw _._result
    }
    var ve = typeof reportError == "function" ? reportError : function(_) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var B = new window.ErrorEvent("error",{
                bubbles: !0,
                cancelable: !0,
                message: typeof _ == "object" && _ !== null && typeof _.message == "string" ? String(_.message) : String(_),
                error: _
            });
            if (!window.dispatchEvent(B))
                return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", _);
            return
        }
        console.error(_)
    }
      , Ne = {
        map: X,
        forEach: function(_, B, K) {
            X(_, function() {
                B.apply(this, arguments)
            }, K)
        },
        count: function(_) {
            var B = 0;
            return X(_, function() {
                B++
            }),
            B
        },
        toArray: function(_) {
            return X(_, function(B) {
                return B
            }) || []
        },
        only: function(_) {
            if (!Q(_))
                throw Error("React.Children.only expected to receive a single React element child.");
            return _
        }
    };
    return re.Activity = v,
    re.Children = Ne,
    re.Component = D,
    re.Fragment = r,
    re.Profiler = c,
    re.PureComponent = G,
    re.StrictMode = o,
    re.Suspense = p,
    re.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Z,
    re.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function(_) {
            return Z.H.useMemoCache(_)
        }
    },
    re.cache = function(_) {
        return function() {
            return _.apply(null, arguments)
        }
    }
    ,
    re.cacheSignal = function() {
        return null
    }
    ,
    re.cloneElement = function(_, B, K) {
        if (_ == null)
            throw Error("The argument must be a React element, but you passed " + _ + ".");
        var I = A({}, _.props)
          , oe = _.key;
        if (B != null)
            for (he in B.key !== void 0 && (oe = "" + B.key),
            B)
                !ie.call(B, he) || he === "key" || he === "__self" || he === "__source" || he === "ref" && B.ref === void 0 || (I[he] = B[he]);
        var he = arguments.length - 2;
        if (he === 1)
            I.children = K;
        else if (1 < he) {
            for (var Ce = Array(he), at = 0; at < he; at++)
                Ce[at] = arguments[at + 2];
            I.children = Ce
        }
        return we(_.type, oe, I)
    }
    ,
    re.createContext = function(_) {
        return _ = {
            $$typeof: d,
            _currentValue: _,
            _currentValue2: _,
            _threadCount: 0,
            Provider: null,
            Consumer: null
        },
        _.Provider = _,
        _.Consumer = {
            $$typeof: f,
            _context: _
        },
        _
    }
    ,
    re.createElement = function(_, B, K) {
        var I, oe = {}, he = null;
        if (B != null)
            for (I in B.key !== void 0 && (he = "" + B.key),
            B)
                ie.call(B, I) && I !== "key" && I !== "__self" && I !== "__source" && (oe[I] = B[I]);
        var Ce = arguments.length - 2;
        if (Ce === 1)
            oe.children = K;
        else if (1 < Ce) {
            for (var at = Array(Ce), Be = 0; Be < Ce; Be++)
                at[Be] = arguments[Be + 2];
            oe.children = at
        }
        if (_ && _.defaultProps)
            for (I in Ce = _.defaultProps,
            Ce)
                oe[I] === void 0 && (oe[I] = Ce[I]);
        return we(_, he, oe)
    }
    ,
    re.createRef = function() {
        return {
            current: null
        }
    }
    ,
    re.forwardRef = function(_) {
        return {
            $$typeof: m,
            render: _
        }
    }
    ,
    re.isValidElement = Q,
    re.lazy = function(_) {
        return {
            $$typeof: S,
            _payload: {
                _status: -1,
                _result: _
            },
            _init: ne
        }
    }
    ,
    re.memo = function(_, B) {
        return {
            $$typeof: y,
            type: _,
            compare: B === void 0 ? null : B
        }
    }
    ,
    re.startTransition = function(_) {
        var B = Z.T
          , K = {};
        Z.T = K;
        try {
            var I = _()
              , oe = Z.S;
            oe !== null && oe(K, I),
            typeof I == "object" && I !== null && typeof I.then == "function" && I.then(J, ve)
        } catch (he) {
            ve(he)
        } finally {
            B !== null && K.types !== null && (B.types = K.types),
            Z.T = B
        }
    }
    ,
    re.unstable_useCacheRefresh = function() {
        return Z.H.useCacheRefresh()
    }
    ,
    re.use = function(_) {
        return Z.H.use(_)
    }
    ,
    re.useActionState = function(_, B, K) {
        return Z.H.useActionState(_, B, K)
    }
    ,
    re.useCallback = function(_, B) {
        return Z.H.useCallback(_, B)
    }
    ,
    re.useContext = function(_) {
        return Z.H.useContext(_)
    }
    ,
    re.useDebugValue = function() {}
    ,
    re.useDeferredValue = function(_, B) {
        return Z.H.useDeferredValue(_, B)
    }
    ,
    re.useEffect = function(_, B) {
        return Z.H.useEffect(_, B)
    }
    ,
    re.useEffectEvent = function(_) {
        return Z.H.useEffectEvent(_)
    }
    ,
    re.useId = function() {
        return Z.H.useId()
    }
    ,
    re.useImperativeHandle = function(_, B, K) {
        return Z.H.useImperativeHandle(_, B, K)
    }
    ,
    re.useInsertionEffect = function(_, B) {
        return Z.H.useInsertionEffect(_, B)
    }
    ,
    re.useLayoutEffect = function(_, B) {
        return Z.H.useLayoutEffect(_, B)
    }
    ,
    re.useMemo = function(_, B) {
        return Z.H.useMemo(_, B)
    }
    ,
    re.useOptimistic = function(_, B) {
        return Z.H.useOptimistic(_, B)
    }
    ,
    re.useReducer = function(_, B, K) {
        return Z.H.useReducer(_, B, K)
    }
    ,
    re.useRef = function(_) {
        return Z.H.useRef(_)
    }
    ,
    re.useState = function(_) {
        return Z.H.useState(_)
    }
    ,
    re.useSyncExternalStore = function(_, B, K) {
        return Z.H.useSyncExternalStore(_, B, K)
    }
    ,
    re.useTransition = function() {
        return Z.H.useTransition()
    }
    ,
    re.version = "19.2.4",
    re
}
var Em;
function Zu() {
    return Em || (Em = 1,
    yu.exports = Bx()),
    yu.exports
}
var U = Zu();
const Nm = Wy(U);
var xu = {
    exports: {}
}
  , Vl = {};
var Cm;
function qx() {
    if (Cm)
        return Vl;
    Cm = 1;
    var i = Symbol.for("react.transitional.element")
      , l = Symbol.for("react.fragment");
    function r(o, c, f) {
        var d = null;
        if (f !== void 0 && (d = "" + f),
        c.key !== void 0 && (d = "" + c.key),
        "key"in c) {
            f = {};
            for (var m in c)
                m !== "key" && (f[m] = c[m])
        } else
            f = c;
        return c = f.ref,
        {
            $$typeof: i,
            type: o,
            key: d,
            ref: c !== void 0 ? c : null,
            props: f
        }
    }
    return Vl.Fragment = l,
    Vl.jsx = r,
    Vl.jsxs = r,
    Vl
}
var _m;
function kx() {
    return _m || (_m = 1,
    xu.exports = qx()),
    xu.exports
}
var g = kx()
  , vu = {
    exports: {}
}
  , Es = {};
var jm;
function Gx() {
    if (jm)
        return Es;
    jm = 1;
    var i = Symbol.for("react.fragment");
    return Es.Fragment = i,
    Es.jsxDEV = void 0,
    Es
}
var Am;
function Yx() {
    return Am || (Am = 1,
    vu.exports = Gx()),
    vu.exports
}
var Tm = Yx();
class kg {
    static getFiberFromDOMNode(l) {
        if (!l)
            return null;
        const r = Object.keys(l).find(o => o.startsWith("__reactFiber$") || o.startsWith("__reactInternalInstance$"));
        return r ? l[r] : null
    }
}
const Gg = new WeakMap
  , Yg = new WeakMap
  , Om = new WeakMap
  , bu = new WeakMap
  , Rm = new WeakMap
  , Mm = new WeakMap
  , Su = (i, l) => {
    try {
        Yg.set(i, l);
        const r = kg.getFiberFromDOMNode(i);
        r && Gg.set(r, l)
    } catch {}
}
  , Ns = (i, l) => {
    if (!i)
        return r => {
            r instanceof HTMLElement && Su(r, l)
        }
        ;
    if (typeof i == "function") {
        let r = bu.get(i);
        r || (r = [],
        bu.set(i, r)),
        r.push(l);
        let o = Om.get(i);
        return o || (o = c => {
            if (c instanceof HTMLElement) {
                const f = bu.get(i);
                if (f && f.length > 0) {
                    const d = f.shift();
                    Su(c, d)
                }
            }
            i(c)
        }
        ,
        Om.set(i, o)),
        o
    }
    if (i && typeof i == "object" && "current"in i) {
        Mm.set(i, l);
        let r = Rm.get(i);
        return r || (r = o => {
            if (o instanceof HTMLElement) {
                const c = Mm.get(i);
                c && Su(o, c)
            }
            i.current = o
        }
        ,
        Rm.set(i, r)),
        r
    }
}
;
function Vx() {
    const i = Nm.createElement
      , l = g.jsx
      , r = g.jsxs
      , o = Tm.jsxDEV
      , c = () => {
        const d = new Error;
        return () => d
    }
      , f = d => typeof d == "string";
    Nm.createElement = function(d, m, ...p) {
        if (!f(d) && typeof d != "function")
            return i(d, m, ...p);
        const y = c()
          , S = m ? {
            ...m
        } : {}
          , v = Ns(S.ref, y);
        return v && (S.ref = v),
        i(d, S, ...p)
    }
    ,
    g.jsx = function(d, m, p) {
        if (!f(d) && typeof d != "function")
            return l(d, m, p);
        const y = c()
          , S = m ? {
            ...m
        } : {}
          , v = Ns(S.ref, y);
        return v && (S.ref = v),
        l(d, S, p)
    }
    ,
    g.jsxs = function(d, m, p) {
        if (!f(d) && typeof d != "function")
            return r(d, m, p);
        const y = c()
          , S = m ? {
            ...m
        } : {}
          , v = Ns(S.ref, y);
        return v && (S.ref = v),
        r(d, S, p)
    }
    ,
    o && (Tm.jsxDEV = function(d, m, p, y, S, v) {
        if (!f(d) && typeof d != "function")
            return o(d, m, p, y, S, v);
        const w = c()
          , b = m ? {
            ...m
        } : {}
          , E = Ns(b.ref, w);
        return E && (b.ref = E),
        o(d, b, p, y, S, v)
    }
    )
}
function Qx(i) {
    const l = document.querySelector(i);
    if (!l)
        return null;
    const r = l.tagName.toLowerCase()
      , o = Yg.get(l);
    if (o)
        return {
            element: l,
            tagName: r,
            debugError: o()
        };
    const c = kg.getFiberFromDOMNode(l);
    if (c) {
        const f = Gg.get(c);
        if (f)
            return {
                element: l,
                tagName: r,
                debugError: f()
            }
    }
    return null
}
Vx();
function Xx() {
    const i = new WeakMap
      , l = new Za(window.parent);
    return l.on("get-element-source", async ({selector: r}) => {
        const o = Qx(r);
        if (!o)
            return null;
        const {element: c, tagName: f, debugError: d} = o;
        if (i.has(c))
            return i.get(c);
        const m = await Kl(d, 10, f);
        if (!m)
            return null;
        const y = {
            ...m.sourceContext.filter(S => !S.file.includes("node_modules"))[0],
            domInfo: {
                tagName: c.tagName,
                textContent: c.textContent.slice(0, 300)
            }
        };
        return i.set(c, y),
        y
    }
    ),
    () => {
        l.destroy()
    }
}
const Zx = !0;
console.log("Is preview build:", Zx);
async function Kx() {
    $y(),
    Ex(),
    zx(),
    Cx(),
    Hx(),
    Xx()
}
Kx();
const Fx = "phc_V7JMHB0fVJGRu8UHyrsj6pSL1BS76P5zD8qCi7lrTTV"
  , Je = {
    colors: {
        text: "#5D5D5D",
        white: "#FFFFFF",
        border: "rgba(0, 10, 36, 0.08)"
    },
    font: {
        family: '"Geist"',
        weight: "600",
        size: {
            normal: "14px",
            button: "18px"
        },
        lineHeight: "20px"
    },
    button: {
        gradient: "linear-gradient(180deg, #A797FF 0%, #7057FF 100%)"
    },
    shadow: "0px 8px 12px 0px rgba(9, 10, 20, 0.06)",
    zIndex: `${Number.MAX_SAFE_INTEGER}`
}
  , Dm = {
    close: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D303D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>')}`,
    generate: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.87 4.94c.227-.71 1.21-.723 1.456-.02l1.177 3.378 3.101 1.013c.708.231.714 1.216.01 1.455l-3.183 1.082-1.105 3.17c-.245.704-1.23.69-1.455-.02l-.989-3.107-3.367-1.203c-.702-.25-.68-1.234.04-1.455l3.282-1.016 1.043-3.277Z" fill="#FFF"/><path fill-rule="evenodd" d="M12.238 1.3c.167-.667 1.1-.667 1.266 0l.388 1.551 1.55.388c.666.166.667 1.1 0 1.266l-1.55.388-.388 1.55c-.167.666-1.1.667-1.266 0l-.388-1.55-1.55-.388c-.667-.166-.667-1.1 0-1.266l1.55-.388.388-1.551Z" fill="#FFF"/></svg>')}`
}
  
  , Lm = {
    en: {
        prefix: "This Website is Made with",
        suffix: ". You can also get one like this in minutes",
        button: "Get one for FREE"
    },
    zh: {
        prefix: "本网站来自",
        suffix: "你也可以在几分钟内拥有同样的页面",
        button: "立即免费拥有"
    }
}
  , Jx = () => navigator.language?.toLowerCase().startsWith("zh") ?? !1
  , wu = () => Jx() ? Lm.zh : Lm.en
  , $x = () => window.innerWidth > 768 && !("ontouchstart"in window)
  , Wx = () => {
    const i = window.location.hostname;
    
;
function Ix() {
    if (window.posthog)
        return;
    const i = document.createElement("script");
    i.src = Fl.posthogCDN,
    i.async = !0,
    i.onload = () => {
        window.posthog?.init(Fx, {
            api_host: "https://us.i.posthog.com",
            autocapture: !1,
            capture_pageview: !1,
            capture_pageleave: !1,
            disable_session_recording: !0,
            disable_scroll_properties: !0,
            capture_performance: {
                web_vitals: !1
            },
            rageclick: !1,
            loaded: function(l) {
                l.sessionRecording && l.sessionRecording.stopRecording()
            }
        })
    }
    ,
    document.head.appendChild(i)
}
function zm(i, l) {
    window.posthog?.capture(i, {
        ...l,
        version: 2
    })
}
function Gt(i, l) {
    Object.assign(i.style, l)
}
function Eu(i, l="0") {
    Gt(i, {
        color: Je.colors.text,
        fontFamily: Je.font.family,
        fontSize: Je.font.size.normal,
        lineHeight: Je.font.lineHeight,
        fontWeight: Je.font.weight,
        whiteSpace: "nowrap",
        marginRight: l
    })
}
function Cs(i, l="row") {
    Gt(i, {
        display: "flex",
        flexDirection: l,
        alignItems: "center",
        justifyContent: "center"
    })
}
function Px() {
    if (Wx())
        return;
      , l = "1cc2edc0-ff54-4d53-b605-fd14dff6b00e";
    async function r(b) {
        try {
            return !(await (await fetch(`${i}?projectId=${b}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })).json()).data.is_free
        } catch {
            return !0
        }
    }
    function o() {
        document.querySelector('link[rel="icon"]')?.remove();
        const b = document.createElement("link");
        b.type = "image/png",
        b.rel = "icon",
       
        document.head.appendChild(b);
        const E = document.createElement("link");
        E.rel = "stylesheet",
        E.href = Fl.fontStylesheet,
        document.head.appendChild(E)
    }
    function c(b) {
        zm(b),
    function f() {
        const b = document.createElement("div");
        b.id = "close-button",
        Gt(b, {
            position: "absolute",
            top: "-12px",
            right: "-12px",
            width: "32px",
            height: "32px",
            backgroundColor: Je.colors.white,
            borderRadius: "50%",
            borderStyle: "solid",
            borderWidth: "1px",
            borderColor: Je.colors.border,
            cursor: "pointer",
            boxShadow: Je.shadow
        }),
        Cs(b);
        const E = document.createElement("img");
        return E.src = Dm.close,
        Gt(E, {
            width: "24px",
            height: "24px"
        }),
        b.appendChild(E),
        b.addEventListener("click", A => {
            A.stopPropagation(),
            zm("watermark_close_button_click"),
            document.getElementById("watermark")?.remove()
        }
        ),
        b
    }
    function d(b) {
        const E = document.createElement("div");
        E.id = "generate-button",
        Gt(E, {
            padding: b ? "8px 16px" : "10px 20px",
            background: Je.button.gradient,
            borderRadius: "999px",
            border: "none",
            gap: "6px",
            cursor: "pointer",
            marginLeft: b ? "12px" : "0",
            whiteSpace: "nowrap",
            width: b ? "auto" : "100%"
        }),
        Cs(E);
        const A = document.createElement("img");
        A.src = Dm.generate,
        Gt(A, {
            width: "16px",
            height: "16px",
            flexShrink: "0"
        });
        const N = document.createElement("span");
        return N.textContent = wu().button,
        Gt(N, {
            color: Je.colors.white,
            fontFamily: Je.font.family,
            fontSize: Je.font.size.button,
            fontWeight: Je.font.weight,
            lineHeight: Je.font.lineHeight
        }),
        E.append(A, N),
        E.addEventListener("click", D => {
            D.stopPropagation(),
            c("watermark_create_button_click")
        }
        ),
        E
    }
    function m() {
        const b = document.createElement("img");
        return b.src = Fl.watermarkLogo,
        Gt(b, {
            width: "92px",
            height: "auto",
            paddingLeft: "8px",
            flexShrink: "0"
        }),
        b
    }
    function p(b) {
        const E = wu()
          , A = document.createElement("div");
        A.textContent = E.prefix,
        Eu(A);
        const N = m()
          , D = document.createElement("div");
        D.textContent = E.suffix,
        Eu(D, "12px"),
        b.append(A, N, D, d(!0))
    }
    function y(b, E) {
        const A = document.createElement("div");
        return A.textContent = b,
        Eu(A),
        E && Gt(A, E),
        A
    }
    function S(b) {
        const {prefix: E, suffix: A} = wu()
          , [N,D] = A.startsWith(".") ? [".", A.slice(1).trim()] : ["", A]
          , k = document.createElement("div");
        Cs(k),
        k.style.marginBottom = "4px",
        k.append(y(E, {
            marginRight: "6px"
        }), m(), ...N ? [y(N)] : []),
        b.append(k, y(D, {
            textAlign: "center",
            marginBottom: "12px"
        }), d(!1))
    }
    function v() {
        const b = $x()
          , E = document.createElement("div");
        return E.id = "watermark",
        Gt(E, {
            zIndex: Je.zIndex,
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: b ? "fit-content" : "calc(100% - 32px)",
            maxWidth: b ? "none" : "100%",
            backgroundColor: Je.colors.white,
            borderStyle: "solid",
            borderWidth: "1px",
            borderRadius: b ? "999px" : "36px",
            borderColor: Je.colors.border,
            padding: b ? "12px 20px" : "16px",
            boxShadow: Je.shadow,
            cursor: "pointer"
        }),
        Cs(E, b ? "row" : "column"),
        E.appendChild(f()),
        b ? p(E) : S(E),
        E.addEventListener("click", A => {
            A.target.closest("#generate-button, #close-button") || c("watermark_create_button_click")
        }
        ),
        E
    }
    function w(b) {
        const E = document.getElementById("watermark");
        !E && !b ? (document.body.appendChild(v()),
        o(),
        Ix()) : b && E && E.remove()
    }
    r(l).then(w)
}
Px();
const se = i => typeof i == "string"
  , Ql = () => {
    let i, l;
    const r = new Promise( (o, c) => {
        i = o,
        l = c
    }
    );
    return r.resolve = i,
    r.reject = l,
    r
}
  , Um = i => i == null ? "" : "" + i
  , ev = (i, l, r) => {
    i.forEach(o => {
        l[o] && (r[o] = l[o])
    }
    )
}
  , tv = /###/g
  , Hm = i => i && i.indexOf("###") > -1 ? i.replace(tv, ".") : i
  , Bm = i => !i || se(i)
  , $l = (i, l, r) => {
    const o = se(l) ? l.split(".") : l;
    let c = 0;
    for (; c < o.length - 1; ) {
        if (Bm(i))
            return {};
        const f = Hm(o[c]);
        !i[f] && r && (i[f] = new r),
        Object.prototype.hasOwnProperty.call(i, f) ? i = i[f] : i = {},
        ++c
    }
    return Bm(i) ? {} : {
        obj: i,
        k: Hm(o[c])
    }
}
  , qm = (i, l, r) => {
    const {obj: o, k: c} = $l(i, l, Object);
    if (o !== void 0 || l.length === 1) {
        o[c] = r;
        return
    }
    let f = l[l.length - 1]
      , d = l.slice(0, l.length - 1)
      , m = $l(i, d, Object);
    for (; m.obj === void 0 && d.length; )
        f = `${d[d.length - 1]}.${f}`,
        d = d.slice(0, d.length - 1),
        m = $l(i, d, Object),
        m?.obj && typeof m.obj[`${m.k}.${f}`] < "u" && (m.obj = void 0);
    m.obj[`${m.k}.${f}`] = r
}
  , nv = (i, l, r, o) => {
    const {obj: c, k: f} = $l(i, l, Object);
    c[f] = c[f] || [],
    c[f].push(r)
}
  , Ms = (i, l) => {
    const {obj: r, k: o} = $l(i, l);
    if (r && Object.prototype.hasOwnProperty.call(r, o))
        return r[o]
}
  , av = (i, l, r) => {
    const o = Ms(i, r);
    return o !== void 0 ? o : Ms(l, r)
}
  , Vg = (i, l, r) => {
    for (const o in l)
        o !== "__proto__" && o !== "constructor" && (o in i ? se(i[o]) || i[o]instanceof String || se(l[o]) || l[o]instanceof String ? r && (i[o] = l[o]) : Vg(i[o], l[o], r) : i[o] = l[o]);
    return i
}
  , Ga = i => i.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var lv = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
};
const iv = i => se(i) ? i.replace(/[&<>"'\/]/g, l => lv[l]) : i;
class sv {
    constructor(l) {
        this.capacity = l,
        this.regExpMap = new Map,
        this.regExpQueue = []
    }
    getRegExp(l) {
        const r = this.regExpMap.get(l);
        if (r !== void 0)
            return r;
        const o = new RegExp(l);
        return this.regExpQueue.length === this.capacity && this.regExpMap.delete(this.regExpQueue.shift()),
        this.regExpMap.set(l, o),
        this.regExpQueue.push(l),
        o
    }
}
const rv = [" ", ",", "?", "!", ";"]
  , ov = new sv(20)
  , uv = (i, l, r) => {
    l = l || "",
    r = r || "";
    const o = rv.filter(d => l.indexOf(d) < 0 && r.indexOf(d) < 0);
    if (o.length === 0)
        return !0;
    const c = ov.getRegExp(`(${o.map(d => d === "?" ? "\\?" : d).join("|")})`);
    let f = !c.test(i);
    if (!f) {
        const d = i.indexOf(r);
        d > 0 && !c.test(i.substring(0, d)) && (f = !0)
    }
    return f
}
  , Lu = (i, l, r=".") => {
    if (!i)
        return;
    if (i[l])
        return Object.prototype.hasOwnProperty.call(i, l) ? i[l] : void 0;
    const o = l.split(r);
    let c = i;
    for (let f = 0; f < o.length; ) {
        if (!c || typeof c != "object")
            return;
        let d, m = "";
        for (let p = f; p < o.length; ++p)
            if (p !== f && (m += r),
            m += o[p],
            d = c[m],
            d !== void 0) {
                if (["string", "number", "boolean"].indexOf(typeof d) > -1 && p < o.length - 1)
                    continue;
                f += p - f + 1;
                break
            }
        c = d
    }
    return c
}
  , Wl = i => i?.replace("_", "-")
  , cv = {
    type: "logger",
    log(i) {
        this.output("log", i)
    },
    warn(i) {
        this.output("warn", i)
    },
    error(i) {
        this.output("error", i)
    },
    output(i, l) {
        console?.[i]?.apply?.(console, l)
    }
};
class Ds {
    constructor(l, r={}) {
        this.init(l, r)
    }
    init(l, r={}) {
        this.prefix = r.prefix || "i18next:",
        this.logger = l || cv,
        this.options = r,
        this.debug = r.debug
    }
    log(...l) {
        return this.forward(l, "log", "", !0)
    }
    warn(...l) {
        return this.forward(l, "warn", "", !0)
    }
    error(...l) {
        return this.forward(l, "error", "")
    }
    deprecate(...l) {
        return this.forward(l, "warn", "WARNING DEPRECATED: ", !0)
    }
    forward(l, r, o, c) {
        return c && !this.debug ? null : (se(l[0]) && (l[0] = `${o}${this.prefix} ${l[0]}`),
        this.logger[r](l))
    }
    create(l) {
        return new Ds(this.logger,{
            prefix: `${this.prefix}:${l}:`,
            ...this.options
        })
    }
    clone(l) {
        return l = l || this.options,
        l.prefix = l.prefix || this.prefix,
        new Ds(this.logger,l)
    }
}
var Yt = new Ds;
class Hs {
    constructor() {
        this.observers = {}
    }
    on(l, r) {
        return l.split(" ").forEach(o => {
            this.observers[o] || (this.observers[o] = new Map);
            const c = this.observers[o].get(r) || 0;
            this.observers[o].set(r, c + 1)
        }
        ),
        this
    }
    off(l, r) {
        if (this.observers[l]) {
            if (!r) {
                delete this.observers[l];
                return
            }
            this.observers[l].delete(r)
        }
    }
    emit(l, ...r) {
        this.observers[l] && Array.from(this.observers[l].entries()).forEach( ([c,f]) => {
            for (let d = 0; d < f; d++)
                c(...r)
        }
        ),
        this.observers["*"] && Array.from(this.observers["*"].entries()).forEach( ([c,f]) => {
            for (let d = 0; d < f; d++)
                c.apply(c, [l, ...r])
        }
        )
    }
}
class km extends Hs {
    constructor(l, r={
        ns: ["translation"],
        defaultNS: "translation"
    }) {
        super(),
        this.data = l || {},
        this.options = r,
        this.options.keySeparator === void 0 && (this.options.keySeparator = "."),
        this.options.ignoreJSONStructure === void 0 && (this.options.ignoreJSONStructure = !0)
    }
    addNamespaces(l) {
        this.options.ns.indexOf(l) < 0 && this.options.ns.push(l)
    }
    removeNamespaces(l) {
        const r = this.options.ns.indexOf(l);
        r > -1 && this.options.ns.splice(r, 1)
    }
    getResource(l, r, o, c={}) {
        const f = c.keySeparator !== void 0 ? c.keySeparator : this.options.keySeparator
          , d = c.ignoreJSONStructure !== void 0 ? c.ignoreJSONStructure : this.options.ignoreJSONStructure;
        let m;
        l.indexOf(".") > -1 ? m = l.split(".") : (m = [l, r],
        o && (Array.isArray(o) ? m.push(...o) : se(o) && f ? m.push(...o.split(f)) : m.push(o)));
        const p = Ms(this.data, m);
        return !p && !r && !o && l.indexOf(".") > -1 && (l = m[0],
        r = m[1],
        o = m.slice(2).join(".")),
        p || !d || !se(o) ? p : Lu(this.data?.[l]?.[r], o, f)
    }
    addResource(l, r, o, c, f={
        silent: !1
    }) {
        const d = f.keySeparator !== void 0 ? f.keySeparator : this.options.keySeparator;
        let m = [l, r];
        o && (m = m.concat(d ? o.split(d) : o)),
        l.indexOf(".") > -1 && (m = l.split("."),
        c = r,
        r = m[1]),
        this.addNamespaces(r),
        qm(this.data, m, c),
        f.silent || this.emit("added", l, r, o, c)
    }
    addResources(l, r, o, c={
        silent: !1
    }) {
        for (const f in o)
            (se(o[f]) || Array.isArray(o[f])) && this.addResource(l, r, f, o[f], {
                silent: !0
            });
        c.silent || this.emit("added", l, r, o)
    }
    addResourceBundle(l, r, o, c, f, d={
        silent: !1,
        skipCopy: !1
    }) {
        let m = [l, r];
        l.indexOf(".") > -1 && (m = l.split("."),
        c = o,
        o = r,
        r = m[1]),
        this.addNamespaces(r);
        let p = Ms(this.data, m) || {};
        d.skipCopy || (o = JSON.parse(JSON.stringify(o))),
        c ? Vg(p, o, f) : p = {
            ...p,
            ...o
        },
        qm(this.data, m, p),
        d.silent || this.emit("added", l, r, o)
    }
    removeResourceBundle(l, r) {
        this.hasResourceBundle(l, r) && delete this.data[l][r],
        this.removeNamespaces(r),
        this.emit("removed", l, r)
    }
    hasResourceBundle(l, r) {
        return this.getResource(l, r) !== void 0
    }
    getResourceBundle(l, r) {
        return r || (r = this.options.defaultNS),
        this.getResource(l, r)
    }
    getDataByLanguage(l) {
        return this.data[l]
    }
    hasLanguageSomeTranslations(l) {
        const r = this.getDataByLanguage(l);
        return !!(r && Object.keys(r) || []).find(c => r[c] && Object.keys(r[c]).length > 0)
    }
    toJSON() {
        return this.data
    }
}
var Qg = {
    processors: {},
    addPostProcessor(i) {
        this.processors[i.name] = i
    },
    handle(i, l, r, o, c) {
        return i.forEach(f => {
            l = this.processors[f]?.process(l, r, o, c) ?? l
        }
        ),
        l
    }
};
const Xg = Symbol("i18next/PATH_KEY");
function fv() {
    const i = []
      , l = Object.create(null);
    let r;
    return l.get = (o, c) => (r?.revoke?.(),
    c === Xg ? i : (i.push(c),
    r = Proxy.revocable(o, l),
    r.proxy)),
    Proxy.revocable(Object.create(null), l).proxy
}
function zu(i, l) {
    const {[Xg]: r} = i(fv());
    return r.join(l?.keySeparator ?? ".")
}
const Gm = {}
  , Ym = i => !se(i) && typeof i != "boolean" && typeof i != "number";
class Ls extends Hs {
    constructor(l, r={}) {
        super(),
        ev(["resourceStore", "languageUtils", "pluralResolver", "interpolator", "backendConnector", "i18nFormat", "utils"], l, this),
        this.options = r,
        this.options.keySeparator === void 0 && (this.options.keySeparator = "."),
        this.logger = Yt.create("translator")
    }
    changeLanguage(l) {
        l && (this.language = l)
    }
    exists(l, r={
        interpolation: {}
    }) {
        const o = {
            ...r
        };
        return l == null ? !1 : this.resolve(l, o)?.res !== void 0
    }
    extractFromKey(l, r) {
        let o = r.nsSeparator !== void 0 ? r.nsSeparator : this.options.nsSeparator;
        o === void 0 && (o = ":");
        const c = r.keySeparator !== void 0 ? r.keySeparator : this.options.keySeparator;
        let f = r.ns || this.options.defaultNS || [];
        const d = o && l.indexOf(o) > -1
          , m = !this.options.userDefinedKeySeparator && !r.keySeparator && !this.options.userDefinedNsSeparator && !r.nsSeparator && !uv(l, o, c);
        if (d && !m) {
            const p = l.match(this.interpolator.nestingRegexp);
            if (p && p.length > 0)
                return {
                    key: l,
                    namespaces: se(f) ? [f] : f
                };
            const y = l.split(o);
            (o !== c || o === c && this.options.ns.indexOf(y[0]) > -1) && (f = y.shift()),
            l = y.join(c)
        }
        return {
            key: l,
            namespaces: se(f) ? [f] : f
        }
    }
    translate(l, r, o) {
        let c = typeof r == "object" ? {
            ...r
        } : r;
        if (typeof c != "object" && this.options.overloadTranslationOptionHandler && (c = this.options.overloadTranslationOptionHandler(arguments)),
        typeof options == "object" && (c = {
            ...c
        }),
        c || (c = {}),
        l == null)
            return "";
        typeof l == "function" && (l = zu(l, c)),
        Array.isArray(l) || (l = [String(l)]);
        const f = c.returnDetails !== void 0 ? c.returnDetails : this.options.returnDetails
          , d = c.keySeparator !== void 0 ? c.keySeparator : this.options.keySeparator
          , {key: m, namespaces: p} = this.extractFromKey(l[l.length - 1], c)
          , y = p[p.length - 1];
        let S = c.nsSeparator !== void 0 ? c.nsSeparator : this.options.nsSeparator;
        S === void 0 && (S = ":");
        const v = c.lng || this.language
          , w = c.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
        if (v?.toLowerCase() === "cimode")
            return w ? f ? {
                res: `${y}${S}${m}`,
                usedKey: m,
                exactUsedKey: m,
                usedLng: v,
                usedNS: y,
                usedParams: this.getUsedParamsDetails(c)
            } : `${y}${S}${m}` : f ? {
                res: m,
                usedKey: m,
                exactUsedKey: m,
                usedLng: v,
                usedNS: y,
                usedParams: this.getUsedParamsDetails(c)
            } : m;
        const b = this.resolve(l, c);
        let E = b?.res;
        const A = b?.usedKey || m
          , N = b?.exactUsedKey || m
          , D = ["[object Number]", "[object Function]", "[object RegExp]"]
          , k = c.joinArrays !== void 0 ? c.joinArrays : this.options.joinArrays
          , G = !this.i18nFormat || this.i18nFormat.handleAsObject
          , $ = c.count !== void 0 && !se(c.count)
          , W = Ls.hasDefaultValue(c)
          , J = $ ? this.pluralResolver.getSuffix(v, c.count, c) : ""
          , Z = c.ordinal && $ ? this.pluralResolver.getSuffix(v, c.count, {
            ordinal: !1
        }) : ""
          , ie = $ && !c.ordinal && c.count === 0
          , we = ie && c[`defaultValue${this.options.pluralSeparator}zero`] || c[`defaultValue${J}`] || c[`defaultValue${Z}`] || c.defaultValue;
        let V = E;
        G && !E && W && (V = we);
        const Q = Ym(V)
          , F = Object.prototype.toString.apply(V);
        if (G && V && Q && D.indexOf(F) < 0 && !(se(k) && Array.isArray(V))) {
            if (!c.returnObjects && !this.options.returnObjects) {
                this.options.returnedObjectHandler || this.logger.warn("accessing an object - but returnObjects options is not enabled!");
                const ae = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(A, V, {
                    ...c,
                    ns: p
                }) : `key '${m} (${this.language})' returned an object instead of string.`;
                return f ? (b.res = ae,
                b.usedParams = this.getUsedParamsDetails(c),
                b) : ae
            }
            if (d) {
                const ae = Array.isArray(V)
                  , ce = ae ? [] : {}
                  , de = ae ? N : A;
                for (const z in V)
                    if (Object.prototype.hasOwnProperty.call(V, z)) {
                        const X = `${de}${d}${z}`;
                        W && !E ? ce[z] = this.translate(X, {
                            ...c,
                            defaultValue: Ym(we) ? we[z] : void 0,
                            joinArrays: !1,
                            ns: p
                        }) : ce[z] = this.translate(X, {
                            ...c,
                            joinArrays: !1,
                            ns: p
                        }),
                        ce[z] === X && (ce[z] = V[z])
                    }
                E = ce
            }
        } else if (G && se(k) && Array.isArray(E))
            E = E.join(k),
            E && (E = this.extendTranslation(E, l, c, o));
        else {
            let ae = !1
              , ce = !1;
            !this.isValidLookup(E) && W && (ae = !0,
            E = we),
            this.isValidLookup(E) || (ce = !0,
            E = m);
            const z = (c.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey) && ce ? void 0 : E
              , X = W && we !== E && this.options.updateMissing;
            if (ce || ae || X) {
                if (this.logger.log(X ? "updateKey" : "missingKey", v, y, m, X ? we : E),
                d) {
                    const _ = this.resolve(m, {
                        ...c,
                        keySeparator: !1
                    });
                    _ && _.res && this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.")
                }
                let ne = [];
                const ve = this.languageUtils.getFallbackCodes(this.options.fallbackLng, c.lng || this.language);
                if (this.options.saveMissingTo === "fallback" && ve && ve[0])
                    for (let _ = 0; _ < ve.length; _++)
                        ne.push(ve[_]);
                else
                    this.options.saveMissingTo === "all" ? ne = this.languageUtils.toResolveHierarchy(c.lng || this.language) : ne.push(c.lng || this.language);
                const Ne = (_, B, K) => {
                    const I = W && K !== E ? K : z;
                    this.options.missingKeyHandler ? this.options.missingKeyHandler(_, y, B, I, X, c) : this.backendConnector?.saveMissing && this.backendConnector.saveMissing(_, y, B, I, X, c),
                    this.emit("missingKey", _, y, B, E)
                }
                ;
                this.options.saveMissing && (this.options.saveMissingPlurals && $ ? ne.forEach(_ => {
                    const B = this.pluralResolver.getSuffixes(_, c);
                    ie && c[`defaultValue${this.options.pluralSeparator}zero`] && B.indexOf(`${this.options.pluralSeparator}zero`) < 0 && B.push(`${this.options.pluralSeparator}zero`),
                    B.forEach(K => {
                        Ne([_], m + K, c[`defaultValue${K}`] || we)
                    }
                    )
                }
                ) : Ne(ne, m, we))
            }
            E = this.extendTranslation(E, l, c, b, o),
            ce && E === m && this.options.appendNamespaceToMissingKey && (E = `${y}${S}${m}`),
            (ce || ae) && this.options.parseMissingKeyHandler && (E = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${y}${S}${m}` : m, ae ? E : void 0, c))
        }
        return f ? (b.res = E,
        b.usedParams = this.getUsedParamsDetails(c),
        b) : E
    }
    extendTranslation(l, r, o, c, f) {
        if (this.i18nFormat?.parse)
            l = this.i18nFormat.parse(l, {
                ...this.options.interpolation.defaultVariables,
                ...o
            }, o.lng || this.language || c.usedLng, c.usedNS, c.usedKey, {
                resolved: c
            });
        else if (!o.skipInterpolation) {
            o.interpolation && this.interpolator.init({
                ...o,
                interpolation: {
                    ...this.options.interpolation,
                    ...o.interpolation
                }
            });
            const p = se(l) && (o?.interpolation?.skipOnVariables !== void 0 ? o.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
            let y;
            if (p) {
                const v = l.match(this.interpolator.nestingRegexp);
                y = v && v.length
            }
            let S = o.replace && !se(o.replace) ? o.replace : o;
            if (this.options.interpolation.defaultVariables && (S = {
                ...this.options.interpolation.defaultVariables,
                ...S
            }),
            l = this.interpolator.interpolate(l, S, o.lng || this.language || c.usedLng, o),
            p) {
                const v = l.match(this.interpolator.nestingRegexp)
                  , w = v && v.length;
                y < w && (o.nest = !1)
            }
            !o.lng && c && c.res && (o.lng = this.language || c.usedLng),
            o.nest !== !1 && (l = this.interpolator.nest(l, (...v) => f?.[0] === v[0] && !o.context ? (this.logger.warn(`It seems you are nesting recursively key: ${v[0]} in key: ${r[0]}`),
            null) : this.translate(...v, r), o)),
            o.interpolation && this.interpolator.reset()
        }
        const d = o.postProcess || this.options.postProcess
          , m = se(d) ? [d] : d;
        return l != null && m?.length && o.applyPostProcessor !== !1 && (l = Qg.handle(m, l, r, this.options && this.options.postProcessPassResolved ? {
            i18nResolved: {
                ...c,
                usedParams: this.getUsedParamsDetails(o)
            },
            ...o
        } : o, this)),
        l
    }
    resolve(l, r={}) {
        let o, c, f, d, m;
        return se(l) && (l = [l]),
        l.forEach(p => {
            if (this.isValidLookup(o))
                return;
            const y = this.extractFromKey(p, r)
              , S = y.key;
            c = S;
            let v = y.namespaces;
            this.options.fallbackNS && (v = v.concat(this.options.fallbackNS));
            const w = r.count !== void 0 && !se(r.count)
              , b = w && !r.ordinal && r.count === 0
              , E = r.context !== void 0 && (se(r.context) || typeof r.context == "number") && r.context !== ""
              , A = r.lngs ? r.lngs : this.languageUtils.toResolveHierarchy(r.lng || this.language, r.fallbackLng);
            v.forEach(N => {
                this.isValidLookup(o) || (m = N,
                !Gm[`${A[0]}-${N}`] && this.utils?.hasLoadedNamespace && !this.utils?.hasLoadedNamespace(m) && (Gm[`${A[0]}-${N}`] = !0,
                this.logger.warn(`key "${c}" for languages "${A.join(", ")}" won't get resolved as namespace "${m}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!")),
                A.forEach(D => {
                    if (this.isValidLookup(o))
                        return;
                    d = D;
                    const k = [S];
                    if (this.i18nFormat?.addLookupKeys)
                        this.i18nFormat.addLookupKeys(k, S, D, N, r);
                    else {
                        let $;
                        w && ($ = this.pluralResolver.getSuffix(D, r.count, r));
                        const W = `${this.options.pluralSeparator}zero`
                          , J = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                        if (w && (r.ordinal && $.indexOf(J) === 0 && k.push(S + $.replace(J, this.options.pluralSeparator)),
                        k.push(S + $),
                        b && k.push(S + W)),
                        E) {
                            const Z = `${S}${this.options.contextSeparator || "_"}${r.context}`;
                            k.push(Z),
                            w && (r.ordinal && $.indexOf(J) === 0 && k.push(Z + $.replace(J, this.options.pluralSeparator)),
                            k.push(Z + $),
                            b && k.push(Z + W))
                        }
                    }
                    let G;
                    for (; G = k.pop(); )
                        this.isValidLookup(o) || (f = G,
                        o = this.getResource(D, N, G, r))
                }
                ))
            }
            )
        }
        ),
        {
            res: o,
            usedKey: c,
            exactUsedKey: f,
            usedLng: d,
            usedNS: m
        }
    }
    isValidLookup(l) {
        return l !== void 0 && !(!this.options.returnNull && l === null) && !(!this.options.returnEmptyString && l === "")
    }
    getResource(l, r, o, c={}) {
        return this.i18nFormat?.getResource ? this.i18nFormat.getResource(l, r, o, c) : this.resourceStore.getResource(l, r, o, c)
    }
    getUsedParamsDetails(l={}) {
        const r = ["defaultValue", "ordinal", "context", "replace", "lng", "lngs", "fallbackLng", "ns", "keySeparator", "nsSeparator", "returnObjects", "returnDetails", "joinArrays", "postProcess", "interpolation"]
          , o = l.replace && !se(l.replace);
        let c = o ? l.replace : l;
        if (o && typeof l.count < "u" && (c.count = l.count),
        this.options.interpolation.defaultVariables && (c = {
            ...this.options.interpolation.defaultVariables,
            ...c
        }),
        !o) {
            c = {
                ...c
            };
            for (const f of r)
                delete c[f]
        }
        return c
    }
    static hasDefaultValue(l) {
        const r = "defaultValue";
        for (const o in l)
            if (Object.prototype.hasOwnProperty.call(l, o) && r === o.substring(0, r.length) && l[o] !== void 0)
                return !0;
        return !1
    }
}
class Vm {
    constructor(l) {
        this.options = l,
        this.supportedLngs = this.options.supportedLngs || !1,
        this.logger = Yt.create("languageUtils")
    }
    getScriptPartFromCode(l) {
        if (l = Wl(l),
        !l || l.indexOf("-") < 0)
            return null;
        const r = l.split("-");
        return r.length === 2 || (r.pop(),
        r[r.length - 1].toLowerCase() === "x") ? null : this.formatLanguageCode(r.join("-"))
    }
    getLanguagePartFromCode(l) {
        if (l = Wl(l),
        !l || l.indexOf("-") < 0)
            return l;
        const r = l.split("-");
        return this.formatLanguageCode(r[0])
    }
    formatLanguageCode(l) {
        if (se(l) && l.indexOf("-") > -1) {
            let r;
            try {
                r = Intl.getCanonicalLocales(l)[0]
            } catch {}
            return r && this.options.lowerCaseLng && (r = r.toLowerCase()),
            r || (this.options.lowerCaseLng ? l.toLowerCase() : l)
        }
        return this.options.cleanCode || this.options.lowerCaseLng ? l.toLowerCase() : l
    }
    isSupportedCode(l) {
        return (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) && (l = this.getLanguagePartFromCode(l)),
        !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(l) > -1
    }
    getBestMatchFromCodes(l) {
        if (!l)
            return null;
        let r;
        return l.forEach(o => {
            if (r)
                return;
            const c = this.formatLanguageCode(o);
            (!this.options.supportedLngs || this.isSupportedCode(c)) && (r = c)
        }
        ),
        !r && this.options.supportedLngs && l.forEach(o => {
            if (r)
                return;
            const c = this.getScriptPartFromCode(o);
            if (this.isSupportedCode(c))
                return r = c;
            const f = this.getLanguagePartFromCode(o);
            if (this.isSupportedCode(f))
                return r = f;
            r = this.options.supportedLngs.find(d => {
                if (d === f)
                    return d;
                if (!(d.indexOf("-") < 0 && f.indexOf("-") < 0) && (d.indexOf("-") > 0 && f.indexOf("-") < 0 && d.substring(0, d.indexOf("-")) === f || d.indexOf(f) === 0 && f.length > 1))
                    return d
            }
            )
        }
        ),
        r || (r = this.getFallbackCodes(this.options.fallbackLng)[0]),
        r
    }
    getFallbackCodes(l, r) {
        if (!l)
            return [];
        if (typeof l == "function" && (l = l(r)),
        se(l) && (l = [l]),
        Array.isArray(l))
            return l;
        if (!r)
            return l.default || [];
        let o = l[r];
        return o || (o = l[this.getScriptPartFromCode(r)]),
        o || (o = l[this.formatLanguageCode(r)]),
        o || (o = l[this.getLanguagePartFromCode(r)]),
        o || (o = l.default),
        o || []
    }
    toResolveHierarchy(l, r) {
        const o = this.getFallbackCodes((r === !1 ? [] : r) || this.options.fallbackLng || [], l)
          , c = []
          , f = d => {
            d && (this.isSupportedCode(d) ? c.push(d) : this.logger.warn(`rejecting language code not found in supportedLngs: ${d}`))
        }
        ;
        return se(l) && (l.indexOf("-") > -1 || l.indexOf("_") > -1) ? (this.options.load !== "languageOnly" && f(this.formatLanguageCode(l)),
        this.options.load !== "languageOnly" && this.options.load !== "currentOnly" && f(this.getScriptPartFromCode(l)),
        this.options.load !== "currentOnly" && f(this.getLanguagePartFromCode(l))) : se(l) && f(this.formatLanguageCode(l)),
        o.forEach(d => {
            c.indexOf(d) < 0 && f(this.formatLanguageCode(d))
        }
        ),
        c
    }
}
const Qm = {
    zero: 0,
    one: 1,
    two: 2,
    few: 3,
    many: 4,
    other: 5
}
  , Xm = {
    select: i => i === 1 ? "one" : "other",
    resolvedOptions: () => ({
        pluralCategories: ["one", "other"]
    })
};
class dv {
    constructor(l, r={}) {
        this.languageUtils = l,
        this.options = r,
        this.logger = Yt.create("pluralResolver"),
        this.pluralRulesCache = {}
    }
    addRule(l, r) {
        this.rules[l] = r
    }
    clearCache() {
        this.pluralRulesCache = {}
    }
    getRule(l, r={}) {
        const o = Wl(l === "dev" ? "en" : l)
          , c = r.ordinal ? "ordinal" : "cardinal"
          , f = JSON.stringify({
            cleanedCode: o,
            type: c
        });
        if (f in this.pluralRulesCache)
            return this.pluralRulesCache[f];
        let d;
        try {
            d = new Intl.PluralRules(o,{
                type: c
            })
        } catch {
            if (!Intl)
                return this.logger.error("No Intl support, please use an Intl polyfill!"),
                Xm;
            if (!l.match(/-|_/))
                return Xm;
            const p = this.languageUtils.getLanguagePartFromCode(l);
            d = this.getRule(p, r)
        }
        return this.pluralRulesCache[f] = d,
        d
    }
    needsPlural(l, r={}) {
        let o = this.getRule(l, r);
        return o || (o = this.getRule("dev", r)),
        o?.resolvedOptions().pluralCategories.length > 1
    }
    getPluralFormsOfKey(l, r, o={}) {
        return this.getSuffixes(l, o).map(c => `${r}${c}`)
    }
    getSuffixes(l, r={}) {
        let o = this.getRule(l, r);
        return o || (o = this.getRule("dev", r)),
        o ? o.resolvedOptions().pluralCategories.sort( (c, f) => Qm[c] - Qm[f]).map(c => `${this.options.prepend}${r.ordinal ? `ordinal${this.options.prepend}` : ""}${c}`) : []
    }
    getSuffix(l, r, o={}) {
        const c = this.getRule(l, o);
        return c ? `${this.options.prepend}${o.ordinal ? `ordinal${this.options.prepend}` : ""}${c.select(r)}` : (this.logger.warn(`no plural rule found for: ${l}`),
        this.getSuffix("dev", r, o))
    }
}
const Zm = (i, l, r, o=".", c=!0) => {
    let f = av(i, l, r);
    return !f && c && se(r) && (f = Lu(i, r, o),
    f === void 0 && (f = Lu(l, r, o))),
    f
}
  , Nu = i => i.replace(/\$/g, "$$$$");
class hv {
    constructor(l={}) {
        this.logger = Yt.create("interpolator"),
        this.options = l,
        this.format = l?.interpolation?.format || (r => r),
        this.init(l)
    }
    init(l={}) {
        l.interpolation || (l.interpolation = {
            escapeValue: !0
        });
        const {escape: r, escapeValue: o, useRawValueToEscape: c, prefix: f, prefixEscaped: d, suffix: m, suffixEscaped: p, formatSeparator: y, unescapeSuffix: S, unescapePrefix: v, nestingPrefix: w, nestingPrefixEscaped: b, nestingSuffix: E, nestingSuffixEscaped: A, nestingOptionsSeparator: N, maxReplaces: D, alwaysFormat: k} = l.interpolation;
        this.escape = r !== void 0 ? r : iv,
        this.escapeValue = o !== void 0 ? o : !0,
        this.useRawValueToEscape = c !== void 0 ? c : !1,
        this.prefix = f ? Ga(f) : d || "{{",
        this.suffix = m ? Ga(m) : p || "}}",
        this.formatSeparator = y || ",",
        this.unescapePrefix = S ? "" : v || "-",
        this.unescapeSuffix = this.unescapePrefix ? "" : S || "",
        this.nestingPrefix = w ? Ga(w) : b || Ga("$t("),
        this.nestingSuffix = E ? Ga(E) : A || Ga(")"),
        this.nestingOptionsSeparator = N || ",",
        this.maxReplaces = D || 1e3,
        this.alwaysFormat = k !== void 0 ? k : !1,
        this.resetRegExp()
    }
    reset() {
        this.options && this.init(this.options)
    }
    resetRegExp() {
        const l = (r, o) => r?.source === o ? (r.lastIndex = 0,
        r) : new RegExp(o,"g");
        this.regexp = l(this.regexp, `${this.prefix}(.+?)${this.suffix}`),
        this.regexpUnescape = l(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`),
        this.nestingRegexp = l(this.nestingRegexp, `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`)
    }
    interpolate(l, r, o, c) {
        let f, d, m;
        const p = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {}
          , y = b => {
            if (b.indexOf(this.formatSeparator) < 0) {
                const D = Zm(r, p, b, this.options.keySeparator, this.options.ignoreJSONStructure);
                return this.alwaysFormat ? this.format(D, void 0, o, {
                    ...c,
                    ...r,
                    interpolationkey: b
                }) : D
            }
            const E = b.split(this.formatSeparator)
              , A = E.shift().trim()
              , N = E.join(this.formatSeparator).trim();
            return this.format(Zm(r, p, A, this.options.keySeparator, this.options.ignoreJSONStructure), N, o, {
                ...c,
                ...r,
                interpolationkey: A
            })
        }
        ;
        this.resetRegExp();
        const S = c?.missingInterpolationHandler || this.options.missingInterpolationHandler
          , v = c?.interpolation?.skipOnVariables !== void 0 ? c.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
        return [{
            regex: this.regexpUnescape,
            safeValue: b => Nu(b)
        }, {
            regex: this.regexp,
            safeValue: b => this.escapeValue ? Nu(this.escape(b)) : Nu(b)
        }].forEach(b => {
            for (m = 0; f = b.regex.exec(l); ) {
                const E = f[1].trim();
                if (d = y(E),
                d === void 0)
                    if (typeof S == "function") {
                        const N = S(l, f, c);
                        d = se(N) ? N : ""
                    } else if (c && Object.prototype.hasOwnProperty.call(c, E))
                        d = "";
                    else if (v) {
                        d = f[0];
                        continue
                    } else
                        this.logger.warn(`missed to pass in variable ${E} for interpolating ${l}`),
                        d = "";
                else
                    !se(d) && !this.useRawValueToEscape && (d = Um(d));
                const A = b.safeValue(d);
                if (l = l.replace(f[0], A),
                v ? (b.regex.lastIndex += d.length,
                b.regex.lastIndex -= f[0].length) : b.regex.lastIndex = 0,
                m++,
                m >= this.maxReplaces)
                    break
            }
        }
        ),
        l
    }
    nest(l, r, o={}) {
        let c, f, d;
        const m = (p, y) => {
            const S = this.nestingOptionsSeparator;
            if (p.indexOf(S) < 0)
                return p;
            const v = p.split(new RegExp(`${S}[ ]*{`));
            let w = `{${v[1]}`;
            p = v[0],
            w = this.interpolate(w, d);
            const b = w.match(/'/g)
              , E = w.match(/"/g);
            ((b?.length ?? 0) % 2 === 0 && !E || E.length % 2 !== 0) && (w = w.replace(/'/g, '"'));
            try {
                d = JSON.parse(w),
                y && (d = {
                    ...y,
                    ...d
                })
            } catch (A) {
                return this.logger.warn(`failed parsing options string in nesting for key ${p}`, A),
                `${p}${S}${w}`
            }
            return d.defaultValue && d.defaultValue.indexOf(this.prefix) > -1 && delete d.defaultValue,
            p
        }
        ;
        for (; c = this.nestingRegexp.exec(l); ) {
            let p = [];
            d = {
                ...o
            },
            d = d.replace && !se(d.replace) ? d.replace : d,
            d.applyPostProcessor = !1,
            delete d.defaultValue;
            const y = /{.*}/.test(c[1]) ? c[1].lastIndexOf("}") + 1 : c[1].indexOf(this.formatSeparator);
            if (y !== -1 && (p = c[1].slice(y).split(this.formatSeparator).map(S => S.trim()).filter(Boolean),
            c[1] = c[1].slice(0, y)),
            f = r(m.call(this, c[1].trim(), d), d),
            f && c[0] === l && !se(f))
                return f;
            se(f) || (f = Um(f)),
            f || (this.logger.warn(`missed to resolve ${c[1]} for nesting ${l}`),
            f = ""),
            p.length && (f = p.reduce( (S, v) => this.format(S, v, o.lng, {
                ...o,
                interpolationkey: c[1].trim()
            }), f.trim())),
            l = l.replace(c[0], f),
            this.regexp.lastIndex = 0
        }
        return l
    }
}
const mv = i => {
    let l = i.toLowerCase().trim();
    const r = {};
    if (i.indexOf("(") > -1) {
        const o = i.split("(");
        l = o[0].toLowerCase().trim();
        const c = o[1].substring(0, o[1].length - 1);
        l === "currency" && c.indexOf(":") < 0 ? r.currency || (r.currency = c.trim()) : l === "relativetime" && c.indexOf(":") < 0 ? r.range || (r.range = c.trim()) : c.split(";").forEach(d => {
            if (d) {
                const [m,...p] = d.split(":")
                  , y = p.join(":").trim().replace(/^'+|'+$/g, "")
                  , S = m.trim();
                r[S] || (r[S] = y),
                y === "false" && (r[S] = !1),
                y === "true" && (r[S] = !0),
                isNaN(y) || (r[S] = parseInt(y, 10))
            }
        }
        )
    }
    return {
        formatName: l,
        formatOptions: r
    }
}
  , Km = i => {
    const l = {};
    return (r, o, c) => {
        let f = c;
        c && c.interpolationkey && c.formatParams && c.formatParams[c.interpolationkey] && c[c.interpolationkey] && (f = {
            ...f,
            [c.interpolationkey]: void 0
        });
        const d = o + JSON.stringify(f);
        let m = l[d];
        return m || (m = i(Wl(o), c),
        l[d] = m),
        m(r)
    }
}
  , gv = i => (l, r, o) => i(Wl(r), o)(l);
class pv {
    constructor(l={}) {
        this.logger = Yt.create("formatter"),
        this.options = l,
        this.init(l)
    }
    init(l, r={
        interpolation: {}
    }) {
        this.formatSeparator = r.interpolation.formatSeparator || ",";
        const o = r.cacheInBuiltFormats ? Km : gv;
        this.formats = {
            number: o( (c, f) => {
                const d = new Intl.NumberFormat(c,{
                    ...f
                });
                return m => d.format(m)
            }
            ),
            currency: o( (c, f) => {
                const d = new Intl.NumberFormat(c,{
                    ...f,
                    style: "currency"
                });
                return m => d.format(m)
            }
            ),
            datetime: o( (c, f) => {
                const d = new Intl.DateTimeFormat(c,{
                    ...f
                });
                return m => d.format(m)
            }
            ),
            relativetime: o( (c, f) => {
                const d = new Intl.RelativeTimeFormat(c,{
                    ...f
                });
                return m => d.format(m, f.range || "day")
            }
            ),
            list: o( (c, f) => {
                const d = new Intl.ListFormat(c,{
                    ...f
                });
                return m => d.format(m)
            }
            )
        }
    }
    add(l, r) {
        this.formats[l.toLowerCase().trim()] = r
    }
    addCached(l, r) {
        this.formats[l.toLowerCase().trim()] = Km(r)
    }
    format(l, r, o, c={}) {
        const f = r.split(this.formatSeparator);
        if (f.length > 1 && f[0].indexOf("(") > 1 && f[0].indexOf(")") < 0 && f.find(m => m.indexOf(")") > -1)) {
            const m = f.findIndex(p => p.indexOf(")") > -1);
            f[0] = [f[0], ...f.splice(1, m)].join(this.formatSeparator)
        }
        return f.reduce( (m, p) => {
            const {formatName: y, formatOptions: S} = mv(p);
            if (this.formats[y]) {
                let v = m;
                try {
                    const w = c?.formatParams?.[c.interpolationkey] || {}
                      , b = w.locale || w.lng || c.locale || c.lng || o;
                    v = this.formats[y](m, b, {
                        ...S,
                        ...c,
                        ...w
                    })
                } catch (w) {
                    this.logger.warn(w)
                }
                return v
            } else
                this.logger.warn(`there was no format function for ${y}`);
            return m
        }
        , l)
    }
}
const yv = (i, l) => {
    i.pending[l] !== void 0 && (delete i.pending[l],
    i.pendingCount--)
}
;
class xv extends Hs {
    constructor(l, r, o, c={}) {
        super(),
        this.backend = l,
        this.store = r,
        this.services = o,
        this.languageUtils = o.languageUtils,
        this.options = c,
        this.logger = Yt.create("backendConnector"),
        this.waitingReads = [],
        this.maxParallelReads = c.maxParallelReads || 10,
        this.readingCalls = 0,
        this.maxRetries = c.maxRetries >= 0 ? c.maxRetries : 5,
        this.retryTimeout = c.retryTimeout >= 1 ? c.retryTimeout : 350,
        this.state = {},
        this.queue = [],
        this.backend?.init?.(o, c.backend, c)
    }
    queueLoad(l, r, o, c) {
        const f = {}
          , d = {}
          , m = {}
          , p = {};
        return l.forEach(y => {
            let S = !0;
            r.forEach(v => {
                const w = `${y}|${v}`;
                !o.reload && this.store.hasResourceBundle(y, v) ? this.state[w] = 2 : this.state[w] < 0 || (this.state[w] === 1 ? d[w] === void 0 && (d[w] = !0) : (this.state[w] = 1,
                S = !1,
                d[w] === void 0 && (d[w] = !0),
                f[w] === void 0 && (f[w] = !0),
                p[v] === void 0 && (p[v] = !0)))
            }
            ),
            S || (m[y] = !0)
        }
        ),
        (Object.keys(f).length || Object.keys(d).length) && this.queue.push({
            pending: d,
            pendingCount: Object.keys(d).length,
            loaded: {},
            errors: [],
            callback: c
        }),
        {
            toLoad: Object.keys(f),
            pending: Object.keys(d),
            toLoadLanguages: Object.keys(m),
            toLoadNamespaces: Object.keys(p)
        }
    }
    loaded(l, r, o) {
        const c = l.split("|")
          , f = c[0]
          , d = c[1];
        r && this.emit("failedLoading", f, d, r),
        !r && o && this.store.addResourceBundle(f, d, o, void 0, void 0, {
            skipCopy: !0
        }),
        this.state[l] = r ? -1 : 2,
        r && o && (this.state[l] = 0);
        const m = {};
        this.queue.forEach(p => {
            nv(p.loaded, [f], d),
            yv(p, l),
            r && p.errors.push(r),
            p.pendingCount === 0 && !p.done && (Object.keys(p.loaded).forEach(y => {
                m[y] || (m[y] = {});
                const S = p.loaded[y];
                S.length && S.forEach(v => {
                    m[y][v] === void 0 && (m[y][v] = !0)
                }
                )
            }
            ),
            p.done = !0,
            p.errors.length ? p.callback(p.errors) : p.callback())
        }
        ),
        this.emit("loaded", m),
        this.queue = this.queue.filter(p => !p.done)
    }
    read(l, r, o, c=0, f=this.retryTimeout, d) {
        if (!l.length)
            return d(null, {});
        if (this.readingCalls >= this.maxParallelReads) {
            this.waitingReads.push({
                lng: l,
                ns: r,
                fcName: o,
                tried: c,
                wait: f,
                callback: d
            });
            return
        }
        this.readingCalls++;
        const m = (y, S) => {
            if (this.readingCalls--,
            this.waitingReads.length > 0) {
                const v = this.waitingReads.shift();
                this.read(v.lng, v.ns, v.fcName, v.tried, v.wait, v.callback)
            }
            if (y && S && c < this.maxRetries) {
                setTimeout( () => {
                    this.read.call(this, l, r, o, c + 1, f * 2, d)
                }
                , f);
                return
            }
            d(y, S)
        }
          , p = this.backend[o].bind(this.backend);
        if (p.length === 2) {
            try {
                const y = p(l, r);
                y && typeof y.then == "function" ? y.then(S => m(null, S)).catch(m) : m(null, y)
            } catch (y) {
                m(y)
            }
            return
        }
        return p(l, r, m)
    }
    prepareLoading(l, r, o={}, c) {
        if (!this.backend)
            return this.logger.warn("No backend was added via i18next.use. Will not load resources."),
            c && c();
        se(l) && (l = this.languageUtils.toResolveHierarchy(l)),
        se(r) && (r = [r]);
        const f = this.queueLoad(l, r, o, c);
        if (!f.toLoad.length)
            return f.pending.length || c(),
            null;
        f.toLoad.forEach(d => {
            this.loadOne(d)
        }
        )
    }
    load(l, r, o) {
        this.prepareLoading(l, r, {}, o)
    }
    reload(l, r, o) {
        this.prepareLoading(l, r, {
            reload: !0
        }, o)
    }
    loadOne(l, r="") {
        const o = l.split("|")
          , c = o[0]
          , f = o[1];
        this.read(c, f, "read", void 0, void 0, (d, m) => {
            d && this.logger.warn(`${r}loading namespace ${f} for language ${c} failed`, d),
            !d && m && this.logger.log(`${r}loaded namespace ${f} for language ${c}`, m),
            this.loaded(l, d, m)
        }
        )
    }
    saveMissing(l, r, o, c, f, d={}, m= () => {}
    ) {
        if (this.services?.utils?.hasLoadedNamespace && !this.services?.utils?.hasLoadedNamespace(r)) {
            this.logger.warn(`did not save key "${o}" as the namespace "${r}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
            return
        }
        if (!(o == null || o === "")) {
            if (this.backend?.create) {
                const p = {
                    ...d,
                    isUpdate: f
                }
                  , y = this.backend.create.bind(this.backend);
                if (y.length < 6)
                    try {
                        let S;
                        y.length === 5 ? S = y(l, r, o, c, p) : S = y(l, r, o, c),
                        S && typeof S.then == "function" ? S.then(v => m(null, v)).catch(m) : m(null, S)
                    } catch (S) {
                        m(S)
                    }
                else
                    y(l, r, o, c, m, p)
            }
            !l || !l[0] || this.store.addResource(l[0], r, o, c)
        }
    }
}
const Fm = () => ({
    debug: !1,
    initAsync: !0,
    ns: ["translation"],
    defaultNS: ["translation"],
    fallbackLng: ["dev"],
    fallbackNS: !1,
    supportedLngs: !1,
    nonExplicitSupportedLngs: !1,
    load: "all",
    preload: !1,
    simplifyPluralSuffix: !0,
    keySeparator: ".",
    nsSeparator: ":",
    pluralSeparator: "_",
    contextSeparator: "_",
    partialBundledLanguages: !1,
    saveMissing: !1,
    updateMissing: !1,
    saveMissingTo: "fallback",
    saveMissingPlurals: !0,
    missingKeyHandler: !1,
    missingInterpolationHandler: !1,
    postProcess: !1,
    postProcessPassResolved: !1,
    returnNull: !1,
    returnEmptyString: !0,
    returnObjects: !1,
    joinArrays: !1,
    returnedObjectHandler: !1,
    parseMissingKeyHandler: !1,
    appendNamespaceToMissingKey: !1,
    appendNamespaceToCIMode: !1,
    overloadTranslationOptionHandler: i => {
        let l = {};
        if (typeof i[1] == "object" && (l = i[1]),
        se(i[1]) && (l.defaultValue = i[1]),
        se(i[2]) && (l.tDescription = i[2]),
        typeof i[2] == "object" || typeof i[3] == "object") {
            const r = i[3] || i[2];
            Object.keys(r).forEach(o => {
                l[o] = r[o]
            }
            )
        }
        return l
    }
    ,
    interpolation: {
        escapeValue: !0,
        format: i => i,
        prefix: "{{",
        suffix: "}}",
        formatSeparator: ",",
        unescapePrefix: "-",
        nestingPrefix: "$t(",
        nestingSuffix: ")",
        nestingOptionsSeparator: ",",
        maxReplaces: 1e3,
        skipOnVariables: !0
    },
    cacheInBuiltFormats: !0
})
  , Jm = i => (se(i.ns) && (i.ns = [i.ns]),
se(i.fallbackLng) && (i.fallbackLng = [i.fallbackLng]),
se(i.fallbackNS) && (i.fallbackNS = [i.fallbackNS]),
i.supportedLngs?.indexOf?.("cimode") < 0 && (i.supportedLngs = i.supportedLngs.concat(["cimode"])),
typeof i.initImmediate == "boolean" && (i.initAsync = i.initImmediate),
i)
  , _s = () => {}
  , vv = i => {
    Object.getOwnPropertyNames(Object.getPrototypeOf(i)).forEach(r => {
        typeof i[r] == "function" && (i[r] = i[r].bind(i))
    }
    )
}
;
class Il extends Hs {
    constructor(l={}, r) {
        if (super(),
        this.options = Jm(l),
        this.services = {},
        this.logger = Yt,
        this.modules = {
            external: []
        },
        vv(this),
        r && !this.isInitialized && !l.isClone) {
            if (!this.options.initAsync)
                return this.init(l, r),
                this;
            setTimeout( () => {
                this.init(l, r)
            }
            , 0)
        }
    }
    init(l={}, r) {
        this.isInitializing = !0,
        typeof l == "function" && (r = l,
        l = {}),
        l.defaultNS == null && l.ns && (se(l.ns) ? l.defaultNS = l.ns : l.ns.indexOf("translation") < 0 && (l.defaultNS = l.ns[0]));
        const o = Fm();
        this.options = {
            ...o,
            ...this.options,
            ...Jm(l)
        },
        this.options.interpolation = {
            ...o.interpolation,
            ...this.options.interpolation
        },
        l.keySeparator !== void 0 && (this.options.userDefinedKeySeparator = l.keySeparator),
        l.nsSeparator !== void 0 && (this.options.userDefinedNsSeparator = l.nsSeparator);
        const c = y => y ? typeof y == "function" ? new y : y : null;
        if (!this.options.isClone) {
            this.modules.logger ? Yt.init(c(this.modules.logger), this.options) : Yt.init(null, this.options);
            let y;
            this.modules.formatter ? y = this.modules.formatter : y = pv;
            const S = new Vm(this.options);
            this.store = new km(this.options.resources,this.options);
            const v = this.services;
            v.logger = Yt,
            v.resourceStore = this.store,
            v.languageUtils = S,
            v.pluralResolver = new dv(S,{
                prepend: this.options.pluralSeparator,
                simplifyPluralSuffix: this.options.simplifyPluralSuffix
            }),
            this.options.interpolation.format && this.options.interpolation.format !== o.interpolation.format && this.logger.deprecate("init: you are still using the legacy format function, please use the new approach: https://www.i18next.com/translation-function/formatting"),
            y && (!this.options.interpolation.format || this.options.interpolation.format === o.interpolation.format) && (v.formatter = c(y),
            v.formatter.init && v.formatter.init(v, this.options),
            this.options.interpolation.format = v.formatter.format.bind(v.formatter)),
            v.interpolator = new hv(this.options),
            v.utils = {
                hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
            },
            v.backendConnector = new xv(c(this.modules.backend),v.resourceStore,v,this.options),
            v.backendConnector.on("*", (b, ...E) => {
                this.emit(b, ...E)
            }
            ),
            this.modules.languageDetector && (v.languageDetector = c(this.modules.languageDetector),
            v.languageDetector.init && v.languageDetector.init(v, this.options.detection, this.options)),
            this.modules.i18nFormat && (v.i18nFormat = c(this.modules.i18nFormat),
            v.i18nFormat.init && v.i18nFormat.init(this)),
            this.translator = new Ls(this.services,this.options),
            this.translator.on("*", (b, ...E) => {
                this.emit(b, ...E)
            }
            ),
            this.modules.external.forEach(b => {
                b.init && b.init(this)
            }
            )
        }
        if (this.format = this.options.interpolation.format,
        r || (r = _s),
        this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
            const y = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
            y.length > 0 && y[0] !== "dev" && (this.options.lng = y[0])
        }
        !this.services.languageDetector && !this.options.lng && this.logger.warn("init: no languageDetector is used and no lng is defined"),
        ["getResource", "hasResourceBundle", "getResourceBundle", "getDataByLanguage"].forEach(y => {
            this[y] = (...S) => this.store[y](...S)
        }
        ),
        ["addResource", "addResources", "addResourceBundle", "removeResourceBundle"].forEach(y => {
            this[y] = (...S) => (this.store[y](...S),
            this)
        }
        );
        const m = Ql()
          , p = () => {
            const y = (S, v) => {
                this.isInitializing = !1,
                this.isInitialized && !this.initializedStoreOnce && this.logger.warn("init: i18next is already initialized. You should call init just once!"),
                this.isInitialized = !0,
                this.options.isClone || this.logger.log("initialized", this.options),
                this.emit("initialized", this.options),
                m.resolve(v),
                r(S, v)
            }
            ;
            if (this.languages && !this.isInitialized)
                return y(null, this.t.bind(this));
            this.changeLanguage(this.options.lng, y)
        }
        ;
        return this.options.resources || !this.options.initAsync ? p() : setTimeout(p, 0),
        m
    }
    loadResources(l, r=_s) {
        let o = r;
        const c = se(l) ? l : this.language;
        if (typeof l == "function" && (o = l),
        !this.options.resources || this.options.partialBundledLanguages) {
            if (c?.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0))
                return o();
            const f = []
              , d = m => {
                if (!m || m === "cimode")
                    return;
                this.services.languageUtils.toResolveHierarchy(m).forEach(y => {
                    y !== "cimode" && f.indexOf(y) < 0 && f.push(y)
                }
                )
            }
            ;
            c ? d(c) : this.services.languageUtils.getFallbackCodes(this.options.fallbackLng).forEach(p => d(p)),
            this.options.preload?.forEach?.(m => d(m)),
            this.services.backendConnector.load(f, this.options.ns, m => {
                !m && !this.resolvedLanguage && this.language && this.setResolvedLanguage(this.language),
                o(m)
            }
            )
        } else
            o(null)
    }
    reloadResources(l, r, o) {
        const c = Ql();
        return typeof l == "function" && (o = l,
        l = void 0),
        typeof r == "function" && (o = r,
        r = void 0),
        l || (l = this.languages),
        r || (r = this.options.ns),
        o || (o = _s),
        this.services.backendConnector.reload(l, r, f => {
            c.resolve(),
            o(f)
        }
        ),
        c
    }
    use(l) {
        if (!l)
            throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
        if (!l.type)
            throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
        return l.type === "backend" && (this.modules.backend = l),
        (l.type === "logger" || l.log && l.warn && l.error) && (this.modules.logger = l),
        l.type === "languageDetector" && (this.modules.languageDetector = l),
        l.type === "i18nFormat" && (this.modules.i18nFormat = l),
        l.type === "postProcessor" && Qg.addPostProcessor(l),
        l.type === "formatter" && (this.modules.formatter = l),
        l.type === "3rdParty" && this.modules.external.push(l),
        this
    }
    setResolvedLanguage(l) {
        if (!(!l || !this.languages) && !(["cimode", "dev"].indexOf(l) > -1)) {
            for (let r = 0; r < this.languages.length; r++) {
                const o = this.languages[r];
                if (!(["cimode", "dev"].indexOf(o) > -1) && this.store.hasLanguageSomeTranslations(o)) {
                    this.resolvedLanguage = o;
                    break
                }
            }
            !this.resolvedLanguage && this.languages.indexOf(l) < 0 && this.store.hasLanguageSomeTranslations(l) && (this.resolvedLanguage = l,
            this.languages.unshift(l))
        }
    }
    changeLanguage(l, r) {
        this.isLanguageChangingTo = l;
        const o = Ql();
        this.emit("languageChanging", l);
        const c = m => {
            this.language = m,
            this.languages = this.services.languageUtils.toResolveHierarchy(m),
            this.resolvedLanguage = void 0,
            this.setResolvedLanguage(m)
        }
          , f = (m, p) => {
            p ? this.isLanguageChangingTo === l && (c(p),
            this.translator.changeLanguage(p),
            this.isLanguageChangingTo = void 0,
            this.emit("languageChanged", p),
            this.logger.log("languageChanged", p)) : this.isLanguageChangingTo = void 0,
            o.resolve( (...y) => this.t(...y)),
            r && r(m, (...y) => this.t(...y))
        }
          , d = m => {
            !l && !m && this.services.languageDetector && (m = []);
            const p = se(m) ? m : m && m[0]
              , y = this.store.hasLanguageSomeTranslations(p) ? p : this.services.languageUtils.getBestMatchFromCodes(se(m) ? [m] : m);
            y && (this.language || c(y),
            this.translator.language || this.translator.changeLanguage(y),
            this.services.languageDetector?.cacheUserLanguage?.(y)),
            this.loadResources(y, S => {
                f(S, y)
            }
            )
        }
        ;
        return !l && this.services.languageDetector && !this.services.languageDetector.async ? d(this.services.languageDetector.detect()) : !l && this.services.languageDetector && this.services.languageDetector.async ? this.services.languageDetector.detect.length === 0 ? this.services.languageDetector.detect().then(d) : this.services.languageDetector.detect(d) : d(l),
        o
    }
    getFixedT(l, r, o) {
        const c = (f, d, ...m) => {
            let p;
            typeof d != "object" ? p = this.options.overloadTranslationOptionHandler([f, d].concat(m)) : p = {
                ...d
            },
            p.lng = p.lng || c.lng,
            p.lngs = p.lngs || c.lngs,
            p.ns = p.ns || c.ns,
            p.keyPrefix !== "" && (p.keyPrefix = p.keyPrefix || o || c.keyPrefix);
            const y = this.options.keySeparator || ".";
            let S;
            return p.keyPrefix && Array.isArray(f) ? S = f.map(v => (typeof v == "function" && (v = zu(v, d)),
            `${p.keyPrefix}${y}${v}`)) : (typeof f == "function" && (f = zu(f, d)),
            S = p.keyPrefix ? `${p.keyPrefix}${y}${f}` : f),
            this.t(S, p)
        }
        ;
        return se(l) ? c.lng = l : c.lngs = l,
        c.ns = r,
        c.keyPrefix = o,
        c
    }
    t(...l) {
        return this.translator?.translate(...l)
    }
    exists(...l) {
        return this.translator?.exists(...l)
    }
    setDefaultNamespace(l) {
        this.options.defaultNS = l
    }
    hasLoadedNamespace(l, r={}) {
        if (!this.isInitialized)
            return this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages),
            !1;
        if (!this.languages || !this.languages.length)
            return this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages),
            !1;
        const o = r.lng || this.resolvedLanguage || this.languages[0]
          , c = this.options ? this.options.fallbackLng : !1
          , f = this.languages[this.languages.length - 1];
        if (o.toLowerCase() === "cimode")
            return !0;
        const d = (m, p) => {
            const y = this.services.backendConnector.state[`${m}|${p}`];
            return y === -1 || y === 0 || y === 2
        }
        ;
        if (r.precheck) {
            const m = r.precheck(this, d);
            if (m !== void 0)
                return m
        }
        return !!(this.hasResourceBundle(o, l) || !this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages || d(o, l) && (!c || d(f, l)))
    }
    loadNamespaces(l, r) {
        const o = Ql();
        return this.options.ns ? (se(l) && (l = [l]),
        l.forEach(c => {
            this.options.ns.indexOf(c) < 0 && this.options.ns.push(c)
        }
        ),
        this.loadResources(c => {
            o.resolve(),
            r && r(c)
        }
        ),
        o) : (r && r(),
        Promise.resolve())
    }
    loadLanguages(l, r) {
        const o = Ql();
        se(l) && (l = [l]);
        const c = this.options.preload || []
          , f = l.filter(d => c.indexOf(d) < 0 && this.services.languageUtils.isSupportedCode(d));
        return f.length ? (this.options.preload = c.concat(f),
        this.loadResources(d => {
            o.resolve(),
            r && r(d)
        }
        ),
        o) : (r && r(),
        Promise.resolve())
    }
    dir(l) {
        if (l || (l = this.resolvedLanguage || (this.languages?.length > 0 ? this.languages[0] : this.language)),
        !l)
            return "rtl";
        try {
            const c = new Intl.Locale(l);
            if (c && c.getTextInfo) {
                const f = c.getTextInfo();
                if (f && f.direction)
                    return f.direction
            }
        } catch {}
        const r = ["ar", "shu", "sqr", "ssh", "xaa", "yhd", "yud", "aao", "abh", "abv", "acm", "acq", "acw", "acx", "acy", "adf", "ads", "aeb", "aec", "afb", "ajp", "apc", "apd", "arb", "arq", "ars", "ary", "arz", "auz", "avl", "ayh", "ayl", "ayn", "ayp", "bbz", "pga", "he", "iw", "ps", "pbt", "pbu", "pst", "prp", "prd", "ug", "ur", "ydd", "yds", "yih", "ji", "yi", "hbo", "men", "xmn", "fa", "jpr", "peo", "pes", "prs", "dv", "sam", "ckb"]
          , o = this.services?.languageUtils || new Vm(Fm());
        return l.toLowerCase().indexOf("-latn") > 1 ? "ltr" : r.indexOf(o.getLanguagePartFromCode(l)) > -1 || l.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr"
    }
    static createInstance(l={}, r) {
        return new Il(l,r)
    }
    cloneInstance(l={}, r=_s) {
        const o = l.forkResourceStore;
        o && delete l.forkResourceStore;
        const c = {
            ...this.options,
            ...l,
            isClone: !0
        }
          , f = new Il(c);
        if ((l.debug !== void 0 || l.prefix !== void 0) && (f.logger = f.logger.clone(l)),
        ["store", "services", "language"].forEach(m => {
            f[m] = this[m]
        }
        ),
        f.services = {
            ...this.services
        },
        f.services.utils = {
            hasLoadedNamespace: f.hasLoadedNamespace.bind(f)
        },
        o) {
            const m = Object.keys(this.store.data).reduce( (p, y) => (p[y] = {
                ...this.store.data[y]
            },
            p[y] = Object.keys(p[y]).reduce( (S, v) => (S[v] = {
                ...p[y][v]
            },
            S), p[y]),
            p), {});
            f.store = new km(m,c),
            f.services.resourceStore = f.store
        }
        return f.translator = new Ls(f.services,c),
        f.translator.on("*", (m, ...p) => {
            f.emit(m, ...p)
        }
        ),
        f.init(c, r),
        f.translator.options = c,
        f.translator.backendConnector.services.utils = {
            hasLoadedNamespace: f.hasLoadedNamespace.bind(f)
        },
        f
    }
    toJSON() {
        return {
            options: this.options,
            store: this.store,
            language: this.language,
            languages: this.languages,
            resolvedLanguage: this.resolvedLanguage
        }
    }
}
const tt = Il.createInstance();
tt.createInstance = Il.createInstance;
tt.createInstance;
tt.dir;
tt.init;
tt.loadResources;
tt.reloadResources;
tt.use;
tt.changeLanguage;
tt.getFixedT;
tt.t;
tt.exists;
tt.setDefaultNamespace;
tt.hasLoadedNamespace;
tt.loadNamespaces;
tt.loadLanguages;
const bv = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g
  , Sv = {
    "&amp;": "&",
    "&#38;": "&",
    "&lt;": "<",
    "&#60;": "<",
    "&gt;": ">",
    "&#62;": ">",
    "&apos;": "'",
    "&#39;": "'",
    "&quot;": '"',
    "&#34;": '"',
    "&nbsp;": " ",
    "&#160;": " ",
    "&copy;": "©",
    "&#169;": "©",
    "&reg;": "®",
    "&#174;": "®",
    "&hellip;": "…",
    "&#8230;": "…",
    "&#x2F;": "/",
    "&#47;": "/"
}
  , wv = i => Sv[i]
  , Ev = i => i.replace(bv, wv);
let $m = {
    bindI18n: "languageChanged",
    bindI18nStore: "",
    transEmptyNodeValue: "",
    transSupportBasicHtmlNodes: !0,
    transWrapTextNodes: "",
    transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p"],
    useSuspense: !0,
    unescape: Ev
};
const Nv = (i={}) => {
    $m = {
        ...$m,
        ...i
    }
}
  , Cv = {
    type: "3rdParty",
    init(i) {
        Nv(i.options.react)
    }
}
  , _v = U.createContext();
function jv({i18n: i, defaultNS: l, children: r}) {
    const o = U.useMemo( () => ({
        i18n: i,
        defaultNS: l
    }), [i, l]);
    return U.createElement(_v.Provider, {
        value: o
    }, r)
}
const {slice: Av, forEach: Tv} = [];
function Ov(i) {
    return Tv.call(Av.call(arguments, 1), l => {
        if (l)
            for (const r in l)
                i[r] === void 0 && (i[r] = l[r])
    }
    ),
    i
}
function Rv(i) {
    return typeof i != "string" ? !1 : [/<\s*script.*?>/i, /<\s*\/\s*script\s*>/i, /<\s*img.*?on\w+\s*=/i, /<\s*\w+\s*on\w+\s*=.*?>/i, /javascript\s*:/i, /vbscript\s*:/i, /expression\s*\(/i, /eval\s*\(/i, /alert\s*\(/i, /document\.cookie/i, /document\.write\s*\(/i, /window\.location/i, /innerHTML/i].some(r => r.test(i))
}
const Wm = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/
  , Mv = function(i, l) {
    const o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
        path: "/"
    }
      , c = encodeURIComponent(l);
    let f = `${i}=${c}`;
    if (o.maxAge > 0) {
        const d = o.maxAge - 0;
        if (Number.isNaN(d))
            throw new Error("maxAge should be a Number");
        f += `; Max-Age=${Math.floor(d)}`
    }
    if (o.domain) {
        if (!Wm.test(o.domain))
            throw new TypeError("option domain is invalid");
        f += `; Domain=${o.domain}`
    }
    if (o.path) {
        if (!Wm.test(o.path))
            throw new TypeError("option path is invalid");
        f += `; Path=${o.path}`
    }
    if (o.expires) {
        if (typeof o.expires.toUTCString != "function")
            throw new TypeError("option expires is invalid");
        f += `; Expires=${o.expires.toUTCString()}`
    }
    if (o.httpOnly && (f += "; HttpOnly"),
    o.secure && (f += "; Secure"),
    o.sameSite)
        switch (typeof o.sameSite == "string" ? o.sameSite.toLowerCase() : o.sameSite) {
        case !0:
            f += "; SameSite=Strict";
            break;
        case "lax":
            f += "; SameSite=Lax";
            break;
        case "strict":
            f += "; SameSite=Strict";
            break;
        case "none":
            f += "; SameSite=None";
            break;
        default:
            throw new TypeError("option sameSite is invalid")
        }
    return o.partitioned && (f += "; Partitioned"),
    f
}
  , Im = {
    create(i, l, r, o) {
        let c = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : {
            path: "/",
            sameSite: "strict"
        };
        r && (c.expires = new Date,
        c.expires.setTime(c.expires.getTime() + r * 60 * 1e3)),
        o && (c.domain = o),
        document.cookie = Mv(i, l, c)
    },
    read(i) {
        const l = `${i}=`
          , r = document.cookie.split(";");
        for (let o = 0; o < r.length; o++) {
            let c = r[o];
            for (; c.charAt(0) === " "; )
                c = c.substring(1, c.length);
            if (c.indexOf(l) === 0)
                return c.substring(l.length, c.length)
        }
        return null
    },
    remove(i, l) {
        this.create(i, "", -1, l)
    }
};
var Dv = {
    name: "cookie",
    lookup(i) {
        let {lookupCookie: l} = i;
        if (l && typeof document < "u")
            return Im.read(l) || void 0
    },
    cacheUserLanguage(i, l) {
        let {lookupCookie: r, cookieMinutes: o, cookieDomain: c, cookieOptions: f} = l;
        r && typeof document < "u" && Im.create(r, i, o, c, f)
    }
}
  , Lv = {
    name: "querystring",
    lookup(i) {
        let {lookupQuerystring: l} = i, r;
        if (typeof window < "u") {
            let {search: o} = window.location;
            !window.location.search && window.location.hash?.indexOf("?") > -1 && (o = window.location.hash.substring(window.location.hash.indexOf("?")));
            const f = o.substring(1).split("&");
            for (let d = 0; d < f.length; d++) {
                const m = f[d].indexOf("=");
                m > 0 && f[d].substring(0, m) === l && (r = f[d].substring(m + 1))
            }
        }
        return r
    }
}
  , zv = {
    name: "hash",
    lookup(i) {
        let {lookupHash: l, lookupFromHashIndex: r} = i, o;
        if (typeof window < "u") {
            const {hash: c} = window.location;
            if (c && c.length > 2) {
                const f = c.substring(1);
                if (l) {
                    const d = f.split("&");
                    for (let m = 0; m < d.length; m++) {
                        const p = d[m].indexOf("=");
                        p > 0 && d[m].substring(0, p) === l && (o = d[m].substring(p + 1))
                    }
                }
                if (o)
                    return o;
                if (!o && r > -1) {
                    const d = c.match(/\/([a-zA-Z-]*)/g);
                    return Array.isArray(d) ? d[typeof r == "number" ? r : 0]?.replace("/", "") : void 0
                }
            }
        }
        return o
    }
};
let Ya = null;
const Pm = () => {
    if (Ya !== null)
        return Ya;
    try {
        if (Ya = typeof window < "u" && window.localStorage !== null,
        !Ya)
            return !1;
        const i = "i18next.translate.boo";
        window.localStorage.setItem(i, "foo"),
        window.localStorage.removeItem(i)
    } catch {
        Ya = !1
    }
    return Ya
}
;
var Uv = {
    name: "localStorage",
    lookup(i) {
        let {lookupLocalStorage: l} = i;
        if (l && Pm())
            return window.localStorage.getItem(l) || void 0
    },
    cacheUserLanguage(i, l) {
        let {lookupLocalStorage: r} = l;
        r && Pm() && window.localStorage.setItem(r, i)
    }
};
let Va = null;
const eg = () => {
    if (Va !== null)
        return Va;
    try {
        if (Va = typeof window < "u" && window.sessionStorage !== null,
        !Va)
            return !1;
        const i = "i18next.translate.boo";
        window.sessionStorage.setItem(i, "foo"),
        window.sessionStorage.removeItem(i)
    } catch {
        Va = !1
    }
    return Va
}
;
var Hv = {
    name: "sessionStorage",
    lookup(i) {
        let {lookupSessionStorage: l} = i;
        if (l && eg())
            return window.sessionStorage.getItem(l) || void 0
    },
    cacheUserLanguage(i, l) {
        let {lookupSessionStorage: r} = l;
        r && eg() && window.sessionStorage.setItem(r, i)
    }
}
  , Bv = {
    name: "navigator",
    lookup(i) {
        const l = [];
        if (typeof navigator < "u") {
            const {languages: r, userLanguage: o, language: c} = navigator;
            if (r)
                for (let f = 0; f < r.length; f++)
                    l.push(r[f]);
            o && l.push(o),
            c && l.push(c)
        }
        return l.length > 0 ? l : void 0
    }
}
  , qv = {
    name: "htmlTag",
    lookup(i) {
        let {htmlTag: l} = i, r;
        const o = l || (typeof document < "u" ? document.documentElement : null);
        return o && typeof o.getAttribute == "function" && (r = o.getAttribute("lang")),
        r
    }
}
  , kv = {
    name: "path",
    lookup(i) {
        let {lookupFromPathIndex: l} = i;
        if (typeof window > "u")
            return;
        const r = window.location.pathname.match(/\/([a-zA-Z-]*)/g);
        return Array.isArray(r) ? r[typeof l == "number" ? l : 0]?.replace("/", "") : void 0
    }
}
  , Gv = {
    name: "subdomain",
    lookup(i) {
        let {lookupFromSubdomainIndex: l} = i;
        const r = typeof l == "number" ? l + 1 : 1
          , o = typeof window < "u" && window.location?.hostname?.match(/^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i);
        if (o)
            return o[r]
    }
};
let Zg = !1;
try {
    document.cookie,
    Zg = !0
} catch {}
const Kg = ["querystring", "cookie", "localStorage", "sessionStorage", "navigator", "htmlTag"];
Zg || Kg.splice(1, 1);
const Yv = () => ({
    order: Kg,
    lookupQuerystring: "lng",
    lookupCookie: "i18next",
    lookupLocalStorage: "i18nextLng",
    lookupSessionStorage: "i18nextLng",
    caches: ["localStorage"],
    excludeCacheFor: ["cimode"],
    convertDetectedLanguage: i => i
});
class Fg {
    constructor(l) {
        let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        this.type = "languageDetector",
        this.detectors = {},
        this.init(l, r)
    }
    init() {
        let l = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {
            languageUtils: {}
        }
          , r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
          , o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        this.services = l,
        this.options = Ov(r, this.options || {}, Yv()),
        typeof this.options.convertDetectedLanguage == "string" && this.options.convertDetectedLanguage.indexOf("15897") > -1 && (this.options.convertDetectedLanguage = c => c.replace("-", "_")),
        this.options.lookupFromUrlIndex && (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
        this.i18nOptions = o,
        this.addDetector(Dv),
        this.addDetector(Lv),
        this.addDetector(Uv),
        this.addDetector(Hv),
        this.addDetector(Bv),
        this.addDetector(qv),
        this.addDetector(kv),
        this.addDetector(Gv),
        this.addDetector(zv)
    }
    addDetector(l) {
        return this.detectors[l.name] = l,
        this
    }
    detect() {
        let l = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.options.order
          , r = [];
        return l.forEach(o => {
            if (this.detectors[o]) {
                let c = this.detectors[o].lookup(this.options);
                c && typeof c == "string" && (c = [c]),
                c && (r = r.concat(c))
            }
        }
        ),
        r = r.filter(o => o != null && !Rv(o)).map(o => this.options.convertDetectedLanguage(o)),
        this.services && this.services.languageUtils && this.services.languageUtils.getBestMatchFromCodes ? r : r.length > 0 ? r[0] : null
    }
    cacheUserLanguage(l) {
        let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.options.caches;
        r && (this.options.excludeCacheFor && this.options.excludeCacheFor.indexOf(l) > -1 || r.forEach(o => {
            this.detectors[o] && this.detectors[o].cacheUserLanguage(l, this.options)
        }
        ))
    }
}
Fg.type = "languageDetector";
const tg = Object.assign({})
  , Jl = {};
Object.keys(tg).forEach(i => {
    const l = i.match(/\.\/([^/]+)\/([^/]+)\.ts$/);
    if (l) {
        const [,r] = l
          , o = tg[i];
        Jl[r] || (Jl[r] = {
            translation: {}
        }),
        o.default && (Jl[r].translation = {
            ...Jl[r].translation,
            ...o.default
        })
    }
}
);
tt.use(Fg).use(Cv).init({
    lng: "en",
    fallbackLng: "en",
    debug: !1,
    resources: Jl,
    interpolation: {
        escapeValue: !1
    }
});
var Cu = {
    exports: {}
}
  , Xl = {}
  , _u = {
    exports: {}
}
  , ju = {};
var ng;
function Vv() {
    return ng || (ng = 1,
    (function(i) {
        function l(z, X) {
            var ne = z.length;
            z.push(X);
            e: for (; 0 < ne; ) {
                var ve = ne - 1 >>> 1
                  , Ne = z[ve];
                if (0 < c(Ne, X))
                    z[ve] = X,
                    z[ne] = Ne,
                    ne = ve;
                else
                    break e
            }
        }
        function r(z) {
            return z.length === 0 ? null : z[0]
        }
        function o(z) {
            if (z.length === 0)
                return null;
            var X = z[0]
              , ne = z.pop();
            if (ne !== X) {
                z[0] = ne;
                e: for (var ve = 0, Ne = z.length, _ = Ne >>> 1; ve < _; ) {
                    var B = 2 * (ve + 1) - 1
                      , K = z[B]
                      , I = B + 1
                      , oe = z[I];
                    if (0 > c(K, ne))
                        I < Ne && 0 > c(oe, K) ? (z[ve] = oe,
                        z[I] = ne,
                        ve = I) : (z[ve] = K,
                        z[B] = ne,
                        ve = B);
                    else if (I < Ne && 0 > c(oe, ne))
                        z[ve] = oe,
                        z[I] = ne,
                        ve = I;
                    else
                        break e
                }
            }
            return X
        }
        function c(z, X) {
            var ne = z.sortIndex - X.sortIndex;
            return ne !== 0 ? ne : z.id - X.id
        }
        if (i.unstable_now = void 0,
        typeof performance == "object" && typeof performance.now == "function") {
            var f = performance;
            i.unstable_now = function() {
                return f.now()
            }
        } else {
            var d = Date
              , m = d.now();
            i.unstable_now = function() {
                return d.now() - m
            }
        }
        var p = []
          , y = []
          , S = 1
          , v = null
          , w = 3
          , b = !1
          , E = !1
          , A = !1
          , N = !1
          , D = typeof setTimeout == "function" ? setTimeout : null
          , k = typeof clearTimeout == "function" ? clearTimeout : null
          , G = typeof setImmediate < "u" ? setImmediate : null;
        function $(z) {
            for (var X = r(y); X !== null; ) {
                if (X.callback === null)
                    o(y);
                else if (X.startTime <= z)
                    o(y),
                    X.sortIndex = X.expirationTime,
                    l(p, X);
                else
                    break;
                X = r(y)
            }
        }
        function W(z) {
            if (A = !1,
            $(z),
            !E)
                if (r(p) !== null)
                    E = !0,
                    J || (J = !0,
                    F());
                else {
                    var X = r(y);
                    X !== null && de(W, X.startTime - z)
                }
        }
        var J = !1
          , Z = -1
          , ie = 5
          , we = -1;
        function V() {
            return N ? !0 : !(i.unstable_now() - we < ie)
        }
        function Q() {
            if (N = !1,
            J) {
                var z = i.unstable_now();
                we = z;
                var X = !0;
                try {
                    e: {
                        E = !1,
                        A && (A = !1,
                        k(Z),
                        Z = -1),
                        b = !0;
                        var ne = w;
                        try {
                            t: {
                                for ($(z),
                                v = r(p); v !== null && !(v.expirationTime > z && V()); ) {
                                    var ve = v.callback;
                                    if (typeof ve == "function") {
                                        v.callback = null,
                                        w = v.priorityLevel;
                                        var Ne = ve(v.expirationTime <= z);
                                        if (z = i.unstable_now(),
                                        typeof Ne == "function") {
                                            v.callback = Ne,
                                            $(z),
                                            X = !0;
                                            break t
                                        }
                                        v === r(p) && o(p),
                                        $(z)
                                    } else
                                        o(p);
                                    v = r(p)
                                }
                                if (v !== null)
                                    X = !0;
                                else {
                                    var _ = r(y);
                                    _ !== null && de(W, _.startTime - z),
                                    X = !1
                                }
                            }
                            break e
                        } finally {
                            v = null,
                            w = ne,
                            b = !1
                        }
                        X = void 0
                    }
                } finally {
                    X ? F() : J = !1
                }
            }
        }
        var F;
        if (typeof G == "function")
            F = function() {
                G(Q)
            }
            ;
        else if (typeof MessageChannel < "u") {
            var ae = new MessageChannel
              , ce = ae.port2;
            ae.port1.onmessage = Q,
            F = function() {
                ce.postMessage(null)
            }
        } else
            F = function() {
                D(Q, 0)
            }
            ;
        function de(z, X) {
            Z = D(function() {
                z(i.unstable_now())
            }, X)
        }
        i.unstable_IdlePriority = 5,
        i.unstable_ImmediatePriority = 1,
        i.unstable_LowPriority = 4,
        i.unstable_NormalPriority = 3,
        i.unstable_Profiling = null,
        i.unstable_UserBlockingPriority = 2,
        i.unstable_cancelCallback = function(z) {
            z.callback = null
        }
        ,
        i.unstable_forceFrameRate = function(z) {
            0 > z || 125 < z ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : ie = 0 < z ? Math.floor(1e3 / z) : 5
        }
        ,
        i.unstable_getCurrentPriorityLevel = function() {
            return w
        }
        ,
        i.unstable_next = function(z) {
            switch (w) {
            case 1:
            case 2:
            case 3:
                var X = 3;
                break;
            default:
                X = w
            }
            var ne = w;
            w = X;
            try {
                return z()
            } finally {
                w = ne
            }
        }
        ,
        i.unstable_requestPaint = function() {
            N = !0
        }
        ,
        i.unstable_runWithPriority = function(z, X) {
            switch (z) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                break;
            default:
                z = 3
            }
            var ne = w;
            w = z;
            try {
                return X()
            } finally {
                w = ne
            }
        }
        ,
        i.unstable_scheduleCallback = function(z, X, ne) {
            var ve = i.unstable_now();
            switch (typeof ne == "object" && ne !== null ? (ne = ne.delay,
            ne = typeof ne == "number" && 0 < ne ? ve + ne : ve) : ne = ve,
            z) {
            case 1:
                var Ne = -1;
                break;
            case 2:
                Ne = 250;
                break;
            case 5:
                Ne = 1073741823;
                break;
            case 4:
                Ne = 1e4;
                break;
            default:
                Ne = 5e3
            }
            return Ne = ne + Ne,
            z = {
                id: S++,
                callback: X,
                priorityLevel: z,
                startTime: ne,
                expirationTime: Ne,
                sortIndex: -1
            },
            ne > ve ? (z.sortIndex = ne,
            l(y, z),
            r(p) === null && z === r(y) && (A ? (k(Z),
            Z = -1) : A = !0,
            de(W, ne - ve))) : (z.sortIndex = Ne,
            l(p, z),
            E || b || (E = !0,
            J || (J = !0,
            F()))),
            z
        }
        ,
        i.unstable_shouldYield = V,
        i.unstable_wrapCallback = function(z) {
            var X = w;
            return function() {
                var ne = w;
                w = X;
                try {
                    return z.apply(this, arguments)
                } finally {
                    w = ne
                }
            }
        }
    }
    )(ju)),
    ju
}
var ag;
function Qv() {
    return ag || (ag = 1,
    _u.exports = Vv()),
    _u.exports
}
var Au = {
    exports: {}
}
  , nt = {};
var lg;
function Xv() {
    if (lg)
        return nt;
    lg = 1;
    var i = Zu();
    function l(p) {
        var y = "https://react.dev/errors/" + p;
        if (1 < arguments.length) {
            y += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var S = 2; S < arguments.length; S++)
                y += "&args[]=" + encodeURIComponent(arguments[S])
        }
        return "Minified React error #" + p + "; visit " + y + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }
    function r() {}
    var o = {
        d: {
            f: r,
            r: function() {
                throw Error(l(522))
            },
            D: r,
            C: r,
            L: r,
            m: r,
            X: r,
            S: r,
            M: r
        },
        p: 0,
        findDOMNode: null
    }
      , c = Symbol.for("react.portal");
    function f(p, y, S) {
        var v = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
        return {
            $$typeof: c,
            key: v == null ? null : "" + v,
            children: p,
            containerInfo: y,
            implementation: S
        }
    }
    var d = i.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function m(p, y) {
        if (p === "font")
            return "";
        if (typeof y == "string")
            return y === "use-credentials" ? y : ""
    }
    return nt.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = o,
    nt.createPortal = function(p, y) {
        var S = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!y || y.nodeType !== 1 && y.nodeType !== 9 && y.nodeType !== 11)
            throw Error(l(299));
        return f(p, y, null, S)
    }
    ,
    nt.flushSync = function(p) {
        var y = d.T
          , S = o.p;
        try {
            if (d.T = null,
            o.p = 2,
            p)
                return p()
        } finally {
            d.T = y,
            o.p = S,
            o.d.f()
        }
    }
    ,
    nt.preconnect = function(p, y) {
        typeof p == "string" && (y ? (y = y.crossOrigin,
        y = typeof y == "string" ? y === "use-credentials" ? y : "" : void 0) : y = null,
        o.d.C(p, y))
    }
    ,
    nt.prefetchDNS = function(p) {
        typeof p == "string" && o.d.D(p)
    }
    ,
    nt.preinit = function(p, y) {
        if (typeof p == "string" && y && typeof y.as == "string") {
            var S = y.as
              , v = m(S, y.crossOrigin)
              , w = typeof y.integrity == "string" ? y.integrity : void 0
              , b = typeof y.fetchPriority == "string" ? y.fetchPriority : void 0;
            S === "style" ? o.d.S(p, typeof y.precedence == "string" ? y.precedence : void 0, {
                crossOrigin: v,
                integrity: w,
                fetchPriority: b
            }) : S === "script" && o.d.X(p, {
                crossOrigin: v,
                integrity: w,
                fetchPriority: b,
                nonce: typeof y.nonce == "string" ? y.nonce : void 0
            })
        }
    }
    ,
    nt.preinitModule = function(p, y) {
        if (typeof p == "string")
            if (typeof y == "object" && y !== null) {
                if (y.as == null || y.as === "script") {
                    var S = m(y.as, y.crossOrigin);
                    o.d.M(p, {
                        crossOrigin: S,
                        integrity: typeof y.integrity == "string" ? y.integrity : void 0,
                        nonce: typeof y.nonce == "string" ? y.nonce : void 0
                    })
                }
            } else
                y == null && o.d.M(p)
    }
    ,
    nt.preload = function(p, y) {
        if (typeof p == "string" && typeof y == "object" && y !== null && typeof y.as == "string") {
            var S = y.as
              , v = m(S, y.crossOrigin);
            o.d.L(p, S, {
                crossOrigin: v,
                integrity: typeof y.integrity == "string" ? y.integrity : void 0,
                nonce: typeof y.nonce == "string" ? y.nonce : void 0,
                type: typeof y.type == "string" ? y.type : void 0,
                fetchPriority: typeof y.fetchPriority == "string" ? y.fetchPriority : void 0,
                referrerPolicy: typeof y.referrerPolicy == "string" ? y.referrerPolicy : void 0,
                imageSrcSet: typeof y.imageSrcSet == "string" ? y.imageSrcSet : void 0,
                imageSizes: typeof y.imageSizes == "string" ? y.imageSizes : void 0,
                media: typeof y.media == "string" ? y.media : void 0
            })
        }
    }
    ,
    nt.preloadModule = function(p, y) {
        if (typeof p == "string")
            if (y) {
                var S = m(y.as, y.crossOrigin);
                o.d.m(p, {
                    as: typeof y.as == "string" && y.as !== "script" ? y.as : void 0,
                    crossOrigin: S,
                    integrity: typeof y.integrity == "string" ? y.integrity : void 0
                })
            } else
                o.d.m(p)
    }
    ,
    nt.requestFormReset = function(p) {
        o.d.r(p)
    }
    ,
    nt.unstable_batchedUpdates = function(p, y) {
        return p(y)
    }
    ,
    nt.useFormState = function(p, y, S) {
        return d.H.useFormState(p, y, S)
    }
    ,
    nt.useFormStatus = function() {
        return d.H.useHostTransitionStatus()
    }
    ,
    nt.version = "19.2.4",
    nt
}
var ig;
function Zv() {
    if (ig)
        return Au.exports;
    ig = 1;
    function i() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
            try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i)
            } catch (l) {
                console.error(l)
            }
    }
    return i(),
    Au.exports = Xv(),
    Au.exports
}
var sg;
function Kv() {
    if (sg)
        return Xl;
    sg = 1;
    var i = Qv()
      , l = Zu()
      , r = Zv();
    function o(e) {
        var t = "https://react.dev/errors/" + e;
        if (1 < arguments.length) {
            t += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var n = 2; n < arguments.length; n++)
                t += "&args[]=" + encodeURIComponent(arguments[n])
        }
        return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }
    function c(e) {
        return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11)
    }
    function f(e) {
        var t = e
          , n = e;
        if (e.alternate)
            for (; t.return; )
                t = t.return;
        else {
            e = t;
            do
                t = e,
                (t.flags & 4098) !== 0 && (n = t.return),
                e = t.return;
            while (e)
        }
        return t.tag === 3 ? n : null
    }
    function d(e) {
        if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate,
            e !== null && (t = e.memoizedState)),
            t !== null)
                return t.dehydrated
        }
        return null
    }
    function m(e) {
        if (e.tag === 31) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate,
            e !== null && (t = e.memoizedState)),
            t !== null)
                return t.dehydrated
        }
        return null
    }
    function p(e) {
        if (f(e) !== e)
            throw Error(o(188))
    }
    function y(e) {
        var t = e.alternate;
        if (!t) {
            if (t = f(e),
            t === null)
                throw Error(o(188));
            return t !== e ? null : e
        }
        for (var n = e, a = t; ; ) {
            var s = n.return;
            if (s === null)
                break;
            var u = s.alternate;
            if (u === null) {
                if (a = s.return,
                a !== null) {
                    n = a;
                    continue
                }
                break
            }
            if (s.child === u.child) {
                for (u = s.child; u; ) {
                    if (u === n)
                        return p(s),
                        e;
                    if (u === a)
                        return p(s),
                        t;
                    u = u.sibling
                }
                throw Error(o(188))
            }
            if (n.return !== a.return)
                n = s,
                a = u;
            else {
                for (var h = !1, x = s.child; x; ) {
                    if (x === n) {
                        h = !0,
                        n = s,
                        a = u;
                        break
                    }
                    if (x === a) {
                        h = !0,
                        a = s,
                        n = u;
                        break
                    }
                    x = x.sibling
                }
                if (!h) {
                    for (x = u.child; x; ) {
                        if (x === n) {
                            h = !0,
                            n = u,
                            a = s;
                            break
                        }
                        if (x === a) {
                            h = !0,
                            a = u,
                            n = s;
                            break
                        }
                        x = x.sibling
                    }
                    if (!h)
                        throw Error(o(189))
                }
            }
            if (n.alternate !== a)
                throw Error(o(190))
        }
        if (n.tag !== 3)
            throw Error(o(188));
        return n.stateNode.current === n ? e : t
    }
    function S(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6)
            return e;
        for (e = e.child; e !== null; ) {
            if (t = S(e),
            t !== null)
                return t;
            e = e.sibling
        }
        return null
    }
    var v = Object.assign
      , w = Symbol.for("react.element")
      , b = Symbol.for("react.transitional.element")
      , E = Symbol.for("react.portal")
      , A = Symbol.for("react.fragment")
      , N = Symbol.for("react.strict_mode")
      , D = Symbol.for("react.profiler")
      , k = Symbol.for("react.consumer")
      , G = Symbol.for("react.context")
      , $ = Symbol.for("react.forward_ref")
      , W = Symbol.for("react.suspense")
      , J = Symbol.for("react.suspense_list")
      , Z = Symbol.for("react.memo")
      , ie = Symbol.for("react.lazy")
      , we = Symbol.for("react.activity")
      , V = Symbol.for("react.memo_cache_sentinel")
      , Q = Symbol.iterator;
    function F(e) {
        return e === null || typeof e != "object" ? null : (e = Q && e[Q] || e["@@iterator"],
        typeof e == "function" ? e : null)
    }
    var ae = Symbol.for("react.client.reference");
    function ce(e) {
        if (e == null)
            return null;
        if (typeof e == "function")
            return e.$$typeof === ae ? null : e.displayName || e.name || null;
        if (typeof e == "string")
            return e;
        switch (e) {
        case A:
            return "Fragment";
        case D:
            return "Profiler";
        case N:
            return "StrictMode";
        case W:
            return "Suspense";
        case J:
            return "SuspenseList";
        case we:
            return "Activity"
        }
        if (typeof e == "object")
            switch (e.$$typeof) {
            case E:
                return "Portal";
            case G:
                return e.displayName || "Context";
            case k:
                return (e._context.displayName || "Context") + ".Consumer";
            case $:
                var t = e.render;
                return e = e.displayName,
                e || (e = t.displayName || t.name || "",
                e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"),
                e;
            case Z:
                return t = e.displayName || null,
                t !== null ? t : ce(e.type) || "Memo";
            case ie:
                t = e._payload,
                e = e._init;
                try {
                    return ce(e(t))
                } catch {}
            }
        return null
    }
    var de = Array.isArray
      , z = l.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      , X = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      , ne = {
        pending: !1,
        data: null,
        method: null,
        action: null
    }
      , ve = []
      , Ne = -1;
    function _(e) {
        return {
            current: e
        }
    }
    function B(e) {
        0 > Ne || (e.current = ve[Ne],
        ve[Ne] = null,
        Ne--)
    }
    function K(e, t) {
        Ne++,
        ve[Ne] = e.current,
        e.current = t
    }
    var I = _(null)
      , oe = _(null)
      , he = _(null)
      , Ce = _(null);
    function at(e, t) {
        switch (K(he, t),
        K(oe, e),
        K(I, null),
        t.nodeType) {
        case 9:
        case 11:
            e = (e = t.documentElement) && (e = e.namespaceURI) ? _h(e) : 0;
            break;
        default:
            if (e = t.tagName,
            t = t.namespaceURI)
                t = _h(t),
                e = jh(t, e);
            else
                switch (e) {
                case "svg":
                    e = 1;
                    break;
                case "math":
                    e = 2;
                    break;
                default:
                    e = 0
                }
        }
        B(I),
        K(I, e)
    }
    function Be() {
        B(I),
        B(oe),
        B(he)
    }
    function Fa(e) {
        e.memoizedState !== null && K(Ce, e);
        var t = I.current
          , n = jh(t, e.type);
        t !== n && (K(oe, e),
        K(I, n))
    }
    function ai(e) {
        oe.current === e && (B(I),
        B(oe)),
        Ce.current === e && (B(Ce),
        Hl._currentValue = ne)
    }
    var Gs, tc;
    function Bn(e) {
        if (Gs === void 0)
            try {
                throw Error()
            } catch (n) {
                var t = n.stack.trim().match(/\n( *(at )?)/);
                Gs = t && t[1] || "",
                tc = -1 < n.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < n.stack.indexOf("@") ? "@unknown:0:0" : ""
            }
        return `
` + Gs + e + tc
    }
    var Ys = !1;
    function Vs(e, t) {
        if (!e || Ys)
            return "";
        Ys = !0;
        var n = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
            var a = {
                DetermineComponentFrameRoot: function() {
                    try {
                        if (t) {
                            var Y = function() {
                                throw Error()
                            };
                            if (Object.defineProperty(Y.prototype, "props", {
                                set: function() {
                                    throw Error()
                                }
                            }),
                            typeof Reflect == "object" && Reflect.construct) {
                                try {
                                    Reflect.construct(Y, [])
                                } catch (L) {
                                    var M = L
                                }
                                Reflect.construct(e, [], Y)
                            } else {
                                try {
                                    Y.call()
                                } catch (L) {
                                    M = L
                                }
                                e.call(Y.prototype)
                            }
                        } else {
                            try {
                                throw Error()
                            } catch (L) {
                                M = L
                            }
                            (Y = e()) && typeof Y.catch == "function" && Y.catch(function() {})
                        }
                    } catch (L) {
                        if (L && M && typeof L.stack == "string")
                            return [L.stack, M.stack]
                    }
                    return [null, null]
                }
            };
            a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
            var s = Object.getOwnPropertyDescriptor(a.DetermineComponentFrameRoot, "name");
            s && s.configurable && Object.defineProperty(a.DetermineComponentFrameRoot, "name", {
                value: "DetermineComponentFrameRoot"
            });
            var u = a.DetermineComponentFrameRoot()
              , h = u[0]
              , x = u[1];
            if (h && x) {
                var C = h.split(`
`)
                  , R = x.split(`
`);
                for (s = a = 0; a < C.length && !C[a].includes("DetermineComponentFrameRoot"); )
                    a++;
                for (; s < R.length && !R[s].includes("DetermineComponentFrameRoot"); )
                    s++;
                if (a === C.length || s === R.length)
                    for (a = C.length - 1,
                    s = R.length - 1; 1 <= a && 0 <= s && C[a] !== R[s]; )
                        s--;
                for (; 1 <= a && 0 <= s; a--,
                s--)
                    if (C[a] !== R[s]) {
                        if (a !== 1 || s !== 1)
                            do
                                if (a--,
                                s--,
                                0 > s || C[a] !== R[s]) {
                                    var H = `
` + C[a].replace(" at new ", " at ");
                                    return e.displayName && H.includes("<anonymous>") && (H = H.replace("<anonymous>", e.displayName)),
                                    H
                                }
                            while (1 <= a && 0 <= s);
                        break
                    }
            }
        } finally {
            Ys = !1,
            Error.prepareStackTrace = n
        }
        return (n = e ? e.displayName || e.name : "") ? Bn(n) : ""
    }
    function yp(e, t) {
        switch (e.tag) {
        case 26:
        case 27:
        case 5:
            return Bn(e.type);
        case 16:
            return Bn("Lazy");
        case 13:
            return e.child !== t && t !== null ? Bn("Suspense Fallback") : Bn("Suspense");
        case 19:
            return Bn("SuspenseList");
        case 0:
        case 15:
            return Vs(e.type, !1);
        case 11:
            return Vs(e.type.render, !1);
        case 1:
            return Vs(e.type, !0);
        case 31:
            return Bn("Activity");
        default:
            return ""
        }
    }
    function nc(e) {
        try {
            var t = ""
              , n = null;
            do
                t += yp(e, n),
                n = e,
                e = e.return;
            while (e);
            return t
        } catch (a) {
            return `
Error generating stack: ` + a.message + `
` + a.stack
        }
    }
    var Qs = Object.prototype.hasOwnProperty
      , Xs = i.unstable_scheduleCallback
      , Zs = i.unstable_cancelCallback
      , xp = i.unstable_shouldYield
      , vp = i.unstable_requestPaint
      , dt = i.unstable_now
      , bp = i.unstable_getCurrentPriorityLevel
      , ac = i.unstable_ImmediatePriority
      , lc = i.unstable_UserBlockingPriority
      , li = i.unstable_NormalPriority
      , Sp = i.unstable_LowPriority
      , ic = i.unstable_IdlePriority
      , wp = i.log
      , Ep = i.unstable_setDisableYieldValue
      , Ja = null
      , ht = null;
    function hn(e) {
        if (typeof wp == "function" && Ep(e),
        ht && typeof ht.setStrictMode == "function")
            try {
                ht.setStrictMode(Ja, e)
            } catch {}
    }
    var mt = Math.clz32 ? Math.clz32 : _p
      , Np = Math.log
      , Cp = Math.LN2;
    function _p(e) {
        return e >>>= 0,
        e === 0 ? 32 : 31 - (Np(e) / Cp | 0) | 0
    }
    var ii = 256
      , si = 262144
      , ri = 4194304;
    function qn(e) {
        var t = e & 42;
        if (t !== 0)
            return t;
        switch (e & -e) {
        case 1:
            return 1;
        case 2:
            return 2;
        case 4:
            return 4;
        case 8:
            return 8;
        case 16:
            return 16;
        case 32:
            return 32;
        case 64:
            return 64;
        case 128:
            return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
            return e & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return e & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            return e & 62914560;
        case 67108864:
            return 67108864;
        case 134217728:
            return 134217728;
        case 268435456:
            return 268435456;
        case 536870912:
            return 536870912;
        case 1073741824:
            return 0;
        default:
            return e
        }
    }
    function oi(e, t, n) {
        var a = e.pendingLanes;
        if (a === 0)
            return 0;
        var s = 0
          , u = e.suspendedLanes
          , h = e.pingedLanes;
        e = e.warmLanes;
        var x = a & 134217727;
        return x !== 0 ? (a = x & ~u,
        a !== 0 ? s = qn(a) : (h &= x,
        h !== 0 ? s = qn(h) : n || (n = x & ~e,
        n !== 0 && (s = qn(n))))) : (x = a & ~u,
        x !== 0 ? s = qn(x) : h !== 0 ? s = qn(h) : n || (n = a & ~e,
        n !== 0 && (s = qn(n)))),
        s === 0 ? 0 : t !== 0 && t !== s && (t & u) === 0 && (u = s & -s,
        n = t & -t,
        u >= n || u === 32 && (n & 4194048) !== 0) ? t : s
    }
    function $a(e, t) {
        return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0
    }
    function jp(e, t) {
        switch (e) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
            return t + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
            return -1;
        default:
            return -1
        }
    }
    function sc() {
        var e = ri;
        return ri <<= 1,
        (ri & 62914560) === 0 && (ri = 4194304),
        e
    }
    function Ks(e) {
        for (var t = [], n = 0; 31 > n; n++)
            t.push(e);
        return t
    }
    function Wa(e, t) {
        e.pendingLanes |= t,
        t !== 268435456 && (e.suspendedLanes = 0,
        e.pingedLanes = 0,
        e.warmLanes = 0)
    }
    function Ap(e, t, n, a, s, u) {
        var h = e.pendingLanes;
        e.pendingLanes = n,
        e.suspendedLanes = 0,
        e.pingedLanes = 0,
        e.warmLanes = 0,
        e.expiredLanes &= n,
        e.entangledLanes &= n,
        e.errorRecoveryDisabledLanes &= n,
        e.shellSuspendCounter = 0;
        var x = e.entanglements
          , C = e.expirationTimes
          , R = e.hiddenUpdates;
        for (n = h & ~n; 0 < n; ) {
            var H = 31 - mt(n)
              , Y = 1 << H;
            x[H] = 0,
            C[H] = -1;
            var M = R[H];
            if (M !== null)
                for (R[H] = null,
                H = 0; H < M.length; H++) {
                    var L = M[H];
                    L !== null && (L.lane &= -536870913)
                }
            n &= ~Y
        }
        a !== 0 && rc(e, a, 0),
        u !== 0 && s === 0 && e.tag !== 0 && (e.suspendedLanes |= u & ~(h & ~t))
    }
    function rc(e, t, n) {
        e.pendingLanes |= t,
        e.suspendedLanes &= ~t;
        var a = 31 - mt(t);
        e.entangledLanes |= t,
        e.entanglements[a] = e.entanglements[a] | 1073741824 | n & 261930
    }
    function oc(e, t) {
        var n = e.entangledLanes |= t;
        for (e = e.entanglements; n; ) {
            var a = 31 - mt(n)
              , s = 1 << a;
            s & t | e[a] & t && (e[a] |= t),
            n &= ~s
        }
    }
    function uc(e, t) {
        var n = t & -t;
        return n = (n & 42) !== 0 ? 1 : Fs(n),
        (n & (e.suspendedLanes | t)) !== 0 ? 0 : n
    }
    function Fs(e) {
        switch (e) {
        case 2:
            e = 1;
            break;
        case 8:
            e = 4;
            break;
        case 32:
            e = 16;
            break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            e = 128;
            break;
        case 268435456:
            e = 134217728;
            break;
        default:
            e = 0
        }
        return e
    }
    function Js(e) {
        return e &= -e,
        2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2
    }
    function cc() {
        var e = X.p;
        return e !== 0 ? e : (e = window.event,
        e === void 0 ? 32 : $h(e.type))
    }
    function fc(e, t) {
        var n = X.p;
        try {
            return X.p = e,
            t()
        } finally {
            X.p = n
        }
    }
    var mn = Math.random().toString(36).slice(2)
      , $e = "__reactFiber$" + mn
      , it = "__reactProps$" + mn
      , aa = "__reactContainer$" + mn
      , $s = "__reactEvents$" + mn
      , Tp = "__reactListeners$" + mn
      , Op = "__reactHandles$" + mn
      , dc = "__reactResources$" + mn
      , Ia = "__reactMarker$" + mn;
    function Ws(e) {
        delete e[$e],
        delete e[it],
        delete e[$s],
        delete e[Tp],
        delete e[Op]
    }
    function la(e) {
        var t = e[$e];
        if (t)
            return t;
        for (var n = e.parentNode; n; ) {
            if (t = n[aa] || n[$e]) {
                if (n = t.alternate,
                t.child !== null || n !== null && n.child !== null)
                    for (e = Lh(e); e !== null; ) {
                        if (n = e[$e])
                            return n;
                        e = Lh(e)
                    }
                return t
            }
            e = n,
            n = e.parentNode
        }
        return null
    }
    function ia(e) {
        if (e = e[$e] || e[aa]) {
            var t = e.tag;
            if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3)
                return e
        }
        return null
    }
    function Pa(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6)
            return e.stateNode;
        throw Error(o(33))
    }
    function sa(e) {
        var t = e[dc];
        return t || (t = e[dc] = {
            hoistableStyles: new Map,
            hoistableScripts: new Map
        }),
        t
    }
    function Ke(e) {
        e[Ia] = !0
    }
    var hc = new Set
      , mc = {};
    function kn(e, t) {
        ra(e, t),
        ra(e + "Capture", t)
    }
    function ra(e, t) {
        for (mc[e] = t,
        e = 0; e < t.length; e++)
            hc.add(t[e])
    }
    var Rp = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$")
      , gc = {}
      , pc = {};
    function Mp(e) {
        return Qs.call(pc, e) ? !0 : Qs.call(gc, e) ? !1 : Rp.test(e) ? pc[e] = !0 : (gc[e] = !0,
        !1)
    }
    function ui(e, t, n) {
        if (Mp(t))
            if (n === null)
                e.removeAttribute(t);
            else {
                switch (typeof n) {
                case "undefined":
                case "function":
                case "symbol":
                    e.removeAttribute(t);
                    return;
                case "boolean":
                    var a = t.toLowerCase().slice(0, 5);
                    if (a !== "data-" && a !== "aria-") {
                        e.removeAttribute(t);
                        return
                    }
                }
                e.setAttribute(t, "" + n)
            }
    }
    function ci(e, t, n) {
        if (n === null)
            e.removeAttribute(t);
        else {
            switch (typeof n) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                e.removeAttribute(t);
                return
            }
            e.setAttribute(t, "" + n)
        }
    }
    function Zt(e, t, n, a) {
        if (a === null)
            e.removeAttribute(n);
        else {
            switch (typeof a) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                e.removeAttribute(n);
                return
            }
            e.setAttributeNS(t, n, "" + a)
        }
    }
    function wt(e) {
        switch (typeof e) {
        case "bigint":
        case "boolean":
        case "number":
        case "string":
        case "undefined":
            return e;
        case "object":
            return e;
        default:
            return ""
        }
    }
    function yc(e) {
        var t = e.type;
        return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio")
    }
    function Dp(e, t, n) {
        var a = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
        if (!e.hasOwnProperty(t) && typeof a < "u" && typeof a.get == "function" && typeof a.set == "function") {
            var s = a.get
              , u = a.set;
            return Object.defineProperty(e, t, {
                configurable: !0,
                get: function() {
                    return s.call(this)
                },
                set: function(h) {
                    n = "" + h,
                    u.call(this, h)
                }
            }),
            Object.defineProperty(e, t, {
                enumerable: a.enumerable
            }),
            {
                getValue: function() {
                    return n
                },
                setValue: function(h) {
                    n = "" + h
                },
                stopTracking: function() {
                    e._valueTracker = null,
                    delete e[t]
                }
            }
        }
    }
    function Is(e) {
        if (!e._valueTracker) {
            var t = yc(e) ? "checked" : "value";
            e._valueTracker = Dp(e, t, "" + e[t])
        }
    }
    function xc(e) {
        if (!e)
            return !1;
        var t = e._valueTracker;
        if (!t)
            return !0;
        var n = t.getValue()
          , a = "";
        return e && (a = yc(e) ? e.checked ? "true" : "false" : e.value),
        e = a,
        e !== n ? (t.setValue(e),
        !0) : !1
    }
    function fi(e) {
        if (e = e || (typeof document < "u" ? document : void 0),
        typeof e > "u")
            return null;
        try {
            return e.activeElement || e.body
        } catch {
            return e.body
        }
    }
    var Lp = /[\n"\\]/g;
    function Et(e) {
        return e.replace(Lp, function(t) {
            return "\\" + t.charCodeAt(0).toString(16) + " "
        })
    }
    function Ps(e, t, n, a, s, u, h, x) {
        e.name = "",
        h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" ? e.type = h : e.removeAttribute("type"),
        t != null ? h === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + wt(t)) : e.value !== "" + wt(t) && (e.value = "" + wt(t)) : h !== "submit" && h !== "reset" || e.removeAttribute("value"),
        t != null ? er(e, h, wt(t)) : n != null ? er(e, h, wt(n)) : a != null && e.removeAttribute("value"),
        s == null && u != null && (e.defaultChecked = !!u),
        s != null && (e.checked = s && typeof s != "function" && typeof s != "symbol"),
        x != null && typeof x != "function" && typeof x != "symbol" && typeof x != "boolean" ? e.name = "" + wt(x) : e.removeAttribute("name")
    }
    function vc(e, t, n, a, s, u, h, x) {
        if (u != null && typeof u != "function" && typeof u != "symbol" && typeof u != "boolean" && (e.type = u),
        t != null || n != null) {
            if (!(u !== "submit" && u !== "reset" || t != null)) {
                Is(e);
                return
            }
            n = n != null ? "" + wt(n) : "",
            t = t != null ? "" + wt(t) : n,
            x || t === e.value || (e.value = t),
            e.defaultValue = t
        }
        a = a ?? s,
        a = typeof a != "function" && typeof a != "symbol" && !!a,
        e.checked = x ? e.checked : !!a,
        e.defaultChecked = !!a,
        h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" && (e.name = h),
        Is(e)
    }
    function er(e, t, n) {
        t === "number" && fi(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n)
    }
    function oa(e, t, n, a) {
        if (e = e.options,
        t) {
            t = {};
            for (var s = 0; s < n.length; s++)
                t["$" + n[s]] = !0;
            for (n = 0; n < e.length; n++)
                s = t.hasOwnProperty("$" + e[n].value),
                e[n].selected !== s && (e[n].selected = s),
                s && a && (e[n].defaultSelected = !0)
        } else {
            for (n = "" + wt(n),
            t = null,
            s = 0; s < e.length; s++) {
                if (e[s].value === n) {
                    e[s].selected = !0,
                    a && (e[s].defaultSelected = !0);
                    return
                }
                t !== null || e[s].disabled || (t = e[s])
            }
            t !== null && (t.selected = !0)
        }
    }
    function bc(e, t, n) {
        if (t != null && (t = "" + wt(t),
        t !== e.value && (e.value = t),
        n == null)) {
            e.defaultValue !== t && (e.defaultValue = t);
            return
        }
        e.defaultValue = n != null ? "" + wt(n) : ""
    }
    function Sc(e, t, n, a) {
        if (t == null) {
            if (a != null) {
                if (n != null)
                    throw Error(o(92));
                if (de(a)) {
                    if (1 < a.length)
                        throw Error(o(93));
                    a = a[0]
                }
                n = a
            }
            n == null && (n = ""),
            t = n
        }
        n = wt(t),
        e.defaultValue = n,
        a = e.textContent,
        a === n && a !== "" && a !== null && (e.value = a),
        Is(e)
    }
    function ua(e, t) {
        if (t) {
            var n = e.firstChild;
            if (n && n === e.lastChild && n.nodeType === 3) {
                n.nodeValue = t;
                return
            }
        }
        e.textContent = t
    }
    var zp = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
    function wc(e, t, n) {
        var a = t.indexOf("--") === 0;
        n == null || typeof n == "boolean" || n === "" ? a ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : a ? e.setProperty(t, n) : typeof n != "number" || n === 0 || zp.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px"
    }
    function Ec(e, t, n) {
        if (t != null && typeof t != "object")
            throw Error(o(62));
        if (e = e.style,
        n != null) {
            for (var a in n)
                !n.hasOwnProperty(a) || t != null && t.hasOwnProperty(a) || (a.indexOf("--") === 0 ? e.setProperty(a, "") : a === "float" ? e.cssFloat = "" : e[a] = "");
            for (var s in t)
                a = t[s],
                t.hasOwnProperty(s) && n[s] !== a && wc(e, s, a)
        } else
            for (var u in t)
                t.hasOwnProperty(u) && wc(e, u, t[u])
    }
    function tr(e) {
        if (e.indexOf("-") === -1)
            return !1;
        switch (e) {
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
            return !1;
        default:
            return !0
        }
    }
    var Up = new Map([["acceptCharset", "accept-charset"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"], ["crossOrigin", "crossorigin"], ["accentHeight", "accent-height"], ["alignmentBaseline", "alignment-baseline"], ["arabicForm", "arabic-form"], ["baselineShift", "baseline-shift"], ["capHeight", "cap-height"], ["clipPath", "clip-path"], ["clipRule", "clip-rule"], ["colorInterpolation", "color-interpolation"], ["colorInterpolationFilters", "color-interpolation-filters"], ["colorProfile", "color-profile"], ["colorRendering", "color-rendering"], ["dominantBaseline", "dominant-baseline"], ["enableBackground", "enable-background"], ["fillOpacity", "fill-opacity"], ["fillRule", "fill-rule"], ["floodColor", "flood-color"], ["floodOpacity", "flood-opacity"], ["fontFamily", "font-family"], ["fontSize", "font-size"], ["fontSizeAdjust", "font-size-adjust"], ["fontStretch", "font-stretch"], ["fontStyle", "font-style"], ["fontVariant", "font-variant"], ["fontWeight", "font-weight"], ["glyphName", "glyph-name"], ["glyphOrientationHorizontal", "glyph-orientation-horizontal"], ["glyphOrientationVertical", "glyph-orientation-vertical"], ["horizAdvX", "horiz-adv-x"], ["horizOriginX", "horiz-origin-x"], ["imageRendering", "image-rendering"], ["letterSpacing", "letter-spacing"], ["lightingColor", "lighting-color"], ["markerEnd", "marker-end"], ["markerMid", "marker-mid"], ["markerStart", "marker-start"], ["overlinePosition", "overline-position"], ["overlineThickness", "overline-thickness"], ["paintOrder", "paint-order"], ["panose-1", "panose-1"], ["pointerEvents", "pointer-events"], ["renderingIntent", "rendering-intent"], ["shapeRendering", "shape-rendering"], ["stopColor", "stop-color"], ["stopOpacity", "stop-opacity"], ["strikethroughPosition", "strikethrough-position"], ["strikethroughThickness", "strikethrough-thickness"], ["strokeDasharray", "stroke-dasharray"], ["strokeDashoffset", "stroke-dashoffset"], ["strokeLinecap", "stroke-linecap"], ["strokeLinejoin", "stroke-linejoin"], ["strokeMiterlimit", "stroke-miterlimit"], ["strokeOpacity", "stroke-opacity"], ["strokeWidth", "stroke-width"], ["textAnchor", "text-anchor"], ["textDecoration", "text-decoration"], ["textRendering", "text-rendering"], ["transformOrigin", "transform-origin"], ["underlinePosition", "underline-position"], ["underlineThickness", "underline-thickness"], ["unicodeBidi", "unicode-bidi"], ["unicodeRange", "unicode-range"], ["unitsPerEm", "units-per-em"], ["vAlphabetic", "v-alphabetic"], ["vHanging", "v-hanging"], ["vIdeographic", "v-ideographic"], ["vMathematical", "v-mathematical"], ["vectorEffect", "vector-effect"], ["vertAdvY", "vert-adv-y"], ["vertOriginX", "vert-origin-x"], ["vertOriginY", "vert-origin-y"], ["wordSpacing", "word-spacing"], ["writingMode", "writing-mode"], ["xmlnsXlink", "xmlns:xlink"], ["xHeight", "x-height"]])
      , Hp = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function di(e) {
        return Hp.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e
    }
    function Kt() {}
    var nr = null;
    function ar(e) {
        return e = e.target || e.srcElement || window,
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    }
    var ca = null
      , fa = null;
    function Nc(e) {
        var t = ia(e);
        if (t && (e = t.stateNode)) {
            var n = e[it] || null;
            e: switch (e = t.stateNode,
            t.type) {
            case "input":
                if (Ps(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name),
                t = n.name,
                n.type === "radio" && t != null) {
                    for (n = e; n.parentNode; )
                        n = n.parentNode;
                    for (n = n.querySelectorAll('input[name="' + Et("" + t) + '"][type="radio"]'),
                    t = 0; t < n.length; t++) {
                        var a = n[t];
                        if (a !== e && a.form === e.form) {
                            var s = a[it] || null;
                            if (!s)
                                throw Error(o(90));
                            Ps(a, s.value, s.defaultValue, s.defaultValue, s.checked, s.defaultChecked, s.type, s.name)
                        }
                    }
                    for (t = 0; t < n.length; t++)
                        a = n[t],
                        a.form === e.form && xc(a)
                }
                break e;
            case "textarea":
                bc(e, n.value, n.defaultValue);
                break e;
            case "select":
                t = n.value,
                t != null && oa(e, !!n.multiple, t, !1)
            }
        }
    }
    var lr = !1;
    function Cc(e, t, n) {
        if (lr)
            return e(t, n);
        lr = !0;
        try {
            var a = e(t);
            return a
        } finally {
            if (lr = !1,
            (ca !== null || fa !== null) && (Pi(),
            ca && (t = ca,
            e = fa,
            fa = ca = null,
            Nc(t),
            e)))
                for (t = 0; t < e.length; t++)
                    Nc(e[t])
        }
    }
    function el(e, t) {
        var n = e.stateNode;
        if (n === null)
            return null;
        var a = n[it] || null;
        if (a === null)
            return null;
        n = a[t];
        e: switch (t) {
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
        case "onMouseEnter":
            (a = !a.disabled) || (e = e.type,
            a = !(e === "button" || e === "input" || e === "select" || e === "textarea")),
            e = !a;
            break e;
        default:
            e = !1
        }
        if (e)
            return null;
        if (n && typeof n != "function")
            throw Error(o(231, t, typeof n));
        return n
    }
    var Ft = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u")
      , ir = !1;
    if (Ft)
        try {
            var tl = {};
            Object.defineProperty(tl, "passive", {
                get: function() {
                    ir = !0
                }
            }),
            window.addEventListener("test", tl, tl),
            window.removeEventListener("test", tl, tl)
        } catch {
            ir = !1
        }
    var gn = null
      , sr = null
      , hi = null;
    function _c() {
        if (hi)
            return hi;
        var e, t = sr, n = t.length, a, s = "value"in gn ? gn.value : gn.textContent, u = s.length;
        for (e = 0; e < n && t[e] === s[e]; e++)
            ;
        var h = n - e;
        for (a = 1; a <= h && t[n - a] === s[u - a]; a++)
            ;
        return hi = s.slice(e, 1 < a ? 1 - a : void 0)
    }
    function mi(e) {
        var t = e.keyCode;
        return "charCode"in e ? (e = e.charCode,
        e === 0 && t === 13 && (e = 13)) : e = t,
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
    }
    function gi() {
        return !0
    }
    function jc() {
        return !1
    }
    function st(e) {
        function t(n, a, s, u, h) {
            this._reactName = n,
            this._targetInst = s,
            this.type = a,
            this.nativeEvent = u,
            this.target = h,
            this.currentTarget = null;
            for (var x in e)
                e.hasOwnProperty(x) && (n = e[x],
                this[x] = n ? n(u) : u[x]);
            return this.isDefaultPrevented = (u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1) ? gi : jc,
            this.isPropagationStopped = jc,
            this
        }
        return v(t.prototype, {
            preventDefault: function() {
                this.defaultPrevented = !0;
                var n = this.nativeEvent;
                n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1),
                this.isDefaultPrevented = gi)
            },
            stopPropagation: function() {
                var n = this.nativeEvent;
                n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0),
                this.isPropagationStopped = gi)
            },
            persist: function() {},
            isPersistent: gi
        }),
        t
    }
    var Gn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function(e) {
            return e.timeStamp || Date.now()
        },
        defaultPrevented: 0,
        isTrusted: 0
    }, pi = st(Gn), nl = v({}, Gn, {
        view: 0,
        detail: 0
    }), Bp = st(nl), rr, or, al, yi = v({}, nl, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: cr,
        button: 0,
        buttons: 0,
        relatedTarget: function(e) {
            return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget
        },
        movementX: function(e) {
            return "movementX"in e ? e.movementX : (e !== al && (al && e.type === "mousemove" ? (rr = e.screenX - al.screenX,
            or = e.screenY - al.screenY) : or = rr = 0,
            al = e),
            rr)
        },
        movementY: function(e) {
            return "movementY"in e ? e.movementY : or
        }
    }), Ac = st(yi), qp = v({}, yi, {
        dataTransfer: 0
    }), kp = st(qp), Gp = v({}, nl, {
        relatedTarget: 0
    }), ur = st(Gp), Yp = v({}, Gn, {
        animationName: 0,
        elapsedTime: 0,
        pseudoElement: 0
    }), Vp = st(Yp), Qp = v({}, Gn, {
        clipboardData: function(e) {
            return "clipboardData"in e ? e.clipboardData : window.clipboardData
        }
    }), Xp = st(Qp), Zp = v({}, Gn, {
        data: 0
    }), Tc = st(Zp), Kp = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
    }, Fp = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
    }, Jp = {
        Alt: "altKey",
        Control: "ctrlKey",
        Meta: "metaKey",
        Shift: "shiftKey"
    };
    function $p(e) {
        var t = this.nativeEvent;
        return t.getModifierState ? t.getModifierState(e) : (e = Jp[e]) ? !!t[e] : !1
    }
    function cr() {
        return $p
    }
    var Wp = v({}, nl, {
        key: function(e) {
            if (e.key) {
                var t = Kp[e.key] || e.key;
                if (t !== "Unidentified")
                    return t
            }
            return e.type === "keypress" ? (e = mi(e),
            e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Fp[e.keyCode] || "Unidentified" : ""
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: cr,
        charCode: function(e) {
            return e.type === "keypress" ? mi(e) : 0
        },
        keyCode: function(e) {
            return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
        },
        which: function(e) {
            return e.type === "keypress" ? mi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
        }
    })
      , Ip = st(Wp)
      , Pp = v({}, yi, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0
    })
      , Oc = st(Pp)
      , e0 = v({}, nl, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: cr
    })
      , t0 = st(e0)
      , n0 = v({}, Gn, {
        propertyName: 0,
        elapsedTime: 0,
        pseudoElement: 0
    })
      , a0 = st(n0)
      , l0 = v({}, yi, {
        deltaX: function(e) {
            return "deltaX"in e ? e.deltaX : "wheelDeltaX"in e ? -e.wheelDeltaX : 0
        },
        deltaY: function(e) {
            return "deltaY"in e ? e.deltaY : "wheelDeltaY"in e ? -e.wheelDeltaY : "wheelDelta"in e ? -e.wheelDelta : 0
        },
        deltaZ: 0,
        deltaMode: 0
    })
      , i0 = st(l0)
      , s0 = v({}, Gn, {
        newState: 0,
        oldState: 0
    })
      , r0 = st(s0)
      , o0 = [9, 13, 27, 32]
      , fr = Ft && "CompositionEvent"in window
      , ll = null;
    Ft && "documentMode"in document && (ll = document.documentMode);
    var u0 = Ft && "TextEvent"in window && !ll
      , Rc = Ft && (!fr || ll && 8 < ll && 11 >= ll)
      , Mc = " "
      , Dc = !1;
    function Lc(e, t) {
        switch (e) {
        case "keyup":
            return o0.indexOf(t.keyCode) !== -1;
        case "keydown":
            return t.keyCode !== 229;
        case "keypress":
        case "mousedown":
        case "focusout":
            return !0;
        default:
            return !1
        }
    }
    function zc(e) {
        return e = e.detail,
        typeof e == "object" && "data"in e ? e.data : null
    }
    var da = !1;
    function c0(e, t) {
        switch (e) {
        case "compositionend":
            return zc(t);
        case "keypress":
            return t.which !== 32 ? null : (Dc = !0,
            Mc);
        case "textInput":
            return e = t.data,
            e === Mc && Dc ? null : e;
        default:
            return null
        }
    }
    function f0(e, t) {
        if (da)
            return e === "compositionend" || !fr && Lc(e, t) ? (e = _c(),
            hi = sr = gn = null,
            da = !1,
            e) : null;
        switch (e) {
        case "paste":
            return null;
        case "keypress":
            if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
                if (t.char && 1 < t.char.length)
                    return t.char;
                if (t.which)
                    return String.fromCharCode(t.which)
            }
            return null;
        case "compositionend":
            return Rc && t.locale !== "ko" ? null : t.data;
        default:
            return null
        }
    }
    var d0 = {
        color: !0,
        date: !0,
        datetime: !0,
        "datetime-local": !0,
        email: !0,
        month: !0,
        number: !0,
        password: !0,
        range: !0,
        search: !0,
        tel: !0,
        text: !0,
        time: !0,
        url: !0,
        week: !0
    };
    function Uc(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t === "input" ? !!d0[e.type] : t === "textarea"
    }
    function Hc(e, t, n, a) {
        ca ? fa ? fa.push(a) : fa = [a] : ca = a,
        t = ss(t, "onChange"),
        0 < t.length && (n = new pi("onChange","change",null,n,a),
        e.push({
            event: n,
            listeners: t
        }))
    }
    var il = null
      , sl = null;
    function h0(e) {
        bh(e, 0)
    }
    function xi(e) {
        var t = Pa(e);
        if (xc(t))
            return e
    }
    function Bc(e, t) {
        if (e === "change")
            return t
    }
    var qc = !1;
    if (Ft) {
        var dr;
        if (Ft) {
            var hr = "oninput"in document;
            if (!hr) {
                var kc = document.createElement("div");
                kc.setAttribute("oninput", "return;"),
                hr = typeof kc.oninput == "function"
            }
            dr = hr
        } else
            dr = !1;
        qc = dr && (!document.documentMode || 9 < document.documentMode)
    }
    function Gc() {
        il && (il.detachEvent("onpropertychange", Yc),
        sl = il = null)
    }
    function Yc(e) {
        if (e.propertyName === "value" && xi(sl)) {
            var t = [];
            Hc(t, sl, e, ar(e)),
            Cc(h0, t)
        }
    }
    function m0(e, t, n) {
        e === "focusin" ? (Gc(),
        il = t,
        sl = n,
        il.attachEvent("onpropertychange", Yc)) : e === "focusout" && Gc()
    }
    function g0(e) {
        if (e === "selectionchange" || e === "keyup" || e === "keydown")
            return xi(sl)
    }
    function p0(e, t) {
        if (e === "click")
            return xi(t)
    }
    function y0(e, t) {
        if (e === "input" || e === "change")
            return xi(t)
    }
    function x0(e, t) {
        return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t
    }
    var gt = typeof Object.is == "function" ? Object.is : x0;
    function rl(e, t) {
        if (gt(e, t))
            return !0;
        if (typeof e != "object" || e === null || typeof t != "object" || t === null)
            return !1;
        var n = Object.keys(e)
          , a = Object.keys(t);
        if (n.length !== a.length)
            return !1;
        for (a = 0; a < n.length; a++) {
            var s = n[a];
            if (!Qs.call(t, s) || !gt(e[s], t[s]))
                return !1
        }
        return !0
    }
    function Vc(e) {
        for (; e && e.firstChild; )
            e = e.firstChild;
        return e
    }
    function Qc(e, t) {
        var n = Vc(e);
        e = 0;
        for (var a; n; ) {
            if (n.nodeType === 3) {
                if (a = e + n.textContent.length,
                e <= t && a >= t)
                    return {
                        node: n,
                        offset: t - e
                    };
                e = a
            }
            e: {
                for (; n; ) {
                    if (n.nextSibling) {
                        n = n.nextSibling;
                        break e
                    }
                    n = n.parentNode
                }
                n = void 0
            }
            n = Vc(n)
        }
    }
    function Xc(e, t) {
        return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Xc(e, t.parentNode) : "contains"in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1
    }
    function Zc(e) {
        e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
        for (var t = fi(e.document); t instanceof e.HTMLIFrameElement; ) {
            try {
                var n = typeof t.contentWindow.location.href == "string"
            } catch {
                n = !1
            }
            if (n)
                e = t.contentWindow;
            else
                break;
            t = fi(e.document)
        }
        return t
    }
    function mr(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true")
    }
    var v0 = Ft && "documentMode"in document && 11 >= document.documentMode
      , ha = null
      , gr = null
      , ol = null
      , pr = !1;
    function Kc(e, t, n) {
        var a = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
        pr || ha == null || ha !== fi(a) || (a = ha,
        "selectionStart"in a && mr(a) ? a = {
            start: a.selectionStart,
            end: a.selectionEnd
        } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(),
        a = {
            anchorNode: a.anchorNode,
            anchorOffset: a.anchorOffset,
            focusNode: a.focusNode,
            focusOffset: a.focusOffset
        }),
        ol && rl(ol, a) || (ol = a,
        a = ss(gr, "onSelect"),
        0 < a.length && (t = new pi("onSelect","select",null,t,n),
        e.push({
            event: t,
            listeners: a
        }),
        t.target = ha)))
    }
    function Yn(e, t) {
        var n = {};
        return n[e.toLowerCase()] = t.toLowerCase(),
        n["Webkit" + e] = "webkit" + t,
        n["Moz" + e] = "moz" + t,
        n
    }
    var ma = {
        animationend: Yn("Animation", "AnimationEnd"),
        animationiteration: Yn("Animation", "AnimationIteration"),
        animationstart: Yn("Animation", "AnimationStart"),
        transitionrun: Yn("Transition", "TransitionRun"),
        transitionstart: Yn("Transition", "TransitionStart"),
        transitioncancel: Yn("Transition", "TransitionCancel"),
        transitionend: Yn("Transition", "TransitionEnd")
    }
      , yr = {}
      , Fc = {};
    Ft && (Fc = document.createElement("div").style,
    "AnimationEvent"in window || (delete ma.animationend.animation,
    delete ma.animationiteration.animation,
    delete ma.animationstart.animation),
    "TransitionEvent"in window || delete ma.transitionend.transition);
    function Vn(e) {
        if (yr[e])
            return yr[e];
        if (!ma[e])
            return e;
        var t = ma[e], n;
        for (n in t)
            if (t.hasOwnProperty(n) && n in Fc)
                return yr[e] = t[n];
        return e
    }
    var Jc = Vn("animationend")
      , $c = Vn("animationiteration")
      , Wc = Vn("animationstart")
      , b0 = Vn("transitionrun")
      , S0 = Vn("transitionstart")
      , w0 = Vn("transitioncancel")
      , Ic = Vn("transitionend")
      , Pc = new Map
      , xr = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
    xr.push("scrollEnd");
    function Dt(e, t) {
        Pc.set(e, t),
        kn(t, [e])
    }
    var vi = typeof reportError == "function" ? reportError : function(e) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var t = new window.ErrorEvent("error",{
                bubbles: !0,
                cancelable: !0,
                message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
                error: e
            });
            if (!window.dispatchEvent(t))
                return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", e);
            return
        }
        console.error(e)
    }
      , Nt = []
      , ga = 0
      , vr = 0;
    function bi() {
        for (var e = ga, t = vr = ga = 0; t < e; ) {
            var n = Nt[t];
            Nt[t++] = null;
            var a = Nt[t];
            Nt[t++] = null;
            var s = Nt[t];
            Nt[t++] = null;
            var u = Nt[t];
            if (Nt[t++] = null,
            a !== null && s !== null) {
                var h = a.pending;
                h === null ? s.next = s : (s.next = h.next,
                h.next = s),
                a.pending = s
            }
            u !== 0 && ef(n, s, u)
        }
    }
    function Si(e, t, n, a) {
        Nt[ga++] = e,
        Nt[ga++] = t,
        Nt[ga++] = n,
        Nt[ga++] = a,
        vr |= a,
        e.lanes |= a,
        e = e.alternate,
        e !== null && (e.lanes |= a)
    }
    function br(e, t, n, a) {
        return Si(e, t, n, a),
        wi(e)
    }
    function Qn(e, t) {
        return Si(e, null, null, t),
        wi(e)
    }
    function ef(e, t, n) {
        e.lanes |= n;
        var a = e.alternate;
        a !== null && (a.lanes |= n);
        for (var s = !1, u = e.return; u !== null; )
            u.childLanes |= n,
            a = u.alternate,
            a !== null && (a.childLanes |= n),
            u.tag === 22 && (e = u.stateNode,
            e === null || e._visibility & 1 || (s = !0)),
            e = u,
            u = u.return;
        return e.tag === 3 ? (u = e.stateNode,
        s && t !== null && (s = 31 - mt(n),
        e = u.hiddenUpdates,
        a = e[s],
        a === null ? e[s] = [t] : a.push(t),
        t.lane = n | 536870912),
        u) : null
    }
    function wi(e) {
        if (50 < Ol)
            throw Ol = 0,
            Oo = null,
            Error(o(185));
        for (var t = e.return; t !== null; )
            e = t,
            t = e.return;
        return e.tag === 3 ? e.stateNode : null
    }
    var pa = {};
    function E0(e, t, n, a) {
        this.tag = e,
        this.key = n,
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null,
        this.index = 0,
        this.refCleanup = this.ref = null,
        this.pendingProps = t,
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null,
        this.mode = a,
        this.subtreeFlags = this.flags = 0,
        this.deletions = null,
        this.childLanes = this.lanes = 0,
        this.alternate = null
    }
    function pt(e, t, n, a) {
        return new E0(e,t,n,a)
    }
    function Sr(e) {
        return e = e.prototype,
        !(!e || !e.isReactComponent)
    }
    function Jt(e, t) {
        var n = e.alternate;
        return n === null ? (n = pt(e.tag, t, e.key, e.mode),
        n.elementType = e.elementType,
        n.type = e.type,
        n.stateNode = e.stateNode,
        n.alternate = e,
        e.alternate = n) : (n.pendingProps = t,
        n.type = e.type,
        n.flags = 0,
        n.subtreeFlags = 0,
        n.deletions = null),
        n.flags = e.flags & 65011712,
        n.childLanes = e.childLanes,
        n.lanes = e.lanes,
        n.child = e.child,
        n.memoizedProps = e.memoizedProps,
        n.memoizedState = e.memoizedState,
        n.updateQueue = e.updateQueue,
        t = e.dependencies,
        n.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        },
        n.sibling = e.sibling,
        n.index = e.index,
        n.ref = e.ref,
        n.refCleanup = e.refCleanup,
        n
    }
    function tf(e, t) {
        e.flags &= 65011714;
        var n = e.alternate;
        return n === null ? (e.childLanes = 0,
        e.lanes = t,
        e.child = null,
        e.subtreeFlags = 0,
        e.memoizedProps = null,
        e.memoizedState = null,
        e.updateQueue = null,
        e.dependencies = null,
        e.stateNode = null) : (e.childLanes = n.childLanes,
        e.lanes = n.lanes,
        e.child = n.child,
        e.subtreeFlags = 0,
        e.deletions = null,
        e.memoizedProps = n.memoizedProps,
        e.memoizedState = n.memoizedState,
        e.updateQueue = n.updateQueue,
        e.type = n.type,
        t = n.dependencies,
        e.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        }),
        e
    }
    function Ei(e, t, n, a, s, u) {
        var h = 0;
        if (a = e,
        typeof e == "function")
            Sr(e) && (h = 1);
        else if (typeof e == "string")
            h = Ay(e, n, I.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
        else
            e: switch (e) {
            case we:
                return e = pt(31, n, t, s),
                e.elementType = we,
                e.lanes = u,
                e;
            case A:
                return Xn(n.children, s, u, t);
            case N:
                h = 8,
                s |= 24;
                break;
            case D:
                return e = pt(12, n, t, s | 2),
                e.elementType = D,
                e.lanes = u,
                e;
            case W:
                return e = pt(13, n, t, s),
                e.elementType = W,
                e.lanes = u,
                e;
            case J:
                return e = pt(19, n, t, s),
                e.elementType = J,
                e.lanes = u,
                e;
            default:
                if (typeof e == "object" && e !== null)
                    switch (e.$$typeof) {
                    case G:
                        h = 10;
                        break e;
                    case k:
                        h = 9;
                        break e;
                    case $:
                        h = 11;
                        break e;
                    case Z:
                        h = 14;
                        break e;
                    case ie:
                        h = 16,
                        a = null;
                        break e
                    }
                h = 29,
                n = Error(o(130, e === null ? "null" : typeof e, "")),
                a = null
            }
        return t = pt(h, n, t, s),
        t.elementType = e,
        t.type = a,
        t.lanes = u,
        t
    }
    function Xn(e, t, n, a) {
        return e = pt(7, e, a, t),
        e.lanes = n,
        e
    }
    function wr(e, t, n) {
        return e = pt(6, e, null, t),
        e.lanes = n,
        e
    }
    function nf(e) {
        var t = pt(18, null, null, 0);
        return t.stateNode = e,
        t
    }
    function Er(e, t, n) {
        return t = pt(4, e.children !== null ? e.children : [], e.key, t),
        t.lanes = n,
        t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation
        },
        t
    }
    var af = new WeakMap;
    function Ct(e, t) {
        if (typeof e == "object" && e !== null) {
            var n = af.get(e);
            return n !== void 0 ? n : (t = {
                value: e,
                source: t,
                stack: nc(t)
            },
            af.set(e, t),
            t)
        }
        return {
            value: e,
            source: t,
            stack: nc(t)
        }
    }
    var ya = []
      , xa = 0
      , Ni = null
      , ul = 0
      , _t = []
      , jt = 0
      , pn = null
      , Ht = 1
      , Bt = "";
    function $t(e, t) {
        ya[xa++] = ul,
        ya[xa++] = Ni,
        Ni = e,
        ul = t
    }
    function lf(e, t, n) {
        _t[jt++] = Ht,
        _t[jt++] = Bt,
        _t[jt++] = pn,
        pn = e;
        var a = Ht;
        e = Bt;
        var s = 32 - mt(a) - 1;
        a &= ~(1 << s),
        n += 1;
        var u = 32 - mt(t) + s;
        if (30 < u) {
            var h = s - s % 5;
            u = (a & (1 << h) - 1).toString(32),
            a >>= h,
            s -= h,
            Ht = 1 << 32 - mt(t) + s | n << s | a,
            Bt = u + e
        } else
            Ht = 1 << u | n << s | a,
            Bt = e
    }
    function Nr(e) {
        e.return !== null && ($t(e, 1),
        lf(e, 1, 0))
    }
    function Cr(e) {
        for (; e === Ni; )
            Ni = ya[--xa],
            ya[xa] = null,
            ul = ya[--xa],
            ya[xa] = null;
        for (; e === pn; )
            pn = _t[--jt],
            _t[jt] = null,
            Bt = _t[--jt],
            _t[jt] = null,
            Ht = _t[--jt],
            _t[jt] = null
    }
    function sf(e, t) {
        _t[jt++] = Ht,
        _t[jt++] = Bt,
        _t[jt++] = pn,
        Ht = t.id,
        Bt = t.overflow,
        pn = e
    }
    var We = null
      , De = null
      , xe = !1
      , yn = null
      , At = !1
      , _r = Error(o(519));
    function xn(e) {
        var t = Error(o(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", ""));
        throw cl(Ct(t, e)),
        _r
    }
    function rf(e) {
        var t = e.stateNode
          , n = e.type
          , a = e.memoizedProps;
        switch (t[$e] = e,
        t[it] = a,
        n) {
        case "dialog":
            ge("cancel", t),
            ge("close", t);
            break;
        case "iframe":
        case "object":
        case "embed":
            ge("load", t);
            break;
        case "video":
        case "audio":
            for (n = 0; n < Ml.length; n++)
                ge(Ml[n], t);
            break;
        case "source":
            ge("error", t);
            break;
        case "img":
        case "image":
        case "link":
            ge("error", t),
            ge("load", t);
            break;
        case "details":
            ge("toggle", t);
            break;
        case "input":
            ge("invalid", t),
            vc(t, a.value, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name, !0);
            break;
        case "select":
            ge("invalid", t);
            break;
        case "textarea":
            ge("invalid", t),
            Sc(t, a.value, a.defaultValue, a.children)
        }
        n = a.children,
        typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || a.suppressHydrationWarning === !0 || Nh(t.textContent, n) ? (a.popover != null && (ge("beforetoggle", t),
        ge("toggle", t)),
        a.onScroll != null && ge("scroll", t),
        a.onScrollEnd != null && ge("scrollend", t),
        a.onClick != null && (t.onclick = Kt),
        t = !0) : t = !1,
        t || xn(e, !0)
    }
    function of(e) {
        for (We = e.return; We; )
            switch (We.tag) {
            case 5:
            case 31:
            case 13:
                At = !1;
                return;
            case 27:
            case 3:
                At = !0;
                return;
            default:
                We = We.return
            }
    }
    function va(e) {
        if (e !== We)
            return !1;
        if (!xe)
            return of(e),
            xe = !0,
            !1;
        var t = e.tag, n;
        if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type,
        n = !(n !== "form" && n !== "button") || Xo(e.type, e.memoizedProps)),
        n = !n),
        n && De && xn(e),
        of(e),
        t === 13) {
            if (e = e.memoizedState,
            e = e !== null ? e.dehydrated : null,
            !e)
                throw Error(o(317));
            De = Dh(e)
        } else if (t === 31) {
            if (e = e.memoizedState,
            e = e !== null ? e.dehydrated : null,
            !e)
                throw Error(o(317));
            De = Dh(e)
        } else
            t === 27 ? (t = De,
            Mn(e.type) ? (e = $o,
            $o = null,
            De = e) : De = t) : De = We ? Ot(e.stateNode.nextSibling) : null;
        return !0
    }
    function Zn() {
        De = We = null,
        xe = !1
    }
    function jr() {
        var e = yn;
        return e !== null && (ct === null ? ct = e : ct.push.apply(ct, e),
        yn = null),
        e
    }
    function cl(e) {
        yn === null ? yn = [e] : yn.push(e)
    }
    var Ar = _(null)
      , Kn = null
      , Wt = null;
    function vn(e, t, n) {
        K(Ar, t._currentValue),
        t._currentValue = n
    }
    function It(e) {
        e._currentValue = Ar.current,
        B(Ar)
    }
    function Tr(e, t, n) {
        for (; e !== null; ) {
            var a = e.alternate;
            if ((e.childLanes & t) !== t ? (e.childLanes |= t,
            a !== null && (a.childLanes |= t)) : a !== null && (a.childLanes & t) !== t && (a.childLanes |= t),
            e === n)
                break;
            e = e.return
        }
    }
    function Or(e, t, n, a) {
        var s = e.child;
        for (s !== null && (s.return = e); s !== null; ) {
            var u = s.dependencies;
            if (u !== null) {
                var h = s.child;
                u = u.firstContext;
                e: for (; u !== null; ) {
                    var x = u;
                    u = s;
                    for (var C = 0; C < t.length; C++)
                        if (x.context === t[C]) {
                            u.lanes |= n,
                            x = u.alternate,
                            x !== null && (x.lanes |= n),
                            Tr(u.return, n, e),
                            a || (h = null);
                            break e
                        }
                    u = x.next
                }
            } else if (s.tag === 18) {
                if (h = s.return,
                h === null)
                    throw Error(o(341));
                h.lanes |= n,
                u = h.alternate,
                u !== null && (u.lanes |= n),
                Tr(h, n, e),
                h = null
            } else
                h = s.child;
            if (h !== null)
                h.return = s;
            else
                for (h = s; h !== null; ) {
                    if (h === e) {
                        h = null;
                        break
                    }
                    if (s = h.sibling,
                    s !== null) {
                        s.return = h.return,
                        h = s;
                        break
                    }
                    h = h.return
                }
            s = h
        }
    }
    function ba(e, t, n, a) {
        e = null;
        for (var s = t, u = !1; s !== null; ) {
            if (!u) {
                if ((s.flags & 524288) !== 0)
                    u = !0;
                else if ((s.flags & 262144) !== 0)
                    break
            }
            if (s.tag === 10) {
                var h = s.alternate;
                if (h === null)
                    throw Error(o(387));
                if (h = h.memoizedProps,
                h !== null) {
                    var x = s.type;
                    gt(s.pendingProps.value, h.value) || (e !== null ? e.push(x) : e = [x])
                }
            } else if (s === Ce.current) {
                if (h = s.alternate,
                h === null)
                    throw Error(o(387));
                h.memoizedState.memoizedState !== s.memoizedState.memoizedState && (e !== null ? e.push(Hl) : e = [Hl])
            }
            s = s.return
        }
        e !== null && Or(t, e, n, a),
        t.flags |= 262144
    }
    function Ci(e) {
        for (e = e.firstContext; e !== null; ) {
            if (!gt(e.context._currentValue, e.memoizedValue))
                return !0;
            e = e.next
        }
        return !1
    }
    function Fn(e) {
        Kn = e,
        Wt = null,
        e = e.dependencies,
        e !== null && (e.firstContext = null)
    }
    function Ie(e) {
        return uf(Kn, e)
    }
    function _i(e, t) {
        return Kn === null && Fn(e),
        uf(e, t)
    }
    function uf(e, t) {
        var n = t._currentValue;
        if (t = {
            context: t,
            memoizedValue: n,
            next: null
        },
        Wt === null) {
            if (e === null)
                throw Error(o(308));
            Wt = t,
            e.dependencies = {
                lanes: 0,
                firstContext: t
            },
            e.flags |= 524288
        } else
            Wt = Wt.next = t;
        return n
    }
    var N0 = typeof AbortController < "u" ? AbortController : function() {
        var e = []
          , t = this.signal = {
            aborted: !1,
            addEventListener: function(n, a) {
                e.push(a)
            }
        };
        this.abort = function() {
            t.aborted = !0,
            e.forEach(function(n) {
                return n()
            })
        }
    }
      , C0 = i.unstable_scheduleCallback
      , _0 = i.unstable_NormalPriority
      , Ge = {
        $$typeof: G,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0
    };
    function Rr() {
        return {
            controller: new N0,
            data: new Map,
            refCount: 0
        }
    }
    function fl(e) {
        e.refCount--,
        e.refCount === 0 && C0(_0, function() {
            e.controller.abort()
        })
    }
    var dl = null
      , Mr = 0
      , Sa = 0
      , wa = null;
    function j0(e, t) {
        if (dl === null) {
            var n = dl = [];
            Mr = 0,
            Sa = Uo(),
            wa = {
                status: "pending",
                value: void 0,
                then: function(a) {
                    n.push(a)
                }
            }
        }
        return Mr++,
        t.then(cf, cf),
        t
    }
    function cf() {
        if (--Mr === 0 && dl !== null) {
            wa !== null && (wa.status = "fulfilled");
            var e = dl;
            dl = null,
            Sa = 0,
            wa = null;
            for (var t = 0; t < e.length; t++)
                (0,
                e[t])()
        }
    }
    function A0(e, t) {
        var n = []
          , a = {
            status: "pending",
            value: null,
            reason: null,
            then: function(s) {
                n.push(s)
            }
        };
        return e.then(function() {
            a.status = "fulfilled",
            a.value = t;
            for (var s = 0; s < n.length; s++)
                (0,
                n[s])(t)
        }, function(s) {
            for (a.status = "rejected",
            a.reason = s,
            s = 0; s < n.length; s++)
                (0,
                n[s])(void 0)
        }),
        a
    }
    var ff = z.S;
    z.S = function(e, t) {
        Fd = dt(),
        typeof t == "object" && t !== null && typeof t.then == "function" && j0(e, t),
        ff !== null && ff(e, t)
    }
    ;
    var Jn = _(null);
    function Dr() {
        var e = Jn.current;
        return e !== null ? e : Re.pooledCache
    }
    function ji(e, t) {
        t === null ? K(Jn, Jn.current) : K(Jn, t.pool)
    }
    function df() {
        var e = Dr();
        return e === null ? null : {
            parent: Ge._currentValue,
            pool: e
        }
    }
    var Ea = Error(o(460))
      , Lr = Error(o(474))
      , Ai = Error(o(542))
      , Ti = {
        then: function() {}
    };
    function hf(e) {
        return e = e.status,
        e === "fulfilled" || e === "rejected"
    }
    function mf(e, t, n) {
        switch (n = e[n],
        n === void 0 ? e.push(t) : n !== t && (t.then(Kt, Kt),
        t = n),
        t.status) {
        case "fulfilled":
            return t.value;
        case "rejected":
            throw e = t.reason,
            pf(e),
            e;
        default:
            if (typeof t.status == "string")
                t.then(Kt, Kt);
            else {
                if (e = Re,
                e !== null && 100 < e.shellSuspendCounter)
                    throw Error(o(482));
                e = t,
                e.status = "pending",
                e.then(function(a) {
                    if (t.status === "pending") {
                        var s = t;
                        s.status = "fulfilled",
                        s.value = a
                    }
                }, function(a) {
                    if (t.status === "pending") {
                        var s = t;
                        s.status = "rejected",
                        s.reason = a
                    }
                })
            }
            switch (t.status) {
            case "fulfilled":
                return t.value;
            case "rejected":
                throw e = t.reason,
                pf(e),
                e
            }
            throw Wn = t,
            Ea
        }
    }
    function $n(e) {
        try {
            var t = e._init;
            return t(e._payload)
        } catch (n) {
            throw n !== null && typeof n == "object" && typeof n.then == "function" ? (Wn = n,
            Ea) : n
        }
    }
    var Wn = null;
    function gf() {
        if (Wn === null)
            throw Error(o(459));
        var e = Wn;
        return Wn = null,
        e
    }
    function pf(e) {
        if (e === Ea || e === Ai)
            throw Error(o(483))
    }
    var Na = null
      , hl = 0;
    function Oi(e) {
        var t = hl;
        return hl += 1,
        Na === null && (Na = []),
        mf(Na, e, t)
    }
    function ml(e, t) {
        t = t.props.ref,
        e.ref = t !== void 0 ? t : null
    }
    function Ri(e, t) {
        throw t.$$typeof === w ? Error(o(525)) : (e = Object.prototype.toString.call(t),
        Error(o(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)))
    }
    function yf(e) {
        function t(T, j) {
            if (e) {
                var O = T.deletions;
                O === null ? (T.deletions = [j],
                T.flags |= 16) : O.push(j)
            }
        }
        function n(T, j) {
            if (!e)
                return null;
            for (; j !== null; )
                t(T, j),
                j = j.sibling;
            return null
        }
        function a(T) {
            for (var j = new Map; T !== null; )
                T.key !== null ? j.set(T.key, T) : j.set(T.index, T),
                T = T.sibling;
            return j
        }
        function s(T, j) {
            return T = Jt(T, j),
            T.index = 0,
            T.sibling = null,
            T
        }
        function u(T, j, O) {
            return T.index = O,
            e ? (O = T.alternate,
            O !== null ? (O = O.index,
            O < j ? (T.flags |= 67108866,
            j) : O) : (T.flags |= 67108866,
            j)) : (T.flags |= 1048576,
            j)
        }
        function h(T) {
            return e && T.alternate === null && (T.flags |= 67108866),
            T
        }
        function x(T, j, O, q) {
            return j === null || j.tag !== 6 ? (j = wr(O, T.mode, q),
            j.return = T,
            j) : (j = s(j, O),
            j.return = T,
            j)
        }
        function C(T, j, O, q) {
            var te = O.type;
            return te === A ? H(T, j, O.props.children, q, O.key) : j !== null && (j.elementType === te || typeof te == "object" && te !== null && te.$$typeof === ie && $n(te) === j.type) ? (j = s(j, O.props),
            ml(j, O),
            j.return = T,
            j) : (j = Ei(O.type, O.key, O.props, null, T.mode, q),
            ml(j, O),
            j.return = T,
            j)
        }
        function R(T, j, O, q) {
            return j === null || j.tag !== 4 || j.stateNode.containerInfo !== O.containerInfo || j.stateNode.implementation !== O.implementation ? (j = Er(O, T.mode, q),
            j.return = T,
            j) : (j = s(j, O.children || []),
            j.return = T,
            j)
        }
        function H(T, j, O, q, te) {
            return j === null || j.tag !== 7 ? (j = Xn(O, T.mode, q, te),
            j.return = T,
            j) : (j = s(j, O),
            j.return = T,
            j)
        }
        function Y(T, j, O) {
            if (typeof j == "string" && j !== "" || typeof j == "number" || typeof j == "bigint")
                return j = wr("" + j, T.mode, O),
                j.return = T,
                j;
            if (typeof j == "object" && j !== null) {
                switch (j.$$typeof) {
                case b:
                    return O = Ei(j.type, j.key, j.props, null, T.mode, O),
                    ml(O, j),
                    O.return = T,
                    O;
                case E:
                    return j = Er(j, T.mode, O),
                    j.return = T,
                    j;
                case ie:
                    return j = $n(j),
                    Y(T, j, O)
                }
                if (de(j) || F(j))
                    return j = Xn(j, T.mode, O, null),
                    j.return = T,
                    j;
                if (typeof j.then == "function")
                    return Y(T, Oi(j), O);
                if (j.$$typeof === G)
                    return Y(T, _i(T, j), O);
                Ri(T, j)
            }
            return null
        }
        function M(T, j, O, q) {
            var te = j !== null ? j.key : null;
            if (typeof O == "string" && O !== "" || typeof O == "number" || typeof O == "bigint")
                return te !== null ? null : x(T, j, "" + O, q);
            if (typeof O == "object" && O !== null) {
                switch (O.$$typeof) {
                case b:
                    return O.key === te ? C(T, j, O, q) : null;
                case E:
                    return O.key === te ? R(T, j, O, q) : null;
                case ie:
                    return O = $n(O),
                    M(T, j, O, q)
                }
                if (de(O) || F(O))
                    return te !== null ? null : H(T, j, O, q, null);
                if (typeof O.then == "function")
                    return M(T, j, Oi(O), q);
                if (O.$$typeof === G)
                    return M(T, j, _i(T, O), q);
                Ri(T, O)
            }
            return null
        }
        function L(T, j, O, q, te) {
            if (typeof q == "string" && q !== "" || typeof q == "number" || typeof q == "bigint")
                return T = T.get(O) || null,
                x(j, T, "" + q, te);
            if (typeof q == "object" && q !== null) {
                switch (q.$$typeof) {
                case b:
                    return T = T.get(q.key === null ? O : q.key) || null,
                    C(j, T, q, te);
                case E:
                    return T = T.get(q.key === null ? O : q.key) || null,
                    R(j, T, q, te);
                case ie:
                    return q = $n(q),
                    L(T, j, O, q, te)
                }
                if (de(q) || F(q))
                    return T = T.get(O) || null,
                    H(j, T, q, te, null);
                if (typeof q.then == "function")
                    return L(T, j, O, Oi(q), te);
                if (q.$$typeof === G)
                    return L(T, j, O, _i(j, q), te);
                Ri(j, q)
            }
            return null
        }
        function P(T, j, O, q) {
            for (var te = null, be = null, ee = j, fe = j = 0, ye = null; ee !== null && fe < O.length; fe++) {
                ee.index > fe ? (ye = ee,
                ee = null) : ye = ee.sibling;
                var Se = M(T, ee, O[fe], q);
                if (Se === null) {
                    ee === null && (ee = ye);
                    break
                }
                e && ee && Se.alternate === null && t(T, ee),
                j = u(Se, j, fe),
                be === null ? te = Se : be.sibling = Se,
                be = Se,
                ee = ye
            }
            if (fe === O.length)
                return n(T, ee),
                xe && $t(T, fe),
                te;
            if (ee === null) {
                for (; fe < O.length; fe++)
                    ee = Y(T, O[fe], q),
                    ee !== null && (j = u(ee, j, fe),
                    be === null ? te = ee : be.sibling = ee,
                    be = ee);
                return xe && $t(T, fe),
                te
            }
            for (ee = a(ee); fe < O.length; fe++)
                ye = L(ee, T, fe, O[fe], q),
                ye !== null && (e && ye.alternate !== null && ee.delete(ye.key === null ? fe : ye.key),
                j = u(ye, j, fe),
                be === null ? te = ye : be.sibling = ye,
                be = ye);
            return e && ee.forEach(function(Hn) {
                return t(T, Hn)
            }),
            xe && $t(T, fe),
            te
        }
        function le(T, j, O, q) {
            if (O == null)
                throw Error(o(151));
            for (var te = null, be = null, ee = j, fe = j = 0, ye = null, Se = O.next(); ee !== null && !Se.done; fe++,
            Se = O.next()) {
                ee.index > fe ? (ye = ee,
                ee = null) : ye = ee.sibling;
                var Hn = M(T, ee, Se.value, q);
                if (Hn === null) {
                    ee === null && (ee = ye);
                    break
                }
                e && ee && Hn.alternate === null && t(T, ee),
                j = u(Hn, j, fe),
                be === null ? te = Hn : be.sibling = Hn,
                be = Hn,
                ee = ye
            }
            if (Se.done)
                return n(T, ee),
                xe && $t(T, fe),
                te;
            if (ee === null) {
                for (; !Se.done; fe++,
                Se = O.next())
                    Se = Y(T, Se.value, q),
                    Se !== null && (j = u(Se, j, fe),
                    be === null ? te = Se : be.sibling = Se,
                    be = Se);
                return xe && $t(T, fe),
                te
            }
            for (ee = a(ee); !Se.done; fe++,
            Se = O.next())
                Se = L(ee, T, fe, Se.value, q),
                Se !== null && (e && Se.alternate !== null && ee.delete(Se.key === null ? fe : Se.key),
                j = u(Se, j, fe),
                be === null ? te = Se : be.sibling = Se,
                be = Se);
            return e && ee.forEach(function(qy) {
                return t(T, qy)
            }),
            xe && $t(T, fe),
            te
        }
        function Oe(T, j, O, q) {
            if (typeof O == "object" && O !== null && O.type === A && O.key === null && (O = O.props.children),
            typeof O == "object" && O !== null) {
                switch (O.$$typeof) {
                case b:
                    e: {
                        for (var te = O.key; j !== null; ) {
                            if (j.key === te) {
                                if (te = O.type,
                                te === A) {
                                    if (j.tag === 7) {
                                        n(T, j.sibling),
                                        q = s(j, O.props.children),
                                        q.return = T,
                                        T = q;
                                        break e
                                    }
                                } else if (j.elementType === te || typeof te == "object" && te !== null && te.$$typeof === ie && $n(te) === j.type) {
                                    n(T, j.sibling),
                                    q = s(j, O.props),
                                    ml(q, O),
                                    q.return = T,
                                    T = q;
                                    break e
                                }
                                n(T, j);
                                break
                            } else
                                t(T, j);
                            j = j.sibling
                        }
                        O.type === A ? (q = Xn(O.props.children, T.mode, q, O.key),
                        q.return = T,
                        T = q) : (q = Ei(O.type, O.key, O.props, null, T.mode, q),
                        ml(q, O),
                        q.return = T,
                        T = q)
                    }
                    return h(T);
                case E:
                    e: {
                        for (te = O.key; j !== null; ) {
                            if (j.key === te)
                                if (j.tag === 4 && j.stateNode.containerInfo === O.containerInfo && j.stateNode.implementation === O.implementation) {
                                    n(T, j.sibling),
                                    q = s(j, O.children || []),
                                    q.return = T,
                                    T = q;
                                    break e
                                } else {
                                    n(T, j);
                                    break
                                }
                            else
                                t(T, j);
                            j = j.sibling
                        }
                        q = Er(O, T.mode, q),
                        q.return = T,
                        T = q
                    }
                    return h(T);
                case ie:
                    return O = $n(O),
                    Oe(T, j, O, q)
                }
                if (de(O))
                    return P(T, j, O, q);
                if (F(O)) {
                    if (te = F(O),
                    typeof te != "function")
                        throw Error(o(150));
                    return O = te.call(O),
                    le(T, j, O, q)
                }
                if (typeof O.then == "function")
                    return Oe(T, j, Oi(O), q);
                if (O.$$typeof === G)
                    return Oe(T, j, _i(T, O), q);
                Ri(T, O)
            }
            return typeof O == "string" && O !== "" || typeof O == "number" || typeof O == "bigint" ? (O = "" + O,
            j !== null && j.tag === 6 ? (n(T, j.sibling),
            q = s(j, O),
            q.return = T,
            T = q) : (n(T, j),
            q = wr(O, T.mode, q),
            q.return = T,
            T = q),
            h(T)) : n(T, j)
        }
        return function(T, j, O, q) {
            try {
                hl = 0;
                var te = Oe(T, j, O, q);
                return Na = null,
                te
            } catch (ee) {
                if (ee === Ea || ee === Ai)
                    throw ee;
                var be = pt(29, ee, null, T.mode);
                return be.lanes = q,
                be.return = T,
                be
            }
        }
    }
    var In = yf(!0)
      , xf = yf(!1)
      , bn = !1;
    function zr(e) {
        e.updateQueue = {
            baseState: e.memoizedState,
            firstBaseUpdate: null,
            lastBaseUpdate: null,
            shared: {
                pending: null,
                lanes: 0,
                hiddenCallbacks: null
            },
            callbacks: null
        }
    }
    function Ur(e, t) {
        e = e.updateQueue,
        t.updateQueue === e && (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null
        })
    }
    function Sn(e) {
        return {
            lane: e,
            tag: 0,
            payload: null,
            callback: null,
            next: null
        }
    }
    function wn(e, t, n) {
        var a = e.updateQueue;
        if (a === null)
            return null;
        if (a = a.shared,
        (Ee & 2) !== 0) {
            var s = a.pending;
            return s === null ? t.next = t : (t.next = s.next,
            s.next = t),
            a.pending = t,
            t = wi(e),
            ef(e, null, n),
            t
        }
        return Si(e, a, t, n),
        wi(e)
    }
    function gl(e, t, n) {
        if (t = t.updateQueue,
        t !== null && (t = t.shared,
        (n & 4194048) !== 0)) {
            var a = t.lanes;
            a &= e.pendingLanes,
            n |= a,
            t.lanes = n,
            oc(e, n)
        }
    }
    function Hr(e, t) {
        var n = e.updateQueue
          , a = e.alternate;
        if (a !== null && (a = a.updateQueue,
        n === a)) {
            var s = null
              , u = null;
            if (n = n.firstBaseUpdate,
            n !== null) {
                do {
                    var h = {
                        lane: n.lane,
                        tag: n.tag,
                        payload: n.payload,
                        callback: null,
                        next: null
                    };
                    u === null ? s = u = h : u = u.next = h,
                    n = n.next
                } while (n !== null);
                u === null ? s = u = t : u = u.next = t
            } else
                s = u = t;
            n = {
                baseState: a.baseState,
                firstBaseUpdate: s,
                lastBaseUpdate: u,
                shared: a.shared,
                callbacks: a.callbacks
            },
            e.updateQueue = n;
            return
        }
        e = n.lastBaseUpdate,
        e === null ? n.firstBaseUpdate = t : e.next = t,
        n.lastBaseUpdate = t
    }
    var Br = !1;
    function pl() {
        if (Br) {
            var e = wa;
            if (e !== null)
                throw e
        }
    }
    function yl(e, t, n, a) {
        Br = !1;
        var s = e.updateQueue;
        bn = !1;
        var u = s.firstBaseUpdate
          , h = s.lastBaseUpdate
          , x = s.shared.pending;
        if (x !== null) {
            s.shared.pending = null;
            var C = x
              , R = C.next;
            C.next = null,
            h === null ? u = R : h.next = R,
            h = C;
            var H = e.alternate;
            H !== null && (H = H.updateQueue,
            x = H.lastBaseUpdate,
            x !== h && (x === null ? H.firstBaseUpdate = R : x.next = R,
            H.lastBaseUpdate = C))
        }
        if (u !== null) {
            var Y = s.baseState;
            h = 0,
            H = R = C = null,
            x = u;
            do {
                var M = x.lane & -536870913
                  , L = M !== x.lane;
                if (L ? (pe & M) === M : (a & M) === M) {
                    M !== 0 && M === Sa && (Br = !0),
                    H !== null && (H = H.next = {
                        lane: 0,
                        tag: x.tag,
                        payload: x.payload,
                        callback: null,
                        next: null
                    });
                    e: {
                        var P = e
                          , le = x;
                        M = t;
                        var Oe = n;
                        switch (le.tag) {
                        case 1:
                            if (P = le.payload,
                            typeof P == "function") {
                                Y = P.call(Oe, Y, M);
                                break e
                            }
                            Y = P;
                            break e;
                        case 3:
                            P.flags = P.flags & -65537 | 128;
                        case 0:
                            if (P = le.payload,
                            M = typeof P == "function" ? P.call(Oe, Y, M) : P,
                            M == null)
                                break e;
                            Y = v({}, Y, M);
                            break e;
                        case 2:
                            bn = !0
                        }
                    }
                    M = x.callback,
                    M !== null && (e.flags |= 64,
                    L && (e.flags |= 8192),
                    L = s.callbacks,
                    L === null ? s.callbacks = [M] : L.push(M))
                } else
                    L = {
                        lane: M,
                        tag: x.tag,
                        payload: x.payload,
                        callback: x.callback,
                        next: null
                    },
                    H === null ? (R = H = L,
                    C = Y) : H = H.next = L,
                    h |= M;
                if (x = x.next,
                x === null) {
                    if (x = s.shared.pending,
                    x === null)
                        break;
                    L = x,
                    x = L.next,
                    L.next = null,
                    s.lastBaseUpdate = L,
                    s.shared.pending = null
                }
            } while (!0);
            H === null && (C = Y),
            s.baseState = C,
            s.firstBaseUpdate = R,
            s.lastBaseUpdate = H,
            u === null && (s.shared.lanes = 0),
            jn |= h,
            e.lanes = h,
            e.memoizedState = Y
        }
    }
    function vf(e, t) {
        if (typeof e != "function")
            throw Error(o(191, e));
        e.call(t)
    }
    function bf(e, t) {
        var n = e.callbacks;
        if (n !== null)
            for (e.callbacks = null,
            e = 0; e < n.length; e++)
                vf(n[e], t)
    }
    var Ca = _(null)
      , Mi = _(0);
    function Sf(e, t) {
        e = on,
        K(Mi, e),
        K(Ca, t),
        on = e | t.baseLanes
    }
    function qr() {
        K(Mi, on),
        K(Ca, Ca.current)
    }
    function kr() {
        on = Mi.current,
        B(Ca),
        B(Mi)
    }
    var yt = _(null)
      , Tt = null;
    function En(e) {
        var t = e.alternate;
        K(qe, qe.current & 1),
        K(yt, e),
        Tt === null && (t === null || Ca.current !== null || t.memoizedState !== null) && (Tt = e)
    }
    function Gr(e) {
        K(qe, qe.current),
        K(yt, e),
        Tt === null && (Tt = e)
    }
    function wf(e) {
        e.tag === 22 ? (K(qe, qe.current),
        K(yt, e),
        Tt === null && (Tt = e)) : Nn()
    }
    function Nn() {
        K(qe, qe.current),
        K(yt, yt.current)
    }
    function xt(e) {
        B(yt),
        Tt === e && (Tt = null),
        B(qe)
    }
    var qe = _(0);
    function Di(e) {
        for (var t = e; t !== null; ) {
            if (t.tag === 13) {
                var n = t.memoizedState;
                if (n !== null && (n = n.dehydrated,
                n === null || Fo(n) || Jo(n)))
                    return t
            } else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
                if ((t.flags & 128) !== 0)
                    return t
            } else if (t.child !== null) {
                t.child.return = t,
                t = t.child;
                continue
            }
            if (t === e)
                break;
            for (; t.sibling === null; ) {
                if (t.return === null || t.return === e)
                    return null;
                t = t.return
            }
            t.sibling.return = t.return,
            t = t.sibling
        }
        return null
    }
    var Pt = 0
      , ue = null
      , Ae = null
      , Ye = null
      , Li = !1
      , _a = !1
      , Pn = !1
      , zi = 0
      , xl = 0
      , ja = null
      , T0 = 0;
    function Ue() {
        throw Error(o(321))
    }
    function Yr(e, t) {
        if (t === null)
            return !1;
        for (var n = 0; n < t.length && n < e.length; n++)
            if (!gt(e[n], t[n]))
                return !1;
        return !0
    }
    function Vr(e, t, n, a, s, u) {
        return Pt = u,
        ue = t,
        t.memoizedState = null,
        t.updateQueue = null,
        t.lanes = 0,
        z.H = e === null || e.memoizedState === null ? id : lo,
        Pn = !1,
        u = n(a, s),
        Pn = !1,
        _a && (u = Nf(t, n, a, s)),
        Ef(e),
        u
    }
    function Ef(e) {
        z.H = Sl;
        var t = Ae !== null && Ae.next !== null;
        if (Pt = 0,
        Ye = Ae = ue = null,
        Li = !1,
        xl = 0,
        ja = null,
        t)
            throw Error(o(300));
        e === null || Ve || (e = e.dependencies,
        e !== null && Ci(e) && (Ve = !0))
    }
    function Nf(e, t, n, a) {
        ue = e;
        var s = 0;
        do {
            if (_a && (ja = null),
            xl = 0,
            _a = !1,
            25 <= s)
                throw Error(o(301));
            if (s += 1,
            Ye = Ae = null,
            e.updateQueue != null) {
                var u = e.updateQueue;
                u.lastEffect = null,
                u.events = null,
                u.stores = null,
                u.memoCache != null && (u.memoCache.index = 0)
            }
            z.H = sd,
            u = t(n, a)
        } while (_a);
        return u
    }
    function O0() {
        var e = z.H
          , t = e.useState()[0];
        return t = typeof t.then == "function" ? vl(t) : t,
        e = e.useState()[0],
        (Ae !== null ? Ae.memoizedState : null) !== e && (ue.flags |= 1024),
        t
    }
    function Qr() {
        var e = zi !== 0;
        return zi = 0,
        e
    }
    function Xr(e, t, n) {
        t.updateQueue = e.updateQueue,
        t.flags &= -2053,
        e.lanes &= ~n
    }
    function Zr(e) {
        if (Li) {
            for (e = e.memoizedState; e !== null; ) {
                var t = e.queue;
                t !== null && (t.pending = null),
                e = e.next
            }
            Li = !1
        }
        Pt = 0,
        Ye = Ae = ue = null,
        _a = !1,
        xl = zi = 0,
        ja = null
    }
    function lt() {
        var e = {
            memoizedState: null,
            baseState: null,
            baseQueue: null,
            queue: null,
            next: null
        };
        return Ye === null ? ue.memoizedState = Ye = e : Ye = Ye.next = e,
        Ye
    }
    function ke() {
        if (Ae === null) {
            var e = ue.alternate;
            e = e !== null ? e.memoizedState : null
        } else
            e = Ae.next;
        var t = Ye === null ? ue.memoizedState : Ye.next;
        if (t !== null)
            Ye = t,
            Ae = e;
        else {
            if (e === null)
                throw ue.alternate === null ? Error(o(467)) : Error(o(310));
            Ae = e,
            e = {
                memoizedState: Ae.memoizedState,
                baseState: Ae.baseState,
                baseQueue: Ae.baseQueue,
                queue: Ae.queue,
                next: null
            },
            Ye === null ? ue.memoizedState = Ye = e : Ye = Ye.next = e
        }
        return Ye
    }
    function Ui() {
        return {
            lastEffect: null,
            events: null,
            stores: null,
            memoCache: null
        }
    }
    function vl(e) {
        var t = xl;
        return xl += 1,
        ja === null && (ja = []),
        e = mf(ja, e, t),
        t = ue,
        (Ye === null ? t.memoizedState : Ye.next) === null && (t = t.alternate,
        z.H = t === null || t.memoizedState === null ? id : lo),
        e
    }
    function Hi(e) {
        if (e !== null && typeof e == "object") {
            if (typeof e.then == "function")
                return vl(e);
            if (e.$$typeof === G)
                return Ie(e)
        }
        throw Error(o(438, String(e)))
    }
    function Kr(e) {
        var t = null
          , n = ue.updateQueue;
        if (n !== null && (t = n.memoCache),
        t == null) {
            var a = ue.alternate;
            a !== null && (a = a.updateQueue,
            a !== null && (a = a.memoCache,
            a != null && (t = {
                data: a.data.map(function(s) {
                    return s.slice()
                }),
                index: 0
            })))
        }
        if (t == null && (t = {
            data: [],
            index: 0
        }),
        n === null && (n = Ui(),
        ue.updateQueue = n),
        n.memoCache = t,
        n = t.data[t.index],
        n === void 0)
            for (n = t.data[t.index] = Array(e),
            a = 0; a < e; a++)
                n[a] = V;
        return t.index++,
        n
    }
    function en(e, t) {
        return typeof t == "function" ? t(e) : t
    }
    function Bi(e) {
        var t = ke();
        return Fr(t, Ae, e)
    }
    function Fr(e, t, n) {
        var a = e.queue;
        if (a === null)
            throw Error(o(311));
        a.lastRenderedReducer = n;
        var s = e.baseQueue
          , u = a.pending;
        if (u !== null) {
            if (s !== null) {
                var h = s.next;
                s.next = u.next,
                u.next = h
            }
            t.baseQueue = s = u,
            a.pending = null
        }
        if (u = e.baseState,
        s === null)
            e.memoizedState = u;
        else {
            t = s.next;
            var x = h = null
              , C = null
              , R = t
              , H = !1;
            do {
                var Y = R.lane & -536870913;
                if (Y !== R.lane ? (pe & Y) === Y : (Pt & Y) === Y) {
                    var M = R.revertLane;
                    if (M === 0)
                        C !== null && (C = C.next = {
                            lane: 0,
                            revertLane: 0,
                            gesture: null,
                            action: R.action,
                            hasEagerState: R.hasEagerState,
                            eagerState: R.eagerState,
                            next: null
                        }),
                        Y === Sa && (H = !0);
                    else if ((Pt & M) === M) {
                        R = R.next,
                        M === Sa && (H = !0);
                        continue
                    } else
                        Y = {
                            lane: 0,
                            revertLane: R.revertLane,
                            gesture: null,
                            action: R.action,
                            hasEagerState: R.hasEagerState,
                            eagerState: R.eagerState,
                            next: null
                        },
                        C === null ? (x = C = Y,
                        h = u) : C = C.next = Y,
                        ue.lanes |= M,
                        jn |= M;
                    Y = R.action,
                    Pn && n(u, Y),
                    u = R.hasEagerState ? R.eagerState : n(u, Y)
                } else
                    M = {
                        lane: Y,
                        revertLane: R.revertLane,
                        gesture: R.gesture,
                        action: R.action,
                        hasEagerState: R.hasEagerState,
                        eagerState: R.eagerState,
                        next: null
                    },
                    C === null ? (x = C = M,
                    h = u) : C = C.next = M,
                    ue.lanes |= Y,
                    jn |= Y;
                R = R.next
            } while (R !== null && R !== t);
            if (C === null ? h = u : C.next = x,
            !gt(u, e.memoizedState) && (Ve = !0,
            H && (n = wa,
            n !== null)))
                throw n;
            e.memoizedState = u,
            e.baseState = h,
            e.baseQueue = C,
            a.lastRenderedState = u
        }
        return s === null && (a.lanes = 0),
        [e.memoizedState, a.dispatch]
    }
    function Jr(e) {
        var t = ke()
          , n = t.queue;
        if (n === null)
            throw Error(o(311));
        n.lastRenderedReducer = e;
        var a = n.dispatch
          , s = n.pending
          , u = t.memoizedState;
        if (s !== null) {
            n.pending = null;
            var h = s = s.next;
            do
                u = e(u, h.action),
                h = h.next;
            while (h !== s);
            gt(u, t.memoizedState) || (Ve = !0),
            t.memoizedState = u,
            t.baseQueue === null && (t.baseState = u),
            n.lastRenderedState = u
        }
        return [u, a]
    }
    function Cf(e, t, n) {
        var a = ue
          , s = ke()
          , u = xe;
        if (u) {
            if (n === void 0)
                throw Error(o(407));
            n = n()
        } else
            n = t();
        var h = !gt((Ae || s).memoizedState, n);
        if (h && (s.memoizedState = n,
        Ve = !0),
        s = s.queue,
        Ir(Af.bind(null, a, s, e), [e]),
        s.getSnapshot !== t || h || Ye !== null && Ye.memoizedState.tag & 1) {
            if (a.flags |= 2048,
            Aa(9, {
                destroy: void 0
            }, jf.bind(null, a, s, n, t), null),
            Re === null)
                throw Error(o(349));
            u || (Pt & 127) !== 0 || _f(a, t, n)
        }
        return n
    }
    function _f(e, t, n) {
        e.flags |= 16384,
        e = {
            getSnapshot: t,
            value: n
        },
        t = ue.updateQueue,
        t === null ? (t = Ui(),
        ue.updateQueue = t,
        t.stores = [e]) : (n = t.stores,
        n === null ? t.stores = [e] : n.push(e))
    }
    function jf(e, t, n, a) {
        t.value = n,
        t.getSnapshot = a,
        Tf(t) && Of(e)
    }
    function Af(e, t, n) {
        return n(function() {
            Tf(t) && Of(e)
        })
    }
    function Tf(e) {
        var t = e.getSnapshot;
        e = e.value;
        try {
            var n = t();
            return !gt(e, n)
        } catch {
            return !0
        }
    }
    function Of(e) {
        var t = Qn(e, 2);
        t !== null && ft(t, e, 2)
    }
    function $r(e) {
        var t = lt();
        if (typeof e == "function") {
            var n = e;
            if (e = n(),
            Pn) {
                hn(!0);
                try {
                    n()
                } finally {
                    hn(!1)
                }
            }
        }
        return t.memoizedState = t.baseState = e,
        t.queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: en,
            lastRenderedState: e
        },
        t
    }
    function Rf(e, t, n, a) {
        return e.baseState = n,
        Fr(e, Ae, typeof a == "function" ? a : en)
    }
    function R0(e, t, n, a, s) {
        if (Gi(e))
            throw Error(o(485));
        if (e = t.action,
        e !== null) {
            var u = {
                payload: s,
                action: e,
                next: null,
                isTransition: !0,
                status: "pending",
                value: null,
                reason: null,
                listeners: [],
                then: function(h) {
                    u.listeners.push(h)
                }
            };
            z.T !== null ? n(!0) : u.isTransition = !1,
            a(u),
            n = t.pending,
            n === null ? (u.next = t.pending = u,
            Mf(t, u)) : (u.next = n.next,
            t.pending = n.next = u)
        }
    }
    function Mf(e, t) {
        var n = t.action
          , a = t.payload
          , s = e.state;
        if (t.isTransition) {
            var u = z.T
              , h = {};
            z.T = h;
            try {
                var x = n(s, a)
                  , C = z.S;
                C !== null && C(h, x),
                Df(e, t, x)
            } catch (R) {
                Wr(e, t, R)
            } finally {
                u !== null && h.types !== null && (u.types = h.types),
                z.T = u
            }
        } else
            try {
                u = n(s, a),
                Df(e, t, u)
            } catch (R) {
                Wr(e, t, R)
            }
    }
    function Df(e, t, n) {
        n !== null && typeof n == "object" && typeof n.then == "function" ? n.then(function(a) {
            Lf(e, t, a)
        }, function(a) {
            return Wr(e, t, a)
        }) : Lf(e, t, n)
    }
    function Lf(e, t, n) {
        t.status = "fulfilled",
        t.value = n,
        zf(t),
        e.state = n,
        t = e.pending,
        t !== null && (n = t.next,
        n === t ? e.pending = null : (n = n.next,
        t.next = n,
        Mf(e, n)))
    }
    function Wr(e, t, n) {
        var a = e.pending;
        if (e.pending = null,
        a !== null) {
            a = a.next;
            do
                t.status = "rejected",
                t.reason = n,
                zf(t),
                t = t.next;
            while (t !== a)
        }
        e.action = null
    }
    function zf(e) {
        e = e.listeners;
        for (var t = 0; t < e.length; t++)
            (0,
            e[t])()
    }
    function Uf(e, t) {
        return t
    }
    function Hf(e, t) {
        if (xe) {
            var n = Re.formState;
            if (n !== null) {
                e: {
                    var a = ue;
                    if (xe) {
                        if (De) {
                            t: {
                                for (var s = De, u = At; s.nodeType !== 8; ) {
                                    if (!u) {
                                        s = null;
                                        break t
                                    }
                                    if (s = Ot(s.nextSibling),
                                    s === null) {
                                        s = null;
                                        break t
                                    }
                                }
                                u = s.data,
                                s = u === "F!" || u === "F" ? s : null
                            }
                            if (s) {
                                De = Ot(s.nextSibling),
                                a = s.data === "F!";
                                break e
                            }
                        }
                        xn(a)
                    }
                    a = !1
                }
                a && (t = n[0])
            }
        }
        return n = lt(),
        n.memoizedState = n.baseState = t,
        a = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Uf,
            lastRenderedState: t
        },
        n.queue = a,
        n = nd.bind(null, ue, a),
        a.dispatch = n,
        a = $r(!1),
        u = ao.bind(null, ue, !1, a.queue),
        a = lt(),
        s = {
            state: t,
            dispatch: null,
            action: e,
            pending: null
        },
        a.queue = s,
        n = R0.bind(null, ue, s, u, n),
        s.dispatch = n,
        a.memoizedState = e,
        [t, n, !1]
    }
    function Bf(e) {
        var t = ke();
        return qf(t, Ae, e)
    }
    function qf(e, t, n) {
        if (t = Fr(e, t, Uf)[0],
        e = Bi(en)[0],
        typeof t == "object" && t !== null && typeof t.then == "function")
            try {
                var a = vl(t)
            } catch (h) {
                throw h === Ea ? Ai : h
            }
        else
            a = t;
        t = ke();
        var s = t.queue
          , u = s.dispatch;
        return n !== t.memoizedState && (ue.flags |= 2048,
        Aa(9, {
            destroy: void 0
        }, M0.bind(null, s, n), null)),
        [a, u, e]
    }
    function M0(e, t) {
        e.action = t
    }
    function kf(e) {
        var t = ke()
          , n = Ae;
        if (n !== null)
            return qf(t, n, e);
        ke(),
        t = t.memoizedState,
        n = ke();
        var a = n.queue.dispatch;
        return n.memoizedState = e,
        [t, a, !1]
    }
    function Aa(e, t, n, a) {
        return e = {
            tag: e,
            create: n,
            deps: a,
            inst: t,
            next: null
        },
        t = ue.updateQueue,
        t === null && (t = Ui(),
        ue.updateQueue = t),
        n = t.lastEffect,
        n === null ? t.lastEffect = e.next = e : (a = n.next,
        n.next = e,
        e.next = a,
        t.lastEffect = e),
        e
    }
    function Gf() {
        return ke().memoizedState
    }
    function qi(e, t, n, a) {
        var s = lt();
        ue.flags |= e,
        s.memoizedState = Aa(1 | t, {
            destroy: void 0
        }, n, a === void 0 ? null : a)
    }
    function ki(e, t, n, a) {
        var s = ke();
        a = a === void 0 ? null : a;
        var u = s.memoizedState.inst;
        Ae !== null && a !== null && Yr(a, Ae.memoizedState.deps) ? s.memoizedState = Aa(t, u, n, a) : (ue.flags |= e,
        s.memoizedState = Aa(1 | t, u, n, a))
    }
    function Yf(e, t) {
        qi(8390656, 8, e, t)
    }
    function Ir(e, t) {
        ki(2048, 8, e, t)
    }
    function D0(e) {
        ue.flags |= 4;
        var t = ue.updateQueue;
        if (t === null)
            t = Ui(),
            ue.updateQueue = t,
            t.events = [e];
        else {
            var n = t.events;
            n === null ? t.events = [e] : n.push(e)
        }
    }
    function Vf(e) {
        var t = ke().memoizedState;
        return D0({
            ref: t,
            nextImpl: e
        }),
        function() {
            if ((Ee & 2) !== 0)
                throw Error(o(440));
            return t.impl.apply(void 0, arguments)
        }
    }
    function Qf(e, t) {
        return ki(4, 2, e, t)
    }
    function Xf(e, t) {
        return ki(4, 4, e, t)
    }
    function Zf(e, t) {
        if (typeof t == "function") {
            e = e();
            var n = t(e);
            return function() {
                typeof n == "function" ? n() : t(null)
            }
        }
        if (t != null)
            return e = e(),
            t.current = e,
            function() {
                t.current = null
            }
    }
    function Kf(e, t, n) {
        n = n != null ? n.concat([e]) : null,
        ki(4, 4, Zf.bind(null, t, e), n)
    }
    function Pr() {}
    function Ff(e, t) {
        var n = ke();
        t = t === void 0 ? null : t;
        var a = n.memoizedState;
        return t !== null && Yr(t, a[1]) ? a[0] : (n.memoizedState = [e, t],
        e)
    }
    function Jf(e, t) {
        var n = ke();
        t = t === void 0 ? null : t;
        var a = n.memoizedState;
        if (t !== null && Yr(t, a[1]))
            return a[0];
        if (a = e(),
        Pn) {
            hn(!0);
            try {
                e()
            } finally {
                hn(!1)
            }
        }
        return n.memoizedState = [a, t],
        a
    }
    function eo(e, t, n) {
        return n === void 0 || (Pt & 1073741824) !== 0 && (pe & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = n,
        e = $d(),
        ue.lanes |= e,
        jn |= e,
        n)
    }
    function $f(e, t, n, a) {
        return gt(n, t) ? n : Ca.current !== null ? (e = eo(e, n, a),
        gt(e, t) || (Ve = !0),
        e) : (Pt & 42) === 0 || (Pt & 1073741824) !== 0 && (pe & 261930) === 0 ? (Ve = !0,
        e.memoizedState = n) : (e = $d(),
        ue.lanes |= e,
        jn |= e,
        t)
    }
    function Wf(e, t, n, a, s) {
        var u = X.p;
        X.p = u !== 0 && 8 > u ? u : 8;
        var h = z.T
          , x = {};
        z.T = x,
        ao(e, !1, t, n);
        try {
            var C = s()
              , R = z.S;
            if (R !== null && R(x, C),
            C !== null && typeof C == "object" && typeof C.then == "function") {
                var H = A0(C, a);
                bl(e, t, H, St(e))
            } else
                bl(e, t, a, St(e))
        } catch (Y) {
            bl(e, t, {
                then: function() {},
                status: "rejected",
                reason: Y
            }, St())
        } finally {
            X.p = u,
            h !== null && x.types !== null && (h.types = x.types),
            z.T = h
        }
    }
    function L0() {}
    function to(e, t, n, a) {
        if (e.tag !== 5)
            throw Error(o(476));
        var s = If(e).queue;
        Wf(e, s, t, ne, n === null ? L0 : function() {
            return Pf(e),
            n(a)
        }
        )
    }
    function If(e) {
        var t = e.memoizedState;
        if (t !== null)
            return t;
        t = {
            memoizedState: ne,
            baseState: ne,
            baseQueue: null,
            queue: {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: en,
                lastRenderedState: ne
            },
            next: null
        };
        var n = {};
        return t.next = {
            memoizedState: n,
            baseState: n,
            baseQueue: null,
            queue: {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: en,
                lastRenderedState: n
            },
            next: null
        },
        e.memoizedState = t,
        e = e.alternate,
        e !== null && (e.memoizedState = t),
        t
    }
    function Pf(e) {
        var t = If(e);
        t.next === null && (t = e.alternate.memoizedState),
        bl(e, t.next.queue, {}, St())
    }
    function no() {
        return Ie(Hl)
    }
    function ed() {
        return ke().memoizedState
    }
    function td() {
        return ke().memoizedState
    }
    function z0(e) {
        for (var t = e.return; t !== null; ) {
            switch (t.tag) {
            case 24:
            case 3:
                var n = St();
                e = Sn(n);
                var a = wn(t, e, n);
                a !== null && (ft(a, t, n),
                gl(a, t, n)),
                t = {
                    cache: Rr()
                },
                e.payload = t;
                return
            }
            t = t.return
        }
    }
    function U0(e, t, n) {
        var a = St();
        n = {
            lane: a,
            revertLane: 0,
            gesture: null,
            action: n,
            hasEagerState: !1,
            eagerState: null,
            next: null
        },
        Gi(e) ? ad(t, n) : (n = br(e, t, n, a),
        n !== null && (ft(n, e, a),
        ld(n, t, a)))
    }
    function nd(e, t, n) {
        var a = St();
        bl(e, t, n, a)
    }
    function bl(e, t, n, a) {
        var s = {
            lane: a,
            revertLane: 0,
            gesture: null,
            action: n,
            hasEagerState: !1,
            eagerState: null,
            next: null
        };
        if (Gi(e))
            ad(t, s);
        else {
            var u = e.alternate;
            if (e.lanes === 0 && (u === null || u.lanes === 0) && (u = t.lastRenderedReducer,
            u !== null))
                try {
                    var h = t.lastRenderedState
                      , x = u(h, n);
                    if (s.hasEagerState = !0,
                    s.eagerState = x,
                    gt(x, h))
                        return Si(e, t, s, 0),
                        Re === null && bi(),
                        !1
                } catch {}
            if (n = br(e, t, s, a),
            n !== null)
                return ft(n, e, a),
                ld(n, t, a),
                !0
        }
        return !1
    }
    function ao(e, t, n, a) {
        if (a = {
            lane: 2,
            revertLane: Uo(),
            gesture: null,
            action: a,
            hasEagerState: !1,
            eagerState: null,
            next: null
        },
        Gi(e)) {
            if (t)
                throw Error(o(479))
        } else
            t = br(e, n, a, 2),
            t !== null && ft(t, e, 2)
    }
    function Gi(e) {
        var t = e.alternate;
        return e === ue || t !== null && t === ue
    }
    function ad(e, t) {
        _a = Li = !0;
        var n = e.pending;
        n === null ? t.next = t : (t.next = n.next,
        n.next = t),
        e.pending = t
    }
    function ld(e, t, n) {
        if ((n & 4194048) !== 0) {
            var a = t.lanes;
            a &= e.pendingLanes,
            n |= a,
            t.lanes = n,
            oc(e, n)
        }
    }
    var Sl = {
        readContext: Ie,
        use: Hi,
        useCallback: Ue,
        useContext: Ue,
        useEffect: Ue,
        useImperativeHandle: Ue,
        useLayoutEffect: Ue,
        useInsertionEffect: Ue,
        useMemo: Ue,
        useReducer: Ue,
        useRef: Ue,
        useState: Ue,
        useDebugValue: Ue,
        useDeferredValue: Ue,
        useTransition: Ue,
        useSyncExternalStore: Ue,
        useId: Ue,
        useHostTransitionStatus: Ue,
        useFormState: Ue,
        useActionState: Ue,
        useOptimistic: Ue,
        useMemoCache: Ue,
        useCacheRefresh: Ue
    };
    Sl.useEffectEvent = Ue;
    var id = {
        readContext: Ie,
        use: Hi,
        useCallback: function(e, t) {
            return lt().memoizedState = [e, t === void 0 ? null : t],
            e
        },
        useContext: Ie,
        useEffect: Yf,
        useImperativeHandle: function(e, t, n) {
            n = n != null ? n.concat([e]) : null,
            qi(4194308, 4, Zf.bind(null, t, e), n)
        },
        useLayoutEffect: function(e, t) {
            return qi(4194308, 4, e, t)
        },
        useInsertionEffect: function(e, t) {
            qi(4, 2, e, t)
        },
        useMemo: function(e, t) {
            var n = lt();
            t = t === void 0 ? null : t;
            var a = e();
            if (Pn) {
                hn(!0);
                try {
                    e()
                } finally {
                    hn(!1)
                }
            }
            return n.memoizedState = [a, t],
            a
        },
        useReducer: function(e, t, n) {
            var a = lt();
            if (n !== void 0) {
                var s = n(t);
                if (Pn) {
                    hn(!0);
                    try {
                        n(t)
                    } finally {
                        hn(!1)
                    }
                }
            } else
                s = t;
            return a.memoizedState = a.baseState = s,
            e = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: e,
                lastRenderedState: s
            },
            a.queue = e,
            e = e.dispatch = U0.bind(null, ue, e),
            [a.memoizedState, e]
        },
        useRef: function(e) {
            var t = lt();
            return e = {
                current: e
            },
            t.memoizedState = e
        },
        useState: function(e) {
            e = $r(e);
            var t = e.queue
              , n = nd.bind(null, ue, t);
            return t.dispatch = n,
            [e.memoizedState, n]
        },
        useDebugValue: Pr,
        useDeferredValue: function(e, t) {
            var n = lt();
            return eo(n, e, t)
        },
        useTransition: function() {
            var e = $r(!1);
            return e = Wf.bind(null, ue, e.queue, !0, !1),
            lt().memoizedState = e,
            [!1, e]
        },
        useSyncExternalStore: function(e, t, n) {
            var a = ue
              , s = lt();
            if (xe) {
                if (n === void 0)
                    throw Error(o(407));
                n = n()
            } else {
                if (n = t(),
                Re === null)
                    throw Error(o(349));
                (pe & 127) !== 0 || _f(a, t, n)
            }
            s.memoizedState = n;
            var u = {
                value: n,
                getSnapshot: t
            };
            return s.queue = u,
            Yf(Af.bind(null, a, u, e), [e]),
            a.flags |= 2048,
            Aa(9, {
                destroy: void 0
            }, jf.bind(null, a, u, n, t), null),
            n
        },
        useId: function() {
            var e = lt()
              , t = Re.identifierPrefix;
            if (xe) {
                var n = Bt
                  , a = Ht;
                n = (a & ~(1 << 32 - mt(a) - 1)).toString(32) + n,
                t = "_" + t + "R_" + n,
                n = zi++,
                0 < n && (t += "H" + n.toString(32)),
                t += "_"
            } else
                n = T0++,
                t = "_" + t + "r_" + n.toString(32) + "_";
            return e.memoizedState = t
        },
        useHostTransitionStatus: no,
        useFormState: Hf,
        useActionState: Hf,
        useOptimistic: function(e) {
            var t = lt();
            t.memoizedState = t.baseState = e;
            var n = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: null,
                lastRenderedState: null
            };
            return t.queue = n,
            t = ao.bind(null, ue, !0, n),
            n.dispatch = t,
            [e, t]
        },
        useMemoCache: Kr,
        useCacheRefresh: function() {
            return lt().memoizedState = z0.bind(null, ue)
        },
        useEffectEvent: function(e) {
            var t = lt()
              , n = {
                impl: e
            };
            return t.memoizedState = n,
            function() {
                if ((Ee & 2) !== 0)
                    throw Error(o(440));
                return n.impl.apply(void 0, arguments)
            }
        }
    }
      , lo = {
        readContext: Ie,
        use: Hi,
        useCallback: Ff,
        useContext: Ie,
        useEffect: Ir,
        useImperativeHandle: Kf,
        useInsertionEffect: Qf,
        useLayoutEffect: Xf,
        useMemo: Jf,
        useReducer: Bi,
        useRef: Gf,
        useState: function() {
            return Bi(en)
        },
        useDebugValue: Pr,
        useDeferredValue: function(e, t) {
            var n = ke();
            return $f(n, Ae.memoizedState, e, t)
        },
        useTransition: function() {
            var e = Bi(en)[0]
              , t = ke().memoizedState;
            return [typeof e == "boolean" ? e : vl(e), t]
        },
        useSyncExternalStore: Cf,
        useId: ed,
        useHostTransitionStatus: no,
        useFormState: Bf,
        useActionState: Bf,
        useOptimistic: function(e, t) {
            var n = ke();
            return Rf(n, Ae, e, t)
        },
        useMemoCache: Kr,
        useCacheRefresh: td
    };
    lo.useEffectEvent = Vf;
    var sd = {
        readContext: Ie,
        use: Hi,
        useCallback: Ff,
        useContext: Ie,
        useEffect: Ir,
        useImperativeHandle: Kf,
        useInsertionEffect: Qf,
        useLayoutEffect: Xf,
        useMemo: Jf,
        useReducer: Jr,
        useRef: Gf,
        useState: function() {
            return Jr(en)
        },
        useDebugValue: Pr,
        useDeferredValue: function(e, t) {
            var n = ke();
            return Ae === null ? eo(n, e, t) : $f(n, Ae.memoizedState, e, t)
        },
        useTransition: function() {
            var e = Jr(en)[0]
              , t = ke().memoizedState;
            return [typeof e == "boolean" ? e : vl(e), t]
        },
        useSyncExternalStore: Cf,
        useId: ed,
        useHostTransitionStatus: no,
        useFormState: kf,
        useActionState: kf,
        useOptimistic: function(e, t) {
            var n = ke();
            return Ae !== null ? Rf(n, Ae, e, t) : (n.baseState = e,
            [e, n.queue.dispatch])
        },
        useMemoCache: Kr,
        useCacheRefresh: td
    };
    sd.useEffectEvent = Vf;
    function io(e, t, n, a) {
        t = e.memoizedState,
        n = n(a, t),
        n = n == null ? t : v({}, t, n),
        e.memoizedState = n,
        e.lanes === 0 && (e.updateQueue.baseState = n)
    }
    var so = {
        enqueueSetState: function(e, t, n) {
            e = e._reactInternals;
            var a = St()
              , s = Sn(a);
            s.payload = t,
            n != null && (s.callback = n),
            t = wn(e, s, a),
            t !== null && (ft(t, e, a),
            gl(t, e, a))
        },
        enqueueReplaceState: function(e, t, n) {
            e = e._reactInternals;
            var a = St()
              , s = Sn(a);
            s.tag = 1,
            s.payload = t,
            n != null && (s.callback = n),
            t = wn(e, s, a),
            t !== null && (ft(t, e, a),
            gl(t, e, a))
        },
        enqueueForceUpdate: function(e, t) {
            e = e._reactInternals;
            var n = St()
              , a = Sn(n);
            a.tag = 2,
            t != null && (a.callback = t),
            t = wn(e, a, n),
            t !== null && (ft(t, e, n),
            gl(t, e, n))
        }
    };
    function rd(e, t, n, a, s, u, h) {
        return e = e.stateNode,
        typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(a, u, h) : t.prototype && t.prototype.isPureReactComponent ? !rl(n, a) || !rl(s, u) : !0
    }
    function od(e, t, n, a) {
        e = t.state,
        typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, a),
        typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, a),
        t.state !== e && so.enqueueReplaceState(t, t.state, null)
    }
    function ea(e, t) {
        var n = t;
        if ("ref"in t) {
            n = {};
            for (var a in t)
                a !== "ref" && (n[a] = t[a])
        }
        if (e = e.defaultProps) {
            n === t && (n = v({}, n));
            for (var s in e)
                n[s] === void 0 && (n[s] = e[s])
        }
        return n
    }
    function ud(e) {
        vi(e)
    }
    function cd(e) {
        console.error(e)
    }
    function fd(e) {
        vi(e)
    }
    function Yi(e, t) {
        try {
            var n = e.onUncaughtError;
            n(t.value, {
                componentStack: t.stack
            })
        } catch (a) {
            setTimeout(function() {
                throw a
            })
        }
    }
    function dd(e, t, n) {
        try {
            var a = e.onCaughtError;
            a(n.value, {
                componentStack: n.stack,
                errorBoundary: t.tag === 1 ? t.stateNode : null
            })
        } catch (s) {
            setTimeout(function() {
                throw s
            })
        }
    }
    function ro(e, t, n) {
        return n = Sn(n),
        n.tag = 3,
        n.payload = {
            element: null
        },
        n.callback = function() {
            Yi(e, t)
        }
        ,
        n
    }
    function hd(e) {
        return e = Sn(e),
        e.tag = 3,
        e
    }
    function md(e, t, n, a) {
        var s = n.type.getDerivedStateFromError;
        if (typeof s == "function") {
            var u = a.value;
            e.payload = function() {
                return s(u)
            }
            ,
            e.callback = function() {
                dd(t, n, a)
            }
        }
        var h = n.stateNode;
        h !== null && typeof h.componentDidCatch == "function" && (e.callback = function() {
            dd(t, n, a),
            typeof s != "function" && (An === null ? An = new Set([this]) : An.add(this));
            var x = a.stack;
            this.componentDidCatch(a.value, {
                componentStack: x !== null ? x : ""
            })
        }
        )
    }
    function H0(e, t, n, a, s) {
        if (n.flags |= 32768,
        a !== null && typeof a == "object" && typeof a.then == "function") {
            if (t = n.alternate,
            t !== null && ba(t, n, s, !0),
            n = yt.current,
            n !== null) {
                switch (n.tag) {
                case 31:
                case 13:
                    return Tt === null ? es() : n.alternate === null && He === 0 && (He = 3),
                    n.flags &= -257,
                    n.flags |= 65536,
                    n.lanes = s,
                    a === Ti ? n.flags |= 16384 : (t = n.updateQueue,
                    t === null ? n.updateQueue = new Set([a]) : t.add(a),
                    Do(e, a, s)),
                    !1;
                case 22:
                    return n.flags |= 65536,
                    a === Ti ? n.flags |= 16384 : (t = n.updateQueue,
                    t === null ? (t = {
                        transitions: null,
                        markerInstances: null,
                        retryQueue: new Set([a])
                    },
                    n.updateQueue = t) : (n = t.retryQueue,
                    n === null ? t.retryQueue = new Set([a]) : n.add(a)),
                    Do(e, a, s)),
                    !1
                }
                throw Error(o(435, n.tag))
            }
            return Do(e, a, s),
            es(),
            !1
        }
        if (xe)
            return t = yt.current,
            t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256),
            t.flags |= 65536,
            t.lanes = s,
            a !== _r && (e = Error(o(422), {
                cause: a
            }),
            cl(Ct(e, n)))) : (a !== _r && (t = Error(o(423), {
                cause: a
            }),
            cl(Ct(t, n))),
            e = e.current.alternate,
            e.flags |= 65536,
            s &= -s,
            e.lanes |= s,
            a = Ct(a, n),
            s = ro(e.stateNode, a, s),
            Hr(e, s),
            He !== 4 && (He = 2)),
            !1;
        var u = Error(o(520), {
            cause: a
        });
        if (u = Ct(u, n),
        Tl === null ? Tl = [u] : Tl.push(u),
        He !== 4 && (He = 2),
        t === null)
            return !0;
        a = Ct(a, n),
        n = t;
        do {
            switch (n.tag) {
            case 3:
                return n.flags |= 65536,
                e = s & -s,
                n.lanes |= e,
                e = ro(n.stateNode, a, e),
                Hr(n, e),
                !1;
            case 1:
                if (t = n.type,
                u = n.stateNode,
                (n.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || u !== null && typeof u.componentDidCatch == "function" && (An === null || !An.has(u))))
                    return n.flags |= 65536,
                    s &= -s,
                    n.lanes |= s,
                    s = hd(s),
                    md(s, e, n, a),
                    Hr(n, s),
                    !1
            }
            n = n.return
        } while (n !== null);
        return !1
    }
    var oo = Error(o(461))
      , Ve = !1;
    function Pe(e, t, n, a) {
        t.child = e === null ? xf(t, null, n, a) : In(t, e.child, n, a)
    }
    function gd(e, t, n, a, s) {
        n = n.render;
        var u = t.ref;
        if ("ref"in a) {
            var h = {};
            for (var x in a)
                x !== "ref" && (h[x] = a[x])
        } else
            h = a;
        return Fn(t),
        a = Vr(e, t, n, h, u, s),
        x = Qr(),
        e !== null && !Ve ? (Xr(e, t, s),
        tn(e, t, s)) : (xe && x && Nr(t),
        t.flags |= 1,
        Pe(e, t, a, s),
        t.child)
    }
    function pd(e, t, n, a, s) {
        if (e === null) {
            var u = n.type;
            return typeof u == "function" && !Sr(u) && u.defaultProps === void 0 && n.compare === null ? (t.tag = 15,
            t.type = u,
            yd(e, t, u, a, s)) : (e = Ei(n.type, null, a, t, t.mode, s),
            e.ref = t.ref,
            e.return = t,
            t.child = e)
        }
        if (u = e.child,
        !yo(e, s)) {
            var h = u.memoizedProps;
            if (n = n.compare,
            n = n !== null ? n : rl,
            n(h, a) && e.ref === t.ref)
                return tn(e, t, s)
        }
        return t.flags |= 1,
        e = Jt(u, a),
        e.ref = t.ref,
        e.return = t,
        t.child = e
    }
    function yd(e, t, n, a, s) {
        if (e !== null) {
            var u = e.memoizedProps;
            if (rl(u, a) && e.ref === t.ref)
                if (Ve = !1,
                t.pendingProps = a = u,
                yo(e, s))
                    (e.flags & 131072) !== 0 && (Ve = !0);
                else
                    return t.lanes = e.lanes,
                    tn(e, t, s)
        }
        return uo(e, t, n, a, s)
    }
    function xd(e, t, n, a) {
        var s = a.children
          , u = e !== null ? e.memoizedState : null;
        if (e === null && t.stateNode === null && (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }),
        a.mode === "hidden") {
            if ((t.flags & 128) !== 0) {
                if (u = u !== null ? u.baseLanes | n : n,
                e !== null) {
                    for (a = t.child = e.child,
                    s = 0; a !== null; )
                        s = s | a.lanes | a.childLanes,
                        a = a.sibling;
                    a = s & ~u
                } else
                    a = 0,
                    t.child = null;
                return vd(e, t, u, n, a)
            }
            if ((n & 536870912) !== 0)
                t.memoizedState = {
                    baseLanes: 0,
                    cachePool: null
                },
                e !== null && ji(t, u !== null ? u.cachePool : null),
                u !== null ? Sf(t, u) : qr(),
                wf(t);
            else
                return a = t.lanes = 536870912,
                vd(e, t, u !== null ? u.baseLanes | n : n, n, a)
        } else
            u !== null ? (ji(t, u.cachePool),
            Sf(t, u),
            Nn(),
            t.memoizedState = null) : (e !== null && ji(t, null),
            qr(),
            Nn());
        return Pe(e, t, s, n),
        t.child
    }
    function wl(e, t) {
        return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }),
        t.sibling
    }
    function vd(e, t, n, a, s) {
        var u = Dr();
        return u = u === null ? null : {
            parent: Ge._currentValue,
            pool: u
        },
        t.memoizedState = {
            baseLanes: n,
            cachePool: u
        },
        e !== null && ji(t, null),
        qr(),
        wf(t),
        e !== null && ba(e, t, a, !0),
        t.childLanes = s,
        null
    }
    function Vi(e, t) {
        return t = Xi({
            mode: t.mode,
            children: t.children
        }, e.mode),
        t.ref = e.ref,
        e.child = t,
        t.return = e,
        t
    }
    function bd(e, t, n) {
        return In(t, e.child, null, n),
        e = Vi(t, t.pendingProps),
        e.flags |= 2,
        xt(t),
        t.memoizedState = null,
        e
    }
    function B0(e, t, n) {
        var a = t.pendingProps
          , s = (t.flags & 128) !== 0;
        if (t.flags &= -129,
        e === null) {
            if (xe) {
                if (a.mode === "hidden")
                    return e = Vi(t, a),
                    t.lanes = 536870912,
                    wl(null, e);
                if (Gr(t),
                (e = De) ? (e = Mh(e, At),
                e = e !== null && e.data === "&" ? e : null,
                e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: pn !== null ? {
                        id: Ht,
                        overflow: Bt
                    } : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                },
                n = nf(e),
                n.return = t,
                t.child = n,
                We = t,
                De = null)) : e = null,
                e === null)
                    throw xn(t);
                return t.lanes = 536870912,
                null
            }
            return Vi(t, a)
        }
        var u = e.memoizedState;
        if (u !== null) {
            var h = u.dehydrated;
            if (Gr(t),
            s)
                if (t.flags & 256)
                    t.flags &= -257,
                    t = bd(e, t, n);
                else if (t.memoizedState !== null)
                    t.child = e.child,
                    t.flags |= 128,
                    t = null;
                else
                    throw Error(o(558));
            else if (Ve || ba(e, t, n, !1),
            s = (n & e.childLanes) !== 0,
            Ve || s) {
                if (a = Re,
                a !== null && (h = uc(a, n),
                h !== 0 && h !== u.retryLane))
                    throw u.retryLane = h,
                    Qn(e, h),
                    ft(a, e, h),
                    oo;
                es(),
                t = bd(e, t, n)
            } else
                e = u.treeContext,
                De = Ot(h.nextSibling),
                We = t,
                xe = !0,
                yn = null,
                At = !1,
                e !== null && sf(t, e),
                t = Vi(t, a),
                t.flags |= 4096;
            return t
        }
        return e = Jt(e.child, {
            mode: a.mode,
            children: a.children
        }),
        e.ref = t.ref,
        t.child = e,
        e.return = t,
        e
    }
    function Qi(e, t) {
        var n = t.ref;
        if (n === null)
            e !== null && e.ref !== null && (t.flags |= 4194816);
        else {
            if (typeof n != "function" && typeof n != "object")
                throw Error(o(284));
            (e === null || e.ref !== n) && (t.flags |= 4194816)
        }
    }
    function uo(e, t, n, a, s) {
        return Fn(t),
        n = Vr(e, t, n, a, void 0, s),
        a = Qr(),
        e !== null && !Ve ? (Xr(e, t, s),
        tn(e, t, s)) : (xe && a && Nr(t),
        t.flags |= 1,
        Pe(e, t, n, s),
        t.child)
    }
    function Sd(e, t, n, a, s, u) {
        return Fn(t),
        t.updateQueue = null,
        n = Nf(t, a, n, s),
        Ef(e),
        a = Qr(),
        e !== null && !Ve ? (Xr(e, t, u),
        tn(e, t, u)) : (xe && a && Nr(t),
        t.flags |= 1,
        Pe(e, t, n, u),
        t.child)
    }
    function wd(e, t, n, a, s) {
        if (Fn(t),
        t.stateNode === null) {
            var u = pa
              , h = n.contextType;
            typeof h == "object" && h !== null && (u = Ie(h)),
            u = new n(a,u),
            t.memoizedState = u.state !== null && u.state !== void 0 ? u.state : null,
            u.updater = so,
            t.stateNode = u,
            u._reactInternals = t,
            u = t.stateNode,
            u.props = a,
            u.state = t.memoizedState,
            u.refs = {},
            zr(t),
            h = n.contextType,
            u.context = typeof h == "object" && h !== null ? Ie(h) : pa,
            u.state = t.memoizedState,
            h = n.getDerivedStateFromProps,
            typeof h == "function" && (io(t, n, h, a),
            u.state = t.memoizedState),
            typeof n.getDerivedStateFromProps == "function" || typeof u.getSnapshotBeforeUpdate == "function" || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (h = u.state,
            typeof u.componentWillMount == "function" && u.componentWillMount(),
            typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount(),
            h !== u.state && so.enqueueReplaceState(u, u.state, null),
            yl(t, a, u, s),
            pl(),
            u.state = t.memoizedState),
            typeof u.componentDidMount == "function" && (t.flags |= 4194308),
            a = !0
        } else if (e === null) {
            u = t.stateNode;
            var x = t.memoizedProps
              , C = ea(n, x);
            u.props = C;
            var R = u.context
              , H = n.contextType;
            h = pa,
            typeof H == "object" && H !== null && (h = Ie(H));
            var Y = n.getDerivedStateFromProps;
            H = typeof Y == "function" || typeof u.getSnapshotBeforeUpdate == "function",
            x = t.pendingProps !== x,
            H || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (x || R !== h) && od(t, u, a, h),
            bn = !1;
            var M = t.memoizedState;
            u.state = M,
            yl(t, a, u, s),
            pl(),
            R = t.memoizedState,
            x || M !== R || bn ? (typeof Y == "function" && (io(t, n, Y, a),
            R = t.memoizedState),
            (C = bn || rd(t, n, C, a, M, R, h)) ? (H || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (typeof u.componentWillMount == "function" && u.componentWillMount(),
            typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount()),
            typeof u.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof u.componentDidMount == "function" && (t.flags |= 4194308),
            t.memoizedProps = a,
            t.memoizedState = R),
            u.props = a,
            u.state = R,
            u.context = h,
            a = C) : (typeof u.componentDidMount == "function" && (t.flags |= 4194308),
            a = !1)
        } else {
            u = t.stateNode,
            Ur(e, t),
            h = t.memoizedProps,
            H = ea(n, h),
            u.props = H,
            Y = t.pendingProps,
            M = u.context,
            R = n.contextType,
            C = pa,
            typeof R == "object" && R !== null && (C = Ie(R)),
            x = n.getDerivedStateFromProps,
            (R = typeof x == "function" || typeof u.getSnapshotBeforeUpdate == "function") || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (h !== Y || M !== C) && od(t, u, a, C),
            bn = !1,
            M = t.memoizedState,
            u.state = M,
            yl(t, a, u, s),
            pl();
            var L = t.memoizedState;
            h !== Y || M !== L || bn || e !== null && e.dependencies !== null && Ci(e.dependencies) ? (typeof x == "function" && (io(t, n, x, a),
            L = t.memoizedState),
            (H = bn || rd(t, n, H, a, M, L, C) || e !== null && e.dependencies !== null && Ci(e.dependencies)) ? (R || typeof u.UNSAFE_componentWillUpdate != "function" && typeof u.componentWillUpdate != "function" || (typeof u.componentWillUpdate == "function" && u.componentWillUpdate(a, L, C),
            typeof u.UNSAFE_componentWillUpdate == "function" && u.UNSAFE_componentWillUpdate(a, L, C)),
            typeof u.componentDidUpdate == "function" && (t.flags |= 4),
            typeof u.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof u.componentDidUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 4),
            typeof u.getSnapshotBeforeUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 1024),
            t.memoizedProps = a,
            t.memoizedState = L),
            u.props = a,
            u.state = L,
            u.context = C,
            a = H) : (typeof u.componentDidUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 4),
            typeof u.getSnapshotBeforeUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 1024),
            a = !1)
        }
        return u = a,
        Qi(e, t),
        a = (t.flags & 128) !== 0,
        u || a ? (u = t.stateNode,
        n = a && typeof n.getDerivedStateFromError != "function" ? null : u.render(),
        t.flags |= 1,
        e !== null && a ? (t.child = In(t, e.child, null, s),
        t.child = In(t, null, n, s)) : Pe(e, t, n, s),
        t.memoizedState = u.state,
        e = t.child) : e = tn(e, t, s),
        e
    }
    function Ed(e, t, n, a) {
        return Zn(),
        t.flags |= 256,
        Pe(e, t, n, a),
        t.child
    }
    var co = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null
    };
    function fo(e) {
        return {
            baseLanes: e,
            cachePool: df()
        }
    }
    function ho(e, t, n) {
        return e = e !== null ? e.childLanes & ~n : 0,
        t && (e |= bt),
        e
    }
    function Nd(e, t, n) {
        var a = t.pendingProps, s = !1, u = (t.flags & 128) !== 0, h;
        if ((h = u) || (h = e !== null && e.memoizedState === null ? !1 : (qe.current & 2) !== 0),
        h && (s = !0,
        t.flags &= -129),
        h = (t.flags & 32) !== 0,
        t.flags &= -33,
        e === null) {
            if (xe) {
                if (s ? En(t) : Nn(),
                (e = De) ? (e = Mh(e, At),
                e = e !== null && e.data !== "&" ? e : null,
                e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: pn !== null ? {
                        id: Ht,
                        overflow: Bt
                    } : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                },
                n = nf(e),
                n.return = t,
                t.child = n,
                We = t,
                De = null)) : e = null,
                e === null)
                    throw xn(t);
                return Jo(e) ? t.lanes = 32 : t.lanes = 536870912,
                null
            }
            var x = a.children;
            return a = a.fallback,
            s ? (Nn(),
            s = t.mode,
            x = Xi({
                mode: "hidden",
                children: x
            }, s),
            a = Xn(a, s, n, null),
            x.return = t,
            a.return = t,
            x.sibling = a,
            t.child = x,
            a = t.child,
            a.memoizedState = fo(n),
            a.childLanes = ho(e, h, n),
            t.memoizedState = co,
            wl(null, a)) : (En(t),
            mo(t, x))
        }
        var C = e.memoizedState;
        if (C !== null && (x = C.dehydrated,
        x !== null)) {
            if (u)
                t.flags & 256 ? (En(t),
                t.flags &= -257,
                t = go(e, t, n)) : t.memoizedState !== null ? (Nn(),
                t.child = e.child,
                t.flags |= 128,
                t = null) : (Nn(),
                x = a.fallback,
                s = t.mode,
                a = Xi({
                    mode: "visible",
                    children: a.children
                }, s),
                x = Xn(x, s, n, null),
                x.flags |= 2,
                a.return = t,
                x.return = t,
                a.sibling = x,
                t.child = a,
                In(t, e.child, null, n),
                a = t.child,
                a.memoizedState = fo(n),
                a.childLanes = ho(e, h, n),
                t.memoizedState = co,
                t = wl(null, a));
            else if (En(t),
            Jo(x)) {
                if (h = x.nextSibling && x.nextSibling.dataset,
                h)
                    var R = h.dgst;
                h = R,
                a = Error(o(419)),
                a.stack = "",
                a.digest = h,
                cl({
                    value: a,
                    source: null,
                    stack: null
                }),
                t = go(e, t, n)
            } else if (Ve || ba(e, t, n, !1),
            h = (n & e.childLanes) !== 0,
            Ve || h) {
                if (h = Re,
                h !== null && (a = uc(h, n),
                a !== 0 && a !== C.retryLane))
                    throw C.retryLane = a,
                    Qn(e, a),
                    ft(h, e, a),
                    oo;
                Fo(x) || es(),
                t = go(e, t, n)
            } else
                Fo(x) ? (t.flags |= 192,
                t.child = e.child,
                t = null) : (e = C.treeContext,
                De = Ot(x.nextSibling),
                We = t,
                xe = !0,
                yn = null,
                At = !1,
                e !== null && sf(t, e),
                t = mo(t, a.children),
                t.flags |= 4096);
            return t
        }
        return s ? (Nn(),
        x = a.fallback,
        s = t.mode,
        C = e.child,
        R = C.sibling,
        a = Jt(C, {
            mode: "hidden",
            children: a.children
        }),
        a.subtreeFlags = C.subtreeFlags & 65011712,
        R !== null ? x = Jt(R, x) : (x = Xn(x, s, n, null),
        x.flags |= 2),
        x.return = t,
        a.return = t,
        a.sibling = x,
        t.child = a,
        wl(null, a),
        a = t.child,
        x = e.child.memoizedState,
        x === null ? x = fo(n) : (s = x.cachePool,
        s !== null ? (C = Ge._currentValue,
        s = s.parent !== C ? {
            parent: C,
            pool: C
        } : s) : s = df(),
        x = {
            baseLanes: x.baseLanes | n,
            cachePool: s
        }),
        a.memoizedState = x,
        a.childLanes = ho(e, h, n),
        t.memoizedState = co,
        wl(e.child, a)) : (En(t),
        n = e.child,
        e = n.sibling,
        n = Jt(n, {
            mode: "visible",
            children: a.children
        }),
        n.return = t,
        n.sibling = null,
        e !== null && (h = t.deletions,
        h === null ? (t.deletions = [e],
        t.flags |= 16) : h.push(e)),
        t.child = n,
        t.memoizedState = null,
        n)
    }
    function mo(e, t) {
        return t = Xi({
            mode: "visible",
            children: t
        }, e.mode),
        t.return = e,
        e.child = t
    }
    function Xi(e, t) {
        return e = pt(22, e, null, t),
        e.lanes = 0,
        e
    }
    function go(e, t, n) {
        return In(t, e.child, null, n),
        e = mo(t, t.pendingProps.children),
        e.flags |= 2,
        t.memoizedState = null,
        e
    }
    function Cd(e, t, n) {
        e.lanes |= t;
        var a = e.alternate;
        a !== null && (a.lanes |= t),
        Tr(e.return, t, n)
    }
    function po(e, t, n, a, s, u) {
        var h = e.memoizedState;
        h === null ? e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: a,
            tail: n,
            tailMode: s,
            treeForkCount: u
        } : (h.isBackwards = t,
        h.rendering = null,
        h.renderingStartTime = 0,
        h.last = a,
        h.tail = n,
        h.tailMode = s,
        h.treeForkCount = u)
    }
    function _d(e, t, n) {
        var a = t.pendingProps
          , s = a.revealOrder
          , u = a.tail;
        a = a.children;
        var h = qe.current
          , x = (h & 2) !== 0;
        if (x ? (h = h & 1 | 2,
        t.flags |= 128) : h &= 1,
        K(qe, h),
        Pe(e, t, a, n),
        a = xe ? ul : 0,
        !x && e !== null && (e.flags & 128) !== 0)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13)
                    e.memoizedState !== null && Cd(e, n, t);
                else if (e.tag === 19)
                    Cd(e, n, t);
                else if (e.child !== null) {
                    e.child.return = e,
                    e = e.child;
                    continue
                }
                if (e === t)
                    break e;
                for (; e.sibling === null; ) {
                    if (e.return === null || e.return === t)
                        break e;
                    e = e.return
                }
                e.sibling.return = e.return,
                e = e.sibling
            }
        switch (s) {
        case "forwards":
            for (n = t.child,
            s = null; n !== null; )
                e = n.alternate,
                e !== null && Di(e) === null && (s = n),
                n = n.sibling;
            n = s,
            n === null ? (s = t.child,
            t.child = null) : (s = n.sibling,
            n.sibling = null),
            po(t, !1, s, n, u, a);
            break;
        case "backwards":
        case "unstable_legacy-backwards":
            for (n = null,
            s = t.child,
            t.child = null; s !== null; ) {
                if (e = s.alternate,
                e !== null && Di(e) === null) {
                    t.child = s;
                    break
                }
                e = s.sibling,
                s.sibling = n,
                n = s,
                s = e
            }
            po(t, !0, n, null, u, a);
            break;
        case "together":
            po(t, !1, null, null, void 0, a);
            break;
        default:
            t.memoizedState = null
        }
        return t.child
    }
    function tn(e, t, n) {
        if (e !== null && (t.dependencies = e.dependencies),
        jn |= t.lanes,
        (n & t.childLanes) === 0)
            if (e !== null) {
                if (ba(e, t, n, !1),
                (n & t.childLanes) === 0)
                    return null
            } else
                return null;
        if (e !== null && t.child !== e.child)
            throw Error(o(153));
        if (t.child !== null) {
            for (e = t.child,
            n = Jt(e, e.pendingProps),
            t.child = n,
            n.return = t; e.sibling !== null; )
                e = e.sibling,
                n = n.sibling = Jt(e, e.pendingProps),
                n.return = t;
            n.sibling = null
        }
        return t.child
    }
    function yo(e, t) {
        return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies,
        !!(e !== null && Ci(e)))
    }
    function q0(e, t, n) {
        switch (t.tag) {
        case 3:
            at(t, t.stateNode.containerInfo),
            vn(t, Ge, e.memoizedState.cache),
            Zn();
            break;
        case 27:
        case 5:
            Fa(t);
            break;
        case 4:
            at(t, t.stateNode.containerInfo);
            break;
        case 10:
            vn(t, t.type, t.memoizedProps.value);
            break;
        case 31:
            if (t.memoizedState !== null)
                return t.flags |= 128,
                Gr(t),
                null;
            break;
        case 13:
            var a = t.memoizedState;
            if (a !== null)
                return a.dehydrated !== null ? (En(t),
                t.flags |= 128,
                null) : (n & t.child.childLanes) !== 0 ? Nd(e, t, n) : (En(t),
                e = tn(e, t, n),
                e !== null ? e.sibling : null);
            En(t);
            break;
        case 19:
            var s = (e.flags & 128) !== 0;
            if (a = (n & t.childLanes) !== 0,
            a || (ba(e, t, n, !1),
            a = (n & t.childLanes) !== 0),
            s) {
                if (a)
                    return _d(e, t, n);
                t.flags |= 128
            }
            if (s = t.memoizedState,
            s !== null && (s.rendering = null,
            s.tail = null,
            s.lastEffect = null),
            K(qe, qe.current),
            a)
                break;
            return null;
        case 22:
            return t.lanes = 0,
            xd(e, t, n, t.pendingProps);
        case 24:
            vn(t, Ge, e.memoizedState.cache)
        }
        return tn(e, t, n)
    }
    function jd(e, t, n) {
        if (e !== null)
            if (e.memoizedProps !== t.pendingProps)
                Ve = !0;
            else {
                if (!yo(e, n) && (t.flags & 128) === 0)
                    return Ve = !1,
                    q0(e, t, n);
                Ve = (e.flags & 131072) !== 0
            }
        else
            Ve = !1,
            xe && (t.flags & 1048576) !== 0 && lf(t, ul, t.index);
        switch (t.lanes = 0,
        t.tag) {
        case 16:
            e: {
                var a = t.pendingProps;
                if (e = $n(t.elementType),
                t.type = e,
                typeof e == "function")
                    Sr(e) ? (a = ea(e, a),
                    t.tag = 1,
                    t = wd(null, t, e, a, n)) : (t.tag = 0,
                    t = uo(null, t, e, a, n));
                else {
                    if (e != null) {
                        var s = e.$$typeof;
                        if (s === $) {
                            t.tag = 11,
                            t = gd(null, t, e, a, n);
                            break e
                        } else if (s === Z) {
                            t.tag = 14,
                            t = pd(null, t, e, a, n);
                            break e
                        }
                    }
                    throw t = ce(e) || e,
                    Error(o(306, t, ""))
                }
            }
            return t;
        case 0:
            return uo(e, t, t.type, t.pendingProps, n);
        case 1:
            return a = t.type,
            s = ea(a, t.pendingProps),
            wd(e, t, a, s, n);
        case 3:
            e: {
                if (at(t, t.stateNode.containerInfo),
                e === null)
                    throw Error(o(387));
                a = t.pendingProps;
                var u = t.memoizedState;
                s = u.element,
                Ur(e, t),
                yl(t, a, null, n);
                var h = t.memoizedState;
                if (a = h.cache,
                vn(t, Ge, a),
                a !== u.cache && Or(t, [Ge], n, !0),
                pl(),
                a = h.element,
                u.isDehydrated)
                    if (u = {
                        element: a,
                        isDehydrated: !1,
                        cache: h.cache
                    },
                    t.updateQueue.baseState = u,
                    t.memoizedState = u,
                    t.flags & 256) {
                        t = Ed(e, t, a, n);
                        break e
                    } else if (a !== s) {
                        s = Ct(Error(o(424)), t),
                        cl(s),
                        t = Ed(e, t, a, n);
                        break e
                    } else
                        for (e = t.stateNode.containerInfo,
                        e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e,
                        De = Ot(e.firstChild),
                        We = t,
                        xe = !0,
                        yn = null,
                        At = !0,
                        n = xf(t, null, a, n),
                        t.child = n; n; )
                            n.flags = n.flags & -3 | 4096,
                            n = n.sibling;
                else {
                    if (Zn(),
                    a === s) {
                        t = tn(e, t, n);
                        break e
                    }
                    Pe(e, t, a, n)
                }
                t = t.child
            }
            return t;
        case 26:
            return Qi(e, t),
            e === null ? (n = Bh(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : xe || (n = t.type,
            e = t.pendingProps,
            a = rs(he.current).createElement(n),
            a[$e] = t,
            a[it] = e,
            et(a, n, e),
            Ke(a),
            t.stateNode = a) : t.memoizedState = Bh(t.type, e.memoizedProps, t.pendingProps, e.memoizedState),
            null;
        case 27:
            return Fa(t),
            e === null && xe && (a = t.stateNode = zh(t.type, t.pendingProps, he.current),
            We = t,
            At = !0,
            s = De,
            Mn(t.type) ? ($o = s,
            De = Ot(a.firstChild)) : De = s),
            Pe(e, t, t.pendingProps.children, n),
            Qi(e, t),
            e === null && (t.flags |= 4194304),
            t.child;
        case 5:
            return e === null && xe && ((s = a = De) && (a = gy(a, t.type, t.pendingProps, At),
            a !== null ? (t.stateNode = a,
            We = t,
            De = Ot(a.firstChild),
            At = !1,
            s = !0) : s = !1),
            s || xn(t)),
            Fa(t),
            s = t.type,
            u = t.pendingProps,
            h = e !== null ? e.memoizedProps : null,
            a = u.children,
            Xo(s, u) ? a = null : h !== null && Xo(s, h) && (t.flags |= 32),
            t.memoizedState !== null && (s = Vr(e, t, O0, null, null, n),
            Hl._currentValue = s),
            Qi(e, t),
            Pe(e, t, a, n),
            t.child;
        case 6:
            return e === null && xe && ((e = n = De) && (n = py(n, t.pendingProps, At),
            n !== null ? (t.stateNode = n,
            We = t,
            De = null,
            e = !0) : e = !1),
            e || xn(t)),
            null;
        case 13:
            return Nd(e, t, n);
        case 4:
            return at(t, t.stateNode.containerInfo),
            a = t.pendingProps,
            e === null ? t.child = In(t, null, a, n) : Pe(e, t, a, n),
            t.child;
        case 11:
            return gd(e, t, t.type, t.pendingProps, n);
        case 7:
            return Pe(e, t, t.pendingProps, n),
            t.child;
        case 8:
            return Pe(e, t, t.pendingProps.children, n),
            t.child;
        case 12:
            return Pe(e, t, t.pendingProps.children, n),
            t.child;
        case 10:
            return a = t.pendingProps,
            vn(t, t.type, a.value),
            Pe(e, t, a.children, n),
            t.child;
        case 9:
            return s = t.type._context,
            a = t.pendingProps.children,
            Fn(t),
            s = Ie(s),
            a = a(s),
            t.flags |= 1,
            Pe(e, t, a, n),
            t.child;
        case 14:
            return pd(e, t, t.type, t.pendingProps, n);
        case 15:
            return yd(e, t, t.type, t.pendingProps, n);
        case 19:
            return _d(e, t, n);
        case 31:
            return B0(e, t, n);
        case 22:
            return xd(e, t, n, t.pendingProps);
        case 24:
            return Fn(t),
            a = Ie(Ge),
            e === null ? (s = Dr(),
            s === null && (s = Re,
            u = Rr(),
            s.pooledCache = u,
            u.refCount++,
            u !== null && (s.pooledCacheLanes |= n),
            s = u),
            t.memoizedState = {
                parent: a,
                cache: s
            },
            zr(t),
            vn(t, Ge, s)) : ((e.lanes & n) !== 0 && (Ur(e, t),
            yl(t, null, null, n),
            pl()),
            s = e.memoizedState,
            u = t.memoizedState,
            s.parent !== a ? (s = {
                parent: a,
                cache: a
            },
            t.memoizedState = s,
            t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = s),
            vn(t, Ge, a)) : (a = u.cache,
            vn(t, Ge, a),
            a !== s.cache && Or(t, [Ge], n, !0))),
            Pe(e, t, t.pendingProps.children, n),
            t.child;
        case 29:
            throw t.pendingProps
        }
        throw Error(o(156, t.tag))
    }
    function nn(e) {
        e.flags |= 4
    }
    function xo(e, t, n, a, s) {
        if ((t = (e.mode & 32) !== 0) && (t = !1),
        t) {
            if (e.flags |= 16777216,
            (s & 335544128) === s)
                if (e.stateNode.complete)
                    e.flags |= 8192;
                else if (eh())
                    e.flags |= 8192;
                else
                    throw Wn = Ti,
                    Lr
        } else
            e.flags &= -16777217
    }
    function Ad(e, t) {
        if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0)
            e.flags &= -16777217;
        else if (e.flags |= 16777216,
        !Vh(t))
            if (eh())
                e.flags |= 8192;
            else
                throw Wn = Ti,
                Lr
    }
    function Zi(e, t) {
        t !== null && (e.flags |= 4),
        e.flags & 16384 && (t = e.tag !== 22 ? sc() : 536870912,
        e.lanes |= t,
        Ma |= t)
    }
    function El(e, t) {
        if (!xe)
            switch (e.tailMode) {
            case "hidden":
                t = e.tail;
                for (var n = null; t !== null; )
                    t.alternate !== null && (n = t),
                    t = t.sibling;
                n === null ? e.tail = null : n.sibling = null;
                break;
            case "collapsed":
                n = e.tail;
                for (var a = null; n !== null; )
                    n.alternate !== null && (a = n),
                    n = n.sibling;
                a === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : a.sibling = null
            }
    }
    function Le(e) {
        var t = e.alternate !== null && e.alternate.child === e.child
          , n = 0
          , a = 0;
        if (t)
            for (var s = e.child; s !== null; )
                n |= s.lanes | s.childLanes,
                a |= s.subtreeFlags & 65011712,
                a |= s.flags & 65011712,
                s.return = e,
                s = s.sibling;
        else
            for (s = e.child; s !== null; )
                n |= s.lanes | s.childLanes,
                a |= s.subtreeFlags,
                a |= s.flags,
                s.return = e,
                s = s.sibling;
        return e.subtreeFlags |= a,
        e.childLanes = n,
        t
    }
    function k0(e, t, n) {
        var a = t.pendingProps;
        switch (Cr(t),
        t.tag) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
            return Le(t),
            null;
        case 1:
            return Le(t),
            null;
        case 3:
            return n = t.stateNode,
            a = null,
            e !== null && (a = e.memoizedState.cache),
            t.memoizedState.cache !== a && (t.flags |= 2048),
            It(Ge),
            Be(),
            n.pendingContext && (n.context = n.pendingContext,
            n.pendingContext = null),
            (e === null || e.child === null) && (va(t) ? nn(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024,
            jr())),
            Le(t),
            null;
        case 26:
            var s = t.type
              , u = t.memoizedState;
            return e === null ? (nn(t),
            u !== null ? (Le(t),
            Ad(t, u)) : (Le(t),
            xo(t, s, null, a, n))) : u ? u !== e.memoizedState ? (nn(t),
            Le(t),
            Ad(t, u)) : (Le(t),
            t.flags &= -16777217) : (e = e.memoizedProps,
            e !== a && nn(t),
            Le(t),
            xo(t, s, e, a, n)),
            null;
        case 27:
            if (ai(t),
            n = he.current,
            s = t.type,
            e !== null && t.stateNode != null)
                e.memoizedProps !== a && nn(t);
            else {
                if (!a) {
                    if (t.stateNode === null)
                        throw Error(o(166));
                    return Le(t),
                    null
                }
                e = I.current,
                va(t) ? rf(t) : (e = zh(s, a, n),
                t.stateNode = e,
                nn(t))
            }
            return Le(t),
            null;
        case 5:
            if (ai(t),
            s = t.type,
            e !== null && t.stateNode != null)
                e.memoizedProps !== a && nn(t);
            else {
                if (!a) {
                    if (t.stateNode === null)
                        throw Error(o(166));
                    return Le(t),
                    null
                }
                if (u = I.current,
                va(t))
                    rf(t);
                else {
                    var h = rs(he.current);
                    switch (u) {
                    case 1:
                        u = h.createElementNS("http://www.w3.org/2000/svg", s);
                        break;
                    case 2:
                        u = h.createElementNS("http://www.w3.org/1998/Math/MathML", s);
                        break;
                    default:
                        switch (s) {
                        case "svg":
                            u = h.createElementNS("http://www.w3.org/2000/svg", s);
                            break;
                        case "math":
                            u = h.createElementNS("http://www.w3.org/1998/Math/MathML", s);
                            break;
                        case "script":
                            u = h.createElement("div"),
                            u.innerHTML = "<script><\/script>",
                            u = u.removeChild(u.firstChild);
                            break;
                        case "select":
                            u = typeof a.is == "string" ? h.createElement("select", {
                                is: a.is
                            }) : h.createElement("select"),
                            a.multiple ? u.multiple = !0 : a.size && (u.size = a.size);
                            break;
                        default:
                            u = typeof a.is == "string" ? h.createElement(s, {
                                is: a.is
                            }) : h.createElement(s)
                        }
                    }
                    u[$e] = t,
                    u[it] = a;
                    e: for (h = t.child; h !== null; ) {
                        if (h.tag === 5 || h.tag === 6)
                            u.appendChild(h.stateNode);
                        else if (h.tag !== 4 && h.tag !== 27 && h.child !== null) {
                            h.child.return = h,
                            h = h.child;
                            continue
                        }
                        if (h === t)
                            break e;
                        for (; h.sibling === null; ) {
                            if (h.return === null || h.return === t)
                                break e;
                            h = h.return
                        }
                        h.sibling.return = h.return,
                        h = h.sibling
                    }
                    t.stateNode = u;
                    e: switch (et(u, s, a),
                    s) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                        a = !!a.autoFocus;
                        break e;
                    case "img":
                        a = !0;
                        break e;
                    default:
                        a = !1
                    }
                    a && nn(t)
                }
            }
            return Le(t),
            xo(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n),
            null;
        case 6:
            if (e && t.stateNode != null)
                e.memoizedProps !== a && nn(t);
            else {
                if (typeof a != "string" && t.stateNode === null)
                    throw Error(o(166));
                if (e = he.current,
                va(t)) {
                    if (e = t.stateNode,
                    n = t.memoizedProps,
                    a = null,
                    s = We,
                    s !== null)
                        switch (s.tag) {
                        case 27:
                        case 5:
                            a = s.memoizedProps
                        }
                    e[$e] = t,
                    e = !!(e.nodeValue === n || a !== null && a.suppressHydrationWarning === !0 || Nh(e.nodeValue, n)),
                    e || xn(t, !0)
                } else
                    e = rs(e).createTextNode(a),
                    e[$e] = t,
                    t.stateNode = e
            }
            return Le(t),
            null;
        case 31:
            if (n = t.memoizedState,
            e === null || e.memoizedState !== null) {
                if (a = va(t),
                n !== null) {
                    if (e === null) {
                        if (!a)
                            throw Error(o(318));
                        if (e = t.memoizedState,
                        e = e !== null ? e.dehydrated : null,
                        !e)
                            throw Error(o(557));
                        e[$e] = t
                    } else
                        Zn(),
                        (t.flags & 128) === 0 && (t.memoizedState = null),
                        t.flags |= 4;
                    Le(t),
                    e = !1
                } else
                    n = jr(),
                    e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n),
                    e = !0;
                if (!e)
                    return t.flags & 256 ? (xt(t),
                    t) : (xt(t),
                    null);
                if ((t.flags & 128) !== 0)
                    throw Error(o(558))
            }
            return Le(t),
            null;
        case 13:
            if (a = t.memoizedState,
            e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
                if (s = va(t),
                a !== null && a.dehydrated !== null) {
                    if (e === null) {
                        if (!s)
                            throw Error(o(318));
                        if (s = t.memoizedState,
                        s = s !== null ? s.dehydrated : null,
                        !s)
                            throw Error(o(317));
                        s[$e] = t
                    } else
                        Zn(),
                        (t.flags & 128) === 0 && (t.memoizedState = null),
                        t.flags |= 4;
                    Le(t),
                    s = !1
                } else
                    s = jr(),
                    e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = s),
                    s = !0;
                if (!s)
                    return t.flags & 256 ? (xt(t),
                    t) : (xt(t),
                    null)
            }
            return xt(t),
            (t.flags & 128) !== 0 ? (t.lanes = n,
            t) : (n = a !== null,
            e = e !== null && e.memoizedState !== null,
            n && (a = t.child,
            s = null,
            a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (s = a.alternate.memoizedState.cachePool.pool),
            u = null,
            a.memoizedState !== null && a.memoizedState.cachePool !== null && (u = a.memoizedState.cachePool.pool),
            u !== s && (a.flags |= 2048)),
            n !== e && n && (t.child.flags |= 8192),
            Zi(t, t.updateQueue),
            Le(t),
            null);
        case 4:
            return Be(),
            e === null && ko(t.stateNode.containerInfo),
            Le(t),
            null;
        case 10:
            return It(t.type),
            Le(t),
            null;
        case 19:
            if (B(qe),
            a = t.memoizedState,
            a === null)
                return Le(t),
                null;
            if (s = (t.flags & 128) !== 0,
            u = a.rendering,
            u === null)
                if (s)
                    El(a, !1);
                else {
                    if (He !== 0 || e !== null && (e.flags & 128) !== 0)
                        for (e = t.child; e !== null; ) {
                            if (u = Di(e),
                            u !== null) {
                                for (t.flags |= 128,
                                El(a, !1),
                                e = u.updateQueue,
                                t.updateQueue = e,
                                Zi(t, e),
                                t.subtreeFlags = 0,
                                e = n,
                                n = t.child; n !== null; )
                                    tf(n, e),
                                    n = n.sibling;
                                return K(qe, qe.current & 1 | 2),
                                xe && $t(t, a.treeForkCount),
                                t.child
                            }
                            e = e.sibling
                        }
                    a.tail !== null && dt() > Wi && (t.flags |= 128,
                    s = !0,
                    El(a, !1),
                    t.lanes = 4194304)
                }
            else {
                if (!s)
                    if (e = Di(u),
                    e !== null) {
                        if (t.flags |= 128,
                        s = !0,
                        e = e.updateQueue,
                        t.updateQueue = e,
                        Zi(t, e),
                        El(a, !0),
                        a.tail === null && a.tailMode === "hidden" && !u.alternate && !xe)
                            return Le(t),
                            null
                    } else
                        2 * dt() - a.renderingStartTime > Wi && n !== 536870912 && (t.flags |= 128,
                        s = !0,
                        El(a, !1),
                        t.lanes = 4194304);
                a.isBackwards ? (u.sibling = t.child,
                t.child = u) : (e = a.last,
                e !== null ? e.sibling = u : t.child = u,
                a.last = u)
            }
            return a.tail !== null ? (e = a.tail,
            a.rendering = e,
            a.tail = e.sibling,
            a.renderingStartTime = dt(),
            e.sibling = null,
            n = qe.current,
            K(qe, s ? n & 1 | 2 : n & 1),
            xe && $t(t, a.treeForkCount),
            e) : (Le(t),
            null);
        case 22:
        case 23:
            return xt(t),
            kr(),
            a = t.memoizedState !== null,
            e !== null ? e.memoizedState !== null !== a && (t.flags |= 8192) : a && (t.flags |= 8192),
            a ? (n & 536870912) !== 0 && (t.flags & 128) === 0 && (Le(t),
            t.subtreeFlags & 6 && (t.flags |= 8192)) : Le(t),
            n = t.updateQueue,
            n !== null && Zi(t, n.retryQueue),
            n = null,
            e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool),
            a = null,
            t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool),
            a !== n && (t.flags |= 2048),
            e !== null && B(Jn),
            null;
        case 24:
            return n = null,
            e !== null && (n = e.memoizedState.cache),
            t.memoizedState.cache !== n && (t.flags |= 2048),
            It(Ge),
            Le(t),
            null;
        case 25:
            return null;
        case 30:
            return null
        }
        throw Error(o(156, t.tag))
    }
    function G0(e, t) {
        switch (Cr(t),
        t.tag) {
        case 1:
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 3:
            return It(Ge),
            Be(),
            e = t.flags,
            (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 26:
        case 27:
        case 5:
            return ai(t),
            null;
        case 31:
            if (t.memoizedState !== null) {
                if (xt(t),
                t.alternate === null)
                    throw Error(o(340));
                Zn()
            }
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 13:
            if (xt(t),
            e = t.memoizedState,
            e !== null && e.dehydrated !== null) {
                if (t.alternate === null)
                    throw Error(o(340));
                Zn()
            }
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 19:
            return B(qe),
            null;
        case 4:
            return Be(),
            null;
        case 10:
            return It(t.type),
            null;
        case 22:
        case 23:
            return xt(t),
            kr(),
            e !== null && B(Jn),
            e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 24:
            return It(Ge),
            null;
        case 25:
            return null;
        default:
            return null
        }
    }
    function Td(e, t) {
        switch (Cr(t),
        t.tag) {
        case 3:
            It(Ge),
            Be();
            break;
        case 26:
        case 27:
        case 5:
            ai(t);
            break;
        case 4:
            Be();
            break;
        case 31:
            t.memoizedState !== null && xt(t);
            break;
        case 13:
            xt(t);
            break;
        case 19:
            B(qe);
            break;
        case 10:
            It(t.type);
            break;
        case 22:
        case 23:
            xt(t),
            kr(),
            e !== null && B(Jn);
            break;
        case 24:
            It(Ge)
        }
    }
    function Nl(e, t) {
        try {
            var n = t.updateQueue
              , a = n !== null ? n.lastEffect : null;
            if (a !== null) {
                var s = a.next;
                n = s;
                do {
                    if ((n.tag & e) === e) {
                        a = void 0;
                        var u = n.create
                          , h = n.inst;
                        a = u(),
                        h.destroy = a
                    }
                    n = n.next
                } while (n !== s)
            }
        } catch (x) {
            je(t, t.return, x)
        }
    }
    function Cn(e, t, n) {
        try {
            var a = t.updateQueue
              , s = a !== null ? a.lastEffect : null;
            if (s !== null) {
                var u = s.next;
                a = u;
                do {
                    if ((a.tag & e) === e) {
                        var h = a.inst
                          , x = h.destroy;
                        if (x !== void 0) {
                            h.destroy = void 0,
                            s = t;
                            var C = n
                              , R = x;
                            try {
                                R()
                            } catch (H) {
                                je(s, C, H)
                            }
                        }
                    }
                    a = a.next
                } while (a !== u)
            }
        } catch (H) {
            je(t, t.return, H)
        }
    }
    function Od(e) {
        var t = e.updateQueue;
        if (t !== null) {
            var n = e.stateNode;
            try {
                bf(t, n)
            } catch (a) {
                je(e, e.return, a)
            }
        }
    }
    function Rd(e, t, n) {
        n.props = ea(e.type, e.memoizedProps),
        n.state = e.memoizedState;
        try {
            n.componentWillUnmount()
        } catch (a) {
            je(e, t, a)
        }
    }
    function Cl(e, t) {
        try {
            var n = e.ref;
            if (n !== null) {
                switch (e.tag) {
                case 26:
                case 27:
                case 5:
                    var a = e.stateNode;
                    break;
                case 30:
                    a = e.stateNode;
                    break;
                default:
                    a = e.stateNode
                }
                typeof n == "function" ? e.refCleanup = n(a) : n.current = a
            }
        } catch (s) {
            je(e, t, s)
        }
    }
    function qt(e, t) {
        var n = e.ref
          , a = e.refCleanup;
        if (n !== null)
            if (typeof a == "function")
                try {
                    a()
                } catch (s) {
                    je(e, t, s)
                } finally {
                    e.refCleanup = null,
                    e = e.alternate,
                    e != null && (e.refCleanup = null)
                }
            else if (typeof n == "function")
                try {
                    n(null)
                } catch (s) {
                    je(e, t, s)
                }
            else
                n.current = null
    }
    function Md(e) {
        var t = e.type
          , n = e.memoizedProps
          , a = e.stateNode;
        try {
            e: switch (t) {
            case "button":
            case "input":
            case "select":
            case "textarea":
                n.autoFocus && a.focus();
                break e;
            case "img":
                n.src ? a.src = n.src : n.srcSet && (a.srcset = n.srcSet)
            }
        } catch (s) {
            je(e, e.return, s)
        }
    }
    function vo(e, t, n) {
        try {
            var a = e.stateNode;
            uy(a, e.type, n, t),
            a[it] = t
        } catch (s) {
            je(e, e.return, s)
        }
    }
    function Dd(e) {
        return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Mn(e.type) || e.tag === 4
    }
    function bo(e) {
        e: for (; ; ) {
            for (; e.sibling === null; ) {
                if (e.return === null || Dd(e.return))
                    return null;
                e = e.return
            }
            for (e.sibling.return = e.return,
            e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
                if (e.tag === 27 && Mn(e.type) || e.flags & 2 || e.child === null || e.tag === 4)
                    continue e;
                e.child.return = e,
                e = e.child
            }
            if (!(e.flags & 2))
                return e.stateNode
        }
    }
    function So(e, t, n) {
        var a = e.tag;
        if (a === 5 || a === 6)
            e = e.stateNode,
            t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n,
            t.appendChild(e),
            n = n._reactRootContainer,
            n != null || t.onclick !== null || (t.onclick = Kt));
        else if (a !== 4 && (a === 27 && Mn(e.type) && (n = e.stateNode,
        t = null),
        e = e.child,
        e !== null))
            for (So(e, t, n),
            e = e.sibling; e !== null; )
                So(e, t, n),
                e = e.sibling
    }
    function Ki(e, t, n) {
        var a = e.tag;
        if (a === 5 || a === 6)
            e = e.stateNode,
            t ? n.insertBefore(e, t) : n.appendChild(e);
        else if (a !== 4 && (a === 27 && Mn(e.type) && (n = e.stateNode),
        e = e.child,
        e !== null))
            for (Ki(e, t, n),
            e = e.sibling; e !== null; )
                Ki(e, t, n),
                e = e.sibling
    }
    function Ld(e) {
        var t = e.stateNode
          , n = e.memoizedProps;
        try {
            for (var a = e.type, s = t.attributes; s.length; )
                t.removeAttributeNode(s[0]);
            et(t, a, n),
            t[$e] = e,
            t[it] = n
        } catch (u) {
            je(e, e.return, u)
        }
    }
    var an = !1
      , Qe = !1
      , wo = !1
      , zd = typeof WeakSet == "function" ? WeakSet : Set
      , Fe = null;
    function Y0(e, t) {
        if (e = e.containerInfo,
        Vo = ms,
        e = Zc(e),
        mr(e)) {
            if ("selectionStart"in e)
                var n = {
                    start: e.selectionStart,
                    end: e.selectionEnd
                };
            else
                e: {
                    n = (n = e.ownerDocument) && n.defaultView || window;
                    var a = n.getSelection && n.getSelection();
                    if (a && a.rangeCount !== 0) {
                        n = a.anchorNode;
                        var s = a.anchorOffset
                          , u = a.focusNode;
                        a = a.focusOffset;
                        try {
                            n.nodeType,
                            u.nodeType
                        } catch {
                            n = null;
                            break e
                        }
                        var h = 0
                          , x = -1
                          , C = -1
                          , R = 0
                          , H = 0
                          , Y = e
                          , M = null;
                        t: for (; ; ) {
                            for (var L; Y !== n || s !== 0 && Y.nodeType !== 3 || (x = h + s),
                            Y !== u || a !== 0 && Y.nodeType !== 3 || (C = h + a),
                            Y.nodeType === 3 && (h += Y.nodeValue.length),
                            (L = Y.firstChild) !== null; )
                                M = Y,
                                Y = L;
                            for (; ; ) {
                                if (Y === e)
                                    break t;
                                if (M === n && ++R === s && (x = h),
                                M === u && ++H === a && (C = h),
                                (L = Y.nextSibling) !== null)
                                    break;
                                Y = M,
                                M = Y.parentNode
                            }
                            Y = L
                        }
                        n = x === -1 || C === -1 ? null : {
                            start: x,
                            end: C
                        }
                    } else
                        n = null
                }
            n = n || {
                start: 0,
                end: 0
            }
        } else
            n = null;
        for (Qo = {
            focusedElem: e,
            selectionRange: n
        },
        ms = !1,
        Fe = t; Fe !== null; )
            if (t = Fe,
            e = t.child,
            (t.subtreeFlags & 1028) !== 0 && e !== null)
                e.return = t,
                Fe = e;
            else
                for (; Fe !== null; ) {
                    switch (t = Fe,
                    u = t.alternate,
                    e = t.flags,
                    t.tag) {
                    case 0:
                        if ((e & 4) !== 0 && (e = t.updateQueue,
                        e = e !== null ? e.events : null,
                        e !== null))
                            for (n = 0; n < e.length; n++)
                                s = e[n],
                                s.ref.impl = s.nextImpl;
                        break;
                    case 11:
                    case 15:
                        break;
                    case 1:
                        if ((e & 1024) !== 0 && u !== null) {
                            e = void 0,
                            n = t,
                            s = u.memoizedProps,
                            u = u.memoizedState,
                            a = n.stateNode;
                            try {
                                var P = ea(n.type, s);
                                e = a.getSnapshotBeforeUpdate(P, u),
                                a.__reactInternalSnapshotBeforeUpdate = e
                            } catch (le) {
                                je(n, n.return, le)
                            }
                        }
                        break;
                    case 3:
                        if ((e & 1024) !== 0) {
                            if (e = t.stateNode.containerInfo,
                            n = e.nodeType,
                            n === 9)
                                Ko(e);
                            else if (n === 1)
                                switch (e.nodeName) {
                                case "HEAD":
                                case "HTML":
                                case "BODY":
                                    Ko(e);
                                    break;
                                default:
                                    e.textContent = ""
                                }
                        }
                        break;
                    case 5:
                    case 26:
                    case 27:
                    case 6:
                    case 4:
                    case 17:
                        break;
                    default:
                        if ((e & 1024) !== 0)
                            throw Error(o(163))
                    }
                    if (e = t.sibling,
                    e !== null) {
                        e.return = t.return,
                        Fe = e;
                        break
                    }
                    Fe = t.return
                }
    }
    function Ud(e, t, n) {
        var a = n.flags;
        switch (n.tag) {
        case 0:
        case 11:
        case 15:
            sn(e, n),
            a & 4 && Nl(5, n);
            break;
        case 1:
            if (sn(e, n),
            a & 4)
                if (e = n.stateNode,
                t === null)
                    try {
                        e.componentDidMount()
                    } catch (h) {
                        je(n, n.return, h)
                    }
                else {
                    var s = ea(n.type, t.memoizedProps);
                    t = t.memoizedState;
                    try {
                        e.componentDidUpdate(s, t, e.__reactInternalSnapshotBeforeUpdate)
                    } catch (h) {
                        je(n, n.return, h)
                    }
                }
            a & 64 && Od(n),
            a & 512 && Cl(n, n.return);
            break;
        case 3:
            if (sn(e, n),
            a & 64 && (e = n.updateQueue,
            e !== null)) {
                if (t = null,
                n.child !== null)
                    switch (n.child.tag) {
                    case 27:
                    case 5:
                        t = n.child.stateNode;
                        break;
                    case 1:
                        t = n.child.stateNode
                    }
                try {
                    bf(e, t)
                } catch (h) {
                    je(n, n.return, h)
                }
            }
            break;
        case 27:
            t === null && a & 4 && Ld(n);
        case 26:
        case 5:
            sn(e, n),
            t === null && a & 4 && Md(n),
            a & 512 && Cl(n, n.return);
            break;
        case 12:
            sn(e, n);
            break;
        case 31:
            sn(e, n),
            a & 4 && qd(e, n);
            break;
        case 13:
            sn(e, n),
            a & 4 && kd(e, n),
            a & 64 && (e = n.memoizedState,
            e !== null && (e = e.dehydrated,
            e !== null && (n = W0.bind(null, n),
            yy(e, n))));
            break;
        case 22:
            if (a = n.memoizedState !== null || an,
            !a) {
                t = t !== null && t.memoizedState !== null || Qe,
                s = an;
                var u = Qe;
                an = a,
                (Qe = t) && !u ? rn(e, n, (n.subtreeFlags & 8772) !== 0) : sn(e, n),
                an = s,
                Qe = u
            }
            break;
        case 30:
            break;
        default:
            sn(e, n)
        }
    }
    function Hd(e) {
        var t = e.alternate;
        t !== null && (e.alternate = null,
        Hd(t)),
        e.child = null,
        e.deletions = null,
        e.sibling = null,
        e.tag === 5 && (t = e.stateNode,
        t !== null && Ws(t)),
        e.stateNode = null,
        e.return = null,
        e.dependencies = null,
        e.memoizedProps = null,
        e.memoizedState = null,
        e.pendingProps = null,
        e.stateNode = null,
        e.updateQueue = null
    }
    var ze = null
      , rt = !1;
    function ln(e, t, n) {
        for (n = n.child; n !== null; )
            Bd(e, t, n),
            n = n.sibling
    }
    function Bd(e, t, n) {
        if (ht && typeof ht.onCommitFiberUnmount == "function")
            try {
                ht.onCommitFiberUnmount(Ja, n)
            } catch {}
        switch (n.tag) {
        case 26:
            Qe || qt(n, t),
            ln(e, t, n),
            n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode,
            n.parentNode.removeChild(n));
            break;
        case 27:
            Qe || qt(n, t);
            var a = ze
              , s = rt;
            Mn(n.type) && (ze = n.stateNode,
            rt = !1),
            ln(e, t, n),
            Ll(n.stateNode),
            ze = a,
            rt = s;
            break;
        case 5:
            Qe || qt(n, t);
        case 6:
            if (a = ze,
            s = rt,
            ze = null,
            ln(e, t, n),
            ze = a,
            rt = s,
            ze !== null)
                if (rt)
                    try {
                        (ze.nodeType === 9 ? ze.body : ze.nodeName === "HTML" ? ze.ownerDocument.body : ze).removeChild(n.stateNode)
                    } catch (u) {
                        je(n, t, u)
                    }
                else
                    try {
                        ze.removeChild(n.stateNode)
                    } catch (u) {
                        je(n, t, u)
                    }
            break;
        case 18:
            ze !== null && (rt ? (e = ze,
            Oh(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode),
            ka(e)) : Oh(ze, n.stateNode));
            break;
        case 4:
            a = ze,
            s = rt,
            ze = n.stateNode.containerInfo,
            rt = !0,
            ln(e, t, n),
            ze = a,
            rt = s;
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            Cn(2, n, t),
            Qe || Cn(4, n, t),
            ln(e, t, n);
            break;
        case 1:
            Qe || (qt(n, t),
            a = n.stateNode,
            typeof a.componentWillUnmount == "function" && Rd(n, t, a)),
            ln(e, t, n);
            break;
        case 21:
            ln(e, t, n);
            break;
        case 22:
            Qe = (a = Qe) || n.memoizedState !== null,
            ln(e, t, n),
            Qe = a;
            break;
        default:
            ln(e, t, n)
        }
    }
    function qd(e, t) {
        if (t.memoizedState === null && (e = t.alternate,
        e !== null && (e = e.memoizedState,
        e !== null))) {
            e = e.dehydrated;
            try {
                ka(e)
            } catch (n) {
                je(t, t.return, n)
            }
        }
    }
    function kd(e, t) {
        if (t.memoizedState === null && (e = t.alternate,
        e !== null && (e = e.memoizedState,
        e !== null && (e = e.dehydrated,
        e !== null))))
            try {
                ka(e)
            } catch (n) {
                je(t, t.return, n)
            }
    }
    function V0(e) {
        switch (e.tag) {
        case 31:
        case 13:
        case 19:
            var t = e.stateNode;
            return t === null && (t = e.stateNode = new zd),
            t;
        case 22:
            return e = e.stateNode,
            t = e._retryCache,
            t === null && (t = e._retryCache = new zd),
            t;
        default:
            throw Error(o(435, e.tag))
        }
    }
    function Fi(e, t) {
        var n = V0(e);
        t.forEach(function(a) {
            if (!n.has(a)) {
                n.add(a);
                var s = I0.bind(null, e, a);
                a.then(s, s)
            }
        })
    }
    function ot(e, t) {
        var n = t.deletions;
        if (n !== null)
            for (var a = 0; a < n.length; a++) {
                var s = n[a]
                  , u = e
                  , h = t
                  , x = h;
                e: for (; x !== null; ) {
                    switch (x.tag) {
                    case 27:
                        if (Mn(x.type)) {
                            ze = x.stateNode,
                            rt = !1;
                            break e
                        }
                        break;
                    case 5:
                        ze = x.stateNode,
                        rt = !1;
                        break e;
                    case 3:
                    case 4:
                        ze = x.stateNode.containerInfo,
                        rt = !0;
                        break e
                    }
                    x = x.return
                }
                if (ze === null)
                    throw Error(o(160));
                Bd(u, h, s),
                ze = null,
                rt = !1,
                u = s.alternate,
                u !== null && (u.return = null),
                s.return = null
            }
        if (t.subtreeFlags & 13886)
            for (t = t.child; t !== null; )
                Gd(t, e),
                t = t.sibling
    }
    var Lt = null;
    function Gd(e, t) {
        var n = e.alternate
          , a = e.flags;
        switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            ot(t, e),
            ut(e),
            a & 4 && (Cn(3, e, e.return),
            Nl(3, e),
            Cn(5, e, e.return));
            break;
        case 1:
            ot(t, e),
            ut(e),
            a & 512 && (Qe || n === null || qt(n, n.return)),
            a & 64 && an && (e = e.updateQueue,
            e !== null && (a = e.callbacks,
            a !== null && (n = e.shared.hiddenCallbacks,
            e.shared.hiddenCallbacks = n === null ? a : n.concat(a))));
            break;
        case 26:
            var s = Lt;
            if (ot(t, e),
            ut(e),
            a & 512 && (Qe || n === null || qt(n, n.return)),
            a & 4) {
                var u = n !== null ? n.memoizedState : null;
                if (a = e.memoizedState,
                n === null)
                    if (a === null)
                        if (e.stateNode === null) {
                            e: {
                                a = e.type,
                                n = e.memoizedProps,
                                s = s.ownerDocument || s;
                                t: switch (a) {
                                case "title":
                                    u = s.getElementsByTagName("title")[0],
                                    (!u || u[Ia] || u[$e] || u.namespaceURI === "http://www.w3.org/2000/svg" || u.hasAttribute("itemprop")) && (u = s.createElement(a),
                                    s.head.insertBefore(u, s.querySelector("head > title"))),
                                    et(u, a, n),
                                    u[$e] = e,
                                    Ke(u),
                                    a = u;
                                    break e;
                                case "link":
                                    var h = Gh("link", "href", s).get(a + (n.href || ""));
                                    if (h) {
                                        for (var x = 0; x < h.length; x++)
                                            if (u = h[x],
                                            u.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && u.getAttribute("rel") === (n.rel == null ? null : n.rel) && u.getAttribute("title") === (n.title == null ? null : n.title) && u.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
                                                h.splice(x, 1);
                                                break t
                                            }
                                    }
                                    u = s.createElement(a),
                                    et(u, a, n),
                                    s.head.appendChild(u);
                                    break;
                                case "meta":
                                    if (h = Gh("meta", "content", s).get(a + (n.content || ""))) {
                                        for (x = 0; x < h.length; x++)
                                            if (u = h[x],
                                            u.getAttribute("content") === (n.content == null ? null : "" + n.content) && u.getAttribute("name") === (n.name == null ? null : n.name) && u.getAttribute("property") === (n.property == null ? null : n.property) && u.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && u.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
                                                h.splice(x, 1);
                                                break t
                                            }
                                    }
                                    u = s.createElement(a),
                                    et(u, a, n),
                                    s.head.appendChild(u);
                                    break;
                                default:
                                    throw Error(o(468, a))
                                }
                                u[$e] = e,
                                Ke(u),
                                a = u
                            }
                            e.stateNode = a
                        } else
                            Yh(s, e.type, e.stateNode);
                    else
                        e.stateNode = kh(s, a, e.memoizedProps);
                else
                    u !== a ? (u === null ? n.stateNode !== null && (n = n.stateNode,
                    n.parentNode.removeChild(n)) : u.count--,
                    a === null ? Yh(s, e.type, e.stateNode) : kh(s, a, e.memoizedProps)) : a === null && e.stateNode !== null && vo(e, e.memoizedProps, n.memoizedProps)
            }
            break;
        case 27:
            ot(t, e),
            ut(e),
            a & 512 && (Qe || n === null || qt(n, n.return)),
            n !== null && a & 4 && vo(e, e.memoizedProps, n.memoizedProps);
            break;
        case 5:
            if (ot(t, e),
            ut(e),
            a & 512 && (Qe || n === null || qt(n, n.return)),
            e.flags & 32) {
                s = e.stateNode;
                try {
                    ua(s, "")
                } catch (P) {
                    je(e, e.return, P)
                }
            }
            a & 4 && e.stateNode != null && (s = e.memoizedProps,
            vo(e, s, n !== null ? n.memoizedProps : s)),
            a & 1024 && (wo = !0);
            break;
        case 6:
            if (ot(t, e),
            ut(e),
            a & 4) {
                if (e.stateNode === null)
                    throw Error(o(162));
                a = e.memoizedProps,
                n = e.stateNode;
                try {
                    n.nodeValue = a
                } catch (P) {
                    je(e, e.return, P)
                }
            }
            break;
        case 3:
            if (cs = null,
            s = Lt,
            Lt = os(t.containerInfo),
            ot(t, e),
            Lt = s,
            ut(e),
            a & 4 && n !== null && n.memoizedState.isDehydrated)
                try {
                    ka(t.containerInfo)
                } catch (P) {
                    je(e, e.return, P)
                }
            wo && (wo = !1,
            Yd(e));
            break;
        case 4:
            a = Lt,
            Lt = os(e.stateNode.containerInfo),
            ot(t, e),
            ut(e),
            Lt = a;
            break;
        case 12:
            ot(t, e),
            ut(e);
            break;
        case 31:
            ot(t, e),
            ut(e),
            a & 4 && (a = e.updateQueue,
            a !== null && (e.updateQueue = null,
            Fi(e, a)));
            break;
        case 13:
            ot(t, e),
            ut(e),
            e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && ($i = dt()),
            a & 4 && (a = e.updateQueue,
            a !== null && (e.updateQueue = null,
            Fi(e, a)));
            break;
        case 22:
            s = e.memoizedState !== null;
            var C = n !== null && n.memoizedState !== null
              , R = an
              , H = Qe;
            if (an = R || s,
            Qe = H || C,
            ot(t, e),
            Qe = H,
            an = R,
            ut(e),
            a & 8192)
                e: for (t = e.stateNode,
                t._visibility = s ? t._visibility & -2 : t._visibility | 1,
                s && (n === null || C || an || Qe || ta(e)),
                n = null,
                t = e; ; ) {
                    if (t.tag === 5 || t.tag === 26) {
                        if (n === null) {
                            C = n = t;
                            try {
                                if (u = C.stateNode,
                                s)
                                    h = u.style,
                                    typeof h.setProperty == "function" ? h.setProperty("display", "none", "important") : h.display = "none";
                                else {
                                    x = C.stateNode;
                                    var Y = C.memoizedProps.style
                                      , M = Y != null && Y.hasOwnProperty("display") ? Y.display : null;
                                    x.style.display = M == null || typeof M == "boolean" ? "" : ("" + M).trim()
                                }
                            } catch (P) {
                                je(C, C.return, P)
                            }
                        }
                    } else if (t.tag === 6) {
                        if (n === null) {
                            C = t;
                            try {
                                C.stateNode.nodeValue = s ? "" : C.memoizedProps
                            } catch (P) {
                                je(C, C.return, P)
                            }
                        }
                    } else if (t.tag === 18) {
                        if (n === null) {
                            C = t;
                            try {
                                var L = C.stateNode;
                                s ? Rh(L, !0) : Rh(C.stateNode, !1)
                            } catch (P) {
                                je(C, C.return, P)
                            }
                        }
                    } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
                        t.child.return = t,
                        t = t.child;
                        continue
                    }
                    if (t === e)
                        break e;
                    for (; t.sibling === null; ) {
                        if (t.return === null || t.return === e)
                            break e;
                        n === t && (n = null),
                        t = t.return
                    }
                    n === t && (n = null),
                    t.sibling.return = t.return,
                    t = t.sibling
                }
            a & 4 && (a = e.updateQueue,
            a !== null && (n = a.retryQueue,
            n !== null && (a.retryQueue = null,
            Fi(e, n))));
            break;
        case 19:
            ot(t, e),
            ut(e),
            a & 4 && (a = e.updateQueue,
            a !== null && (e.updateQueue = null,
            Fi(e, a)));
            break;
        case 30:
            break;
        case 21:
            break;
        default:
            ot(t, e),
            ut(e)
        }
    }
    function ut(e) {
        var t = e.flags;
        if (t & 2) {
            try {
                for (var n, a = e.return; a !== null; ) {
                    if (Dd(a)) {
                        n = a;
                        break
                    }
                    a = a.return
                }
                if (n == null)
                    throw Error(o(160));
                switch (n.tag) {
                case 27:
                    var s = n.stateNode
                      , u = bo(e);
                    Ki(e, u, s);
                    break;
                case 5:
                    var h = n.stateNode;
                    n.flags & 32 && (ua(h, ""),
                    n.flags &= -33);
                    var x = bo(e);
                    Ki(e, x, h);
                    break;
                case 3:
                case 4:
                    var C = n.stateNode.containerInfo
                      , R = bo(e);
                    So(e, R, C);
                    break;
                default:
                    throw Error(o(161))
                }
            } catch (H) {
                je(e, e.return, H)
            }
            e.flags &= -3
        }
        t & 4096 && (e.flags &= -4097)
    }
    function Yd(e) {
        if (e.subtreeFlags & 1024)
            for (e = e.child; e !== null; ) {
                var t = e;
                Yd(t),
                t.tag === 5 && t.flags & 1024 && t.stateNode.reset(),
                e = e.sibling
            }
    }
    function sn(e, t) {
        if (t.subtreeFlags & 8772)
            for (t = t.child; t !== null; )
                Ud(e, t.alternate, t),
                t = t.sibling
    }
    function ta(e) {
        for (e = e.child; e !== null; ) {
            var t = e;
            switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
                Cn(4, t, t.return),
                ta(t);
                break;
            case 1:
                qt(t, t.return);
                var n = t.stateNode;
                typeof n.componentWillUnmount == "function" && Rd(t, t.return, n),
                ta(t);
                break;
            case 27:
                Ll(t.stateNode);
            case 26:
            case 5:
                qt(t, t.return),
                ta(t);
                break;
            case 22:
                t.memoizedState === null && ta(t);
                break;
            case 30:
                ta(t);
                break;
            default:
                ta(t)
            }
            e = e.sibling
        }
    }
    function rn(e, t, n) {
        for (n = n && (t.subtreeFlags & 8772) !== 0,
        t = t.child; t !== null; ) {
            var a = t.alternate
              , s = e
              , u = t
              , h = u.flags;
            switch (u.tag) {
            case 0:
            case 11:
            case 15:
                rn(s, u, n),
                Nl(4, u);
                break;
            case 1:
                if (rn(s, u, n),
                a = u,
                s = a.stateNode,
                typeof s.componentDidMount == "function")
                    try {
                        s.componentDidMount()
                    } catch (R) {
                        je(a, a.return, R)
                    }
                if (a = u,
                s = a.updateQueue,
                s !== null) {
                    var x = a.stateNode;
                    try {
                        var C = s.shared.hiddenCallbacks;
                        if (C !== null)
                            for (s.shared.hiddenCallbacks = null,
                            s = 0; s < C.length; s++)
                                vf(C[s], x)
                    } catch (R) {
                        je(a, a.return, R)
                    }
                }
                n && h & 64 && Od(u),
                Cl(u, u.return);
                break;
            case 27:
                Ld(u);
            case 26:
            case 5:
                rn(s, u, n),
                n && a === null && h & 4 && Md(u),
                Cl(u, u.return);
                break;
            case 12:
                rn(s, u, n);
                break;
            case 31:
                rn(s, u, n),
                n && h & 4 && qd(s, u);
                break;
            case 13:
                rn(s, u, n),
                n && h & 4 && kd(s, u);
                break;
            case 22:
                u.memoizedState === null && rn(s, u, n),
                Cl(u, u.return);
                break;
            case 30:
                break;
            default:
                rn(s, u, n)
            }
            t = t.sibling
        }
    }
    function Eo(e, t) {
        var n = null;
        e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool),
        e = null,
        t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool),
        e !== n && (e != null && e.refCount++,
        n != null && fl(n))
    }
    function No(e, t) {
        e = null,
        t.alternate !== null && (e = t.alternate.memoizedState.cache),
        t = t.memoizedState.cache,
        t !== e && (t.refCount++,
        e != null && fl(e))
    }
    function zt(e, t, n, a) {
        if (t.subtreeFlags & 10256)
            for (t = t.child; t !== null; )
                Vd(e, t, n, a),
                t = t.sibling
    }
    function Vd(e, t, n, a) {
        var s = t.flags;
        switch (t.tag) {
        case 0:
        case 11:
        case 15:
            zt(e, t, n, a),
            s & 2048 && Nl(9, t);
            break;
        case 1:
            zt(e, t, n, a);
            break;
        case 3:
            zt(e, t, n, a),
            s & 2048 && (e = null,
            t.alternate !== null && (e = t.alternate.memoizedState.cache),
            t = t.memoizedState.cache,
            t !== e && (t.refCount++,
            e != null && fl(e)));
            break;
        case 12:
            if (s & 2048) {
                zt(e, t, n, a),
                e = t.stateNode;
                try {
                    var u = t.memoizedProps
                      , h = u.id
                      , x = u.onPostCommit;
                    typeof x == "function" && x(h, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0)
                } catch (C) {
                    je(t, t.return, C)
                }
            } else
                zt(e, t, n, a);
            break;
        case 31:
            zt(e, t, n, a);
            break;
        case 13:
            zt(e, t, n, a);
            break;
        case 23:
            break;
        case 22:
            u = t.stateNode,
            h = t.alternate,
            t.memoizedState !== null ? u._visibility & 2 ? zt(e, t, n, a) : _l(e, t) : u._visibility & 2 ? zt(e, t, n, a) : (u._visibility |= 2,
            Ta(e, t, n, a, (t.subtreeFlags & 10256) !== 0 || !1)),
            s & 2048 && Eo(h, t);
            break;
        case 24:
            zt(e, t, n, a),
            s & 2048 && No(t.alternate, t);
            break;
        default:
            zt(e, t, n, a)
        }
    }
    function Ta(e, t, n, a, s) {
        for (s = s && ((t.subtreeFlags & 10256) !== 0 || !1),
        t = t.child; t !== null; ) {
            var u = e
              , h = t
              , x = n
              , C = a
              , R = h.flags;
            switch (h.tag) {
            case 0:
            case 11:
            case 15:
                Ta(u, h, x, C, s),
                Nl(8, h);
                break;
            case 23:
                break;
            case 22:
                var H = h.stateNode;
                h.memoizedState !== null ? H._visibility & 2 ? Ta(u, h, x, C, s) : _l(u, h) : (H._visibility |= 2,
                Ta(u, h, x, C, s)),
                s && R & 2048 && Eo(h.alternate, h);
                break;
            case 24:
                Ta(u, h, x, C, s),
                s && R & 2048 && No(h.alternate, h);
                break;
            default:
                Ta(u, h, x, C, s)
            }
            t = t.sibling
        }
    }
    function _l(e, t) {
        if (t.subtreeFlags & 10256)
            for (t = t.child; t !== null; ) {
                var n = e
                  , a = t
                  , s = a.flags;
                switch (a.tag) {
                case 22:
                    _l(n, a),
                    s & 2048 && Eo(a.alternate, a);
                    break;
                case 24:
                    _l(n, a),
                    s & 2048 && No(a.alternate, a);
                    break;
                default:
                    _l(n, a)
                }
                t = t.sibling
            }
    }
    var jl = 8192;
    function Oa(e, t, n) {
        if (e.subtreeFlags & jl)
            for (e = e.child; e !== null; )
                Qd(e, t, n),
                e = e.sibling
    }
    function Qd(e, t, n) {
        switch (e.tag) {
        case 26:
            Oa(e, t, n),
            e.flags & jl && e.memoizedState !== null && Ty(n, Lt, e.memoizedState, e.memoizedProps);
            break;
        case 5:
            Oa(e, t, n);
            break;
        case 3:
        case 4:
            var a = Lt;
            Lt = os(e.stateNode.containerInfo),
            Oa(e, t, n),
            Lt = a;
            break;
        case 22:
            e.memoizedState === null && (a = e.alternate,
            a !== null && a.memoizedState !== null ? (a = jl,
            jl = 16777216,
            Oa(e, t, n),
            jl = a) : Oa(e, t, n));
            break;
        default:
            Oa(e, t, n)
        }
    }
    function Xd(e) {
        var t = e.alternate;
        if (t !== null && (e = t.child,
        e !== null)) {
            t.child = null;
            do
                t = e.sibling,
                e.sibling = null,
                e = t;
            while (e !== null)
        }
    }
    function Al(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null)
                for (var n = 0; n < t.length; n++) {
                    var a = t[n];
                    Fe = a,
                    Kd(a, e)
                }
            Xd(e)
        }
        if (e.subtreeFlags & 10256)
            for (e = e.child; e !== null; )
                Zd(e),
                e = e.sibling
    }
    function Zd(e) {
        switch (e.tag) {
        case 0:
        case 11:
        case 15:
            Al(e),
            e.flags & 2048 && Cn(9, e, e.return);
            break;
        case 3:
            Al(e);
            break;
        case 12:
            Al(e);
            break;
        case 22:
            var t = e.stateNode;
            e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3,
            Ji(e)) : Al(e);
            break;
        default:
            Al(e)
        }
    }
    function Ji(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null)
                for (var n = 0; n < t.length; n++) {
                    var a = t[n];
                    Fe = a,
                    Kd(a, e)
                }
            Xd(e)
        }
        for (e = e.child; e !== null; ) {
            switch (t = e,
            t.tag) {
            case 0:
            case 11:
            case 15:
                Cn(8, t, t.return),
                Ji(t);
                break;
            case 22:
                n = t.stateNode,
                n._visibility & 2 && (n._visibility &= -3,
                Ji(t));
                break;
            default:
                Ji(t)
            }
            e = e.sibling
        }
    }
    function Kd(e, t) {
        for (; Fe !== null; ) {
            var n = Fe;
            switch (n.tag) {
            case 0:
            case 11:
            case 15:
                Cn(8, n, t);
                break;
            case 23:
            case 22:
                if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
                    var a = n.memoizedState.cachePool.pool;
                    a != null && a.refCount++
                }
                break;
            case 24:
                fl(n.memoizedState.cache)
            }
            if (a = n.child,
            a !== null)
                a.return = n,
                Fe = a;
            else
                e: for (n = e; Fe !== null; ) {
                    a = Fe;
                    var s = a.sibling
                      , u = a.return;
                    if (Hd(a),
                    a === n) {
                        Fe = null;
                        break e
                    }
                    if (s !== null) {
                        s.return = u,
                        Fe = s;
                        break e
                    }
                    Fe = u
                }
        }
    }
    var Q0 = {
        getCacheForType: function(e) {
            var t = Ie(Ge)
              , n = t.data.get(e);
            return n === void 0 && (n = e(),
            t.data.set(e, n)),
            n
        },
        cacheSignal: function() {
            return Ie(Ge).controller.signal
        }
    }
      , X0 = typeof WeakMap == "function" ? WeakMap : Map
      , Ee = 0
      , Re = null
      , me = null
      , pe = 0
      , _e = 0
      , vt = null
      , _n = !1
      , Ra = !1
      , Co = !1
      , on = 0
      , He = 0
      , jn = 0
      , na = 0
      , _o = 0
      , bt = 0
      , Ma = 0
      , Tl = null
      , ct = null
      , jo = !1
      , $i = 0
      , Fd = 0
      , Wi = 1 / 0
      , Ii = null
      , An = null
      , Xe = 0
      , Tn = null
      , Da = null
      , un = 0
      , Ao = 0
      , To = null
      , Jd = null
      , Ol = 0
      , Oo = null;
    function St() {
        return (Ee & 2) !== 0 && pe !== 0 ? pe & -pe : z.T !== null ? Uo() : cc()
    }
    function $d() {
        if (bt === 0)
            if ((pe & 536870912) === 0 || xe) {
                var e = si;
                si <<= 1,
                (si & 3932160) === 0 && (si = 262144),
                bt = e
            } else
                bt = 536870912;
        return e = yt.current,
        e !== null && (e.flags |= 32),
        bt
    }
    function ft(e, t, n) {
        (e === Re && (_e === 2 || _e === 9) || e.cancelPendingCommit !== null) && (La(e, 0),
        On(e, pe, bt, !1)),
        Wa(e, n),
        ((Ee & 2) === 0 || e !== Re) && (e === Re && ((Ee & 2) === 0 && (na |= n),
        He === 4 && On(e, pe, bt, !1)),
        kt(e))
    }
    function Wd(e, t, n) {
        if ((Ee & 6) !== 0)
            throw Error(o(327));
        var a = !n && (t & 127) === 0 && (t & e.expiredLanes) === 0 || $a(e, t)
          , s = a ? F0(e, t) : Mo(e, t, !0)
          , u = a;
        do {
            if (s === 0) {
                Ra && !a && On(e, t, 0, !1);
                break
            } else {
                if (n = e.current.alternate,
                u && !Z0(n)) {
                    s = Mo(e, t, !1),
                    u = !1;
                    continue
                }
                if (s === 2) {
                    if (u = t,
                    e.errorRecoveryDisabledLanes & u)
                        var h = 0;
                    else
                        h = e.pendingLanes & -536870913,
                        h = h !== 0 ? h : h & 536870912 ? 536870912 : 0;
                    if (h !== 0) {
                        t = h;
                        e: {
                            var x = e;
                            s = Tl;
                            var C = x.current.memoizedState.isDehydrated;
                            if (C && (La(x, h).flags |= 256),
                            h = Mo(x, h, !1),
                            h !== 2) {
                                if (Co && !C) {
                                    x.errorRecoveryDisabledLanes |= u,
                                    na |= u,
                                    s = 4;
                                    break e
                                }
                                u = ct,
                                ct = s,
                                u !== null && (ct === null ? ct = u : ct.push.apply(ct, u))
                            }
                            s = h
                        }
                        if (u = !1,
                        s !== 2)
                            continue
                    }
                }
                if (s === 1) {
                    La(e, 0),
                    On(e, t, 0, !0);
                    break
                }
                e: {
                    switch (a = e,
                    u = s,
                    u) {
                    case 0:
                    case 1:
                        throw Error(o(345));
                    case 4:
                        if ((t & 4194048) !== t)
                            break;
                    case 6:
                        On(a, t, bt, !_n);
                        break e;
                    case 2:
                        ct = null;
                        break;
                    case 3:
                    case 5:
                        break;
                    default:
                        throw Error(o(329))
                    }
                    if ((t & 62914560) === t && (s = $i + 300 - dt(),
                    10 < s)) {
                        if (On(a, t, bt, !_n),
                        oi(a, 0, !0) !== 0)
                            break e;
                        un = t,
                        a.timeoutHandle = Ah(Id.bind(null, a, n, ct, Ii, jo, t, bt, na, Ma, _n, u, "Throttled", -0, 0), s);
                        break e
                    }
                    Id(a, n, ct, Ii, jo, t, bt, na, Ma, _n, u, null, -0, 0)
                }
            }
            break
        } while (!0);
        kt(e)
    }
    function Id(e, t, n, a, s, u, h, x, C, R, H, Y, M, L) {
        if (e.timeoutHandle = -1,
        Y = t.subtreeFlags,
        Y & 8192 || (Y & 16785408) === 16785408) {
            Y = {
                stylesheets: null,
                count: 0,
                imgCount: 0,
                imgBytes: 0,
                suspenseyImages: [],
                waitingForImages: !0,
                waitingForViewTransition: !1,
                unsuspend: Kt
            },
            Qd(t, u, Y);
            var P = (u & 62914560) === u ? $i - dt() : (u & 4194048) === u ? Fd - dt() : 0;
            if (P = Oy(Y, P),
            P !== null) {
                un = u,
                e.cancelPendingCommit = P(sh.bind(null, e, t, u, n, a, s, h, x, C, H, Y, null, M, L)),
                On(e, u, h, !R);
                return
            }
        }
        sh(e, t, u, n, a, s, h, x, C)
    }
    function Z0(e) {
        for (var t = e; ; ) {
            var n = t.tag;
            if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue,
            n !== null && (n = n.stores,
            n !== null)))
                for (var a = 0; a < n.length; a++) {
                    var s = n[a]
                      , u = s.getSnapshot;
                    s = s.value;
                    try {
                        if (!gt(u(), s))
                            return !1
                    } catch {
                        return !1
                    }
                }
            if (n = t.child,
            t.subtreeFlags & 16384 && n !== null)
                n.return = t,
                t = n;
            else {
                if (t === e)
                    break;
                for (; t.sibling === null; ) {
                    if (t.return === null || t.return === e)
                        return !0;
                    t = t.return
                }
                t.sibling.return = t.return,
                t = t.sibling
            }
        }
        return !0
    }
    function On(e, t, n, a) {
        t &= ~_o,
        t &= ~na,
        e.suspendedLanes |= t,
        e.pingedLanes &= ~t,
        a && (e.warmLanes |= t),
        a = e.expirationTimes;
        for (var s = t; 0 < s; ) {
            var u = 31 - mt(s)
              , h = 1 << u;
            a[u] = -1,
            s &= ~h
        }
        n !== 0 && rc(e, n, t)
    }
    function Pi() {
        return (Ee & 6) === 0 ? (Rl(0),
        !1) : !0
    }
    function Ro() {
        if (me !== null) {
            if (_e === 0)
                var e = me.return;
            else
                e = me,
                Wt = Kn = null,
                Zr(e),
                Na = null,
                hl = 0,
                e = me;
            for (; e !== null; )
                Td(e.alternate, e),
                e = e.return;
            me = null
        }
    }
    function La(e, t) {
        var n = e.timeoutHandle;
        n !== -1 && (e.timeoutHandle = -1,
        dy(n)),
        n = e.cancelPendingCommit,
        n !== null && (e.cancelPendingCommit = null,
        n()),
        un = 0,
        Ro(),
        Re = e,
        me = n = Jt(e.current, null),
        pe = t,
        _e = 0,
        vt = null,
        _n = !1,
        Ra = $a(e, t),
        Co = !1,
        Ma = bt = _o = na = jn = He = 0,
        ct = Tl = null,
        jo = !1,
        (t & 8) !== 0 && (t |= t & 32);
        var a = e.entangledLanes;
        if (a !== 0)
            for (e = e.entanglements,
            a &= t; 0 < a; ) {
                var s = 31 - mt(a)
                  , u = 1 << s;
                t |= e[s],
                a &= ~u
            }
        return on = t,
        bi(),
        n
    }
    function Pd(e, t) {
        ue = null,
        z.H = Sl,
        t === Ea || t === Ai ? (t = gf(),
        _e = 3) : t === Lr ? (t = gf(),
        _e = 4) : _e = t === oo ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1,
        vt = t,
        me === null && (He = 1,
        Yi(e, Ct(t, e.current)))
    }
    function eh() {
        var e = yt.current;
        return e === null ? !0 : (pe & 4194048) === pe ? Tt === null : (pe & 62914560) === pe || (pe & 536870912) !== 0 ? e === Tt : !1
    }
    function th() {
        var e = z.H;
        return z.H = Sl,
        e === null ? Sl : e
    }
    function nh() {
        var e = z.A;
        return z.A = Q0,
        e
    }
    function es() {
        He = 4,
        _n || (pe & 4194048) !== pe && yt.current !== null || (Ra = !0),
        (jn & 134217727) === 0 && (na & 134217727) === 0 || Re === null || On(Re, pe, bt, !1)
    }
    function Mo(e, t, n) {
        var a = Ee;
        Ee |= 2;
        var s = th()
          , u = nh();
        (Re !== e || pe !== t) && (Ii = null,
        La(e, t)),
        t = !1;
        var h = He;
        e: do
            try {
                if (_e !== 0 && me !== null) {
                    var x = me
                      , C = vt;
                    switch (_e) {
                    case 8:
                        Ro(),
                        h = 6;
                        break e;
                    case 3:
                    case 2:
                    case 9:
                    case 6:
                        yt.current === null && (t = !0);
                        var R = _e;
                        if (_e = 0,
                        vt = null,
                        za(e, x, C, R),
                        n && Ra) {
                            h = 0;
                            break e
                        }
                        break;
                    default:
                        R = _e,
                        _e = 0,
                        vt = null,
                        za(e, x, C, R)
                    }
                }
                K0(),
                h = He;
                break
            } catch (H) {
                Pd(e, H)
            }
        while (!0);
        return t && e.shellSuspendCounter++,
        Wt = Kn = null,
        Ee = a,
        z.H = s,
        z.A = u,
        me === null && (Re = null,
        pe = 0,
        bi()),
        h
    }
    function K0() {
        for (; me !== null; )
            ah(me)
    }
    function F0(e, t) {
        var n = Ee;
        Ee |= 2;
        var a = th()
          , s = nh();
        Re !== e || pe !== t ? (Ii = null,
        Wi = dt() + 500,
        La(e, t)) : Ra = $a(e, t);
        e: do
            try {
                if (_e !== 0 && me !== null) {
                    t = me;
                    var u = vt;
                    t: switch (_e) {
                    case 1:
                        _e = 0,
                        vt = null,
                        za(e, t, u, 1);
                        break;
                    case 2:
                    case 9:
                        if (hf(u)) {
                            _e = 0,
                            vt = null,
                            lh(t);
                            break
                        }
                        t = function() {
                            _e !== 2 && _e !== 9 || Re !== e || (_e = 7),
                            kt(e)
                        }
                        ,
                        u.then(t, t);
                        break e;
                    case 3:
                        _e = 7;
                        break e;
                    case 4:
                        _e = 5;
                        break e;
                    case 7:
                        hf(u) ? (_e = 0,
                        vt = null,
                        lh(t)) : (_e = 0,
                        vt = null,
                        za(e, t, u, 7));
                        break;
                    case 5:
                        var h = null;
                        switch (me.tag) {
                        case 26:
                            h = me.memoizedState;
                        case 5:
                        case 27:
                            var x = me;
                            if (h ? Vh(h) : x.stateNode.complete) {
                                _e = 0,
                                vt = null;
                                var C = x.sibling;
                                if (C !== null)
                                    me = C;
                                else {
                                    var R = x.return;
                                    R !== null ? (me = R,
                                    ts(R)) : me = null
                                }
                                break t
                            }
                        }
                        _e = 0,
                        vt = null,
                        za(e, t, u, 5);
                        break;
                    case 6:
                        _e = 0,
                        vt = null,
                        za(e, t, u, 6);
                        break;
                    case 8:
                        Ro(),
                        He = 6;
                        break e;
                    default:
                        throw Error(o(462))
                    }
                }
                J0();
                break
            } catch (H) {
                Pd(e, H)
            }
        while (!0);
        return Wt = Kn = null,
        z.H = a,
        z.A = s,
        Ee = n,
        me !== null ? 0 : (Re = null,
        pe = 0,
        bi(),
        He)
    }
    function J0() {
        for (; me !== null && !xp(); )
            ah(me)
    }
    function ah(e) {
        var t = jd(e.alternate, e, on);
        e.memoizedProps = e.pendingProps,
        t === null ? ts(e) : me = t
    }
    function lh(e) {
        var t = e
          , n = t.alternate;
        switch (t.tag) {
        case 15:
        case 0:
            t = Sd(n, t, t.pendingProps, t.type, void 0, pe);
            break;
        case 11:
            t = Sd(n, t, t.pendingProps, t.type.render, t.ref, pe);
            break;
        case 5:
            Zr(t);
        default:
            Td(n, t),
            t = me = tf(t, on),
            t = jd(n, t, on)
        }
        e.memoizedProps = e.pendingProps,
        t === null ? ts(e) : me = t
    }
    function za(e, t, n, a) {
        Wt = Kn = null,
        Zr(t),
        Na = null,
        hl = 0;
        var s = t.return;
        try {
            if (H0(e, s, t, n, pe)) {
                He = 1,
                Yi(e, Ct(n, e.current)),
                me = null;
                return
            }
        } catch (u) {
            if (s !== null)
                throw me = s,
                u;
            He = 1,
            Yi(e, Ct(n, e.current)),
            me = null;
            return
        }
        t.flags & 32768 ? (xe || a === 1 ? e = !0 : Ra || (pe & 536870912) !== 0 ? e = !1 : (_n = e = !0,
        (a === 2 || a === 9 || a === 3 || a === 6) && (a = yt.current,
        a !== null && a.tag === 13 && (a.flags |= 16384))),
        ih(t, e)) : ts(t)
    }
    function ts(e) {
        var t = e;
        do {
            if ((t.flags & 32768) !== 0) {
                ih(t, _n);
                return
            }
            e = t.return;
            var n = k0(t.alternate, t, on);
            if (n !== null) {
                me = n;
                return
            }
            if (t = t.sibling,
            t !== null) {
                me = t;
                return
            }
            me = t = e
        } while (t !== null);
        He === 0 && (He = 5)
    }
    function ih(e, t) {
        do {
            var n = G0(e.alternate, e);
            if (n !== null) {
                n.flags &= 32767,
                me = n;
                return
            }
            if (n = e.return,
            n !== null && (n.flags |= 32768,
            n.subtreeFlags = 0,
            n.deletions = null),
            !t && (e = e.sibling,
            e !== null)) {
                me = e;
                return
            }
            me = e = n
        } while (e !== null);
        He = 6,
        me = null
    }
    function sh(e, t, n, a, s, u, h, x, C) {
        e.cancelPendingCommit = null;
        do
            ns();
        while (Xe !== 0);
        if ((Ee & 6) !== 0)
            throw Error(o(327));
        if (t !== null) {
            if (t === e.current)
                throw Error(o(177));
            if (u = t.lanes | t.childLanes,
            u |= vr,
            Ap(e, n, u, h, x, C),
            e === Re && (me = Re = null,
            pe = 0),
            Da = t,
            Tn = e,
            un = n,
            Ao = u,
            To = s,
            Jd = a,
            (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null,
            e.callbackPriority = 0,
            P0(li, function() {
                return fh(),
                null
            })) : (e.callbackNode = null,
            e.callbackPriority = 0),
            a = (t.flags & 13878) !== 0,
            (t.subtreeFlags & 13878) !== 0 || a) {
                a = z.T,
                z.T = null,
                s = X.p,
                X.p = 2,
                h = Ee,
                Ee |= 4;
                try {
                    Y0(e, t, n)
                } finally {
                    Ee = h,
                    X.p = s,
                    z.T = a
                }
            }
            Xe = 1,
            rh(),
            oh(),
            uh()
        }
    }
    function rh() {
        if (Xe === 1) {
            Xe = 0;
            var e = Tn
              , t = Da
              , n = (t.flags & 13878) !== 0;
            if ((t.subtreeFlags & 13878) !== 0 || n) {
                n = z.T,
                z.T = null;
                var a = X.p;
                X.p = 2;
                var s = Ee;
                Ee |= 4;
                try {
                    Gd(t, e);
                    var u = Qo
                      , h = Zc(e.containerInfo)
                      , x = u.focusedElem
                      , C = u.selectionRange;
                    if (h !== x && x && x.ownerDocument && Xc(x.ownerDocument.documentElement, x)) {
                        if (C !== null && mr(x)) {
                            var R = C.start
                              , H = C.end;
                            if (H === void 0 && (H = R),
                            "selectionStart"in x)
                                x.selectionStart = R,
                                x.selectionEnd = Math.min(H, x.value.length);
                            else {
                                var Y = x.ownerDocument || document
                                  , M = Y && Y.defaultView || window;
                                if (M.getSelection) {
                                    var L = M.getSelection()
                                      , P = x.textContent.length
                                      , le = Math.min(C.start, P)
                                      , Oe = C.end === void 0 ? le : Math.min(C.end, P);
                                    !L.extend && le > Oe && (h = Oe,
                                    Oe = le,
                                    le = h);
                                    var T = Qc(x, le)
                                      , j = Qc(x, Oe);
                                    if (T && j && (L.rangeCount !== 1 || L.anchorNode !== T.node || L.anchorOffset !== T.offset || L.focusNode !== j.node || L.focusOffset !== j.offset)) {
                                        var O = Y.createRange();
                                        O.setStart(T.node, T.offset),
                                        L.removeAllRanges(),
                                        le > Oe ? (L.addRange(O),
                                        L.extend(j.node, j.offset)) : (O.setEnd(j.node, j.offset),
                                        L.addRange(O))
                                    }
                                }
                            }
                        }
                        for (Y = [],
                        L = x; L = L.parentNode; )
                            L.nodeType === 1 && Y.push({
                                element: L,
                                left: L.scrollLeft,
                                top: L.scrollTop
                            });
                        for (typeof x.focus == "function" && x.focus(),
                        x = 0; x < Y.length; x++) {
                            var q = Y[x];
                            q.element.scrollLeft = q.left,
                            q.element.scrollTop = q.top
                        }
                    }
                    ms = !!Vo,
                    Qo = Vo = null
                } finally {
                    Ee = s,
                    X.p = a,
                    z.T = n
                }
            }
            e.current = t,
            Xe = 2
        }
    }
    function oh() {
        if (Xe === 2) {
            Xe = 0;
            var e = Tn
              , t = Da
              , n = (t.flags & 8772) !== 0;
            if ((t.subtreeFlags & 8772) !== 0 || n) {
                n = z.T,
                z.T = null;
                var a = X.p;
                X.p = 2;
                var s = Ee;
                Ee |= 4;
                try {
                    Ud(e, t.alternate, t)
                } finally {
                    Ee = s,
                    X.p = a,
                    z.T = n
                }
            }
            Xe = 3
        }
    }
    function uh() {
        if (Xe === 4 || Xe === 3) {
            Xe = 0,
            vp();
            var e = Tn
              , t = Da
              , n = un
              , a = Jd;
            (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? Xe = 5 : (Xe = 0,
            Da = Tn = null,
            ch(e, e.pendingLanes));
            var s = e.pendingLanes;
            if (s === 0 && (An = null),
            Js(n),
            t = t.stateNode,
            ht && typeof ht.onCommitFiberRoot == "function")
                try {
                    ht.onCommitFiberRoot(Ja, t, void 0, (t.current.flags & 128) === 128)
                } catch {}
            if (a !== null) {
                t = z.T,
                s = X.p,
                X.p = 2,
                z.T = null;
                try {
                    for (var u = e.onRecoverableError, h = 0; h < a.length; h++) {
                        var x = a[h];
                        u(x.value, {
                            componentStack: x.stack
                        })
                    }
                } finally {
                    z.T = t,
                    X.p = s
                }
            }
            (un & 3) !== 0 && ns(),
            kt(e),
            s = e.pendingLanes,
            (n & 261930) !== 0 && (s & 42) !== 0 ? e === Oo ? Ol++ : (Ol = 0,
            Oo = e) : Ol = 0,
            Rl(0)
        }
    }
    function ch(e, t) {
        (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache,
        t != null && (e.pooledCache = null,
        fl(t)))
    }
    function ns() {
        return rh(),
        oh(),
        uh(),
        fh()
    }
    function fh() {
        if (Xe !== 5)
            return !1;
        var e = Tn
          , t = Ao;
        Ao = 0;
        var n = Js(un)
          , a = z.T
          , s = X.p;
        try {
            X.p = 32 > n ? 32 : n,
            z.T = null,
            n = To,
            To = null;
            var u = Tn
              , h = un;
            if (Xe = 0,
            Da = Tn = null,
            un = 0,
            (Ee & 6) !== 0)
                throw Error(o(331));
            var x = Ee;
            if (Ee |= 4,
            Zd(u.current),
            Vd(u, u.current, h, n),
            Ee = x,
            Rl(0, !1),
            ht && typeof ht.onPostCommitFiberRoot == "function")
                try {
                    ht.onPostCommitFiberRoot(Ja, u)
                } catch {}
            return !0
        } finally {
            X.p = s,
            z.T = a,
            ch(e, t)
        }
    }
    function dh(e, t, n) {
        t = Ct(n, t),
        t = ro(e.stateNode, t, 2),
        e = wn(e, t, 2),
        e !== null && (Wa(e, 2),
        kt(e))
    }
    function je(e, t, n) {
        if (e.tag === 3)
            dh(e, e, n);
        else
            for (; t !== null; ) {
                if (t.tag === 3) {
                    dh(t, e, n);
                    break
                } else if (t.tag === 1) {
                    var a = t.stateNode;
                    if (typeof t.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (An === null || !An.has(a))) {
                        e = Ct(n, e),
                        n = hd(2),
                        a = wn(t, n, 2),
                        a !== null && (md(n, a, t, e),
                        Wa(a, 2),
                        kt(a));
                        break
                    }
                }
                t = t.return
            }
    }
    function Do(e, t, n) {
        var a = e.pingCache;
        if (a === null) {
            a = e.pingCache = new X0;
            var s = new Set;
            a.set(t, s)
        } else
            s = a.get(t),
            s === void 0 && (s = new Set,
            a.set(t, s));
        s.has(n) || (Co = !0,
        s.add(n),
        e = $0.bind(null, e, t, n),
        t.then(e, e))
    }
    function $0(e, t, n) {
        var a = e.pingCache;
        a !== null && a.delete(t),
        e.pingedLanes |= e.suspendedLanes & n,
        e.warmLanes &= ~n,
        Re === e && (pe & n) === n && (He === 4 || He === 3 && (pe & 62914560) === pe && 300 > dt() - $i ? (Ee & 2) === 0 && La(e, 0) : _o |= n,
        Ma === pe && (Ma = 0)),
        kt(e)
    }
    function hh(e, t) {
        t === 0 && (t = sc()),
        e = Qn(e, t),
        e !== null && (Wa(e, t),
        kt(e))
    }
    function W0(e) {
        var t = e.memoizedState
          , n = 0;
        t !== null && (n = t.retryLane),
        hh(e, n)
    }
    function I0(e, t) {
        var n = 0;
        switch (e.tag) {
        case 31:
        case 13:
            var a = e.stateNode
              , s = e.memoizedState;
            s !== null && (n = s.retryLane);
            break;
        case 19:
            a = e.stateNode;
            break;
        case 22:
            a = e.stateNode._retryCache;
            break;
        default:
            throw Error(o(314))
        }
        a !== null && a.delete(t),
        hh(e, n)
    }
    function P0(e, t) {
        return Xs(e, t)
    }
    var as = null
      , Ua = null
      , Lo = !1
      , ls = !1
      , zo = !1
      , Rn = 0;
    function kt(e) {
        e !== Ua && e.next === null && (Ua === null ? as = Ua = e : Ua = Ua.next = e),
        ls = !0,
        Lo || (Lo = !0,
        ty())
    }
    function Rl(e, t) {
        if (!zo && ls) {
            zo = !0;
            do
                for (var n = !1, a = as; a !== null; ) {
                    if (e !== 0) {
                        var s = a.pendingLanes;
                        if (s === 0)
                            var u = 0;
                        else {
                            var h = a.suspendedLanes
                              , x = a.pingedLanes;
                            u = (1 << 31 - mt(42 | e) + 1) - 1,
                            u &= s & ~(h & ~x),
                            u = u & 201326741 ? u & 201326741 | 1 : u ? u | 2 : 0
                        }
                        u !== 0 && (n = !0,
                        yh(a, u))
                    } else
                        u = pe,
                        u = oi(a, a === Re ? u : 0, a.cancelPendingCommit !== null || a.timeoutHandle !== -1),
                        (u & 3) === 0 || $a(a, u) || (n = !0,
                        yh(a, u));
                    a = a.next
                }
            while (n);
            zo = !1
        }
    }
    function ey() {
        mh()
    }
    function mh() {
        ls = Lo = !1;
        var e = 0;
        Rn !== 0 && fy() && (e = Rn);
        for (var t = dt(), n = null, a = as; a !== null; ) {
            var s = a.next
              , u = gh(a, t);
            u === 0 ? (a.next = null,
            n === null ? as = s : n.next = s,
            s === null && (Ua = n)) : (n = a,
            (e !== 0 || (u & 3) !== 0) && (ls = !0)),
            a = s
        }
        Xe !== 0 && Xe !== 5 || Rl(e),
        Rn !== 0 && (Rn = 0)
    }
    function gh(e, t) {
        for (var n = e.suspendedLanes, a = e.pingedLanes, s = e.expirationTimes, u = e.pendingLanes & -62914561; 0 < u; ) {
            var h = 31 - mt(u)
              , x = 1 << h
              , C = s[h];
            C === -1 ? ((x & n) === 0 || (x & a) !== 0) && (s[h] = jp(x, t)) : C <= t && (e.expiredLanes |= x),
            u &= ~x
        }
        if (t = Re,
        n = pe,
        n = oi(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1),
        a = e.callbackNode,
        n === 0 || e === t && (_e === 2 || _e === 9) || e.cancelPendingCommit !== null)
            return a !== null && a !== null && Zs(a),
            e.callbackNode = null,
            e.callbackPriority = 0;
        if ((n & 3) === 0 || $a(e, n)) {
            if (t = n & -n,
            t === e.callbackPriority)
                return t;
            switch (a !== null && Zs(a),
            Js(n)) {
            case 2:
            case 8:
                n = lc;
                break;
            case 32:
                n = li;
                break;
            case 268435456:
                n = ic;
                break;
            default:
                n = li
            }
            return a = ph.bind(null, e),
            n = Xs(n, a),
            e.callbackPriority = t,
            e.callbackNode = n,
            t
        }
        return a !== null && a !== null && Zs(a),
        e.callbackPriority = 2,
        e.callbackNode = null,
        2
    }
    function ph(e, t) {
        if (Xe !== 0 && Xe !== 5)
            return e.callbackNode = null,
            e.callbackPriority = 0,
            null;
        var n = e.callbackNode;
        if (ns() && e.callbackNode !== n)
            return null;
        var a = pe;
        return a = oi(e, e === Re ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1),
        a === 0 ? null : (Wd(e, a, t),
        gh(e, dt()),
        e.callbackNode != null && e.callbackNode === n ? ph.bind(null, e) : null)
    }
    function yh(e, t) {
        if (ns())
            return null;
        Wd(e, t, !0)
    }
    function ty() {
        hy(function() {
            (Ee & 6) !== 0 ? Xs(ac, ey) : mh()
        })
    }
    function Uo() {
        if (Rn === 0) {
            var e = Sa;
            e === 0 && (e = ii,
            ii <<= 1,
            (ii & 261888) === 0 && (ii = 256)),
            Rn = e
        }
        return Rn
    }
    function xh(e) {
        return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : di("" + e)
    }
    function vh(e, t) {
        var n = t.ownerDocument.createElement("input");
        return n.name = t.name,
        n.value = t.value,
        e.id && n.setAttribute("form", e.id),
        t.parentNode.insertBefore(n, t),
        e = new FormData(e),
        n.parentNode.removeChild(n),
        e
    }
    function ny(e, t, n, a, s) {
        if (t === "submit" && n && n.stateNode === s) {
            var u = xh((s[it] || null).action)
              , h = a.submitter;
            h && (t = (t = h[it] || null) ? xh(t.formAction) : h.getAttribute("formAction"),
            t !== null && (u = t,
            h = null));
            var x = new pi("action","action",null,a,s);
            e.push({
                event: x,
                listeners: [{
                    instance: null,
                    listener: function() {
                        if (a.defaultPrevented) {
                            if (Rn !== 0) {
                                var C = h ? vh(s, h) : new FormData(s);
                                to(n, {
                                    pending: !0,
                                    data: C,
                                    method: s.method,
                                    action: u
                                }, null, C)
                            }
                        } else
                            typeof u == "function" && (x.preventDefault(),
                            C = h ? vh(s, h) : new FormData(s),
                            to(n, {
                                pending: !0,
                                data: C,
                                method: s.method,
                                action: u
                            }, u, C))
                    },
                    currentTarget: s
                }]
            })
        }
    }
    for (var Ho = 0; Ho < xr.length; Ho++) {
        var Bo = xr[Ho]
          , ay = Bo.toLowerCase()
          , ly = Bo[0].toUpperCase() + Bo.slice(1);
        Dt(ay, "on" + ly)
    }
    Dt(Jc, "onAnimationEnd"),
    Dt($c, "onAnimationIteration"),
    Dt(Wc, "onAnimationStart"),
    Dt("dblclick", "onDoubleClick"),
    Dt("focusin", "onFocus"),
    Dt("focusout", "onBlur"),
    Dt(b0, "onTransitionRun"),
    Dt(S0, "onTransitionStart"),
    Dt(w0, "onTransitionCancel"),
    Dt(Ic, "onTransitionEnd"),
    ra("onMouseEnter", ["mouseout", "mouseover"]),
    ra("onMouseLeave", ["mouseout", "mouseover"]),
    ra("onPointerEnter", ["pointerout", "pointerover"]),
    ra("onPointerLeave", ["pointerout", "pointerover"]),
    kn("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")),
    kn("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),
    kn("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]),
    kn("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")),
    kn("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")),
    kn("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
    var Ml = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ")
      , iy = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Ml));
    function bh(e, t) {
        t = (t & 4) !== 0;
        for (var n = 0; n < e.length; n++) {
            var a = e[n]
              , s = a.event;
            a = a.listeners;
            e: {
                var u = void 0;
                if (t)
                    for (var h = a.length - 1; 0 <= h; h--) {
                        var x = a[h]
                          , C = x.instance
                          , R = x.currentTarget;
                        if (x = x.listener,
                        C !== u && s.isPropagationStopped())
                            break e;
                        u = x,
                        s.currentTarget = R;
                        try {
                            u(s)
                        } catch (H) {
                            vi(H)
                        }
                        s.currentTarget = null,
                        u = C
                    }
                else
                    for (h = 0; h < a.length; h++) {
                        if (x = a[h],
                        C = x.instance,
                        R = x.currentTarget,
                        x = x.listener,
                        C !== u && s.isPropagationStopped())
                            break e;
                        u = x,
                        s.currentTarget = R;
                        try {
                            u(s)
                        } catch (H) {
                            vi(H)
                        }
                        s.currentTarget = null,
                        u = C
                    }
            }
        }
    }
    function ge(e, t) {
        var n = t[$s];
        n === void 0 && (n = t[$s] = new Set);
        var a = e + "__bubble";
        n.has(a) || (Sh(t, e, 2, !1),
        n.add(a))
    }
    function qo(e, t, n) {
        var a = 0;
        t && (a |= 4),
        Sh(n, e, a, t)
    }
    var is = "_reactListening" + Math.random().toString(36).slice(2);
    function ko(e) {
        if (!e[is]) {
            e[is] = !0,
            hc.forEach(function(n) {
                n !== "selectionchange" && (iy.has(n) || qo(n, !1, e),
                qo(n, !0, e))
            });
            var t = e.nodeType === 9 ? e : e.ownerDocument;
            t === null || t[is] || (t[is] = !0,
            qo("selectionchange", !1, t))
        }
    }
    function Sh(e, t, n, a) {
        switch ($h(t)) {
        case 2:
            var s = Dy;
            break;
        case 8:
            s = Ly;
            break;
        default:
            s = tu
        }
        n = s.bind(null, t, n, e),
        s = void 0,
        !ir || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (s = !0),
        a ? s !== void 0 ? e.addEventListener(t, n, {
            capture: !0,
            passive: s
        }) : e.addEventListener(t, n, !0) : s !== void 0 ? e.addEventListener(t, n, {
            passive: s
        }) : e.addEventListener(t, n, !1)
    }
    function Go(e, t, n, a, s) {
        var u = a;
        if ((t & 1) === 0 && (t & 2) === 0 && a !== null)
            e: for (; ; ) {
                if (a === null)
                    return;
                var h = a.tag;
                if (h === 3 || h === 4) {
                    var x = a.stateNode.containerInfo;
                    if (x === s)
                        break;
                    if (h === 4)
                        for (h = a.return; h !== null; ) {
                            var C = h.tag;
                            if ((C === 3 || C === 4) && h.stateNode.containerInfo === s)
                                return;
                            h = h.return
                        }
                    for (; x !== null; ) {
                        if (h = la(x),
                        h === null)
                            return;
                        if (C = h.tag,
                        C === 5 || C === 6 || C === 26 || C === 27) {
                            a = u = h;
                            continue e
                        }
                        x = x.parentNode
                    }
                }
                a = a.return
            }
        Cc(function() {
            var R = u
              , H = ar(n)
              , Y = [];
            e: {
                var M = Pc.get(e);
                if (M !== void 0) {
                    var L = pi
                      , P = e;
                    switch (e) {
                    case "keypress":
                        if (mi(n) === 0)
                            break e;
                    case "keydown":
                    case "keyup":
                        L = Ip;
                        break;
                    case "focusin":
                        P = "focus",
                        L = ur;
                        break;
                    case "focusout":
                        P = "blur",
                        L = ur;
                        break;
                    case "beforeblur":
                    case "afterblur":
                        L = ur;
                        break;
                    case "click":
                        if (n.button === 2)
                            break e;
                    case "auxclick":
                    case "dblclick":
                    case "mousedown":
                    case "mousemove":
                    case "mouseup":
                    case "mouseout":
                    case "mouseover":
                    case "contextmenu":
                        L = Ac;
                        break;
                    case "drag":
                    case "dragend":
                    case "dragenter":
                    case "dragexit":
                    case "dragleave":
                    case "dragover":
                    case "dragstart":
                    case "drop":
                        L = kp;
                        break;
                    case "touchcancel":
                    case "touchend":
                    case "touchmove":
                    case "touchstart":
                        L = t0;
                        break;
                    case Jc:
                    case $c:
                    case Wc:
                        L = Vp;
                        break;
                    case Ic:
                        L = a0;
                        break;
                    case "scroll":
                    case "scrollend":
                        L = Bp;
                        break;
                    case "wheel":
                        L = i0;
                        break;
                    case "copy":
                    case "cut":
                    case "paste":
                        L = Xp;
                        break;
                    case "gotpointercapture":
                    case "lostpointercapture":
                    case "pointercancel":
                    case "pointerdown":
                    case "pointermove":
                    case "pointerout":
                    case "pointerover":
                    case "pointerup":
                        L = Oc;
                        break;
                    case "toggle":
                    case "beforetoggle":
                        L = r0
                    }
                    var le = (t & 4) !== 0
                      , Oe = !le && (e === "scroll" || e === "scrollend")
                      , T = le ? M !== null ? M + "Capture" : null : M;
                    le = [];
                    for (var j = R, O; j !== null; ) {
                        var q = j;
                        if (O = q.stateNode,
                        q = q.tag,
                        q !== 5 && q !== 26 && q !== 27 || O === null || T === null || (q = el(j, T),
                        q != null && le.push(Dl(j, q, O))),
                        Oe)
                            break;
                        j = j.return
                    }
                    0 < le.length && (M = new L(M,P,null,n,H),
                    Y.push({
                        event: M,
                        listeners: le
                    }))
                }
            }
            if ((t & 7) === 0) {
                e: {
                    if (M = e === "mouseover" || e === "pointerover",
                    L = e === "mouseout" || e === "pointerout",
                    M && n !== nr && (P = n.relatedTarget || n.fromElement) && (la(P) || P[aa]))
                        break e;
                    if ((L || M) && (M = H.window === H ? H : (M = H.ownerDocument) ? M.defaultView || M.parentWindow : window,
                    L ? (P = n.relatedTarget || n.toElement,
                    L = R,
                    P = P ? la(P) : null,
                    P !== null && (Oe = f(P),
                    le = P.tag,
                    P !== Oe || le !== 5 && le !== 27 && le !== 6) && (P = null)) : (L = null,
                    P = R),
                    L !== P)) {
                        if (le = Ac,
                        q = "onMouseLeave",
                        T = "onMouseEnter",
                        j = "mouse",
                        (e === "pointerout" || e === "pointerover") && (le = Oc,
                        q = "onPointerLeave",
                        T = "onPointerEnter",
                        j = "pointer"),
                        Oe = L == null ? M : Pa(L),
                        O = P == null ? M : Pa(P),
                        M = new le(q,j + "leave",L,n,H),
                        M.target = Oe,
                        M.relatedTarget = O,
                        q = null,
                        la(H) === R && (le = new le(T,j + "enter",P,n,H),
                        le.target = O,
                        le.relatedTarget = Oe,
                        q = le),
                        Oe = q,
                        L && P)
                            t: {
                                for (le = sy,
                                T = L,
                                j = P,
                                O = 0,
                                q = T; q; q = le(q))
                                    O++;
                                q = 0;
                                for (var te = j; te; te = le(te))
                                    q++;
                                for (; 0 < O - q; )
                                    T = le(T),
                                    O--;
                                for (; 0 < q - O; )
                                    j = le(j),
                                    q--;
                                for (; O--; ) {
                                    if (T === j || j !== null && T === j.alternate) {
                                        le = T;
                                        break t
                                    }
                                    T = le(T),
                                    j = le(j)
                                }
                                le = null
                            }
                        else
                            le = null;
                        L !== null && wh(Y, M, L, le, !1),
                        P !== null && Oe !== null && wh(Y, Oe, P, le, !0)
                    }
                }
                e: {
                    if (M = R ? Pa(R) : window,
                    L = M.nodeName && M.nodeName.toLowerCase(),
                    L === "select" || L === "input" && M.type === "file")
                        var be = Bc;
                    else if (Uc(M))
                        if (qc)
                            be = y0;
                        else {
                            be = g0;
                            var ee = m0
                        }
                    else
                        L = M.nodeName,
                        !L || L.toLowerCase() !== "input" || M.type !== "checkbox" && M.type !== "radio" ? R && tr(R.elementType) && (be = Bc) : be = p0;
                    if (be && (be = be(e, R))) {
                        Hc(Y, be, n, H);
                        break e
                    }
                    ee && ee(e, M, R),
                    e === "focusout" && R && M.type === "number" && R.memoizedProps.value != null && er(M, "number", M.value)
                }
                switch (ee = R ? Pa(R) : window,
                e) {
                case "focusin":
                    (Uc(ee) || ee.contentEditable === "true") && (ha = ee,
                    gr = R,
                    ol = null);
                    break;
                case "focusout":
                    ol = gr = ha = null;
                    break;
                case "mousedown":
                    pr = !0;
                    break;
                case "contextmenu":
                case "mouseup":
                case "dragend":
                    pr = !1,
                    Kc(Y, n, H);
                    break;
                case "selectionchange":
                    if (v0)
                        break;
                case "keydown":
                case "keyup":
                    Kc(Y, n, H)
                }
                var fe;
                if (fr)
                    e: {
                        switch (e) {
                        case "compositionstart":
                            var ye = "onCompositionStart";
                            break e;
                        case "compositionend":
                            ye = "onCompositionEnd";
                            break e;
                        case "compositionupdate":
                            ye = "onCompositionUpdate";
                            break e
                        }
                        ye = void 0
                    }
                else
                    da ? Lc(e, n) && (ye = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (ye = "onCompositionStart");
                ye && (Rc && n.locale !== "ko" && (da || ye !== "onCompositionStart" ? ye === "onCompositionEnd" && da && (fe = _c()) : (gn = H,
                sr = "value"in gn ? gn.value : gn.textContent,
                da = !0)),
                ee = ss(R, ye),
                0 < ee.length && (ye = new Tc(ye,e,null,n,H),
                Y.push({
                    event: ye,
                    listeners: ee
                }),
                fe ? ye.data = fe : (fe = zc(n),
                fe !== null && (ye.data = fe)))),
                (fe = u0 ? c0(e, n) : f0(e, n)) && (ye = ss(R, "onBeforeInput"),
                0 < ye.length && (ee = new Tc("onBeforeInput","beforeinput",null,n,H),
                Y.push({
                    event: ee,
                    listeners: ye
                }),
                ee.data = fe)),
                ny(Y, e, R, n, H)
            }
            bh(Y, t)
        })
    }
    function Dl(e, t, n) {
        return {
            instance: e,
            listener: t,
            currentTarget: n
        }
    }
    function ss(e, t) {
        for (var n = t + "Capture", a = []; e !== null; ) {
            var s = e
              , u = s.stateNode;
            if (s = s.tag,
            s !== 5 && s !== 26 && s !== 27 || u === null || (s = el(e, n),
            s != null && a.unshift(Dl(e, s, u)),
            s = el(e, t),
            s != null && a.push(Dl(e, s, u))),
            e.tag === 3)
                return a;
            e = e.return
        }
        return []
    }
    function sy(e) {
        if (e === null)
            return null;
        do
            e = e.return;
        while (e && e.tag !== 5 && e.tag !== 27);
        return e || null
    }
    function wh(e, t, n, a, s) {
        for (var u = t._reactName, h = []; n !== null && n !== a; ) {
            var x = n
              , C = x.alternate
              , R = x.stateNode;
            if (x = x.tag,
            C !== null && C === a)
                break;
            x !== 5 && x !== 26 && x !== 27 || R === null || (C = R,
            s ? (R = el(n, u),
            R != null && h.unshift(Dl(n, R, C))) : s || (R = el(n, u),
            R != null && h.push(Dl(n, R, C)))),
            n = n.return
        }
        h.length !== 0 && e.push({
            event: t,
            listeners: h
        })
    }
    var ry = /\r\n?/g
      , oy = /\u0000|\uFFFD/g;
    function Eh(e) {
        return (typeof e == "string" ? e : "" + e).replace(ry, `
`).replace(oy, "")
    }
    function Nh(e, t) {
        return t = Eh(t),
        Eh(e) === t
    }
    function Te(e, t, n, a, s, u) {
        switch (n) {
        case "children":
            typeof a == "string" ? t === "body" || t === "textarea" && a === "" || ua(e, a) : (typeof a == "number" || typeof a == "bigint") && t !== "body" && ua(e, "" + a);
            break;
        case "className":
            ci(e, "class", a);
            break;
        case "tabIndex":
            ci(e, "tabindex", a);
            break;
        case "dir":
        case "role":
        case "viewBox":
        case "width":
        case "height":
            ci(e, n, a);
            break;
        case "style":
            Ec(e, a, u);
            break;
        case "data":
            if (t !== "object") {
                ci(e, "data", a);
                break
            }
        case "src":
        case "href":
            if (a === "" && (t !== "a" || n !== "href")) {
                e.removeAttribute(n);
                break
            }
            if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
                e.removeAttribute(n);
                break
            }
            a = di("" + a),
            e.setAttribute(n, a);
            break;
        case "action":
        case "formAction":
            if (typeof a == "function") {
                e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
                break
            } else
                typeof u == "function" && (n === "formAction" ? (t !== "input" && Te(e, t, "name", s.name, s, null),
                Te(e, t, "formEncType", s.formEncType, s, null),
                Te(e, t, "formMethod", s.formMethod, s, null),
                Te(e, t, "formTarget", s.formTarget, s, null)) : (Te(e, t, "encType", s.encType, s, null),
                Te(e, t, "method", s.method, s, null),
                Te(e, t, "target", s.target, s, null)));
            if (a == null || typeof a == "symbol" || typeof a == "boolean") {
                e.removeAttribute(n);
                break
            }
            a = di("" + a),
            e.setAttribute(n, a);
            break;
        case "onClick":
            a != null && (e.onclick = Kt);
            break;
        case "onScroll":
            a != null && ge("scroll", e);
            break;
        case "onScrollEnd":
            a != null && ge("scrollend", e);
            break;
        case "dangerouslySetInnerHTML":
            if (a != null) {
                if (typeof a != "object" || !("__html"in a))
                    throw Error(o(61));
                if (n = a.__html,
                n != null) {
                    if (s.children != null)
                        throw Error(o(60));
                    e.innerHTML = n
                }
            }
            break;
        case "multiple":
            e.multiple = a && typeof a != "function" && typeof a != "symbol";
            break;
        case "muted":
            e.muted = a && typeof a != "function" && typeof a != "symbol";
            break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "defaultValue":
        case "defaultChecked":
        case "innerHTML":
        case "ref":
            break;
        case "autoFocus":
            break;
        case "xlinkHref":
            if (a == null || typeof a == "function" || typeof a == "boolean" || typeof a == "symbol") {
                e.removeAttribute("xlink:href");
                break
            }
            n = di("" + a),
            e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
            break;
        case "contentEditable":
        case "spellCheck":
        case "draggable":
        case "value":
        case "autoReverse":
        case "externalResourcesRequired":
        case "focusable":
        case "preserveAlpha":
            a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(n, "" + a) : e.removeAttribute(n);
            break;
        case "inert":
        case "allowFullScreen":
        case "async":
        case "autoPlay":
        case "controls":
        case "default":
        case "defer":
        case "disabled":
        case "disablePictureInPicture":
        case "disableRemotePlayback":
        case "formNoValidate":
        case "hidden":
        case "loop":
        case "noModule":
        case "noValidate":
        case "open":
        case "playsInline":
        case "readOnly":
        case "required":
        case "reversed":
        case "scoped":
        case "seamless":
        case "itemScope":
            a && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
            break;
        case "capture":
        case "download":
            a === !0 ? e.setAttribute(n, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(n, a) : e.removeAttribute(n);
            break;
        case "cols":
        case "rows":
        case "size":
        case "span":
            a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? e.setAttribute(n, a) : e.removeAttribute(n);
            break;
        case "rowSpan":
        case "start":
            a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? e.removeAttribute(n) : e.setAttribute(n, a);
            break;
        case "popover":
            ge("beforetoggle", e),
            ge("toggle", e),
            ui(e, "popover", a);
            break;
        case "xlinkActuate":
            Zt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", a);
            break;
        case "xlinkArcrole":
            Zt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", a);
            break;
        case "xlinkRole":
            Zt(e, "http://www.w3.org/1999/xlink", "xlink:role", a);
            break;
        case "xlinkShow":
            Zt(e, "http://www.w3.org/1999/xlink", "xlink:show", a);
            break;
        case "xlinkTitle":
            Zt(e, "http://www.w3.org/1999/xlink", "xlink:title", a);
            break;
        case "xlinkType":
            Zt(e, "http://www.w3.org/1999/xlink", "xlink:type", a);
            break;
        case "xmlBase":
            Zt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", a);
            break;
        case "xmlLang":
            Zt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", a);
            break;
        case "xmlSpace":
            Zt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", a);
            break;
        case "is":
            ui(e, "is", a);
            break;
        case "innerText":
        case "textContent":
            break;
        default:
            (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = Up.get(n) || n,
            ui(e, n, a))
        }
    }
    function Yo(e, t, n, a, s, u) {
        switch (n) {
        case "style":
            Ec(e, a, u);
            break;
        case "dangerouslySetInnerHTML":
            if (a != null) {
                if (typeof a != "object" || !("__html"in a))
                    throw Error(o(61));
                if (n = a.__html,
                n != null) {
                    if (s.children != null)
                        throw Error(o(60));
                    e.innerHTML = n
                }
            }
            break;
        case "children":
            typeof a == "string" ? ua(e, a) : (typeof a == "number" || typeof a == "bigint") && ua(e, "" + a);
            break;
        case "onScroll":
            a != null && ge("scroll", e);
            break;
        case "onScrollEnd":
            a != null && ge("scrollend", e);
            break;
        case "onClick":
            a != null && (e.onclick = Kt);
            break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "innerHTML":
        case "ref":
            break;
        case "innerText":
        case "textContent":
            break;
        default:
            if (!mc.hasOwnProperty(n))
                e: {
                    if (n[0] === "o" && n[1] === "n" && (s = n.endsWith("Capture"),
                    t = n.slice(2, s ? n.length - 7 : void 0),
                    u = e[it] || null,
                    u = u != null ? u[n] : null,
                    typeof u == "function" && e.removeEventListener(t, u, s),
                    typeof a == "function")) {
                        typeof u != "function" && u !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)),
                        e.addEventListener(t, a, s);
                        break e
                    }
                    n in e ? e[n] = a : a === !0 ? e.setAttribute(n, "") : ui(e, n, a)
                }
        }
    }
    function et(e, t, n) {
        switch (t) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
            break;
        case "img":
            ge("error", e),
            ge("load", e);
            var a = !1, s = !1, u;
            for (u in n)
                if (n.hasOwnProperty(u)) {
                    var h = n[u];
                    if (h != null)
                        switch (u) {
                        case "src":
                            a = !0;
                            break;
                        case "srcSet":
                            s = !0;
                            break;
                        case "children":
                        case "dangerouslySetInnerHTML":
                            throw Error(o(137, t));
                        default:
                            Te(e, t, u, h, n, null)
                        }
                }
            s && Te(e, t, "srcSet", n.srcSet, n, null),
            a && Te(e, t, "src", n.src, n, null);
            return;
        case "input":
            ge("invalid", e);
            var x = u = h = s = null
              , C = null
              , R = null;
            for (a in n)
                if (n.hasOwnProperty(a)) {
                    var H = n[a];
                    if (H != null)
                        switch (a) {
                        case "name":
                            s = H;
                            break;
                        case "type":
                            h = H;
                            break;
                        case "checked":
                            C = H;
                            break;
                        case "defaultChecked":
                            R = H;
                            break;
                        case "value":
                            u = H;
                            break;
                        case "defaultValue":
                            x = H;
                            break;
                        case "children":
                        case "dangerouslySetInnerHTML":
                            if (H != null)
                                throw Error(o(137, t));
                            break;
                        default:
                            Te(e, t, a, H, n, null)
                        }
                }
            vc(e, u, x, C, R, h, s, !1);
            return;
        case "select":
            ge("invalid", e),
            a = h = u = null;
            for (s in n)
                if (n.hasOwnProperty(s) && (x = n[s],
                x != null))
                    switch (s) {
                    case "value":
                        u = x;
                        break;
                    case "defaultValue":
                        h = x;
                        break;
                    case "multiple":
                        a = x;
                    default:
                        Te(e, t, s, x, n, null)
                    }
            t = u,
            n = h,
            e.multiple = !!a,
            t != null ? oa(e, !!a, t, !1) : n != null && oa(e, !!a, n, !0);
            return;
        case "textarea":
            ge("invalid", e),
            u = s = a = null;
            for (h in n)
                if (n.hasOwnProperty(h) && (x = n[h],
                x != null))
                    switch (h) {
                    case "value":
                        a = x;
                        break;
                    case "defaultValue":
                        s = x;
                        break;
                    case "children":
                        u = x;
                        break;
                    case "dangerouslySetInnerHTML":
                        if (x != null)
                            throw Error(o(91));
                        break;
                    default:
                        Te(e, t, h, x, n, null)
                    }
            Sc(e, a, s, u);
            return;
        case "option":
            for (C in n)
                n.hasOwnProperty(C) && (a = n[C],
                a != null) && (C === "selected" ? e.selected = a && typeof a != "function" && typeof a != "symbol" : Te(e, t, C, a, n, null));
            return;
        case "dialog":
            ge("beforetoggle", e),
            ge("toggle", e),
            ge("cancel", e),
            ge("close", e);
            break;
        case "iframe":
        case "object":
            ge("load", e);
            break;
        case "video":
        case "audio":
            for (a = 0; a < Ml.length; a++)
                ge(Ml[a], e);
            break;
        case "image":
            ge("error", e),
            ge("load", e);
            break;
        case "details":
            ge("toggle", e);
            break;
        case "embed":
        case "source":
        case "link":
            ge("error", e),
            ge("load", e);
        case "area":
        case "base":
        case "br":
        case "col":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "track":
        case "wbr":
        case "menuitem":
            for (R in n)
                if (n.hasOwnProperty(R) && (a = n[R],
                a != null))
                    switch (R) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                        throw Error(o(137, t));
                    default:
                        Te(e, t, R, a, n, null)
                    }
            return;
        default:
            if (tr(t)) {
                for (H in n)
                    n.hasOwnProperty(H) && (a = n[H],
                    a !== void 0 && Yo(e, t, H, a, n, void 0));
                return
            }
        }
        for (x in n)
            n.hasOwnProperty(x) && (a = n[x],
            a != null && Te(e, t, x, a, n, null))
    }
    function uy(e, t, n, a) {
        switch (t) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
            break;
        case "input":
            var s = null
              , u = null
              , h = null
              , x = null
              , C = null
              , R = null
              , H = null;
            for (L in n) {
                var Y = n[L];
                if (n.hasOwnProperty(L) && Y != null)
                    switch (L) {
                    case "checked":
                        break;
                    case "value":
                        break;
                    case "defaultValue":
                        C = Y;
                    default:
                        a.hasOwnProperty(L) || Te(e, t, L, null, a, Y)
                    }
            }
            for (var M in a) {
                var L = a[M];
                if (Y = n[M],
                a.hasOwnProperty(M) && (L != null || Y != null))
                    switch (M) {
                    case "type":
                        u = L;
                        break;
                    case "name":
                        s = L;
                        break;
                    case "checked":
                        R = L;
                        break;
                    case "defaultChecked":
                        H = L;
                        break;
                    case "value":
                        h = L;
                        break;
                    case "defaultValue":
                        x = L;
                        break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                        if (L != null)
                            throw Error(o(137, t));
                        break;
                    default:
                        L !== Y && Te(e, t, M, L, a, Y)
                    }
            }
            Ps(e, h, x, C, R, H, u, s);
            return;
        case "select":
            L = h = x = M = null;
            for (u in n)
                if (C = n[u],
                n.hasOwnProperty(u) && C != null)
                    switch (u) {
                    case "value":
                        break;
                    case "multiple":
                        L = C;
                    default:
                        a.hasOwnProperty(u) || Te(e, t, u, null, a, C)
                    }
            for (s in a)
                if (u = a[s],
                C = n[s],
                a.hasOwnProperty(s) && (u != null || C != null))
                    switch (s) {
                    case "value":
                        M = u;
                        break;
                    case "defaultValue":
                        x = u;
                        break;
                    case "multiple":
                        h = u;
                    default:
                        u !== C && Te(e, t, s, u, a, C)
                    }
            t = x,
            n = h,
            a = L,
            M != null ? oa(e, !!n, M, !1) : !!a != !!n && (t != null ? oa(e, !!n, t, !0) : oa(e, !!n, n ? [] : "", !1));
            return;
        case "textarea":
            L = M = null;
            for (x in n)
                if (s = n[x],
                n.hasOwnProperty(x) && s != null && !a.hasOwnProperty(x))
                    switch (x) {
                    case "value":
                        break;
                    case "children":
                        break;
                    default:
                        Te(e, t, x, null, a, s)
                    }
            for (h in a)
                if (s = a[h],
                u = n[h],
                a.hasOwnProperty(h) && (s != null || u != null))
                    switch (h) {
                    case "value":
                        M = s;
                        break;
                    case "defaultValue":
                        L = s;
                        break;
                    case "children":
                        break;
                    case "dangerouslySetInnerHTML":
                        if (s != null)
                            throw Error(o(91));
                        break;
                    default:
                        s !== u && Te(e, t, h, s, a, u)
                    }
            bc(e, M, L);
            return;
        case "option":
            for (var P in n)
                M = n[P],
                n.hasOwnProperty(P) && M != null && !a.hasOwnProperty(P) && (P === "selected" ? e.selected = !1 : Te(e, t, P, null, a, M));
            for (C in a)
                M = a[C],
                L = n[C],
                a.hasOwnProperty(C) && M !== L && (M != null || L != null) && (C === "selected" ? e.selected = M && typeof M != "function" && typeof M != "symbol" : Te(e, t, C, M, a, L));
            return;
        case "img":
        case "link":
        case "area":
        case "base":
        case "br":
        case "col":
        case "embed":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "source":
        case "track":
        case "wbr":
        case "menuitem":
            for (var le in n)
                M = n[le],
                n.hasOwnProperty(le) && M != null && !a.hasOwnProperty(le) && Te(e, t, le, null, a, M);
            for (R in a)
                if (M = a[R],
                L = n[R],
                a.hasOwnProperty(R) && M !== L && (M != null || L != null))
                    switch (R) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                        if (M != null)
                            throw Error(o(137, t));
                        break;
                    default:
                        Te(e, t, R, M, a, L)
                    }
            return;
        default:
            if (tr(t)) {
                for (var Oe in n)
                    M = n[Oe],
                    n.hasOwnProperty(Oe) && M !== void 0 && !a.hasOwnProperty(Oe) && Yo(e, t, Oe, void 0, a, M);
                for (H in a)
                    M = a[H],
                    L = n[H],
                    !a.hasOwnProperty(H) || M === L || M === void 0 && L === void 0 || Yo(e, t, H, M, a, L);
                return
            }
        }
        for (var T in n)
            M = n[T],
            n.hasOwnProperty(T) && M != null && !a.hasOwnProperty(T) && Te(e, t, T, null, a, M);
        for (Y in a)
            M = a[Y],
            L = n[Y],
            !a.hasOwnProperty(Y) || M === L || M == null && L == null || Te(e, t, Y, M, a, L)
    }
    function Ch(e) {
        switch (e) {
        case "css":
        case "script":
        case "font":
        case "img":
        case "image":
        case "input":
        case "link":
            return !0;
        default:
            return !1
        }
    }
    function cy() {
        if (typeof performance.getEntriesByType == "function") {
            for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), a = 0; a < n.length; a++) {
                var s = n[a]
                  , u = s.transferSize
                  , h = s.initiatorType
                  , x = s.duration;
                if (u && x && Ch(h)) {
                    for (h = 0,
                    x = s.responseEnd,
                    a += 1; a < n.length; a++) {
                        var C = n[a]
                          , R = C.startTime;
                        if (R > x)
                            break;
                        var H = C.transferSize
                          , Y = C.initiatorType;
                        H && Ch(Y) && (C = C.responseEnd,
                        h += H * (C < x ? 1 : (x - R) / (C - R)))
                    }
                    if (--a,
                    t += 8 * (u + h) / (s.duration / 1e3),
                    e++,
                    10 < e)
                        break
                }
            }
            if (0 < e)
                return t / e / 1e6
        }
        return navigator.connection && (e = navigator.connection.downlink,
        typeof e == "number") ? e : 5
    }
    var Vo = null
      , Qo = null;
    function rs(e) {
        return e.nodeType === 9 ? e : e.ownerDocument
    }
    function _h(e) {
        switch (e) {
        case "http://www.w3.org/2000/svg":
            return 1;
        case "http://www.w3.org/1998/Math/MathML":
            return 2;
        default:
            return 0
        }
    }
    function jh(e, t) {
        if (e === 0)
            switch (t) {
            case "svg":
                return 1;
            case "math":
                return 2;
            default:
                return 0
            }
        return e === 1 && t === "foreignObject" ? 0 : e
    }
    function Xo(e, t) {
        return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null
    }
    var Zo = null;
    function fy() {
        var e = window.event;
        return e && e.type === "popstate" ? e === Zo ? !1 : (Zo = e,
        !0) : (Zo = null,
        !1)
    }
    var Ah = typeof setTimeout == "function" ? setTimeout : void 0
      , dy = typeof clearTimeout == "function" ? clearTimeout : void 0
      , Th = typeof Promise == "function" ? Promise : void 0
      , hy = typeof queueMicrotask == "function" ? queueMicrotask : typeof Th < "u" ? function(e) {
        return Th.resolve(null).then(e).catch(my)
    }
    : Ah;
    function my(e) {
        setTimeout(function() {
            throw e
        })
    }
    function Mn(e) {
        return e === "head"
    }
    function Oh(e, t) {
        var n = t
          , a = 0;
        do {
            var s = n.nextSibling;
            if (e.removeChild(n),
            s && s.nodeType === 8)
                if (n = s.data,
                n === "/$" || n === "/&") {
                    if (a === 0) {
                        e.removeChild(s),
                        ka(t);
                        return
                    }
                    a--
                } else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&")
                    a++;
                else if (n === "html")
                    Ll(e.ownerDocument.documentElement);
                else if (n === "head") {
                    n = e.ownerDocument.head,
                    Ll(n);
                    for (var u = n.firstChild; u; ) {
                        var h = u.nextSibling
                          , x = u.nodeName;
                        u[Ia] || x === "SCRIPT" || x === "STYLE" || x === "LINK" && u.rel.toLowerCase() === "stylesheet" || n.removeChild(u),
                        u = h
                    }
                } else
                    n === "body" && Ll(e.ownerDocument.body);
            n = s
        } while (n);
        ka(t)
    }
    function Rh(e, t) {
        var n = e;
        e = 0;
        do {
            var a = n.nextSibling;
            if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display,
            n.style.display = "none") : (n.style.display = n._stashedDisplay || "",
            n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue,
            n.nodeValue = "") : n.nodeValue = n._stashedText || ""),
            a && a.nodeType === 8)
                if (n = a.data,
                n === "/$") {
                    if (e === 0)
                        break;
                    e--
                } else
                    n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
            n = a
        } while (n)
    }
    function Ko(e) {
        var t = e.firstChild;
        for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
            var n = t;
            switch (t = t.nextSibling,
            n.nodeName) {
            case "HTML":
            case "HEAD":
            case "BODY":
                Ko(n),
                Ws(n);
                continue;
            case "SCRIPT":
            case "STYLE":
                continue;
            case "LINK":
                if (n.rel.toLowerCase() === "stylesheet")
                    continue
            }
            e.removeChild(n)
        }
    }
    function gy(e, t, n, a) {
        for (; e.nodeType === 1; ) {
            var s = n;
            if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
                if (!a && (e.nodeName !== "INPUT" || e.type !== "hidden"))
                    break
            } else if (a) {
                if (!e[Ia])
                    switch (t) {
                    case "meta":
                        if (!e.hasAttribute("itemprop"))
                            break;
                        return e;
                    case "link":
                        if (u = e.getAttribute("rel"),
                        u === "stylesheet" && e.hasAttribute("data-precedence"))
                            break;
                        if (u !== s.rel || e.getAttribute("href") !== (s.href == null || s.href === "" ? null : s.href) || e.getAttribute("crossorigin") !== (s.crossOrigin == null ? null : s.crossOrigin) || e.getAttribute("title") !== (s.title == null ? null : s.title))
                            break;
                        return e;
                    case "style":
                        if (e.hasAttribute("data-precedence"))
                            break;
                        return e;
                    case "script":
                        if (u = e.getAttribute("src"),
                        (u !== (s.src == null ? null : s.src) || e.getAttribute("type") !== (s.type == null ? null : s.type) || e.getAttribute("crossorigin") !== (s.crossOrigin == null ? null : s.crossOrigin)) && u && e.hasAttribute("async") && !e.hasAttribute("itemprop"))
                            break;
                        return e;
                    default:
                        return e
                    }
            } else if (t === "input" && e.type === "hidden") {
                var u = s.name == null ? null : "" + s.name;
                if (s.type === "hidden" && e.getAttribute("name") === u)
                    return e
            } else
                return e;
            if (e = Ot(e.nextSibling),
            e === null)
                break
        }
        return null
    }
    function py(e, t, n) {
        if (t === "")
            return null;
        for (; e.nodeType !== 3; )
            if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = Ot(e.nextSibling),
            e === null))
                return null;
        return e
    }
    function Mh(e, t) {
        for (; e.nodeType !== 8; )
            if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Ot(e.nextSibling),
            e === null))
                return null;
        return e
    }
    function Fo(e) {
        return e.data === "$?" || e.data === "$~"
    }
    function Jo(e) {
        return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading"
    }
    function yy(e, t) {
        var n = e.ownerDocument;
        if (e.data === "$~")
            e._reactRetry = t;
        else if (e.data !== "$?" || n.readyState !== "loading")
            t();
        else {
            var a = function() {
                t(),
                n.removeEventListener("DOMContentLoaded", a)
            };
            n.addEventListener("DOMContentLoaded", a),
            e._reactRetry = a
        }
    }
    function Ot(e) {
        for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3)
                break;
            if (t === 8) {
                if (t = e.data,
                t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F")
                    break;
                if (t === "/$" || t === "/&")
                    return null
            }
        }
        return e
    }
    var $o = null;
    function Dh(e) {
        e = e.nextSibling;
        for (var t = 0; e; ) {
            if (e.nodeType === 8) {
                var n = e.data;
                if (n === "/$" || n === "/&") {
                    if (t === 0)
                        return Ot(e.nextSibling);
                    t--
                } else
                    n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++
            }
            e = e.nextSibling
        }
        return null
    }
    function Lh(e) {
        e = e.previousSibling;
        for (var t = 0; e; ) {
            if (e.nodeType === 8) {
                var n = e.data;
                if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
                    if (t === 0)
                        return e;
                    t--
                } else
                    n !== "/$" && n !== "/&" || t++
            }
            e = e.previousSibling
        }
        return null
    }
    function zh(e, t, n) {
        switch (t = rs(n),
        e) {
        case "html":
            if (e = t.documentElement,
            !e)
                throw Error(o(452));
            return e;
        case "head":
            if (e = t.head,
            !e)
                throw Error(o(453));
            return e;
        case "body":
            if (e = t.body,
            !e)
                throw Error(o(454));
            return e;
        default:
            throw Error(o(451))
        }
    }
    function Ll(e) {
        for (var t = e.attributes; t.length; )
            e.removeAttributeNode(t[0]);
        Ws(e)
    }
    var Rt = new Map
      , Uh = new Set;
    function os(e) {
        return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument
    }
    var cn = X.d;
    X.d = {
        f: xy,
        r: vy,
        D: by,
        C: Sy,
        L: wy,
        m: Ey,
        X: Cy,
        S: Ny,
        M: _y
    };
    function xy() {
        var e = cn.f()
          , t = Pi();
        return e || t
    }
    function vy(e) {
        var t = ia(e);
        t !== null && t.tag === 5 && t.type === "form" ? Pf(t) : cn.r(e)
    }
    var Ha = typeof document > "u" ? null : document;
    function Hh(e, t, n) {
        var a = Ha;
        if (a && typeof t == "string" && t) {
            var s = Et(t);
            s = 'link[rel="' + e + '"][href="' + s + '"]',
            typeof n == "string" && (s += '[crossorigin="' + n + '"]'),
            Uh.has(s) || (Uh.add(s),
            e = {
                rel: e,
                crossOrigin: n,
                href: t
            },
            a.querySelector(s) === null && (t = a.createElement("link"),
            et(t, "link", e),
            Ke(t),
            a.head.appendChild(t)))
        }
    }
    function by(e) {
        cn.D(e),
        Hh("dns-prefetch", e, null)
    }
    function Sy(e, t) {
        cn.C(e, t),
        Hh("preconnect", e, t)
    }
    function wy(e, t, n) {
        cn.L(e, t, n);
        var a = Ha;
        if (a && e && t) {
            var s = 'link[rel="preload"][as="' + Et(t) + '"]';
            t === "image" && n && n.imageSrcSet ? (s += '[imagesrcset="' + Et(n.imageSrcSet) + '"]',
            typeof n.imageSizes == "string" && (s += '[imagesizes="' + Et(n.imageSizes) + '"]')) : s += '[href="' + Et(e) + '"]';
            var u = s;
            switch (t) {
            case "style":
                u = Ba(e);
                break;
            case "script":
                u = qa(e)
            }
            Rt.has(u) || (e = v({
                rel: "preload",
                href: t === "image" && n && n.imageSrcSet ? void 0 : e,
                as: t
            }, n),
            Rt.set(u, e),
            a.querySelector(s) !== null || t === "style" && a.querySelector(zl(u)) || t === "script" && a.querySelector(Ul(u)) || (t = a.createElement("link"),
            et(t, "link", e),
            Ke(t),
            a.head.appendChild(t)))
        }
    }
    function Ey(e, t) {
        cn.m(e, t);
        var n = Ha;
        if (n && e) {
            var a = t && typeof t.as == "string" ? t.as : "script"
              , s = 'link[rel="modulepreload"][as="' + Et(a) + '"][href="' + Et(e) + '"]'
              , u = s;
            switch (a) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script":
                u = qa(e)
            }
            if (!Rt.has(u) && (e = v({
                rel: "modulepreload",
                href: e
            }, t),
            Rt.set(u, e),
            n.querySelector(s) === null)) {
                switch (a) {
                case "audioworklet":
                case "paintworklet":
                case "serviceworker":
                case "sharedworker":
                case "worker":
                case "script":
                    if (n.querySelector(Ul(u)))
                        return
                }
                a = n.createElement("link"),
                et(a, "link", e),
                Ke(a),
                n.head.appendChild(a)
            }
        }
    }
    function Ny(e, t, n) {
        cn.S(e, t, n);
        var a = Ha;
        if (a && e) {
            var s = sa(a).hoistableStyles
              , u = Ba(e);
            t = t || "default";
            var h = s.get(u);
            if (!h) {
                var x = {
                    loading: 0,
                    preload: null
                };
                if (h = a.querySelector(zl(u)))
                    x.loading = 5;
                else {
                    e = v({
                        rel: "stylesheet",
                        href: e,
                        "data-precedence": t
                    }, n),
                    (n = Rt.get(u)) && Wo(e, n);
                    var C = h = a.createElement("link");
                    Ke(C),
                    et(C, "link", e),
                    C._p = new Promise(function(R, H) {
                        C.onload = R,
                        C.onerror = H
                    }
                    ),
                    C.addEventListener("load", function() {
                        x.loading |= 1
                    }),
                    C.addEventListener("error", function() {
                        x.loading |= 2
                    }),
                    x.loading |= 4,
                    us(h, t, a)
                }
                h = {
                    type: "stylesheet",
                    instance: h,
                    count: 1,
                    state: x
                },
                s.set(u, h)
            }
        }
    }
    function Cy(e, t) {
        cn.X(e, t);
        var n = Ha;
        if (n && e) {
            var a = sa(n).hoistableScripts
              , s = qa(e)
              , u = a.get(s);
            u || (u = n.querySelector(Ul(s)),
            u || (e = v({
                src: e,
                async: !0
            }, t),
            (t = Rt.get(s)) && Io(e, t),
            u = n.createElement("script"),
            Ke(u),
            et(u, "link", e),
            n.head.appendChild(u)),
            u = {
                type: "script",
                instance: u,
                count: 1,
                state: null
            },
            a.set(s, u))
        }
    }
    function _y(e, t) {
        cn.M(e, t);
        var n = Ha;
        if (n && e) {
            var a = sa(n).hoistableScripts
              , s = qa(e)
              , u = a.get(s);
            u || (u = n.querySelector(Ul(s)),
            u || (e = v({
                src: e,
                async: !0,
                type: "module"
            }, t),
            (t = Rt.get(s)) && Io(e, t),
            u = n.createElement("script"),
            Ke(u),
            et(u, "link", e),
            n.head.appendChild(u)),
            u = {
                type: "script",
                instance: u,
                count: 1,
                state: null
            },
            a.set(s, u))
        }
    }
    function Bh(e, t, n, a) {
        var s = (s = he.current) ? os(s) : null;
        if (!s)
            throw Error(o(446));
        switch (e) {
        case "meta":
        case "title":
            return null;
        case "style":
            return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Ba(n.href),
            n = sa(s).hoistableStyles,
            a = n.get(t),
            a || (a = {
                type: "style",
                instance: null,
                count: 0,
                state: null
            },
            n.set(t, a)),
            a) : {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        case "link":
            if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
                e = Ba(n.href);
                var u = sa(s).hoistableStyles
                  , h = u.get(e);
                if (h || (s = s.ownerDocument || s,
                h = {
                    type: "stylesheet",
                    instance: null,
                    count: 0,
                    state: {
                        loading: 0,
                        preload: null
                    }
                },
                u.set(e, h),
                (u = s.querySelector(zl(e))) && !u._p && (h.instance = u,
                h.state.loading = 5),
                Rt.has(e) || (n = {
                    rel: "preload",
                    as: "style",
                    href: n.href,
                    crossOrigin: n.crossOrigin,
                    integrity: n.integrity,
                    media: n.media,
                    hrefLang: n.hrefLang,
                    referrerPolicy: n.referrerPolicy
                },
                Rt.set(e, n),
                u || jy(s, e, n, h.state))),
                t && a === null)
                    throw Error(o(528, ""));
                return h
            }
            if (t && a !== null)
                throw Error(o(529, ""));
            return null;
        case "script":
            return t = n.async,
            n = n.src,
            typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = qa(n),
            n = sa(s).hoistableScripts,
            a = n.get(t),
            a || (a = {
                type: "script",
                instance: null,
                count: 0,
                state: null
            },
            n.set(t, a)),
            a) : {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        default:
            throw Error(o(444, e))
        }
    }
    function Ba(e) {
        return 'href="' + Et(e) + '"'
    }
    function zl(e) {
        return 'link[rel="stylesheet"][' + e + "]"
    }
    function qh(e) {
        return v({}, e, {
            "data-precedence": e.precedence,
            precedence: null
        })
    }
    function jy(e, t, n, a) {
        e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? a.loading = 1 : (t = e.createElement("link"),
        a.preload = t,
        t.addEventListener("load", function() {
            return a.loading |= 1
        }),
        t.addEventListener("error", function() {
            return a.loading |= 2
        }),
        et(t, "link", n),
        Ke(t),
        e.head.appendChild(t))
    }
    function qa(e) {
        return '[src="' + Et(e) + '"]'
    }
    function Ul(e) {
        return "script[async]" + e
    }
    function kh(e, t, n) {
        if (t.count++,
        t.instance === null)
            switch (t.type) {
            case "style":
                var a = e.querySelector('style[data-href~="' + Et(n.href) + '"]');
                if (a)
                    return t.instance = a,
                    Ke(a),
                    a;
                var s = v({}, n, {
                    "data-href": n.href,
                    "data-precedence": n.precedence,
                    href: null,
                    precedence: null
                });
                return a = (e.ownerDocument || e).createElement("style"),
                Ke(a),
                et(a, "style", s),
                us(a, n.precedence, e),
                t.instance = a;
            case "stylesheet":
                s = Ba(n.href);
                var u = e.querySelector(zl(s));
                if (u)
                    return t.state.loading |= 4,
                    t.instance = u,
                    Ke(u),
                    u;
                a = qh(n),
                (s = Rt.get(s)) && Wo(a, s),
                u = (e.ownerDocument || e).createElement("link"),
                Ke(u);
                var h = u;
                return h._p = new Promise(function(x, C) {
                    h.onload = x,
                    h.onerror = C
                }
                ),
                et(u, "link", a),
                t.state.loading |= 4,
                us(u, n.precedence, e),
                t.instance = u;
            case "script":
                return u = qa(n.src),
                (s = e.querySelector(Ul(u))) ? (t.instance = s,
                Ke(s),
                s) : (a = n,
                (s = Rt.get(u)) && (a = v({}, n),
                Io(a, s)),
                e = e.ownerDocument || e,
                s = e.createElement("script"),
                Ke(s),
                et(s, "link", a),
                e.head.appendChild(s),
                t.instance = s);
            case "void":
                return null;
            default:
                throw Error(o(443, t.type))
            }
        else
            t.type === "stylesheet" && (t.state.loading & 4) === 0 && (a = t.instance,
            t.state.loading |= 4,
            us(a, n.precedence, e));
        return t.instance
    }
    function us(e, t, n) {
        for (var a = n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), s = a.length ? a[a.length - 1] : null, u = s, h = 0; h < a.length; h++) {
            var x = a[h];
            if (x.dataset.precedence === t)
                u = x;
            else if (u !== s)
                break
        }
        u ? u.parentNode.insertBefore(e, u.nextSibling) : (t = n.nodeType === 9 ? n.head : n,
        t.insertBefore(e, t.firstChild))
    }
    function Wo(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
        e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
        e.title == null && (e.title = t.title)
    }
    function Io(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
        e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
        e.integrity == null && (e.integrity = t.integrity)
    }
    var cs = null;
    function Gh(e, t, n) {
        if (cs === null) {
            var a = new Map
              , s = cs = new Map;
            s.set(n, a)
        } else
            s = cs,
            a = s.get(n),
            a || (a = new Map,
            s.set(n, a));
        if (a.has(e))
            return a;
        for (a.set(e, null),
        n = n.getElementsByTagName(e),
        s = 0; s < n.length; s++) {
            var u = n[s];
            if (!(u[Ia] || u[$e] || e === "link" && u.getAttribute("rel") === "stylesheet") && u.namespaceURI !== "http://www.w3.org/2000/svg") {
                var h = u.getAttribute(t) || "";
                h = e + h;
                var x = a.get(h);
                x ? x.push(u) : a.set(h, [u])
            }
        }
        return a
    }
    function Yh(e, t, n) {
        e = e.ownerDocument || e,
        e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null)
    }
    function Ay(e, t, n) {
        if (n === 1 || t.itemProp != null)
            return !1;
        switch (e) {
        case "meta":
        case "title":
            return !0;
        case "style":
            if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "")
                break;
            return !0;
        case "link":
            if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError)
                break;
            return t.rel === "stylesheet" ? (e = t.disabled,
            typeof t.precedence == "string" && e == null) : !0;
        case "script":
            if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string")
                return !0
        }
        return !1
    }
    function Vh(e) {
        return !(e.type === "stylesheet" && (e.state.loading & 3) === 0)
    }
    function Ty(e, t, n, a) {
        if (n.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && (n.state.loading & 4) === 0) {
            if (n.instance === null) {
                var s = Ba(a.href)
                  , u = t.querySelector(zl(s));
                if (u) {
                    t = u._p,
                    t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++,
                    e = fs.bind(e),
                    t.then(e, e)),
                    n.state.loading |= 4,
                    n.instance = u,
                    Ke(u);
                    return
                }
                u = t.ownerDocument || t,
                a = qh(a),
                (s = Rt.get(s)) && Wo(a, s),
                u = u.createElement("link"),
                Ke(u);
                var h = u;
                h._p = new Promise(function(x, C) {
                    h.onload = x,
                    h.onerror = C
                }
                ),
                et(u, "link", a),
                n.instance = u
            }
            e.stylesheets === null && (e.stylesheets = new Map),
            e.stylesheets.set(n, t),
            (t = n.state.preload) && (n.state.loading & 3) === 0 && (e.count++,
            n = fs.bind(e),
            t.addEventListener("load", n),
            t.addEventListener("error", n))
        }
    }
    var Po = 0;
    function Oy(e, t) {
        return e.stylesheets && e.count === 0 && hs(e, e.stylesheets),
        0 < e.count || 0 < e.imgCount ? function(n) {
            var a = setTimeout(function() {
                if (e.stylesheets && hs(e, e.stylesheets),
                e.unsuspend) {
                    var u = e.unsuspend;
                    e.unsuspend = null,
                    u()
                }
            }, 6e4 + t);
            0 < e.imgBytes && Po === 0 && (Po = 62500 * cy());
            var s = setTimeout(function() {
                if (e.waitingForImages = !1,
                e.count === 0 && (e.stylesheets && hs(e, e.stylesheets),
                e.unsuspend)) {
                    var u = e.unsuspend;
                    e.unsuspend = null,
                    u()
                }
            }, (e.imgBytes > Po ? 50 : 800) + t);
            return e.unsuspend = n,
            function() {
                e.unsuspend = null,
                clearTimeout(a),
                clearTimeout(s)
            }
        }
        : null
    }
    function fs() {
        if (this.count--,
        this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
            if (this.stylesheets)
                hs(this, this.stylesheets);
            else if (this.unsuspend) {
                var e = this.unsuspend;
                this.unsuspend = null,
                e()
            }
        }
    }
    var ds = null;
    function hs(e, t) {
        e.stylesheets = null,
        e.unsuspend !== null && (e.count++,
        ds = new Map,
        t.forEach(Ry, e),
        ds = null,
        fs.call(e))
    }
    function Ry(e, t) {
        if (!(t.state.loading & 4)) {
            var n = ds.get(e);
            if (n)
                var a = n.get(null);
            else {
                n = new Map,
                ds.set(e, n);
                for (var s = e.querySelectorAll("link[data-precedence],style[data-precedence]"), u = 0; u < s.length; u++) {
                    var h = s[u];
                    (h.nodeName === "LINK" || h.getAttribute("media") !== "not all") && (n.set(h.dataset.precedence, h),
                    a = h)
                }
                a && n.set(null, a)
            }
            s = t.instance,
            h = s.getAttribute("data-precedence"),
            u = n.get(h) || a,
            u === a && n.set(null, s),
            n.set(h, s),
            this.count++,
            a = fs.bind(this),
            s.addEventListener("load", a),
            s.addEventListener("error", a),
            u ? u.parentNode.insertBefore(s, u.nextSibling) : (e = e.nodeType === 9 ? e.head : e,
            e.insertBefore(s, e.firstChild)),
            t.state.loading |= 4
        }
    }
    var Hl = {
        $$typeof: G,
        Provider: null,
        Consumer: null,
        _currentValue: ne,
        _currentValue2: ne,
        _threadCount: 0
    };
    function My(e, t, n, a, s, u, h, x, C) {
        this.tag = 1,
        this.containerInfo = e,
        this.pingCache = this.current = this.pendingChildren = null,
        this.timeoutHandle = -1,
        this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null,
        this.callbackPriority = 0,
        this.expirationTimes = Ks(-1),
        this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0,
        this.entanglements = Ks(0),
        this.hiddenUpdates = Ks(null),
        this.identifierPrefix = a,
        this.onUncaughtError = s,
        this.onCaughtError = u,
        this.onRecoverableError = h,
        this.pooledCache = null,
        this.pooledCacheLanes = 0,
        this.formState = C,
        this.incompleteTransitions = new Map
    }
    function Qh(e, t, n, a, s, u, h, x, C, R, H, Y) {
        return e = new My(e,t,n,h,C,R,H,Y,x),
        t = 1,
        u === !0 && (t |= 24),
        u = pt(3, null, null, t),
        e.current = u,
        u.stateNode = e,
        t = Rr(),
        t.refCount++,
        e.pooledCache = t,
        t.refCount++,
        u.memoizedState = {
            element: a,
            isDehydrated: n,
            cache: t
        },
        zr(u),
        e
    }
    function Xh(e) {
        return e ? (e = pa,
        e) : pa
    }
    function Zh(e, t, n, a, s, u) {
        s = Xh(s),
        a.context === null ? a.context = s : a.pendingContext = s,
        a = Sn(t),
        a.payload = {
            element: n
        },
        u = u === void 0 ? null : u,
        u !== null && (a.callback = u),
        n = wn(e, a, t),
        n !== null && (ft(n, e, t),
        gl(n, e, t))
    }
    function Kh(e, t) {
        if (e = e.memoizedState,
        e !== null && e.dehydrated !== null) {
            var n = e.retryLane;
            e.retryLane = n !== 0 && n < t ? n : t
        }
    }
    function eu(e, t) {
        Kh(e, t),
        (e = e.alternate) && Kh(e, t)
    }
    function Fh(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = Qn(e, 67108864);
            t !== null && ft(t, e, 67108864),
            eu(e, 67108864)
        }
    }
    function Jh(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = St();
            t = Fs(t);
            var n = Qn(e, t);
            n !== null && ft(n, e, t),
            eu(e, t)
        }
    }
    var ms = !0;
    function Dy(e, t, n, a) {
        var s = z.T;
        z.T = null;
        var u = X.p;
        try {
            X.p = 2,
            tu(e, t, n, a)
        } finally {
            X.p = u,
            z.T = s
        }
    }
    function Ly(e, t, n, a) {
        var s = z.T;
        z.T = null;
        var u = X.p;
        try {
            X.p = 8,
            tu(e, t, n, a)
        } finally {
            X.p = u,
            z.T = s
        }
    }
    function tu(e, t, n, a) {
        if (ms) {
            var s = nu(a);
            if (s === null)
                Go(e, t, a, gs, n),
                Wh(e, a);
            else if (Uy(s, e, t, n, a))
                a.stopPropagation();
            else if (Wh(e, a),
            t & 4 && -1 < zy.indexOf(e)) {
                for (; s !== null; ) {
                    var u = ia(s);
                    if (u !== null)
                        switch (u.tag) {
                        case 3:
                            if (u = u.stateNode,
                            u.current.memoizedState.isDehydrated) {
                                var h = qn(u.pendingLanes);
                                if (h !== 0) {
                                    var x = u;
                                    for (x.pendingLanes |= 2,
                                    x.entangledLanes |= 2; h; ) {
                                        var C = 1 << 31 - mt(h);
                                        x.entanglements[1] |= C,
                                        h &= ~C
                                    }
                                    kt(u),
                                    (Ee & 6) === 0 && (Wi = dt() + 500,
                                    Rl(0))
                                }
                            }
                            break;
                        case 31:
                        case 13:
                            x = Qn(u, 2),
                            x !== null && ft(x, u, 2),
                            Pi(),
                            eu(u, 2)
                        }
                    if (u = nu(a),
                    u === null && Go(e, t, a, gs, n),
                    u === s)
                        break;
                    s = u
                }
                s !== null && a.stopPropagation()
            } else
                Go(e, t, a, null, n)
        }
    }
    function nu(e) {
        return e = ar(e),
        au(e)
    }
    var gs = null;
    function au(e) {
        if (gs = null,
        e = la(e),
        e !== null) {
            var t = f(e);
            if (t === null)
                e = null;
            else {
                var n = t.tag;
                if (n === 13) {
                    if (e = d(t),
                    e !== null)
                        return e;
                    e = null
                } else if (n === 31) {
                    if (e = m(t),
                    e !== null)
                        return e;
                    e = null
                } else if (n === 3) {
                    if (t.stateNode.current.memoizedState.isDehydrated)
                        return t.tag === 3 ? t.stateNode.containerInfo : null;
                    e = null
                } else
                    t !== e && (e = null)
            }
        }
        return gs = e,
        null
    }
    function $h(e) {
        switch (e) {
        case "beforetoggle":
        case "cancel":
        case "click":
        case "close":
        case "contextmenu":
        case "copy":
        case "cut":
        case "auxclick":
        case "dblclick":
        case "dragend":
        case "dragstart":
        case "drop":
        case "focusin":
        case "focusout":
        case "input":
        case "invalid":
        case "keydown":
        case "keypress":
        case "keyup":
        case "mousedown":
        case "mouseup":
        case "paste":
        case "pause":
        case "play":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
        case "ratechange":
        case "reset":
        case "resize":
        case "seeked":
        case "submit":
        case "toggle":
        case "touchcancel":
        case "touchend":
        case "touchstart":
        case "volumechange":
        case "change":
        case "selectionchange":
        case "textInput":
        case "compositionstart":
        case "compositionend":
        case "compositionupdate":
        case "beforeblur":
        case "afterblur":
        case "beforeinput":
        case "blur":
        case "fullscreenchange":
        case "focus":
        case "hashchange":
        case "popstate":
        case "select":
        case "selectstart":
            return 2;
        case "drag":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "mousemove":
        case "mouseout":
        case "mouseover":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "scroll":
        case "touchmove":
        case "wheel":
        case "mouseenter":
        case "mouseleave":
        case "pointerenter":
        case "pointerleave":
            return 8;
        case "message":
            switch (bp()) {
            case ac:
                return 2;
            case lc:
                return 8;
            case li:
            case Sp:
                return 32;
            case ic:
                return 268435456;
            default:
                return 32
            }
        default:
            return 32
        }
    }
    var lu = !1
      , Dn = null
      , Ln = null
      , zn = null
      , Bl = new Map
      , ql = new Map
      , Un = []
      , zy = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
    function Wh(e, t) {
        switch (e) {
        case "focusin":
        case "focusout":
            Dn = null;
            break;
        case "dragenter":
        case "dragleave":
            Ln = null;
            break;
        case "mouseover":
        case "mouseout":
            zn = null;
            break;
        case "pointerover":
        case "pointerout":
            Bl.delete(t.pointerId);
            break;
        case "gotpointercapture":
        case "lostpointercapture":
            ql.delete(t.pointerId)
        }
    }
    function kl(e, t, n, a, s, u) {
        return e === null || e.nativeEvent !== u ? (e = {
            blockedOn: t,
            domEventName: n,
            eventSystemFlags: a,
            nativeEvent: u,
            targetContainers: [s]
        },
        t !== null && (t = ia(t),
        t !== null && Fh(t)),
        e) : (e.eventSystemFlags |= a,
        t = e.targetContainers,
        s !== null && t.indexOf(s) === -1 && t.push(s),
        e)
    }
    function Uy(e, t, n, a, s) {
        switch (t) {
        case "focusin":
            return Dn = kl(Dn, e, t, n, a, s),
            !0;
        case "dragenter":
            return Ln = kl(Ln, e, t, n, a, s),
            !0;
        case "mouseover":
            return zn = kl(zn, e, t, n, a, s),
            !0;
        case "pointerover":
            var u = s.pointerId;
            return Bl.set(u, kl(Bl.get(u) || null, e, t, n, a, s)),
            !0;
        case "gotpointercapture":
            return u = s.pointerId,
            ql.set(u, kl(ql.get(u) || null, e, t, n, a, s)),
            !0
        }
        return !1
    }
    function Ih(e) {
        var t = la(e.target);
        if (t !== null) {
            var n = f(t);
            if (n !== null) {
                if (t = n.tag,
                t === 13) {
                    if (t = d(n),
                    t !== null) {
                        e.blockedOn = t,
                        fc(e.priority, function() {
                            Jh(n)
                        });
                        return
                    }
                } else if (t === 31) {
                    if (t = m(n),
                    t !== null) {
                        e.blockedOn = t,
                        fc(e.priority, function() {
                            Jh(n)
                        });
                        return
                    }
                } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
                    e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
                    return
                }
            }
        }
        e.blockedOn = null
    }
    function ps(e) {
        if (e.blockedOn !== null)
            return !1;
        for (var t = e.targetContainers; 0 < t.length; ) {
            var n = nu(e.nativeEvent);
            if (n === null) {
                n = e.nativeEvent;
                var a = new n.constructor(n.type,n);
                nr = a,
                n.target.dispatchEvent(a),
                nr = null
            } else
                return t = ia(n),
                t !== null && Fh(t),
                e.blockedOn = n,
                !1;
            t.shift()
        }
        return !0
    }
    function Ph(e, t, n) {
        ps(e) && n.delete(t)
    }
    function Hy() {
        lu = !1,
        Dn !== null && ps(Dn) && (Dn = null),
        Ln !== null && ps(Ln) && (Ln = null),
        zn !== null && ps(zn) && (zn = null),
        Bl.forEach(Ph),
        ql.forEach(Ph)
    }
    function ys(e, t) {
        e.blockedOn === t && (e.blockedOn = null,
        lu || (lu = !0,
        i.unstable_scheduleCallback(i.unstable_NormalPriority, Hy)))
    }
    var xs = null;
    function em(e) {
        xs !== e && (xs = e,
        i.unstable_scheduleCallback(i.unstable_NormalPriority, function() {
            xs === e && (xs = null);
            for (var t = 0; t < e.length; t += 3) {
                var n = e[t]
                  , a = e[t + 1]
                  , s = e[t + 2];
                if (typeof a != "function") {
                    if (au(a || n) === null)
                        continue;
                    break
                }
                var u = ia(n);
                u !== null && (e.splice(t, 3),
                t -= 3,
                to(u, {
                    pending: !0,
                    data: s,
                    method: n.method,
                    action: a
                }, a, s))
            }
        }))
    }
    function ka(e) {
        function t(C) {
            return ys(C, e)
        }
        Dn !== null && ys(Dn, e),
        Ln !== null && ys(Ln, e),
        zn !== null && ys(zn, e),
        Bl.forEach(t),
        ql.forEach(t);
        for (var n = 0; n < Un.length; n++) {
            var a = Un[n];
            a.blockedOn === e && (a.blockedOn = null)
        }
        for (; 0 < Un.length && (n = Un[0],
        n.blockedOn === null); )
            Ih(n),
            n.blockedOn === null && Un.shift();
        if (n = (e.ownerDocument || e).$$reactFormReplay,
        n != null)
            for (a = 0; a < n.length; a += 3) {
                var s = n[a]
                  , u = n[a + 1]
                  , h = s[it] || null;
                if (typeof u == "function")
                    h || em(n);
                else if (h) {
                    var x = null;
                    if (u && u.hasAttribute("formAction")) {
                        if (s = u,
                        h = u[it] || null)
                            x = h.formAction;
                        else if (au(s) !== null)
                            continue
                    } else
                        x = h.action;
                    typeof x == "function" ? n[a + 1] = x : (n.splice(a, 3),
                    a -= 3),
                    em(n)
                }
            }
    }
    function tm() {
        function e(u) {
            u.canIntercept && u.info === "react-transition" && u.intercept({
                handler: function() {
                    return new Promise(function(h) {
                        return s = h
                    }
                    )
                },
                focusReset: "manual",
                scroll: "manual"
            })
        }
        function t() {
            s !== null && (s(),
            s = null),
            a || setTimeout(n, 20)
        }
        function n() {
            if (!a && !navigation.transition) {
                var u = navigation.currentEntry;
                u && u.url != null && navigation.navigate(u.url, {
                    state: u.getState(),
                    info: "react-transition",
                    history: "replace"
                })
            }
        }
        if (typeof navigation == "object") {
            var a = !1
              , s = null;
            return navigation.addEventListener("navigate", e),
            navigation.addEventListener("navigatesuccess", t),
            navigation.addEventListener("navigateerror", t),
            setTimeout(n, 100),
            function() {
                a = !0,
                navigation.removeEventListener("navigate", e),
                navigation.removeEventListener("navigatesuccess", t),
                navigation.removeEventListener("navigateerror", t),
                s !== null && (s(),
                s = null)
            }
        }
    }
    function iu(e) {
        this._internalRoot = e
    }
    vs.prototype.render = iu.prototype.render = function(e) {
        var t = this._internalRoot;
        if (t === null)
            throw Error(o(409));
        var n = t.current
          , a = St();
        Zh(n, a, e, t, null, null)
    }
    ,
    vs.prototype.unmount = iu.prototype.unmount = function() {
        var e = this._internalRoot;
        if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            Zh(e.current, 2, null, e, null, null),
            Pi(),
            t[aa] = null
        }
    }
    ;
    function vs(e) {
        this._internalRoot = e
    }
    vs.prototype.unstable_scheduleHydration = function(e) {
        if (e) {
            var t = cc();
            e = {
                blockedOn: null,
                target: e,
                priority: t
            };
            for (var n = 0; n < Un.length && t !== 0 && t < Un[n].priority; n++)
                ;
            Un.splice(n, 0, e),
            n === 0 && Ih(e)
        }
    }
    ;
    var nm = l.version;
    if (nm !== "19.2.4")
        throw Error(o(527, nm, "19.2.4"));
    X.findDOMNode = function(e) {
        var t = e._reactInternals;
        if (t === void 0)
            throw typeof e.render == "function" ? Error(o(188)) : (e = Object.keys(e).join(","),
            Error(o(268, e)));
        return e = y(t),
        e = e !== null ? S(e) : null,
        e = e === null ? null : e.stateNode,
        e
    }
    ;
    var By = {
        bundleType: 0,
        version: "19.2.4",
        rendererPackageName: "react-dom",
        currentDispatcherRef: z,
        reconcilerVersion: "19.2.4"
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
        var bs = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!bs.isDisabled && bs.supportsFiber)
            try {
                Ja = bs.inject(By),
                ht = bs
            } catch {}
    }
    return Xl.createRoot = function(e, t) {
        if (!c(e))
            throw Error(o(299));
        var n = !1
          , a = ""
          , s = ud
          , u = cd
          , h = fd;
        return t != null && (t.unstable_strictMode === !0 && (n = !0),
        t.identifierPrefix !== void 0 && (a = t.identifierPrefix),
        t.onUncaughtError !== void 0 && (s = t.onUncaughtError),
        t.onCaughtError !== void 0 && (u = t.onCaughtError),
        t.onRecoverableError !== void 0 && (h = t.onRecoverableError)),
        t = Qh(e, 1, !1, null, null, n, a, null, s, u, h, tm),
        e[aa] = t.current,
        ko(e),
        new iu(t)
    }
    ,
    Xl.hydrateRoot = function(e, t, n) {
        if (!c(e))
            throw Error(o(299));
        var a = !1
          , s = ""
          , u = ud
          , h = cd
          , x = fd
          , C = null;
        return n != null && (n.unstable_strictMode === !0 && (a = !0),
        n.identifierPrefix !== void 0 && (s = n.identifierPrefix),
        n.onUncaughtError !== void 0 && (u = n.onUncaughtError),
        n.onCaughtError !== void 0 && (h = n.onCaughtError),
        n.onRecoverableError !== void 0 && (x = n.onRecoverableError),
        n.formState !== void 0 && (C = n.formState)),
        t = Qh(e, 1, !0, t, n ?? null, a, s, C, u, h, x, tm),
        t.context = Xh(null),
        n = t.current,
        a = St(),
        a = Fs(a),
        s = Sn(a),
        s.callback = null,
        wn(n, s, a),
        n = a,
        t.current.lanes = n,
        Wa(t, n),
        kt(t),
        e[aa] = t.current,
        ko(e),
        new vs(t)
    }
    ,
    Xl.version = "19.2.4",
    Xl
}
var rg;
function Fv() {
    if (rg)
        return Cu.exports;
    rg = 1;
    function i() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
            try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i)
            } catch (l) {
                console.error(l)
            }
    }
    return i(),
    Cu.exports = Kv(),
    Cu.exports
}
var Jv = Fv();
var og = "popstate";
function ug(i) {
    return typeof i == "object" && i != null && "pathname"in i && "search"in i && "hash"in i && "state"in i && "key"in i
}
function $v(i={}) {
    function l(o, c) {
        let f = c.state?.masked
          , {pathname: d, search: m, hash: p} = f || o.location;
        return Uu("", {
            pathname: d,
            search: m,
            hash: p
        }, c.state && c.state.usr || null, c.state && c.state.key || "default", f ? {
            pathname: o.location.pathname,
            search: o.location.search,
            hash: o.location.hash
        } : void 0)
    }
    function r(o, c) {
        return typeof c == "string" ? c : Pl(c)
    }
    return Iv(l, r, null, i)
}
function Ze(i, l) {
    if (i === !1 || i === null || typeof i > "u")
        throw new Error(l)
}
function Qt(i, l) {
    if (!i) {
        typeof console < "u" && console.warn(l);
        try {
            throw new Error(l)
        } catch {}
    }
}
function Wv() {
    return Math.random().toString(36).substring(2, 10)
}
function cg(i, l) {
    return {
        usr: i.state,
        key: i.key,
        idx: l,
        masked: i.unstable_mask ? {
            pathname: i.pathname,
            search: i.search,
            hash: i.hash
        } : void 0
    }
}
function Uu(i, l, r=null, o, c) {
    return {
        pathname: typeof i == "string" ? i : i.pathname,
        search: "",
        hash: "",
        ...typeof l == "string" ? ei(l) : l,
        state: r,
        key: l && l.key || o || Wv(),
        unstable_mask: c
    }
}
function Pl({pathname: i="/", search: l="", hash: r=""}) {
    return l && l !== "?" && (i += l.charAt(0) === "?" ? l : "?" + l),
    r && r !== "#" && (i += r.charAt(0) === "#" ? r : "#" + r),
    i
}
function ei(i) {
    let l = {};
    if (i) {
        let r = i.indexOf("#");
        r >= 0 && (l.hash = i.substring(r),
        i = i.substring(0, r));
        let o = i.indexOf("?");
        o >= 0 && (l.search = i.substring(o),
        i = i.substring(0, o)),
        i && (l.pathname = i)
    }
    return l
}
function Iv(i, l, r, o={}) {
    let {window: c=document.defaultView, v5Compat: f=!1} = o
      , d = c.history
      , m = "POP"
      , p = null
      , y = S();
    y == null && (y = 0,
    d.replaceState({
        ...d.state,
        idx: y
    }, ""));
    function S() {
        return (d.state || {
            idx: null
        }).idx
    }
    function v() {
        m = "POP";
        let N = S()
          , D = N == null ? null : N - y;
        y = N,
        p && p({
            action: m,
            location: A.location,
            delta: D
        })
    }
    function w(N, D) {
        m = "PUSH";
        let k = ug(N) ? N : Uu(A.location, N, D);
        y = S() + 1;
        let G = cg(k, y)
          , $ = A.createHref(k.unstable_mask || k);
        try {
            d.pushState(G, "", $)
        } catch (W) {
            if (W instanceof DOMException && W.name === "DataCloneError")
                throw W;
            c.location.assign($)
        }
        f && p && p({
            action: m,
            location: A.location,
            delta: 1
        })
    }
    function b(N, D) {
        m = "REPLACE";
        let k = ug(N) ? N : Uu(A.location, N, D);
        y = S();
        let G = cg(k, y)
          , $ = A.createHref(k.unstable_mask || k);
        d.replaceState(G, "", $),
        f && p && p({
            action: m,
            location: A.location,
            delta: 0
        })
    }
    function E(N) {
        return Pv(N)
    }
    let A = {
        get action() {
            return m
        },
        get location() {
            return i(c, d)
        },
        listen(N) {
            if (p)
                throw new Error("A history only accepts one active listener");
            return c.addEventListener(og, v),
            p = N,
            () => {
                c.removeEventListener(og, v),
                p = null
            }
        },
        createHref(N) {
            return l(c, N)
        },
        createURL: E,
        encodeLocation(N) {
            let D = E(N);
            return {
                pathname: D.pathname,
                search: D.search,
                hash: D.hash
            }
        },
        push: w,
        replace: b,
        go(N) {
            return d.go(N)
        }
    };
    return A
}
function Pv(i, l=!1) {
    let r = "http://localhost";
    typeof window < "u" && (r = window.location.origin !== "null" ? window.location.origin : window.location.href),
    Ze(r, "No window.location.(origin|href) available to create URL");
    let o = typeof i == "string" ? i : Pl(i);
    return o = o.replace(/ $/, "%20"),
    !l && o.startsWith("//") && (o = r + o),
    new URL(o,r)
}
function Jg(i, l, r="/") {
    return eb(i, l, r, !1)
}
function eb(i, l, r, o) {
    let c = typeof l == "string" ? ei(l) : l
      , f = fn(c.pathname || "/", r);
    if (f == null)
        return null;
    let d = $g(i);
    tb(d);
    let m = null;
    for (let p = 0; m == null && p < d.length; ++p) {
        let y = db(f);
        m = cb(d[p], y, o)
    }
    return m
}
function $g(i, l=[], r=[], o="", c=!1) {
    let f = (d, m, p=c, y) => {
        let S = {
            relativePath: y === void 0 ? d.path || "" : y,
            caseSensitive: d.caseSensitive === !0,
            childrenIndex: m,
            route: d
        };
        if (S.relativePath.startsWith("/")) {
            if (!S.relativePath.startsWith(o) && p)
                return;
            Ze(S.relativePath.startsWith(o), `Absolute route path "${S.relativePath}" nested under path "${o}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`),
            S.relativePath = S.relativePath.slice(o.length)
        }
        let v = Vt([o, S.relativePath])
          , w = r.concat(S);
        d.children && d.children.length > 0 && (Ze(d.index !== !0, `Index routes must not have child routes. Please remove all child routes from route path "${v}".`),
        $g(d.children, l, w, v, p)),
        !(d.path == null && !d.index) && l.push({
            path: v,
            score: ob(v, d.index),
            routesMeta: w
        })
    }
    ;
    return i.forEach( (d, m) => {
        if (d.path === "" || !d.path?.includes("?"))
            f(d, m);
        else
            for (let p of Wg(d.path))
                f(d, m, !0, p)
    }
    ),
    l
}
function Wg(i) {
    let l = i.split("/");
    if (l.length === 0)
        return [];
    let[r,...o] = l
      , c = r.endsWith("?")
      , f = r.replace(/\?$/, "");
    if (o.length === 0)
        return c ? [f, ""] : [f];
    let d = Wg(o.join("/"))
      , m = [];
    return m.push(...d.map(p => p === "" ? f : [f, p].join("/"))),
    c && m.push(...d),
    m.map(p => i.startsWith("/") && p === "" ? "/" : p)
}
function tb(i) {
    i.sort( (l, r) => l.score !== r.score ? r.score - l.score : ub(l.routesMeta.map(o => o.childrenIndex), r.routesMeta.map(o => o.childrenIndex)))
}
var nb = /^:[\w-]+$/
  , ab = 3
  , lb = 2
  , ib = 1
  , sb = 10
  , rb = -2
  , fg = i => i === "*";
function ob(i, l) {
    let r = i.split("/")
      , o = r.length;
    return r.some(fg) && (o += rb),
    l && (o += lb),
    r.filter(c => !fg(c)).reduce( (c, f) => c + (nb.test(f) ? ab : f === "" ? ib : sb), o)
}
function ub(i, l) {
    return i.length === l.length && i.slice(0, -1).every( (o, c) => o === l[c]) ? i[i.length - 1] - l[l.length - 1] : 0
}
function cb(i, l, r=!1) {
    let {routesMeta: o} = i
      , c = {}
      , f = "/"
      , d = [];
    for (let m = 0; m < o.length; ++m) {
        let p = o[m]
          , y = m === o.length - 1
          , S = f === "/" ? l : l.slice(f.length) || "/"
          , v = zs({
            path: p.relativePath,
            caseSensitive: p.caseSensitive,
            end: y
        }, S)
          , w = p.route;
        if (!v && y && r && !o[o.length - 1].route.index && (v = zs({
            path: p.relativePath,
            caseSensitive: p.caseSensitive,
            end: !1
        }, S)),
        !v)
            return null;
        Object.assign(c, v.params),
        d.push({
            params: c,
            pathname: Vt([f, v.pathname]),
            pathnameBase: pb(Vt([f, v.pathnameBase])),
            route: w
        }),
        v.pathnameBase !== "/" && (f = Vt([f, v.pathnameBase]))
    }
    return d
}
function zs(i, l) {
    typeof i == "string" && (i = {
        path: i,
        caseSensitive: !1,
        end: !0
    });
    let[r,o] = fb(i.path, i.caseSensitive, i.end)
      , c = l.match(r);
    if (!c)
        return null;
    let f = c[0]
      , d = f.replace(/(.)\/+$/, "$1")
      , m = c.slice(1);
    return {
        params: o.reduce( (y, {paramName: S, isOptional: v}, w) => {
            if (S === "*") {
                let E = m[w] || "";
                d = f.slice(0, f.length - E.length).replace(/(.)\/+$/, "$1")
            }
            const b = m[w];
            return v && !b ? y[S] = void 0 : y[S] = (b || "").replace(/%2F/g, "/"),
            y
        }
        , {}),
        pathname: f,
        pathnameBase: d,
        pattern: i
    }
}
function fb(i, l=!1, r=!0) {
    Qt(i === "*" || !i.endsWith("*") || i.endsWith("/*"), `Route path "${i}" will be treated as if it were "${i.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${i.replace(/\*$/, "/*")}".`);
    let o = []
      , c = "^" + i.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (d, m, p, y, S) => {
        if (o.push({
            paramName: m,
            isOptional: p != null
        }),
        p) {
            let v = S.charAt(y + d.length);
            return v && v !== "/" ? "/([^\\/]*)" : "(?:/([^\\/]*))?"
        }
        return "/([^\\/]+)"
    }
    ).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
    return i.endsWith("*") ? (o.push({
        paramName: "*"
    }),
    c += i === "*" || i === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$") : r ? c += "\\/*$" : i !== "" && i !== "/" && (c += "(?:(?=\\/|$))"),
    [new RegExp(c,l ? void 0 : "i"), o]
}
function db(i) {
    try {
        return i.split("/").map(l => decodeURIComponent(l).replace(/\//g, "%2F")).join("/")
    } catch (l) {
        return Qt(!1, `The URL path "${i}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${l}).`),
        i
    }
}
function fn(i, l) {
    if (l === "/")
        return i;
    if (!i.toLowerCase().startsWith(l.toLowerCase()))
        return null;
    let r = l.endsWith("/") ? l.length - 1 : l.length
      , o = i.charAt(r);
    return o && o !== "/" ? null : i.slice(r) || "/"
}
var hb = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
function mb(i, l="/") {
    let {pathname: r, search: o="", hash: c=""} = typeof i == "string" ? ei(i) : i, f;
    return r ? (r = r.replace(/\/\/+/g, "/"),
    r.startsWith("/") ? f = dg(r.substring(1), "/") : f = dg(r, l)) : f = l,
    {
        pathname: f,
        search: yb(o),
        hash: xb(c)
    }
}
function dg(i, l) {
    let r = l.replace(/\/+$/, "").split("/");
    return i.split("/").forEach(c => {
        c === ".." ? r.length > 1 && r.pop() : c !== "." && r.push(c)
    }
    ),
    r.length > 1 ? r.join("/") : "/"
}
function Tu(i, l, r, o) {
    return `Cannot include a '${i}' character in a manually specified \`to.${l}\` field [${JSON.stringify(o)}].  Please separate it out to the \`to.${r}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`
}
function gb(i) {
    return i.filter( (l, r) => r === 0 || l.route.path && l.route.path.length > 0)
}
function Ig(i) {
    let l = gb(i);
    return l.map( (r, o) => o === l.length - 1 ? r.pathname : r.pathnameBase)
}
function Ku(i, l, r, o=!1) {
    let c;
    typeof i == "string" ? c = ei(i) : (c = {
        ...i
    },
    Ze(!c.pathname || !c.pathname.includes("?"), Tu("?", "pathname", "search", c)),
    Ze(!c.pathname || !c.pathname.includes("#"), Tu("#", "pathname", "hash", c)),
    Ze(!c.search || !c.search.includes("#"), Tu("#", "search", "hash", c)));
    let f = i === "" || c.pathname === "", d = f ? "/" : c.pathname, m;
    if (d == null)
        m = r;
    else {
        let v = l.length - 1;
        if (!o && d.startsWith("..")) {
            let w = d.split("/");
            for (; w[0] === ".."; )
                w.shift(),
                v -= 1;
            c.pathname = w.join("/")
        }
        m = v >= 0 ? l[v] : "/"
    }
    let p = mb(c, m)
      , y = d && d !== "/" && d.endsWith("/")
      , S = (f || d === ".") && r.endsWith("/");
    return !p.pathname.endsWith("/") && (y || S) && (p.pathname += "/"),
    p
}
var Vt = i => i.join("/").replace(/\/\/+/g, "/")
  , pb = i => i.replace(/\/+$/, "").replace(/^\/*/, "/")
  , yb = i => !i || i === "?" ? "" : i.startsWith("?") ? i : "?" + i
  , xb = i => !i || i === "#" ? "" : i.startsWith("#") ? i : "#" + i
  , vb = class {
    constructor(i, l, r, o=!1) {
        this.status = i,
        this.statusText = l || "",
        this.internal = o,
        r instanceof Error ? (this.data = r.toString(),
        this.error = r) : this.data = r
    }
}
;
function bb(i) {
    return i != null && typeof i.status == "number" && typeof i.statusText == "string" && typeof i.internal == "boolean" && "data"in i
}
function Sb(i) {
    return i.map(l => l.route.path).filter(Boolean).join("/").replace(/\/\/*/g, "/") || "/"
}
var Pg = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u";
function ep(i, l) {
    let r = i;
    if (typeof r != "string" || !hb.test(r))
        return {
            absoluteURL: void 0,
            isExternal: !1,
            to: r
        };
    let o = r
      , c = !1;
    if (Pg)
        try {
            let f = new URL(window.location.href)
              , d = r.startsWith("//") ? new URL(f.protocol + r) : new URL(r)
              , m = fn(d.pathname, l);
            d.origin === f.origin && m != null ? r = m + d.search + d.hash : c = !0
        } catch {
            Qt(!1, `<Link to="${r}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)
        }
    return {
        absoluteURL: o,
        isExternal: c,
        to: r
    }
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var tp = ["POST", "PUT", "PATCH", "DELETE"];
new Set(tp);
var wb = ["GET", ...tp];
new Set(wb);
var Ka = U.createContext(null);
Ka.displayName = "DataRouter";
var Bs = U.createContext(null);
Bs.displayName = "DataRouterState";
var Eb = U.createContext(!1)
  , np = U.createContext({
    isTransitioning: !1
});
np.displayName = "ViewTransition";
var Nb = U.createContext(new Map);
Nb.displayName = "Fetchers";
var Cb = U.createContext(null);
Cb.displayName = "Await";
var Mt = U.createContext(null);
Mt.displayName = "Navigation";
var qs = U.createContext(null);
qs.displayName = "Location";
var dn = U.createContext({
    outlet: null,
    matches: [],
    isDataRoute: !1
});
dn.displayName = "Route";
var Fu = U.createContext(null);
Fu.displayName = "RouteError";
var ap = "REACT_ROUTER_ERROR"
  , _b = "REDIRECT"
  , jb = "ROUTE_ERROR_RESPONSE";
function Ab(i) {
    if (i.startsWith(`${ap}:${_b}:{`))
        try {
            let l = JSON.parse(i.slice(28));
            if (typeof l == "object" && l && typeof l.status == "number" && typeof l.statusText == "string" && typeof l.location == "string" && typeof l.reloadDocument == "boolean" && typeof l.replace == "boolean")
                return l
        } catch {}
}
function Tb(i) {
    if (i.startsWith(`${ap}:${jb}:{`))
        try {
            let l = JSON.parse(i.slice(40));
            if (typeof l == "object" && l && typeof l.status == "number" && typeof l.statusText == "string")
                return new vb(l.status,l.statusText,l.data)
        } catch {}
}
function Ob(i, {relative: l}={}) {
    Ze(ti(), "useHref() may be used only in the context of a <Router> component.");
    let {basename: r, navigator: o} = U.useContext(Mt)
      , {hash: c, pathname: f, search: d} = ni(i, {
        relative: l
    })
      , m = f;
    return r !== "/" && (m = f === "/" ? r : Vt([r, f])),
    o.createHref({
        pathname: m,
        search: d,
        hash: c
    })
}
function ti() {
    return U.useContext(qs) != null
}
function Xt() {
    return Ze(ti(), "useLocation() may be used only in the context of a <Router> component."),
    U.useContext(qs).location
}
var lp = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
function ip(i) {
    U.useContext(Mt).static || U.useLayoutEffect(i)
}
function sp() {
    let {isDataRoute: i} = U.useContext(dn);
    return i ? Vb() : Rb()
}
function Rb() {
    Ze(ti(), "useNavigate() may be used only in the context of a <Router> component.");
    let i = U.useContext(Ka)
      , {basename: l, navigator: r} = U.useContext(Mt)
      , {matches: o} = U.useContext(dn)
      , {pathname: c} = Xt()
      , f = JSON.stringify(Ig(o))
      , d = U.useRef(!1);
    return ip( () => {
        d.current = !0
    }
    ),
    U.useCallback( (p, y={}) => {
        if (Qt(d.current, lp),
        !d.current)
            return;
        if (typeof p == "number") {
            r.go(p);
            return
        }
        let S = Ku(p, JSON.parse(f), c, y.relative === "path");
        i == null && l !== "/" && (S.pathname = S.pathname === "/" ? l : Vt([l, S.pathname])),
        (y.replace ? r.replace : r.push)(S, y.state, y)
    }
    , [l, r, f, c, i])
}
U.createContext(null);
function ni(i, {relative: l}={}) {
    let {matches: r} = U.useContext(dn)
      , {pathname: o} = Xt()
      , c = JSON.stringify(Ig(r));
    return U.useMemo( () => Ku(i, JSON.parse(c), o, l === "path"), [i, c, o, l])
}
function Mb(i, l) {
    return rp(i)
}
function rp(i, l, r) {
    Ze(ti(), "useRoutes() may be used only in the context of a <Router> component.");
    let {navigator: o} = U.useContext(Mt)
      , {matches: c} = U.useContext(dn)
      , f = c[c.length - 1]
      , d = f ? f.params : {}
      , m = f ? f.pathname : "/"
      , p = f ? f.pathnameBase : "/"
      , y = f && f.route;
    {
        let N = y && y.path || "";
        up(m, !y || N.endsWith("*") || N.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${m}" (under <Route path="${N}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${N}"> to <Route path="${N === "/" ? "*" : `${N}/*`}">.`)
    }
    let S = Xt(), v;
    v = S;
    let w = v.pathname || "/"
      , b = w;
    if (p !== "/") {
        let N = p.replace(/^\//, "").split("/");
        b = "/" + w.replace(/^\//, "").split("/").slice(N.length).join("/")
    }
    let E = Jg(i, {
        pathname: b
    });
    return Qt(y || E != null, `No routes matched location "${v.pathname}${v.search}${v.hash}" `),
    Qt(E == null || E[E.length - 1].route.element !== void 0 || E[E.length - 1].route.Component !== void 0 || E[E.length - 1].route.lazy !== void 0, `Matched leaf route at location "${v.pathname}${v.search}${v.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`),
    Hb(E && E.map(N => Object.assign({}, N, {
        params: Object.assign({}, d, N.params),
        pathname: Vt([p, o.encodeLocation ? o.encodeLocation(N.pathname.replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : N.pathname]),
        pathnameBase: N.pathnameBase === "/" ? p : Vt([p, o.encodeLocation ? o.encodeLocation(N.pathnameBase.replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : N.pathnameBase])
    })), c, r)
}
function Db() {
    let i = Yb()
      , l = bb(i) ? `${i.status} ${i.statusText}` : i instanceof Error ? i.message : JSON.stringify(i)
      , r = i instanceof Error ? i.stack : null
      , o = "rgba(200,200,200, 0.5)"
      , c = {
        padding: "0.5rem",
        backgroundColor: o
    }
      , f = {
        padding: "2px 4px",
        backgroundColor: o
    }
      , d = null;
    return console.error("Error handled by React Router default ErrorBoundary:", i),
    d = U.createElement(U.Fragment, null, U.createElement("p", null, "💿 Hey developer 👋"), U.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", U.createElement("code", {
        style: f
    }, "ErrorBoundary"), " or", " ", U.createElement("code", {
        style: f
    }, "errorElement"), " prop on your route.")),
    U.createElement(U.Fragment, null, U.createElement("h2", null, "Unexpected Application Error!"), U.createElement("h3", {
        style: {
            fontStyle: "italic"
        }
    }, l), r ? U.createElement("pre", {
        style: c
    }, r) : null, d)
}
var Lb = U.createElement(Db, null)
  , op = class extends U.Component {
    constructor(i) {
        super(i),
        this.state = {
            location: i.location,
            revalidation: i.revalidation,
            error: i.error
        }
    }
    static getDerivedStateFromError(i) {
        return {
            error: i
        }
    }
    static getDerivedStateFromProps(i, l) {
        return l.location !== i.location || l.revalidation !== "idle" && i.revalidation === "idle" ? {
            error: i.error,
            location: i.location,
            revalidation: i.revalidation
        } : {
            error: i.error !== void 0 ? i.error : l.error,
            location: l.location,
            revalidation: i.revalidation || l.revalidation
        }
    }
    componentDidCatch(i, l) {
        this.props.onError ? this.props.onError(i, l) : console.error("React Router caught the following error during render", i)
    }
    render() {
        let i = this.state.error;
        if (this.context && typeof i == "object" && i && "digest"in i && typeof i.digest == "string") {
            const r = Tb(i.digest);
            r && (i = r)
        }
        let l = i !== void 0 ? U.createElement(dn.Provider, {
            value: this.props.routeContext
        }, U.createElement(Fu.Provider, {
            value: i,
            children: this.props.component
        })) : this.props.children;
        return this.context ? U.createElement(zb, {
            error: i
        }, l) : l
    }
}
;
op.contextType = Eb;
var Ou = new WeakMap;
function zb({children: i, error: l}) {
    let {basename: r} = U.useContext(Mt);
    if (typeof l == "object" && l && "digest"in l && typeof l.digest == "string") {
        let o = Ab(l.digest);
        if (o) {
            let c = Ou.get(l);
            if (c)
                throw c;
            let f = ep(o.location, r);
            if (Pg && !Ou.get(l))
                if (f.isExternal || o.reloadDocument)
                    window.location.href = f.absoluteURL || f.to;
                else {
                    const d = Promise.resolve().then( () => window.__reactRouterDataRouter.navigate(f.to, {
                        replace: o.replace
                    }));
                    throw Ou.set(l, d),
                    d
                }
            return U.createElement("meta", {
                httpEquiv: "refresh",
                content: `0;url=${f.absoluteURL || f.to}`
            })
        }
    }
    return i
}
function Ub({routeContext: i, match: l, children: r}) {
    let o = U.useContext(Ka);
    return o && o.static && o.staticContext && (l.route.errorElement || l.route.ErrorBoundary) && (o.staticContext._deepestRenderedBoundaryId = l.route.id),
    U.createElement(dn.Provider, {
        value: i
    }, r)
}
function Hb(i, l=[], r) {
    let o = r?.state;
    if (i == null) {
        if (!o)
            return null;
        if (o.errors)
            i = o.matches;
        else if (l.length === 0 && !o.initialized && o.matches.length > 0)
            i = o.matches;
        else
            return null
    }
    let c = i
      , f = o?.errors;
    if (f != null) {
        let S = c.findIndex(v => v.route.id && f?.[v.route.id] !== void 0);
        Ze(S >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(f).join(",")}`),
        c = c.slice(0, Math.min(c.length, S + 1))
    }
    let d = !1
      , m = -1;
    if (r && o) {
        d = o.renderFallback;
        for (let S = 0; S < c.length; S++) {
            let v = c[S];
            if ((v.route.HydrateFallback || v.route.hydrateFallbackElement) && (m = S),
            v.route.id) {
                let {loaderData: w, errors: b} = o
                  , E = v.route.loader && !w.hasOwnProperty(v.route.id) && (!b || b[v.route.id] === void 0);
                if (v.route.lazy || E) {
                    r.isStatic && (d = !0),
                    m >= 0 ? c = c.slice(0, m + 1) : c = [c[0]];
                    break
                }
            }
        }
    }
    let p = r?.onError
      , y = o && p ? (S, v) => {
        p(S, {
            location: o.location,
            params: o.matches?.[0]?.params ?? {},
            unstable_pattern: Sb(o.matches),
            errorInfo: v
        })
    }
    : void 0;
    return c.reduceRight( (S, v, w) => {
        let b, E = !1, A = null, N = null;
        o && (b = f && v.route.id ? f[v.route.id] : void 0,
        A = v.route.errorElement || Lb,
        d && (m < 0 && w === 0 ? (up("route-fallback", !1, "No `HydrateFallback` element provided to render during initial hydration"),
        E = !0,
        N = null) : m === w && (E = !0,
        N = v.route.hydrateFallbackElement || null)));
        let D = l.concat(c.slice(0, w + 1))
          , k = () => {
            let G;
            return b ? G = A : E ? G = N : v.route.Component ? G = U.createElement(v.route.Component, null) : v.route.element ? G = v.route.element : G = S,
            U.createElement(Ub, {
                match: v,
                routeContext: {
                    outlet: S,
                    matches: D,
                    isDataRoute: o != null
                },
                children: G
            })
        }
        ;
        return o && (v.route.ErrorBoundary || v.route.errorElement || w === 0) ? U.createElement(op, {
            location: o.location,
            revalidation: o.revalidation,
            component: A,
            error: b,
            children: k(),
            routeContext: {
                outlet: null,
                matches: D,
                isDataRoute: !0
            },
            onError: y
        }) : k()
    }
    , null)
}
function Ju(i) {
    return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}
function Bb(i) {
    let l = U.useContext(Ka);
    return Ze(l, Ju(i)),
    l
}
function qb(i) {
    let l = U.useContext(Bs);
    return Ze(l, Ju(i)),
    l
}
function kb(i) {
    let l = U.useContext(dn);
    return Ze(l, Ju(i)),
    l
}
function $u(i) {
    let l = kb(i)
      , r = l.matches[l.matches.length - 1];
    return Ze(r.route.id, `${i} can only be used on routes that contain a unique "id"`),
    r.route.id
}
function Gb() {
    return $u("useRouteId")
}
function Yb() {
    let i = U.useContext(Fu)
      , l = qb("useRouteError")
      , r = $u("useRouteError");
    return i !== void 0 ? i : l.errors?.[r]
}
function Vb() {
    let {router: i} = Bb("useNavigate")
      , l = $u("useNavigate")
      , r = U.useRef(!1);
    return ip( () => {
        r.current = !0
    }
    ),
    U.useCallback(async (c, f={}) => {
        Qt(r.current, lp),
        r.current && (typeof c == "number" ? await i.navigate(c) : await i.navigate(c, {
            fromRouteId: l,
            ...f
        }))
    }
    , [i, l])
}
var hg = {};
function up(i, l, r) {
    !l && !hg[i] && (hg[i] = !0,
    Qt(!1, r))
}
U.memo(Qb);
function Qb({routes: i, future: l, state: r, isStatic: o, onError: c}) {
    return rp(i, void 0, {
        state: r,
        isStatic: o,
        onError: c
    })
}
function Xb({basename: i="/", children: l=null, location: r, navigationType: o="POP", navigator: c, static: f=!1, unstable_useTransitions: d}) {
    Ze(!ti(), "You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");
    let m = i.replace(/^\/*/, "/")
      , p = U.useMemo( () => ({
        basename: m,
        navigator: c,
        static: f,
        unstable_useTransitions: d,
        future: {}
    }), [m, c, f, d]);
    typeof r == "string" && (r = ei(r));
    let {pathname: y="/", search: S="", hash: v="", state: w=null, key: b="default", unstable_mask: E} = r
      , A = U.useMemo( () => {
        let N = fn(y, m);
        return N == null ? null : {
            location: {
                pathname: N,
                search: S,
                hash: v,
                state: w,
                key: b,
                unstable_mask: E
            },
            navigationType: o
        }
    }
    , [m, y, S, v, w, b, o, E]);
    return Qt(A != null, `<Router basename="${m}"> is not able to match the URL "${y}${S}${v}" because it does not start with the basename, so the <Router> won't render anything.`),
    A == null ? null : U.createElement(Mt.Provider, {
        value: p
    }, U.createElement(qs.Provider, {
        children: l,
        value: A
    }))
}
var Ts = "get"
  , Os = "application/x-www-form-urlencoded";
function ks(i) {
    return typeof HTMLElement < "u" && i instanceof HTMLElement
}
function Zb(i) {
    return ks(i) && i.tagName.toLowerCase() === "button"
}
function Kb(i) {
    return ks(i) && i.tagName.toLowerCase() === "form"
}
function Fb(i) {
    return ks(i) && i.tagName.toLowerCase() === "input"
}
function Jb(i) {
    return !!(i.metaKey || i.altKey || i.ctrlKey || i.shiftKey)
}
function $b(i, l) {
    return i.button === 0 && (!l || l === "_self") && !Jb(i)
}
var js = null;
function Wb() {
    if (js === null)
        try {
            new FormData(document.createElement("form"),0),
            js = !1
        } catch {
            js = !0
        }
    return js
}
var Ib = new Set(["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]);
function Ru(i) {
    return i != null && !Ib.has(i) ? (Qt(!1, `"${i}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${Os}"`),
    null) : i
}
function Pb(i, l) {
    let r, o, c, f, d;
    if (Kb(i)) {
        let m = i.getAttribute("action");
        o = m ? fn(m, l) : null,
        r = i.getAttribute("method") || Ts,
        c = Ru(i.getAttribute("enctype")) || Os,
        f = new FormData(i)
    } else if (Zb(i) || Fb(i) && (i.type === "submit" || i.type === "image")) {
        let m = i.form;
        if (m == null)
            throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');
        let p = i.getAttribute("formaction") || m.getAttribute("action");
        if (o = p ? fn(p, l) : null,
        r = i.getAttribute("formmethod") || m.getAttribute("method") || Ts,
        c = Ru(i.getAttribute("formenctype")) || Ru(m.getAttribute("enctype")) || Os,
        f = new FormData(m,i),
        !Wb()) {
            let {name: y, type: S, value: v} = i;
            if (S === "image") {
                let w = y ? `${y}.` : "";
                f.append(`${w}x`, "0"),
                f.append(`${w}y`, "0")
            } else
                y && f.append(y, v)
        }
    } else {
        if (ks(i))
            throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');
        r = Ts,
        o = null,
        c = Os,
        d = i
    }
    return f && c === "text/plain" && (d = f,
    f = void 0),
    {
        action: o,
        method: r.toLowerCase(),
        encType: c,
        formData: f,
        body: d
    }
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function Wu(i, l) {
    if (i === !1 || i === null || typeof i > "u")
        throw new Error(l)
}
function e1(i, l, r, o) {
    let c = typeof i == "string" ? new URL(i,typeof window > "u" ? "server://singlefetch/" : window.location.origin) : i;
    return r ? c.pathname.endsWith("/") ? c.pathname = `${c.pathname}_.${o}` : c.pathname = `${c.pathname}.${o}` : c.pathname === "/" ? c.pathname = `_root.${o}` : l && fn(c.pathname, l) === "/" ? c.pathname = `${l.replace(/\/$/, "")}/_root.${o}` : c.pathname = `${c.pathname.replace(/\/$/, "")}.${o}`,
    c
}
async function t1(i, l) {
    if (i.id in l)
        return l[i.id];
    try {
        let r = await import(i.module);
        return l[i.id] = r,
        r
    } catch (r) {
        return console.error(`Error loading route module \`${i.module}\`, reloading page...`),
        console.error(r),
        window.__reactRouterContext && window.__reactRouterContext.isSpaMode,
        window.location.reload(),
        new Promise( () => {}
        )
    }
}
function n1(i) {
    return i == null ? !1 : i.href == null ? i.rel === "preload" && typeof i.imageSrcSet == "string" && typeof i.imageSizes == "string" : typeof i.rel == "string" && typeof i.href == "string"
}
async function a1(i, l, r) {
    let o = await Promise.all(i.map(async c => {
        let f = l.routes[c.route.id];
        if (f) {
            let d = await t1(f, r);
            return d.links ? d.links() : []
        }
        return []
    }
    ));
    return r1(o.flat(1).filter(n1).filter(c => c.rel === "stylesheet" || c.rel === "preload").map(c => c.rel === "stylesheet" ? {
        ...c,
        rel: "prefetch",
        as: "style"
    } : {
        ...c,
        rel: "prefetch"
    }))
}
function mg(i, l, r, o, c, f) {
    let d = (p, y) => r[y] ? p.route.id !== r[y].route.id : !0
      , m = (p, y) => r[y].pathname !== p.pathname || r[y].route.path?.endsWith("*") && r[y].params["*"] !== p.params["*"];
    return f === "assets" ? l.filter( (p, y) => d(p, y) || m(p, y)) : f === "data" ? l.filter( (p, y) => {
        let S = o.routes[p.route.id];
        if (!S || !S.hasLoader)
            return !1;
        if (d(p, y) || m(p, y))
            return !0;
        if (p.route.shouldRevalidate) {
            let v = p.route.shouldRevalidate({
                currentUrl: new URL(c.pathname + c.search + c.hash,window.origin),
                currentParams: r[0]?.params || {},
                nextUrl: new URL(i,window.origin),
                nextParams: p.params,
                defaultShouldRevalidate: !0
            });
            if (typeof v == "boolean")
                return v
        }
        return !0
    }
    ) : []
}
function l1(i, l, {includeHydrateFallback: r}={}) {
    return i1(i.map(o => {
        let c = l.routes[o.route.id];
        if (!c)
            return [];
        let f = [c.module];
        return c.clientActionModule && (f = f.concat(c.clientActionModule)),
        c.clientLoaderModule && (f = f.concat(c.clientLoaderModule)),
        r && c.hydrateFallbackModule && (f = f.concat(c.hydrateFallbackModule)),
        c.imports && (f = f.concat(c.imports)),
        f
    }
    ).flat(1))
}
function i1(i) {
    return [...new Set(i)]
}
function s1(i) {
    let l = {}
      , r = Object.keys(i).sort();
    for (let o of r)
        l[o] = i[o];
    return l
}
function r1(i, l) {
    let r = new Set;
    return new Set(l),
    i.reduce( (o, c) => {
        let f = JSON.stringify(s1(c));
        return r.has(f) || (r.add(f),
        o.push({
            key: f,
            link: c
        })),
        o
    }
    , [])
}
function cp() {
    let i = U.useContext(Ka);
    return Wu(i, "You must render this element inside a <DataRouterContext.Provider> element"),
    i
}
function o1() {
    let i = U.useContext(Bs);
    return Wu(i, "You must render this element inside a <DataRouterStateContext.Provider> element"),
    i
}
var Iu = U.createContext(void 0);
Iu.displayName = "FrameworkContext";
function fp() {
    let i = U.useContext(Iu);
    return Wu(i, "You must render this element inside a <HydratedRouter> element"),
    i
}
function u1(i, l) {
    let r = U.useContext(Iu)
      , [o,c] = U.useState(!1)
      , [f,d] = U.useState(!1)
      , {onFocus: m, onBlur: p, onMouseEnter: y, onMouseLeave: S, onTouchStart: v} = l
      , w = U.useRef(null);
    U.useEffect( () => {
        if (i === "render" && d(!0),
        i === "viewport") {
            let A = D => {
                D.forEach(k => {
                    d(k.isIntersecting)
                }
                )
            }
              , N = new IntersectionObserver(A,{
                threshold: .5
            });
            return w.current && N.observe(w.current),
            () => {
                N.disconnect()
            }
        }
    }
    , [i]),
    U.useEffect( () => {
        if (o) {
            let A = setTimeout( () => {
                d(!0)
            }
            , 100);
            return () => {
                clearTimeout(A)
            }
        }
    }
    , [o]);
    let b = () => {
        c(!0)
    }
      , E = () => {
        c(!1),
        d(!1)
    }
    ;
    return r ? i !== "intent" ? [f, w, {}] : [f, w, {
        onFocus: Zl(m, b),
        onBlur: Zl(p, E),
        onMouseEnter: Zl(y, b),
        onMouseLeave: Zl(S, E),
        onTouchStart: Zl(v, b)
    }] : [!1, w, {}]
}
function Zl(i, l) {
    return r => {
        i && i(r),
        r.defaultPrevented || l(r)
    }
}
function c1({page: i, ...l}) {
    let {router: r} = cp()
      , o = U.useMemo( () => Jg(r.routes, i, r.basename), [r.routes, i, r.basename]);
    return o ? U.createElement(d1, {
        page: i,
        matches: o,
        ...l
    }) : null
}
function f1(i) {
    let {manifest: l, routeModules: r} = fp()
      , [o,c] = U.useState([]);
    return U.useEffect( () => {
        let f = !1;
        return a1(i, l, r).then(d => {
            f || c(d)
        }
        ),
        () => {
            f = !0
        }
    }
    , [i, l, r]),
    o
}
function d1({page: i, matches: l, ...r}) {
    let o = Xt()
      , {future: c, manifest: f, routeModules: d} = fp()
      , {basename: m} = cp()
      , {loaderData: p, matches: y} = o1()
      , S = U.useMemo( () => mg(i, l, y, f, o, "data"), [i, l, y, f, o])
      , v = U.useMemo( () => mg(i, l, y, f, o, "assets"), [i, l, y, f, o])
      , w = U.useMemo( () => {
        if (i === o.pathname + o.search + o.hash)
            return [];
        let A = new Set
          , N = !1;
        if (l.forEach(k => {
            let G = f.routes[k.route.id];
            !G || !G.hasLoader || (!S.some($ => $.route.id === k.route.id) && k.route.id in p && d[k.route.id]?.shouldRevalidate || G.hasClientLoader ? N = !0 : A.add(k.route.id))
        }
        ),
        A.size === 0)
            return [];
        let D = e1(i, m, c.unstable_trailingSlashAwareDataRequests, "data");
        return N && A.size > 0 && D.searchParams.set("_routes", l.filter(k => A.has(k.route.id)).map(k => k.route.id).join(",")),
        [D.pathname + D.search]
    }
    , [m, c.unstable_trailingSlashAwareDataRequests, p, o, f, S, l, i, d])
      , b = U.useMemo( () => l1(v, f), [v, f])
      , E = f1(v);
    return U.createElement(U.Fragment, null, w.map(A => U.createElement("link", {
        key: A,
        rel: "prefetch",
        as: "fetch",
        href: A,
        ...r
    })), b.map(A => U.createElement("link", {
        key: A,
        rel: "modulepreload",
        href: A,
        ...r
    })), E.map( ({key: A, link: N}) => U.createElement("link", {
        key: A,
        nonce: r.nonce,
        ...N,
        crossOrigin: N.crossOrigin ?? r.crossOrigin
    })))
}
function h1(...i) {
    return l => {
        i.forEach(r => {
            typeof r == "function" ? r(l) : r != null && (r.current = l)
        }
        )
    }
}
var m1 = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u";
try {
    m1 && (window.__reactRouterVersion = "7.13.1")
} catch {}
function g1({basename: i, children: l, unstable_useTransitions: r, window: o}) {
    let c = U.useRef();
    c.current == null && (c.current = $v({
        window: o,
        v5Compat: !0
    }));
    let f = c.current
      , [d,m] = U.useState({
        action: f.action,
        location: f.location
    })
      , p = U.useCallback(y => {
        r === !1 ? m(y) : U.startTransition( () => m(y))
    }
    , [r]);
    return U.useLayoutEffect( () => f.listen(p), [f, p]),
    U.createElement(Xb, {
        basename: i,
        children: l,
        location: d.location,
        navigationType: d.action,
        navigator: f,
        unstable_useTransitions: r
    })
}
var dp = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i
  , Me = U.forwardRef(function({onClick: l, discover: r="render", prefetch: o="none", relative: c, reloadDocument: f, replace: d, unstable_mask: m, state: p, target: y, to: S, preventScrollReset: v, viewTransition: w, unstable_defaultShouldRevalidate: b, ...E}, A) {
    let {basename: N, navigator: D, unstable_useTransitions: k} = U.useContext(Mt)
      , G = typeof S == "string" && dp.test(S)
      , $ = ep(S, N);
    S = $.to;
    let W = Ob(S, {
        relative: c
    })
      , J = Xt()
      , Z = null;
    if (m) {
        let de = Ku(m, [], J.unstable_mask ? J.unstable_mask.pathname : "/", !0);
        N !== "/" && (de.pathname = de.pathname === "/" ? N : Vt([N, de.pathname])),
        Z = D.createHref(de)
    }
    let[ie,we,V] = u1(o, E)
      , Q = v1(S, {
        replace: d,
        unstable_mask: m,
        state: p,
        target: y,
        preventScrollReset: v,
        relative: c,
        viewTransition: w,
        unstable_defaultShouldRevalidate: b,
        unstable_useTransitions: k
    });
    function F(de) {
        l && l(de),
        de.defaultPrevented || Q(de)
    }
    let ae = !($.isExternal || f)
      , ce = U.createElement("a", {
        ...E,
        ...V,
        href: (ae ? Z : void 0) || $.absoluteURL || W,
        onClick: ae ? F : l,
        ref: h1(A, we),
        target: y,
        "data-discover": !G && r === "render" ? "true" : void 0
    });
    return ie && !G ? U.createElement(U.Fragment, null, ce, U.createElement(c1, {
        page: W
    })) : ce
});
Me.displayName = "Link";
var p1 = U.forwardRef(function({"aria-current": l="page", caseSensitive: r=!1, className: o="", end: c=!1, style: f, to: d, viewTransition: m, children: p, ...y}, S) {
    let v = ni(d, {
        relative: y.relative
    })
      , w = Xt()
      , b = U.useContext(Bs)
      , {navigator: E, basename: A} = U.useContext(Mt)
      , N = b != null && N1(v) && m === !0
      , D = E.encodeLocation ? E.encodeLocation(v).pathname : v.pathname
      , k = w.pathname
      , G = b && b.navigation && b.navigation.location ? b.navigation.location.pathname : null;
    r || (k = k.toLowerCase(),
    G = G ? G.toLowerCase() : null,
    D = D.toLowerCase()),
    G && A && (G = fn(G, A) || G);
    const $ = D !== "/" && D.endsWith("/") ? D.length - 1 : D.length;
    let W = k === D || !c && k.startsWith(D) && k.charAt($) === "/", J = G != null && (G === D || !c && G.startsWith(D) && G.charAt(D.length) === "/"), Z = {
        isActive: W,
        isPending: J,
        isTransitioning: N
    }, ie = W ? l : void 0, we;
    typeof o == "function" ? we = o(Z) : we = [o, W ? "active" : null, J ? "pending" : null, N ? "transitioning" : null].filter(Boolean).join(" ");
    let V = typeof f == "function" ? f(Z) : f;
    return U.createElement(Me, {
        ...y,
        "aria-current": ie,
        className: we,
        ref: S,
        style: V,
        to: d,
        viewTransition: m
    }, typeof p == "function" ? p(Z) : p)
});
p1.displayName = "NavLink";
var y1 = U.forwardRef( ({discover: i="render", fetcherKey: l, navigate: r, reloadDocument: o, replace: c, state: f, method: d=Ts, action: m, onSubmit: p, relative: y, preventScrollReset: S, viewTransition: v, unstable_defaultShouldRevalidate: w, ...b}, E) => {
    let {unstable_useTransitions: A} = U.useContext(Mt)
      , N = w1()
      , D = E1(m, {
        relative: y
    })
      , k = d.toLowerCase() === "get" ? "get" : "post"
      , G = typeof m == "string" && dp.test(m)
      , $ = W => {
        if (p && p(W),
        W.defaultPrevented)
            return;
        W.preventDefault();
        let J = W.nativeEvent.submitter
          , Z = J?.getAttribute("formmethod") || d
          , ie = () => N(J || W.currentTarget, {
            fetcherKey: l,
            method: Z,
            navigate: r,
            replace: c,
            state: f,
            relative: y,
            preventScrollReset: S,
            viewTransition: v,
            unstable_defaultShouldRevalidate: w
        });
        A && r !== !1 ? U.startTransition( () => ie()) : ie()
    }
    ;
    return U.createElement("form", {
        ref: E,
        method: k,
        action: D,
        onSubmit: o ? p : $,
        ...b,
        "data-discover": !G && i === "render" ? "true" : void 0
    })
}
);
y1.displayName = "Form";
function x1(i) {
    return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}
function hp(i) {
    let l = U.useContext(Ka);
    return Ze(l, x1(i)),
    l
}
function v1(i, {target: l, replace: r, unstable_mask: o, state: c, preventScrollReset: f, relative: d, viewTransition: m, unstable_defaultShouldRevalidate: p, unstable_useTransitions: y}={}) {
    let S = sp()
      , v = Xt()
      , w = ni(i, {
        relative: d
    });
    return U.useCallback(b => {
        if ($b(b, l)) {
            b.preventDefault();
            let E = r !== void 0 ? r : Pl(v) === Pl(w)
              , A = () => S(i, {
                replace: E,
                unstable_mask: o,
                state: c,
                preventScrollReset: f,
                relative: d,
                viewTransition: m,
                unstable_defaultShouldRevalidate: p
            });
            y ? U.startTransition( () => A()) : A()
        }
    }
    , [v, S, w, r, o, c, l, i, f, d, m, p, y])
}
var b1 = 0
  , S1 = () => `__${String(++b1)}__`;
function w1() {
    let {router: i} = hp("useSubmit")
      , {basename: l} = U.useContext(Mt)
      , r = Gb()
      , o = i.fetch
      , c = i.navigate;
    return U.useCallback(async (f, d={}) => {
        let {action: m, method: p, encType: y, formData: S, body: v} = Pb(f, l);
        if (d.navigate === !1) {
            let w = d.fetcherKey || S1();
            await o(w, r, d.action || m, {
                unstable_defaultShouldRevalidate: d.unstable_defaultShouldRevalidate,
                preventScrollReset: d.preventScrollReset,
                formData: S,
                body: v,
                formMethod: d.method || p,
                formEncType: d.encType || y,
                flushSync: d.flushSync
            })
        } else
            await c(d.action || m, {
                unstable_defaultShouldRevalidate: d.unstable_defaultShouldRevalidate,
                preventScrollReset: d.preventScrollReset,
                formData: S,
                body: v,
                formMethod: d.method || p,
                formEncType: d.encType || y,
                replace: d.replace,
                state: d.state,
                fromRouteId: r,
                flushSync: d.flushSync,
                viewTransition: d.viewTransition
            })
    }
    , [o, c, l, r])
}
function E1(i, {relative: l}={}) {
    let {basename: r} = U.useContext(Mt)
      , o = U.useContext(dn);
    Ze(o, "useFormAction must be used inside a RouteContext");
    let[c] = o.matches.slice(-1)
      , f = {
        ...ni(i || ".", {
            relative: l
        })
    }
      , d = Xt();
    if (i == null) {
        f.search = d.search;
        let m = new URLSearchParams(f.search)
          , p = m.getAll("index");
        if (p.some(S => S === "")) {
            m.delete("index"),
            p.filter(v => v).forEach(v => m.append("index", v));
            let S = m.toString();
            f.search = S ? `?${S}` : ""
        }
    }
    return (!i || i === ".") && c.route.index && (f.search = f.search ? f.search.replace(/^\?/, "?index&") : "?index"),
    r !== "/" && (f.pathname = f.pathname === "/" ? r : Vt([r, f.pathname])),
    Pl(f)
}
function N1(i, {relative: l}={}) {
    let r = U.useContext(np);
    Ze(r != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
    let {basename: o} = hp("useViewTransitionState")
      , c = ni(i, {
        relative: l
    });
    if (!r.isTransitioning)
        return !1;
    let f = fn(r.currentLocation.pathname, o) || r.currentLocation.pathname
      , d = fn(r.nextLocation.pathname, o) || r.nextLocation.pathname;
    return zs(c.pathname, d) != null || zs(c.pathname, f) != null
}
function C1() {
    const i = Xt();
    return g.jsxs("div", {
        className: "relative flex flex-col items-center justify-center h-screen text-center px-4",
        children: [g.jsx("h1", {
            className: "absolute bottom-0 text-9xl md:text-[12rem] font-black text-gray-50 select-none pointer-events-none z-0",
            children: "404"
        }), g.jsxs("div", {
            className: "relative z-10",
            children: [g.jsx("h1", {
                className: "text-xl md:text-2xl font-semibold mt-6",
                children: "This page has not been generated"
            }), g.jsx("p", {
                className: "mt-2 text-base text-gray-400 font-mono",
                children: i.pathname
            }), g.jsx("p", {
                className: "mt-4 text-lg md:text-xl text-gray-500",
                children: "Tell me more about this page, so I can generate it"
            })]
        })]
    })
}
const gg = [{
    label: "Home",
    path: "/"
}, {
    label: "Services & Pricing",
    path: "/services"
}, {
    label: "Consultation",
    path: "/consultation"
}];
function Pu() {
    const [i,l] = U.useState(!1)
      , [r,o] = U.useState(!1)
      , c = Xt();
    return U.useEffect( () => {
        const f = () => l(window.scrollY > 40);
        return window.addEventListener("scroll", f),
        () => window.removeEventListener("scroll", f)
    }
    , []),
    U.useEffect( () => {
        o(!1)
    }
    , [c.pathname]),
    g.jsxs("header", {
        className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${i ? "bg-white border-b border-gray-100" : "bg-transparent"}`,
        children: [g.jsxs("nav", {
            className: "max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between",
            children: [g.jsxs(Me, {
                to: "/",
                className: "flex items-center gap-3 cursor-pointer",
                children: [g.jsx("div", {
                    className: "w-8 h-8 flex items-center justify-center rounded-full bg-teal-500",
                    children: g.jsx("i", {
                        className: "ri-scales-3-line text-white text-sm"
                    })
                }), g.jsxs("span", {
                    className: "font-playfair font-semibold text-lg tracking-tight",
                    style: {
                        fontFamily: "'Playfair Display', serif",
                        color: i ? "#1a2332" : "#ffffff"
                    },
                    children: ["Clarity", g.jsx("span", {
                        style: {
                            color: "#14b8a6"
                        },
                        children: "Immigration"
                    })]
                })]
            }), g.jsx("ul", {
                className: "hidden md:flex items-center gap-8",
                children: gg.map(f => {
                    const d = c.pathname === f.path;
                    return g.jsx("li", {
                        children: g.jsxs(Me, {
                            to: f.path,
                            className: `text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer ${i ? d ? "text-teal-600" : "text-gray-600 hover:text-teal-600" : d ? "text-teal-300" : "text-white/80 hover:text-white"}`,
                            style: {
                                fontFamily: "'Inter', sans-serif"
                            },
                            children: [f.label, d && g.jsx("span", {
                                className: "block mt-0.5 h-0.5 rounded-full bg-teal-500 transition-all"
                            })]
                        })
                    }, f.path)
                }
                )
            }), g.jsx("div", {
                className: "hidden md:flex items-center gap-4",
                children: g.jsx(Me, {
                    to: "/consultation",
                    className: "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer bg-teal-500 text-white hover:bg-teal-600",
                    style: {
                        fontFamily: "'Inter', sans-serif"
                    },
                    children: "Book Consultation"
                })
            }), g.jsx("button", {
                className: "md:hidden w-10 h-10 flex items-center justify-center cursor-pointer",
                onClick: () => o(!r),
                "aria-label": "Toggle menu",
                children: g.jsx("i", {
                    className: `${r ? "ri-close-line" : "ri-menu-3-line"} text-2xl`,
                    style: {
                        color: i ? "#1a2332" : "#ffffff"
                    }
                })
            })]
        }), r && g.jsxs("div", {
            className: "md:hidden bg-white border-t border-gray-100 px-6 py-6",
            children: [g.jsx("ul", {
                className: "flex flex-col gap-4",
                children: gg.map(f => g.jsx("li", {
                    children: g.jsx(Me, {
                        to: f.path,
                        className: "block text-base font-medium text-gray-700 hover:text-teal-600 cursor-pointer",
                        style: {
                            fontFamily: "'Inter', sans-serif"
                        },
                        children: f.label
                    })
                }, f.path))
            }), g.jsx(Me, {
                to: "/consultation",
                className: "whitespace-nowrap mt-6 block w-full text-center px-5 py-3 rounded-full text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 cursor-pointer",
                style: {
                    fontFamily: "'Inter', sans-serif"
                },
                children: "Book Consultation"
            })]
        })]
    })
}
const _1 = [{
    label: "Home",
    path: "/"
}, {
    label: "Services & Pricing",
    path: "/services"
}, {
    label: "Consultation Booking",
    path: "/consultation"
}, {
    label: "Privacy Policy",
    path: "/privacy-policy"
}, {
    label: "Terms of Service",
    path: "/terms"
}];
function ec() {
    return g.jsxs("footer", {
        className: "mt-0",
        style: {
            background: "#0d1623",
            fontFamily: "'Inter', sans-serif"
        },
        children: [g.jsx("div", {
            className: "max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-12 border-b border-white/10",
            children: g.jsxs("div", {
                className: "flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8",
                children: [g.jsxs("div", {
                    children: [g.jsx("p", {
                        className: "text-xs uppercase tracking-widest text-teal-400 mb-2",
                        children: "Ready to begin?"
                    }), g.jsx("h2", {
                        className: "text-3xl lg:text-4xl font-light text-white",
                        style: {
                            fontFamily: "'Playfair Display', serif"
                        },
                        children: "Start Your Immigration Journey"
                    }), g.jsx("p", {
                        className: "mt-2 text-gray-400 text-sm",
                        children: "Schedule a free 15-minute consultation today. No obligations, just clarity."
                    })]
                }), g.jsxs(Me, {
                    to: "/consultation",
                    className: "whitespace-nowrap flex items-center gap-2 px-7 py-3.5 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-400 transition-colors cursor-pointer",
                    children: ["Book Free Consultation", g.jsx("i", {
                        className: "ri-arrow-right-line"
                    })]
                })]
            })
        }), g.jsxs("div", {
            className: "max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 md:grid-cols-3 gap-12",
            children: [g.jsxs("div", {
                children: [g.jsxs("div", {
                    className: "flex items-center gap-3 mb-5",
                    children: [g.jsx("div", {
                        className: "w-8 h-8 flex items-center justify-center rounded-full bg-teal-500",
                        children: g.jsx("i", {
                            className: "ri-scales-3-line text-white text-sm"
                        })
                    }), g.jsxs("span", {
                        className: "font-semibold text-white text-lg",
                        style: {
                            fontFamily: "'Playfair Display', serif"
                        },
                        children: ["Clarity", g.jsx("span", {
                            className: "text-teal-400",
                            children: "Immigration"
                        })]
                    })]
                }), g.jsx("p", {
                    className: "text-gray-400 text-sm leading-relaxed max-w-xs",
                    children: "Transparent, flat-fee immigration legal services. We guide you every step of the way — from consultation to successful filing."
                }), g.jsx("div", {
                    className: "flex items-center gap-4 mt-6",
                    children: ["linkedin-box", "twitter-x", "facebook-box"].map(i => g.jsx("a", {
                        href: "#",
                        rel: "nofollow",
                        className: "w-9 h-9 flex items-center justify-center rounded-full border border-white/20 text-gray-400 hover:text-white hover:border-white/50 transition-colors cursor-pointer",
                        children: g.jsx("i", {
                            className: `ri-${i}-line text-lg`
                        })
                    }, i))
                })]
            }), g.jsxs("div", {
                children: [g.jsx("p", {
                    className: "text-xs uppercase tracking-widest text-gray-500 mb-5",
                    children: "Quick Links"
                }), g.jsx("ul", {
                    className: "flex flex-col gap-3",
                    children: _1.map(i => g.jsx("li", {
                        children: g.jsx(Me, {
                            to: i.path,
                            className: "text-sm text-gray-300 hover:text-teal-400 transition-colors cursor-pointer",
                            children: i.label
                        })
                    }, i.path))
                })]
            }), g.jsxs("div", {
                children: [g.jsx("p", {
                    className: "text-xs uppercase tracking-widest text-gray-500 mb-5",
                    children: "Contact"
                }), g.jsxs("div", {
                    className: "flex flex-col gap-4",
                    children: [g.jsxs("a", {
                        href: "tel:+18005550190",
                        className: "flex items-start gap-3 cursor-pointer group",
                        children: [g.jsx("div", {
                            className: "w-9 h-9 flex items-center justify-center rounded-full bg-white/5 flex-shrink-0",
                            children: g.jsx("i", {
                                className: "ri-phone-line text-teal-400 text-base"
                            })
                        }), g.jsxs("div", {
                            children: [g.jsx("p", {
                                className: "text-white text-sm font-medium group-hover:text-teal-400 transition-colors",
                                children: "+1 (800) 555-0190"
                            }), g.jsx("p", {
                                className: "text-gray-500 text-xs mt-0.5",
                                children: "Mon–Fri, 9am–6pm EST"
                            })]
                        })]
                    }), g.jsxs("a", {
                        href: "mailto:info@clarityimmigration.com",
                        className: "flex items-start gap-3 cursor-pointer group",
                        children: [g.jsx("div", {
                            className: "w-9 h-9 flex items-center justify-center rounded-full bg-white/5 flex-shrink-0",
                            children: g.jsx("i", {
                                className: "ri-mail-line text-teal-400 text-base"
                            })
                        }), g.jsxs("div", {
                            children: [g.jsx("p", {
                                className: "text-white text-sm font-medium group-hover:text-teal-400 transition-colors",
                                children: "info@clarityimmigration.com"
                            }), g.jsx("p", {
                                className: "text-gray-500 text-xs mt-0.5",
                                children: "We respond within 24 hours"
                            })]
                        })]
                    }), g.jsxs("div", {
                        className: "flex items-start gap-3",
                        children: [g.jsx("div", {
                            className: "w-9 h-9 flex items-center justify-center rounded-full bg-white/5 flex-shrink-0",
                            children: g.jsx("i", {
                                className: "ri-map-pin-line text-teal-400 text-base"
                            })
                        }), g.jsxs("div", {
                            children: [g.jsx("p", {
                                className: "text-white text-sm",
                                children: "123 Legal Plaza, Suite 500"
                            }), g.jsx("p", {
                                className: "text-gray-500 text-xs mt-0.5",
                                children: "New York, NY 10001"
                            })]
                        })]
                    })]
                })]
            })]
        }), g.jsxs("div", {
            className: "border-t border-white/10 max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4",
            children: [g.jsx("p", {
                className: "text-gray-500 text-xs",
                children: "© 2026 Clarity Immigration Law. All rights reserved."
            }), g.jsxs("div", {
                className: "flex items-center gap-6",
                children: [g.jsx(Me, {
                    to: "/privacy-policy",
                    className: "text-gray-500 text-xs hover:text-gray-300 transition-colors cursor-pointer",
                    children: "Privacy Policy"
                }), g.jsx(Me, {
                    to: "/terms",
                    className: "text-gray-500 text-xs hover:text-gray-300 transition-colors cursor-pointer",
                    children: "Terms of Service"
                })]
            })]
        })]
    })
}
const j1 = [{
    icon: "ri-file-list-3-line",
    value: "500+",
    label: "Cases Filed"
}, {
    icon: "ri-time-line",
    value: "15-Min",
    label: "Free Consultation"
}, {
    icon: "ri-price-tag-3-line",
    value: "Flat-Fee",
    label: "Transparent Pricing"
}]
  , A1 = [{
    icon: "ri-book-open-line",
    name: "Attorney Guidance",
    price: "From $1,000"
}, {
    icon: "ri-file-paper-2-line",
    name: "Attorney Filing",
    price: "From $2,000"
}, {
    icon: "ri-speed-up-line",
    name: "Expedited Service",
    price: "+$500"
}];
function T1() {
    return g.jsxs("section", {
        className: "relative min-h-screen flex flex-col",
        style: {
            background: "linear-gradient(135deg, #0d1623 0%, #1a2332 45%, #1e3a4a 100%)",
            fontFamily: "'Inter', sans-serif"
        },
        children: [g.jsxs("div", {
            className: "absolute inset-0 overflow-hidden",
            children: [g.jsx("img", {
                alt: "Law office",
                className: "w-full h-full object-cover object-top opacity-20"
            }), g.jsx("div", {
                className: "absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40"
            })]
        }), g.jsx("div", {
            className: "relative z-10 flex-1 flex items-center",
            children: g.jsx("div", {
                className: "w-full max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-16",
                children: g.jsxs("div", {
                    className: "grid lg:grid-cols-2 gap-12 lg:gap-16 items-center",
                    children: [g.jsxs("div", {
                        children: [g.jsxs("div", {
                            className: "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-400/40 bg-teal-500/10 mb-8",
                            children: [g.jsx("i", {
                                className: "ri-shield-check-line text-teal-400 text-sm"
                            }), g.jsx("span", {
                                className: "text-teal-300 text-xs font-medium tracking-wide uppercase",
                                children: "Licensed Immigration Attorneys"
                            })]
                        }), g.jsxs("h1", {
                            className: "text-5xl lg:text-6xl font-light text-white leading-tight mb-6",
                            style: {
                                fontFamily: "'Playfair Display', serif"
                            },
                            children: ["Your Clear Path", g.jsx("br", {}), g.jsx("strong", {
                                className: "font-semibold",
                                style: {
                                    color: "#14b8a6"
                                },
                                children: "to U.S. Immigration"
                            })]
                        }), g.jsx("p", {
                            className: "text-gray-300 text-lg leading-relaxed mb-8 max-w-lg",
                            children: "Transparent flat-fee pricing. Expert legal guidance. A streamlined process that puts you in control from day one."
                        }), g.jsxs("div", {
                            className: "flex flex-wrap gap-4",
                            children: [g.jsxs(Me, {
                                to: "/consultation",
                                className: "whitespace-nowrap inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-400 transition-all cursor-pointer",
                                children: ["Book Free Consultation", g.jsx("i", {
                                    className: "ri-arrow-right-line"
                                })]
                            }), g.jsx(Me, {
                                to: "/services",
                                className: "whitespace-nowrap inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-all cursor-pointer",
                                children: "View Pricing"
                            })]
                        })]
                    }), g.jsx("div", {
                        className: "w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto",
                        children: g.jsxs("div", {
                            className: "bg-white rounded-2xl p-6",
                            style: {
                                border: "1px solid rgba(255,255,255,0.1)"
                            },
                            children: [g.jsx("p", {
                                className: "text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4",
                                children: "Choose Your Service"
                            }), g.jsx("div", {
                                className: "flex flex-col gap-3 mb-5",
                                children: A1.map(i => g.jsxs("div", {
                                    className: "flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer group",
                                    children: [g.jsxs("div", {
                                        className: "flex items-center gap-3",
                                        children: [g.jsx("div", {
                                            className: "w-9 h-9 flex items-center justify-center rounded-lg bg-teal-50 flex-shrink-0",
                                            children: g.jsx("i", {
                                                className: `${i.icon} text-teal-600 text-base`
                                            })
                                        }), g.jsx("span", {
                                            className: "text-sm font-medium text-gray-700",
                                            children: i.name
                                        })]
                                    }), g.jsx("span", {
                                        className: "text-sm font-semibold text-teal-600 whitespace-nowrap",
                                        children: i.price
                                    })]
                                }, i.name))
                            }), g.jsx(Me, {
                                to: "/consultation",
                                className: "whitespace-nowrap block w-full text-center py-3 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors cursor-pointer",
                                children: "Get Started Today"
                            }), g.jsx("p", {
                                className: "text-center text-xs text-gray-400 mt-3",
                                children: "No hidden fees. Flat-rate pricing guaranteed."
                            })]
                        })
                    })]
                })
            })
        }), g.jsx("div", {
            className: "relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-sm",
            children: g.jsx("div", {
                className: "max-w-7xl mx-auto px-6 lg:px-10 py-5",
                children: g.jsx("div", {
                    className: "grid grid-cols-3 gap-4",
                    children: j1.map(i => g.jsxs("div", {
                        className: "flex items-center gap-3",
                        children: [g.jsx("div", {
                            className: "w-9 h-9 flex items-center justify-center rounded-full bg-teal-500/20 flex-shrink-0",
                            children: g.jsx("i", {
                                className: `${i.icon} text-teal-400 text-base`
                            })
                        }), g.jsxs("div", {
                            children: [g.jsx("p", {
                                className: "text-white text-sm font-semibold",
                                children: i.value
                            }), g.jsx("p", {
                                className: "text-gray-400 text-xs",
                                children: i.label
                            })]
                        })]
                    }, i.label))
                })
            })
        })]
    })
}
const O1 = [{
    icon: "ri-user-star-line",
    title: "Attorney-Reviewed Guidance",
    description: "Get expert review of your immigration case with personalized attorney advice and step-by-step guidance for self-filing.",
    price: "$1,000 – $1,500",
    tag: "Self-Filing Support",
    tagColor: "bg-emerald-50 text-emerald-700",
   function R1() {
    return g.jsx("section", {
        className: "py-24 px-6 lg:px-10",
        style: {
            background: "#f7f9fc",
            fontFamily: "'Inter', sans-serif"
        },
        children: g.jsxs("div", {
            className: "max-w-7xl mx-auto",
            children: [g.jsxs("div", {
                className: "text-center mb-14",
                children: [g.jsx("span", {
                    className: "inline-block px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs font-semibold uppercase tracking-widest mb-4",
                    children: "Our Services"
                }), g.jsx("h2", {
                    className: "text-4xl lg:text-5xl font-medium text-gray-900 mb-4",
                    style: {
                        fontFamily: "'Playfair Display', serif",
                        color: "#1a2332"
                    },
                    children: "Transparent Immigration Services"
                }), g.jsx("p", {
                    className: "text-gray-500 text-base max-w-2xl mx-auto leading-relaxed",
                    children: "Every service is offered at a flat fee — no surprises, no hourly billing. Choose the level of support that fits your needs."
                })]
            }), g.jsx("div", {
                className: "grid md:grid-cols-3 gap-6",
                children: O1.map(i => g.jsxs("div", {
                    className: "bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-teal-200 transition-all group cursor-default",
                    children: [g.jsxs("div", {
                        className: "w-full h-48 overflow-hidden relative",
                        children: [g.jsx("img", {
                            src: i.img,
                            alt: i.title,
                            className: "w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        }), g.jsx("div", {
                            className: "absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent"
                        }), g.jsx("div", {
                            className: "absolute top-3 right-3",
                            children: g.jsx("span", {
                                className: `px-3 py-1 rounded-full text-xs font-semibold ${i.tagColor} backdrop-blur-sm`,
                                children: i.tag
                            })
                        })]
                    }), g.jsxs("div", {
                        className: "p-6",
                        children: [g.jsxs("div", {
                            className: "flex items-center gap-3 mb-3",
                            children: [g.jsx("div", {
                                className: "w-9 h-9 flex items-center justify-center rounded-lg bg-teal-50 flex-shrink-0",
                                children: g.jsx("i", {
                                    className: `${i.icon} text-teal-600 text-base`
                                })
                            }), g.jsx("h3", {
                                className: "text-base font-semibold leading-tight",
                                style: {
                                    color: "#1a2332",
                                    fontFamily: "'Playfair Display', serif"
                                },
                                children: i.title
                            })]
                        }), g.jsx("p", {
                            className: "text-gray-500 text-sm leading-relaxed mb-5",
                            children: i.description
                        }), g.jsxs("div", {
                            className: "border-t border-gray-100 pt-4 flex items-center justify-between",
                            children: [g.jsx("span", {
                                className: "text-teal-600 font-semibold text-base",
                                children: i.price
                            }), g.jsxs(Me, {
                                to: "/services",
                                className: "whitespace-nowrap text-xs font-medium text-gray-400 hover:text-teal-600 transition-colors cursor-pointer flex items-center gap-1",
                                children: ["Details ", g.jsx("i", {
                                    className: "ri-arrow-right-s-line"
                                })]
                            })]
                        })]
                    })]
                }, i.title))
            }), g.jsx("div", {
                className: "text-center mt-10",
                children: g.jsxs(Me, {
                    to: "/services",
                    className: "whitespace-nowrap inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:border-teal-400 hover:text-teal-600 transition-all cursor-pointer",
                    children: ["View All Services & Pricing ", g.jsx("i", {
                        className: "ri-arrow-right-line"
                    })]
                })
            })]
        })
    })
}
const M1 = [{
    number: "01",
    title: "Book a Consultation",
    desc: "Schedule a free 15-minute call with our team to discuss your case and determine the best path forward.",
    icon: "ri-calendar-check-line"
}, {
    number: "02",
    title: "Select Your Package",
    desc: "Choose the service level that matches your needs — guidance only or full attorney filing.",
    icon: "ri-price-tag-3-line"
}, {
    number: "03",
    title: "Complete Intake Form",
    desc: "Fill out our secure digital questionnaire so we have everything we need to begin your case.",
    icon: "ri-file-list-3-line"
}, {
    number: "04",
    title: "Submit Documents",
    desc: "Upload required supporting documents through our secure client portal — we guide you through every item.",
    icon: "ri-folder-upload-line"
}, {
    number: "05",
    title: "Case Filed & Confirmed",
    desc: "We prepare, review, and file your case. You receive confirmation and ongoing updates until resolution.",
    icon: "ri-checkbox-circle-line"
}];
function D1() {
    return g.jsx("section", {
        className: "py-24 px-6 lg:px-10 bg-white",
        style: {
            fontFamily: "'Inter', sans-serif"
        },
        children: g.jsxs("div", {
            className: "max-w-7xl mx-auto",
            children: [g.jsxs("div", {
                className: "flex flex-col lg:flex-row lg:items-end justify-between mb-14 gap-6",
                children: [g.jsxs("div", {
                    children: [g.jsx("span", {
                        className: "inline-block px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs font-semibold uppercase tracking-widest mb-4",
                        children: "How It Works"
                    }), g.jsxs("h2", {
                        className: "text-4xl lg:text-5xl font-medium",
                        style: {
                            fontFamily: "'Playfair Display', serif",
                            color: "#1a2332"
                        },
                        children: ["Your Journey,", g.jsx("br", {}), "Simplified"]
                    })]
                }), g.jsx("p", {
                    className: "text-gray-500 text-sm leading-relaxed max-w-sm lg:text-right",
                    children: "From first contact to successful filing — our streamlined process takes the complexity out of immigration law."
                })]
            }), g.jsxs("div", {
                className: "grid md:grid-cols-5 gap-0 relative",
                children: [g.jsx("div", {
                    className: "hidden md:block absolute top-8 left-[10%] right-[10%] h-px",
                    style: {
                        background: "linear-gradient(90deg, #14b8a6 0%, #14b8a6 100%)",
                        opacity: .2
                    }
                }), M1.map( (i, l) => g.jsxs("div", {
                    className: "relative flex flex-col items-center text-center px-4",
                    children: [g.jsx("div", {
                        className: "relative z-10 w-16 h-16 flex items-center justify-center rounded-full mb-6 border-2",
                        style: {
                            background: l === 0 ? "#14b8a6" : "#f7f9fc",
                            borderColor: l === 0 ? "#14b8a6" : "#e5e7eb"
                        },
                        children: g.jsx("i", {
                            className: `${i.icon} text-xl`,
                            style: {
                                color: l === 0 ? "#fff" : "#14b8a6"
                            }
                        })
                    }), g.jsxs("span", {
                        className: "text-xs font-bold uppercase tracking-widest mb-2",
                        style: {
                            color: "#14b8a6"
                        },
                        children: ["Step ", i.number]
                    }), g.jsx("h3", {
                        className: "text-base font-semibold mb-2",
                        style: {
                            color: "#1a2332",
                            fontFamily: "'Playfair Display', serif"
                        },
                        children: i.title
                    }), g.jsx("p", {
                        className: "text-gray-500 text-xs leading-relaxed",
                        children: i.desc
                    })]
                }, i.number))]
            })]
        })
    })
}
const L1 = [{
    name: "Attorney Guidance",
    tagline: "Expert review + your filing",
    price: "$1,000",
    priceSuffix: "– $1,500",
    features: ["Case eligibility assessment", "Attorney case review", "Form preparation guidance", "Document checklist", "One-on-one consultation", "Email support throughout"],
    cta: "Select Package",
    featured: !1
}, {
    name: "Attorney Filing",
    tagline: "We handle everything",
    price: "$2,000",
    priceSuffix: "– $2,500",
    features: ["Everything in Guidance", "Full form preparation", "Attorney-signed filing", "USCIS correspondence", "Status tracking & updates", "Document review & checklist", "RFE response support", "Priority email & phone support"],
    cta: "Get Started",
    featured: !0
}, {
    name: "Add-Ons",
    tagline: "Enhance any package",
    addons: [{
        name: "Additional I-130 Petition",
        price: "+$500 each"
    }, {
        name: "Expedited Processing",
        price: "+$500"
    }],
    cta: "View Details",
    featured: !1,
    isAddon: !0
}];
function z1() {
    return g.jsx("section", {
        className: "py-24 px-6 lg:px-10",
        style: {
            background: "#f7f9fc",
            fontFamily: "'Inter', sans-serif"
        },
        children: g.jsxs("div", {
            className: "max-w-7xl mx-auto",
            children: [g.jsxs("div", {
                className: "text-center mb-14",
                children: [g.jsx("span", {
                    className: "inline-block px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs font-semibold uppercase tracking-widest mb-4",
                    children: "Flat-Fee Pricing"
                }), g.jsx("h2", {
                    className: "text-4xl lg:text-5xl font-medium mb-4",
                    style: {
                        fontFamily: "'Playfair Display', serif",
                        color: "#1a2332"
                    },
                    children: "Simple, Transparent Pricing"
                }), g.jsx("p", {
                    className: "text-gray-500 text-base max-w-xl mx-auto",
                    children: "One flat fee — no hourly billing, no surprise charges. You know exactly what you pay before we begin."
                })]
            }), g.jsx("div", {
                className: "grid md:grid-cols-3 gap-6 items-start",
                children: L1.map(i => g.jsxs("div", {
                    className: `rounded-2xl p-7 relative ${i.featured ? "bg-white border-2 border-teal-400" : "bg-white border border-gray-100"}`,
                    children: [i.featured && g.jsx("div", {
                        className: "absolute -top-3 left-1/2 -translate-x-1/2",
                        children: g.jsx("span", {
                            className: "px-4 py-1 bg-teal-500 text-white text-xs font-semibold rounded-full whitespace-nowrap",
                            children: "Most Popular"
                        })
                    }), g.jsx("h3", {
                        className: "text-xl font-semibold mb-1",
                        style: {
                            fontFamily: "'Playfair Display', serif",
                            color: "#1a2332"
                        },
                        children: i.name
                    }), g.jsx("p", {
                        className: "text-gray-400 text-xs mb-5",
                        children: i.tagline
                    }), i.isAddon ? g.jsxs("div", {
                        className: "mb-6 flex flex-col gap-4",
                        children: [i.addons?.map(l => g.jsxs("div", {
                            className: "p-4 rounded-xl border border-gray-100 bg-gray-50",
                            children: [g.jsx("p", {
                                className: "text-sm font-semibold text-gray-700 mb-1",
                                children: l.name
                            }), g.jsx("p", {
                                className: "text-lg font-semibold text-teal-600",
                                children: l.price
                            })]
                        }, l.name)), g.jsx("p", {
                            className: "text-xs text-gray-400 leading-relaxed",
                            children: "Add-ons can be combined with any service package at checkout."
                        })]
                    }) : g.jsxs(g.Fragment, {
                        children: [g.jsxs("div", {
                            className: "mb-5",
                            children: [g.jsx("span", {
                                className: "text-4xl font-light",
                                style: {
                                    color: "#1a2332"
                                },
                                children: i.price
                            }), g.jsxs("span", {
                                className: "text-gray-400 text-sm",
                                children: [" ", i.priceSuffix]
                            })]
                        }), g.jsx("div", {
                            className: "border-t border-gray-100 pt-5 mb-6",
                            children: g.jsx("ul", {
                                className: "flex flex-col gap-2.5",
                                children: i.features?.map(l => g.jsxs("li", {
                                    className: "flex items-start gap-2.5",
                                    children: [g.jsx("div", {
                                        className: "w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5",
                                        children: g.jsx("i", {
                                            className: "ri-check-line text-teal-500 text-sm"
                                        })
                                    }), g.jsx("span", {
                                        className: "text-sm text-gray-600",
                                        children: l
                                    })]
                                }, l))
                            })
                        })]
                    }), g.jsx(Me, {
                        to: "/consultation",
                        className: `whitespace-nowrap block w-full text-center py-3 rounded-full text-sm font-semibold transition-colors cursor-pointer ${i.featured ? "bg-teal-500 text-white hover:bg-teal-600" : "border border-gray-200 text-gray-700 hover:border-teal-400 hover:text-teal-600"}`,
                        children: i.cta
                    })]
                }, i.name))
            }), g.jsx("div", {
                className: "text-center mt-8",
                children: g.jsx(Me, {
                    to: "/services",
                    className: "whitespace-nowrap text-sm text-teal-600 font-medium hover:text-teal-800 transition-colors cursor-pointer underline underline-offset-2",
                    children: "View full service comparison →"
                })
            })]
        })
    })
}
const U1 = [{
    value: "500+",
    label: "Cases Filed"
}, {
    value: "12+",
    label: "Years Experience"
}, {
    value: "98%",
    label: "Approval Rate"
}, {
    value: "50+",
    label: "States Served"
}]
    , B1 = [{
    icon: "ri-award-line",
    label: "AILA Member",
    desc: "American Immigration Lawyers Association"
}, {
    icon: "ri-shield-star-line",
    label: "AV Rated",
    desc: "Martindale-Hubbell Peer Review"
}, {
    icon: "ri-verified-badge-line",
    label: "BBB Accredited",
    desc: "A+ Better Business Bureau Rating"
}, {
    icon: "ri-government-line",
    label: "USCIS Registered",
    desc: "Authorized Immigration Representation"
}];
function q1() {
    return g.jsxs("section", {
        className: "bg-white",
        style: {
            fontFamily: "'Inter', sans-serif"
        },
        children: [g.jsx("div", {
            style: {
                background: "#1a2332"
            },
            className: "py-14 px-6 lg:px-10",
            children: g.jsx("div", {
                className: "max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8",
                children: U1.map( (i, l) => g.jsxs("div", {
                    className: `text-center ${l < 3 ? "md:border-r border-white/10" : ""}`,
                    children: [g.jsx("p", {
                        className: "text-4xl font-light text-white mb-1",
                        style: {
                            fontFamily: "'Playfair Display', serif"
                        },
                        children: i.value
                    }), g.jsx("p", {
                        className: "text-xs uppercase tracking-widest text-gray-400",
                        children: i.label
                    })]
                }, i.label))
            })
        }), g.jsx("div", {
            className: "py-24 px-6 lg:px-10",
            style: {
                background: "#faf8f5"
            },
            children: g.jsxs("div", {
                className: "max-w-7xl mx-auto",
                children: [g.jsxs("div", {
                    className: "text-center mb-12",
                    children: [g.jsx("span", {
                        className: "inline-block px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs font-semibold uppercase tracking-widest mb-4",
                        children: "Client Stories"
                    }), g.jsx("h2", {
                        className: "text-4xl font-medium",
                        style: {
                            fontFamily: "'Playfair Display', serif",
                            color: "#1a2332"
                        },
                        children: "Real Clients. Real Results."
                    })]
                }), g.jsx("div", {
                    className: "grid md:grid-cols-3 gap-6",
                    children: H1.map(i => g.jsxs("div", {
                        className: "bg-white rounded-2xl p-7 border border-gray-100 flex flex-col",
                        children: [g.jsx("div", {
                            className: "flex gap-1 mb-4",
                            children: [...Array(5)].map( (l, r) => g.jsx("i", {
                                className: "ri-star-fill text-amber-400 text-sm"
                            }, r))
                        }), g.jsx("i", {
                            className: "ri-double-quotes-l text-teal-100 text-4xl mb-2 leading-none"
                        }), g.jsx("p", {
                            className: "text-gray-600 text-sm leading-relaxed mb-6 italic flex-1",
                            children: i.quote
                        }), g.jsxs("div", {
                            className: "flex items-center gap-3 pt-4 border-t border-gray-100",
                            children: [g.jsx("div", {
                                className: "w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-teal-100",
                                children: g.jsx("img", {
                                    src: i.img,
                                    alt: i.name,
                                    className: "w-full h-full object-cover object-top"
                                })
                            }), g.jsxs("div", {
                                children: [g.jsx("p", {
                                    className: "text-sm font-semibold",
                                    style: {
                                        color: "#1a2332"
                                    },
                                    children: i.name
                                }), g.jsx("p", {
                                    className: "text-xs text-gray-400",
                                    children: i.origin
                                })]
                            })]
                        })]
                    }, i.name))
                })]
            })
        }), g.jsx("div", {
            className: "py-16 px-6 lg:px-10 bg-white",
            children: g.jsxs("div", {
                className: "max-w-7xl mx-auto",
                children: [g.jsx("p", {
                    className: "text-center text-xs uppercase tracking-widest text-gray-400 mb-10",
                    children: "Our Credentials & Memberships"
                }), g.jsx("div", {
                    className: "grid grid-cols-2 md:grid-cols-4 gap-4",
                    children: B1.map(i => g.jsxs("div", {
                        className: "flex flex-col items-center text-center p-6 rounded-xl border border-gray-100 hover:border-teal-200 transition-all",
                        children: [g.jsx("div", {
                            className: "w-12 h-12 flex items-center justify-center rounded-full bg-teal-50 mb-3",
                            children: g.jsx("i", {
                                className: `${i.icon} text-teal-600 text-xl`
                            })
                        }), g.jsx("p", {
                            className: "text-sm font-semibold mb-1",
                            style: {
                                color: "#1a2332"
                            },
                            children: i.label
                        }), g.jsx("p", {
                            className: "text-xs text-gray-400 leading-relaxed",
                            children: i.desc
                        })]
                    }, i.label))
                })]
            })
        })]
    })
}
function k1() {
    return g.jsxs("section", {
        className: "relative py-28 px-6 lg:px-10 overflow-hidden",
        style: {
            fontFamily: "'Inter', sans-serif"
        },
        children: [g.jsxs("div", {
                    }), g.jsx("div", {
                className: "absolute inset-0",
                style: {
                    background: "linear-gradient(120deg, rgba(13,22,35,0.92) 0%, rgba(13,22,35,0.75) 50%, rgba(20,184,166,0.45) 100%)"
                }
            }), g.jsx("div", {
                className: "absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d1623] to-transparent"
            })]
        }), g.jsxs("div", {
            className: "relative z-10 max-w-4xl mx-auto text-center",
            children: [g.jsx("span", {
                className: "inline-block px-4 py-1.5 rounded-full border border-teal-400/40 bg-teal-500/10 text-teal-300 text-xs font-semibold uppercase tracking-widest mb-6",
                children: "Free 15-Minute Consultation"
            }), g.jsxs("h2", {
                className: "text-4xl lg:text-5xl font-light text-white mb-6",
                style: {
                    fontFamily: "'Playfair Display', serif"
                },
                children: ["Ready to Begin Your", g.jsx("br", {}), g.jsx("strong", {
                    className: "font-semibold",
                    style: {
                        color: "#14b8a6"
                    },
                    children: "Immigration Journey?"
                })]
            }), g.jsx("p", {
                className: "text-gray-300 text-base leading-relaxed mb-10 max-w-2xl mx-auto",
                children: "Schedule a free, no-obligation consultation. We'll review your case, answer your questions, and outline the best path forward — all in 15 minutes."
            }), g.jsxs("div", {
                className: "flex flex-wrap items-center justify-center gap-4",
                children: [g.jsxs(Me, {
                    to: "/consultation",
                    className: "whitespace-nowrap inline-flex items-center gap-2 px-8 py-4 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-400 transition-all cursor-pointer",
                    children: ["Book Your Free Consultation", g.jsx("i", {
                        className: "ri-calendar-check-line"
                    })]
                }), g.jsx(Me, {
                    to: "/services",
                    className: "whitespace-nowrap inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-all cursor-pointer",
                    children: "Explore Services"
                })]
            }), g.jsx("p", {
                className: "text-gray-500 text-xs mt-6",
                children: "No credit card required. No obligations. Just answers."
            })]
        })]
    })
}
function G1() {
    return g.jsxs("div", {
        style: {
            fontFamily: "'Inter', sans-serif"
        },
        children: [g.jsx(Pu, {}), g.jsxs("main", {
            children: [g.jsx(T1, {}), g.jsx(R1, {}), g.jsx(D1, {}), g.jsx(z1, {}), g.jsx(q1, {}), g.jsx(k1, {})]
        }), g.jsx(ec, {})]
    })
}
const Y1 = [{
    name: "Attorney-Reviewed Guidance",
    price: "$1,000",
    priceRange: "– $1,500",
    desc: "Perfect for those who want expert legal guidance while handling their own filing. Our attorneys review your case and guide every step.",
    features: ["Initial case eligibility assessment", "One 30-minute strategy consultation", "Attorney review of all forms", "Personalized document checklist", "Step-by-step filing instructions", "Review of completed forms before submission", "Email support (3 business days response)", "One revision round included"],
    cta: "Get Started",
    featured: !1,
    tag: null
}, {
    name: "Attorney Filing Service",
    price: "$2,000",
    priceRange: "– $2,500",
    desc: "Full-service representation where our attorneys prepare, review, and file everything on your behalf. Zero guesswork.",
    features: ["Everything in Guidance package", "Full form preparation by attorney", "Attorney-signed cover letter", "USCIS submission handling", "Receipt notice tracking", "RFE (Request for Evidence) response support", "Direct correspondence with USCIS", "Case status updates & portal access", "Phone + email priority support", "Unlimited revisions pre-filing"],
    cta: "Get Started",
    featured: !0,
    tag: "Most Popular"
}]
  , V1 = [{
    name: "Additional I-130 Petition",
    price: "$500",
    unit: "per petition",
    icon: "ri-group-line",
    desc: "For each additional family member included in the same I-130 filing."
}, {
    name: "Expedited Processing",
    price: "$500",
    unit: "flat add-on",
    icon: "ri-speed-up-line",
    desc: "Priority handling to reduce turnaround time on case preparation and review."
}];
function Q1() {
    return g.jsx("section", {
        className: "py-20 px-6 lg:px-10 bg-white",
        style: {
            fontFamily: "'Inter', sans-serif"
        },
        children: g.jsxs("div", {
            className: "max-w-7xl mx-auto",
            children: [g.jsx("div", {
                className: "grid md:grid-cols-2 gap-6 mb-10",
                children: Y1.map(i => g.jsxs("div", {
                    className: `rounded-2xl p-8 relative ${i.featured ? "border-2 border-teal-400 bg-white" : "border border-gray-100 bg-white"}`,
                    children: [i.tag && g.jsx("div", {
                        className: "absolute -top-3 left-8",
                        children: g.jsx("span", {
                            className: "px-4 py-1 bg-teal-500 text-white text-xs font-semibold rounded-full whitespace-nowrap",
                            children: i.tag
                        })
                    }), g.jsxs("div", {
                        className: "mb-6",
                        children: [g.jsx("h3", {
                            className: "text-2xl font-semibold mb-2",
                            style: {
                                fontFamily: "'Playfair Display', serif",
                                color: "#1a2332"
                            },
                            children: i.name
                        }), g.jsx("p", {
                            className: "text-gray-500 text-sm leading-relaxed mb-4",
                            children: i.desc
                        }), g.jsxs("div", {
                            children: [g.jsx("span", {
                                className: "text-5xl font-light",
                                style: {
                                    color: "#1a2332"
                                },
                                children: i.price
                            }), g.jsx("span", {
                                className: "text-gray-400 text-lg ml-1",
                                children: i.priceRange
                            })]
                        }), g.jsx("p", {
                            className: "text-xs text-gray-400 mt-1",
                            children: "Flat fee — no hourly billing"
                        })]
                    }), g.jsx("div", {
                        className: "border-t border-gray-100 pt-6 mb-7",
                        children: g.jsx("ul", {
                            className: "grid grid-cols-1 gap-3",
                            children: i.features.map(l => g.jsxs("li", {
                                className: "flex items-start gap-3",
                                children: [g.jsx("div", {
                                    className: "w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5",
                                    children: g.jsx("i", {
                                        className: "ri-check-line text-teal-500 text-base"
                                    })
                                }), g.jsx("span", {
                                    className: "text-sm text-gray-600",
                                    children: l
                                })]
                            }, l))
                        })
                    }), g.jsx(Me, {
                        to: "/consultation",
                        className: `whitespace-nowrap block w-full text-center py-3.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${i.featured ? "bg-teal-500 text-white hover:bg-teal-600" : "border-2 border-gray-200 text-gray-700 hover:border-teal-400 hover:text-teal-600"}`,
                        children: i.cta
                    })]
                }, i.name))
            }), g.jsxs("div", {
                className: "rounded-2xl border border-gray-100 bg-gray-50 p-8",
                children: [g.jsxs("div", {
                    className: "flex items-center gap-3 mb-6",
                    children: [g.jsx("div", {
                        className: "w-10 h-10 flex items-center justify-center rounded-xl bg-teal-50",
                        children: g.jsx("i", {
                            className: "ri-add-circle-line text-teal-600 text-lg"
                        })
                    }), g.jsxs("div", {
                        children: [g.jsx("h3", {
                            className: "text-lg font-semibold",
                            style: {
                                color: "#1a2332",
                                fontFamily: "'Playfair Display', serif"
                            },
                            children: "Service Add-Ons"
                        }), g.jsx("p", {
                            className: "text-xs text-gray-400",
                            children: "Combine with any package"
                        })]
                    })]
                }), g.jsx("div", {
                    className: "grid md:grid-cols-2 gap-4",
                    children: V1.map(i => g.jsxs("div", {
                        className: "bg-white rounded-xl p-5 border border-gray-100",
                        children: [g.jsxs("div", {
                            className: "flex items-start justify-between gap-4 mb-3",
                            children: [g.jsxs("div", {
                                className: "flex items-center gap-3",
                                children: [g.jsx("div", {
                                    className: "w-10 h-10 flex items-center justify-center rounded-lg bg-teal-50 flex-shrink-0",
                                    children: g.jsx("i", {
                                        className: `${i.icon} text-teal-600 text-base`
                                    })
                                }), g.jsx("h4", {
                                    className: "text-sm font-semibold",
                                    style: {
                                        color: "#1a2332"
                                    },
                                    children: i.name
                                })]
                            }), g.jsxs("div", {
                                className: "text-right flex-shrink-0",
                                children: [g.jsx("p", {
                                    className: "text-xl font-semibold text-teal-600",
                                    children: i.price
                                }), g.jsx("p", {
                                    className: "text-xs text-gray-400",
                                    children: i.unit
                                })]
                            })]
                        }), g.jsx("p", {
                            className: "text-xs text-gray-500 leading-relaxed",
                            children: i.desc
                        })]
                    }, i.name))
                })]
            })]
        })
    })
}
const X1 = [{
    label: "Case Assessment",
    guidance: !0,
    filing: !0
}, {
    label: "Consultation Call",
    guidance: "30 min",
    filing: "45 min"
}, {
    label: "Form Review",
    guidance: !0,
    filing: !0
}, {
    label: "Document Checklist",
    guidance: !0,
    filing: !0
}, {
    label: "Form Preparation",
    guidance: !1,
    filing: !0
}, {
    label: "Attorney-Signed Cover Letter",
    guidance: !1,
    filing: !0
}, {
    label: "USCIS Submission",
    guidance: "Self-file",
    filing: !0
}, {
    label: "Status Tracking",
    guidance: !1,
    filing: !0
}, {
    label: "RFE Response",
    guidance: "Add-on",
    filing: !0
}, {
    label: "USCIS Correspondence",
    guidance: !1,
    filing: !0
}, {
    label: "Email Support",
    guidance: "3-day",
    filing: "Priority"
}, {
    label: "Phone Support",
    guidance: !1,
    filing: !0
}, {
    label: "Revisions",
    guidance: "1 round",
    filing: "Unlimited"
}];
function pg({val: i}) {
    return i === !0 ? g.jsx("div", {
        className: "w-6 h-6 flex items-center justify-center mx-auto",
        children: g.jsx("i", {
            className: "ri-check-line text-teal-500 text-lg"
        })
    }) : i === !1 ? g.jsx("div", {
        className: "w-6 h-6 flex items-center justify-center mx-auto",
        children: g.jsx("i", {
            className: "ri-subtract-line text-gray-200 text-lg"
        })
    }) : g.jsx("span", {
        className: "text-xs font-medium text-teal-600 whitespace-nowrap",
        children: i
    })
}
function Z1() {
    return g.jsx("section", {
        className: "py-16 px-6 lg:px-10",
        style: {
            background: "#f7f9fc",
            fontFamily: "'Inter', sans-serif"
        },
        children: g.jsxs("div", {
            className: "max-w-4xl mx-auto",
            children: [g.jsxs("div", {
                className: "text-center mb-10",
                children: [g.jsx("h2", {
                    className: "text-3xl font-medium mb-2",
                    style: {
                        fontFamily: "'Playfair Display', serif",
                        color: "#1a2332"
                    },
                    children: "Package Comparison"
                }), g.jsx("p", {
                    className: "text-gray-400 text-sm",
                    children: "See exactly what's included in each service tier."
                })]
            }), g.jsxs("div", {
                className: "bg-white rounded-2xl border border-gray-100 overflow-hidden",
                children: [g.jsxs("div", {
                    className: "grid grid-cols-3 border-b border-gray-100",
                    children: [g.jsx("div", {
                        className: "p-5"
                    }), g.jsxs("div", {
                        className: "p-5 text-center border-l border-gray-100",
                        children: [g.jsx("p", {
                            className: "text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1",
                            children: "Guidance"
                        }), g.jsx("p", {
                            className: "text-lg font-semibold",
                            style: {
                                color: "#1a2332"
                            },
                            children: "$1,000–$1,500"
                        })]
                    }), g.jsxs("div", {
                        className: "p-5 text-center border-l border-teal-100",
                        style: {
                            background: "#f0fffe"
                        },
                        children: [g.jsx("p", {
                            className: "text-xs font-semibold uppercase tracking-wide text-teal-600 mb-1",
                            children: "Filing"
                        }), g.jsx("p", {
                            className: "text-lg font-semibold",
                            style: {
                                color: "#1a2332"
                            },
                            children: "$2,000–$2,500"
                        })]
                    })]
                }), X1.map( (i, l) => g.jsxs("div", {
                    className: `grid grid-cols-3 border-b border-gray-50 ${l % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`,
                    children: [g.jsx("div", {
                        className: "p-4 flex items-center",
                        children: g.jsx("span", {
                            className: "text-sm text-gray-700",
                            children: i.label
                        })
                    }), g.jsx("div", {
                        className: "p-4 border-l border-gray-100 flex items-center justify-center",
                        children: g.jsx(pg, {
                            val: i.guidance
                        })
                    }), g.jsx("div", {
                        className: "p-4 border-l border-teal-50 flex items-center justify-center",
                        style: {
                            background: l % 2 === 0 ? "#fafffe" : "#f5fffd"
                        },
                        children: g.jsx(pg, {
                            val: i.filing
                        })
                    })]
                }, i.label))]
            })]
        })
    })
}
const K1 = [{
    q: "What is a flat-fee service and what does it include?",
    a: "A flat fee means you pay one fixed price for the entire service — no hourly billing, no surprise charges. The fee covers all the services listed in your chosen package from start to filing."
}, {
    q: "Do I need to be physically present for consultations?",
    a: "No. All consultations are conducted via Zoom or phone call. You can work with us entirely remotely from anywhere in the U.S. or abroad."
}, {
    q: "How long does the immigration process take?",
    a: "Timelines vary based on the case type and USCIS processing times. After your consultation, we will provide an estimated timeline specific to your case and circumstances."
}, {
    q: "What if USCIS sends a Request for Evidence (RFE)?",
    a: "RFE response support is included in the Attorney Filing package. If you are on the Guidance package, we offer RFE support as an add-on service."
}, {
    q: "Is my information kept confidential?",
    a: "Absolutely. All client information is protected by attorney-client privilege and our strict data security practices. We use encrypted, GDPR-compliant systems for document storage."
}, {
    q: "What payment methods do you accept?",
    a: "We accept bank transfers, checks, and major credit cards. Payment details are collected securely and processed manually by our office team."
}];
function F1() {
    return g.jsx("section", {
        className: "py-20 px-6 lg:px-10 bg-white",
        style: {
            fontFamily: "'Inter', sans-serif"
        },
        children: g.jsxs("div", {
            className: "max-w-4xl mx-auto",
            children: [g.jsxs("div", {
                className: "text-center mb-12",
                children: [g.jsx("span", {
                    className: "inline-block px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-xs font-semibold uppercase tracking-widest mb-4",
                    children: "FAQ"
                }), g.jsx("h2", {
                    className: "text-3xl lg:text-4xl font-medium",
                    style: {
                        fontFamily: "'Playfair Display', serif",
                        color: "#1a2332"
                    },
                    children: "Common Questions"
                })]
            }), g.jsx("div", {
                className: "flex flex-col gap-4",
                children: K1.map( (i, l) => g.jsxs("details", {
                    className: "group rounded-xl border border-gray-100 bg-gray-50 overflow-hidden cursor-pointer",
                    children: [g.jsxs("summary", {
                        className: "flex items-center justify-between gap-4 p-5 list-none cursor-pointer",
                        children: [g.jsx("span", {
                            className: "text-sm font-semibold",
                            style: {
                                color: "#1a2332"
                            },
                            children: i.q
                        }), g.jsxs("div", {
                            className: "w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-full bg-white border border-gray-200",
                            children: [g.jsx("i", {
                                className: "ri-add-line text-gray-400 text-sm group-open:hidden"
                            }), g.jsx("i", {
                                className: "ri-subtract-line text-teal-500 text-sm hidden group-open:block"
                            })]
                        })]
                    }), g.jsx("div", {
                        className: "px-5 pb-5",
                        children: g.jsx("p", {
                            className: "text-sm text-gray-500 leading-relaxed",
                            children: i.a
                        })
                    })]
                }, l))
            })]
        })
    })
}
function J1() {
    return g.jsxs("div", {
        style: {
            fontFamily: "'Inter', sans-serif"
        },
        children: [g.jsx(Pu, {}), g.jsxs("section", {
            className: "relative pt-32 pb-20 px-6 lg:px-10 overflow-hidden",
            style: {
                background: "linear-gradient(135deg, #0d1623 0%, #1a2332 60%, #1e3a4a 100%)"
            },
            children: [g.jsx("div", {
                className: "absolute inset-0 opacity-10",
                children: g.jsx("img", {
                    alt: "Services background",
                    className: "w-full h-full object-cover object-top"
                })
            }), g.jsxs("div", {
                className: "relative z-10 max-w-7xl mx-auto",
                children: [g.jsxs("div", {
                    className: "flex items-center gap-2 mb-6",
                    children: [g.jsx(Me, {
                        to: "/",
                        className: "text-gray-400 text-xs hover:text-teal-400 transition-colors cursor-pointer",
                        children: "Home"
                    }), g.jsx("i", {
                        className: "ri-arrow-right-s-line text-gray-600 text-xs"
                    }), g.jsx("span", {
                        className: "text-teal-400 text-xs",
                        children: "Services & Pricing"
                    })]
                }), g.jsxs("div", {
                    className: "max-w-2xl",
                    children: [g.jsx("span", {
                        className: "inline-block px-4 py-1.5 rounded-full border border-teal-400/40 bg-teal-500/10 text-teal-300 text-xs font-semibold uppercase tracking-widest mb-5",
                        children: "Flat-Fee Immigration Services"
                    }), g.jsxs("h1", {
                        className: "text-4xl lg:text-5xl font-light text-white mb-5",
                        style: {
                            fontFamily: "'Playfair Display', serif"
                        },
                        children: ["Transparent Services &", g.jsx("br", {}), g.jsx("strong", {
                            className: "font-semibold",
                            style: {
                                color: "#14b8a6"
                            },
                            children: "Clear Pricing"
                        })]
                    }), g.jsx("p", {
                        className: "text-gray-300 text-base leading-relaxed mb-7 max-w-xl",
                        children: "Choose the service level that fits your needs. Every package is offered at a flat fee — you always know exactly what you pay before we begin."
                    }), g.jsxs(Me, {
                        to: "/consultation",
                        className: "whitespace-nowrap inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-400 transition-all cursor-pointer",
                        children: ["Book Free Consultation", g.jsx("i", {
                            className: "ri-arrow-right-line"
                        })]
                    })]
                })]
            })]
        }), g.jsxs("main", {
            children: [g.jsx(Q1, {}), g.jsx(Z1, {}), g.jsx(F1, {})]
        }), g.jsx("section", {
            className: "py-16 px-6 lg:px-10",
            style: {
                background: "#f7f9fc",
                fontFamily: "'Inter', sans-serif"
            },
            children: g.jsxs("div", {
                className: "max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl border border-gray-100 bg-white",
                children: [g.jsxs("div", {
                    children: [g.jsx("h3", {
                        className: "text-2xl font-semibold mb-2",
                        style: {
                            fontFamily: "'Playfair Display', serif",
                            color: "#1a2332"
                        },
                        children: "Not sure which package is right for you?"
                    }), g.jsx("p", {
                        className: "text-gray-500 text-sm",
                        children: "Book a free 15-minute consultation. We'll recommend the best option for your situation."
                    })]
                }), g.jsxs(Me, {
                    to: "/consultation",
                    className: "whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors cursor-pointer",
                    children: ["Book Free Consultation", g.jsx("i", {
                        className: "ri-arrow-right-line"
                    })]
                })]
            })
        }), g.jsx(ec, {})]
    })
}
const $1 = ["9:00 AM", "9:15 AM", "9:30 AM", "9:45 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"]
  , W1 = ["Attorney-Reviewed Guidance ($1,000–$1,500)", "Attorney Filing Service ($2,000–$2,500)", "Additional I-130 Petition (+$500)", "Expedited Processing (+$500)", "Not sure — need advice"];
function I1(i, l) {
    return new Date(i,l + 1,0).getDate()
}
function P1(i, l) {
    return new Date(i,l,1).getDay()
}
const As = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function e2() {
    const i = new Date
      , [l,r] = U.useState(i.getMonth())
      , [o,c] = U.useState(i.getFullYear())
      , [f,d] = U.useState(null)
      , [m,p] = U.useState(null)
      , [y,S] = U.useState(!1)
      , [v,w] = U.useState(!1)
      , [b,E] = U.useState({
        fullName: "",
        email: "",
        phone: "",
        service: "",
        message: ""
    })
      , A = I1(o, l)
      , N = P1(o, l)
      , D = () => {
        l === 0 ? (r(11),
        c(o - 1)) : r(l - 1),
        d(null),
        p(null)
    }
      , k = () => {
        l === 11 ? (r(0),
        c(o + 1)) : r(l + 1),
        d(null),
        p(null)
    }
      , G = J => {
        const Z = new Date(o,l,J)
          , ie = new Date(i.getFullYear(),i.getMonth(),i.getDate());
        return Z < ie
    }
      , $ = J => {
        const ie = new Date(o,l,J).getDay();
        return ie === 0 || ie === 6
    }
      , W = async J => {
        if (J.preventDefault(),
        !f || !m)
            return;
        w(!0);
        const Z = new URLSearchParams;
        Z.append("fullName", b.fullName),
        Z.append("email", b.email),
        Z.append("phone", b.phone),
        Z.append("service", b.service),
        Z.append("date", `${As[l]} ${f}, ${o}`),
        Z.append("time", m),
        Z.append("message", b.message);
        try {
            
                body: Z.toString()
            }),
            S(!0)
        } catch {
            S(!0)
        } finally {
            w(!1)
        }
    }
    ;
    return y ? g.jsxs("div", {
        className: "bg-white rounded-2xl border border-gray-100 p-10 text-center",
        children: [g.jsx("div", {
            className: "w-16 h-16 flex items-center justify-center rounded-full bg-teal-50 mx-auto mb-5",
            children: g.jsx("i", {
                className: "ri-checkbox-circle-line text-teal-500 text-3xl"
            })
        }), g.jsx("h3", {
            className: "text-2xl font-semibold mb-3",
            style: {
                fontFamily: "'Playfair Display', serif",
                color: "#1a2332"
            },
            children: "Consultation Booked!"
        }), g.jsxs("p", {
            className: "text-gray-500 text-sm leading-relaxed mb-6 max-w-xs mx-auto",
            children: ["Thank you, ", g.jsx("strong", {
                children: b.fullName
            }), ". We've received your request for", " ", g.jsxs("strong", {
                children: [As[l], " ", f]
            }), " at ", g.jsx("strong", {
                children: m
            }), ". We'll send a confirmation email within 1 business day."]
        }), g.jsx(Me, {
            to: "/",
            className: "whitespace-nowrap inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors cursor-pointer",
            children: "Back to Home"
        })]
    }) : g.jsxs("form", {
        
        onSubmit: W,
        className: "bg-white rounded-2xl border border-gray-100 overflow-hidden",
        children: [g.jsxs("div", {
            className: "p-6 border-b border-gray-100",
            children: [g.jsxs("div", {
                className: "flex items-center justify-between mb-5",
                children: [g.jsx("button", {
                    type: "button",
                    onClick: D,
                    className: "w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-teal-400 transition-colors cursor-pointer",
                    children: g.jsx("i", {
                        className: "ri-arrow-left-s-line text-gray-500"
                    })
                }), g.jsxs("p", {
                    className: "text-base font-semibold",
                    style: {
                        color: "#1a2332",
                        fontFamily: "'Playfair Display', serif"
                    },
                    children: [As[l], " ", o]
                }), g.jsx("button", {
                    type: "button",
                    onClick: k,
                    className: "w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-teal-400 transition-colors cursor-pointer",
                    children: g.jsx("i", {
                        className: "ri-arrow-right-s-line text-gray-500"
                    })
                })]
            }), g.jsx("div", {
                className: "grid grid-cols-7 mb-2",
                children: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(J => g.jsx("div", {
                    className: "text-center text-xs font-medium text-gray-400 py-1",
                    children: J
                }, J))
            }), g.jsxs("div", {
                className: "grid grid-cols-7 gap-1",
                children: [[...Array(N)].map( (J, Z) => g.jsx("div", {}, `empty-${Z}`)), [...Array(A)].map( (J, Z) => {
                    const ie = Z + 1
                      , we = G(ie)
                      , V = $(ie)
                      , Q = we || V
                      , F = f === ie;
                    return g.jsx("button", {
                        type: "button",
                        disabled: Q,
                        onClick: () => {
                            d(ie),
                            p(null)
                        }
                        ,
                        className: `aspect-square rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center ${Q ? "text-gray-200 cursor-not-allowed" : F ? "bg-teal-500 text-white" : "text-gray-600 hover:bg-teal-50 hover:text-teal-600"}`,
                        children: ie
                    }, ie)
                }
                )]
            })]
        }), f && g.jsxs("div", {
            className: "p-6 border-b border-gray-100",
            children: [g.jsxs("p", {
                className: "text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3",
                children: ["Available Times — ", As[l], " ", f]
            }), g.jsx("div", {
                className: "grid grid-cols-3 gap-2",
                children: $1.map(J => g.jsx("button", {
                    type: "button",
                    onClick: () => p(J),
                    className: `py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${m === J ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-100 text-gray-600 hover:border-teal-300 hover:text-teal-600"}`,
                    children: J
                }, J))
            })]
        }), g.jsxs("div", {
            className: "p-6",
            children: [g.jsx("p", {
                className: "text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4",
                children: "Your Details"
            }), g.jsxs("div", {
                className: "flex flex-col gap-4",
                children: [g.jsxs("div", {
                    children: [g.jsx("label", {
                        className: "block text-xs font-medium text-gray-600 mb-1.5",
                        children: "Full Name *"
                    }), g.jsx("input", {
                        name: "fullName",
                        type: "text",
                        required: !0,
                        value: b.fullName,
                        onChange: J => E({
                            ...b,
                            fullName: J.target.value
                        }),
                        className: "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors",
                        placeholder: "Jane Doe"
                    })]
                }), g.jsxs("div", {
                    className: "grid grid-cols-2 gap-3",
                    children: [g.jsxs("div", {
                        children: [g.jsx("label", {
                            className: "block text-xs font-medium text-gray-600 mb-1.5",
                            children: "Email Address *"
                        }), g.jsx("input", {
                            name: "email",
                            type: "email",
                            required: !0,
                            value: b.email,
                            onChange: J => E({
                                ...b,
                                email: J.target.value
                            }),
                            className: "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors",
                            placeholder: "jane@email.com"
                        })]
                    }), g.jsxs("div", {
                        children: [g.jsx("label", {
                            className: "block text-xs font-medium text-gray-600 mb-1.5",
                            children: "Phone Number"
                        }), g.jsx("input", {
                            name: "phone",
                            type: "tel",
                            value: b.phone,
                            onChange: J => E({
                                ...b,
                                phone: J.target.value
                            }),
                            className: "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors",
                            placeholder: "+1 (555) 000-0000"
                        })]
                    })]
                }), g.jsxs("div", {
                    children: [g.jsx("label", {
                        className: "block text-xs font-medium text-gray-600 mb-1.5",
                        children: "Service Interest"
                    }), g.jsxs("select", {
                        name: "service",
                        value: b.service,
                        onChange: J => E({
                            ...b,
                            service: J.target.value
                        }),
                        className: "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors bg-white cursor-pointer",
                        children: [g.jsx("option", {
                            value: "",
                            children: "Select a service..."
                        }), W1.map(J => g.jsx("option", {
                            value: J,
                            children: J
                        }, J))]
                    })]
                }), g.jsxs("div", {
                    children: [g.jsx("label", {
                        className: "block text-xs font-medium text-gray-600 mb-1.5",
                        children: "Brief Description of Your Case"
                    }), g.jsx("textarea", {
                        name: "message",
                        rows: 3,
                        maxLength: 500,
                        value: b.message,
                        onChange: J => E({
                            ...b,
                            message: J.target.value
                        }),
                        className: "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-teal-400 transition-colors resize-none",
                        placeholder: "Tell us a bit about your immigration situation..."
                    }), g.jsxs("p", {
                        className: "text-xs text-gray-400 mt-1 text-right",
                        children: [b.message.length, "/500"]
                    })]
                })]
            }), g.jsx("button", {
                type: "submit",
                disabled: !f || !m || !b.fullName || !b.email || v,
                className: "whitespace-nowrap mt-5 w-full py-3.5 rounded-full bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2",
                children: v ? g.jsxs(g.Fragment, {
                    children: [g.jsx("i", {
                        className: "ri-loader-4-line animate-spin"
                    }), " Confirming..."]
                }) : g.jsxs(g.Fragment, {
                    children: [g.jsx("i", {
                        className: "ri-calendar-check-line"
                    }), " Confirm Consultation"]
                })
            }), g.jsx("p", {
                className: "text-xs text-gray-400 text-center mt-3",
                children: "We'll confirm your slot via email within 1 business day."
            })]
        })]
    })
}
const t2 = [{
    icon: "ri-time-line",
    title: "15 Minutes",
    desc: "A focused call to understand your case and outline your options."
}, {
    icon: "ri-video-line",
    title: "Zoom or Phone",
    desc: "Meet remotely from anywhere. We'll send you a link or call you."
}, {
    icon: "ri-file-list-3-line",
    title: "No Prep Required",
    desc: "Just come with your questions. We’ll guide the conversation."
}, {
    icon: "ri-shield-check-line",
    title: "No Obligation",
    desc: "This is an informational call only. No commitment required."
}];
function n2() {
    return g.jsxs("div", {
        className: "rounded-2xl p-8 h-fit",
        style: {
            background: "#1a2332",
            fontFamily: "'Inter', sans-serif"
        },
        children: [g.jsx("span", {
            className: "inline-block px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-widest mb-5",
            children: "Free Consultation"
        }), g.jsx("h2", {
            className: "text-2xl font-medium text-white mb-3",
            style: {
                fontFamily: "'Playfair Display', serif"
            },
            children: "What to Expect"
        }), g.jsx("p", {
            className: "text-gray-400 text-sm leading-relaxed mb-7",
            children: "Our free consultation is your opportunity to get clarity on your immigration options. Speak with a team member who'll listen to your situation and help you find the best path forward."
        }), g.jsx("div", {
            className: "flex flex-col gap-4 mb-8",
            children: t2.map(i => g.jsxs("div", {
                className: "flex items-start gap-4",
                children: [g.jsx("div", {
                    className: "w-10 h-10 flex items-center justify-center rounded-xl bg-teal-500/20 flex-shrink-0",
                    children: g.jsx("i", {
                        className: `${i.icon} text-teal-400 text-base`
                    })
                }), g.jsxs("div", {
                    children: [g.jsx("p", {
                        className: "text-white text-sm font-semibold mb-0.5",
                        children: i.title
                    }), g.jsx("p", {
                        className: "text-gray-400 text-xs leading-relaxed",
                        children: i.desc
                    })]
                })]
            }, i.title))
        }), g.jsxs("div", {
            className: "border-t border-white/10 pt-6",
            children: [g.jsx("p", {
                className: "text-xs text-gray-500 uppercase tracking-widest mb-4",
                children: "Client Testimonial"
            }), g.jsx("div", {
                className: "flex gap-1 mb-2",
                children: [...Array(5)].map( (i, l) => g.jsx("i", {
                    className: "ri-star-fill text-amber-400 text-xs"
                }, l))
            }), g.jsx("p", {
                className: "text-gray-300 text-sm italic leading-relaxed mb-4",
                children: "“The consultation was incredibly helpful. They answered all my questions clearly and I felt confident moving forward right after the call.”"
            }), g.jsxs("div", {
                className: "flex items-center gap-3",
                children: [g.jsx("div", {
                    className: "w-8 h-8 flex items-center justify-center rounded-full bg-teal-500 text-white text-xs font-bold flex-shrink-0",
                    children: "JL"
                }), g.jsxs("div", {
                    children: [g.jsx("p", {
                        className: "text-white text-xs font-medium",
                        children: "James L."
                    }), g.jsx("p", {
                        className: "text-gray-500 text-xs",
                        children: "Philippines → U.S. Green Card"
                    })]
                })]
            })]
        }), g.jsxs("div", {
            className: "mt-6 pt-6 border-t border-white/10",
            children: [g.jsxs("div", {
                className: "flex items-center gap-2 mb-2",
                children: [g.jsx("i", {
                    className: "ri-phone-line text-teal-400 text-sm"
                }), g.jsx("a", {
                    href: "tel:+18005550190",
                    className: "text-white text-sm font-medium hover:text-teal-400 transition-colors cursor-pointer",
                    children: "+1 (800) 555-0190"
                })]
            }), g.jsx("p", {
                className: "text-gray-500 text-xs",
                children: "Mon–Fri, 9am–6pm Eastern Time"
            })]
        })]
    })
}
function a2() {
    return g.jsxs("div", {
        style: {
            fontFamily: "'Inter', sans-serif"
        },
        children: [g.jsx(Pu, {}), g.jsx("section", {
            className: "relative pt-32 pb-16 px-6 lg:px-10",
            style: {
                background: "linear-gradient(135deg, #0d1623 0%, #1a2332 60%, #1e3a4a 100%)"
            },
            children: g.jsxs("div", {
                className: "max-w-7xl mx-auto",
                children: [g.jsxs("div", {
                    className: "flex items-center gap-2 mb-5",
                    children: [g.jsx(Me, {
                        to: "/",
                        className: "text-gray-400 text-xs hover:text-teal-400 transition-colors cursor-pointer",
                        children: "Home"
                    }), g.jsx("i", {
                        className: "ri-arrow-right-s-line text-gray-600 text-xs"
                    }), g.jsx("span", {
                        className: "text-teal-400 text-xs",
                        children: "Consultation Booking"
                    })]
                }), g.jsxs("div", {
                    className: "text-center max-w-2xl mx-auto",
                    children: [g.jsx("span", {
                        className: "inline-block px-4 py-1.5 rounded-full border border-teal-400/40 bg-teal-500/10 text-teal-300 text-xs font-semibold uppercase tracking-widest mb-5",
                        children: "Free 15-Minute Call"
                    }), g.jsxs("h1", {
                        className: "text-4xl lg:text-5xl font-light text-white mb-4",
                        style: {
                            fontFamily: "'Playfair Display', serif"
                        },
                        children: ["Book Your", g.jsx("br", {}), g.jsx("strong", {
                            className: "font-semibold",
                            style: {
                                color: "#14b8a6"
                            },
                            children: "Free Consultation"
                        })]
                    }), g.jsx("p", {
                        className: "text-gray-300 text-base leading-relaxed",
                        children: "Select a date and time that works for you. We'll be in touch to confirm your slot and send you the meeting details."
                    })]
                })]
            })
        }), g.jsx("main", {
            className: "py-16 px-6 lg:px-10",
            style: {
                background: "#f7f9fc"
            },
            children: g.jsx("div", {
                className: "max-w-6xl mx-auto",
                children: g.jsxs("div", {
                    className: "grid lg:grid-cols-5 gap-8 items-start",
                    children: [g.jsx("div", {
                        className: "lg:col-span-2",
                        children: g.jsx(n2, {})
                    }), g.jsx("div", {
                        className: "lg:col-span-3",
                        children: g.jsx(e2, {})
                    })]
                })
            })
        }), g.jsx("section", {
            className: "py-12 px-6 lg:px-10 bg-white",
            style: {
                fontFamily: "'Inter', sans-serif"
            },
            children: g.jsxs("div", {
                className: "max-w-7xl mx-auto",
                children: [g.jsx("p", {
                    className: "text-center text-xs uppercase tracking-widest text-gray-400 mb-8",
                    children: "After Your Consultation"
                }), g.jsx("div", {
                    className: "grid md:grid-cols-4 gap-4",
                    children: [{
                        step: "01",
                        icon: "ri-price-tag-3-line",
                        title: "Select Package",
                        desc: "Choose your service level based on our recommendation."
                    }, {
                        step: "02",
                        icon: "ri-file-list-3-line",
                        title: "Complete Intake",
                        desc: "Fill out our secure questionnaire to start your case."
                    }, {
                        step: "03",
                        icon: "ri-folder-upload-line",
                        title: "Submit Documents",
                        desc: "Upload all required documents through the secure portal."
                    }, {
                        step: "04",
                        icon: "ri-checkbox-circle-line",
                        title: "Case Filed",
                        desc: "We prepare and file your case. You get confirmation."
                    }].map(i => g.jsxs("div", {
                        className: "flex flex-col items-center text-center p-6 rounded-xl border border-gray-100",
                        children: [g.jsx("div", {
                            className: "w-12 h-12 flex items-center justify-center rounded-full bg-teal-50 mb-4",
                            children: g.jsx("i", {
                                className: `${i.icon} text-teal-600 text-lg`
                            })
                        }), g.jsxs("span", {
                            className: "text-xs font-bold text-teal-500 uppercase tracking-widest mb-1",
                            children: ["Step ", i.step]
                        }), g.jsx("h4", {
                            className: "text-sm font-semibold mb-2",
                            style: {
                                color: "#1a2332"
                            },
                            children: i.title
                        }), g.jsx("p", {
                            className: "text-xs text-gray-400 leading-relaxed",
                            children: i.desc
                        })]
                    }, i.step))
                })]
            })
        }), g.jsx(ec, {})]
    })
}
const mp = [{
    path: "/",
    element: g.jsx(G1, {})
}, {
    path: "/services",
    element: g.jsx(J1, {})
}, {
    path: "/consultation",
    element: g.jsx(a2, {})
}, {
    path: "*",
    element: g.jsx(C1, {})
}]
  , l2 = Object.freeze(Object.defineProperty({
    __proto__: null,
    default: mp
}, Symbol.toStringTag, {
    value: "Module"
}));
let gp;
const i2 = new Promise(i => {
    gp = i
}
);
function pp() {
    const i = Mb(mp)
      , l = sp();
    return U.useEffect( () => {
        window.REACT_APP_NAVIGATE = l,
        gp(window.REACT_APP_NAVIGATE)
    }
    ),
    i
}
const s2 = Object.freeze(Object.defineProperty({
    __proto__: null,
    AppRoutes: pp,
    navigatePromise: i2
}, Symbol.toStringTag, {
    value: "Module"
}));
function r2() {
    return g.jsx(jv, {
        i18n: tt,
        children: g.jsx(g1, {
            basename: "/preview/1cc2edc0-ff54-4d53-b605-fd14dff6b00e/7632986",
            children: g.jsx(pp, {})
        })
    })
}
Jv.createRoot(document.getElementById("root")).render(g.jsx(U.StrictMode, {
    children: g.jsx(r2, {})
}));
//# sourceMappingURL=index-OysJQMGl.js.map
