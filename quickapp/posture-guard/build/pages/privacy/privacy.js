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
                    "./src/lib/crypto-store.js" (__unused_rspack_module, exports) {
                        "use strict";
                        Object.defineProperty(exports, "__esModule", {
                            value: true
                        });
                        exports["default"] = exports.CRYPTO_LEVEL = void 0;
                        var _system = _interopRequireDefault($app_require$1("@app-module/system.crypto"));
                        var _system2 = _interopRequireDefault($app_require$1("@app-module/system.storage"));
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
                        const CRYPTO_LEVEL = exports.CRYPTO_LEVEL = {
                            L1: 'L1',
                            L2: 'L2',
                            L3: 'L3'
                        };
                        const KEYS = {
                            L2: 'posture_guard_l2_key_16',
                            L3: 'posture_guard_l3_key_16'
                        };
                        class CryptoStore {
                            constructor(){
                                this.stats = {
                                    encryptCount: 0,
                                    decryptCount: 0,
                                    errorCount: 0
                                };
                            }
                            save(level, key, value, success, fail) {
                                const plain = JSON.stringify(value);
                                if (level === CRYPTO_LEVEL.L1) return void _system2.default.set({
                                    key: key,
                                    value: plain,
                                    success: ()=>{
                                        console.log(`[CryptoStore] L1 save: ${key}`);
                                        if (success) success();
                                    },
                                    fail: (data, code)=>{
                                        console.error(`[CryptoStore] L1 save fail: ${code}`);
                                        this.stats.errorCount++;
                                        if (fail) fail(data, code);
                                    }
                                });
                                const encKey = _system.default.btoa(KEYS[level]);
                                _system.default.encrypt({
                                    data: plain,
                                    key: encKey,
                                    algo: 'AES',
                                    success: (res)=>{
                                        this.stats.encryptCount++;
                                        _system2.default.set({
                                            key: key,
                                            value: res.data,
                                            success: ()=>{
                                                console.log(`[CryptoStore] ${level} save: ${key}`);
                                                if (success) success();
                                            },
                                            fail: (data, code)=>{
                                                console.error(`[CryptoStore] ${level} storage fail: ${code}`);
                                                this.stats.errorCount++;
                                                if (fail) fail(data, code);
                                            }
                                        });
                                    },
                                    fail: (data, code)=>{
                                        console.error(`[CryptoStore] ${level} encrypt fail: ${code}`);
                                        this.stats.errorCount++;
                                        if (fail) fail(data, code);
                                    }
                                });
                            }
                            load(level, key, callback, fail) {
                                _system2.default.get({
                                    key: key,
                                    success: (encrypted)=>{
                                        if (level === CRYPTO_LEVEL.L1) {
                                            try {
                                                callback(JSON.parse(encrypted));
                                            } catch (e) {
                                                callback(encrypted);
                                            }
                                            return;
                                        }
                                        const encKey = _system.default.btoa(KEYS[level]);
                                        _system.default.decrypt({
                                            data: encrypted,
                                            key: encKey,
                                            algo: 'AES',
                                            success: (res)=>{
                                                this.stats.decryptCount++;
                                                try {
                                                    callback(JSON.parse(res.data));
                                                } catch (e) {
                                                    callback(res.data);
                                                }
                                            },
                                            fail: (data, code)=>{
                                                console.error(`[CryptoStore] ${level} decrypt fail: ${code}`);
                                                this.stats.errorCount++;
                                                if (fail) fail(data, code);
                                            }
                                        });
                                    },
                                    fail: (data, code)=>{
                                        console.error(`[CryptoStore] ${level} load fail: ${code}`);
                                        this.stats.errorCount++;
                                        if (fail) fail(data, code);
                                    }
                                });
                            }
                            remove(key, success) {
                                _system2.default.delete({
                                    key: key,
                                    success: ()=>{
                                        console.log(`[CryptoStore] delete: ${key}`);
                                        if (success) success();
                                    },
                                    fail: (data, code)=>{
                                        console.error(`[CryptoStore] delete fail: ${code}`);
                                        this.stats.errorCount++;
                                    }
                                });
                            }
                            batchRemove(keys, callback) {
                                let remaining = keys.length;
                                if (0 === remaining) {
                                    if (callback) callback();
                                    return;
                                }
                                keys.forEach((key)=>{
                                    _system2.default.delete({
                                        key: key,
                                        success: ()=>{
                                            remaining--;
                                            if (0 === remaining && callback) callback();
                                        },
                                        fail: ()=>{
                                            remaining--;
                                            if (0 === remaining && callback) callback();
                                        }
                                    });
                                });
                            }
                            clearAll(success) {
                                _system2.default.clear({
                                    success: ()=>{
                                        console.log('[CryptoStore] clearAll');
                                        this.stats = {
                                            encryptCount: 0,
                                            decryptCount: 0,
                                            errorCount: 0
                                        };
                                        if (success) success();
                                    },
                                    fail: (data, code)=>{
                                        console.error(`[CryptoStore] clearAll fail: ${code}`);
                                    }
                                });
                            }
                            getStats() {
                                return _objectSpread({}, this.stats);
                            }
                        }
                        var _default = exports["default"] = CryptoStore;
                    },
                    "./src/lib/data-manager.js" (__unused_rspack_module, exports, __webpack_require__) {
                        "use strict";
                        Object.defineProperty(exports, "__esModule", {
                            value: true
                        });
                        exports["default"] = exports.EXPIRY = exports.DATA_TYPE = void 0;
                        var _cryptoStore = _interopRequireWildcard(__webpack_require__("./src/lib/crypto-store.js"));
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
                        const DATA_TYPE = exports.DATA_TYPE = {
                            POSTURE_DAILY: 'posture_daily',
                            POSTURE_ALERT: 'posture_alert',
                            HR_FEATURE: 'hr_feature',
                            STRESS_FEATURE: 'stress_feature',
                            SETTINGS: 'settings'
                        };
                        const EXPIRY = exports.EXPIRY = {
                            [DATA_TYPE.POSTURE_DAILY]: 604800000,
                            [DATA_TYPE.POSTURE_ALERT]: 2592000000,
                            [DATA_TYPE.HR_FEATURE]: 2592000000,
                            [DATA_TYPE.STRESS_FEATURE]: 2592000000
                        };
                        const LEVEL_MAP = {
                            [DATA_TYPE.POSTURE_DAILY]: _cryptoStore.CRYPTO_LEVEL.L1,
                            [DATA_TYPE.POSTURE_ALERT]: _cryptoStore.CRYPTO_LEVEL.L2,
                            [DATA_TYPE.HR_FEATURE]: _cryptoStore.CRYPTO_LEVEL.L3,
                            [DATA_TYPE.STRESS_FEATURE]: _cryptoStore.CRYPTO_LEVEL.L3,
                            [DATA_TYPE.SETTINGS]: _cryptoStore.CRYPTO_LEVEL.L1
                        };
                        class DataManager {
                            constructor(){
                                this.cryptoStore = new _cryptoStore.default();
                                this.keyRegistry = [];
                            }
                            _makeKey(type, date) {
                                const dateStr = date || this._getDateStr();
                                return `pg_${type}_${dateStr}`;
                            }
                            _getDateStr(ts) {
                                const d = ts ? new Date(ts) : new Date();
                                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            }
                            savePostureStats(stats, callback) {
                                const key = this._makeKey(DATA_TYPE.POSTURE_DAILY);
                                const data = _objectSpread(_objectSpread({}, stats), {}, {
                                    date: this._getDateStr(),
                                    timestamp: Date.now()
                                });
                                this._registerKey(key);
                                this.cryptoStore.save(LEVEL_MAP[DATA_TYPE.POSTURE_DAILY], key, data, ()=>{
                                    console.log(`[DataManager] save posture stats: ${key}`);
                                    if (callback) callback(true);
                                }, ()=>{
                                    if (callback) callback(false);
                                });
                            }
                            savePostureAlert(alert, callback) {
                                const today = this._getDateStr();
                                const key = this._makeKey(DATA_TYPE.POSTURE_ALERT) + '_' + Date.now();
                                const data = _objectSpread(_objectSpread({}, alert), {}, {
                                    date: today,
                                    timestamp: alert.timestamp || Date.now()
                                });
                                this._registerKey(key);
                                this.cryptoStore.save(LEVEL_MAP[DATA_TYPE.POSTURE_ALERT], key, data, ()=>{
                                    console.log("[DataManager] save posture alert");
                                    if (callback) callback(true);
                                }, ()=>{
                                    if (callback) callback(false);
                                });
                            }
                            saveHRFeature(feature, callback) {
                                const key = this._makeKey(DATA_TYPE.HR_FEATURE) + '_' + feature.hourBucket;
                                this._registerKey(key);
                                this.cryptoStore.save(LEVEL_MAP[DATA_TYPE.HR_FEATURE], key, feature, ()=>{
                                    console.log("[DataManager] save HR feature");
                                    if (callback) callback(true);
                                }, ()=>{
                                    if (callback) callback(false);
                                });
                            }
                            saveStressFeature(feature, callback) {
                                const key = this._makeKey(DATA_TYPE.STRESS_FEATURE) + '_' + feature.hourBucket;
                                this._registerKey(key);
                                this.cryptoStore.save(LEVEL_MAP[DATA_TYPE.STRESS_FEATURE], key, feature, ()=>{
                                    console.log("[DataManager] save stress feature");
                                    if (callback) callback(true);
                                }, ()=>{
                                    if (callback) callback(false);
                                });
                            }
                            loadTodayPostureStats(callback) {
                                const key = this._makeKey(DATA_TYPE.POSTURE_DAILY);
                                this.cryptoStore.load(LEVEL_MAP[DATA_TYPE.POSTURE_DAILY], key, callback, ()=>{
                                    callback(null);
                                });
                            }
                            loadTodayAlerts(callback) {
                                const todayPrefix = this._makeKey(DATA_TYPE.POSTURE_ALERT);
                                const todayKeys = this.keyRegistry.filter((k)=>k.startsWith(todayPrefix));
                                if (0 === todayKeys.length) return void callback([]);
                                const alerts = [];
                                let remaining = todayKeys.length;
                                todayKeys.forEach((key)=>{
                                    this.cryptoStore.load(LEVEL_MAP[DATA_TYPE.POSTURE_ALERT], key, (data)=>{
                                        if (data) alerts.push(data);
                                        remaining--;
                                        if (0 === remaining) {
                                            alerts.sort((a, b)=>a.timestamp - b.timestamp);
                                            callback(alerts);
                                        }
                                    }, ()=>{
                                        remaining--;
                                        if (0 === remaining) callback(alerts);
                                    });
                                });
                            }
                            loadHRFeatures(days, callback) {
                                const features = [];
                                let remaining = 0;
                                for(let i = 0; i < days; i++){
                                    const date = new Date();
                                    date.setDate(date.getDate() - i);
                                    const dateStr = this._getDateStr(date.getTime());
                                    const prefix = `pg_${DATA_TYPE.HR_FEATURE}_${dateStr}`;
                                    const keys = this.keyRegistry.filter((k)=>k.startsWith(prefix));
                                    remaining += keys.length;
                                    keys.forEach((key)=>{
                                        this.cryptoStore.load(LEVEL_MAP[DATA_TYPE.HR_FEATURE], key, (data)=>{
                                            if (data) features.push(data);
                                            remaining--;
                                            if (0 === remaining) callback(features);
                                        }, ()=>{
                                            remaining--;
                                            if (0 === remaining) callback(features);
                                        });
                                    });
                                }
                                if (0 === remaining) callback(features);
                            }
                            saveSettings(settings, callback) {
                                const key = 'pg_settings';
                                this._registerKey(key);
                                this.cryptoStore.save(_cryptoStore.CRYPTO_LEVEL.L1, key, settings, ()=>{
                                    if (callback) callback(true);
                                }, ()=>{
                                    if (callback) callback(false);
                                });
                            }
                            loadSettings(callback) {
                                this.cryptoStore.load(_cryptoStore.CRYPTO_LEVEL.L1, 'pg_settings', callback, ()=>{
                                    callback({
                                        sedentaryThreshold: 1800000,
                                        vibrationEnabled: true,
                                        alertEnabled: true
                                    });
                                });
                            }
                            cleanExpired(callback) {
                                const now = Date.now();
                                const expiredKeys = [];
                                this.keyRegistry.forEach((key)=>{
                                    for (const [type, expiryMs] of Object.entries(EXPIRY))if (key.includes(type)) {
                                        const dateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
                                        if (dateMatch) {
                                            const dataDate = new Date(dateMatch[1]).getTime();
                                            if (now - dataDate > expiryMs) expiredKeys.push(key);
                                        }
                                        break;
                                    }
                                });
                                if (0 === expiredKeys.length) {
                                    if (callback) callback(0);
                                    return;
                                }
                                this.keyRegistry = this.keyRegistry.filter((k)=>!expiredKeys.includes(k));
                                this.cryptoStore.batchRemove(expiredKeys, ()=>{
                                    console.log(`[DataManager] cleaned ${expiredKeys.length} expired keys`);
                                    if (callback) callback(expiredKeys.length);
                                });
                            }
                            clearAllPrivacyData(callback) {
                                const privacyKeys = this.keyRegistry.filter((k)=>!k.includes(DATA_TYPE.SETTINGS));
                                this.keyRegistry = this.keyRegistry.filter((k)=>k.includes(DATA_TYPE.SETTINGS));
                                this.cryptoStore.batchRemove(privacyKeys, ()=>{
                                    console.log(`[DataManager] cleared ${privacyKeys.length} privacy keys`);
                                    if (callback) callback();
                                });
                            }
                            getSummary(callback) {
                                const summary = {
                                    totalKeys: this.keyRegistry.length,
                                    postureDaily: 0,
                                    postureAlerts: 0,
                                    hrFeatures: 0,
                                    stressFeatures: 0
                                };
                                this.keyRegistry.forEach((key)=>{
                                    if (key.includes(DATA_TYPE.POSTURE_DAILY)) summary.postureDaily++;
                                    else if (key.includes(DATA_TYPE.POSTURE_ALERT)) summary.postureAlerts++;
                                    else if (key.includes(DATA_TYPE.HR_FEATURE)) summary.hrFeatures++;
                                    else if (key.includes(DATA_TYPE.STRESS_FEATURE)) summary.stressFeatures++;
                                });
                                summary.cryptoStats = this.cryptoStore.getStats();
                                callback(summary);
                            }
                            _registerKey(key) {
                                if (!this.keyRegistry.includes(key)) this.keyRegistry.push(key);
                            }
                        }
                        var _default = exports["default"] = DataManager;
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
                    __webpack_require__.g = (()=>{
                        if ('object' == typeof globalThis) return globalThis;
                        try {
                            return this || new Function('return this')();
                        } catch (e) {
                            if ('object' == typeof window) return window;
                        }
                    })();
                })();
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
                                    "shield-icon"
                                ]
                            ],
                            {
                                fontSize: "24px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "protect-status"
                                ]
                            ],
                            {
                                width: "420px",
                                paddingTop: "20px",
                                paddingRight: "20px",
                                paddingBottom: "20px",
                                paddingLeft: "20px",
                                backgroundColor: "#1a2e1a",
                                borderTopColor: "#00d4aa",
                                borderRightColor: "#00d4aa",
                                borderBottomColor: "#00d4aa",
                                borderLeftColor: "#00d4aa",
                                borderStyle: "solid",
                                borderTopWidth: "1px",
                                borderRightWidth: "1px",
                                borderBottomWidth: "1px",
                                borderLeftWidth: "1px",
                                borderRadius: "12px",
                                flexDirection: "column",
                                alignItems: "center",
                                marginTop: "10px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "protect-icon"
                                ]
                            ],
                            {
                                fontSize: "36px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "protect-title"
                                ]
                            ],
                            {
                                fontSize: "20px",
                                color: "#00d4aa",
                                fontWeight: "bold",
                                marginTop: "8px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "protect-desc"
                                ]
                            ],
                            {
                                fontSize: "14px",
                                color: "#888888",
                                marginTop: "4px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "level-section"
                                ]
                            ],
                            {
                                width: "420px",
                                marginTop: "15px"
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
                                    "level-card"
                                ]
                            ],
                            {
                                backgroundColor: "#1a1a2e",
                                borderRadius: "10px",
                                paddingTop: "12px",
                                paddingRight: "15px",
                                paddingBottom: "12px",
                                paddingLeft: "15px",
                                marginBottom: "8px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "level-header"
                                ]
                            ],
                            {
                                flexDirection: "row",
                                alignItems: "center"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "level-badge"
                                ]
                            ],
                            {
                                width: "40px",
                                height: "24px",
                                borderRadius: "4px",
                                textAlign: "center",
                                fontSize: "14px",
                                fontWeight: "bold",
                                color: "#ffffff",
                                justifyContent: "center"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "level-badge"
                                ],
                                [
                                    0,
                                    "l1"
                                ]
                            ],
                            {
                                backgroundColor: "#4ecdc4"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "level-badge"
                                ],
                                [
                                    0,
                                    "l2"
                                ]
                            ],
                            {
                                backgroundColor: "#ffd93d"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "level-badge"
                                ],
                                [
                                    0,
                                    "l3"
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
                                    "level-info"
                                ]
                            ],
                            {
                                flex: 1,
                                marginLeft: "12px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "level-name"
                                ]
                            ],
                            {
                                fontSize: "16px",
                                color: "#ffffff",
                                fontWeight: "bold"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "level-desc"
                                ]
                            ],
                            {
                                fontSize: "12px",
                                color: "#888888",
                                marginTop: "2px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "level-method"
                                ]
                            ],
                            {
                                fontSize: "14px",
                                color: "#00d4aa",
                                fontWeight: "bold"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "compare-section"
                                ]
                            ],
                            {
                                width: "420px",
                                marginTop: "15px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "compare-row"
                                ]
                            ],
                            {
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "compare-item"
                                ]
                            ],
                            {
                                width: "180px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "compare-label"
                                ]
                            ],
                            {
                                fontSize: "14px",
                                color: "#888888",
                                marginBottom: "6px",
                                textAlign: "center"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "compare-data"
                                ]
                            ],
                            {
                                paddingTop: "10px",
                                paddingRight: "10px",
                                paddingBottom: "10px",
                                paddingLeft: "10px",
                                borderRadius: "8px",
                                height: "80px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "raw-data"
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
                                    "anon-data"
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
                                    "data-line"
                                ]
                            ],
                            {
                                fontSize: "12px",
                                color: "#cccccc",
                                marginBottom: "4px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "compare-arrow"
                                ]
                            ],
                            {
                                fontSize: "24px",
                                color: "#00d4aa",
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
                                    "lifecycle-section"
                                ]
                            ],
                            {
                                width: "420px",
                                marginTop: "15px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "lifecycle-item"
                                ]
                            ],
                            {
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: "10px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "lc-type"
                                ]
                            ],
                            {
                                width: "80px",
                                fontSize: "14px",
                                color: "#888888"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "lc-bar"
                                ]
                            ],
                            {
                                flex: 1,
                                height: "8px",
                                backgroundColor: "#333333",
                                borderRadius: "4px",
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
                                    "lc-fill"
                                ]
                            ],
                            {
                                height: "8px",
                                backgroundColor: "#4ecdc4",
                                borderRadius: "4px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "l2-fill"
                                ]
                            ],
                            {
                                backgroundColor: "#ffd93d"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "l3-fill"
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
                                    "lc-days"
                                ]
                            ],
                            {
                                width: "80px",
                                fontSize: "12px",
                                color: "#888888",
                                textAlign: "right"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "action-section"
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
                                width: "300px",
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
                                    "btn-clear"
                                ]
                            ],
                            {
                                backgroundColor: "#333333",
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
                                    "btn-text"
                                ]
                            ],
                            {
                                fontSize: "16px",
                                color: "#ffffff"
                            }
                        ]
                    ];
                    var $app_script$ = function __scriptModule__(module, exports, $app_require$1) {
                        "use strict";
                        Object.defineProperty(exports, "__esModule", {
                            value: true
                        });
                        exports.default = void 0;
                        var _system = _interopRequireDefault($app_require$1("@app-module/system.prompt"));
                        var _dataManager = _interopRequireDefault(__webpack_require__("./src/lib/data-manager.js"));
                        function _interopRequireDefault(e) {
                            return e && e.__esModule ? e : {
                                default: e
                            };
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
                                lcStatPercent: 85,
                                lcStatDays: 6,
                                lcAlertPercent: 60,
                                lcAlertDays: 18,
                                lcPrivacyPercent: 30,
                                lcPrivacyHours: 16,
                                dataManager: null
                            },
                            onReady () {
                                this.dataManager = new _dataManager.default();
                                this._updateLifecycle();
                            },
                            _updateLifecycle () {
                                const now = new Date();
                                const hour = now.getHours();
                                this.lcStatDays = 6;
                                this.lcStatPercent = Math.round(6 / 7 * 100);
                                this.lcAlertDays = 18;
                                this.lcAlertPercent = Math.round(60);
                                this.lcPrivacyHours = 24 - hour;
                                this.lcPrivacyPercent = Math.round((24 - hour) / 24 * 100);
                            },
                            back (event) {
                                if (!event || 'right' === event.direction) Promise.resolve().then(()=>_interopRequireWildcard($app_require$1("@app-module/system.router"))).then((router)=>{
                                    router.back();
                                });
                            },
                            clearPrivacyData () {
                                _system.default.showToast({
                                    message: '正在清除隐私数据...'
                                });
                                this.dataManager.clearAllPrivacyData(()=>{
                                    _system.default.showToast({
                                        message: '✅ 隐私数据已清除'
                                    });
                                    this._updateLifecycle();
                                });
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
                                        value: "隐私防护"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "shield-icon"
                                        ],
                                        value: "🛡️"
                                    }
                                }, [])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "protect-status"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "protect-icon"
                                        ],
                                        value: "✅"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "protect-title"
                                        ],
                                        value: "隐私数据已加密保护"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "protect-desc"
                                        ],
                                        value: "所有敏感数据均在本地加密存储"
                                    }
                                }, [])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "level-section"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "section-title"
                                        ],
                                        value: "数据加密分级"
                                    }
                                }, []),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "level-card"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "level-header"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "level-badge",
                                                    "l1"
                                                ],
                                                value: "L1"
                                            }
                                        }, []),
                                        aiot.__ce__("div", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "level-info"
                                                ]
                                            }
                                        }, [
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "level-name"
                                                    ],
                                                    value: "普通统计"
                                                }
                                            }, []),
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "level-desc"
                                                    ],
                                                    value: "体态计数、每日汇总"
                                                }
                                            }, [])
                                        ]),
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "level-method"
                                                ],
                                                value: "明文"
                                            }
                                        }, [])
                                    ])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "level-card"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "level-header"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "level-badge",
                                                    "l2"
                                                ],
                                                value: "L2"
                                            }
                                        }, []),
                                        aiot.__ce__("div", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "level-info"
                                                ]
                                            }
                                        }, [
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "level-name"
                                                    ],
                                                    value: "敏感记录"
                                                }
                                            }, []),
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "level-desc"
                                                    ],
                                                    value: "体态异常详情"
                                                }
                                            }, [])
                                        ]),
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "level-method"
                                                ],
                                                value: "AES-ECB"
                                            }
                                        }, [])
                                    ])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "level-card"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "level-header"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "level-badge",
                                                    "l3"
                                                ],
                                                value: "L3"
                                            }
                                        }, []),
                                        aiot.__ce__("div", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "level-info"
                                                ]
                                            }
                                        }, [
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "level-name"
                                                    ],
                                                    value: "隐私数据"
                                                }
                                            }, []),
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "level-desc"
                                                    ],
                                                    value: "心率、压力原始值"
                                                }
                                            }, [])
                                        ]),
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "level-method"
                                                ],
                                                value: "AES-CBC"
                                            }
                                        }, [])
                                    ])
                                ])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "compare-section"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "section-title"
                                        ],
                                        value: "脱敏处理效果"
                                    }
                                }, []),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "compare-row"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "compare-item"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "compare-label"
                                                ],
                                                value: "处理前"
                                            }
                                        }, []),
                                        aiot.__ce__("div", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "compare-data",
                                                    "raw-data"
                                                ]
                                            }
                                        }, [
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "data-line"
                                                    ],
                                                    value: "心率: 72 bpm"
                                                }
                                            }, []),
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "data-line"
                                                    ],
                                                    value: "时间: 14:32:15"
                                                }
                                            }, []),
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "data-line"
                                                    ],
                                                    value: "坐标: 39.9°N"
                                                }
                                            }, [])
                                        ])
                                    ]),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "compare-arrow"
                                            ],
                                            value: "→"
                                        }
                                    }, []),
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "compare-item"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("text", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "compare-label"
                                                ],
                                                value: "处理后"
                                            }
                                        }, []),
                                        aiot.__ce__("div", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "compare-data",
                                                    "anon-data"
                                                ]
                                            }
                                        }, [
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "data-line"
                                                    ],
                                                    value: "区间: 正常"
                                                }
                                            }, []),
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "data-line"
                                                    ],
                                                    value: "时段: 14:00"
                                                }
                                            }, []),
                                            aiot.__ce__("text", {
                                                __vm__: _vm_,
                                                __opts__: {
                                                    classList: [
                                                        "data-line"
                                                    ],
                                                    value: "特征: 仅保留"
                                                }
                                            }, [])
                                        ])
                                    ])
                                ])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "lifecycle-section"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "section-title"
                                        ],
                                        value: "数据生命周期"
                                    }
                                }, []),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "lifecycle-item"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "lc-type"
                                            ],
                                            value: "普通统计"
                                        }
                                    }, []),
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "lc-bar"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("div", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "lc-fill"
                                                ],
                                                style: function() {
                                                    return __webpack_require__.g.$translateStyle$("width: " + _vm_.lcStatPercent + "%;");
                                                }
                                            }
                                        }, [])
                                    ]),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "lc-days"
                                            ],
                                            value: function() {
                                                return _vm_.lcStatDays + "天后过期";
                                            }
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "lifecycle-item"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "lc-type"
                                            ],
                                            value: "异常记录"
                                        }
                                    }, []),
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "lc-bar"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("div", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "lc-fill",
                                                    "l2-fill"
                                                ],
                                                style: function() {
                                                    return __webpack_require__.g.$translateStyle$("width: " + _vm_.lcAlertPercent + "%;");
                                                }
                                            }
                                        }, [])
                                    ]),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "lc-days"
                                            ],
                                            value: function() {
                                                return _vm_.lcAlertDays + "天后过期";
                                            }
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "lifecycle-item"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "lc-type"
                                            ],
                                            value: "隐私数据"
                                        }
                                    }, []),
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "lc-bar"
                                            ]
                                        }
                                    }, [
                                        aiot.__ce__("div", {
                                            __vm__: _vm_,
                                            __opts__: {
                                                classList: [
                                                    "lc-fill",
                                                    "l3-fill"
                                                ],
                                                style: function() {
                                                    return __webpack_require__.g.$translateStyle$("width: " + _vm_.lcPrivacyPercent + "%;");
                                                }
                                            }
                                        }, [])
                                    ]),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "lc-days"
                                            ],
                                            value: function() {
                                                return _vm_.lcPrivacyHours + "小时后过期";
                                            }
                                        }
                                    }, [])
                                ])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "action-section"
                                    ]
                                }
                            }, [
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "btn",
                                            "btn-clear"
                                        ],
                                        events: {
                                            click: function(evt) {
                                                return _vm_.clearPrivacyData(evt);
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
                                            value: "🗑️ 一键清除隐私数据"
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZXMvcHJpdmFjeS9wcml2YWN5LmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcG9zdHVyZS1ndWFyZC9zcmMvbGliL2NyeXB0by1zdG9yZS5qcyIsIndlYnBhY2s6Ly9wb3N0dXJlLWd1YXJkL3NyYy9saWIvZGF0YS1tYW5hZ2VyLmpzIiwid2VicGFjazovL3Bvc3R1cmUtZ3VhcmQvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9wb3N0dXJlLWd1YXJkL3dlYnBhY2svcnVudGltZS9yc3BhY2tfdmVyc2lvbiIsIndlYnBhY2s6Ly9wb3N0dXJlLWd1YXJkL3dlYnBhY2svcnVudGltZS9yc3BhY2tfdW5pcXVlX2lkIiwid2VicGFjazovL3Bvc3R1cmUtZ3VhcmQvc3JjL3BhZ2VzL3ByaXZhY3kvcHJpdmFjeS51eCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGNyeXB0by1zdG9yZS5qcyAtIOi9u+mHj+WMlkFFU+WIhue6p+WKoOWvhuacrOWcsOWtmOWCqFxuICpcbiAqIOS4iee6p+aVsOaNruWuieWFqOetlueVpe+8mlxuICogLSBMMS3mma7pgJrvvJrkvZPmgIHnu5/orqHorqHmlbDvvIzmmI7mloflrZjlgqhcbiAqIC0gTDIt5pWP5oSf77ya5L2T5oCB5byC5bi46K6w5b2V77yMQUVTLUVDQuWKoOWvhlxuICogLSBMMy3pmpDnp4HvvJrlv4Pnjocv5Y6L5Yqb5Y6f5aeL5pWw5o2u77yMQUVTLUNCQ+WKoOWvhlxuICpcbiAqIOWfuuS6jiBAc3lzdGVtLmNyeXB0byDlkowgQHN5c3RlbS5zdG9yYWdlIOWunueOsFxuICovXG5cbmltcG9ydCBjcnlwdG8gZnJvbSAnQHN5c3RlbS5jcnlwdG8nXG5pbXBvcnQgc3RvcmFnZSBmcm9tICdAc3lzdGVtLnN0b3JhZ2UnXG5cbi8vIOWKoOWvhue6p+WIq+W4uOmHj1xuY29uc3QgQ1JZUFRPX0xFVkVMID0ge1xuICBMMTogJ0wxJywgIC8vIOaZrumAmu+8iOaYjuaWh++8iVxuICBMMjogJ0wyJywgIC8vIOaVj+aEn++8iEFFUy1FQ0LvvIlcbiAgTDM6ICdMMycsICAvLyDpmpDnp4HvvIhBRVMtQ0JD77yJXG59XG5cbi8vIOWvhumSpemFjee9ru+8iOWunumZheW6lOS7juiuvuWkh+WuieWFqOWtmOWCqOa0vueUn++8iVxuY29uc3QgS0VZUyA9IHtcbiAgTDI6ICdwb3N0dXJlX2d1YXJkX2wyX2tleV8xNicsICAvLyAxNuWtl+iKgkFFUy0xMjjlr4bpkqVcbiAgTDM6ICdwb3N0dXJlX2d1YXJkX2wzX2tleV8xNicsICAvLyAxNuWtl+iKgkFFUy0xMjjlr4bpkqVcbn1cblxuY2xhc3MgQ3J5cHRvU3RvcmUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyDliqDlr4bnu5/orqFcbiAgICB0aGlzLnN0YXRzID0ge1xuICAgICAgZW5jcnlwdENvdW50OiAwLFxuICAgICAgZGVjcnlwdENvdW50OiAwLFxuICAgICAgZXJyb3JDb3VudDogMCxcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog5a2Y5YKo5pWw5o2u77yI6Ieq5Yqo5YiG57qn5Yqg5a+G77yJXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsZXZlbCAtIOWKoOWvhue6p+WIqyAnTDEnfCdMMid8J0wzJ1xuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0g5a2Y5YKo6ZSu5ZCNXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgLSDlrZjlgqjlgLzvvIjlr7nosaHmiJbljp/lp4vnsbvlnovvvIlcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gc3VjY2VzcyAtIOaIkOWKn+Wbnuiwg1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmYWlsIC0g5aSx6LSl5Zue6LCDXG4gICAqL1xuICBzYXZlKGxldmVsLCBrZXksIHZhbHVlLCBzdWNjZXNzLCBmYWlsKSB7XG4gICAgY29uc3QgcGxhaW4gPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSlcblxuICAgIGlmIChsZXZlbCA9PT0gQ1JZUFRPX0xFVkVMLkwxKSB7XG4gICAgICAvLyBMMe+8muaYjuaWh+WtmOWCqFxuICAgICAgc3RvcmFnZS5zZXQoe1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgdmFsdWU6IHBsYWluLFxuICAgICAgICBzdWNjZXNzOiAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFtDcnlwdG9TdG9yZV0gTDEgc2F2ZTogJHtrZXl9YClcbiAgICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2VzcygpXG4gICAgICAgIH0sXG4gICAgICAgIGZhaWw6IChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgW0NyeXB0b1N0b3JlXSBMMSBzYXZlIGZhaWw6ICR7Y29kZX1gKVxuICAgICAgICAgIHRoaXMuc3RhdHMuZXJyb3JDb3VudCsrXG4gICAgICAgICAgaWYgKGZhaWwpIGZhaWwoZGF0YSwgY29kZSlcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBMMi9MM++8mkFFU+WKoOWvhuWQjuWtmOWCqFxuICAgIGNvbnN0IGVuY0tleSA9IGNyeXB0by5idG9hKEtFWVNbbGV2ZWxdKVxuXG4gICAgY3J5cHRvLmVuY3J5cHQoe1xuICAgICAgZGF0YTogcGxhaW4sXG4gICAgICBrZXk6IGVuY0tleSxcbiAgICAgIGFsZ286ICdBRVMnLFxuICAgICAgc3VjY2VzczogKHJlcykgPT4ge1xuICAgICAgICB0aGlzLnN0YXRzLmVuY3J5cHRDb3VudCsrXG4gICAgICAgIHN0b3JhZ2Uuc2V0KHtcbiAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICB2YWx1ZTogcmVzLmRhdGEsXG4gICAgICAgICAgc3VjY2VzczogKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtDcnlwdG9TdG9yZV0gJHtsZXZlbH0gc2F2ZTogJHtrZXl9YClcbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSBzdWNjZXNzKClcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZhaWw6IChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbQ3J5cHRvU3RvcmVdICR7bGV2ZWx9IHN0b3JhZ2UgZmFpbDogJHtjb2RlfWApXG4gICAgICAgICAgICB0aGlzLnN0YXRzLmVycm9yQ291bnQrK1xuICAgICAgICAgICAgaWYgKGZhaWwpIGZhaWwoZGF0YSwgY29kZSlcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtDcnlwdG9TdG9yZV0gJHtsZXZlbH0gZW5jcnlwdCBmYWlsOiAke2NvZGV9YClcbiAgICAgICAgdGhpcy5zdGF0cy5lcnJvckNvdW50KytcbiAgICAgICAgaWYgKGZhaWwpIGZhaWwoZGF0YSwgY29kZSlcbiAgICAgIH0sXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiDor7vlj5bmlbDmja7vvIjoh6rliqjop6Plr4bvvIlcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxldmVsIC0g5Yqg5a+G57qn5YirXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSDlrZjlgqjplK7lkI1cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlm57osIMgKHZhbHVlKSA9PiB7fVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmYWlsIC0g5aSx6LSl5Zue6LCDXG4gICAqL1xuICBsb2FkKGxldmVsLCBrZXksIGNhbGxiYWNrLCBmYWlsKSB7XG4gICAgc3RvcmFnZS5nZXQoe1xuICAgICAga2V5OiBrZXksXG4gICAgICBzdWNjZXNzOiAoZW5jcnlwdGVkKSA9PiB7XG4gICAgICAgIGlmIChsZXZlbCA9PT0gQ1JZUFRPX0xFVkVMLkwxKSB7XG4gICAgICAgICAgLy8gTDHvvJrmmI7mlofnm7TmjqXop6PmnpBcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2FsbGJhY2soSlNPTi5wYXJzZShlbmNyeXB0ZWQpKVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVuY3J5cHRlZClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBMMi9MM++8mkFFU+ino+WvhlxuICAgICAgICBjb25zdCBlbmNLZXkgPSBjcnlwdG8uYnRvYShLRVlTW2xldmVsXSlcblxuICAgICAgICBjcnlwdG8uZGVjcnlwdCh7XG4gICAgICAgICAgZGF0YTogZW5jcnlwdGVkLFxuICAgICAgICAgIGtleTogZW5jS2V5LFxuICAgICAgICAgIGFsZ286ICdBRVMnLFxuICAgICAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHMuZGVjcnlwdENvdW50KytcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKEpTT04ucGFyc2UocmVzLmRhdGEpKVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhyZXMuZGF0YSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIGZhaWw6IChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbQ3J5cHRvU3RvcmVdICR7bGV2ZWx9IGRlY3J5cHQgZmFpbDogJHtjb2RlfWApXG4gICAgICAgICAgICB0aGlzLnN0YXRzLmVycm9yQ291bnQrK1xuICAgICAgICAgICAgaWYgKGZhaWwpIGZhaWwoZGF0YSwgY29kZSlcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtDcnlwdG9TdG9yZV0gJHtsZXZlbH0gbG9hZCBmYWlsOiAke2NvZGV9YClcbiAgICAgICAgdGhpcy5zdGF0cy5lcnJvckNvdW50KytcbiAgICAgICAgaWYgKGZhaWwpIGZhaWwoZGF0YSwgY29kZSlcbiAgICAgIH0sXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiDliKDpmaTmlbDmja5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIOWtmOWCqOmUruWQjVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdWNjZXNzIC0g5oiQ5Yqf5Zue6LCDXG4gICAqL1xuICByZW1vdmUoa2V5LCBzdWNjZXNzKSB7XG4gICAgc3RvcmFnZS5kZWxldGUoe1xuICAgICAga2V5OiBrZXksXG4gICAgICBzdWNjZXNzOiAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbQ3J5cHRvU3RvcmVdIGRlbGV0ZTogJHtrZXl9YClcbiAgICAgICAgaWYgKHN1Y2Nlc3MpIHN1Y2Nlc3MoKVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtDcnlwdG9TdG9yZV0gZGVsZXRlIGZhaWw6ICR7Y29kZX1gKVxuICAgICAgICB0aGlzLnN0YXRzLmVycm9yQ291bnQrK1xuICAgICAgfSxcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIOaJuemHj+WIoOmZpO+8iOaMieWJjee8gOWMuemFje+8iVxuICAgKiDms6jmhI/vvJpzdG9yYWdlIEFQSSDkuI3mlK/mjIHpgY3ljobvvIzpnIDopoHlpJbpg6jnu7TmiqTplK7lkI3liJfooahcbiAgICogQHBhcmFtIHtBcnJheX0ga2V5cyAtIOmUruWQjeaVsOe7hFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWujOaIkOWbnuiwg1xuICAgKi9cbiAgYmF0Y2hSZW1vdmUoa2V5cywgY2FsbGJhY2spIHtcbiAgICBsZXQgcmVtYWluaW5nID0ga2V5cy5sZW5ndGhcbiAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBzdG9yYWdlLmRlbGV0ZSh7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBzdWNjZXNzOiAoKSA9PiB7XG4gICAgICAgICAgcmVtYWluaW5nLS1cbiAgICAgICAgICBpZiAocmVtYWluaW5nID09PSAwICYmIGNhbGxiYWNrKSBjYWxsYmFjaygpXG4gICAgICAgIH0sXG4gICAgICAgIGZhaWw6ICgpID0+IHtcbiAgICAgICAgICByZW1haW5pbmctLVxuICAgICAgICAgIGlmIChyZW1haW5pbmcgPT09IDAgJiYgY2FsbGJhY2spIGNhbGxiYWNrKClcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiDmuIXnqbrmiYDmnInmlbDmja5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gc3VjY2VzcyAtIOaIkOWKn+Wbnuiwg1xuICAgKi9cbiAgY2xlYXJBbGwoc3VjY2Vzcykge1xuICAgIHN0b3JhZ2UuY2xlYXIoe1xuICAgICAgc3VjY2VzczogKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygnW0NyeXB0b1N0b3JlXSBjbGVhckFsbCcpXG4gICAgICAgIHRoaXMuc3RhdHMgPSB7IGVuY3J5cHRDb3VudDogMCwgZGVjcnlwdENvdW50OiAwLCBlcnJvckNvdW50OiAwIH1cbiAgICAgICAgaWYgKHN1Y2Nlc3MpIHN1Y2Nlc3MoKVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtDcnlwdG9TdG9yZV0gY2xlYXJBbGwgZmFpbDogJHtjb2RlfWApXG4gICAgICB9LFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICog6I635Y+W5Yqg5a+G57uf6K6h5L+h5oGvXG4gICAqL1xuICBnZXRTdGF0cygpIHtcbiAgICByZXR1cm4geyAuLi50aGlzLnN0YXRzIH1cbiAgfVxufVxuXG5leHBvcnQgeyBDUllQVE9fTEVWRUwgfVxuZXhwb3J0IGRlZmF1bHQgQ3J5cHRvU3RvcmVcbiIsIi8qKlxuICogZGF0YS1tYW5hZ2VyLmpzIC0g5pWw5o2u55Sf5ZG95ZGo5pyf566h55CGXG4gKlxuICog566h55CG5omA5pyJ5pys5Zyw5pWw5o2u55qE5a2Y5YKo44CB5p+l6K+i44CB6L+H5pyf5riF55CG77yaXG4gKiAtIOS9k+aAgee7n+iuoeaVsOaNru+8iEwx77yJXG4gKiAtIOS9k+aAgeW8guW4uOiusOW9le+8iEwy5Yqg5a+G77yJXG4gKiAtIOW/g+eOhy/ljovlipvljp/lp4vmlbDmja7vvIhMM+WKoOWvhu+8iVxuICogLSDmlbDmja7ov4fmnJ/oh6rliqjplIDmr4FcbiAqIC0g5LiA6ZSu5riF6Zmk6ZqQ56eB5pWw5o2uXG4gKi9cblxuaW1wb3J0IENyeXB0b1N0b3JlLCB7IENSWVBUT19MRVZFTCB9IGZyb20gJy4vY3J5cHRvLXN0b3JlJ1xuXG4vLyDmlbDmja7nsbvlnovluLjph49cbmNvbnN0IERBVEFfVFlQRSA9IHtcbiAgUE9TVFVSRV9EQUlMWTogJ3Bvc3R1cmVfZGFpbHknLCAgICAgICAgIC8vIOavj+aXpeS9k+aAgee7n+iuoVxuICBQT1NUVVJFX0FMRVJUOiAncG9zdHVyZV9hbGVydCcsICAgICAgICAgLy8g5L2T5oCB5byC5bi46K6w5b2VXG4gIEhSX0ZFQVRVUkU6ICdocl9mZWF0dXJlJywgICAgICAgICAgICAgICAvLyDlv4PnjofohLHmlY/nibnlvoFcbiAgU1RSRVNTX0ZFQVRVUkU6ICdzdHJlc3NfZmVhdHVyZScsICAgICAgIC8vIOWOi+WKm+iEseaVj+eJueW+gVxuICBTRVRUSU5HUzogJ3NldHRpbmdzJywgICAgICAgICAgICAgICAgICAgLy8g5bqU55So6K6+572uXG59XG5cbi8vIOaVsOaNrui/h+acn+aXtumXtOmFjee9ru+8iOavq+enku+8iVxuY29uc3QgRVhQSVJZID0ge1xuICBbREFUQV9UWVBFLlBPU1RVUkVfREFJTFldOiA3ICogMjQgKiAzNjAwICogMTAwMCwgICAgLy8gN+WkqVxuICBbREFUQV9UWVBFLlBPU1RVUkVfQUxFUlRdOiAzMCAqIDI0ICogMzYwMCAqIDEwMDAsICAgLy8gMzDlpKlcbiAgW0RBVEFfVFlQRS5IUl9GRUFUVVJFXTogMzAgKiAyNCAqIDM2MDAgKiAxMDAwLCAgICAgIC8vIDMw5aSpXG4gIFtEQVRBX1RZUEUuU1RSRVNTX0ZFQVRVUkVdOiAzMCAqIDI0ICogMzYwMCAqIDEwMDAsICAvLyAzMOWkqVxufVxuXG4vLyDmlbDmja7liqDlr4bnuqfliKvmmKDlsIRcbmNvbnN0IExFVkVMX01BUCA9IHtcbiAgW0RBVEFfVFlQRS5QT1NUVVJFX0RBSUxZXTogQ1JZUFRPX0xFVkVMLkwxLFxuICBbREFUQV9UWVBFLlBPU1RVUkVfQUxFUlRdOiBDUllQVE9fTEVWRUwuTDIsXG4gIFtEQVRBX1RZUEUuSFJfRkVBVFVSRV06IENSWVBUT19MRVZFTC5MMyxcbiAgW0RBVEFfVFlQRS5TVFJFU1NfRkVBVFVSRV06IENSWVBUT19MRVZFTC5MMyxcbiAgW0RBVEFfVFlQRS5TRVRUSU5HU106IENSWVBUT19MRVZFTC5MMSxcbn1cblxuY2xhc3MgRGF0YU1hbmFnZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmNyeXB0b1N0b3JlID0gbmV3IENyeXB0b1N0b3JlKClcbiAgICAvLyDplK7lkI3ms6jlhozooajvvIjnlKjkuo7pgY3ljobmuIXnkIbvvIlcbiAgICB0aGlzLmtleVJlZ2lzdHJ5ID0gW11cbiAgfVxuXG4gIC8qKlxuICAgKiDnlJ/miJDlrZjlgqjplK7lkI1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9tYWtlS2V5KHR5cGUsIGRhdGUpIHtcbiAgICBjb25zdCBkYXRlU3RyID0gZGF0ZSB8fCB0aGlzLl9nZXREYXRlU3RyKClcbiAgICByZXR1cm4gYHBnXyR7dHlwZX1fJHtkYXRlU3RyfWBcbiAgfVxuXG4gIC8qKlxuICAgKiDojrflj5bml6XmnJ/lrZfnrKbkuLIgWVlZWS1NTS1ERFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2dldERhdGVTdHIodHMpIHtcbiAgICBjb25zdCBkID0gdHMgPyBuZXcgRGF0ZSh0cykgOiBuZXcgRGF0ZSgpXG4gICAgcmV0dXJuIGAke2QuZ2V0RnVsbFllYXIoKX0tJHtTdHJpbmcoZC5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKX0tJHtTdHJpbmcoZC5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJyl9YFxuICB9XG5cbiAgLyoqXG4gICAqIOS/neWtmOS9k+aAgee7n+iuoeaVsOaNrlxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdHMgLSB7IHNlZGVudGFyeUNvdW50LCBoZWFkVGlsdENvdW50LCBsZWdDcm9zc0NvdW50LCB0b3RhbEFsZXJ0cyB9XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5a6M5oiQ5Zue6LCDXG4gICAqL1xuICBzYXZlUG9zdHVyZVN0YXRzKHN0YXRzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGtleSA9IHRoaXMuX21ha2VLZXkoREFUQV9UWVBFLlBPU1RVUkVfREFJTFkpXG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgIC4uLnN0YXRzLFxuICAgICAgZGF0ZTogdGhpcy5fZ2V0RGF0ZVN0cigpLFxuICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuX3JlZ2lzdGVyS2V5KGtleSlcbiAgICB0aGlzLmNyeXB0b1N0b3JlLnNhdmUoXG4gICAgICBMRVZFTF9NQVBbREFUQV9UWVBFLlBPU1RVUkVfREFJTFldLFxuICAgICAga2V5LFxuICAgICAgZGF0YSxcbiAgICAgICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYFtEYXRhTWFuYWdlcl0gc2F2ZSBwb3N0dXJlIHN0YXRzOiAke2tleX1gKVxuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKHRydWUpXG4gICAgICB9LFxuICAgICAgKCkgPT4ge1xuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiDkv53lrZjkvZPmgIHlvILluLjorrDlvZVcbiAgICogQHBhcmFtIHtPYmplY3R9IGFsZXJ0IC0geyB0eXBlLCBjb25maWRlbmNlLCBkZXRhaWwsIHRpbWVzdGFtcCB9XG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5a6M5oiQ5Zue6LCDXG4gICAqL1xuICBzYXZlUG9zdHVyZUFsZXJ0KGFsZXJ0LCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHRvZGF5ID0gdGhpcy5fZ2V0RGF0ZVN0cigpXG4gICAgY29uc3Qga2V5ID0gdGhpcy5fbWFrZUtleShEQVRBX1RZUEUuUE9TVFVSRV9BTEVSVCkgKyAnXycgKyBEYXRlLm5vdygpXG5cbiAgICBjb25zdCBkYXRhID0ge1xuICAgICAgLi4uYWxlcnQsXG4gICAgICBkYXRlOiB0b2RheSxcbiAgICAgIHRpbWVzdGFtcDogYWxlcnQudGltZXN0YW1wIHx8IERhdGUubm93KCksXG4gICAgfVxuXG4gICAgdGhpcy5fcmVnaXN0ZXJLZXkoa2V5KVxuICAgIHRoaXMuY3J5cHRvU3RvcmUuc2F2ZShcbiAgICAgIExFVkVMX01BUFtEQVRBX1RZUEUuUE9TVFVSRV9BTEVSVF0sXG4gICAgICBrZXksXG4gICAgICBkYXRhLFxuICAgICAgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0RhdGFNYW5hZ2VyXSBzYXZlIHBvc3R1cmUgYWxlcnRgKVxuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKHRydWUpXG4gICAgICB9LFxuICAgICAgKCkgPT4ge1xuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiDkv53lrZjlv4PnjofohLHmlY/nibnlvoFcbiAgICogQHBhcmFtIHtPYmplY3R9IGZlYXR1cmUgLSBhbm9ueW1pemVyIOi+k+WHuueahOeJueW+gVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWujOaIkOWbnuiwg1xuICAgKi9cbiAgc2F2ZUhSRmVhdHVyZShmZWF0dXJlLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGtleSA9IHRoaXMuX21ha2VLZXkoREFUQV9UWVBFLkhSX0ZFQVRVUkUpICsgJ18nICsgZmVhdHVyZS5ob3VyQnVja2V0XG5cbiAgICB0aGlzLl9yZWdpc3RlcktleShrZXkpXG4gICAgdGhpcy5jcnlwdG9TdG9yZS5zYXZlKFxuICAgICAgTEVWRUxfTUFQW0RBVEFfVFlQRS5IUl9GRUFUVVJFXSxcbiAgICAgIGtleSxcbiAgICAgIGZlYXR1cmUsXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbRGF0YU1hbmFnZXJdIHNhdmUgSFIgZmVhdHVyZWApXG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2sodHJ1ZSlcbiAgICAgIH0sXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZmFsc2UpXG4gICAgICB9XG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIOS/neWtmOWOi+WKm+iEseaVj+eJueW+gVxuICAgKiBAcGFyYW0ge09iamVjdH0gZmVhdHVyZSAtIGFub255bWl6ZXIg6L6T5Ye655qE54m55b6BXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5a6M5oiQ5Zue6LCDXG4gICAqL1xuICBzYXZlU3RyZXNzRmVhdHVyZShmZWF0dXJlLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGtleSA9IHRoaXMuX21ha2VLZXkoREFUQV9UWVBFLlNUUkVTU19GRUFUVVJFKSArICdfJyArIGZlYXR1cmUuaG91ckJ1Y2tldFxuXG4gICAgdGhpcy5fcmVnaXN0ZXJLZXkoa2V5KVxuICAgIHRoaXMuY3J5cHRvU3RvcmUuc2F2ZShcbiAgICAgIExFVkVMX01BUFtEQVRBX1RZUEUuU1RSRVNTX0ZFQVRVUkVdLFxuICAgICAga2V5LFxuICAgICAgZmVhdHVyZSxcbiAgICAgICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYFtEYXRhTWFuYWdlcl0gc2F2ZSBzdHJlc3MgZmVhdHVyZWApXG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2sodHJ1ZSlcbiAgICAgIH0sXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZmFsc2UpXG4gICAgICB9XG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIOWKoOi9veS7iuaXpeS9k+aAgee7n+iuoVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIChkYXRhKSA9PiB7fVxuICAgKi9cbiAgbG9hZFRvZGF5UG9zdHVyZVN0YXRzKGNhbGxiYWNrKSB7XG4gICAgY29uc3Qga2V5ID0gdGhpcy5fbWFrZUtleShEQVRBX1RZUEUuUE9TVFVSRV9EQUlMWSlcbiAgICB0aGlzLmNyeXB0b1N0b3JlLmxvYWQoTEVWRUxfTUFQW0RBVEFfVFlQRS5QT1NUVVJFX0RBSUxZXSwga2V5LCBjYWxsYmFjaywgKCkgPT4ge1xuICAgICAgY2FsbGJhY2sobnVsbClcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIOWKoOi9veS7iuaXpeS9k+aAgeW8guW4uOiusOW9lVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIChhbGVydHNbXSkgPT4ge31cbiAgICovXG4gIGxvYWRUb2RheUFsZXJ0cyhjYWxsYmFjaykge1xuICAgIC8vIOS7juazqOWGjOihqOS4reetm+mAieS7iuaXpeeahOW8guW4uOiusOW9lemUrlxuICAgIGNvbnN0IHRvZGF5UHJlZml4ID0gdGhpcy5fbWFrZUtleShEQVRBX1RZUEUuUE9TVFVSRV9BTEVSVClcbiAgICBjb25zdCB0b2RheUtleXMgPSB0aGlzLmtleVJlZ2lzdHJ5LmZpbHRlcigoaykgPT4gay5zdGFydHNXaXRoKHRvZGF5UHJlZml4KSlcblxuICAgIGlmICh0b2RheUtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjYWxsYmFjayhbXSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGFsZXJ0cyA9IFtdXG4gICAgbGV0IHJlbWFpbmluZyA9IHRvZGF5S2V5cy5sZW5ndGhcblxuICAgIHRvZGF5S2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIHRoaXMuY3J5cHRvU3RvcmUubG9hZChMRVZFTF9NQVBbREFUQV9UWVBFLlBPU1RVUkVfQUxFUlRdLCBrZXksIChkYXRhKSA9PiB7XG4gICAgICAgIGlmIChkYXRhKSBhbGVydHMucHVzaChkYXRhKVxuICAgICAgICByZW1haW5pbmctLVxuICAgICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgICAgLy8g5oyJ5pe26Ze05o6S5bqPXG4gICAgICAgICAgYWxlcnRzLnNvcnQoKGEsIGIpID0+IGEudGltZXN0YW1wIC0gYi50aW1lc3RhbXApXG4gICAgICAgICAgY2FsbGJhY2soYWxlcnRzKVxuICAgICAgICB9XG4gICAgICB9LCAoKSA9PiB7XG4gICAgICAgIHJlbWFpbmluZy0tXG4gICAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIGNhbGxiYWNrKGFsZXJ0cylcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiDliqDovb3mjIflrprml6XmnJ/ojIPlm7TnmoTlv4PnjofnibnlvoFcbiAgICogQHBhcmFtIHtudW1iZXJ9IGRheXMgLSDlm57muq/lpKnmlbBcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSAoZmVhdHVyZXNbXSkgPT4ge31cbiAgICovXG4gIGxvYWRIUkZlYXR1cmVzKGRheXMsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgZmVhdHVyZXMgPSBbXVxuICAgIGxldCByZW1haW5pbmcgPSAwXG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRheXM7IGkrKykge1xuICAgICAgY29uc3QgZGF0ZSA9IG5ldyBEYXRlKClcbiAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSAtIGkpXG4gICAgICBjb25zdCBkYXRlU3RyID0gdGhpcy5fZ2V0RGF0ZVN0cihkYXRlLmdldFRpbWUoKSlcbiAgICAgIGNvbnN0IHByZWZpeCA9IGBwZ18ke0RBVEFfVFlQRS5IUl9GRUFUVVJFfV8ke2RhdGVTdHJ9YFxuICAgICAgY29uc3Qga2V5cyA9IHRoaXMua2V5UmVnaXN0cnkuZmlsdGVyKChrKSA9PiBrLnN0YXJ0c1dpdGgocHJlZml4KSlcbiAgICAgIHJlbWFpbmluZyArPSBrZXlzLmxlbmd0aFxuXG4gICAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICB0aGlzLmNyeXB0b1N0b3JlLmxvYWQoTEVWRUxfTUFQW0RBVEFfVFlQRS5IUl9GRUFUVVJFXSwga2V5LCAoZGF0YSkgPT4ge1xuICAgICAgICAgIGlmIChkYXRhKSBmZWF0dXJlcy5wdXNoKGRhdGEpXG4gICAgICAgICAgcmVtYWluaW5nLS1cbiAgICAgICAgICBpZiAocmVtYWluaW5nID09PSAwKSBjYWxsYmFjayhmZWF0dXJlcylcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgIHJlbWFpbmluZy0tXG4gICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkgY2FsbGJhY2soZmVhdHVyZXMpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cblxuICAgIGlmIChyZW1haW5pbmcgPT09IDApIGNhbGxiYWNrKGZlYXR1cmVzKVxuICB9XG5cbiAgLyoqXG4gICAqIOS/neWtmOW6lOeUqOiuvue9rlxuICAgKiBAcGFyYW0ge09iamVjdH0gc2V0dGluZ3NcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIHNhdmVTZXR0aW5ncyhzZXR0aW5ncywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBrZXkgPSAncGdfc2V0dGluZ3MnXG4gICAgdGhpcy5fcmVnaXN0ZXJLZXkoa2V5KVxuICAgIHRoaXMuY3J5cHRvU3RvcmUuc2F2ZShDUllQVE9fTEVWRUwuTDEsIGtleSwgc2V0dGluZ3MsICgpID0+IHtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2sodHJ1ZSlcbiAgICB9LCAoKSA9PiB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICog5Yqg6L295bqU55So6K6+572uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gKHNldHRpbmdzKSA9PiB7fVxuICAgKi9cbiAgbG9hZFNldHRpbmdzKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5jcnlwdG9TdG9yZS5sb2FkKENSWVBUT19MRVZFTC5MMSwgJ3BnX3NldHRpbmdzJywgY2FsbGJhY2ssICgpID0+IHtcbiAgICAgIGNhbGxiYWNrKHtcbiAgICAgICAgc2VkZW50YXJ5VGhyZXNob2xkOiAzMCAqIDYwICogMTAwMCwgLy8g6buY6K6kMzDliIbpkp9cbiAgICAgICAgdmlicmF0aW9uRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgYWxlcnRFbmFibGVkOiB0cnVlLFxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIOa4heeQhui/h+acn+aVsOaNrlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIChjbGVhbmVkQ291bnQpID0+IHt9XG4gICAqL1xuICBjbGVhbkV4cGlyZWQoY2FsbGJhY2spIHtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG4gICAgY29uc3QgZXhwaXJlZEtleXMgPSBbXVxuXG4gICAgdGhpcy5rZXlSZWdpc3RyeS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIC8vIOS7jumUruWQjeS4reaPkOWPluexu+Wei1xuICAgICAgZm9yIChjb25zdCBbdHlwZSwgZXhwaXJ5TXNdIG9mIE9iamVjdC5lbnRyaWVzKEVYUElSWSkpIHtcbiAgICAgICAgaWYgKGtleS5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICAgIC8vIOWwneivleS7jumUruWQjeS4reaPkOWPluaXtumXtOaIs+aIluaXpeacn1xuICAgICAgICAgIGNvbnN0IGRhdGVNYXRjaCA9IGtleS5tYXRjaCgvKFxcZHs0fS1cXGR7Mn0tXFxkezJ9KS8pXG4gICAgICAgICAgaWYgKGRhdGVNYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgZGF0YURhdGUgPSBuZXcgRGF0ZShkYXRlTWF0Y2hbMV0pLmdldFRpbWUoKVxuICAgICAgICAgICAgaWYgKG5vdyAtIGRhdGFEYXRlID4gZXhwaXJ5TXMpIHtcbiAgICAgICAgICAgICAgZXhwaXJlZEtleXMucHVzaChrZXkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYgKGV4cGlyZWRLZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygwKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8g5LuO5rOo5YaM6KGo5Lit56e76Zmk6L+H5pyf6ZSuXG4gICAgdGhpcy5rZXlSZWdpc3RyeSA9IHRoaXMua2V5UmVnaXN0cnkuZmlsdGVyKChrKSA9PiAhZXhwaXJlZEtleXMuaW5jbHVkZXMoaykpXG5cbiAgICAvLyDliKDpmaTov4fmnJ/mlbDmja5cbiAgICB0aGlzLmNyeXB0b1N0b3JlLmJhdGNoUmVtb3ZlKGV4cGlyZWRLZXlzLCAoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgW0RhdGFNYW5hZ2VyXSBjbGVhbmVkICR7ZXhwaXJlZEtleXMubGVuZ3RofSBleHBpcmVkIGtleXNgKVxuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhleHBpcmVkS2V5cy5sZW5ndGgpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiDkuIDplK7muIXpmaTmiYDmnInpmpDnp4HmlbDmja7vvIjkv53nlZnorr7nva7vvIlcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlrozmiJDlm57osINcbiAgICovXG4gIGNsZWFyQWxsUHJpdmFjeURhdGEoY2FsbGJhY2spIHtcbiAgICBjb25zdCBwcml2YWN5S2V5cyA9IHRoaXMua2V5UmVnaXN0cnkuZmlsdGVyKFxuICAgICAgKGspID0+ICFrLmluY2x1ZGVzKERBVEFfVFlQRS5TRVRUSU5HUylcbiAgICApXG4gICAgdGhpcy5rZXlSZWdpc3RyeSA9IHRoaXMua2V5UmVnaXN0cnkuZmlsdGVyKChrKSA9PiBrLmluY2x1ZGVzKERBVEFfVFlQRS5TRVRUSU5HUykpXG5cbiAgICB0aGlzLmNyeXB0b1N0b3JlLmJhdGNoUmVtb3ZlKHByaXZhY3lLZXlzLCAoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgW0RhdGFNYW5hZ2VyXSBjbGVhcmVkICR7cHJpdmFjeUtleXMubGVuZ3RofSBwcml2YWN5IGtleXNgKVxuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiDojrflj5bmlbDmja7nu5/orqHmkZjopoFcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSAoc3VtbWFyeSkgPT4ge31cbiAgICovXG4gIGdldFN1bW1hcnkoY2FsbGJhY2spIHtcbiAgICBjb25zdCBzdW1tYXJ5ID0ge1xuICAgICAgdG90YWxLZXlzOiB0aGlzLmtleVJlZ2lzdHJ5Lmxlbmd0aCxcbiAgICAgIHBvc3R1cmVEYWlseTogMCxcbiAgICAgIHBvc3R1cmVBbGVydHM6IDAsXG4gICAgICBockZlYXR1cmVzOiAwLFxuICAgICAgc3RyZXNzRmVhdHVyZXM6IDAsXG4gICAgfVxuXG4gICAgdGhpcy5rZXlSZWdpc3RyeS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGlmIChrZXkuaW5jbHVkZXMoREFUQV9UWVBFLlBPU1RVUkVfREFJTFkpKSBzdW1tYXJ5LnBvc3R1cmVEYWlseSsrXG4gICAgICBlbHNlIGlmIChrZXkuaW5jbHVkZXMoREFUQV9UWVBFLlBPU1RVUkVfQUxFUlQpKSBzdW1tYXJ5LnBvc3R1cmVBbGVydHMrK1xuICAgICAgZWxzZSBpZiAoa2V5LmluY2x1ZGVzKERBVEFfVFlQRS5IUl9GRUFUVVJFKSkgc3VtbWFyeS5ockZlYXR1cmVzKytcbiAgICAgIGVsc2UgaWYgKGtleS5pbmNsdWRlcyhEQVRBX1RZUEUuU1RSRVNTX0ZFQVRVUkUpKSBzdW1tYXJ5LnN0cmVzc0ZlYXR1cmVzKytcbiAgICB9KVxuXG4gICAgc3VtbWFyeS5jcnlwdG9TdGF0cyA9IHRoaXMuY3J5cHRvU3RvcmUuZ2V0U3RhdHMoKVxuICAgIGNhbGxiYWNrKHN1bW1hcnkpXG4gIH1cblxuICAvKipcbiAgICog5rOo5YaM6ZSu5ZCN5Yiw5rOo5YaM6KGoXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVnaXN0ZXJLZXkoa2V5KSB7XG4gICAgaWYgKCF0aGlzLmtleVJlZ2lzdHJ5LmluY2x1ZGVzKGtleSkpIHtcbiAgICAgIHRoaXMua2V5UmVnaXN0cnkucHVzaChrZXkpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB7IERBVEFfVFlQRSwgRVhQSVJZIH1cbmV4cG9ydCBkZWZhdWx0IERhdGFNYW5hZ2VyXG4iLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoKCkgPT4ge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLnJ2ID0gKCkgPT4gKFwiMS43LjEyXCIpIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5ydWlkID0gXCJidW5kbGVyPXJzcGFja0AxLjcuMTJcIjsiLCI8dGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJwYWdlXCIgQHN3aXBlPVwiYmFja1wiPlxuICAgIDwhLS0g6aG26YOo5a+86IiqIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgIDx0ZXh0IGNsYXNzPVwiYmFjay1idG5cIiBvbmNsaWNrPVwiYmFja1wiPuKAuTwvdGV4dD5cbiAgICAgIDx0ZXh0IGNsYXNzPVwidGl0bGVcIj7pmpDnp4HpmLLmiqQ8L3RleHQ+XG4gICAgICA8dGV4dCBjbGFzcz1cInNoaWVsZC1pY29uXCI+8J+boe+4jzwvdGV4dD5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5pW05L2T6Ziy5oqk54q25oCBIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJwcm90ZWN0LXN0YXR1c1wiPlxuICAgICAgPHRleHQgY2xhc3M9XCJwcm90ZWN0LWljb25cIj7inIU8L3RleHQ+XG4gICAgICA8dGV4dCBjbGFzcz1cInByb3RlY3QtdGl0bGVcIj7pmpDnp4HmlbDmja7lt7LliqDlr4bkv53miqQ8L3RleHQ+XG4gICAgICA8dGV4dCBjbGFzcz1cInByb3RlY3QtZGVzY1wiPuaJgOacieaVj+aEn+aVsOaNruWdh+WcqOacrOWcsOWKoOWvhuWtmOWCqDwvdGV4dD5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5Yqg5a+G57qn5Yir5bGV56S6IC0tPlxuICAgIDxkaXYgY2xhc3M9XCJsZXZlbC1zZWN0aW9uXCI+XG4gICAgICA8dGV4dCBjbGFzcz1cInNlY3Rpb24tdGl0bGVcIj7mlbDmja7liqDlr4bliIbnuqc8L3RleHQ+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJsZXZlbC1jYXJkXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJsZXZlbC1oZWFkZXJcIj5cbiAgICAgICAgICA8dGV4dCBjbGFzcz1cImxldmVsLWJhZGdlIGwxXCI+TDE8L3RleHQ+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImxldmVsLWluZm9cIj5cbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibGV2ZWwtbmFtZVwiPuaZrumAmue7n+iuoTwvdGV4dD5cbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibGV2ZWwtZGVzY1wiPuS9k+aAgeiuoeaVsOOAgeavj+aXpeaxh+aAuzwvdGV4dD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8dGV4dCBjbGFzcz1cImxldmVsLW1ldGhvZFwiPuaYjuaWhzwvdGV4dD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzcz1cImxldmVsLWNhcmRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxldmVsLWhlYWRlclwiPlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibGV2ZWwtYmFkZ2UgbDJcIj5MMjwvdGV4dD5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibGV2ZWwtaW5mb1wiPlxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJsZXZlbC1uYW1lXCI+5pWP5oSf6K6w5b2VPC90ZXh0PlxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJsZXZlbC1kZXNjXCI+5L2T5oCB5byC5bi46K+m5oOFPC90ZXh0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibGV2ZWwtbWV0aG9kXCI+QUVTLUVDQjwvdGV4dD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzcz1cImxldmVsLWNhcmRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxldmVsLWhlYWRlclwiPlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibGV2ZWwtYmFkZ2UgbDNcIj5MMzwvdGV4dD5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibGV2ZWwtaW5mb1wiPlxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJsZXZlbC1uYW1lXCI+6ZqQ56eB5pWw5o2uPC90ZXh0PlxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJsZXZlbC1kZXNjXCI+5b+D546H44CB5Y6L5Yqb5Y6f5aeL5YC8PC90ZXh0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibGV2ZWwtbWV0aG9kXCI+QUVTLUNCQzwvdGV4dD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5pWw5o2u5aSE55CG5a+55q+UIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJjb21wYXJlLXNlY3Rpb25cIj5cbiAgICAgIDx0ZXh0IGNsYXNzPVwic2VjdGlvbi10aXRsZVwiPuiEseaVj+WkhOeQhuaViOaenDwvdGV4dD5cblxuICAgICAgPGRpdiBjbGFzcz1cImNvbXBhcmUtcm93XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjb21wYXJlLWl0ZW1cIj5cbiAgICAgICAgICA8dGV4dCBjbGFzcz1cImNvbXBhcmUtbGFiZWxcIj7lpITnkIbliY08L3RleHQ+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNvbXBhcmUtZGF0YSByYXctZGF0YVwiPlxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJkYXRhLWxpbmVcIj7lv4Pnjoc6IDcyIGJwbTwvdGV4dD5cbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiZGF0YS1saW5lXCI+5pe26Ze0OiAxNDozMjoxNTwvdGV4dD5cbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiZGF0YS1saW5lXCI+5Z2Q5qCHOiAzOS45wrBOPC90ZXh0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8dGV4dCBjbGFzcz1cImNvbXBhcmUtYXJyb3dcIj7ihpI8L3RleHQ+XG5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNvbXBhcmUtaXRlbVwiPlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiY29tcGFyZS1sYWJlbFwiPuWkhOeQhuWQjjwvdGV4dD5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29tcGFyZS1kYXRhIGFub24tZGF0YVwiPlxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJkYXRhLWxpbmVcIj7ljLrpl7Q6IOato+W4uDwvdGV4dD5cbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiZGF0YS1saW5lXCI+5pe25q61OiAxNDowMDwvdGV4dD5cbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiZGF0YS1saW5lXCI+54m55b6BOiDku4Xkv53nlZk8L3RleHQ+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8IS0tIOaVsOaNrueUn+WRveWRqOacnyAtLT5cbiAgICA8ZGl2IGNsYXNzPVwibGlmZWN5Y2xlLXNlY3Rpb25cIj5cbiAgICAgIDx0ZXh0IGNsYXNzPVwic2VjdGlvbi10aXRsZVwiPuaVsOaNrueUn+WRveWRqOacnzwvdGV4dD5cblxuICAgICAgPGRpdiBjbGFzcz1cImxpZmVjeWNsZS1pdGVtXCI+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwibGMtdHlwZVwiPuaZrumAmue7n+iuoTwvdGV4dD5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxjLWJhclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJsYy1maWxsXCIgc3R5bGU9XCJ3aWR0aDoge3sgbGNTdGF0UGVyY2VudCB9fSU7XCI+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8dGV4dCBjbGFzcz1cImxjLWRheXNcIj57eyBsY1N0YXREYXlzIH195aSp5ZCO6L+H5pyfPC90ZXh0PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJsaWZlY3ljbGUtaXRlbVwiPlxuICAgICAgICA8dGV4dCBjbGFzcz1cImxjLXR5cGVcIj7lvILluLjorrDlvZU8L3RleHQ+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJsYy1iYXJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwibGMtZmlsbCBsMi1maWxsXCIgc3R5bGU9XCJ3aWR0aDoge3sgbGNBbGVydFBlcmNlbnQgfX0lO1wiPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJsYy1kYXlzXCI+e3sgbGNBbGVydERheXMgfX3lpKnlkI7ov4fmnJ88L3RleHQ+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzcz1cImxpZmVjeWNsZS1pdGVtXCI+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwibGMtdHlwZVwiPumakOengeaVsOaNrjwvdGV4dD5cbiAgICAgICAgPGRpdiBjbGFzcz1cImxjLWJhclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJsYy1maWxsIGwzLWZpbGxcIiBzdHlsZT1cIndpZHRoOiB7eyBsY1ByaXZhY3lQZXJjZW50IH19JTtcIj48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwibGMtZGF5c1wiPnt7IGxjUHJpdmFjeUhvdXJzIH195bCP5pe25ZCO6L+H5pyfPC90ZXh0PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8IS0tIOaTjeS9nOaMiemSriAtLT5cbiAgICA8ZGl2IGNsYXNzPVwiYWN0aW9uLXNlY3Rpb25cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJidG4gYnRuLWNsZWFyXCIgb25jbGljaz1cImNsZWFyUHJpdmFjeURhdGFcIj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJidG4tdGV4dFwiPvCfl5HvuI8g5LiA6ZSu5riF6Zmk6ZqQ56eB5pWw5o2uPC90ZXh0PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC90ZW1wbGF0ZT5cblxuPHNjcmlwdD5cbmltcG9ydCBwcm9tcHQgZnJvbSAnQHN5c3RlbS5wcm9tcHQnXG5pbXBvcnQgRGF0YU1hbmFnZXIgZnJvbSAnLi4vLi4vbGliL2RhdGEtbWFuYWdlcidcblxuZXhwb3J0IGRlZmF1bHQge1xuICBwcml2YXRlOiB7XG4gICAgbGNTdGF0UGVyY2VudDogODUsXG4gICAgbGNTdGF0RGF5czogNixcbiAgICBsY0FsZXJ0UGVyY2VudDogNjAsXG4gICAgbGNBbGVydERheXM6IDE4LFxuICAgIGxjUHJpdmFjeVBlcmNlbnQ6IDMwLFxuICAgIGxjUHJpdmFjeUhvdXJzOiAxNixcbiAgICBkYXRhTWFuYWdlcjogbnVsbCxcbiAgfSxcblxuICBvblJlYWR5KCkge1xuICAgIHRoaXMuZGF0YU1hbmFnZXIgPSBuZXcgRGF0YU1hbmFnZXIoKVxuICAgIHRoaXMuX3VwZGF0ZUxpZmVjeWNsZSgpXG4gIH0sXG5cbiAgX3VwZGF0ZUxpZmVjeWNsZSgpIHtcbiAgICAvLyDmqKHmi5/nlJ/lkb3lkajmnJ/mlbDmja7vvIjlrp7pmYXlupTku47lrZjlgqjkuK3orqHnrpfvvIlcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgY29uc3QgaG91ciA9IG5vdy5nZXRIb3VycygpXG5cbiAgICAvLyDmma7pgJrnu5/orqHvvJo35aSp6L+H5pyfXG4gICAgdGhpcy5sY1N0YXREYXlzID0gNlxuICAgIHRoaXMubGNTdGF0UGVyY2VudCA9IE1hdGgucm91bmQoKDYgLyA3KSAqIDEwMClcblxuICAgIC8vIOW8guW4uOiusOW9le+8mjMw5aSp6L+H5pyfXG4gICAgdGhpcy5sY0FsZXJ0RGF5cyA9IDE4XG4gICAgdGhpcy5sY0FsZXJ0UGVyY2VudCA9IE1hdGgucm91bmQoKDE4IC8gMzApICogMTAwKVxuXG4gICAgLy8g6ZqQ56eB5pWw5o2u77yaMjTlsI/ml7bov4fmnJ9cbiAgICB0aGlzLmxjUHJpdmFjeUhvdXJzID0gMjQgLSBob3VyXG4gICAgdGhpcy5sY1ByaXZhY3lQZXJjZW50ID0gTWF0aC5yb3VuZCgoKDI0IC0gaG91cikgLyAyNCkgKiAxMDApXG4gIH0sXG5cbiAgYmFjayhldmVudCkge1xuICAgIGlmICghZXZlbnQgfHwgZXZlbnQuZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XG4gICAgICBpbXBvcnQoJ0BzeXN0ZW0ucm91dGVyJykudGhlbigocm91dGVyKSA9PiB7XG4gICAgICAgIHJvdXRlci5iYWNrKClcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuXG4gIGNsZWFyUHJpdmFjeURhdGEoKSB7XG4gICAgcHJvbXB0LnNob3dUb2FzdCh7IG1lc3NhZ2U6ICfmraPlnKjmuIXpmaTpmpDnp4HmlbDmja4uLi4nIH0pXG5cbiAgICB0aGlzLmRhdGFNYW5hZ2VyLmNsZWFyQWxsUHJpdmFjeURhdGEoKCkgPT4ge1xuICAgICAgcHJvbXB0LnNob3dUb2FzdCh7IG1lc3NhZ2U6ICfinIUg6ZqQ56eB5pWw5o2u5bey5riF6ZmkJyB9KVxuICAgICAgdGhpcy5fdXBkYXRlTGlmZWN5Y2xlKClcbiAgICB9KVxuICB9LFxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbi5wYWdlIHtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgd2lkdGg6IDQ4MHB4O1xuICBoZWlnaHQ6IDQ4MHB4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMGEwYTBhO1xufVxuXG4uaGVhZGVyIHtcbiAgd2lkdGg6IDEwMCU7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgcGFkZGluZzogMTVweCAyMHB4O1xuICBtYXJnaW4tdG9wOiAxNXB4O1xufVxuXG4uYmFjay1idG4ge1xuICBmb250LXNpemU6IDMycHg7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICB3aWR0aDogNDBweDtcbn1cblxuLnRpdGxlIHtcbiAgZm9udC1zaXplOiAyNHB4O1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG5cbi5zaGllbGQtaWNvbiB7XG4gIGZvbnQtc2l6ZTogMjRweDtcbn1cblxuLyog6Ziy5oqk54q25oCBICovXG4ucHJvdGVjdC1zdGF0dXMge1xuICB3aWR0aDogNDIwcHg7XG4gIHBhZGRpbmc6IDIwcHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxYTJlMWE7XG4gIGJvcmRlcjogMXB4IHNvbGlkICMwMGQ0YWE7XG4gIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIG1hcmdpbi10b3A6IDEwcHg7XG59XG5cbi5wcm90ZWN0LWljb24ge1xuICBmb250LXNpemU6IDM2cHg7XG59XG5cbi5wcm90ZWN0LXRpdGxlIHtcbiAgZm9udC1zaXplOiAyMHB4O1xuICBjb2xvcjogIzAwZDRhYTtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIG1hcmdpbi10b3A6IDhweDtcbn1cblxuLnByb3RlY3QtZGVzYyB7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgY29sb3I6ICM4ODg4ODg7XG4gIG1hcmdpbi10b3A6IDRweDtcbn1cblxuLyog5Yqg5a+G57qn5YirICovXG4ubGV2ZWwtc2VjdGlvbiB7XG4gIHdpZHRoOiA0MjBweDtcbiAgbWFyZ2luLXRvcDogMTVweDtcbn1cblxuLnNlY3Rpb24tdGl0bGUge1xuICBmb250LXNpemU6IDE4cHg7XG4gIGNvbG9yOiAjODg4ODg4O1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xufVxuXG4ubGV2ZWwtY2FyZCB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxYTFhMmU7XG4gIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gIHBhZGRpbmc6IDEycHggMTVweDtcbiAgbWFyZ2luLWJvdHRvbTogOHB4O1xufVxuXG4ubGV2ZWwtaGVhZGVyIHtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cblxuLmxldmVsLWJhZGdlIHtcbiAgd2lkdGg6IDQwcHg7XG4gIGhlaWdodDogMjRweDtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbn1cblxuLmxldmVsLWJhZGdlLmwxIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzRlY2RjNDtcbn1cblxuLmxldmVsLWJhZGdlLmwyIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZDkzZDtcbn1cblxuLmxldmVsLWJhZGdlLmwzIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmNmI2Yjtcbn1cblxuLmxldmVsLWluZm8ge1xuICBmbGV4OiAxO1xuICBtYXJnaW4tbGVmdDogMTJweDtcbn1cblxuLmxldmVsLW5hbWUge1xuICBmb250LXNpemU6IDE2cHg7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBmb250LXdlaWdodDogYm9sZDtcbn1cblxuLmxldmVsLWRlc2Mge1xuICBmb250LXNpemU6IDEycHg7XG4gIGNvbG9yOiAjODg4ODg4O1xuICBtYXJnaW4tdG9wOiAycHg7XG59XG5cbi5sZXZlbC1tZXRob2Qge1xuICBmb250LXNpemU6IDE0cHg7XG4gIGNvbG9yOiAjMDBkNGFhO1xuICBmb250LXdlaWdodDogYm9sZDtcbn1cblxuLyog5pWw5o2u5a+55q+UICovXG4uY29tcGFyZS1zZWN0aW9uIHtcbiAgd2lkdGg6IDQyMHB4O1xuICBtYXJnaW4tdG9wOiAxNXB4O1xufVxuXG4uY29tcGFyZS1yb3cge1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG5cbi5jb21wYXJlLWl0ZW0ge1xuICB3aWR0aDogMTgwcHg7XG59XG5cbi5jb21wYXJlLWxhYmVsIHtcbiAgZm9udC1zaXplOiAxNHB4O1xuICBjb2xvcjogIzg4ODg4ODtcbiAgbWFyZ2luLWJvdHRvbTogNnB4O1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG59XG5cbi5jb21wYXJlLWRhdGEge1xuICBwYWRkaW5nOiAxMHB4O1xuICBib3JkZXItcmFkaXVzOiA4cHg7XG4gIGhlaWdodDogODBweDtcbn1cblxuLnJhdy1kYXRhIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzJlMWExYTtcbiAgYm9yZGVyOiAxcHggc29saWQgI2ZmNmI2Yjtcbn1cblxuLmFub24tZGF0YSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxYTJlMWE7XG4gIGJvcmRlcjogMXB4IHNvbGlkICMwMGQ0YWE7XG59XG5cbi5kYXRhLWxpbmUge1xuICBmb250LXNpemU6IDEycHg7XG4gIGNvbG9yOiAjY2NjY2NjO1xuICBtYXJnaW4tYm90dG9tOiA0cHg7XG59XG5cbi5jb21wYXJlLWFycm93IHtcbiAgZm9udC1zaXplOiAyNHB4O1xuICBjb2xvcjogIzAwZDRhYTtcbiAgbWFyZ2luOiAwIDEwcHg7XG59XG5cbi8qIOeUn+WRveWRqOacnyAqL1xuLmxpZmVjeWNsZS1zZWN0aW9uIHtcbiAgd2lkdGg6IDQyMHB4O1xuICBtYXJnaW4tdG9wOiAxNXB4O1xufVxuXG4ubGlmZWN5Y2xlLWl0ZW0ge1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xufVxuXG4ubGMtdHlwZSB7XG4gIHdpZHRoOiA4MHB4O1xuICBmb250LXNpemU6IDE0cHg7XG4gIGNvbG9yOiAjODg4ODg4O1xufVxuXG4ubGMtYmFyIHtcbiAgZmxleDogMTtcbiAgaGVpZ2h0OiA4cHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzMzMzM7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgbWFyZ2luOiAwIDEwcHg7XG59XG5cbi5sYy1maWxsIHtcbiAgaGVpZ2h0OiA4cHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICM0ZWNkYzQ7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbn1cblxuLmwyLWZpbGwge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZkOTNkO1xufVxuXG4ubDMtZmlsbCB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZjZiNmI7XG59XG5cbi5sYy1kYXlzIHtcbiAgd2lkdGg6IDgwcHg7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgY29sb3I6ICM4ODg4ODg7XG4gIHRleHQtYWxpZ246IHJpZ2h0O1xufVxuXG4vKiDmk43kvZzmjInpkq4gKi9cbi5hY3Rpb24tc2VjdGlvbiB7XG4gIG1hcmdpbi10b3A6IDE1cHg7XG59XG5cbi5idG4ge1xuICB3aWR0aDogMzAwcHg7XG4gIGhlaWdodDogNTBweDtcbiAgYm9yZGVyLXJhZGl1czogMjVweDtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG5cbi5idG4tY2xlYXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzMzMzMzO1xuICBib3JkZXI6IDFweCBzb2xpZCAjZmY2YjZiO1xufVxuXG4uYnRuLXRleHQge1xuICBmb250LXNpemU6IDE2cHg7XG4gIGNvbG9yOiAjZmZmZmZmO1xufVxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6WyJfc3lzdGVtIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsIiRhcHBfcmVxdWlyZSQiLCJfc3lzdGVtMiIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsIm93bktleXMiLCJyIiwidCIsIk9iamVjdCIsImtleXMiLCJnZXRPd25Qcm9wZXJ0eVN5bWJvbHMiLCJvIiwiZmlsdGVyIiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsInB1c2giLCJhcHBseSIsIl9vYmplY3RTcHJlYWQiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJmb3JFYWNoIiwiX2RlZmluZVByb3BlcnR5IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyIsImRlZmluZVByb3BlcnRpZXMiLCJkZWZpbmVQcm9wZXJ0eSIsIl90b1Byb3BlcnR5S2V5IiwidmFsdWUiLCJjb25maWd1cmFibGUiLCJ3cml0YWJsZSIsImkiLCJfdG9QcmltaXRpdmUiLCJTeW1ib2wiLCJ0b1ByaW1pdGl2ZSIsImNhbGwiLCJUeXBlRXJyb3IiLCJTdHJpbmciLCJOdW1iZXIiLCJDUllQVE9fTEVWRUwiLCJleHBvcnRzIiwiTDEiLCJMMiIsIkwzIiwiS0VZUyIsIkNyeXB0b1N0b3JlIiwiY29uc3RydWN0b3IiLCJzdGF0cyIsImVuY3J5cHRDb3VudCIsImRlY3J5cHRDb3VudCIsImVycm9yQ291bnQiLCJzYXZlIiwibGV2ZWwiLCJrZXkiLCJzdWNjZXNzIiwiZmFpbCIsInBsYWluIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0b3JhZ2UiLCJzZXQiLCJjb25zb2xlIiwibG9nIiwiZGF0YSIsImNvZGUiLCJlcnJvciIsImVuY0tleSIsImNyeXB0byIsImJ0b2EiLCJlbmNyeXB0IiwiYWxnbyIsInJlcyIsImxvYWQiLCJjYWxsYmFjayIsImdldCIsImVuY3J5cHRlZCIsInBhcnNlIiwiZGVjcnlwdCIsInJlbW92ZSIsImRlbGV0ZSIsImJhdGNoUmVtb3ZlIiwicmVtYWluaW5nIiwiY2xlYXJBbGwiLCJjbGVhciIsImdldFN0YXRzIiwiX2RlZmF1bHQiLCJfY3J5cHRvU3RvcmUiLCJfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCIsInJlcXVpcmUiLCJXZWFrTWFwIiwibiIsImYiLCJfX3Byb3RvX18iLCJoYXMiLCJoYXNPd25Qcm9wZXJ0eSIsIkRBVEFfVFlQRSIsIlBPU1RVUkVfREFJTFkiLCJQT1NUVVJFX0FMRVJUIiwiSFJfRkVBVFVSRSIsIlNUUkVTU19GRUFUVVJFIiwiU0VUVElOR1MiLCJFWFBJUlkiLCJMRVZFTF9NQVAiLCJEYXRhTWFuYWdlciIsImNyeXB0b1N0b3JlIiwia2V5UmVnaXN0cnkiLCJfbWFrZUtleSIsInR5cGUiLCJkYXRlIiwiZGF0ZVN0ciIsIl9nZXREYXRlU3RyIiwidHMiLCJkIiwiRGF0ZSIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJwYWRTdGFydCIsImdldERhdGUiLCJzYXZlUG9zdHVyZVN0YXRzIiwidGltZXN0YW1wIiwibm93IiwiX3JlZ2lzdGVyS2V5Iiwic2F2ZVBvc3R1cmVBbGVydCIsImFsZXJ0IiwidG9kYXkiLCJzYXZlSFJGZWF0dXJlIiwiZmVhdHVyZSIsImhvdXJCdWNrZXQiLCJzYXZlU3RyZXNzRmVhdHVyZSIsImxvYWRUb2RheVBvc3R1cmVTdGF0cyIsImxvYWRUb2RheUFsZXJ0cyIsInRvZGF5UHJlZml4IiwidG9kYXlLZXlzIiwiayIsInN0YXJ0c1dpdGgiLCJhbGVydHMiLCJzb3J0IiwiYSIsImIiLCJsb2FkSFJGZWF0dXJlcyIsImRheXMiLCJmZWF0dXJlcyIsInNldERhdGUiLCJnZXRUaW1lIiwicHJlZml4Iiwic2F2ZVNldHRpbmdzIiwic2V0dGluZ3MiLCJsb2FkU2V0dGluZ3MiLCJzZWRlbnRhcnlUaHJlc2hvbGQiLCJ2aWJyYXRpb25FbmFibGVkIiwiYWxlcnRFbmFibGVkIiwiY2xlYW5FeHBpcmVkIiwiZXhwaXJlZEtleXMiLCJleHBpcnlNcyIsImVudHJpZXMiLCJpbmNsdWRlcyIsImRhdGVNYXRjaCIsIm1hdGNoIiwiZGF0YURhdGUiLCJjbGVhckFsbFByaXZhY3lEYXRhIiwicHJpdmFjeUtleXMiLCJnZXRTdW1tYXJ5Iiwic3VtbWFyeSIsInRvdGFsS2V5cyIsInBvc3R1cmVEYWlseSIsInBvc3R1cmVBbGVydHMiLCJockZlYXR1cmVzIiwic3RyZXNzRmVhdHVyZXMiLCJjcnlwdG9TdGF0cyIsIl9fd2VicGFja19yZXF1aXJlX18iLCJnbG9iYWxUaGlzIiwiRnVuY3Rpb24iLCJ3aW5kb3ciLCJfZGF0YU1hbmFnZXIiLCJwcml2YXRlIiwibGNTdGF0UGVyY2VudCIsImxjU3RhdERheXMiLCJsY0FsZXJ0UGVyY2VudCIsImxjQWxlcnREYXlzIiwibGNQcml2YWN5UGVyY2VudCIsImxjUHJpdmFjeUhvdXJzIiwiZGF0YU1hbmFnZXIiLCJvblJlYWR5IiwiX3VwZGF0ZUxpZmVjeWNsZSIsImhvdXIiLCJnZXRIb3VycyIsIk1hdGgiLCJyb3VuZCIsImJhY2siLCJldmVudCIsImRpcmVjdGlvbiIsIlByb21pc2UiLCJyZXNvbHZlIiwidGhlbiIsInJvdXRlciIsImNsZWFyUHJpdmFjeURhdGEiLCJwcm9tcHQiLCJzaG93VG9hc3QiLCJtZXNzYWdlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozt3QkFXQSxJQUFBQSxVQUFBQyx1QkFBQUMsZUFBQTt3QkFDQSxJQUFBQyxXQUFBRix1QkFBQUMsZUFBQTt3QkFBcUMsU0FBQUQsdUJBQUFHLENBQUE7NEJBQUEsT0FBQUEsS0FBQUEsRUFBQUMsVUFBQSxHQUFBRCxJQUFBO2dDQUFBRSxTQUFBRjs0QkFBQTt3QkFBQTt3QkFBQSxTQUFBRyxRQUFBSCxDQUFBLEVBQUFJLENBQUE7NEJBQUEsSUFBQUMsSUFBQUMsT0FBQUMsSUFBQSxDQUFBUDs0QkFBQSxJQUFBTSxPQUFBRSxxQkFBQTtnQ0FBQSxJQUFBQyxJQUFBSCxPQUFBRSxxQkFBQSxDQUFBUjtnQ0FBQUksS0FBQUssQ0FBQUEsSUFBQUEsRUFBQUMsTUFBQSxVQUFBTixDQUFBO29DQUFBLE9BQUFFLE9BQUFLLHdCQUFBLENBQUFYLEdBQUFJLEdBQUFRLFVBQUE7Z0NBQUEsS0FBQVAsRUFBQVEsSUFBQSxDQUFBQyxLQUFBLENBQUFULEdBQUFJOzRCQUFBOzRCQUFBLE9BQUFKO3dCQUFBO3dCQUFBLFNBQUFVLGNBQUFmLENBQUE7NEJBQUEsUUFBQUksSUFBQSxHQUFBQSxJQUFBWSxVQUFBQyxNQUFBLEVBQUFiLElBQUE7Z0NBQUEsSUFBQUMsSUFBQSxRQUFBVyxTQUFBLENBQUFaLEVBQUEsR0FBQVksU0FBQSxDQUFBWixFQUFBO2dDQUFBQSxJQUFBLElBQUFELFFBQUFHLE9BQUFELElBQUEsSUFBQWEsT0FBQSxVQUFBZCxDQUFBO29DQUFBZSxnQkFBQW5CLEdBQUFJLEdBQUFDLENBQUEsQ0FBQUQsRUFBQTtnQ0FBQSxLQUFBRSxPQUFBYyx5QkFBQSxHQUFBZCxPQUFBZSxnQkFBQSxDQUFBckIsR0FBQU0sT0FBQWMseUJBQUEsQ0FBQWYsTUFBQUYsUUFBQUcsT0FBQUQsSUFBQWEsT0FBQSxVQUFBZCxDQUFBO29DQUFBRSxPQUFBZ0IsY0FBQSxDQUFBdEIsR0FBQUksR0FBQUUsT0FBQUssd0JBQUEsQ0FBQU4sR0FBQUQ7Z0NBQUE7NEJBQUE7NEJBQUEsT0FBQUo7d0JBQUE7d0JBQUEsU0FBQW1CLGdCQUFBbkIsQ0FBQSxFQUFBSSxDQUFBLEVBQUFDLENBQUE7NEJBQUEsT0FBQUQsQ0FBQUEsSUFBQW1CLGVBQUFuQixFQUFBLEtBQUFKLElBQUFNLE9BQUFnQixjQUFBLENBQUF0QixHQUFBSSxHQUFBO2dDQUFBb0IsT0FBQW5CO2dDQUFBTyxZQUFBO2dDQUFBYSxjQUFBO2dDQUFBQyxVQUFBOzRCQUFBLEtBQUExQixDQUFBLENBQUFJLEVBQUEsR0FBQUMsR0FBQUw7d0JBQUE7d0JBQUEsU0FBQXVCLGVBQUFsQixDQUFBOzRCQUFBLElBQUFzQixJQUFBQyxhQUFBdkIsR0FBQTs0QkFBQSwwQkFBQXNCLElBQUFBLElBQUFBLElBQUE7d0JBQUE7d0JBQUEsU0FBQUMsYUFBQXZCLENBQUEsRUFBQUQsQ0FBQTs0QkFBQSx1QkFBQUMsS0FBQSxDQUFBQSxHQUFBLE9BQUFBOzRCQUFBLElBQUFMLElBQUFLLENBQUEsQ0FBQXdCLE9BQUFDLFdBQUE7NEJBQUEsZUFBQTlCLEdBQUE7Z0NBQUEsSUFBQTJCLElBQUEzQixFQUFBK0IsSUFBQSxDQUFBMUIsR0FBQUQsS0FBQTtnQ0FBQSx1QkFBQXVCLEdBQUEsT0FBQUE7Z0NBQUEsVUFBQUssVUFBQTs0QkFBQTs0QkFBQSxxQkFBQTVCLElBQUE2QixTQUFBQyxNQUFBQSxFQUFBN0I7d0JBQUE7d0JBR3JDLE1BQU04QixlQUFZQyxRQUFBQSxZQUFBLEdBQUc7NEJBQ25CQyxJQUFJOzRCQUNKQyxJQUFJOzRCQUNKQyxJQUFJO3dCQUNOO3dCQUdBLE1BQU1DLE9BQU87NEJBQ1hGLElBQUk7NEJBQ0pDLElBQUk7d0JBQ047d0JBRUEsTUFBTUU7NEJBQ0pDLGFBQWM7Z0NBRVosSUFBSSxDQUFDQyxLQUFLLEdBQUc7b0NBQ1hDLGNBQWM7b0NBQ2RDLGNBQWM7b0NBQ2RDLFlBQVk7Z0NBQ2Q7NEJBQ0Y7NEJBVUFDLEtBQUtDLEtBQUssRUFBRUMsR0FBRyxFQUFFekIsS0FBSyxFQUFFMEIsT0FBTyxFQUFFQyxJQUFJLEVBQUU7Z0NBQ3JDLE1BQU1DLFFBQVFDLEtBQUtDLFNBQVMsQ0FBQzlCO2dDQUU3QixJQUFJd0IsVUFBVWIsYUFBYUUsRUFBRSxFQUFFLFlBRTdCa0IsU0FBQXJELE9BQU8sQ0FBQ3NELEdBQUcsQ0FBQztvQ0FDVlAsS0FBS0E7b0NBQ0x6QixPQUFPNEI7b0NBQ1BGLFNBQVNBO3dDQUNQTyxRQUFRQyxHQUFHLENBQUMsQ0FBQyx1QkFBdUIsRUFBRVQsS0FBSzt3Q0FDM0MsSUFBSUMsU0FBU0E7b0NBQ2Y7b0NBQ0FDLE1BQU1BLENBQUNRLE1BQU1DO3dDQUNYSCxRQUFRSSxLQUFLLENBQUMsQ0FBQyw0QkFBNEIsRUFBRUQsTUFBTTt3Q0FDbkQsSUFBSSxDQUFDakIsS0FBSyxDQUFDRyxVQUFVO3dDQUNyQixJQUFJSyxNQUFNQSxLQUFLUSxNQUFNQztvQ0FDdkI7Z0NBQ0Y7Z0NBS0YsTUFBTUUsU0FBU0MsUUFBQTdELE9BQU0sQ0FBQzhELElBQUksQ0FBQ3hCLElBQUksQ0FBQ1EsTUFBTTtnQ0FFdENlLFFBQUE3RCxPQUFNLENBQUMrRCxPQUFPLENBQUM7b0NBQ2JOLE1BQU1QO29DQUNOSCxLQUFLYTtvQ0FDTEksTUFBTTtvQ0FDTmhCLFNBQVVpQixDQUFBQTt3Q0FDUixJQUFJLENBQUN4QixLQUFLLENBQUNDLFlBQVk7d0NBQ3ZCVyxTQUFBckQsT0FBTyxDQUFDc0QsR0FBRyxDQUFDOzRDQUNWUCxLQUFLQTs0Q0FDTHpCLE9BQU8yQyxJQUFJUixJQUFJOzRDQUNmVCxTQUFTQTtnREFDUE8sUUFBUUMsR0FBRyxDQUFDLENBQUMsY0FBYyxFQUFFVixNQUFNLE9BQU8sRUFBRUMsS0FBSztnREFDakQsSUFBSUMsU0FBU0E7NENBQ2Y7NENBQ0FDLE1BQU1BLENBQUNRLE1BQU1DO2dEQUNYSCxRQUFRSSxLQUFLLENBQUMsQ0FBQyxjQUFjLEVBQUViLE1BQU0sZUFBZSxFQUFFWSxNQUFNO2dEQUM1RCxJQUFJLENBQUNqQixLQUFLLENBQUNHLFVBQVU7Z0RBQ3JCLElBQUlLLE1BQU1BLEtBQUtRLE1BQU1DOzRDQUN2Qjt3Q0FDRjtvQ0FDRjtvQ0FDQVQsTUFBTUEsQ0FBQ1EsTUFBTUM7d0NBQ1hILFFBQVFJLEtBQUssQ0FBQyxDQUFDLGNBQWMsRUFBRWIsTUFBTSxlQUFlLEVBQUVZLE1BQU07d0NBQzVELElBQUksQ0FBQ2pCLEtBQUssQ0FBQ0csVUFBVTt3Q0FDckIsSUFBSUssTUFBTUEsS0FBS1EsTUFBTUM7b0NBQ3ZCO2dDQUNGOzRCQUNGOzRCQVNBUSxLQUFLcEIsS0FBSyxFQUFFQyxHQUFHLEVBQUVvQixRQUFRLEVBQUVsQixJQUFJLEVBQUU7Z0NBQy9CSSxTQUFBckQsT0FBTyxDQUFDb0UsR0FBRyxDQUFDO29DQUNWckIsS0FBS0E7b0NBQ0xDLFNBQVVxQixDQUFBQTt3Q0FDUixJQUFJdkIsVUFBVWIsYUFBYUUsRUFBRSxFQUFFOzRDQUU3QixJQUFJO2dEQUNGZ0MsU0FBU2hCLEtBQUttQixLQUFLLENBQUNEOzRDQUN0QixFQUFFLE9BQU92RSxHQUFHO2dEQUNWcUUsU0FBU0U7NENBQ1g7NENBQ0E7d0NBQ0Y7d0NBR0EsTUFBTVQsU0FBU0MsUUFBQTdELE9BQU0sQ0FBQzhELElBQUksQ0FBQ3hCLElBQUksQ0FBQ1EsTUFBTTt3Q0FFdENlLFFBQUE3RCxPQUFNLENBQUN1RSxPQUFPLENBQUM7NENBQ2JkLE1BQU1ZOzRDQUNOdEIsS0FBS2E7NENBQ0xJLE1BQU07NENBQ05oQixTQUFVaUIsQ0FBQUE7Z0RBQ1IsSUFBSSxDQUFDeEIsS0FBSyxDQUFDRSxZQUFZO2dEQUN2QixJQUFJO29EQUNGd0IsU0FBU2hCLEtBQUttQixLQUFLLENBQUNMLElBQUlSLElBQUk7Z0RBQzlCLEVBQUUsT0FBTzNELEdBQUc7b0RBQ1ZxRSxTQUFTRixJQUFJUixJQUFJO2dEQUNuQjs0Q0FDRjs0Q0FDQVIsTUFBTUEsQ0FBQ1EsTUFBTUM7Z0RBQ1hILFFBQVFJLEtBQUssQ0FBQyxDQUFDLGNBQWMsRUFBRWIsTUFBTSxlQUFlLEVBQUVZLE1BQU07Z0RBQzVELElBQUksQ0FBQ2pCLEtBQUssQ0FBQ0csVUFBVTtnREFDckIsSUFBSUssTUFBTUEsS0FBS1EsTUFBTUM7NENBQ3ZCO3dDQUNGO29DQUNGO29DQUNBVCxNQUFNQSxDQUFDUSxNQUFNQzt3Q0FDWEgsUUFBUUksS0FBSyxDQUFDLENBQUMsY0FBYyxFQUFFYixNQUFNLFlBQVksRUFBRVksTUFBTTt3Q0FDekQsSUFBSSxDQUFDakIsS0FBSyxDQUFDRyxVQUFVO3dDQUNyQixJQUFJSyxNQUFNQSxLQUFLUSxNQUFNQztvQ0FDdkI7Z0NBQ0Y7NEJBQ0Y7NEJBT0FjLE9BQU96QixHQUFHLEVBQUVDLE9BQU8sRUFBRTtnQ0FDbkJLLFNBQUFyRCxPQUFPLENBQUN5RSxNQUFNLENBQUM7b0NBQ2IxQixLQUFLQTtvQ0FDTEMsU0FBU0E7d0NBQ1BPLFFBQVFDLEdBQUcsQ0FBQyxDQUFDLHNCQUFzQixFQUFFVCxLQUFLO3dDQUMxQyxJQUFJQyxTQUFTQTtvQ0FDZjtvQ0FDQUMsTUFBTUEsQ0FBQ1EsTUFBTUM7d0NBQ1hILFFBQVFJLEtBQUssQ0FBQyxDQUFDLDJCQUEyQixFQUFFRCxNQUFNO3dDQUNsRCxJQUFJLENBQUNqQixLQUFLLENBQUNHLFVBQVU7b0NBQ3ZCO2dDQUNGOzRCQUNGOzRCQVFBOEIsWUFBWXJFLElBQUksRUFBRThELFFBQVEsRUFBRTtnQ0FDMUIsSUFBSVEsWUFBWXRFLEtBQUtVLE1BQU07Z0NBQzNCLElBQUk0RCxBQUFjLE1BQWRBLFdBQWlCO29DQUNuQixJQUFJUixVQUFVQTtvQ0FDZDtnQ0FDRjtnQ0FFQTlELEtBQUtXLE9BQU8sQ0FBRStCLENBQUFBO29DQUNaTSxTQUFBckQsT0FBTyxDQUFDeUUsTUFBTSxDQUFDO3dDQUNiMUIsS0FBS0E7d0NBQ0xDLFNBQVNBOzRDQUNQMkI7NENBQ0EsSUFBSUEsQUFBYyxNQUFkQSxhQUFtQlIsVUFBVUE7d0NBQ25DO3dDQUNBbEIsTUFBTUE7NENBQ0owQjs0Q0FDQSxJQUFJQSxBQUFjLE1BQWRBLGFBQW1CUixVQUFVQTt3Q0FDbkM7b0NBQ0Y7Z0NBQ0Y7NEJBQ0Y7NEJBTUFTLFNBQVM1QixPQUFPLEVBQUU7Z0NBQ2hCSyxTQUFBckQsT0FBTyxDQUFDNkUsS0FBSyxDQUFDO29DQUNaN0IsU0FBU0E7d0NBQ1BPLFFBQVFDLEdBQUcsQ0FBQzt3Q0FDWixJQUFJLENBQUNmLEtBQUssR0FBRzs0Q0FBRUMsY0FBYzs0Q0FBR0MsY0FBYzs0Q0FBR0MsWUFBWTt3Q0FBRTt3Q0FDL0QsSUFBSUksU0FBU0E7b0NBQ2Y7b0NBQ0FDLE1BQU1BLENBQUNRLE1BQU1DO3dDQUNYSCxRQUFRSSxLQUFLLENBQUMsQ0FBQyw2QkFBNkIsRUFBRUQsTUFBTTtvQ0FDdEQ7Z0NBQ0Y7NEJBQ0Y7NEJBS0FvQixXQUFXO2dDQUNULE9BQUFqRSxjQUFBLElBQVksSUFBSSxDQUFDNEIsS0FBSzs0QkFDeEI7d0JBQ0Y7d0JBQUMsSUFBQXNDLFdBQUE3QyxPQUFBQSxDQUFBQSxVQUFBLEdBR2NLOzs7Ozs7Ozt3QkNsTmYsSUFBQXlDLGVBQUFDLHdCQUFBQyxvQkFBQTt3QkFBMEQsU0FBQUQsd0JBQUFuRixDQUFBLEVBQUFLLENBQUE7NEJBQUEseUJBQUFnRixTQUFBLElBQUFqRixJQUFBLElBQUFpRixXQUFBQyxJQUFBLElBQUFEOzRCQUFBLE9BQUFGLENBQUFBLDBCQUFBLFNBQUFuRixDQUFBLEVBQUFLLENBQUE7Z0NBQUEsS0FBQUEsS0FBQUwsS0FBQUEsRUFBQUMsVUFBQSxTQUFBRDtnQ0FBQSxJQUFBUyxHQUFBa0IsR0FBQTRELElBQUE7b0NBQUFDLFdBQUE7b0NBQUF0RixTQUFBRjtnQ0FBQTtnQ0FBQSxhQUFBQSxLQUFBLG1CQUFBQSxLQUFBLHFCQUFBQSxHQUFBLE9BQUF1RjtnQ0FBQSxJQUFBOUUsSUFBQUosSUFBQWlGLElBQUFsRixHQUFBO29DQUFBLElBQUFLLEVBQUFnRixHQUFBLENBQUF6RixJQUFBLE9BQUFTLEVBQUE2RCxHQUFBLENBQUF0RTtvQ0FBQVMsRUFBQStDLEdBQUEsQ0FBQXhELEdBQUF1RjtnQ0FBQTtnQ0FBQSxVQUFBbEYsS0FBQUwsRUFBQSxjQUFBSyxLQUFBLEtBQUFxRixjQUFBLENBQUEzRCxJQUFBLENBQUEvQixHQUFBSyxNQUFBLENBQUFzQixDQUFBQSxJQUFBLEFBQUFsQixDQUFBQSxJQUFBSCxPQUFBZ0IsY0FBQSxBQUFBQSxLQUFBaEIsT0FBQUssd0JBQUEsQ0FBQVgsR0FBQUssRUFBQSxLQUFBc0IsQ0FBQUEsRUFBQTJDLEdBQUEsSUFBQTNDLEVBQUE2QixHQUFBLEFBQUFBLElBQUEvQyxFQUFBOEUsR0FBQWxGLEdBQUFzQixLQUFBNEQsQ0FBQSxDQUFBbEYsRUFBQSxHQUFBTCxDQUFBLENBQUFLLEVBQUE7Z0NBQUEsT0FBQWtGOzRCQUFBLEdBQUF2RixHQUFBSzt3QkFBQTt3QkFBQSxTQUFBRixRQUFBSCxDQUFBLEVBQUFJLENBQUE7NEJBQUEsSUFBQUMsSUFBQUMsT0FBQUMsSUFBQSxDQUFBUDs0QkFBQSxJQUFBTSxPQUFBRSxxQkFBQTtnQ0FBQSxJQUFBQyxJQUFBSCxPQUFBRSxxQkFBQSxDQUFBUjtnQ0FBQUksS0FBQUssQ0FBQUEsSUFBQUEsRUFBQUMsTUFBQSxVQUFBTixDQUFBO29DQUFBLE9BQUFFLE9BQUFLLHdCQUFBLENBQUFYLEdBQUFJLEdBQUFRLFVBQUE7Z0NBQUEsS0FBQVAsRUFBQVEsSUFBQSxDQUFBQyxLQUFBLENBQUFULEdBQUFJOzRCQUFBOzRCQUFBLE9BQUFKO3dCQUFBO3dCQUFBLFNBQUFVLGNBQUFmLENBQUE7NEJBQUEsUUFBQUksSUFBQSxHQUFBQSxJQUFBWSxVQUFBQyxNQUFBLEVBQUFiLElBQUE7Z0NBQUEsSUFBQUMsSUFBQSxRQUFBVyxTQUFBLENBQUFaLEVBQUEsR0FBQVksU0FBQSxDQUFBWixFQUFBO2dDQUFBQSxJQUFBLElBQUFELFFBQUFHLE9BQUFELElBQUEsSUFBQWEsT0FBQSxVQUFBZCxDQUFBO29DQUFBZSxnQkFBQW5CLEdBQUFJLEdBQUFDLENBQUEsQ0FBQUQsRUFBQTtnQ0FBQSxLQUFBRSxPQUFBYyx5QkFBQSxHQUFBZCxPQUFBZSxnQkFBQSxDQUFBckIsR0FBQU0sT0FBQWMseUJBQUEsQ0FBQWYsTUFBQUYsUUFBQUcsT0FBQUQsSUFBQWEsT0FBQSxVQUFBZCxDQUFBO29DQUFBRSxPQUFBZ0IsY0FBQSxDQUFBdEIsR0FBQUksR0FBQUUsT0FBQUssd0JBQUEsQ0FBQU4sR0FBQUQ7Z0NBQUE7NEJBQUE7NEJBQUEsT0FBQUo7d0JBQUE7d0JBQUEsU0FBQW1CLGdCQUFBbkIsQ0FBQSxFQUFBSSxDQUFBLEVBQUFDLENBQUE7NEJBQUEsT0FBQUQsQ0FBQUEsSUFBQW1CLGVBQUFuQixFQUFBLEtBQUFKLElBQUFNLE9BQUFnQixjQUFBLENBQUF0QixHQUFBSSxHQUFBO2dDQUFBb0IsT0FBQW5CO2dDQUFBTyxZQUFBO2dDQUFBYSxjQUFBO2dDQUFBQyxVQUFBOzRCQUFBLEtBQUExQixDQUFBLENBQUFJLEVBQUEsR0FBQUMsR0FBQUw7d0JBQUE7d0JBQUEsU0FBQXVCLGVBQUFsQixDQUFBOzRCQUFBLElBQUFzQixJQUFBQyxhQUFBdkIsR0FBQTs0QkFBQSwwQkFBQXNCLElBQUFBLElBQUFBLElBQUE7d0JBQUE7d0JBQUEsU0FBQUMsYUFBQXZCLENBQUEsRUFBQUQsQ0FBQTs0QkFBQSx1QkFBQUMsS0FBQSxDQUFBQSxHQUFBLE9BQUFBOzRCQUFBLElBQUFMLElBQUFLLENBQUEsQ0FBQXdCLE9BQUFDLFdBQUE7NEJBQUEsZUFBQTlCLEdBQUE7Z0NBQUEsSUFBQTJCLElBQUEzQixFQUFBK0IsSUFBQSxDQUFBMUIsR0FBQUQsS0FBQTtnQ0FBQSx1QkFBQXVCLEdBQUEsT0FBQUE7Z0NBQUEsVUFBQUssVUFBQTs0QkFBQTs0QkFBQSxxQkFBQTVCLElBQUE2QixTQUFBQyxNQUFBQSxFQUFBN0I7d0JBQUE7d0JBRzFELE1BQU1zRixZQUFTdkQsUUFBQUEsU0FBQSxHQUFHOzRCQUNoQndELGVBQWU7NEJBQ2ZDLGVBQWU7NEJBQ2ZDLFlBQVk7NEJBQ1pDLGdCQUFnQjs0QkFDaEJDLFVBQVU7d0JBQ1o7d0JBR0EsTUFBTUMsU0FBTTdELFFBQUFBLE1BQUEsR0FBRzs0QkFDYixDQUFDdUQsVUFBVUMsYUFBYSxDQUFDLEVBQUU7NEJBQzNCLENBQUNELFVBQVVFLGFBQWEsQ0FBQyxFQUFFOzRCQUMzQixDQUFDRixVQUFVRyxVQUFVLENBQUMsRUFBRTs0QkFDeEIsQ0FBQ0gsVUFBVUksY0FBYyxDQUFDLEVBQUU7d0JBQzlCO3dCQUdBLE1BQU1HLFlBQVk7NEJBQ2hCLENBQUNQLFVBQVVDLGFBQWEsQ0FBQyxFQUFFekQsYUFBQUEsWUFBWSxDQUFDRSxFQUFFOzRCQUMxQyxDQUFDc0QsVUFBVUUsYUFBYSxDQUFDLEVBQUUxRCxhQUFBQSxZQUFZLENBQUNHLEVBQUU7NEJBQzFDLENBQUNxRCxVQUFVRyxVQUFVLENBQUMsRUFBRTNELGFBQUFBLFlBQVksQ0FBQ0ksRUFBRTs0QkFDdkMsQ0FBQ29ELFVBQVVJLGNBQWMsQ0FBQyxFQUFFNUQsYUFBQUEsWUFBWSxDQUFDSSxFQUFFOzRCQUMzQyxDQUFDb0QsVUFBVUssUUFBUSxDQUFDLEVBQUU3RCxhQUFBQSxZQUFZLENBQUNFLEVBQUU7d0JBQ3ZDO3dCQUVBLE1BQU04RDs0QkFDSnpELGFBQWM7Z0NBQ1osSUFBSSxDQUFDMEQsV0FBVyxHQUFHLElBQUkzRCxhQUFBdkMsT0FBVztnQ0FFbEMsSUFBSSxDQUFDbUcsV0FBVyxHQUFHLEVBQUU7NEJBQ3ZCOzRCQU1BQyxTQUFTQyxJQUFJLEVBQUVDLElBQUksRUFBRTtnQ0FDbkIsTUFBTUMsVUFBVUQsUUFBUSxJQUFJLENBQUNFLFdBQVc7Z0NBQ3hDLE9BQU8sQ0FBQyxHQUFHLEVBQUVILEtBQUssQ0FBQyxFQUFFRSxTQUFTOzRCQUNoQzs0QkFNQUMsWUFBWUMsRUFBRSxFQUFFO2dDQUNkLE1BQU1DLElBQUlELEtBQUssSUFBSUUsS0FBS0YsTUFBTSxJQUFJRTtnQ0FDbEMsT0FBTyxHQUFHRCxFQUFFRSxXQUFXLEdBQUcsQ0FBQyxFQUFFN0UsT0FBTzJFLEVBQUVHLFFBQVEsS0FBSyxHQUFHQyxRQUFRLENBQUMsR0FBRyxLQUFLLENBQUMsRUFBRS9FLE9BQU8yRSxFQUFFSyxPQUFPLElBQUlELFFBQVEsQ0FBQyxHQUFHLE1BQU07NEJBQ2xIOzRCQU9BRSxpQkFBaUJ2RSxLQUFLLEVBQUUwQixRQUFRLEVBQUU7Z0NBQ2hDLE1BQU1wQixNQUFNLElBQUksQ0FBQ3FELFFBQVEsQ0FBQ1gsVUFBVUMsYUFBYTtnQ0FDakQsTUFBTWpDLE9BQUk1QyxjQUFBQSxjQUFBLElBQ0w0QixRQUFLO29DQUNSNkQsTUFBTSxJQUFJLENBQUNFLFdBQVc7b0NBQ3RCUyxXQUFXTixLQUFLTyxHQUFHO2dDQUFFO2dDQUd2QixJQUFJLENBQUNDLFlBQVksQ0FBQ3BFO2dDQUNsQixJQUFJLENBQUNtRCxXQUFXLENBQUNyRCxJQUFJLENBQ25CbUQsU0FBUyxDQUFDUCxVQUFVQyxhQUFhLENBQUMsRUFDbEMzQyxLQUNBVSxNQUNBO29DQUNFRixRQUFRQyxHQUFHLENBQUMsQ0FBQyxrQ0FBa0MsRUFBRVQsS0FBSztvQ0FDdEQsSUFBSW9CLFVBQVVBLFNBQVM7Z0NBQ3pCLEdBQ0E7b0NBQ0UsSUFBSUEsVUFBVUEsU0FBUztnQ0FDekI7NEJBRUo7NEJBT0FpRCxpQkFBaUJDLEtBQUssRUFBRWxELFFBQVEsRUFBRTtnQ0FDaEMsTUFBTW1ELFFBQVEsSUFBSSxDQUFDZCxXQUFXO2dDQUM5QixNQUFNekQsTUFBTSxJQUFJLENBQUNxRCxRQUFRLENBQUNYLFVBQVVFLGFBQWEsSUFBSSxNQUFNZ0IsS0FBS08sR0FBRztnQ0FFbkUsTUFBTXpELE9BQUk1QyxjQUFBQSxjQUFBLElBQ0x3RyxRQUFLO29DQUNSZixNQUFNZ0I7b0NBQ05MLFdBQVdJLE1BQU1KLFNBQVMsSUFBSU4sS0FBS08sR0FBRztnQ0FBRTtnQ0FHMUMsSUFBSSxDQUFDQyxZQUFZLENBQUNwRTtnQ0FDbEIsSUFBSSxDQUFDbUQsV0FBVyxDQUFDckQsSUFBSSxDQUNuQm1ELFNBQVMsQ0FBQ1AsVUFBVUUsYUFBYSxDQUFDLEVBQ2xDNUMsS0FDQVUsTUFDQTtvQ0FDRUYsUUFBUUMsR0FBRyxDQUFDO29DQUNaLElBQUlXLFVBQVVBLFNBQVM7Z0NBQ3pCLEdBQ0E7b0NBQ0UsSUFBSUEsVUFBVUEsU0FBUztnQ0FDekI7NEJBRUo7NEJBT0FvRCxjQUFjQyxPQUFPLEVBQUVyRCxRQUFRLEVBQUU7Z0NBQy9CLE1BQU1wQixNQUFNLElBQUksQ0FBQ3FELFFBQVEsQ0FBQ1gsVUFBVUcsVUFBVSxJQUFJLE1BQU00QixRQUFRQyxVQUFVO2dDQUUxRSxJQUFJLENBQUNOLFlBQVksQ0FBQ3BFO2dDQUNsQixJQUFJLENBQUNtRCxXQUFXLENBQUNyRCxJQUFJLENBQ25CbUQsU0FBUyxDQUFDUCxVQUFVRyxVQUFVLENBQUMsRUFDL0I3QyxLQUNBeUUsU0FDQTtvQ0FDRWpFLFFBQVFDLEdBQUcsQ0FBQztvQ0FDWixJQUFJVyxVQUFVQSxTQUFTO2dDQUN6QixHQUNBO29DQUNFLElBQUlBLFVBQVVBLFNBQVM7Z0NBQ3pCOzRCQUVKOzRCQU9BdUQsa0JBQWtCRixPQUFPLEVBQUVyRCxRQUFRLEVBQUU7Z0NBQ25DLE1BQU1wQixNQUFNLElBQUksQ0FBQ3FELFFBQVEsQ0FBQ1gsVUFBVUksY0FBYyxJQUFJLE1BQU0yQixRQUFRQyxVQUFVO2dDQUU5RSxJQUFJLENBQUNOLFlBQVksQ0FBQ3BFO2dDQUNsQixJQUFJLENBQUNtRCxXQUFXLENBQUNyRCxJQUFJLENBQ25CbUQsU0FBUyxDQUFDUCxVQUFVSSxjQUFjLENBQUMsRUFDbkM5QyxLQUNBeUUsU0FDQTtvQ0FDRWpFLFFBQVFDLEdBQUcsQ0FBQztvQ0FDWixJQUFJVyxVQUFVQSxTQUFTO2dDQUN6QixHQUNBO29DQUNFLElBQUlBLFVBQVVBLFNBQVM7Z0NBQ3pCOzRCQUVKOzRCQU1Bd0Qsc0JBQXNCeEQsUUFBUSxFQUFFO2dDQUM5QixNQUFNcEIsTUFBTSxJQUFJLENBQUNxRCxRQUFRLENBQUNYLFVBQVVDLGFBQWE7Z0NBQ2pELElBQUksQ0FBQ1EsV0FBVyxDQUFDaEMsSUFBSSxDQUFDOEIsU0FBUyxDQUFDUCxVQUFVQyxhQUFhLENBQUMsRUFBRTNDLEtBQUtvQixVQUFVO29DQUN2RUEsU0FBUztnQ0FDWDs0QkFDRjs0QkFNQXlELGdCQUFnQnpELFFBQVEsRUFBRTtnQ0FFeEIsTUFBTTBELGNBQWMsSUFBSSxDQUFDekIsUUFBUSxDQUFDWCxVQUFVRSxhQUFhO2dDQUN6RCxNQUFNbUMsWUFBWSxJQUFJLENBQUMzQixXQUFXLENBQUMzRixNQUFNLENBQUV1SCxDQUFBQSxJQUFNQSxFQUFFQyxVQUFVLENBQUNIO2dDQUU5RCxJQUFJQyxBQUFxQixNQUFyQkEsVUFBVS9HLE1BQU0sRUFBUSxZQUMxQm9ELFNBQVMsRUFBRTtnQ0FJYixNQUFNOEQsU0FBUyxFQUFFO2dDQUNqQixJQUFJdEQsWUFBWW1ELFVBQVUvRyxNQUFNO2dDQUVoQytHLFVBQVU5RyxPQUFPLENBQUUrQixDQUFBQTtvQ0FDakIsSUFBSSxDQUFDbUQsV0FBVyxDQUFDaEMsSUFBSSxDQUFDOEIsU0FBUyxDQUFDUCxVQUFVRSxhQUFhLENBQUMsRUFBRTVDLEtBQU1VLENBQUFBO3dDQUM5RCxJQUFJQSxNQUFNd0UsT0FBT3RILElBQUksQ0FBQzhDO3dDQUN0QmtCO3dDQUNBLElBQUlBLEFBQWMsTUFBZEEsV0FBaUI7NENBRW5Cc0QsT0FBT0MsSUFBSSxDQUFDLENBQUNDLEdBQUdDLElBQU1ELEVBQUVsQixTQUFTLEdBQUdtQixFQUFFbkIsU0FBUzs0Q0FDL0M5QyxTQUFTOEQ7d0NBQ1g7b0NBQ0YsR0FBRzt3Q0FDRHREO3dDQUNBLElBQUlBLEFBQWMsTUFBZEEsV0FBaUJSLFNBQVM4RDtvQ0FDaEM7Z0NBQ0Y7NEJBQ0Y7NEJBT0FJLGVBQWVDLElBQUksRUFBRW5FLFFBQVEsRUFBRTtnQ0FDN0IsTUFBTW9FLFdBQVcsRUFBRTtnQ0FDbkIsSUFBSTVELFlBQVk7Z0NBRWhCLElBQUssSUFBSWxELElBQUksR0FBR0EsSUFBSTZHLE1BQU03RyxJQUFLO29DQUM3QixNQUFNNkUsT0FBTyxJQUFJSztvQ0FDakJMLEtBQUtrQyxPQUFPLENBQUNsQyxLQUFLUyxPQUFPLEtBQUt0RjtvQ0FDOUIsTUFBTThFLFVBQVUsSUFBSSxDQUFDQyxXQUFXLENBQUNGLEtBQUttQyxPQUFPO29DQUM3QyxNQUFNQyxTQUFTLENBQUMsR0FBRyxFQUFFakQsVUFBVUcsVUFBVSxDQUFDLENBQUMsRUFBRVcsU0FBUztvQ0FDdEQsTUFBTWxHLE9BQU8sSUFBSSxDQUFDOEYsV0FBVyxDQUFDM0YsTUFBTSxDQUFFdUgsQ0FBQUEsSUFBTUEsRUFBRUMsVUFBVSxDQUFDVTtvQ0FDekQvRCxhQUFhdEUsS0FBS1UsTUFBTTtvQ0FFeEJWLEtBQUtXLE9BQU8sQ0FBRStCLENBQUFBO3dDQUNaLElBQUksQ0FBQ21ELFdBQVcsQ0FBQ2hDLElBQUksQ0FBQzhCLFNBQVMsQ0FBQ1AsVUFBVUcsVUFBVSxDQUFDLEVBQUU3QyxLQUFNVSxDQUFBQTs0Q0FDM0QsSUFBSUEsTUFBTThFLFNBQVM1SCxJQUFJLENBQUM4Qzs0Q0FDeEJrQjs0Q0FDQSxJQUFJQSxBQUFjLE1BQWRBLFdBQWlCUixTQUFTb0U7d0NBQ2hDLEdBQUc7NENBQ0Q1RDs0Q0FDQSxJQUFJQSxBQUFjLE1BQWRBLFdBQWlCUixTQUFTb0U7d0NBQ2hDO29DQUNGO2dDQUNGO2dDQUVBLElBQUk1RCxBQUFjLE1BQWRBLFdBQWlCUixTQUFTb0U7NEJBQ2hDOzRCQU9BSSxhQUFhQyxRQUFRLEVBQUV6RSxRQUFRLEVBQUU7Z0NBQy9CLE1BQU1wQixNQUFNO2dDQUNaLElBQUksQ0FBQ29FLFlBQVksQ0FBQ3BFO2dDQUNsQixJQUFJLENBQUNtRCxXQUFXLENBQUNyRCxJQUFJLENBQUNaLGFBQUFBLFlBQVksQ0FBQ0UsRUFBRSxFQUFFWSxLQUFLNkYsVUFBVTtvQ0FDcEQsSUFBSXpFLFVBQVVBLFNBQVM7Z0NBQ3pCLEdBQUc7b0NBQ0QsSUFBSUEsVUFBVUEsU0FBUztnQ0FDekI7NEJBQ0Y7NEJBTUEwRSxhQUFhMUUsUUFBUSxFQUFFO2dDQUNyQixJQUFJLENBQUMrQixXQUFXLENBQUNoQyxJQUFJLENBQUNqQyxhQUFBQSxZQUFZLENBQUNFLEVBQUUsRUFBRSxlQUFlZ0MsVUFBVTtvQ0FDOURBLFNBQVM7d0NBQ1AyRSxvQkFBb0I7d0NBQ3BCQyxrQkFBa0I7d0NBQ2xCQyxjQUFjO29DQUNoQjtnQ0FDRjs0QkFDRjs0QkFNQUMsYUFBYTlFLFFBQVEsRUFBRTtnQ0FDckIsTUFBTStDLE1BQU1QLEtBQUtPLEdBQUc7Z0NBQ3BCLE1BQU1nQyxjQUFjLEVBQUU7Z0NBRXRCLElBQUksQ0FBQy9DLFdBQVcsQ0FBQ25GLE9BQU8sQ0FBRStCLENBQUFBO29DQUV4QixLQUFLLE1BQU0sQ0FBQ3NELE1BQU04QyxTQUFTLElBQUkvSSxPQUFPZ0osT0FBTyxDQUFDckQsUUFDNUMsSUFBSWhELElBQUlzRyxRQUFRLENBQUNoRCxPQUFPO3dDQUV0QixNQUFNaUQsWUFBWXZHLElBQUl3RyxLQUFLLENBQUM7d0NBQzVCLElBQUlELFdBQVc7NENBQ2IsTUFBTUUsV0FBVyxJQUFJN0MsS0FBSzJDLFNBQVMsQ0FBQyxFQUFFLEVBQUViLE9BQU87NENBQy9DLElBQUl2QixNQUFNc0MsV0FBV0wsVUFDbkJELFlBQVl2SSxJQUFJLENBQUNvQzt3Q0FFckI7d0NBQ0E7b0NBQ0Y7Z0NBRUo7Z0NBRUEsSUFBSW1HLEFBQXVCLE1BQXZCQSxZQUFZbkksTUFBTSxFQUFRO29DQUM1QixJQUFJb0QsVUFBVUEsU0FBUztvQ0FDdkI7Z0NBQ0Y7Z0NBR0EsSUFBSSxDQUFDZ0MsV0FBVyxHQUFHLElBQUksQ0FBQ0EsV0FBVyxDQUFDM0YsTUFBTSxDQUFFdUgsQ0FBQUEsSUFBTSxDQUFDbUIsWUFBWUcsUUFBUSxDQUFDdEI7Z0NBR3hFLElBQUksQ0FBQzdCLFdBQVcsQ0FBQ3hCLFdBQVcsQ0FBQ3dFLGFBQWE7b0NBQ3hDM0YsUUFBUUMsR0FBRyxDQUFDLENBQUMsc0JBQXNCLEVBQUUwRixZQUFZbkksTUFBTSxDQUFDLGFBQWEsQ0FBQztvQ0FDdEUsSUFBSW9ELFVBQVVBLFNBQVMrRSxZQUFZbkksTUFBTTtnQ0FDM0M7NEJBQ0Y7NEJBTUEwSSxvQkFBb0J0RixRQUFRLEVBQUU7Z0NBQzVCLE1BQU11RixjQUFjLElBQUksQ0FBQ3ZELFdBQVcsQ0FBQzNGLE1BQU0sQ0FDeEN1SCxDQUFBQSxJQUFNLENBQUNBLEVBQUVzQixRQUFRLENBQUM1RCxVQUFVSyxRQUFRO2dDQUV2QyxJQUFJLENBQUNLLFdBQVcsR0FBRyxJQUFJLENBQUNBLFdBQVcsQ0FBQzNGLE1BQU0sQ0FBRXVILENBQUFBLElBQU1BLEVBQUVzQixRQUFRLENBQUM1RCxVQUFVSyxRQUFRO2dDQUUvRSxJQUFJLENBQUNJLFdBQVcsQ0FBQ3hCLFdBQVcsQ0FBQ2dGLGFBQWE7b0NBQ3hDbkcsUUFBUUMsR0FBRyxDQUFDLENBQUMsc0JBQXNCLEVBQUVrRyxZQUFZM0ksTUFBTSxDQUFDLGFBQWEsQ0FBQztvQ0FDdEUsSUFBSW9ELFVBQVVBO2dDQUNoQjs0QkFDRjs0QkFNQXdGLFdBQVd4RixRQUFRLEVBQUU7Z0NBQ25CLE1BQU15RixVQUFVO29DQUNkQyxXQUFXLElBQUksQ0FBQzFELFdBQVcsQ0FBQ3BGLE1BQU07b0NBQ2xDK0ksY0FBYztvQ0FDZEMsZUFBZTtvQ0FDZkMsWUFBWTtvQ0FDWkMsZ0JBQWdCO2dDQUNsQjtnQ0FFQSxJQUFJLENBQUM5RCxXQUFXLENBQUNuRixPQUFPLENBQUUrQixDQUFBQTtvQ0FDeEIsSUFBSUEsSUFBSXNHLFFBQVEsQ0FBQzVELFVBQVVDLGFBQWEsR0FBR2tFLFFBQVFFLFlBQVk7eUNBQzFELElBQUkvRyxJQUFJc0csUUFBUSxDQUFDNUQsVUFBVUUsYUFBYSxHQUFHaUUsUUFBUUcsYUFBYTt5Q0FDaEUsSUFBSWhILElBQUlzRyxRQUFRLENBQUM1RCxVQUFVRyxVQUFVLEdBQUdnRSxRQUFRSSxVQUFVO3lDQUMxRCxJQUFJakgsSUFBSXNHLFFBQVEsQ0FBQzVELFVBQVVJLGNBQWMsR0FBRytELFFBQVFLLGNBQWM7Z0NBQ3pFO2dDQUVBTCxRQUFRTSxXQUFXLEdBQUcsSUFBSSxDQUFDaEUsV0FBVyxDQUFDcEIsUUFBUTtnQ0FDL0NYLFNBQVN5Rjs0QkFDWDs0QkFNQXpDLGFBQWFwRSxHQUFHLEVBQUU7Z0NBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUNvRCxXQUFXLENBQUNrRCxRQUFRLENBQUN0RyxNQUM3QixJQUFJLENBQUNvRCxXQUFXLENBQUN4RixJQUFJLENBQUNvQzs0QkFFMUI7d0JBQ0Y7d0JBQUMsSUFBQWdDLFdBQUE3QyxPQUFBQSxDQUFBQSxVQUFBLEdBR2MrRDs7Ozs7Ozs7Ozs7Ozs7b0JDN1dma0Usb0JBQW9CLENBQUMsR0FBRyxBQUFDO3dCQUN4QixJQUFJLEFBQXNCLFlBQXRCLE9BQU9DLFlBQXlCLE9BQU9BO3dCQUMzQyxJQUFJOzRCQUNILE9BQU8sSUFBSSxJQUFJLElBQUlDLFNBQVM7d0JBQzdCLEVBQUUsT0FBT3ZLLEdBQUc7NEJBQ1gsSUFBSSxBQUFrQixZQUFsQixPQUFPd0ssUUFBcUIsT0FBT0E7d0JBQ3hDO29CQUNEOzs7b0JDUEFILG9CQUFvQixFQUFFLEdBQUcsSUFBTzs7O29CQ0FoQ0Esb0JBQW9CLElBQUksR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkN3SDNCLElBQUF6SyxVQUFBQyx1QkFBQUMsZUFBQTt3QkFDQSxJQUFBMkssZUFBQTVLLHVCQUFBdUYsb0JBQUE7d0JBQWdELFNBQUF2Rix1QkFBQUcsQ0FBQTs0QkFBQSxPQUFBQSxLQUFBQSxFQUFBQyxVQUFBLEdBQUFELElBQUE7Z0NBQUFFLFNBQUFGOzRCQUFBO3dCQUFBO3dCQUFBLFNBQUFtRix3QkFBQW5GLENBQUEsRUFBQUssQ0FBQTs0QkFBQSx5QkFBQWdGLFNBQUEsSUFBQWpGLElBQUEsSUFBQWlGLFdBQUFDLElBQUEsSUFBQUQ7NEJBQUEsT0FBQUYsQ0FBQUEsMEJBQUEsU0FBQW5GLENBQUEsRUFBQUssQ0FBQTtnQ0FBQSxLQUFBQSxLQUFBTCxLQUFBQSxFQUFBQyxVQUFBLFNBQUFEO2dDQUFBLElBQUFTLEdBQUFrQixHQUFBNEQsSUFBQTtvQ0FBQUMsV0FBQTtvQ0FBQXRGLFNBQUFGO2dDQUFBO2dDQUFBLGFBQUFBLEtBQUEsbUJBQUFBLEtBQUEscUJBQUFBLEdBQUEsT0FBQXVGO2dDQUFBLElBQUE5RSxJQUFBSixJQUFBaUYsSUFBQWxGLEdBQUE7b0NBQUEsSUFBQUssRUFBQWdGLEdBQUEsQ0FBQXpGLElBQUEsT0FBQVMsRUFBQTZELEdBQUEsQ0FBQXRFO29DQUFBUyxFQUFBK0MsR0FBQSxDQUFBeEQsR0FBQXVGO2dDQUFBO2dDQUFBLFVBQUFsRixLQUFBTCxFQUFBLGNBQUFLLEtBQUEsS0FBQXFGLGNBQUEsQ0FBQTNELElBQUEsQ0FBQS9CLEdBQUFLLE1BQUEsQ0FBQXNCLENBQUFBLElBQUEsQUFBQWxCLENBQUFBLElBQUFILE9BQUFnQixjQUFBLEFBQUFBLEtBQUFoQixPQUFBSyx3QkFBQSxDQUFBWCxHQUFBSyxFQUFBLEtBQUFzQixDQUFBQSxFQUFBMkMsR0FBQSxJQUFBM0MsRUFBQTZCLEdBQUEsQUFBQUEsSUFBQS9DLEVBQUE4RSxHQUFBbEYsR0FBQXNCLEtBQUE0RCxDQUFBLENBQUFsRixFQUFBLEdBQUFMLENBQUEsQ0FBQUssRUFBQTtnQ0FBQSxPQUFBa0Y7NEJBQUEsR0FBQXZGLEdBQUFLO3dCQUFBO3dCQUFBLElBQUE0RSxXQUFBN0MsUUFBQWxDLE9BQUEsR0FFakM7NEJBQ2J3SyxTQUFTO2dDQUNQQyxlQUFlO2dDQUNmQyxZQUFZO2dDQUNaQyxnQkFBZ0I7Z0NBQ2hCQyxhQUFhO2dDQUNiQyxrQkFBa0I7Z0NBQ2xCQyxnQkFBZ0I7Z0NBQ2hCQyxhQUFhOzRCQUNmOzRCQUVBQztnQ0FDRSxJQUFJLENBQUNELFdBQVcsR0FBRyxJQUFJOUUsYUFBQUEsT0FBVztnQ0FDbEMsSUFBSSxDQUFDZ0YsZ0JBQWdCOzRCQUN2Qjs0QkFFQUE7Z0NBRUUsTUFBTS9ELE1BQU0sSUFBSVA7Z0NBQ2hCLE1BQU11RSxPQUFPaEUsSUFBSWlFLFFBQVE7Z0NBR3pCLElBQUksQ0FBQ1QsVUFBVSxHQUFHO2dDQUNsQixJQUFJLENBQUNELGFBQWEsR0FBR1csS0FBS0MsS0FBSyxDQUFFLElBQUksSUFBSztnQ0FHMUMsSUFBSSxDQUFDVCxXQUFXLEdBQUc7Z0NBQ25CLElBQUksQ0FBQ0QsY0FBYyxHQUFHUyxLQUFLQyxLQUFLLENBQUU7Z0NBR2xDLElBQUksQ0FBQ1AsY0FBYyxHQUFHLEtBQUtJO2dDQUMzQixJQUFJLENBQUNMLGdCQUFnQixHQUFHTyxLQUFLQyxLQUFLLENBQUUsQUFBQyxNQUFLSCxJQUFHLElBQUssS0FBTTs0QkFDMUQ7NEJBRUFJLE1BQUtDLEtBQUs7Z0NBQ1IsSUFBSSxDQUFDQSxTQUFTQSxBQUFvQixZQUFwQkEsTUFBTUMsU0FBUyxFQUMzQkMsUUFBQUMsT0FBQSxHQUFBQyxJQUFBLEtBQUExRyx3QkFBQXJGLGVBQU8sK0JBQWtCK0wsSUFBSSxDQUFFQyxDQUFBQTtvQ0FDN0JBLE9BQU9OLElBQUk7Z0NBQ2I7NEJBRUo7NEJBRUFPO2dDQUNFQyxRQUFBQSxPQUFNLENBQUNDLFNBQVMsQ0FBQztvQ0FBRUMsU0FBUztnQ0FBYztnQ0FFMUMsSUFBSSxDQUFDakIsV0FBVyxDQUFDdEIsbUJBQW1CLENBQUM7b0NBQ25DcUMsUUFBQUEsT0FBTSxDQUFDQyxTQUFTLENBQUM7d0NBQUVDLFNBQVM7b0NBQVk7b0NBQ3hDLElBQUksQ0FBQ2YsZ0JBQWdCO2dDQUN2Qjs0QkFDRjt3QkFDRiJ9