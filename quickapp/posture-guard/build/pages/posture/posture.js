export default function(global, globalThis, window, $app_exports$, $app_evaluate$) {
    var org_app_require = $app_require$;
    (function(global, globalThis, window, $app_exports$, $app_evaluate$) {
        var setTimeout = global.setTimeout;
        var setInterval = global.setInterval;
        var clearTimeout = global.clearTimeout;
        var clearInterval = global.clearInterval;
        var $app_require$1 = global.$app_require$ || org_app_require;
        var createPageHandler = function() {
            return (()=>{
                var __webpack_modules__ = {
                    "./src/lib/posture-detector.js" (__unused_rspack_module, exports) {
                        "use strict";
                        Object.defineProperty(exports, "__esModule", {
                            value: true
                        });
                        exports["default"] = exports.POSTURE_TYPE = exports.POSTURE_NAME = void 0;
                        const POSTURE_TYPE = exports.POSTURE_TYPE = {
                            NORMAL: 'normal',
                            SEDENTARY: 'sedentary',
                            HEAD_TILT: 'head_tilt',
                            LEG_CROSS: 'leg_cross'
                        };
                        const POSTURE_NAME = exports.POSTURE_NAME = {
                            [POSTURE_TYPE.NORMAL]: '正常',
                            [POSTURE_TYPE.SEDENTARY]: '久坐',
                            [POSTURE_TYPE.HEAD_TILT]: '低头前倾',
                            [POSTURE_TYPE.LEG_CROSS]: '跷二郎腿'
                        };
                        class PostureDetector {
                            constructor(options = {}){
                                this.windowSize = options.windowSize || 100;
                                this.sedentaryThreshold = options.sedentaryThreshold || 1800000;
                                this.buffer = [];
                                this.sitStartTime = null;
                                this.todaySedentaryMs = 0;
                                this.lastDetectTime = 0;
                                this.onDetect = null;
                                this.onStateChange = null;
                            }
                            input(sample) {
                                const now = Date.now();
                                if (now - this.lastDetectTime < 200) return null;
                                this.lastDetectTime = now;
                                this.buffer.push({
                                    x: sample.x,
                                    y: sample.y,
                                    z: sample.z,
                                    t: now
                                });
                                if (this.buffer.length > this.windowSize) this.buffer.shift();
                                if (this.buffer.length < 20) return {
                                    type: POSTURE_TYPE.NORMAL,
                                    confidence: 1.0,
                                    detail: '数据采集中'
                                };
                                const result = this._detect();
                                if (this.onDetect) this.onDetect(result);
                                return result;
                            }
                            _detect() {
                                const buffer = this.buffer;
                                const sedentaryResult = this._detectSedentary(buffer);
                                if (sedentaryResult.type === POSTURE_TYPE.SEDENTARY) return sedentaryResult;
                                const headTiltResult = this._detectHeadTilt(buffer);
                                if (headTiltResult.type === POSTURE_TYPE.HEAD_TILT) return headTiltResult;
                                const legCrossResult = this._detectLegCross(buffer);
                                if (legCrossResult.type === POSTURE_TYPE.LEG_CROSS) return legCrossResult;
                                this.sitStartTime = null;
                                return {
                                    type: POSTURE_TYPE.NORMAL,
                                    confidence: 1.0,
                                    detail: '体态正常'
                                };
                            }
                            _detectSedentary(buffer) {
                                const variance = this._calcVariance(buffer);
                                const now = Date.now();
                                const VARIANCE_THRESHOLD = 0.01;
                                if (variance < VARIANCE_THRESHOLD) {
                                    if (!this.sitStartTime) this.sitStartTime = now;
                                    const sedentaryDuration = now - this.sitStartTime;
                                    if (sedentaryDuration > this.sedentaryThreshold) return {
                                        type: POSTURE_TYPE.SEDENTARY,
                                        confidence: Math.min(0.95, 0.7 + sedentaryDuration / (5 * this.sedentaryThreshold)),
                                        detail: `已静坐 ${Math.floor(sedentaryDuration / 60000)} 分钟`
                                    };
                                } else {
                                    if (this.sitStartTime) this.todaySedentaryMs += now - this.sitStartTime;
                                    this.sitStartTime = null;
                                }
                                return {
                                    type: POSTURE_TYPE.NORMAL,
                                    confidence: 1.0,
                                    detail: ''
                                };
                            }
                            _detectHeadTilt(buffer) {
                                const avgZ = this._calcAxisMean(buffer, 'z');
                                const variance = this._calcVariance(buffer);
                                if (variance > 0.05) return {
                                    type: POSTURE_TYPE.NORMAL,
                                    confidence: 1.0,
                                    detail: ''
                                };
                                const HEAD_TILT_Z_MIN = -0.95;
                                const HEAD_TILT_Z_MAX = -0.5;
                                if (avgZ > HEAD_TILT_Z_MIN && avgZ < HEAD_TILT_Z_MAX) {
                                    const severity = (avgZ - HEAD_TILT_Z_MIN) / (HEAD_TILT_Z_MAX - HEAD_TILT_Z_MIN);
                                    return {
                                        type: POSTURE_TYPE.HEAD_TILT,
                                        confidence: Math.min(0.85, 0.5 + 0.35 * severity),
                                        detail: `低头前倾 ${(100 * severity).toFixed(0)}%`
                                    };
                                }
                                return {
                                    type: POSTURE_TYPE.NORMAL,
                                    confidence: 1.0,
                                    detail: ''
                                };
                            }
                            _detectLegCross(buffer) {
                                const avgX = this._calcAxisMean(buffer, 'x');
                                const variance = this._calcVariance(buffer);
                                if (variance < 0.005 || variance > 0.1) return {
                                    type: POSTURE_TYPE.NORMAL,
                                    confidence: 1.0,
                                    detail: ''
                                };
                                const X_OFFSET_THRESHOLD = 0.25;
                                const hasXOffset = Math.abs(avgX) > X_OFFSET_THRESHOLD;
                                const hasYOscillation = this._detectPeriodicOscillation(buffer, 'y');
                                if (hasXOffset && hasYOscillation) return {
                                    type: POSTURE_TYPE.LEG_CROSS,
                                    confidence: 0.65,
                                    detail: '疑似跷二郎腿'
                                };
                                return {
                                    type: POSTURE_TYPE.NORMAL,
                                    confidence: 1.0,
                                    detail: ''
                                };
                            }
                            _calcVariance(buffer) {
                                const n = buffer.length;
                                if (n < 2) return 0;
                                let sum = 0;
                                for(let i = 0; i < n; i++){
                                    const s = buffer[i];
                                    const magnitude = Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
                                    sum += magnitude;
                                }
                                const mean = sum / n;
                                let variance = 0;
                                for(let i = 0; i < n; i++){
                                    const s = buffer[i];
                                    const magnitude = Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
                                    variance += (magnitude - mean) * (magnitude - mean);
                                }
                                return variance / n;
                            }
                            _calcAxisMean(buffer, axis) {
                                const n = buffer.length;
                                if (0 === n) return 0;
                                let sum = 0;
                                for(let i = 0; i < n; i++)sum += buffer[i][axis];
                                return sum / n;
                            }
                            _detectPeriodicOscillation(buffer, axis) {
                                const n = buffer.length;
                                if (n < 30) return false;
                                let signChanges = 0;
                                for(let i = 1; i < n; i++)if (buffer[i][axis] >= 0 && buffer[i - 1][axis] < 0 || buffer[i][axis] < 0 && buffer[i - 1][axis] >= 0) signChanges++;
                                const changeRate = signChanges / n;
                                return changeRate > 0.1 && changeRate < 0.5;
                            }
                            getTodaySedentaryMs() {
                                let total = this.todaySedentaryMs;
                                if (this.sitStartTime) total += Date.now() - this.sitStartTime;
                                return total;
                            }
                            resetDailyStats() {
                                this.todaySedentaryMs = 0;
                                this.sitStartTime = null;
                            }
                            static getPostureName(type) {
                                return POSTURE_NAME[type] || '未知';
                            }
                        }
                        var _default = exports["default"] = PostureDetector;
                    }
                };
                var __webpack_module_cache__ = {};
                function __webpack_require__(moduleId) {
                    var cachedModule = __webpack_module_cache__[moduleId];
                    if (void 0 !== cachedModule) return cachedModule.exports;
                    var module = __webpack_module_cache__[moduleId] = {
                        exports: {}
                    };
                    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
                    return module.exports;
                }
                (()=>{
                    __webpack_require__.rv = ()=>"1.7.12";
                })();
                (()=>{
                    __webpack_require__.ruid = "bundler=rspack@1.7.12";
                })();
                var __webpack_exports__ = {};
                (()=>{
                    var $app_style$ = [
                        [
                            [
                                [
                                    0,
                                    "page"
                                ]
                            ],
                            {
                                flexDirection: "column",
                                alignItems: "center",
                                width: "480px",
                                height: "480px",
                                backgroundColor: "#0a0a0a"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "header"
                                ]
                            ],
                            {
                                width: "100%",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingTop: "15px",
                                paddingRight: "20px",
                                paddingBottom: "15px",
                                paddingLeft: "20px",
                                marginTop: "15px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "back-btn"
                                ]
                            ],
                            {
                                fontSize: "32px",
                                color: "#ffffff",
                                width: "40px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "title"
                                ]
                            ],
                            {
                                fontSize: "24px",
                                color: "#ffffff",
                                fontWeight: "bold"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-dot"
                                ]
                            ],
                            {
                                width: "12px",
                                height: "12px",
                                borderRadius: "6px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-dot"
                                ],
                                [
                                    0,
                                    "active"
                                ]
                            ],
                            {
                                backgroundColor: "#00d4aa"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-dot"
                                ],
                                [
                                    0,
                                    "inactive"
                                ]
                            ],
                            {
                                backgroundColor: "#666666"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "chart-section"
                                ]
                            ],
                            {
                                width: "420px",
                                paddingTop: "15px",
                                paddingRight: "15px",
                                paddingBottom: "15px",
                                paddingLeft: "15px",
                                backgroundColor: "#1a1a2e",
                                borderRadius: "12px",
                                marginTop: "10px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "section-title"
                                ]
                            ],
                            {
                                fontSize: "18px",
                                color: "#888888",
                                marginBottom: "10px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "chart-wrap"
                                ]
                            ],
                            {
                                width: "390px",
                                height: "120px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "chart"
                                ]
                            ],
                            {
                                width: "390px",
                                height: "120px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "axis-legend"
                                ]
                            ],
                            {
                                flexDirection: "row",
                                justifyContent: "center",
                                marginTop: "8px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "legend-item"
                                ]
                            ],
                            {
                                fontSize: "14px",
                                marginTop: "0",
                                marginRight: "10px",
                                marginBottom: "0",
                                marginLeft: "10px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-section"
                                ]
                            ],
                            {
                                width: "420px",
                                marginTop: "12px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-card"
                                ]
                            ],
                            {
                                flexDirection: "row",
                                alignItems: "center",
                                paddingTop: "15px",
                                paddingRight: "20px",
                                paddingBottom: "15px",
                                paddingLeft: "20px",
                                borderRadius: "12px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-normal"
                                ]
                            ],
                            {
                                backgroundColor: "#1a2e1a",
                                borderTopColor: "#00d4aa",
                                borderRightColor: "#00d4aa",
                                borderBottomColor: "#00d4aa",
                                borderLeftColor: "#00d4aa",
                                borderStyle: "solid",
                                borderTopWidth: "1px",
                                borderRightWidth: "1px",
                                borderBottomWidth: "1px",
                                borderLeftWidth: "1px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-warning"
                                ]
                            ],
                            {
                                backgroundColor: "#2e1a1a",
                                borderTopColor: "#ff6b6b",
                                borderRightColor: "#ff6b6b",
                                borderBottomColor: "#ff6b6b",
                                borderLeftColor: "#ff6b6b",
                                borderStyle: "solid",
                                borderTopWidth: "1px",
                                borderRightWidth: "1px",
                                borderBottomWidth: "1px",
                                borderLeftWidth: "1px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-icon"
                                ]
                            ],
                            {
                                fontSize: "36px",
                                marginRight: "15px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-info"
                                ]
                            ],
                            {
                                flexDirection: "column"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-type"
                                ]
                            ],
                            {
                                fontSize: "22px",
                                color: "#ffffff",
                                fontWeight: "bold"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-detail"
                                ]
                            ],
                            {
                                fontSize: "16px",
                                color: "#888888",
                                marginTop: "4px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "stats-section"
                                ]
                            ],
                            {
                                width: "420px",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginTop: "12px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "stat-card"
                                ]
                            ],
                            {
                                width: "130px",
                                paddingTop: "12px",
                                paddingRight: "12px",
                                paddingBottom: "12px",
                                paddingLeft: "12px",
                                backgroundColor: "#1a1a2e",
                                borderRadius: "10px",
                                flexDirection: "column",
                                alignItems: "center"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "stat-label"
                                ]
                            ],
                            {
                                fontSize: "14px",
                                color: "#888888"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "stat-value"
                                ]
                            ],
                            {
                                fontSize: "28px",
                                color: "#ffffff",
                                fontWeight: "bold",
                                marginTop: "6px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "stat-unit"
                                ]
                            ],
                            {
                                fontSize: "14px",
                                color: "#888888",
                                fontWeight: "normal"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "control-section"
                                ]
                            ],
                            {
                                marginTop: "15px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "btn"
                                ]
                            ],
                            {
                                width: "200px",
                                height: "50px",
                                borderRadius: "25px",
                                justifyContent: "center",
                                alignItems: "center"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "btn-start"
                                ]
                            ],
                            {
                                backgroundColor: "#00d4aa"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "btn-stop"
                                ]
                            ],
                            {
                                backgroundColor: "#ff6b6b"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "btn-text"
                                ]
                            ],
                            {
                                fontSize: "18px",
                                color: "#ffffff",
                                fontWeight: "bold"
                            }
                        ]
                    ];
                    var $app_script$ = function __scriptModule__(module, exports, $app_require$1) {
                        "use strict";
                        Object.defineProperty(exports, "__esModule", {
                            value: true
                        });
                        exports.default = void 0;
                        var _system = _interopRequireDefault($app_require$1("@app-module/system.sensor"));
                        var _system2 = _interopRequireDefault($app_require$1("@app-module/system.vibrator"));
                        var _system3 = _interopRequireDefault($app_require$1("@app-module/system.prompt"));
                        var _postureDetector = _interopRequireWildcard(__webpack_require__("./src/lib/posture-detector.js"));
                        function _interopRequireDefault(e) {
                            return e && e.__esModule ? e : {
                                default: e
                            };
                        }
                        function ownKeys(e, r) {
                            var t = Object.keys(e);
                            if (Object.getOwnPropertySymbols) {
                                var o = Object.getOwnPropertySymbols(e);
                                r && (o = o.filter(function(r) {
                                    return Object.getOwnPropertyDescriptor(e, r).enumerable;
                                })), t.push.apply(t, o);
                            }
                            return t;
                        }
                        function _objectSpread(e) {
                            for(var r = 1; r < arguments.length; r++){
                                var t = null != arguments[r] ? arguments[r] : {};
                                r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
                                    _defineProperty(e, r, t[r]);
                                }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
                                    Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
                                });
                            }
                            return e;
                        }
                        function _defineProperty(e, r, t) {
                            return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
                                value: t,
                                enumerable: !0,
                                configurable: !0,
                                writable: !0
                            }) : e[r] = t, e;
                        }
                        function _toPropertyKey(t) {
                            var i = _toPrimitive(t, "string");
                            return "symbol" == typeof i ? i : i + "";
                        }
                        function _toPrimitive(t, r) {
                            if ("object" != typeof t || !t) return t;
                            var e = t[Symbol.toPrimitive];
                            if (void 0 !== e) {
                                var i = e.call(t, r || "default");
                                if ("object" != typeof i) return i;
                                throw new TypeError("@@toPrimitive must return a primitive value.");
                            }
                            return ("string" === r ? String : Number)(t);
                        }
                        function _interopRequireWildcard(e, t) {
                            if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap();
                            return (_interopRequireWildcard = function(e, t) {
                                if (!t && e && e.__esModule) return e;
                                var o, i, f = {
                                    __proto__: null,
                                    default: e
                                };
                                if (null === e || "object" != typeof e && "function" != typeof e) return f;
                                if (o = t ? n : r) {
                                    if (o.has(e)) return o.get(e);
                                    o.set(e, f);
                                }
                                for(const t in e)"default" !== t && ({}).hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);
                                return f;
                            })(e, t);
                        }
                        var _default = exports.default = {
                            private: {
                                monitorActive: false,
                                postureIcon: '😊',
                                postureType: '正常',
                                postureDetail: '等待监测数据...',
                                statusClass: 'status-normal',
                                sedentaryMin: 0,
                                alertCount: 0,
                                activityCount: 0,
                                chartData: [
                                    {
                                        strokeColor: '#ff6b6b',
                                        data: []
                                    },
                                    {
                                        strokeColor: '#4ecdc4',
                                        data: []
                                    },
                                    {
                                        strokeColor: '#45b7d1',
                                        data: []
                                    }
                                ],
                                chartOpts: {
                                    xAxis: {
                                        min: 0,
                                        max: 59,
                                        display: false,
                                        axisTick: 60
                                    },
                                    yAxis: {
                                        min: -20,
                                        max: 20,
                                        display: false,
                                        axisTick: 21
                                    },
                                    series: {
                                        lineStyle: {
                                            width: '1px'
                                        }
                                    }
                                },
                                detector: null,
                                sampleIndex: 0,
                                maxSamples: 60
                            },
                            onReady () {
                                this.detector = new _postureDetector.default({
                                    sedentaryThreshold: 1800000
                                });
                                this.detector.onDetect = (result)=>{
                                    this._updateStatus(result);
                                };
                            },
                            onDestroy () {
                                this._stopMonitor();
                            },
                            back (event) {
                                if (!event || 'right' === event.direction) {
                                    this._stopMonitor();
                                    Promise.resolve().then(()=>_interopRequireWildcard($app_require$1("@app-module/system.router"))).then((router)=>{
                                        router.back();
                                    });
                                }
                            },
                            toggleMonitor () {
                                if (this.monitorActive) this._stopMonitor();
                                else this._startMonitor();
                            },
                            _startMonitor () {
                                _system.default.subscribeAccelerometer({
                                    callback: (data)=>{
                                        this._onData(data);
                                    },
                                    fail: (data, code)=>{
                                        console.error('[Posture] subscribe fail:', code);
                                        _system3.default.showToast({
                                            message: '传感器订阅失败'
                                        });
                                    }
                                });
                                this.monitorActive = true;
                                _system3.default.showToast({
                                    message: '监测已开启'
                                });
                            },
                            _stopMonitor () {
                                _system.default.unsubscribeAccelerometer();
                                this.monitorActive = false;
                            },
                            _onData (data) {
                                this._updateChart(data);
                                const result = this.detector.input({
                                    x: data.x,
                                    y: data.y,
                                    z: data.z
                                });
                                if (result) this._updateStatus(result);
                            },
                            _updateChart (data) {
                                const idx = this.sampleIndex % this.maxSamples;
                                const scaleX = Math.round(10 * data.x);
                                const scaleY = Math.round(10 * data.y);
                                const scaleZ = Math.round(10 * data.z);
                                this.chartData[0].data[idx] = scaleX;
                                this.chartData[1].data[idx] = scaleY;
                                this.chartData[2].data[idx] = scaleZ;
                                this.chartData = [
                                    _objectSpread(_objectSpread({}, this.chartData[0]), {}, {
                                        data: [
                                            ...this.chartData[0].data
                                        ]
                                    }),
                                    _objectSpread(_objectSpread({}, this.chartData[1]), {}, {
                                        data: [
                                            ...this.chartData[1].data
                                        ]
                                    }),
                                    _objectSpread(_objectSpread({}, this.chartData[2]), {}, {
                                        data: [
                                            ...this.chartData[2].data
                                        ]
                                    })
                                ];
                                this.sampleIndex++;
                            },
                            _updateStatus (result) {
                                this.postureIcon = this._getIcon(result.type);
                                this.postureType = _postureDetector.default.getPostureName(result.type);
                                this.postureDetail = result.detail || '检测中...';
                                if (result.type === _postureDetector.POSTURE_TYPE.NORMAL) {
                                    this.statusClass = 'status-normal';
                                    this.activityCount++;
                                } else {
                                    this.statusClass = 'status-warning';
                                    this.alertCount++;
                                    _system2.default.vibrate({
                                        mode: 'long'
                                    });
                                }
                                this.sedentaryMin = Math.round(this.detector.getTodaySedentaryMs() / 60000);
                            },
                            _getIcon (type) {
                                const icons = {
                                    [_postureDetector.POSTURE_TYPE.NORMAL]: '😊',
                                    [_postureDetector.POSTURE_TYPE.SEDENTARY]: '🪑',
                                    [_postureDetector.POSTURE_TYPE.HEAD_TILT]: '📱',
                                    [_postureDetector.POSTURE_TYPE.LEG_CROSS]: '🦵'
                                };
                                return icons[type] || '❓';
                            }
                        };
                        const moduleOwn = exports.default || module.exports;
                        const accessors = [
                            'public',
                            'protected',
                            'private'
                        ];
                        if (moduleOwn.data && accessors.some(function(acc) {
                            return moduleOwn[acc];
                        })) throw new Error('页面VM对象中的属性data不可与"' + accessors.join(',') + '"同时存在，请使用private替换data名称');
                        if (!moduleOwn.data) {
                            moduleOwn.data = {};
                            moduleOwn._descriptor = {};
                            accessors.forEach(function(acc) {
                                const accType = typeof moduleOwn[acc];
                                if ('object' === accType) {
                                    moduleOwn.data = Object.assign(moduleOwn.data, moduleOwn[acc]);
                                    for(const name in moduleOwn[acc])moduleOwn._descriptor[name] = {
                                        access: acc
                                    };
                                } else if ('function' === accType) console.warn('页面VM对象中的属性' + acc + '的值不能是函数，请使用对象');
                            });
                        }
                    };
                    var $app_template$ = function(vm) {
                        const _vm_ = vm || this;
                        return aiot.__ce__("div", {
                            __vm__: _vm_,
                            __opts__: {
                                classList: [
                                    "page"
                                ],
                                events: {
                                    swipe: function(evt) {
                                        return _vm_.back(evt);
                                    }
                                }
                            }
                        }, [
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "header"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "back-btn"
                                        ],
                                        events: {
                                            click: function(evt) {
                                                return _vm_.back(evt);
                                            }
                                        },
                                        value: "‹"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "title"
                                        ],
                                        value: "体态监测"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: function() {
                                            const $classValue$ = "status-dot " + (_vm_.monitorActive ? "active" : "inactive");
                                            if ('string' == typeof $classValue$) return $classValue$.split(' ').map((item)=>item.trim()).filter(Boolean);
                                            return $classValue$;
                                        }
                                    }
                                }, [])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "chart-section"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "section-title"
                                        ],
                                        value: "加速度波形"
                                    }
                                }, []),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "chart-wrap"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("chart", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "chart"
                                            ],
                                            type: "line",
                                            options: function() {
                                                return _vm_.chartOpts;
                                            },
                                            datasets: function() {
                                                return _vm_.chartData;
                                            }
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "axis-legend"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "legend-item"
                                            ],
                                            style: {
                                                color: "#ff6b6b"
                                            },
                                            value: "● X轴"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "legend-item"
                                            ],
                                            style: {
                                                color: "#4ecdc4"
                                            },
                                            value: "● Y轴"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "legend-item"
                                            ],
                                            style: {
                                                color: "#45b7d1"
                                            },
                                            value: "● Z轴"
                                        }
                                    }, [])
                                ])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "status-section"
                                    ]
                                }
                            }, [
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: function() {
                                            const $classValue$ = "status-card " + _vm_.statusClass;
                                            if ('string' == typeof $classValue$) return $classValue$.split(' ').map((item)=>item.trim()).filter(Boolean);
                                            return $classValue$;
                                        }
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "status-icon"
                                            ],
                                            value: function() {
                                                return _vm_.postureIcon;
                                            }
                                        }
                                    }, []),
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "status-info"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "status-type"
                                                ],
                                                value: function() {
                                                    return _vm_.postureType;
                                                }
                                            }
                                        }, []),
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "status-detail"
                                                ],
                                                value: function() {
                                                    return _vm_.postureDetail;
                                                }
                                            }
                                        }, [])
                                    ])
                                ])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "stats-section"
                                    ]
                                }
                            }, [
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "stat-card"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-label"
                                            ],
                                            value: "久坐时长"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-value"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("span", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                value: function() {
                                                    return _vm_.sedentaryMin;
                                                }
                                            }
                                        }),
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "stat-unit"
                                                ],
                                                value: "分钟"
                                            }
                                        }, [])
                                    ])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "stat-card"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-label"
                                            ],
                                            value: "异常次数"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-value"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("span", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                value: function() {
                                                    return _vm_.alertCount;
                                                }
                                            }
                                        }),
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "stat-unit"
                                                ],
                                                value: "次"
                                            }
                                        }, [])
                                    ])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "stat-card"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-label"
                                            ],
                                            value: "活动次数"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-value"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("span", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                value: function() {
                                                    return _vm_.activityCount;
                                                }
                                            }
                                        }),
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "stat-unit"
                                                ],
                                                value: "次"
                                            }
                                        }, [])
                                    ])
                                ])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "control-section"
                                    ]
                                }
                            }, [
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: function() {
                                            const $classValue$ = "btn " + (_vm_.monitorActive ? "btn-stop" : "btn-start");
                                            if ('string' == typeof $classValue$) return $classValue$.split(' ').map((item)=>item.trim()).filter(Boolean);
                                            return $classValue$;
                                        },
                                        events: {
                                            click: function(evt) {
                                                return _vm_.toggleMonitor(evt);
                                            }
                                        }
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "btn-text"
                                            ],
                                            value: function() {
                                                return _vm_.monitorActive ? "\u6682\u505C\u76D1\u6D4B" : "\u5F00\u59CB\u76D1\u6D4B";
                                            }
                                        }
                                    }, [])
                                ])
                            ])
                        ]);
                    };
                    $app_exports$['entry'] = function($app_exports$) {
                        $app_script$({}, $app_exports$, $app_require$1);
                        $app_exports$.default.template = $app_template$;
                        $app_exports$.default.style = $app_style$;
                    };
                })();
            })();
        };
        return createPageHandler();
    })(global, globalThis, window, $app_exports$, $app_evaluate$);
}

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZXMvcG9zdHVyZS9wb3N0dXJlLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcG9zdHVyZS1ndWFyZC9zcmMvbGliL3Bvc3R1cmUtZGV0ZWN0b3IuanMiLCJ3ZWJwYWNrOi8vcG9zdHVyZS1ndWFyZC93ZWJwYWNrL3J1bnRpbWUvcnNwYWNrX3ZlcnNpb24iLCJ3ZWJwYWNrOi8vcG9zdHVyZS1ndWFyZC93ZWJwYWNrL3J1bnRpbWUvcnNwYWNrX3VuaXF1ZV9pZCIsIndlYnBhY2s6Ly9wb3N0dXJlLWd1YXJkL3NyYy9wYWdlcy9wb3N0dXJlL3Bvc3R1cmUudXgiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBwb3N0dXJlLWRldGVjdG9yLmpzIC0g56uv5L6nQUnkvZPmgIHor4bliKvnrpfms5VcbiAqXG4gKiDln7rkuo7liqDpgJ/luqborqHkuInovbTmlbDmja7nmoTovbvph4/ljJbml7bluo/liIbmnpDvvJpcbiAqIC0g5LmF5Z2Q5qOA5rWL77ya5Yqg6YCf5bqm5pa55beu5p6B5L2OICsg5oyB57ut5pe26Ze0XG4gKiAtIOS9juWktOWJjeWAvuajgOa1i++8mnrovbTph43lipvliIbph4/lvILluLhcbiAqIC0g6Le35LqM6YOO6IW/5qOA5rWL77yaeOi9tOWBj+enuyArIHnovbTlkajmnJ/mgKflvq7mjK9cbiAqXG4gKiDnrpfms5XnibnngrnvvJpcbiAqIC0g57qv6KeE5YiZ5byV5pOO77yM5peg6ZyA56We57uP572R57uc5o6o55CGXG4gKiAtIOa7keWKqOeql+WPo+e7n+iuoe+8iDLnp5Lnqpflj6PvvIx+MTAw5qC35pys77yJXG4gKiAtIOS9juWKn+iAl++8muS7heWcqOmHh+agt+aXtuiuoeeul1xuICovXG5cbi8vIOS9k+aAgeexu+Wei+W4uOmHj1xuY29uc3QgUE9TVFVSRV9UWVBFID0ge1xuICBOT1JNQUw6ICdub3JtYWwnLFxuICBTRURFTlRBUlk6ICdzZWRlbnRhcnknLCAgICAgICAvLyDkuYXlnZBcbiAgSEVBRF9USUxUOiAnaGVhZF90aWx0JywgICAgICAgLy8g5L2O5aS05YmN5YC+XG4gIExFR19DUk9TUzogJ2xlZ19jcm9zcycsICAgICAgIC8vIOi3t+S6jOmDjuiFv1xufVxuXG4vLyDkvZPmgIHnsbvlnovkuK3mloflkI1cbmNvbnN0IFBPU1RVUkVfTkFNRSA9IHtcbiAgW1BPU1RVUkVfVFlQRS5OT1JNQUxdOiAn5q2j5bi4JyxcbiAgW1BPU1RVUkVfVFlQRS5TRURFTlRBUlldOiAn5LmF5Z2QJyxcbiAgW1BPU1RVUkVfVFlQRS5IRUFEX1RJTFRdOiAn5L2O5aS05YmN5YC+JyxcbiAgW1BPU1RVUkVfVFlQRS5MRUdfQ1JPU1NdOiAn6Le35LqM6YOO6IW/Jyxcbn1cblxuY2xhc3MgUG9zdHVyZURldGVjdG9yIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgLy8g5ruR5Yqo56qX5Y+j5aSn5bCP77yI5qC35pys5pWw77yJXG4gICAgdGhpcy53aW5kb3dTaXplID0gb3B0aW9ucy53aW5kb3dTaXplIHx8IDEwMFxuICAgIC8vIOS5heWdkOaPkOmGkumYiOWAvO+8iOavq+enku+8ie+8jOm7mOiupDMw5YiG6ZKfXG4gICAgdGhpcy5zZWRlbnRhcnlUaHJlc2hvbGQgPSBvcHRpb25zLnNlZGVudGFyeVRocmVzaG9sZCB8fCAzMCAqIDYwICogMTAwMFxuICAgIC8vIOaVsOaNrue8k+WGsuWMulxuICAgIHRoaXMuYnVmZmVyID0gW11cbiAgICAvLyDkuYXlnZDotbflp4vml7bpl7RcbiAgICB0aGlzLnNpdFN0YXJ0VGltZSA9IG51bGxcbiAgICAvLyDku4rml6XkuYXlnZDmgLvml7bplb/vvIjmr6vnp5LvvIlcbiAgICB0aGlzLnRvZGF5U2VkZW50YXJ5TXMgPSAwXG4gICAgLy8g5LiK5qyh5qOA5rWL5pe26Ze0XG4gICAgdGhpcy5sYXN0RGV0ZWN0VGltZSA9IDBcbiAgICAvLyDmo4DmtYvnu5Pmnpzlm57osINcbiAgICB0aGlzLm9uRGV0ZWN0ID0gbnVsbFxuICAgIC8vIOeKtuaAgeWPmOabtOWbnuiwg1xuICAgIHRoaXMub25TdGF0ZUNoYW5nZSA9IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiDovpPlhaXliqDpgJ/luqborqHmoLfmnKzmlbDmja5cbiAgICogQHBhcmFtIHtPYmplY3R9IHNhbXBsZSAtIHsgeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciB9XG4gICAqIEByZXR1cm5zIHtPYmplY3R9IOajgOa1i+e7k+aenCB7IHR5cGUsIGNvbmZpZGVuY2UsIGRldGFpbCB9XG4gICAqL1xuICBpbnB1dChzYW1wbGUpIHtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG4gICAgLy8g5o6n5Yi25qOA5rWL6aKR546H77yM5pyA5aSa5q+PMjAwbXPmo4DmtYvkuIDmrKFcbiAgICBpZiAobm93IC0gdGhpcy5sYXN0RGV0ZWN0VGltZSA8IDIwMCkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgdGhpcy5sYXN0RGV0ZWN0VGltZSA9IG5vd1xuXG4gICAgLy8g5re75Yqg5Yiw5ruR5Yqo56qX5Y+jXG4gICAgdGhpcy5idWZmZXIucHVzaCh7XG4gICAgICB4OiBzYW1wbGUueCxcbiAgICAgIHk6IHNhbXBsZS55LFxuICAgICAgejogc2FtcGxlLnosXG4gICAgICB0OiBub3csXG4gICAgfSlcbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoID4gdGhpcy53aW5kb3dTaXplKSB7XG4gICAgICB0aGlzLmJ1ZmZlci5zaGlmdCgpXG4gICAgfVxuXG4gICAgLy8g56qX5Y+j5pyq5ruh5pe26L+U5Zue5q2j5bi4XG4gICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IDIwKSB7XG4gICAgICByZXR1cm4geyB0eXBlOiBQT1NUVVJFX1RZUEUuTk9STUFMLCBjb25maWRlbmNlOiAxLjAsIGRldGFpbDogJ+aVsOaNrumHh+mbhuS4rScgfVxuICAgIH1cblxuICAgIC8vIOaJp+ihjOajgOa1i1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2RldGVjdCgpXG5cbiAgICAvLyDop6blj5Hlm57osINcbiAgICBpZiAodGhpcy5vbkRldGVjdCkge1xuICAgICAgdGhpcy5vbkRldGVjdChyZXN1bHQpXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIOaguOW/g+ajgOa1i+mAu+i+kVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2RldGVjdCgpIHtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlclxuXG4gICAgLy8gMS4g5LmF5Z2Q5qOA5rWL77ya5Yqg6YCf5bqm5pa55beu5p6B5L2OICsg5oyB57ut5pe26Ze0XG4gICAgY29uc3Qgc2VkZW50YXJ5UmVzdWx0ID0gdGhpcy5fZGV0ZWN0U2VkZW50YXJ5KGJ1ZmZlcilcbiAgICBpZiAoc2VkZW50YXJ5UmVzdWx0LnR5cGUgPT09IFBPU1RVUkVfVFlQRS5TRURFTlRBUlkpIHtcbiAgICAgIHJldHVybiBzZWRlbnRhcnlSZXN1bHRcbiAgICB9XG5cbiAgICAvLyAyLiDkvY7lpLTliY3lgL7mo4DmtYvvvJp66L206YeN5Yqb5YiG6YeP5byC5bi4XG4gICAgY29uc3QgaGVhZFRpbHRSZXN1bHQgPSB0aGlzLl9kZXRlY3RIZWFkVGlsdChidWZmZXIpXG4gICAgaWYgKGhlYWRUaWx0UmVzdWx0LnR5cGUgPT09IFBPU1RVUkVfVFlQRS5IRUFEX1RJTFQpIHtcbiAgICAgIHJldHVybiBoZWFkVGlsdFJlc3VsdFxuICAgIH1cblxuICAgIC8vIDMuIOi3t+S6jOmDjuiFv+ajgOa1i++8mnjovbTlgY/np7sgKyB56L205ZGo5pyf5oCn5b6u5oyvXG4gICAgY29uc3QgbGVnQ3Jvc3NSZXN1bHQgPSB0aGlzLl9kZXRlY3RMZWdDcm9zcyhidWZmZXIpXG4gICAgaWYgKGxlZ0Nyb3NzUmVzdWx0LnR5cGUgPT09IFBPU1RVUkVfVFlQRS5MRUdfQ1JPU1MpIHtcbiAgICAgIHJldHVybiBsZWdDcm9zc1Jlc3VsdFxuICAgIH1cblxuICAgIC8vIOato+W4uOS9k+aAgVxuICAgIHRoaXMuc2l0U3RhcnRUaW1lID0gbnVsbFxuICAgIHJldHVybiB7IHR5cGU6IFBPU1RVUkVfVFlQRS5OT1JNQUwsIGNvbmZpZGVuY2U6IDEuMCwgZGV0YWlsOiAn5L2T5oCB5q2j5bi4JyB9XG4gIH1cblxuICAvKipcbiAgICog5LmF5Z2Q5qOA5rWLXG4gICAqIOWOn+eQhu+8muWKoOmAn+W6puS4iei9tOaWueW3ruaegeS9juihqOekuuWHoOS5jumdmeatou+8jOaMgee7rei2hei/h+mYiOWAvOWIpOWumuS4uuS5heWdkFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2RldGVjdFNlZGVudGFyeShidWZmZXIpIHtcbiAgICBjb25zdCB2YXJpYW5jZSA9IHRoaXMuX2NhbGNWYXJpYW5jZShidWZmZXIpXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKVxuXG4gICAgLy8g5pa55beu6ZiI5YC877ya5L2O5LqOMC4wMeihqOekuuWHoOS5jumdmeatolxuICAgIGNvbnN0IFZBUklBTkNFX1RIUkVTSE9MRCA9IDAuMDFcblxuICAgIGlmICh2YXJpYW5jZSA8IFZBUklBTkNFX1RIUkVTSE9MRCkge1xuICAgICAgLy8g5qOA5rWL5Yiw6Z2Z5q2i54q25oCBXG4gICAgICBpZiAoIXRoaXMuc2l0U3RhcnRUaW1lKSB7XG4gICAgICAgIHRoaXMuc2l0U3RhcnRUaW1lID0gbm93XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNlZGVudGFyeUR1cmF0aW9uID0gbm93IC0gdGhpcy5zaXRTdGFydFRpbWVcbiAgICAgIGlmIChzZWRlbnRhcnlEdXJhdGlvbiA+IHRoaXMuc2VkZW50YXJ5VGhyZXNob2xkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogUE9TVFVSRV9UWVBFLlNFREVOVEFSWSxcbiAgICAgICAgICBjb25maWRlbmNlOiBNYXRoLm1pbigwLjk1LCAwLjcgKyBzZWRlbnRhcnlEdXJhdGlvbiAvICh0aGlzLnNlZGVudGFyeVRocmVzaG9sZCAqIDUpKSxcbiAgICAgICAgICBkZXRhaWw6IGDlt7LpnZnlnZAgJHtNYXRoLmZsb29yKHNlZGVudGFyeUR1cmF0aW9uIC8gNjAwMDApfSDliIbpkp9gLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIOa0u+WKqOeKtuaAge+8jOmHjee9ruiuoeaXtlxuICAgICAgaWYgKHRoaXMuc2l0U3RhcnRUaW1lKSB7XG4gICAgICAgIHRoaXMudG9kYXlTZWRlbnRhcnlNcyArPSBub3cgLSB0aGlzLnNpdFN0YXJ0VGltZVxuICAgICAgfVxuICAgICAgdGhpcy5zaXRTdGFydFRpbWUgPSBudWxsXG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdHlwZTogUE9TVFVSRV9UWVBFLk5PUk1BTCwgY29uZmlkZW5jZTogMS4wLCBkZXRhaWw6ICcnIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDkvY7lpLTliY3lgL7mo4DmtYtcbiAgICog5Y6f55CG77ya5q2j5bi456uZ56uL5pe2eui9tOe6pi0xZ++8jOS9juWktOaXtnrovbTnu53lr7nlgLzlh4/lsI9cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9kZXRlY3RIZWFkVGlsdChidWZmZXIpIHtcbiAgICBjb25zdCBhdmdaID0gdGhpcy5fY2FsY0F4aXNNZWFuKGJ1ZmZlciwgJ3onKVxuICAgIGNvbnN0IHZhcmlhbmNlID0gdGhpcy5fY2FsY1ZhcmlhbmNlKGJ1ZmZlcilcblxuICAgIC8vIOmdmeatouaIluW+ruWKqOaXtuaJjeajgOa1i++8iOi/kOWKqOS4rXrovbTlj5jljJblpKfvvIzkuI3lj6/pnaDvvIlcbiAgICBpZiAodmFyaWFuY2UgPiAwLjA1KSB7XG4gICAgICByZXR1cm4geyB0eXBlOiBQT1NUVVJFX1RZUEUuTk9STUFMLCBjb25maWRlbmNlOiAxLjAsIGRldGFpbDogJycgfVxuICAgIH1cblxuICAgIC8vIOato+W4uOermeeri3riiYgtMS4wLCDkvY7lpLTml7Z65ZyoLTAuNuWIsC0wLjnkuYvpl7RcbiAgICBjb25zdCBIRUFEX1RJTFRfWl9NSU4gPSAtMC45NVxuICAgIGNvbnN0IEhFQURfVElMVF9aX01BWCA9IC0wLjVcblxuICAgIGlmIChhdmdaID4gSEVBRF9USUxUX1pfTUlOICYmIGF2Z1ogPCBIRUFEX1RJTFRfWl9NQVgpIHtcbiAgICAgIC8vIHrotormjqXov5EtMC4177yM5L2O5aS06LaK5Lil6YeNXG4gICAgICBjb25zdCBzZXZlcml0eSA9IChhdmdaIC0gSEVBRF9USUxUX1pfTUlOKSAvIChIRUFEX1RJTFRfWl9NQVggLSBIRUFEX1RJTFRfWl9NSU4pXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBQT1NUVVJFX1RZUEUuSEVBRF9USUxULFxuICAgICAgICBjb25maWRlbmNlOiBNYXRoLm1pbigwLjg1LCAwLjUgKyBzZXZlcml0eSAqIDAuMzUpLFxuICAgICAgICBkZXRhaWw6IGDkvY7lpLTliY3lgL4gJHsoc2V2ZXJpdHkgKiAxMDApLnRvRml4ZWQoMCl9JWAsXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdHlwZTogUE9TVFVSRV9UWVBFLk5PUk1BTCwgY29uZmlkZW5jZTogMS4wLCBkZXRhaWw6ICcnIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDot7fkuozpg47ohb/mo4DmtYtcbiAgICog5Y6f55CG77ya6Le35LqM6YOO6IW/5pe2eOi9tOacieaYjuaYvuWBj+enu++8jHnovbTlh7rnjrDlkajmnJ/mgKflvq7mjK9cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9kZXRlY3RMZWdDcm9zcyhidWZmZXIpIHtcbiAgICBjb25zdCBhdmdYID0gdGhpcy5fY2FsY0F4aXNNZWFuKGJ1ZmZlciwgJ3gnKVxuICAgIGNvbnN0IHZhcmlhbmNlID0gdGhpcy5fY2FsY1ZhcmlhbmNlKGJ1ZmZlcilcblxuICAgIC8vIOmcgOimgeS4gOWumua0u+WKqOmHj++8iOe6r+mdmeatouaXoOazleWIpOaWre+8iVxuICAgIGlmICh2YXJpYW5jZSA8IDAuMDA1IHx8IHZhcmlhbmNlID4gMC4xKSB7XG4gICAgICByZXR1cm4geyB0eXBlOiBQT1NUVVJFX1RZUEUuTk9STUFMLCBjb25maWRlbmNlOiAxLjAsIGRldGFpbDogJycgfVxuICAgIH1cblxuICAgIGNvbnN0IFhfT0ZGU0VUX1RIUkVTSE9MRCA9IDAuMjVcbiAgICBjb25zdCBoYXNYT2Zmc2V0ID0gTWF0aC5hYnMoYXZnWCkgPiBYX09GRlNFVF9USFJFU0hPTERcbiAgICBjb25zdCBoYXNZT3NjaWxsYXRpb24gPSB0aGlzLl9kZXRlY3RQZXJpb2RpY09zY2lsbGF0aW9uKGJ1ZmZlciwgJ3knKVxuXG4gICAgaWYgKGhhc1hPZmZzZXQgJiYgaGFzWU9zY2lsbGF0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBQT1NUVVJFX1RZUEUuTEVHX0NST1NTLFxuICAgICAgICBjb25maWRlbmNlOiAwLjY1LFxuICAgICAgICBkZXRhaWw6ICfnlpHkvLzot7fkuozpg47ohb8nLFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IHR5cGU6IFBPU1RVUkVfVFlQRS5OT1JNQUwsIGNvbmZpZGVuY2U6IDEuMCwgZGV0YWlsOiAnJyB9XG4gIH1cblxuICAvKipcbiAgICog6K6h566X5LiJ6L205pa55beuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2FsY1ZhcmlhbmNlKGJ1ZmZlcikge1xuICAgIGNvbnN0IG4gPSBidWZmZXIubGVuZ3RoXG4gICAgaWYgKG4gPCAyKSByZXR1cm4gMFxuXG4gICAgbGV0IHN1bSA9IDBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgY29uc3QgcyA9IGJ1ZmZlcltpXVxuICAgICAgY29uc3QgbWFnbml0dWRlID0gTWF0aC5zcXJ0KHMueCAqIHMueCArIHMueSAqIHMueSArIHMueiAqIHMueilcbiAgICAgIHN1bSArPSBtYWduaXR1ZGVcbiAgICB9XG4gICAgY29uc3QgbWVhbiA9IHN1bSAvIG5cblxuICAgIGxldCB2YXJpYW5jZSA9IDBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgY29uc3QgcyA9IGJ1ZmZlcltpXVxuICAgICAgY29uc3QgbWFnbml0dWRlID0gTWF0aC5zcXJ0KHMueCAqIHMueCArIHMueSAqIHMueSArIHMueiAqIHMueilcbiAgICAgIHZhcmlhbmNlICs9IChtYWduaXR1ZGUgLSBtZWFuKSAqIChtYWduaXR1ZGUgLSBtZWFuKVxuICAgIH1cbiAgICByZXR1cm4gdmFyaWFuY2UgLyBuXG4gIH1cblxuICAvKipcbiAgICog6K6h566X5oyH5a6a6L205Z2H5YC8XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2FsY0F4aXNNZWFuKGJ1ZmZlciwgYXhpcykge1xuICAgIGNvbnN0IG4gPSBidWZmZXIubGVuZ3RoXG4gICAgaWYgKG4gPT09IDApIHJldHVybiAwXG4gICAgbGV0IHN1bSA9IDBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgc3VtICs9IGJ1ZmZlcltpXVtheGlzXVxuICAgIH1cbiAgICByZXR1cm4gc3VtIC8gblxuICB9XG5cbiAgLyoqXG4gICAqIOajgOa1i+WRqOacn+aAp+W+ruaMr++8iOeugOWMlueJiO+8muajgOa1i+espuWPt+WPmOWMlumikeeOh++8iVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2RldGVjdFBlcmlvZGljT3NjaWxsYXRpb24oYnVmZmVyLCBheGlzKSB7XG4gICAgY29uc3QgbiA9IGJ1ZmZlci5sZW5ndGhcbiAgICBpZiAobiA8IDMwKSByZXR1cm4gZmFsc2VcblxuICAgIC8vIOiuoeeul+espuWPt+WPmOWMluasoeaVsFxuICAgIGxldCBzaWduQ2hhbmdlcyA9IDBcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IG47IGkrKykge1xuICAgICAgaWYgKChidWZmZXJbaV1bYXhpc10gPj0gMCAmJiBidWZmZXJbaSAtIDFdW2F4aXNdIDwgMCkgfHxcbiAgICAgICAgKGJ1ZmZlcltpXVtheGlzXSA8IDAgJiYgYnVmZmVyW2kgLSAxXVtheGlzXSA+PSAwKSkge1xuICAgICAgICBzaWduQ2hhbmdlcysrXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8g5ZGo5pyf5oCn5oyv6I2h77ya56ym5Y+35Y+Y5YyW6aKR546H5Zyo5ZCI55CG6IyD5Zu05YaFXG4gICAgY29uc3QgY2hhbmdlUmF0ZSA9IHNpZ25DaGFuZ2VzIC8gblxuICAgIHJldHVybiBjaGFuZ2VSYXRlID4gMC4xICYmIGNoYW5nZVJhdGUgPCAwLjVcbiAgfVxuXG4gIC8qKlxuICAgKiDojrflj5bku4rml6XkuYXlnZDmgLvml7bplb/vvIjmr6vnp5LvvIlcbiAgICovXG4gIGdldFRvZGF5U2VkZW50YXJ5TXMoKSB7XG4gICAgbGV0IHRvdGFsID0gdGhpcy50b2RheVNlZGVudGFyeU1zXG4gICAgaWYgKHRoaXMuc2l0U3RhcnRUaW1lKSB7XG4gICAgICB0b3RhbCArPSBEYXRlLm5vdygpIC0gdGhpcy5zaXRTdGFydFRpbWVcbiAgICB9XG4gICAgcmV0dXJuIHRvdGFsXG4gIH1cblxuICAvKipcbiAgICog6YeN572u5LuK5pel57uf6K6h77yI5q+P5pel6Zu254K56LCD55So77yJXG4gICAqL1xuICByZXNldERhaWx5U3RhdHMoKSB7XG4gICAgdGhpcy50b2RheVNlZGVudGFyeU1zID0gMFxuICAgIHRoaXMuc2l0U3RhcnRUaW1lID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIOiOt+WPluS9k+aAgeexu+Wei+S4reaWh+WQjVxuICAgKi9cbiAgc3RhdGljIGdldFBvc3R1cmVOYW1lKHR5cGUpIHtcbiAgICByZXR1cm4gUE9TVFVSRV9OQU1FW3R5cGVdIHx8ICfmnKrnn6UnXG4gIH1cbn1cblxuLy8g5a+85Ye6XG5leHBvcnQgeyBQT1NUVVJFX1RZUEUsIFBPU1RVUkVfTkFNRSB9XG5leHBvcnQgZGVmYXVsdCBQb3N0dXJlRGV0ZWN0b3JcbiIsIl9fd2VicGFja19yZXF1aXJlX18ucnYgPSAoKSA9PiAoXCIxLjcuMTJcIikiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLnJ1aWQgPSBcImJ1bmRsZXI9cnNwYWNrQDEuNy4xMlwiOyIsIjx0ZW1wbGF0ZT5cbiAgPGRpdiBjbGFzcz1cInBhZ2VcIiBAc3dpcGU9XCJiYWNrXCI+XG4gICAgPCEtLSDpobbpg6jlr7zoiKogLS0+XG4gICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgPHRleHQgY2xhc3M9XCJiYWNrLWJ0blwiIG9uY2xpY2s9XCJiYWNrXCI+4oC5PC90ZXh0PlxuICAgICAgPHRleHQgY2xhc3M9XCJ0aXRsZVwiPuS9k+aAgeebkea1izwvdGV4dD5cbiAgICAgIDx0ZXh0IGNsYXNzPVwic3RhdHVzLWRvdCB7eyBtb25pdG9yQWN0aXZlID8gJ2FjdGl2ZScgOiAnaW5hY3RpdmUnIH19XCI+PC90ZXh0PlxuICAgIDwvZGl2PlxuXG4gICAgPCEtLSDlrp7ml7bliqDpgJ/luqbms6LlvaLlm74gLS0+XG4gICAgPGRpdiBjbGFzcz1cImNoYXJ0LXNlY3Rpb25cIj5cbiAgICAgIDx0ZXh0IGNsYXNzPVwic2VjdGlvbi10aXRsZVwiPuWKoOmAn+W6puazouW9ojwvdGV4dD5cbiAgICAgIDxkaXYgY2xhc3M9XCJjaGFydC13cmFwXCI+XG4gICAgICAgIDxjaGFydFxuICAgICAgICAgIGNsYXNzPVwiY2hhcnRcIlxuICAgICAgICAgIHR5cGU9XCJsaW5lXCJcbiAgICAgICAgICBvcHRpb25zPVwie3sgY2hhcnRPcHRzIH19XCJcbiAgICAgICAgICBkYXRhc2V0cz1cInt7IGNoYXJ0RGF0YSB9fVwiXG4gICAgICAgID48L2NoYXJ0PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiYXhpcy1sZWdlbmRcIj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJsZWdlbmQtaXRlbVwiIHN0eWxlPVwiY29sb3I6ICNmZjZiNmI7XCI+4pePIFjovbQ8L3RleHQ+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwibGVnZW5kLWl0ZW1cIiBzdHlsZT1cImNvbG9yOiAjNGVjZGM0O1wiPuKXjyBZ6L20PC90ZXh0PlxuICAgICAgICA8dGV4dCBjbGFzcz1cImxlZ2VuZC1pdGVtXCIgc3R5bGU9XCJjb2xvcjogIzQ1YjdkMTtcIj7il48gWui9tDwvdGV4dD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPCEtLSDlvZPliY3kvZPmgIHnirbmgIEgLS0+XG4gICAgPGRpdiBjbGFzcz1cInN0YXR1cy1zZWN0aW9uXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwic3RhdHVzLWNhcmQge3sgc3RhdHVzQ2xhc3MgfX1cIj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0dXMtaWNvblwiPnt7IHBvc3R1cmVJY29uIH19PC90ZXh0PlxuICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHVzLWluZm9cIj5cbiAgICAgICAgICA8dGV4dCBjbGFzcz1cInN0YXR1cy10eXBlXCI+e3sgcG9zdHVyZVR5cGUgfX08L3RleHQ+XG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0dXMtZGV0YWlsXCI+e3sgcG9zdHVyZURldGFpbCB9fTwvdGV4dD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5LuK5pel57uf6K6hIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJzdGF0cy1zZWN0aW9uXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwic3RhdC1jYXJkXCI+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwic3RhdC1sYWJlbFwiPuS5heWdkOaXtumVvzwvdGV4dD5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0LXZhbHVlXCI+e3sgc2VkZW50YXJ5TWluIH19PHRleHQgY2xhc3M9XCJzdGF0LXVuaXRcIj7liIbpkp88L3RleHQ+PC90ZXh0PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic3RhdC1jYXJkXCI+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwic3RhdC1sYWJlbFwiPuW8guW4uOasoeaVsDwvdGV4dD5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0LXZhbHVlXCI+e3sgYWxlcnRDb3VudCB9fTx0ZXh0IGNsYXNzPVwic3RhdC11bml0XCI+5qyhPC90ZXh0PjwvdGV4dD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInN0YXQtY2FyZFwiPlxuICAgICAgICA8dGV4dCBjbGFzcz1cInN0YXQtbGFiZWxcIj7mtLvliqjmrKHmlbA8L3RleHQ+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwic3RhdC12YWx1ZVwiPnt7IGFjdGl2aXR5Q291bnQgfX08dGV4dCBjbGFzcz1cInN0YXQtdW5pdFwiPuasoTwvdGV4dD48L3RleHQ+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5o6n5Yi25oyJ6ZKuIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJjb250cm9sLXNlY3Rpb25cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJidG4ge3sgbW9uaXRvckFjdGl2ZSA/ICdidG4tc3RvcCcgOiAnYnRuLXN0YXJ0JyB9fVwiIG9uY2xpY2s9XCJ0b2dnbGVNb25pdG9yXCI+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwiYnRuLXRleHRcIj57eyBtb25pdG9yQWN0aXZlID8gJ+aaguWBnOebkea1iycgOiAn5byA5aeL55uR5rWLJyB9fTwvdGV4dD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgc2Vuc29yIGZyb20gJ0BzeXN0ZW0uc2Vuc29yJ1xuaW1wb3J0IHZpYnJhdG9yIGZyb20gJ0BzeXN0ZW0udmlicmF0b3InXG5pbXBvcnQgcHJvbXB0IGZyb20gJ0BzeXN0ZW0ucHJvbXB0J1xuaW1wb3J0IFBvc3R1cmVEZXRlY3RvciwgeyBQT1NUVVJFX1RZUEUsIFBPU1RVUkVfTkFNRSB9IGZyb20gJy4uLy4uL2xpYi9wb3N0dXJlLWRldGVjdG9yJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHByaXZhdGU6IHtcbiAgICBtb25pdG9yQWN0aXZlOiBmYWxzZSxcbiAgICBwb3N0dXJlSWNvbjogJ/CfmIonLFxuICAgIHBvc3R1cmVUeXBlOiAn5q2j5bi4JyxcbiAgICBwb3N0dXJlRGV0YWlsOiAn562J5b6F55uR5rWL5pWw5o2uLi4uJyxcbiAgICBzdGF0dXNDbGFzczogJ3N0YXR1cy1ub3JtYWwnLFxuICAgIHNlZGVudGFyeU1pbjogMCxcbiAgICBhbGVydENvdW50OiAwLFxuICAgIGFjdGl2aXR5Q291bnQ6IDAsXG4gICAgLy8g5Zu+6KGo5pWw5o2uXG4gICAgY2hhcnREYXRhOiBbXG4gICAgICB7IHN0cm9rZUNvbG9yOiAnI2ZmNmI2YicsIGRhdGE6IFtdIH0sXG4gICAgICB7IHN0cm9rZUNvbG9yOiAnIzRlY2RjNCcsIGRhdGE6IFtdIH0sXG4gICAgICB7IHN0cm9rZUNvbG9yOiAnIzQ1YjdkMScsIGRhdGE6IFtdIH0sXG4gICAgXSxcbiAgICBjaGFydE9wdHM6IHtcbiAgICAgIHhBeGlzOiB7IG1pbjogMCwgbWF4OiA1OSwgZGlzcGxheTogZmFsc2UsIGF4aXNUaWNrOiA2MCB9LFxuICAgICAgeUF4aXM6IHsgbWluOiAtMjAsIG1heDogMjAsIGRpc3BsYXk6IGZhbHNlLCBheGlzVGljazogMjEgfSxcbiAgICAgIHNlcmllczogeyBsaW5lU3R5bGU6IHsgd2lkdGg6ICcxcHgnIH0gfSxcbiAgICB9LFxuICAgIC8vIOWGhemDqOeKtuaAgVxuICAgIGRldGVjdG9yOiBudWxsLFxuICAgIHNhbXBsZUluZGV4OiAwLFxuICAgIG1heFNhbXBsZXM6IDYwLFxuICB9LFxuXG4gIG9uUmVhZHkoKSB7XG4gICAgdGhpcy5kZXRlY3RvciA9IG5ldyBQb3N0dXJlRGV0ZWN0b3Ioe1xuICAgICAgc2VkZW50YXJ5VGhyZXNob2xkOiAzMCAqIDYwICogMTAwMCxcbiAgICB9KVxuXG4gICAgdGhpcy5kZXRlY3Rvci5vbkRldGVjdCA9IChyZXN1bHQpID0+IHtcbiAgICAgIHRoaXMuX3VwZGF0ZVN0YXR1cyhyZXN1bHQpXG4gICAgfVxuICB9LFxuXG4gIG9uRGVzdHJveSgpIHtcbiAgICB0aGlzLl9zdG9wTW9uaXRvcigpXG4gIH0sXG5cbiAgLy8g6L+U5Zue5LiK5LiA6aG1XG4gIGJhY2soZXZlbnQpIHtcbiAgICBpZiAoIWV2ZW50IHx8IGV2ZW50LmRpcmVjdGlvbiA9PT0gJ3JpZ2h0Jykge1xuICAgICAgLy8g6L+U5Zue5pe25YGc5q2i55uR5rWLXG4gICAgICB0aGlzLl9zdG9wTW9uaXRvcigpXG4gICAgICBpbXBvcnQoJ0BzeXN0ZW0ucm91dGVyJykudGhlbigocm91dGVyKSA9PiB7XG4gICAgICAgIHJvdXRlci5iYWNrKClcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuXG4gIC8vIOWIh+aNouebkea1i+eKtuaAgVxuICB0b2dnbGVNb25pdG9yKCkge1xuICAgIGlmICh0aGlzLm1vbml0b3JBY3RpdmUpIHtcbiAgICAgIHRoaXMuX3N0b3BNb25pdG9yKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RhcnRNb25pdG9yKClcbiAgICB9XG4gIH0sXG5cbiAgLy8g5byA5aeL55uR5rWLXG4gIF9zdGFydE1vbml0b3IoKSB7XG4gICAgc2Vuc29yLnN1YnNjcmliZUFjY2VsZXJvbWV0ZXIoe1xuICAgICAgY2FsbGJhY2s6IChkYXRhKSA9PiB7XG4gICAgICAgIHRoaXMuX29uRGF0YShkYXRhKVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tQb3N0dXJlXSBzdWJzY3JpYmUgZmFpbDonLCBjb2RlKVxuICAgICAgICBwcm9tcHQuc2hvd1RvYXN0KHsgbWVzc2FnZTogJ+S8oOaEn+WZqOiuoumYheWksei0pScgfSlcbiAgICAgIH0sXG4gICAgfSlcblxuICAgIHRoaXMubW9uaXRvckFjdGl2ZSA9IHRydWVcbiAgICBwcm9tcHQuc2hvd1RvYXN0KHsgbWVzc2FnZTogJ+ebkea1i+W3suW8gOWQrycgfSlcbiAgfSxcblxuICAvLyDlgZzmraLnm5HmtYtcbiAgX3N0b3BNb25pdG9yKCkge1xuICAgIHNlbnNvci51bnN1YnNjcmliZUFjY2VsZXJvbWV0ZXIoKVxuICAgIHRoaXMubW9uaXRvckFjdGl2ZSA9IGZhbHNlXG4gIH0sXG5cbiAgLy8g5pWw5o2u5Zue6LCDXG4gIF9vbkRhdGEoZGF0YSkge1xuICAgIC8vIOabtOaWsOWbvuihqFxuICAgIHRoaXMuX3VwZGF0ZUNoYXJ0KGRhdGEpXG5cbiAgICAvLyDovpPlhaXliLDmo4DmtYvlmahcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLmRldGVjdG9yLmlucHV0KHsgeDogZGF0YS54LCB5OiBkYXRhLnksIHo6IGRhdGEueiB9KVxuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgIHRoaXMuX3VwZGF0ZVN0YXR1cyhyZXN1bHQpXG4gICAgfVxuICB9LFxuXG4gIC8vIOabtOaWsOWbvuihqOaVsOaNrlxuICBfdXBkYXRlQ2hhcnQoZGF0YSkge1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuc2FtcGxlSW5kZXggJSB0aGlzLm1heFNhbXBsZXNcblxuICAgIC8vIOe8qeaUvuaVsOaNruWIsOWbvuihqOiMg+WbtCAoLTIwIHRvIDIwKVxuICAgIGNvbnN0IHNjYWxlWCA9IE1hdGgucm91bmQoZGF0YS54ICogMTApXG4gICAgY29uc3Qgc2NhbGVZID0gTWF0aC5yb3VuZChkYXRhLnkgKiAxMClcbiAgICBjb25zdCBzY2FsZVogPSBNYXRoLnJvdW5kKGRhdGEueiAqIDEwKVxuXG4gICAgLy8g5pu05paw5ZCE6L205pWw5o2uXG4gICAgdGhpcy5jaGFydERhdGFbMF0uZGF0YVtpZHhdID0gc2NhbGVYXG4gICAgdGhpcy5jaGFydERhdGFbMV0uZGF0YVtpZHhdID0gc2NhbGVZXG4gICAgdGhpcy5jaGFydERhdGFbMl0uZGF0YVtpZHhdID0gc2NhbGVaXG5cbiAgICAvLyDop6blj5Hlm77ooajmm7TmlrDvvIjliJvlu7rmlrDlvJXnlKjvvIlcbiAgICB0aGlzLmNoYXJ0RGF0YSA9IFtcbiAgICAgIHsgLi4udGhpcy5jaGFydERhdGFbMF0sIGRhdGE6IFsuLi50aGlzLmNoYXJ0RGF0YVswXS5kYXRhXSB9LFxuICAgICAgeyAuLi50aGlzLmNoYXJ0RGF0YVsxXSwgZGF0YTogWy4uLnRoaXMuY2hhcnREYXRhWzFdLmRhdGFdIH0sXG4gICAgICB7IC4uLnRoaXMuY2hhcnREYXRhWzJdLCBkYXRhOiBbLi4udGhpcy5jaGFydERhdGFbMl0uZGF0YV0gfSxcbiAgICBdXG5cbiAgICB0aGlzLnNhbXBsZUluZGV4KytcbiAgfSxcblxuICAvLyDmm7TmlrDkvZPmgIHnirbmgIHmmL7npLpcbiAgX3VwZGF0ZVN0YXR1cyhyZXN1bHQpIHtcbiAgICB0aGlzLnBvc3R1cmVJY29uID0gdGhpcy5fZ2V0SWNvbihyZXN1bHQudHlwZSlcbiAgICB0aGlzLnBvc3R1cmVUeXBlID0gUG9zdHVyZURldGVjdG9yLmdldFBvc3R1cmVOYW1lKHJlc3VsdC50eXBlKVxuICAgIHRoaXMucG9zdHVyZURldGFpbCA9IHJlc3VsdC5kZXRhaWwgfHwgJ+ajgOa1i+S4rS4uLidcblxuICAgIGlmIChyZXN1bHQudHlwZSA9PT0gUE9TVFVSRV9UWVBFLk5PUk1BTCkge1xuICAgICAgdGhpcy5zdGF0dXNDbGFzcyA9ICdzdGF0dXMtbm9ybWFsJ1xuICAgICAgdGhpcy5hY3Rpdml0eUNvdW50KytcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGF0dXNDbGFzcyA9ICdzdGF0dXMtd2FybmluZydcbiAgICAgIHRoaXMuYWxlcnRDb3VudCsrXG4gICAgICB2aWJyYXRvci52aWJyYXRlKHsgbW9kZTogJ2xvbmcnIH0pXG4gICAgfVxuXG4gICAgdGhpcy5zZWRlbnRhcnlNaW4gPSBNYXRoLnJvdW5kKHRoaXMuZGV0ZWN0b3IuZ2V0VG9kYXlTZWRlbnRhcnlNcygpIC8gNjAwMDApXG4gIH0sXG5cbiAgX2dldEljb24odHlwZSkge1xuICAgIGNvbnN0IGljb25zID0ge1xuICAgICAgW1BPU1RVUkVfVFlQRS5OT1JNQUxdOiAn8J+YiicsXG4gICAgICBbUE9TVFVSRV9UWVBFLlNFREVOVEFSWV06ICfwn6qRJyxcbiAgICAgIFtQT1NUVVJFX1RZUEUuSEVBRF9USUxUXTogJ/Cfk7EnLFxuICAgICAgW1BPU1RVUkVfVFlQRS5MRUdfQ1JPU1NdOiAn8J+mtScsXG4gICAgfVxuICAgIHJldHVybiBpY29uc1t0eXBlXSB8fCAn4p2TJ1xuICB9LFxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbi5wYWdlIHtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgd2lkdGg6IDQ4MHB4O1xuICBoZWlnaHQ6IDQ4MHB4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMGEwYTBhO1xufVxuXG4uaGVhZGVyIHtcbiAgd2lkdGg6IDEwMCU7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgcGFkZGluZzogMTVweCAyMHB4O1xuICBtYXJnaW4tdG9wOiAxNXB4O1xufVxuXG4uYmFjay1idG4ge1xuICBmb250LXNpemU6IDMycHg7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICB3aWR0aDogNDBweDtcbn1cblxuLnRpdGxlIHtcbiAgZm9udC1zaXplOiAyNHB4O1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG5cbi5zdGF0dXMtZG90IHtcbiAgd2lkdGg6IDEycHg7XG4gIGhlaWdodDogMTJweDtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xufVxuXG4uc3RhdHVzLWRvdC5hY3RpdmUge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDBkNGFhO1xufVxuXG4uc3RhdHVzLWRvdC5pbmFjdGl2ZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICM2NjY2NjY7XG59XG5cbi8qIOWbvuihqOWMuuWfnyAqL1xuLmNoYXJ0LXNlY3Rpb24ge1xuICB3aWR0aDogNDIwcHg7XG4gIHBhZGRpbmc6IDE1cHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxYTFhMmU7XG4gIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gIG1hcmdpbi10b3A6IDEwcHg7XG59XG5cbi5zZWN0aW9uLXRpdGxlIHtcbiAgZm9udC1zaXplOiAxOHB4O1xuICBjb2xvcjogIzg4ODg4ODtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbn1cblxuLmNoYXJ0LXdyYXAge1xuICB3aWR0aDogMzkwcHg7XG4gIGhlaWdodDogMTIwcHg7XG59XG5cbi5jaGFydCB7XG4gIHdpZHRoOiAzOTBweDtcbiAgaGVpZ2h0OiAxMjBweDtcbn1cblxuLmF4aXMtbGVnZW5kIHtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIG1hcmdpbi10b3A6IDhweDtcbn1cblxuLmxlZ2VuZC1pdGVtIHtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBtYXJnaW46IDAgMTBweDtcbn1cblxuLyog54q25oCB5Yy65Z+fICovXG4uc3RhdHVzLXNlY3Rpb24ge1xuICB3aWR0aDogNDIwcHg7XG4gIG1hcmdpbi10b3A6IDEycHg7XG59XG5cbi5zdGF0dXMtY2FyZCB7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHBhZGRpbmc6IDE1cHggMjBweDtcbiAgYm9yZGVyLXJhZGl1czogMTJweDtcbn1cblxuLnN0YXR1cy1ub3JtYWwge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMWEyZTFhO1xuICBib3JkZXI6IDFweCBzb2xpZCAjMDBkNGFhO1xufVxuXG4uc3RhdHVzLXdhcm5pbmcge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMmUxYTFhO1xuICBib3JkZXI6IDFweCBzb2xpZCAjZmY2YjZiO1xufVxuXG4uc3RhdHVzLWljb24ge1xuICBmb250LXNpemU6IDM2cHg7XG4gIG1hcmdpbi1yaWdodDogMTVweDtcbn1cblxuLnN0YXR1cy1pbmZvIHtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbn1cblxuLnN0YXR1cy10eXBlIHtcbiAgZm9udC1zaXplOiAyMnB4O1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG5cbi5zdGF0dXMtZGV0YWlsIHtcbiAgZm9udC1zaXplOiAxNnB4O1xuICBjb2xvcjogIzg4ODg4ODtcbiAgbWFyZ2luLXRvcDogNHB4O1xufVxuXG4vKiDnu5/orqHljLrln58gKi9cbi5zdGF0cy1zZWN0aW9uIHtcbiAgd2lkdGg6IDQyMHB4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIG1hcmdpbi10b3A6IDEycHg7XG59XG5cbi5zdGF0LWNhcmQge1xuICB3aWR0aDogMTMwcHg7XG4gIHBhZGRpbmc6IDEycHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxYTFhMmU7XG4gIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG5cbi5zdGF0LWxhYmVsIHtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBjb2xvcjogIzg4ODg4ODtcbn1cblxuLnN0YXQtdmFsdWUge1xuICBmb250LXNpemU6IDI4cHg7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgbWFyZ2luLXRvcDogNnB4O1xufVxuXG4uc3RhdC11bml0IHtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBjb2xvcjogIzg4ODg4ODtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbn1cblxuLyog5o6n5Yi25oyJ6ZKuICovXG4uY29udHJvbC1zZWN0aW9uIHtcbiAgbWFyZ2luLXRvcDogMTVweDtcbn1cblxuLmJ0biB7XG4gIHdpZHRoOiAyMDBweDtcbiAgaGVpZ2h0OiA1MHB4O1xuICBib3JkZXItcmFkaXVzOiAyNXB4O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cblxuLmJ0bi1zdGFydCB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMwMGQ0YWE7XG59XG5cbi5idG4tc3RvcCB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZjZiNmI7XG59XG5cbi5idG4tdGV4dCB7XG4gIGZvbnQtc2l6ZTogMThweDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xufVxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6WyJQT1NUVVJFX1RZUEUiLCJleHBvcnRzIiwiTk9STUFMIiwiU0VERU5UQVJZIiwiSEVBRF9USUxUIiwiTEVHX0NST1NTIiwiUE9TVFVSRV9OQU1FIiwiUG9zdHVyZURldGVjdG9yIiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwid2luZG93U2l6ZSIsInNlZGVudGFyeVRocmVzaG9sZCIsImJ1ZmZlciIsInNpdFN0YXJ0VGltZSIsInRvZGF5U2VkZW50YXJ5TXMiLCJsYXN0RGV0ZWN0VGltZSIsIm9uRGV0ZWN0Iiwib25TdGF0ZUNoYW5nZSIsImlucHV0Iiwic2FtcGxlIiwibm93IiwiRGF0ZSIsInB1c2giLCJ4IiwieSIsInoiLCJ0IiwibGVuZ3RoIiwic2hpZnQiLCJ0eXBlIiwiY29uZmlkZW5jZSIsImRldGFpbCIsInJlc3VsdCIsIl9kZXRlY3QiLCJzZWRlbnRhcnlSZXN1bHQiLCJfZGV0ZWN0U2VkZW50YXJ5IiwiaGVhZFRpbHRSZXN1bHQiLCJfZGV0ZWN0SGVhZFRpbHQiLCJsZWdDcm9zc1Jlc3VsdCIsIl9kZXRlY3RMZWdDcm9zcyIsInZhcmlhbmNlIiwiX2NhbGNWYXJpYW5jZSIsIlZBUklBTkNFX1RIUkVTSE9MRCIsInNlZGVudGFyeUR1cmF0aW9uIiwiTWF0aCIsIm1pbiIsImZsb29yIiwiYXZnWiIsIl9jYWxjQXhpc01lYW4iLCJIRUFEX1RJTFRfWl9NSU4iLCJIRUFEX1RJTFRfWl9NQVgiLCJzZXZlcml0eSIsInRvRml4ZWQiLCJhdmdYIiwiWF9PRkZTRVRfVEhSRVNIT0xEIiwiaGFzWE9mZnNldCIsImFicyIsImhhc1lPc2NpbGxhdGlvbiIsIl9kZXRlY3RQZXJpb2RpY09zY2lsbGF0aW9uIiwibiIsInN1bSIsImkiLCJzIiwibWFnbml0dWRlIiwic3FydCIsIm1lYW4iLCJheGlzIiwic2lnbkNoYW5nZXMiLCJjaGFuZ2VSYXRlIiwiZ2V0VG9kYXlTZWRlbnRhcnlNcyIsInRvdGFsIiwicmVzZXREYWlseVN0YXRzIiwiZ2V0UG9zdHVyZU5hbWUiLCJfZGVmYXVsdCIsIl9fd2VicGFja19yZXF1aXJlX18iLCJfc3lzdGVtIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsIiRhcHBfcmVxdWlyZSQiLCJfc3lzdGVtMiIsIl9zeXN0ZW0zIiwiX3Bvc3R1cmVEZXRlY3RvciIsIl9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkIiwicmVxdWlyZSIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsIm93bktleXMiLCJyIiwiT2JqZWN0Iiwia2V5cyIsImdldE93blByb3BlcnR5U3ltYm9scyIsIm8iLCJmaWx0ZXIiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJlbnVtZXJhYmxlIiwiYXBwbHkiLCJfb2JqZWN0U3ByZWFkIiwiYXJndW1lbnRzIiwiZm9yRWFjaCIsIl9kZWZpbmVQcm9wZXJ0eSIsImdldE93blByb3BlcnR5RGVzY3JpcHRvcnMiLCJkZWZpbmVQcm9wZXJ0aWVzIiwiZGVmaW5lUHJvcGVydHkiLCJfdG9Qcm9wZXJ0eUtleSIsInZhbHVlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJfdG9QcmltaXRpdmUiLCJTeW1ib2wiLCJ0b1ByaW1pdGl2ZSIsImNhbGwiLCJUeXBlRXJyb3IiLCJTdHJpbmciLCJOdW1iZXIiLCJXZWFrTWFwIiwiZiIsIl9fcHJvdG9fXyIsImhhcyIsImdldCIsInNldCIsImhhc093blByb3BlcnR5IiwicHJpdmF0ZSIsIm1vbml0b3JBY3RpdmUiLCJwb3N0dXJlSWNvbiIsInBvc3R1cmVUeXBlIiwicG9zdHVyZURldGFpbCIsInN0YXR1c0NsYXNzIiwic2VkZW50YXJ5TWluIiwiYWxlcnRDb3VudCIsImFjdGl2aXR5Q291bnQiLCJjaGFydERhdGEiLCJzdHJva2VDb2xvciIsImRhdGEiLCJjaGFydE9wdHMiLCJ4QXhpcyIsIm1heCIsImRpc3BsYXkiLCJheGlzVGljayIsInlBeGlzIiwic2VyaWVzIiwibGluZVN0eWxlIiwid2lkdGgiLCJkZXRlY3RvciIsInNhbXBsZUluZGV4IiwibWF4U2FtcGxlcyIsIm9uUmVhZHkiLCJfdXBkYXRlU3RhdHVzIiwib25EZXN0cm95IiwiX3N0b3BNb25pdG9yIiwiYmFjayIsImV2ZW50IiwiZGlyZWN0aW9uIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwicm91dGVyIiwidG9nZ2xlTW9uaXRvciIsIl9zdGFydE1vbml0b3IiLCJzZW5zb3IiLCJzdWJzY3JpYmVBY2NlbGVyb21ldGVyIiwiY2FsbGJhY2siLCJfb25EYXRhIiwiZmFpbCIsImNvZGUiLCJjb25zb2xlIiwiZXJyb3IiLCJwcm9tcHQiLCJzaG93VG9hc3QiLCJtZXNzYWdlIiwidW5zdWJzY3JpYmVBY2NlbGVyb21ldGVyIiwiX3VwZGF0ZUNoYXJ0IiwiaWR4Iiwic2NhbGVYIiwicm91bmQiLCJzY2FsZVkiLCJzY2FsZVoiLCJfZ2V0SWNvbiIsInZpYnJhdG9yIiwidmlicmF0ZSIsIm1vZGUiLCJpY29ucyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBZUEsTUFBTUEsZUFBWUMsUUFBQUEsWUFBQSxHQUFHOzRCQUNuQkMsUUFBUTs0QkFDUkMsV0FBVzs0QkFDWEMsV0FBVzs0QkFDWEMsV0FBVzt3QkFDYjt3QkFHQSxNQUFNQyxlQUFZTCxRQUFBQSxZQUFBLEdBQUc7NEJBQ25CLENBQUNELGFBQWFFLE1BQU0sQ0FBQyxFQUFFOzRCQUN2QixDQUFDRixhQUFhRyxTQUFTLENBQUMsRUFBRTs0QkFDMUIsQ0FBQ0gsYUFBYUksU0FBUyxDQUFDLEVBQUU7NEJBQzFCLENBQUNKLGFBQWFLLFNBQVMsQ0FBQyxFQUFFO3dCQUM1Qjt3QkFFQSxNQUFNRTs0QkFDSkMsWUFBWUMsVUFBVSxDQUFDLENBQUMsQ0FBRTtnQ0FFeEIsSUFBSSxDQUFDQyxVQUFVLEdBQUdELFFBQVFDLFVBQVUsSUFBSTtnQ0FFeEMsSUFBSSxDQUFDQyxrQkFBa0IsR0FBR0YsUUFBUUUsa0JBQWtCLElBQUk7Z0NBRXhELElBQUksQ0FBQ0MsTUFBTSxHQUFHLEVBQUU7Z0NBRWhCLElBQUksQ0FBQ0MsWUFBWSxHQUFHO2dDQUVwQixJQUFJLENBQUNDLGdCQUFnQixHQUFHO2dDQUV4QixJQUFJLENBQUNDLGNB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