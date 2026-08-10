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
                    "./src/lib/anonymizer.js" (__unused_rspack_module, exports) {
                        "use strict";
                        Object.defineProperty(exports, "__esModule", {
                            value: true
                        });
                        exports["default"] = exports.HR_ZONE = exports.ANON_TYPE = void 0;
                        const ANON_TYPE = exports.ANON_TYPE = {
                            HR_FEATURE: 'hr_feature',
                            ACCEL_FEATURE: 'accel_feature',
                            STEP_FEATURE: 'step_feature',
                            STRESS_FEATURE: 'stress_feature',
                            POSTURE_FEATURE: 'posture_feature'
                        };
                        const HR_ZONE = exports.HR_ZONE = {
                            REST: {
                                min: 0,
                                max: 60,
                                label: '静息'
                            },
                            NORMAL: {
                                min: 60,
                                max: 100,
                                label: '正常'
                            },
                            ELEVATED: {
                                min: 100,
                                max: 140,
                                label: '偏高'
                            },
                            HIGH: {
                                min: 140,
                                max: 200,
                                label: '过高'
                            }
                        };
                        class Anonymizer {
                            constructor(){
                                this.hrBuffer = [];
                                this.hrBufferStartTime = null;
                                this.stressBuffer = [];
                                this.stressBufferStartTime = null;
                                this.stepBuffer = [];
                                this.stepBufferHour = null;
                            }
                            anonymizeHeartRate(rawData) {
                                const now = rawData.timeStamp;
                                const hourBucket = Math.floor(now / 3600000);
                                if (null === this.hrBufferStartTime) this.hrBufferStartTime = now;
                                const elapsed = now - this.hrBufferStartTime;
                                const FIVE_MINUTES = 300000;
                                this.hrBuffer.push(rawData.value);
                                if (elapsed < FIVE_MINUTES) return null;
                                const values = this.hrBuffer;
                                const feature = {
                                    type: ANON_TYPE.HR_FEATURE,
                                    hourBucket: hourBucket,
                                    avgValue: Math.round(this._calcMean(values)),
                                    minValue: Math.min(...values),
                                    maxValue: Math.max(...values),
                                    zone: this._classifyHRZone(this._calcMean(values)),
                                    sampleCount: values.length
                                };
                                this.hrBuffer = [];
                                this.hrBufferStartTime = now;
                                return feature;
                            }
                            anonymizeAcceleration(samples) {
                                if (!samples || 0 === samples.length) return null;
                                const n = samples.length;
                                const avgX = this._calcAxisMean(samples, 'x');
                                const avgY = this._calcAxisMean(samples, 'y');
                                const avgZ = this._calcAxisMean(samples, 'z');
                                const varX = this._calcAxisVariance(samples, 'x');
                                const varY = this._calcAxisVariance(samples, 'y');
                                const varZ = this._calcAxisVariance(samples, 'z');
                                const dominantAxis = this._getDominantAxis(avgX, avgY, avgZ);
                                const totalVariance = varX + varY + varZ;
                                return {
                                    type: ANON_TYPE.ACCEL_FEATURE,
                                    timestamp: Date.now(),
                                    avgX: avgX.toFixed(3),
                                    avgY: avgY.toFixed(3),
                                    avgZ: avgZ.toFixed(3),
                                    varX: varX.toFixed(4),
                                    varY: varY.toFixed(4),
                                    varZ: varZ.toFixed(4),
                                    dominantAxis: dominantAxis,
                                    isStationary: totalVariance < 0.01,
                                    sampleCount: n
                                };
                            }
                            anonymizePostureResult(postureResult) {
                                return {
                                    type: ANON_TYPE.POSTURE_FEATURE,
                                    timestamp: Date.now(),
                                    postureType: postureResult.type,
                                    confidence: postureResult.confidence
                                };
                            }
                            anonymizeStep(rawData) {
                                const hour = new Date(rawData.timeStamp).getHours();
                                const hourBucket = Math.floor(rawData.timeStamp / 3600000);
                                if (null === this.stepBufferHour) this.stepBufferHour = hourBucket;
                                if (hourBucket !== this.stepBufferHour) {
                                    const feature = {
                                        type: ANON_TYPE.STEP_FEATURE,
                                        hourBucket: this.stepBufferHour,
                                        totalSteps: this.stepBuffer.reduce((a, b)=>a + b, 0),
                                        sampleCount: this.stepBuffer.length
                                    };
                                    this.stepBuffer = [
                                        rawData.value
                                    ];
                                    this.stepBufferHour = hourBucket;
                                    return feature;
                                }
                                this.stepBuffer.push(rawData.value);
                                return null;
                            }
                            anonymizeStress(rawData) {
                                const now = rawData.timeStamp;
                                if (null === this.stressBufferStartTime) this.stressBufferStartTime = now;
                                const elapsed = now - this.stressBufferStartTime;
                                const TEN_MINUTES = 600000;
                                this.stressBuffer.push(rawData.value);
                                if (elapsed < TEN_MINUTES) return null;
                                const values = this.stressBuffer;
                                const feature = {
                                    type: ANON_TYPE.STRESS_FEATURE,
                                    hourBucket: Math.floor(this.stressBufferStartTime / 3600000),
                                    avgValue: Math.round(this._calcMean(values)),
                                    maxValue: Math.max(...values),
                                    sampleCount: values.length
                                };
                                this.stressBuffer = [];
                                this.stressBufferStartTime = now;
                                return feature;
                            }
                            _classifyHRZone(value) {
                                for (const [key, zone] of Object.entries(HR_ZONE))if (value >= zone.min && value < zone.max) return zone.label;
                                return '未知';
                            }
                            _calcMean(arr) {
                                if (0 === arr.length) return 0;
                                return arr.reduce((a, b)=>a + b, 0) / arr.length;
                            }
                            _calcAxisMean(samples, axis) {
                                const n = samples.length;
                                if (0 === n) return 0;
                                let sum = 0;
                                for(let i = 0; i < n; i++)sum += samples[i][axis];
                                return sum / n;
                            }
                            _calcAxisVariance(samples, axis) {
                                const n = samples.length;
                                if (n < 2) return 0;
                                const mean = this._calcAxisMean(samples, axis);
                                let variance = 0;
                                for(let i = 0; i < n; i++){
                                    const diff = samples[i][axis] - mean;
                                    variance += diff * diff;
                                }
                                return variance / n;
                            }
                            _getDominantAxis(avgX, avgY, avgZ) {
                                const absX = Math.abs(avgX);
                                const absY = Math.abs(avgY);
                                const absZ = Math.abs(avgZ);
                                if (absX >= absY && absX >= absZ) return 'x';
                                if (absY >= absX && absY >= absZ) return 'y';
                                return 'z';
                            }
                        }
                        var _default = exports["default"] = Anonymizer;
                    },
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
                    },
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
                                marginTop: "20px"
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
                                    "time"
                                ]
                            ],
                            {
                                fontSize: "20px",
                                color: "#888888"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "score-card"
                                ]
                            ],
                            {
                                width: "420px",
                                paddingTop: "20px",
                                paddingRight: "20px",
                                paddingBottom: "20px",
                                paddingLeft: "20px",
                                backgroundColor: "#1a1a2e",
                                borderRadius: "16px",
                                flexDirection: "column",
                                alignItems: "center"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "score-label"
                                ]
                            ],
                            {
                                fontSize: "20px",
                                color: "#aaaaaa",
                                marginBottom: "10px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "score-circle"
                                ]
                            ],
                            {
                                flexDirection: "row",
                                alignItems: "baseline"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "score-value"
                                ]
                            ],
                            {
                                fontSize: "72px",
                                color: "#00d4aa",
                                fontWeight: "bold"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "score-unit"
                                ]
                            ],
                            {
                                fontSize: "24px",
                                color: "#00d4aa",
                                marginLeft: "5px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "score-bar"
                                ]
                            ],
                            {
                                width: "300px",
                                height: "8px",
                                backgroundColor: "#333333",
                                borderRadius: "4px",
                                marginTop: "10px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "score-fill"
                                ]
                            ],
                            {
                                height: "8px",
                                backgroundColor: "#00d4aa",
                                borderRadius: "4px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "score-desc"
                                ]
                            ],
                            {
                                fontSize: "18px",
                                color: "#00d4aa",
                                marginTop: "8px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "stats-row"
                                ]
                            ],
                            {
                                width: "420px",
                                flexDirection: "row",
                                justifyContent: "space-around",
                                alignItems: "center",
                                paddingTop: "15px",
                                paddingRight: "0",
                                paddingBottom: "15px",
                                paddingLeft: "0",
                                marginTop: "15px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "stat-item"
                                ]
                            ],
                            {
                                flexDirection: "column",
                                alignItems: "center"
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
                                fontWeight: "bold"
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
                                color: "#888888",
                                marginTop: "4px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "stat-divider"
                                ]
                            ],
                            {
                                width: "1px",
                                height: "40px",
                                backgroundColor: "#333333"
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
                                width: "420px",
                                paddingTop: "15px",
                                paddingRight: "20px",
                                paddingBottom: "15px",
                                paddingLeft: "20px",
                                backgroundColor: "#1a1a2e",
                                borderRadius: "12px",
                                marginTop: "15px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "status-title"
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
                                    "status-row"
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
                                    "menu-grid"
                                ]
                            ],
                            {
                                width: "420px",
                                flexDirection: "row",
                                flexWrap: "wrap",
                                justifyContent: "space-between",
                                marginTop: "20px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "menu-item"
                                ]
                            ],
                            {
                                width: "195px",
                                height: "80px",
                                backgroundColor: "#1a1a2e",
                                borderRadius: "12px",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: "10px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "menu-icon"
                                ]
                            ],
                            {
                                fontSize: "28px"
                            }
                        ],
                        [
                            [
                                [
                                    0,
                                    "menu-text"
                                ]
                            ],
                            {
                                fontSize: "16px",
                                color: "#ffffff",
                                marginTop: "6px"
                            }
                        ]
                    ];
                    var $app_script$ = function __scriptModule__(module, exports, $app_require$1) {
                        "use strict";
                        Object.defineProperty(exports, "__esModule", {
                            value: true
                        });
                        exports.default = void 0;
                        var _system = _interopRequireDefault($app_require$1("@app-module/system.router"));
                        var _system2 = _interopRequireDefault($app_require$1("@app-module/system.sensor"));
                        var _service = _interopRequireDefault($app_require$1("@app-module/service.health"));
                        var _system3 = _interopRequireDefault($app_require$1("@app-module/system.vibrator"));
                        var _system4 = _interopRequireDefault($app_require$1("@app-module/system.prompt"));
                        var _postureDetector = _interopRequireWildcard(__webpack_require__("./src/lib/posture-detector.js"));
                        var _anonymizer = _interopRequireDefault(__webpack_require__("./src/lib/anonymizer.js"));
                        var _dataManager = _interopRequireDefault(__webpack_require__("./src/lib/data-manager.js"));
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
                        function _interopRequireDefault(e) {
                            return e && e.__esModule ? e : {
                                default: e
                            };
                        }
                        var _default = exports.default = {
                            private: {
                                currentTime: '--:--',
                                healthScore: 100,
                                scoreDesc: '体态良好',
                                todayAlerts: 0,
                                sedentaryMin: 0,
                                privacyStatus: '✓',
                                postureIcon: '😊',
                                postureType: '正常',
                                postureDetail: '体态良好，继续保持',
                                monitorRunning: false,
                                detector: null,
                                anonymizer: null,
                                dataManager: null,
                                timeTimer: null,
                                accelBuffer: []
                            },
                            onReady () {
                                console.log('[Index] onReady');
                                this._initModules();
                                this._startTimer();
                                this._loadTodayData();
                            },
                            onDestroy () {
                                console.log('[Index] onDestroy');
                                this._stopMonitor();
                                if (this.timeTimer) clearInterval(this.timeTimer);
                            },
                            _initModules () {
                                this.detector = new _postureDetector.default({
                                    sedentaryThreshold: 1800000
                                });
                                this.anonymizer = new _anonymizer.default();
                                this.dataManager = new _dataManager.default();
                                this.detector.onDetect = (result)=>{
                                    this._handlePostureResult(result);
                                };
                            },
                            _startTimer () {
                                this._updateTime();
                                this.timeTimer = setInterval(()=>{
                                    this._updateTime();
                                }, 30000);
                            },
                            _updateTime () {
                                const now = new Date();
                                const h = String(now.getHours()).padStart(2, '0');
                                const m = String(now.getMinutes()).padStart(2, '0');
                                this.currentTime = `${h}:${m}`;
                            },
                            _loadTodayData () {
                                this.dataManager.loadTodayPostureStats((stats)=>{
                                    if (stats) {
                                        this.todayAlerts = stats.totalAlerts || 0;
                                        this.sedentaryMin = Math.round((stats.sedentaryMs || 0) / 60000);
                                        this._updateHealthScore();
                                    }
                                });
                            },
                            _handlePostureResult (result) {
                                this.postureIcon = this._getPostureIcon(result.type);
                                this.postureType = _postureDetector.default.getPostureName(result.type);
                                this.postureDetail = result.detail;
                                if (result.type !== _postureDetector.POSTURE_TYPE.NORMAL) {
                                    this.todayAlerts++;
                                    _system3.default.vibrate({
                                        mode: 'long'
                                    });
                                    this.dataManager.savePostureAlert({
                                        type: result.type,
                                        confidence: result.confidence,
                                        detail: result.detail
                                    });
                                    _system4.default.showToast({
                                        message: `⚠️ 检测到${_postureDetector.default.getPostureName(result.type)}`,
                                        duration: 1
                                    });
                                    this._updateHealthScore();
                                }
                                this.sedentaryMin = Math.round(this.detector.getTodaySedentaryMs() / 60000);
                            },
                            _getPostureIcon (type) {
                                const icons = {
                                    [_postureDetector.POSTURE_TYPE.NORMAL]: '😊',
                                    [_postureDetector.POSTURE_TYPE.SEDENTARY]: '🪑',
                                    [_postureDetector.POSTURE_TYPE.HEAD_TILT]: '📱',
                                    [_postureDetector.POSTURE_TYPE.LEG_CROSS]: '🦵'
                                };
                                return icons[type] || '❓';
                            },
                            _updateHealthScore () {
                                const alerts = this.todayAlerts;
                                let score = 100;
                                score -= Math.min(5 * alerts, 30);
                                score -= Math.min(0.2 * this.sedentaryMin, 20);
                                this.healthScore = Math.max(0, Math.round(score));
                                if (this.healthScore >= 80) this.scoreDesc = '体态良好';
                                else if (this.healthScore >= 60) this.scoreDesc = '需要注意';
                                else this.scoreDesc = '体态警告';
                            },
                            _startMonitor () {
                                if (this.monitorRunning) return;
                                _system2.default.subscribeAccelerometer({
                                    callback: (data)=>{
                                        this._onAccelerometerData(data);
                                    },
                                    fail: (data, code)=>{
                                        console.error('[Index] accelerometer fail:', code);
                                    }
                                });
                                _service.default.subscribeSample({
                                    dataType: _service.default.DATA_TYPES.HEART_RATE,
                                    callback: (sample)=>{
                                        this._onHeartRateData(sample);
                                    },
                                    fail: (data, code)=>{
                                        console.error('[Index] health subscribe fail:', code);
                                    }
                                });
                                this.monitorRunning = true;
                                this.privacyStatus = '🟢';
                                console.log('[Index] monitor started');
                            },
                            _stopMonitor () {
                                if (!this.monitorRunning) return;
                                _system2.default.unsubscribeAccelerometer();
                                _service.default.unsubscribeSample({
                                    dataType: _service.default.DATA_TYPES.HEART_RATE
                                });
                                this.monitorRunning = false;
                                this.privacyStatus = '✓';
                                console.log('[Index] monitor stopped');
                            },
                            _onAccelerometerData (data) {
                                this.detector.input({
                                    x: data.x,
                                    y: data.y,
                                    z: data.z
                                });
                                this.accelBuffer.push({
                                    x: data.x,
                                    y: data.y,
                                    z: data.z
                                });
                                if (this.accelBuffer.length > 100) {
                                    const feature = this.anonymizer.anonymizeAcceleration(this.accelBuffer);
                                    if (feature) this.dataManager.saveHRFeature(feature);
                                    this.accelBuffer = [];
                                }
                            },
                            _onHeartRateData (sample) {
                                const feature = this.anonymizer.anonymizeHeartRate(sample);
                                if (feature) this.dataManager.saveHRFeature(feature);
                            },
                            goToPosture () {
                                _system.default.push({
                                    uri: '/pages/posture'
                                });
                            },
                            goToPrivacy () {
                                _system.default.push({
                                    uri: '/pages/privacy'
                                });
                            },
                            goToReport () {
                                _system.default.push({
                                    uri: '/pages/report'
                                });
                            },
                            toggleMonitor () {
                                if (this.monitorRunning) {
                                    this._stopMonitor();
                                    _system4.default.showToast({
                                        message: '监测已暂停'
                                    });
                                } else {
                                    this._startMonitor();
                                    _system4.default.showToast({
                                        message: '监测已开启'
                                    });
                                }
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
                                ]
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
                                            "title"
                                        ],
                                        value: "🔒 体态安全卫士"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "time"
                                        ],
                                        value: function() {
                                            return _vm_.currentTime;
                                        }
                                    }
                                }, [])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "score-card"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "score-label"
                                        ],
                                        value: "体态健康评分"
                                    }
                                }, []),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "score-circle"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "score-value"
                                            ],
                                            value: function() {
                                                return _vm_.healthScore;
                                            }
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "score-unit"
                                            ],
                                            value: "分"
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "score-bar"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("div", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "score-fill"
                                            ],
                                            style: function() {
                                                return __webpack_require__.g.$translateStyle$("width: " + _vm_.healthScore + "%;");
                                            }
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "score-desc"
                                        ],
                                        value: function() {
                                            return _vm_.scoreDesc;
                                        }
                                    }
                                }, [])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "stats-row"
                                    ]
                                }
                            }, [
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "stat-item"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-value"
                                            ],
                                            value: function() {
                                                return _vm_.todayAlerts;
                                            }
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-label"
                                            ],
                                            value: "体态异常"
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "stat-divider"
                                        ]
                                    }
                                }, []),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "stat-item"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-value"
                                            ],
                                            value: function() {
                                                return _vm_.sedentaryMin;
                                            }
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-label"
                                            ],
                                            value: "久坐(分)"
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "stat-divider"
                                        ]
                                    }
                                }, []),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "stat-item"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-value"
                                            ],
                                            value: function() {
                                                return _vm_.privacyStatus;
                                            }
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-label"
                                            ],
                                            value: "隐私防护"
                                        }
                                    }, [])
                                ])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "status-card"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "status-title"
                                        ],
                                        value: "当前体态"
                                    }
                                }, []),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "status-row"
                                        ]
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
                                        "menu-grid"
                                    ]
                                }
                            }, [
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "menu-item"
                                        ],
                                        events: {
                                            click: function(evt) {
                                                return _vm_.goToPosture(evt);
                                            }
                                        }
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "menu-icon"
                                            ],
                                            value: "📊"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "menu-text"
                                            ],
                                            value: "体态监测"
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "menu-item"
                                        ],
                                        events: {
                                            click: function(evt) {
                                                return _vm_.goToPrivacy(evt);
                                            }
                                        }
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "menu-icon"
                                            ],
                                            value: "🛡️"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "menu-text"
                                            ],
                                            value: "安全详情"
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "menu-item"
                                        ],
                                        events: {
                                            click: function(evt) {
                                                return _vm_.goToReport(evt);
                                            }
                                        }
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "menu-icon"
                                            ],
                                            value: "📋"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "menu-text"
                                            ],
                                            value: "健康报表"
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "menu-item"
                                        ],
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
                                                "menu-icon"
                                            ],
                                            value: function() {
                                                return _vm_.monitorRunning ? "\u23F8\uFE0F" : "\u25B6\uFE0F";
                                            }
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "menu-text"
                                            ],
                                            value: function() {
                                                return _vm_.monitorRunning ? "\u6682\u505C\u76D1\u6D4B" : "\u5F00\u542F\u76D1\u6D4B";
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZXMvaW5kZXgvaW5kZXguanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9wb3N0dXJlLWd1YXJkL3NyYy9saWIvYW5vbnltaXplci5qcyIsIndlYnBhY2s6Ly9wb3N0dXJlLWd1YXJkL3NyYy9saWIvY3J5cHRvLXN0b3JlLmpzIiwid2VicGFjazovL3Bvc3R1cmUtZ3VhcmQvc3JjL2xpYi9kYXRhLW1hbmFnZXIuanMiLCJ3ZWJwYWNrOi8vcG9zdHVyZS1ndWFyZC9zcmMvbGliL3Bvc3R1cmUtZGV0ZWN0b3IuanMiLCJ3ZWJwYWNrOi8vcG9zdHVyZS1ndWFyZC93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL3Bvc3R1cmUtZ3VhcmQvd2VicGFjay9ydW50aW1lL3JzcGFja192ZXJzaW9uIiwid2VicGFjazovL3Bvc3R1cmUtZ3VhcmQvd2VicGFjay9ydW50aW1lL3JzcGFja191bmlxdWVfaWQiLCJ3ZWJwYWNrOi8vcG9zdHVyZS1ndWFyZC9zcmMvcGFnZXMvaW5kZXgvaW5kZXgudXgiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBhbm9ueW1pemVyLmpzIC0g56m/5oi06ZqQ56eB5pWw5o2u5pys5Zyw6ISx5pWPXG4gKlxuICog5a+55Lyg5oSf5Zmo5ZKM5YGl5bq35pWw5o2u6L+b6KGM5pys5Zyw5Yy/5ZCN5YyW5aSE55CG77yaXG4gKiAtIOW/g+eOh++8mumZjemHh+agt+WIsDXliIbpkp/nspLluqbvvIzkv53nlZnljLrpl7TnibnlvoHvvIzljrvpmaTnsr7noa7ml7bpl7TmiLNcbiAqIC0g5q2l5pWw77ya6IGa5ZCI5Li65bCP5pe257KS5bqmXG4gKiAtIOWKoOmAn+W6pu+8muS7heS/neeVmee7n+iuoeeJueW+geWQkemHj++8iOaWueW3ruOAgeS4u+i9tOaWueWQke+8iVxuICogLSDljovlipvvvJrpmY3ph4fmoLfliLAxMOWIhumSn+eykuW6plxuICpcbiAqIOWOn+WIme+8muaVsOaNruWPr+eUqOS4jeWPr+inge+8jOWPquS/neeVmeS9k+aAgeWIhuaekOacieaViOeJueW+gVxuICovXG5cbi8vIOiEseaVj+aVsOaNruexu+Wei+agh+ivhlxuY29uc3QgQU5PTl9UWVBFID0ge1xuICBIUl9GRUFUVVJFOiAnaHJfZmVhdHVyZScsICAgICAgICAgICAvLyDlv4PnjofnibnlvoFcbiAgQUNDRUxfRkVBVFVSRTogJ2FjY2VsX2ZlYXR1cmUnLCAgICAgLy8g5Yqg6YCf5bqm54m55b6BXG4gIFNURVBfRkVBVFVSRTogJ3N0ZXBfZmVhdHVyZScsICAgICAgIC8vIOatpeaVsOeJueW+gVxuICBTVFJFU1NfRkVBVFVSRTogJ3N0cmVzc19mZWF0dXJlJywgICAvLyDljovlipvnibnlvoFcbiAgUE9TVFVSRV9GRUFUVVJFOiAncG9zdHVyZV9mZWF0dXJlJywgLy8g5L2T5oCB54m55b6BXG59XG5cbi8vIOW/g+eOh+WMuumXtOWIhuexu1xuY29uc3QgSFJfWk9ORSA9IHtcbiAgUkVTVDogeyBtaW46IDAsIG1heDogNjAsIGxhYmVsOiAn6Z2Z5oGvJyB9LFxuICBOT1JNQUw6IHsgbWluOiA2MCwgbWF4OiAxMDAsIGxhYmVsOiAn5q2j5bi4JyB9LFxuICBFTEVWQVRFRDogeyBtaW46IDEwMCwgbWF4OiAxNDAsIGxhYmVsOiAn5YGP6auYJyB9LFxuICBISUdIOiB7IG1pbjogMTQwLCBtYXg6IDIwMCwgbGFiZWw6ICfov4fpq5gnIH0sXG59XG5cbmNsYXNzIEFub255bWl6ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyDlv4PnjofnvJPlhrLljLrvvIjnlKjkuo415YiG6ZKf6ZmN6YeH5qC377yJXG4gICAgdGhpcy5ockJ1ZmZlciA9IFtdXG4gICAgdGhpcy5ockJ1ZmZlclN0YXJ0VGltZSA9IG51bGxcbiAgICAvLyDljovlipvnvJPlhrLljLrvvIjnlKjkuo4xMOWIhumSn+mZjemHh+agt++8iVxuICAgIHRoaXMuc3RyZXNzQnVmZmVyID0gW11cbiAgICB0aGlzLnN0cmVzc0J1ZmZlclN0YXJ0VGltZSA9IG51bGxcbiAgICAvLyDmraXmlbDnvJPlhrLljLrvvIjnlKjkuo7lsI/ml7bogZrlkIjvvIlcbiAgICB0aGlzLnN0ZXBCdWZmZXIgPSBbXVxuICAgIHRoaXMuc3RlcEJ1ZmZlckhvdXIgPSBudWxsXG4gIH1cblxuICAvKipcbiAgICog6ISx5pWP5b+D546H5pWw5o2uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByYXdEYXRhIC0geyB0aW1lU3RhbXA6IG51bWJlciwgdmFsdWU6IG51bWJlciB9XG4gICAqIEByZXR1cm5zIHtPYmplY3R8bnVsbH0g6ISx5pWP5ZCO55qE54m55b6B77yM5oiWbnVsbO+8iOacquWIsOmZjemHh+agt+aXtumXtO+8iVxuICAgKi9cbiAgYW5vbnltaXplSGVhcnRSYXRlKHJhd0RhdGEpIHtcbiAgICBjb25zdCBub3cgPSByYXdEYXRhLnRpbWVTdGFtcFxuICAgIGNvbnN0IGhvdXJCdWNrZXQgPSBNYXRoLmZsb29yKG5vdyAvIDM2MDAwMDApXG5cbiAgICAvLyDliJ3lp4vljJbnvJPlhrLljLpcbiAgICBpZiAodGhpcy5ockJ1ZmZlclN0YXJ0VGltZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5ockJ1ZmZlclN0YXJ0VGltZSA9IG5vd1xuICAgIH1cblxuICAgIC8vIOajgOafpeaYr+WQpuWcqOWQjOS4gOS4qjXliIbpkp/nqpflj6NcbiAgICBjb25zdCBlbGFwc2VkID0gbm93IC0gdGhpcy5ockJ1ZmZlclN0YXJ0VGltZVxuICAgIGNvbnN0IEZJVkVfTUlOVVRFUyA9IDUgKiA2MCAqIDEwMDBcblxuICAgIHRoaXMuaHJCdWZmZXIucHVzaChyYXdEYXRhLnZhbHVlKVxuXG4gICAgaWYgKGVsYXBzZWQgPCBGSVZFX01JTlVURVMpIHtcbiAgICAgIHJldHVybiBudWxsIC8vIOacquWIsOmZjemHh+agt+aXtumXtFxuICAgIH1cblxuICAgIC8vIOeUn+aIkOiEseaVj+eJueW+gVxuICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMuaHJCdWZmZXJcbiAgICBjb25zdCBmZWF0dXJlID0ge1xuICAgICAgdHlwZTogQU5PTl9UWVBFLkhSX0ZFQVRVUkUsXG4gICAgICBob3VyQnVja2V0OiBob3VyQnVja2V0LFxuICAgICAgYXZnVmFsdWU6IE1hdGgucm91bmQodGhpcy5fY2FsY01lYW4odmFsdWVzKSksXG4gICAgICBtaW5WYWx1ZTogTWF0aC5taW4oLi4udmFsdWVzKSxcbiAgICAgIG1heFZhbHVlOiBNYXRoLm1heCguLi52YWx1ZXMpLFxuICAgICAgem9uZTogdGhpcy5fY2xhc3NpZnlIUlpvbmUodGhpcy5fY2FsY01lYW4odmFsdWVzKSksXG4gICAgICBzYW1wbGVDb3VudDogdmFsdWVzLmxlbmd0aCxcbiAgICAgIC8vIOS4jeS/neeVmeeyvuehruaXtumXtOaIs1xuICAgICAgLy8g5LiN5L+d55WZ5q+P5Liq57K+56Gu5pWw5YC8XG4gICAgfVxuXG4gICAgLy8g6YeN572u57yT5Yay5Yy6XG4gICAgdGhpcy5ockJ1ZmZlciA9IFtdXG4gICAgdGhpcy5ockJ1ZmZlclN0YXJ0VGltZSA9IG5vd1xuXG4gICAgcmV0dXJuIGZlYXR1cmVcbiAgfVxuXG4gIC8qKlxuICAgKiDohLHmlY/liqDpgJ/luqbmlbDmja7vvIjnlKjkuo7kvZPmgIHliIbmnpDvvIlcbiAgICogQHBhcmFtIHtBcnJheX0gc2FtcGxlcyAtIFt7IHgsIHksIHogfV0g5pyA6L+RMuenkueahOaVsOaNrlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSDohLHmlY/lkI7nmoTnibnlvoHlkJHph49cbiAgICovXG4gIGFub255bWl6ZUFjY2VsZXJhdGlvbihzYW1wbGVzKSB7XG4gICAgaWYgKCFzYW1wbGVzIHx8IHNhbXBsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cblxuICAgIGNvbnN0IG4gPSBzYW1wbGVzLmxlbmd0aFxuXG4gICAgLy8g6K6h566X5ZCE6L205Z2H5YC8XG4gICAgY29uc3QgYXZnWCA9IHRoaXMuX2NhbGNBeGlzTWVhbihzYW1wbGVzLCAneCcpXG4gICAgY29uc3QgYXZnWSA9IHRoaXMuX2NhbGNBeGlzTWVhbihzYW1wbGVzLCAneScpXG4gICAgY29uc3QgYXZnWiA9IHRoaXMuX2NhbGNBeGlzTWVhbihzYW1wbGVzLCAneicpXG5cbiAgICAvLyDorqHnrpflkITovbTmlrnlt65cbiAgICBjb25zdCB2YXJYID0gdGhpcy5fY2FsY0F4aXNWYXJpYW5jZShzYW1wbGVzLCAneCcpXG4gICAgY29uc3QgdmFyWSA9IHRoaXMuX2NhbGNBeGlzVmFyaWFuY2Uoc2FtcGxlcywgJ3knKVxuICAgIGNvbnN0IHZhclogPSB0aGlzLl9jYWxjQXhpc1ZhcmlhbmNlKHNhbXBsZXMsICd6JylcblxuICAgIC8vIOehruWumuS4u+i9tOaWueWQke+8iOmHjeWKm+aWueWQke+8iVxuICAgIGNvbnN0IGRvbWluYW50QXhpcyA9IHRoaXMuX2dldERvbWluYW50QXhpcyhhdmdYLCBhdmdZLCBhdmdaKVxuXG4gICAgLy8g6K6h566X5oC75pa55beu77yI55So5LqO5Yik5pat6Z2Z5q2iL+i/kOWKqO+8iVxuICAgIGNvbnN0IHRvdGFsVmFyaWFuY2UgPSB2YXJYICsgdmFyWSArIHZhclpcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBBTk9OX1RZUEUuQUNDRUxfRkVBVFVSRSxcbiAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgIGF2Z1g6IGF2Z1gudG9GaXhlZCgzKSxcbiAgICAgIGF2Z1k6IGF2Z1kudG9GaXhlZCgzKSxcbiAgICAgIGF2Z1o6IGF2Z1oudG9GaXhlZCgzKSxcbiAgICAgIHZhclg6IHZhclgudG9GaXhlZCg0KSxcbiAgICAgIHZhclk6IHZhclkudG9GaXhlZCg0KSxcbiAgICAgIHZhclo6IHZhcloudG9GaXhlZCg0KSxcbiAgICAgIGRvbWluYW50QXhpczogZG9taW5hbnRBeGlzLFxuICAgICAgaXNTdGF0aW9uYXJ5OiB0b3RhbFZhcmlhbmNlIDwgMC4wMSxcbiAgICAgIHNhbXBsZUNvdW50OiBuLFxuICAgICAgLy8g5LiN5L+d55WZ5Y6f5aeL5Z2Q5qCH5bqP5YiXXG4gICAgICAvLyDkuI3kv53nlZnnsr7noa7ph4fmoLfml7bpl7RcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICog6ISx5pWP5L2T5oCB5qOA5rWL57uT5p6cXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwb3N0dXJlUmVzdWx0IC0g5L2T5oCB5qOA5rWL5Zmo6L6T5Ye6XG4gICAqIEByZXR1cm5zIHtPYmplY3R9IOiEseaVj+WQjueahOS9k+aAgeiusOW9lVxuICAgKi9cbiAgYW5vbnltaXplUG9zdHVyZVJlc3VsdChwb3N0dXJlUmVzdWx0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IEFOT05fVFlQRS5QT1NUVVJFX0ZFQVRVUkUsXG4gICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICBwb3N0dXJlVHlwZTogcG9zdHVyZVJlc3VsdC50eXBlLFxuICAgICAgY29uZmlkZW5jZTogcG9zdHVyZVJlc3VsdC5jb25maWRlbmNlLFxuICAgICAgLy8g5LiN5L+d55WZ6K+m57uG5qOA5rWL5Y+C5pWwXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOiEseaVj+atpeaVsOaVsOaNrlxuICAgKiBAcGFyYW0ge09iamVjdH0gcmF3RGF0YSAtIHsgdGltZVN0YW1wOiBudW1iZXIsIHZhbHVlOiBudW1iZXIgfVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fG51bGx9IOiEseaVj+WQjueahOeJueW+gVxuICAgKi9cbiAgYW5vbnltaXplU3RlcChyYXdEYXRhKSB7XG4gICAgY29uc3QgaG91ciA9IG5ldyBEYXRlKHJhd0RhdGEudGltZVN0YW1wKS5nZXRIb3VycygpXG4gICAgY29uc3QgaG91ckJ1Y2tldCA9IE1hdGguZmxvb3IocmF3RGF0YS50aW1lU3RhbXAgLyAzNjAwMDAwKVxuXG4gICAgaWYgKHRoaXMuc3RlcEJ1ZmZlckhvdXIgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuc3RlcEJ1ZmZlckhvdXIgPSBob3VyQnVja2V0XG4gICAgfVxuXG4gICAgLy8g5qOA5p+l5piv5ZCm5Zyo5ZCM5LiA5bCP5pe2XG4gICAgaWYgKGhvdXJCdWNrZXQgIT09IHRoaXMuc3RlcEJ1ZmZlckhvdXIpIHtcbiAgICAgIC8vIOeUn+aIkOS4iuS4gOWwj+aXtueahOiEseaVj+eJueW+gVxuICAgICAgY29uc3QgZmVhdHVyZSA9IHtcbiAgICAgICAgdHlwZTogQU5PTl9UWVBFLlNURVBfRkVBVFVSRSxcbiAgICAgICAgaG91ckJ1Y2tldDogdGhpcy5zdGVwQnVmZmVySG91cixcbiAgICAgICAgdG90YWxTdGVwczogdGhpcy5zdGVwQnVmZmVyLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApLFxuICAgICAgICBzYW1wbGVDb3VudDogdGhpcy5zdGVwQnVmZmVyLmxlbmd0aCxcbiAgICAgIH1cbiAgICAgIC8vIOmHjee9rue8k+WGsuWMulxuICAgICAgdGhpcy5zdGVwQnVmZmVyID0gW3Jhd0RhdGEudmFsdWVdXG4gICAgICB0aGlzLnN0ZXBCdWZmZXJIb3VyID0gaG91ckJ1Y2tldFxuICAgICAgcmV0dXJuIGZlYXR1cmVcbiAgICB9XG5cbiAgICB0aGlzLnN0ZXBCdWZmZXIucHVzaChyYXdEYXRhLnZhbHVlKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICAvKipcbiAgICog6ISx5pWP5Y6L5Yqb5pWw5o2uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSByYXdEYXRhIC0geyB0aW1lU3RhbXA6IG51bWJlciwgdmFsdWU6IG51bWJlciB9XG4gICAqIEByZXR1cm5zIHtPYmplY3R8bnVsbH0g6ISx5pWP5ZCO55qE54m55b6BXG4gICAqL1xuICBhbm9ueW1pemVTdHJlc3MocmF3RGF0YSkge1xuICAgIGNvbnN0IG5vdyA9IHJhd0RhdGEudGltZVN0YW1wXG5cbiAgICBpZiAodGhpcy5zdHJlc3NCdWZmZXJTdGFydFRpbWUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuc3RyZXNzQnVmZmVyU3RhcnRUaW1lID0gbm93XG4gICAgfVxuXG4gICAgY29uc3QgZWxhcHNlZCA9IG5vdyAtIHRoaXMuc3RyZXNzQnVmZmVyU3RhcnRUaW1lXG4gICAgY29uc3QgVEVOX01JTlVURVMgPSAxMCAqIDYwICogMTAwMFxuXG4gICAgdGhpcy5zdHJlc3NCdWZmZXIucHVzaChyYXdEYXRhLnZhbHVlKVxuXG4gICAgaWYgKGVsYXBzZWQgPCBURU5fTUlOVVRFUykge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZXMgPSB0aGlzLnN0cmVzc0J1ZmZlclxuICAgIGNvbnN0IGZlYXR1cmUgPSB7XG4gICAgICB0eXBlOiBBTk9OX1RZUEUuU1RSRVNTX0ZFQVRVUkUsXG4gICAgICBob3VyQnVja2V0OiBNYXRoLmZsb29yKHRoaXMuc3RyZXNzQnVmZmVyU3RhcnRUaW1lIC8gMzYwMDAwMCksXG4gICAgICBhdmdWYWx1ZTogTWF0aC5yb3VuZCh0aGlzLl9jYWxjTWVhbih2YWx1ZXMpKSxcbiAgICAgIG1heFZhbHVlOiBNYXRoLm1heCguLi52YWx1ZXMpLFxuICAgICAgc2FtcGxlQ291bnQ6IHZhbHVlcy5sZW5ndGgsXG4gICAgfVxuXG4gICAgdGhpcy5zdHJlc3NCdWZmZXIgPSBbXVxuICAgIHRoaXMuc3RyZXNzQnVmZmVyU3RhcnRUaW1lID0gbm93XG5cbiAgICByZXR1cm4gZmVhdHVyZVxuICB9XG5cbiAgLyoqXG4gICAqIOW/g+eOh+WMuumXtOWIhuexu1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NsYXNzaWZ5SFJab25lKHZhbHVlKSB7XG4gICAgZm9yIChjb25zdCBba2V5LCB6b25lXSBvZiBPYmplY3QuZW50cmllcyhIUl9aT05FKSkge1xuICAgICAgaWYgKHZhbHVlID49IHpvbmUubWluICYmIHZhbHVlIDwgem9uZS5tYXgpIHtcbiAgICAgICAgcmV0dXJuIHpvbmUubGFiZWxcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICfmnKrnn6UnXG4gIH1cblxuICAvKipcbiAgICog6K6h566X5Z2H5YC8XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2FsY01lYW4oYXJyKSB7XG4gICAgaWYgKGFyci5sZW5ndGggPT09IDApIHJldHVybiAwXG4gICAgcmV0dXJuIGFyci5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKSAvIGFyci5sZW5ndGhcbiAgfVxuXG4gIC8qKlxuICAgKiDorqHnrpfmjIflrprovbTlnYflgLxcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9jYWxjQXhpc01lYW4oc2FtcGxlcywgYXhpcykge1xuICAgIGNvbnN0IG4gPSBzYW1wbGVzLmxlbmd0aFxuICAgIGlmIChuID09PSAwKSByZXR1cm4gMFxuICAgIGxldCBzdW0gPSAwXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIHN1bSArPSBzYW1wbGVzW2ldW2F4aXNdXG4gICAgfVxuICAgIHJldHVybiBzdW0gLyBuXG4gIH1cblxuICAvKipcbiAgICog6K6h566X5oyH5a6a6L205pa55beuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2FsY0F4aXNWYXJpYW5jZShzYW1wbGVzLCBheGlzKSB7XG4gICAgY29uc3QgbiA9IHNhbXBsZXMubGVuZ3RoXG4gICAgaWYgKG4gPCAyKSByZXR1cm4gMFxuICAgIGNvbnN0IG1lYW4gPSB0aGlzLl9jYWxjQXhpc01lYW4oc2FtcGxlcywgYXhpcylcbiAgICBsZXQgdmFyaWFuY2UgPSAwXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpZmYgPSBzYW1wbGVzW2ldW2F4aXNdIC0gbWVhblxuICAgICAgdmFyaWFuY2UgKz0gZGlmZiAqIGRpZmZcbiAgICB9XG4gICAgcmV0dXJuIHZhcmlhbmNlIC8gblxuICB9XG5cbiAgLyoqXG4gICAqIOiOt+WPluS4u+i9tOaWueWQke+8iOmHjeWKm+aWueWQke+8iVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2dldERvbWluYW50QXhpcyhhdmdYLCBhdmdZLCBhdmdaKSB7XG4gICAgY29uc3QgYWJzWCA9IE1hdGguYWJzKGF2Z1gpXG4gICAgY29uc3QgYWJzWSA9IE1hdGguYWJzKGF2Z1kpXG4gICAgY29uc3QgYWJzWiA9IE1hdGguYWJzKGF2Z1opXG4gICAgaWYgKGFic1ggPj0gYWJzWSAmJiBhYnNYID49IGFic1opIHJldHVybiAneCdcbiAgICBpZiAoYWJzWSA+PSBhYnNYICYmIGFic1kgPj0gYWJzWikgcmV0dXJuICd5J1xuICAgIHJldHVybiAneidcbiAgfVxufVxuXG5leHBvcnQgeyBBTk9OX1RZUEUsIEhSX1pPTkUgfVxuZXhwb3J0IGRlZmF1bHQgQW5vbnltaXplclxuIiwiLyoqXG4gKiBjcnlwdG8tc3RvcmUuanMgLSDovbvph4/ljJZBRVPliIbnuqfliqDlr4bmnKzlnLDlrZjlgqhcbiAqXG4gKiDkuInnuqfmlbDmja7lronlhajnrZbnlaXvvJpcbiAqIC0gTDEt5pmu6YCa77ya5L2T5oCB57uf6K6h6K6h5pWw77yM5piO5paH5a2Y5YKoXG4gKiAtIEwyLeaVj+aEn++8muS9k+aAgeW8guW4uOiusOW9le+8jEFFUy1FQ0LliqDlr4ZcbiAqIC0gTDMt6ZqQ56eB77ya5b+D546HL+WOi+WKm+WOn+Wni+aVsOaNru+8jEFFUy1DQkPliqDlr4ZcbiAqXG4gKiDln7rkuo4gQHN5c3RlbS5jcnlwdG8g5ZKMIEBzeXN0ZW0uc3RvcmFnZSDlrp7njrBcbiAqL1xuXG5pbXBvcnQgY3J5cHRvIGZyb20gJ0BzeXN0ZW0uY3J5cHRvJ1xuaW1wb3J0IHN0b3JhZ2UgZnJvbSAnQHN5c3RlbS5zdG9yYWdlJ1xuXG4vLyDliqDlr4bnuqfliKvluLjph49cbmNvbnN0IENSWVBUT19MRVZFTCA9IHtcbiAgTDE6ICdMMScsICAvLyDmma7pgJrvvIjmmI7mlofvvIlcbiAgTDI6ICdMMicsICAvLyDmlY/mhJ/vvIhBRVMtRUNC77yJXG4gIEwzOiAnTDMnLCAgLy8g6ZqQ56eB77yIQUVTLUNCQ++8iVxufVxuXG4vLyDlr4bpkqXphY3nva7vvIjlrp7pmYXlupTku47orr7lpIflronlhajlrZjlgqjmtL7nlJ/vvIlcbmNvbnN0IEtFWVMgPSB7XG4gIEwyOiAncG9zdHVyZV9ndWFyZF9sMl9rZXlfMTYnLCAgLy8gMTblrZfoioJBRVMtMTI45a+G6ZKlXG4gIEwzOiAncG9zdHVyZV9ndWFyZF9sM19rZXlfMTYnLCAgLy8gMTblrZfoioJBRVMtMTI45a+G6ZKlXG59XG5cbmNsYXNzIENyeXB0b1N0b3JlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8g5Yqg5a+G57uf6K6hXG4gICAgdGhpcy5zdGF0cyA9IHtcbiAgICAgIGVuY3J5cHRDb3VudDogMCxcbiAgICAgIGRlY3J5cHRDb3VudDogMCxcbiAgICAgIGVycm9yQ291bnQ6IDAsXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIOWtmOWCqOaVsOaNru+8iOiHquWKqOWIhue6p+WKoOWvhu+8iVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGV2ZWwgLSDliqDlr4bnuqfliKsgJ0wxJ3wnTDInfCdMMydcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIOWtmOWCqOmUruWQjVxuICAgKiBAcGFyYW0geyp9IHZhbHVlIC0g5a2Y5YKo5YC877yI5a+56LGh5oiW5Y6f5aeL57G75Z6L77yJXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHN1Y2Nlc3MgLSDmiJDlip/lm57osINcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZmFpbCAtIOWksei0peWbnuiwg1xuICAgKi9cbiAgc2F2ZShsZXZlbCwga2V5LCB2YWx1ZSwgc3VjY2VzcywgZmFpbCkge1xuICAgIGNvbnN0IHBsYWluID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpXG5cbiAgICBpZiAobGV2ZWwgPT09IENSWVBUT19MRVZFTC5MMSkge1xuICAgICAgLy8gTDHvvJrmmI7mloflrZjlgqhcbiAgICAgIHN0b3JhZ2Uuc2V0KHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIHZhbHVlOiBwbGFpbixcbiAgICAgICAgc3VjY2VzczogKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ3J5cHRvU3RvcmVdIEwxIHNhdmU6ICR7a2V5fWApXG4gICAgICAgICAgaWYgKHN1Y2Nlc3MpIHN1Y2Nlc3MoKVxuICAgICAgICB9LFxuICAgICAgICBmYWlsOiAoZGF0YSwgY29kZSkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtDcnlwdG9TdG9yZV0gTDEgc2F2ZSBmYWlsOiAke2NvZGV9YClcbiAgICAgICAgICB0aGlzLnN0YXRzLmVycm9yQ291bnQrK1xuICAgICAgICAgIGlmIChmYWlsKSBmYWlsKGRhdGEsIGNvZGUpXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gTDIvTDPvvJpBRVPliqDlr4blkI7lrZjlgqhcbiAgICBjb25zdCBlbmNLZXkgPSBjcnlwdG8uYnRvYShLRVlTW2xldmVsXSlcblxuICAgIGNyeXB0by5lbmNyeXB0KHtcbiAgICAgIGRhdGE6IHBsYWluLFxuICAgICAga2V5OiBlbmNLZXksXG4gICAgICBhbGdvOiAnQUVTJyxcbiAgICAgIHN1Y2Nlc3M6IChyZXMpID0+IHtcbiAgICAgICAgdGhpcy5zdGF0cy5lbmNyeXB0Q291bnQrK1xuICAgICAgICBzdG9yYWdlLnNldCh7XG4gICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgdmFsdWU6IHJlcy5kYXRhLFxuICAgICAgICAgIHN1Y2Nlc3M6ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbQ3J5cHRvU3RvcmVdICR7bGV2ZWx9IHNhdmU6ICR7a2V5fWApXG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2VzcygpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWlsOiAoZGF0YSwgY29kZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0NyeXB0b1N0b3JlXSAke2xldmVsfSBzdG9yYWdlIGZhaWw6ICR7Y29kZX1gKVxuICAgICAgICAgICAgdGhpcy5zdGF0cy5lcnJvckNvdW50KytcbiAgICAgICAgICAgIGlmIChmYWlsKSBmYWlsKGRhdGEsIGNvZGUpXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIH0sXG4gICAgICBmYWlsOiAoZGF0YSwgY29kZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbQ3J5cHRvU3RvcmVdICR7bGV2ZWx9IGVuY3J5cHQgZmFpbDogJHtjb2RlfWApXG4gICAgICAgIHRoaXMuc3RhdHMuZXJyb3JDb3VudCsrXG4gICAgICAgIGlmIChmYWlsKSBmYWlsKGRhdGEsIGNvZGUpXG4gICAgICB9LFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICog6K+75Y+W5pWw5o2u77yI6Ieq5Yqo6Kej5a+G77yJXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsZXZlbCAtIOWKoOWvhue6p+WIq1xuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0g5a2Y5YKo6ZSu5ZCNXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCDICh2YWx1ZSkgPT4ge31cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZmFpbCAtIOWksei0peWbnuiwg1xuICAgKi9cbiAgbG9hZChsZXZlbCwga2V5LCBjYWxsYmFjaywgZmFpbCkge1xuICAgIHN0b3JhZ2UuZ2V0KHtcbiAgICAgIGtleToga2V5LFxuICAgICAgc3VjY2VzczogKGVuY3J5cHRlZCkgPT4ge1xuICAgICAgICBpZiAobGV2ZWwgPT09IENSWVBUT19MRVZFTC5MMSkge1xuICAgICAgICAgIC8vIEwx77ya5piO5paH55u05o6l6Kej5p6QXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKEpTT04ucGFyc2UoZW5jcnlwdGVkKSlcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlbmNyeXB0ZWQpXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTDIvTDPvvJpBRVPop6Plr4ZcbiAgICAgICAgY29uc3QgZW5jS2V5ID0gY3J5cHRvLmJ0b2EoS0VZU1tsZXZlbF0pXG5cbiAgICAgICAgY3J5cHRvLmRlY3J5cHQoe1xuICAgICAgICAgIGRhdGE6IGVuY3J5cHRlZCxcbiAgICAgICAgICBrZXk6IGVuY0tleSxcbiAgICAgICAgICBhbGdvOiAnQUVTJyxcbiAgICAgICAgICBzdWNjZXNzOiAocmVzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRzLmRlY3J5cHRDb3VudCsrXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhKU09OLnBhcnNlKHJlcy5kYXRhKSlcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2socmVzLmRhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWlsOiAoZGF0YSwgY29kZSkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW0NyeXB0b1N0b3JlXSAke2xldmVsfSBkZWNyeXB0IGZhaWw6ICR7Y29kZX1gKVxuICAgICAgICAgICAgdGhpcy5zdGF0cy5lcnJvckNvdW50KytcbiAgICAgICAgICAgIGlmIChmYWlsKSBmYWlsKGRhdGEsIGNvZGUpXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgIH0sXG4gICAgICBmYWlsOiAoZGF0YSwgY29kZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbQ3J5cHRvU3RvcmVdICR7bGV2ZWx9IGxvYWQgZmFpbDogJHtjb2RlfWApXG4gICAgICAgIHRoaXMuc3RhdHMuZXJyb3JDb3VudCsrXG4gICAgICAgIGlmIChmYWlsKSBmYWlsKGRhdGEsIGNvZGUpXG4gICAgICB9LFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICog5Yig6Zmk5pWw5o2uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSDlrZjlgqjplK7lkI1cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gc3VjY2VzcyAtIOaIkOWKn+Wbnuiwg1xuICAgKi9cbiAgcmVtb3ZlKGtleSwgc3VjY2Vzcykge1xuICAgIHN0b3JhZ2UuZGVsZXRlKHtcbiAgICAgIGtleToga2V5LFxuICAgICAgc3VjY2VzczogKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0NyeXB0b1N0b3JlXSBkZWxldGU6ICR7a2V5fWApXG4gICAgICAgIGlmIChzdWNjZXNzKSBzdWNjZXNzKClcbiAgICAgIH0sXG4gICAgICBmYWlsOiAoZGF0YSwgY29kZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbQ3J5cHRvU3RvcmVdIGRlbGV0ZSBmYWlsOiAke2NvZGV9YClcbiAgICAgICAgdGhpcy5zdGF0cy5lcnJvckNvdW50KytcbiAgICAgIH0sXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiDmibnph4/liKDpmaTvvIjmjInliY3nvIDljLnphY3vvIlcbiAgICog5rOo5oSP77yac3RvcmFnZSBBUEkg5LiN5pSv5oyB6YGN5Y6G77yM6ZyA6KaB5aSW6YOo57u05oqk6ZSu5ZCN5YiX6KGoXG4gICAqIEBwYXJhbSB7QXJyYXl9IGtleXMgLSDplK7lkI3mlbDnu4RcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlrozmiJDlm57osINcbiAgICovXG4gIGJhdGNoUmVtb3ZlKGtleXMsIGNhbGxiYWNrKSB7XG4gICAgbGV0IHJlbWFpbmluZyA9IGtleXMubGVuZ3RoXG4gICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgc3RvcmFnZS5kZWxldGUoe1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgc3VjY2VzczogKCkgPT4ge1xuICAgICAgICAgIHJlbWFpbmluZy0tXG4gICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCAmJiBjYWxsYmFjaykgY2FsbGJhY2soKVxuICAgICAgICB9LFxuICAgICAgICBmYWlsOiAoKSA9PiB7XG4gICAgICAgICAgcmVtYWluaW5nLS1cbiAgICAgICAgICBpZiAocmVtYWluaW5nID09PSAwICYmIGNhbGxiYWNrKSBjYWxsYmFjaygpXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICog5riF56m65omA5pyJ5pWw5o2uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHN1Y2Nlc3MgLSDmiJDlip/lm57osINcbiAgICovXG4gIGNsZWFyQWxsKHN1Y2Nlc3MpIHtcbiAgICBzdG9yYWdlLmNsZWFyKHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tDcnlwdG9TdG9yZV0gY2xlYXJBbGwnKVxuICAgICAgICB0aGlzLnN0YXRzID0geyBlbmNyeXB0Q291bnQ6IDAsIGRlY3J5cHRDb3VudDogMCwgZXJyb3JDb3VudDogMCB9XG4gICAgICAgIGlmIChzdWNjZXNzKSBzdWNjZXNzKClcbiAgICAgIH0sXG4gICAgICBmYWlsOiAoZGF0YSwgY29kZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbQ3J5cHRvU3RvcmVdIGNsZWFyQWxsIGZhaWw6ICR7Y29kZX1gKVxuICAgICAgfSxcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIOiOt+WPluWKoOWvhue7n+iuoeS/oeaBr1xuICAgKi9cbiAgZ2V0U3RhdHMoKSB7XG4gICAgcmV0dXJuIHsgLi4udGhpcy5zdGF0cyB9XG4gIH1cbn1cblxuZXhwb3J0IHsgQ1JZUFRPX0xFVkVMIH1cbmV4cG9ydCBkZWZhdWx0IENyeXB0b1N0b3JlXG4iLCIvKipcbiAqIGRhdGEtbWFuYWdlci5qcyAtIOaVsOaNrueUn+WRveWRqOacn+euoeeQhlxuICpcbiAqIOeuoeeQhuaJgOacieacrOWcsOaVsOaNrueahOWtmOWCqOOAgeafpeivouOAgei/h+acn+a4heeQhu+8mlxuICogLSDkvZPmgIHnu5/orqHmlbDmja7vvIhMMe+8iVxuICogLSDkvZPmgIHlvILluLjorrDlvZXvvIhMMuWKoOWvhu+8iVxuICogLSDlv4Pnjocv5Y6L5Yqb5Y6f5aeL5pWw5o2u77yITDPliqDlr4bvvIlcbiAqIC0g5pWw5o2u6L+H5pyf6Ieq5Yqo6ZSA5q+BXG4gKiAtIOS4gOmUrua4hemZpOmakOengeaVsOaNrlxuICovXG5cbmltcG9ydCBDcnlwdG9TdG9yZSwgeyBDUllQVE9fTEVWRUwgfSBmcm9tICcuL2NyeXB0by1zdG9yZSdcblxuLy8g5pWw5o2u57G75Z6L5bi46YePXG5jb25zdCBEQVRBX1RZUEUgPSB7XG4gIFBPU1RVUkVfREFJTFk6ICdwb3N0dXJlX2RhaWx5JywgICAgICAgICAvLyDmr4/ml6XkvZPmgIHnu5/orqFcbiAgUE9TVFVSRV9BTEVSVDogJ3Bvc3R1cmVfYWxlcnQnLCAgICAgICAgIC8vIOS9k+aAgeW8guW4uOiusOW9lVxuICBIUl9GRUFUVVJFOiAnaHJfZmVhdHVyZScsICAgICAgICAgICAgICAgLy8g5b+D546H6ISx5pWP54m55b6BXG4gIFNUUkVTU19GRUFUVVJFOiAnc3RyZXNzX2ZlYXR1cmUnLCAgICAgICAvLyDljovlipvohLHmlY/nibnlvoFcbiAgU0VUVElOR1M6ICdzZXR0aW5ncycsICAgICAgICAgICAgICAgICAgIC8vIOW6lOeUqOiuvue9rlxufVxuXG4vLyDmlbDmja7ov4fmnJ/ml7bpl7TphY3nva7vvIjmr6vnp5LvvIlcbmNvbnN0IEVYUElSWSA9IHtcbiAgW0RBVEFfVFlQRS5QT1NUVVJFX0RBSUxZXTogNyAqIDI0ICogMzYwMCAqIDEwMDAsICAgIC8vIDflpKlcbiAgW0RBVEFfVFlQRS5QT1NUVVJFX0FMRVJUXTogMzAgKiAyNCAqIDM2MDAgKiAxMDAwLCAgIC8vIDMw5aSpXG4gIFtEQVRBX1RZUEUuSFJfRkVBVFVSRV06IDMwICogMjQgKiAzNjAwICogMTAwMCwgICAgICAvLyAzMOWkqVxuICBbREFUQV9UWVBFLlNUUkVTU19GRUFUVVJFXTogMzAgKiAyNCAqIDM2MDAgKiAxMDAwLCAgLy8gMzDlpKlcbn1cblxuLy8g5pWw5o2u5Yqg5a+G57qn5Yir5pig5bCEXG5jb25zdCBMRVZFTF9NQVAgPSB7XG4gIFtEQVRBX1RZUEUuUE9TVFVSRV9EQUlMWV06IENSWVBUT19MRVZFTC5MMSxcbiAgW0RBVEFfVFlQRS5QT1NUVVJFX0FMRVJUXTogQ1JZUFRPX0xFVkVMLkwyLFxuICBbREFUQV9UWVBFLkhSX0ZFQVRVUkVdOiBDUllQVE9fTEVWRUwuTDMsXG4gIFtEQVRBX1RZUEUuU1RSRVNTX0ZFQVRVUkVdOiBDUllQVE9fTEVWRUwuTDMsXG4gIFtEQVRBX1RZUEUuU0VUVElOR1NdOiBDUllQVE9fTEVWRUwuTDEsXG59XG5cbmNsYXNzIERhdGFNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5jcnlwdG9TdG9yZSA9IG5ldyBDcnlwdG9TdG9yZSgpXG4gICAgLy8g6ZSu5ZCN5rOo5YaM6KGo77yI55So5LqO6YGN5Y6G5riF55CG77yJXG4gICAgdGhpcy5rZXlSZWdpc3RyeSA9IFtdXG4gIH1cblxuICAvKipcbiAgICog55Sf5oiQ5a2Y5YKo6ZSu5ZCNXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbWFrZUtleSh0eXBlLCBkYXRlKSB7XG4gICAgY29uc3QgZGF0ZVN0ciA9IGRhdGUgfHwgdGhpcy5fZ2V0RGF0ZVN0cigpXG4gICAgcmV0dXJuIGBwZ18ke3R5cGV9XyR7ZGF0ZVN0cn1gXG4gIH1cblxuICAvKipcbiAgICog6I635Y+W5pel5pyf5a2X56ym5LiyIFlZWVktTU0tRERcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9nZXREYXRlU3RyKHRzKSB7XG4gICAgY29uc3QgZCA9IHRzID8gbmV3IERhdGUodHMpIDogbmV3IERhdGUoKVxuICAgIHJldHVybiBgJHtkLmdldEZ1bGxZZWFyKCl9LSR7U3RyaW5nKGQuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsICcwJyl9LSR7U3RyaW5nKGQuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCAnMCcpfWBcbiAgfVxuXG4gIC8qKlxuICAgKiDkv53lrZjkvZPmgIHnu5/orqHmlbDmja5cbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRzIC0geyBzZWRlbnRhcnlDb3VudCwgaGVhZFRpbHRDb3VudCwgbGVnQ3Jvc3NDb3VudCwgdG90YWxBbGVydHMgfVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWujOaIkOWbnuiwg1xuICAgKi9cbiAgc2F2ZVBvc3R1cmVTdGF0cyhzdGF0cywgY2FsbGJhY2spIHtcbiAgICBjb25zdCBrZXkgPSB0aGlzLl9tYWtlS2V5KERBVEFfVFlQRS5QT1NUVVJFX0RBSUxZKVxuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAuLi5zdGF0cyxcbiAgICAgIGRhdGU6IHRoaXMuX2dldERhdGVTdHIoKSxcbiAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICB9XG5cbiAgICB0aGlzLl9yZWdpc3RlcktleShrZXkpXG4gICAgdGhpcy5jcnlwdG9TdG9yZS5zYXZlKFxuICAgICAgTEVWRUxfTUFQW0RBVEFfVFlQRS5QT1NUVVJFX0RBSUxZXSxcbiAgICAgIGtleSxcbiAgICAgIGRhdGEsXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbRGF0YU1hbmFnZXJdIHNhdmUgcG9zdHVyZSBzdGF0czogJHtrZXl9YClcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayh0cnVlKVxuICAgICAgfSxcbiAgICAgICgpID0+IHtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhmYWxzZSlcbiAgICAgIH1cbiAgICApXG4gIH1cblxuICAvKipcbiAgICog5L+d5a2Y5L2T5oCB5byC5bi46K6w5b2VXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBhbGVydCAtIHsgdHlwZSwgY29uZmlkZW5jZSwgZGV0YWlsLCB0aW1lc3RhbXAgfVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWujOaIkOWbnuiwg1xuICAgKi9cbiAgc2F2ZVBvc3R1cmVBbGVydChhbGVydCwgY2FsbGJhY2spIHtcbiAgICBjb25zdCB0b2RheSA9IHRoaXMuX2dldERhdGVTdHIoKVxuICAgIGNvbnN0IGtleSA9IHRoaXMuX21ha2VLZXkoREFUQV9UWVBFLlBPU1RVUkVfQUxFUlQpICsgJ18nICsgRGF0ZS5ub3coKVxuXG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgIC4uLmFsZXJ0LFxuICAgICAgZGF0ZTogdG9kYXksXG4gICAgICB0aW1lc3RhbXA6IGFsZXJ0LnRpbWVzdGFtcCB8fCBEYXRlLm5vdygpLFxuICAgIH1cblxuICAgIHRoaXMuX3JlZ2lzdGVyS2V5KGtleSlcbiAgICB0aGlzLmNyeXB0b1N0b3JlLnNhdmUoXG4gICAgICBMRVZFTF9NQVBbREFUQV9UWVBFLlBPU1RVUkVfQUxFUlRdLFxuICAgICAga2V5LFxuICAgICAgZGF0YSxcbiAgICAgICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYFtEYXRhTWFuYWdlcl0gc2F2ZSBwb3N0dXJlIGFsZXJ0YClcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayh0cnVlKVxuICAgICAgfSxcbiAgICAgICgpID0+IHtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhmYWxzZSlcbiAgICAgIH1cbiAgICApXG4gIH1cblxuICAvKipcbiAgICog5L+d5a2Y5b+D546H6ISx5pWP54m55b6BXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmZWF0dXJlIC0gYW5vbnltaXplciDovpPlh7rnmoTnibnlvoFcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlrozmiJDlm57osINcbiAgICovXG4gIHNhdmVIUkZlYXR1cmUoZmVhdHVyZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBrZXkgPSB0aGlzLl9tYWtlS2V5KERBVEFfVFlQRS5IUl9GRUFUVVJFKSArICdfJyArIGZlYXR1cmUuaG91ckJ1Y2tldFxuXG4gICAgdGhpcy5fcmVnaXN0ZXJLZXkoa2V5KVxuICAgIHRoaXMuY3J5cHRvU3RvcmUuc2F2ZShcbiAgICAgIExFVkVMX01BUFtEQVRBX1RZUEUuSFJfRkVBVFVSRV0sXG4gICAgICBrZXksXG4gICAgICBmZWF0dXJlLFxuICAgICAgKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgW0RhdGFNYW5hZ2VyXSBzYXZlIEhSIGZlYXR1cmVgKVxuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKHRydWUpXG4gICAgICB9LFxuICAgICAgKCkgPT4ge1xuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiDkv53lrZjljovlipvohLHmlY/nibnlvoFcbiAgICogQHBhcmFtIHtPYmplY3R9IGZlYXR1cmUgLSBhbm9ueW1pemVyIOi+k+WHuueahOeJueW+gVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWujOaIkOWbnuiwg1xuICAgKi9cbiAgc2F2ZVN0cmVzc0ZlYXR1cmUoZmVhdHVyZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBrZXkgPSB0aGlzLl9tYWtlS2V5KERBVEFfVFlQRS5TVFJFU1NfRkVBVFVSRSkgKyAnXycgKyBmZWF0dXJlLmhvdXJCdWNrZXRcblxuICAgIHRoaXMuX3JlZ2lzdGVyS2V5KGtleSlcbiAgICB0aGlzLmNyeXB0b1N0b3JlLnNhdmUoXG4gICAgICBMRVZFTF9NQVBbREFUQV9UWVBFLlNUUkVTU19GRUFUVVJFXSxcbiAgICAgIGtleSxcbiAgICAgIGZlYXR1cmUsXG4gICAgICAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbRGF0YU1hbmFnZXJdIHNhdmUgc3RyZXNzIGZlYXR1cmVgKVxuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKHRydWUpXG4gICAgICB9LFxuICAgICAgKCkgPT4ge1xuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiDliqDovb3ku4rml6XkvZPmgIHnu5/orqFcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSAoZGF0YSkgPT4ge31cbiAgICovXG4gIGxvYWRUb2RheVBvc3R1cmVTdGF0cyhjYWxsYmFjaykge1xuICAgIGNvbnN0IGtleSA9IHRoaXMuX21ha2VLZXkoREFUQV9UWVBFLlBPU1RVUkVfREFJTFkpXG4gICAgdGhpcy5jcnlwdG9TdG9yZS5sb2FkKExFVkVMX01BUFtEQVRBX1RZUEUuUE9TVFVSRV9EQUlMWV0sIGtleSwgY2FsbGJhY2ssICgpID0+IHtcbiAgICAgIGNhbGxiYWNrKG51bGwpXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiDliqDovb3ku4rml6XkvZPmgIHlvILluLjorrDlvZVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSAoYWxlcnRzW10pID0+IHt9XG4gICAqL1xuICBsb2FkVG9kYXlBbGVydHMoY2FsbGJhY2spIHtcbiAgICAvLyDku47ms6jlhozooajkuK3nrZvpgInku4rml6XnmoTlvILluLjorrDlvZXplK5cbiAgICBjb25zdCB0b2RheVByZWZpeCA9IHRoaXMuX21ha2VLZXkoREFUQV9UWVBFLlBPU1RVUkVfQUxFUlQpXG4gICAgY29uc3QgdG9kYXlLZXlzID0gdGhpcy5rZXlSZWdpc3RyeS5maWx0ZXIoKGspID0+IGsuc3RhcnRzV2l0aCh0b2RheVByZWZpeCkpXG5cbiAgICBpZiAodG9kYXlLZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY2FsbGJhY2soW10pXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBhbGVydHMgPSBbXVxuICAgIGxldCByZW1haW5pbmcgPSB0b2RheUtleXMubGVuZ3RoXG5cbiAgICB0b2RheUtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICB0aGlzLmNyeXB0b1N0b3JlLmxvYWQoTEVWRUxfTUFQW0RBVEFfVFlQRS5QT1NUVVJFX0FMRVJUXSwga2V5LCAoZGF0YSkgPT4ge1xuICAgICAgICBpZiAoZGF0YSkgYWxlcnRzLnB1c2goZGF0YSlcbiAgICAgICAgcmVtYWluaW5nLS1cbiAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgIC8vIOaMieaXtumXtOaOkuW6j1xuICAgICAgICAgIGFsZXJ0cy5zb3J0KChhLCBiKSA9PiBhLnRpbWVzdGFtcCAtIGIudGltZXN0YW1wKVxuICAgICAgICAgIGNhbGxiYWNrKGFsZXJ0cylcbiAgICAgICAgfVxuICAgICAgfSwgKCkgPT4ge1xuICAgICAgICByZW1haW5pbmctLVxuICAgICAgICBpZiAocmVtYWluaW5nID09PSAwKSBjYWxsYmFjayhhbGVydHMpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICog5Yqg6L295oyH5a6a5pel5pyf6IyD5Zu055qE5b+D546H54m55b6BXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkYXlzIC0g5Zue5rqv5aSp5pWwXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gKGZlYXR1cmVzW10pID0+IHt9XG4gICAqL1xuICBsb2FkSFJGZWF0dXJlcyhkYXlzLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gW11cbiAgICBsZXQgcmVtYWluaW5nID0gMFxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXlzOyBpKyspIHtcbiAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSgpXG4gICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgLSBpKVxuICAgICAgY29uc3QgZGF0ZVN0ciA9IHRoaXMuX2dldERhdGVTdHIoZGF0ZS5nZXRUaW1lKCkpXG4gICAgICBjb25zdCBwcmVmaXggPSBgcGdfJHtEQVRBX1RZUEUuSFJfRkVBVFVSRX1fJHtkYXRlU3RyfWBcbiAgICAgIGNvbnN0IGtleXMgPSB0aGlzLmtleVJlZ2lzdHJ5LmZpbHRlcigoaykgPT4gay5zdGFydHNXaXRoKHByZWZpeCkpXG4gICAgICByZW1haW5pbmcgKz0ga2V5cy5sZW5ndGhcblxuICAgICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgdGhpcy5jcnlwdG9TdG9yZS5sb2FkKExFVkVMX01BUFtEQVRBX1RZUEUuSFJfRkVBVFVSRV0sIGtleSwgKGRhdGEpID0+IHtcbiAgICAgICAgICBpZiAoZGF0YSkgZmVhdHVyZXMucHVzaChkYXRhKVxuICAgICAgICAgIHJlbWFpbmluZy0tXG4gICAgICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkgY2FsbGJhY2soZmVhdHVyZXMpXG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICByZW1haW5pbmctLVxuICAgICAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIGNhbGxiYWNrKGZlYXR1cmVzKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAocmVtYWluaW5nID09PSAwKSBjYWxsYmFjayhmZWF0dXJlcylcbiAgfVxuXG4gIC8qKlxuICAgKiDkv53lrZjlupTnlKjorr7nva5cbiAgICogQHBhcmFtIHtPYmplY3R9IHNldHRpbmdzXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBzYXZlU2V0dGluZ3Moc2V0dGluZ3MsIGNhbGxiYWNrKSB7XG4gICAgY29uc3Qga2V5ID0gJ3BnX3NldHRpbmdzJ1xuICAgIHRoaXMuX3JlZ2lzdGVyS2V5KGtleSlcbiAgICB0aGlzLmNyeXB0b1N0b3JlLnNhdmUoQ1JZUFRPX0xFVkVMLkwxLCBrZXksIHNldHRpbmdzLCAoKSA9PiB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKHRydWUpXG4gICAgfSwgKCkgPT4ge1xuICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhmYWxzZSlcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIOWKoOi9veW6lOeUqOiuvue9rlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIChzZXR0aW5ncykgPT4ge31cbiAgICovXG4gIGxvYWRTZXR0aW5ncyhjYWxsYmFjaykge1xuICAgIHRoaXMuY3J5cHRvU3RvcmUubG9hZChDUllQVE9fTEVWRUwuTDEsICdwZ19zZXR0aW5ncycsIGNhbGxiYWNrLCAoKSA9PiB7XG4gICAgICBjYWxsYmFjayh7XG4gICAgICAgIHNlZGVudGFyeVRocmVzaG9sZDogMzAgKiA2MCAqIDEwMDAsIC8vIOm7mOiupDMw5YiG6ZKfXG4gICAgICAgIHZpYnJhdGlvbkVuYWJsZWQ6IHRydWUsXG4gICAgICAgIGFsZXJ0RW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiDmuIXnkIbov4fmnJ/mlbDmja5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSAoY2xlYW5lZENvdW50KSA9PiB7fVxuICAgKi9cbiAgY2xlYW5FeHBpcmVkKGNhbGxiYWNrKSB7XG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKVxuICAgIGNvbnN0IGV4cGlyZWRLZXlzID0gW11cblxuICAgIHRoaXMua2V5UmVnaXN0cnkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAvLyDku47plK7lkI3kuK3mj5Dlj5bnsbvlnotcbiAgICAgIGZvciAoY29uc3QgW3R5cGUsIGV4cGlyeU1zXSBvZiBPYmplY3QuZW50cmllcyhFWFBJUlkpKSB7XG4gICAgICAgIGlmIChrZXkuaW5jbHVkZXModHlwZSkpIHtcbiAgICAgICAgICAvLyDlsJ3or5Xku47plK7lkI3kuK3mj5Dlj5bml7bpl7TmiLPmiJbml6XmnJ9cbiAgICAgICAgICBjb25zdCBkYXRlTWF0Y2ggPSBrZXkubWF0Y2goLyhcXGR7NH0tXFxkezJ9LVxcZHsyfSkvKVxuICAgICAgICAgIGlmIChkYXRlTWF0Y2gpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGFEYXRlID0gbmV3IERhdGUoZGF0ZU1hdGNoWzFdKS5nZXRUaW1lKClcbiAgICAgICAgICAgIGlmIChub3cgLSBkYXRhRGF0ZSA+IGV4cGlyeU1zKSB7XG4gICAgICAgICAgICAgIGV4cGlyZWRLZXlzLnB1c2goa2V5KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmIChleHBpcmVkS2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soMClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIC8vIOS7juazqOWGjOihqOS4reenu+mZpOi/h+acn+mUrlxuICAgIHRoaXMua2V5UmVnaXN0cnkgPSB0aGlzLmtleVJlZ2lzdHJ5LmZpbHRlcigoaykgPT4gIWV4cGlyZWRLZXlzLmluY2x1ZGVzKGspKVxuXG4gICAgLy8g5Yig6Zmk6L+H5pyf5pWw5o2uXG4gICAgdGhpcy5jcnlwdG9TdG9yZS5iYXRjaFJlbW92ZShleHBpcmVkS2V5cywgKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYFtEYXRhTWFuYWdlcl0gY2xlYW5lZCAke2V4cGlyZWRLZXlzLmxlbmd0aH0gZXhwaXJlZCBrZXlzYClcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZXhwaXJlZEtleXMubGVuZ3RoKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICog5LiA6ZSu5riF6Zmk5omA5pyJ6ZqQ56eB5pWw5o2u77yI5L+d55WZ6K6+572u77yJXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5a6M5oiQ5Zue6LCDXG4gICAqL1xuICBjbGVhckFsbFByaXZhY3lEYXRhKGNhbGxiYWNrKSB7XG4gICAgY29uc3QgcHJpdmFjeUtleXMgPSB0aGlzLmtleVJlZ2lzdHJ5LmZpbHRlcihcbiAgICAgIChrKSA9PiAhay5pbmNsdWRlcyhEQVRBX1RZUEUuU0VUVElOR1MpXG4gICAgKVxuICAgIHRoaXMua2V5UmVnaXN0cnkgPSB0aGlzLmtleVJlZ2lzdHJ5LmZpbHRlcigoaykgPT4gay5pbmNsdWRlcyhEQVRBX1RZUEUuU0VUVElOR1MpKVxuXG4gICAgdGhpcy5jcnlwdG9TdG9yZS5iYXRjaFJlbW92ZShwcml2YWN5S2V5cywgKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYFtEYXRhTWFuYWdlcl0gY2xlYXJlZCAke3ByaXZhY3lLZXlzLmxlbmd0aH0gcHJpdmFjeSBrZXlzYClcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKVxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICog6I635Y+W5pWw5o2u57uf6K6h5pGY6KaBXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gKHN1bW1hcnkpID0+IHt9XG4gICAqL1xuICBnZXRTdW1tYXJ5KGNhbGxiYWNrKSB7XG4gICAgY29uc3Qgc3VtbWFyeSA9IHtcbiAgICAgIHRvdGFsS2V5czogdGhpcy5rZXlSZWdpc3RyeS5sZW5ndGgsXG4gICAgICBwb3N0dXJlRGFpbHk6IDAsXG4gICAgICBwb3N0dXJlQWxlcnRzOiAwLFxuICAgICAgaHJGZWF0dXJlczogMCxcbiAgICAgIHN0cmVzc0ZlYXR1cmVzOiAwLFxuICAgIH1cblxuICAgIHRoaXMua2V5UmVnaXN0cnkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAoa2V5LmluY2x1ZGVzKERBVEFfVFlQRS5QT1NUVVJFX0RBSUxZKSkgc3VtbWFyeS5wb3N0dXJlRGFpbHkrK1xuICAgICAgZWxzZSBpZiAoa2V5LmluY2x1ZGVzKERBVEFfVFlQRS5QT1NUVVJFX0FMRVJUKSkgc3VtbWFyeS5wb3N0dXJlQWxlcnRzKytcbiAgICAgIGVsc2UgaWYgKGtleS5pbmNsdWRlcyhEQVRBX1RZUEUuSFJfRkVBVFVSRSkpIHN1bW1hcnkuaHJGZWF0dXJlcysrXG4gICAgICBlbHNlIGlmIChrZXkuaW5jbHVkZXMoREFUQV9UWVBFLlNUUkVTU19GRUFUVVJFKSkgc3VtbWFyeS5zdHJlc3NGZWF0dXJlcysrXG4gICAgfSlcblxuICAgIHN1bW1hcnkuY3J5cHRvU3RhdHMgPSB0aGlzLmNyeXB0b1N0b3JlLmdldFN0YXRzKClcbiAgICBjYWxsYmFjayhzdW1tYXJ5KVxuICB9XG5cbiAgLyoqXG4gICAqIOazqOWGjOmUruWQjeWIsOazqOWGjOihqFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlZ2lzdGVyS2V5KGtleSkge1xuICAgIGlmICghdGhpcy5rZXlSZWdpc3RyeS5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICB0aGlzLmtleVJlZ2lzdHJ5LnB1c2goa2V5KVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgeyBEQVRBX1RZUEUsIEVYUElSWSB9XG5leHBvcnQgZGVmYXVsdCBEYXRhTWFuYWdlclxuIiwiLyoqXG4gKiBwb3N0dXJlLWRldGVjdG9yLmpzIC0g56uv5L6nQUnkvZPmgIHor4bliKvnrpfms5VcbiAqXG4gKiDln7rkuo7liqDpgJ/luqborqHkuInovbTmlbDmja7nmoTovbvph4/ljJbml7bluo/liIbmnpDvvJpcbiAqIC0g5LmF5Z2Q5qOA5rWL77ya5Yqg6YCf5bqm5pa55beu5p6B5L2OICsg5oyB57ut5pe26Ze0XG4gKiAtIOS9juWktOWJjeWAvuajgOa1i++8mnrovbTph43lipvliIbph4/lvILluLhcbiAqIC0g6Le35LqM6YOO6IW/5qOA5rWL77yaeOi9tOWBj+enuyArIHnovbTlkajmnJ/mgKflvq7mjK9cbiAqXG4gKiDnrpfms5XnibnngrnvvJpcbiAqIC0g57qv6KeE5YiZ5byV5pOO77yM5peg6ZyA56We57uP572R57uc5o6o55CGXG4gKiAtIOa7keWKqOeql+WPo+e7n+iuoe+8iDLnp5Lnqpflj6PvvIx+MTAw5qC35pys77yJXG4gKiAtIOS9juWKn+iAl++8muS7heWcqOmHh+agt+aXtuiuoeeul1xuICovXG5cbi8vIOS9k+aAgeexu+Wei+W4uOmHj1xuY29uc3QgUE9TVFVSRV9UWVBFID0ge1xuICBOT1JNQUw6ICdub3JtYWwnLFxuICBTRURFTlRBUlk6ICdzZWRlbnRhcnknLCAgICAgICAvLyDkuYXlnZBcbiAgSEVBRF9USUxUOiAnaGVhZF90aWx0JywgICAgICAgLy8g5L2O5aS05YmN5YC+XG4gIExFR19DUk9TUzogJ2xlZ19jcm9zcycsICAgICAgIC8vIOi3t+S6jOmDjuiFv1xufVxuXG4vLyDkvZPmgIHnsbvlnovkuK3mloflkI1cbmNvbnN0IFBPU1RVUkVfTkFNRSA9IHtcbiAgW1BPU1RVUkVfVFlQRS5OT1JNQUxdOiAn5q2j5bi4JyxcbiAgW1BPU1RVUkVfVFlQRS5TRURFTlRBUlldOiAn5LmF5Z2QJyxcbiAgW1BPU1RVUkVfVFlQRS5IRUFEX1RJTFRdOiAn5L2O5aS05YmN5YC+JyxcbiAgW1BPU1RVUkVfVFlQRS5MRUdfQ1JPU1NdOiAn6Le35LqM6YOO6IW/Jyxcbn1cblxuY2xhc3MgUG9zdHVyZURldGVjdG9yIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgLy8g5ruR5Yqo56qX5Y+j5aSn5bCP77yI5qC35pys5pWw77yJXG4gICAgdGhpcy53aW5kb3dTaXplID0gb3B0aW9ucy53aW5kb3dTaXplIHx8IDEwMFxuICAgIC8vIOS5heWdkOaPkOmGkumYiOWAvO+8iOavq+enku+8ie+8jOm7mOiupDMw5YiG6ZKfXG4gICAgdGhpcy5zZWRlbnRhcnlUaHJlc2hvbGQgPSBvcHRpb25zLnNlZGVudGFyeVRocmVzaG9sZCB8fCAzMCAqIDYwICogMTAwMFxuICAgIC8vIOaVsOaNrue8k+WGsuWMulxuICAgIHRoaXMuYnVmZmVyID0gW11cbiAgICAvLyDkuYXlnZDotbflp4vml7bpl7RcbiAgICB0aGlzLnNpdFN0YXJ0VGltZSA9IG51bGxcbiAgICAvLyDku4rml6XkuYXlnZDmgLvml7bplb/vvIjmr6vnp5LvvIlcbiAgICB0aGlzLnRvZGF5U2VkZW50YXJ5TXMgPSAwXG4gICAgLy8g5LiK5qyh5qOA5rWL5pe26Ze0XG4gICAgdGhpcy5sYXN0RGV0ZWN0VGltZSA9IDBcbiAgICAvLyDmo4DmtYvnu5Pmnpzlm57osINcbiAgICB0aGlzLm9uRGV0ZWN0ID0gbnVsbFxuICAgIC8vIOeKtuaAgeWPmOabtOWbnuiwg1xuICAgIHRoaXMub25TdGF0ZUNoYW5nZSA9IG51bGxcbiAgfVxuXG4gIC8qKlxuICAgKiDovpPlhaXliqDpgJ/luqborqHmoLfmnKzmlbDmja5cbiAgICogQHBhcmFtIHtPYmplY3R9IHNhbXBsZSAtIHsgeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciB9XG4gICAqIEByZXR1cm5zIHtPYmplY3R9IOajgOa1i+e7k+aenCB7IHR5cGUsIGNvbmZpZGVuY2UsIGRldGFpbCB9XG4gICAqL1xuICBpbnB1dChzYW1wbGUpIHtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpXG4gICAgLy8g5o6n5Yi25qOA5rWL6aKR546H77yM5pyA5aSa5q+PMjAwbXPmo4DmtYvkuIDmrKFcbiAgICBpZiAobm93IC0gdGhpcy5sYXN0RGV0ZWN0VGltZSA8IDIwMCkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgdGhpcy5sYXN0RGV0ZWN0VGltZSA9IG5vd1xuXG4gICAgLy8g5re75Yqg5Yiw5ruR5Yqo56qX5Y+jXG4gICAgdGhpcy5idWZmZXIucHVzaCh7XG4gICAgICB4OiBzYW1wbGUueCxcbiAgICAgIHk6IHNhbXBsZS55LFxuICAgICAgejogc2FtcGxlLnosXG4gICAgICB0OiBub3csXG4gICAgfSlcbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoID4gdGhpcy53aW5kb3dTaXplKSB7XG4gICAgICB0aGlzLmJ1ZmZlci5zaGlmdCgpXG4gICAgfVxuXG4gICAgLy8g56qX5Y+j5pyq5ruh5pe26L+U5Zue5q2j5bi4XG4gICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IDIwKSB7XG4gICAgICByZXR1cm4geyB0eXBlOiBQT1NUVVJFX1RZUEUuTk9STUFMLCBjb25maWRlbmNlOiAxLjAsIGRldGFpbDogJ+aVsOaNrumHh+mbhuS4rScgfVxuICAgIH1cblxuICAgIC8vIOaJp+ihjOajgOa1i1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2RldGVjdCgpXG5cbiAgICAvLyDop6blj5Hlm57osINcbiAgICBpZiAodGhpcy5vbkRldGVjdCkge1xuICAgICAgdGhpcy5vbkRldGVjdChyZXN1bHQpXG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIOaguOW/g+ajgOa1i+mAu+i+kVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2RldGVjdCgpIHtcbiAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlclxuXG4gICAgLy8gMS4g5LmF5Z2Q5qOA5rWL77ya5Yqg6YCf5bqm5pa55beu5p6B5L2OICsg5oyB57ut5pe26Ze0XG4gICAgY29uc3Qgc2VkZW50YXJ5UmVzdWx0ID0gdGhpcy5fZGV0ZWN0U2VkZW50YXJ5KGJ1ZmZlcilcbiAgICBpZiAoc2VkZW50YXJ5UmVzdWx0LnR5cGUgPT09IFBPU1RVUkVfVFlQRS5TRURFTlRBUlkpIHtcbiAgICAgIHJldHVybiBzZWRlbnRhcnlSZXN1bHRcbiAgICB9XG5cbiAgICAvLyAyLiDkvY7lpLTliY3lgL7mo4DmtYvvvJp66L206YeN5Yqb5YiG6YeP5byC5bi4XG4gICAgY29uc3QgaGVhZFRpbHRSZXN1bHQgPSB0aGlzLl9kZXRlY3RIZWFkVGlsdChidWZmZXIpXG4gICAgaWYgKGhlYWRUaWx0UmVzdWx0LnR5cGUgPT09IFBPU1RVUkVfVFlQRS5IRUFEX1RJTFQpIHtcbiAgICAgIHJldHVybiBoZWFkVGlsdFJlc3VsdFxuICAgIH1cblxuICAgIC8vIDMuIOi3t+S6jOmDjuiFv+ajgOa1i++8mnjovbTlgY/np7sgKyB56L205ZGo5pyf5oCn5b6u5oyvXG4gICAgY29uc3QgbGVnQ3Jvc3NSZXN1bHQgPSB0aGlzLl9kZXRlY3RMZWdDcm9zcyhidWZmZXIpXG4gICAgaWYgKGxlZ0Nyb3NzUmVzdWx0LnR5cGUgPT09IFBPU1RVUkVfVFlQRS5MRUdfQ1JPU1MpIHtcbiAgICAgIHJldHVybiBsZWdDcm9zc1Jlc3VsdFxuICAgIH1cblxuICAgIC8vIOato+W4uOS9k+aAgVxuICAgIHRoaXMuc2l0U3RhcnRUaW1lID0gbnVsbFxuICAgIHJldHVybiB7IHR5cGU6IFBPU1RVUkVfVFlQRS5OT1JNQUwsIGNvbmZpZGVuY2U6IDEuMCwgZGV0YWlsOiAn5L2T5oCB5q2j5bi4JyB9XG4gIH1cblxuICAvKipcbiAgICog5LmF5Z2Q5qOA5rWLXG4gICAqIOWOn+eQhu+8muWKoOmAn+W6puS4iei9tOaWueW3ruaegeS9juihqOekuuWHoOS5jumdmeatou+8jOaMgee7rei2hei/h+mYiOWAvOWIpOWumuS4uuS5heWdkFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2RldGVjdFNlZGVudGFyeShidWZmZXIpIHtcbiAgICBjb25zdCB2YXJpYW5jZSA9IHRoaXMuX2NhbGNWYXJpYW5jZShidWZmZXIpXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKVxuXG4gICAgLy8g5pa55beu6ZiI5YC877ya5L2O5LqOMC4wMeihqOekuuWHoOS5jumdmeatolxuICAgIGNvbnN0IFZBUklBTkNFX1RIUkVTSE9MRCA9IDAuMDFcblxuICAgIGlmICh2YXJpYW5jZSA8IFZBUklBTkNFX1RIUkVTSE9MRCkge1xuICAgICAgLy8g5qOA5rWL5Yiw6Z2Z5q2i54q25oCBXG4gICAgICBpZiAoIXRoaXMuc2l0U3RhcnRUaW1lKSB7XG4gICAgICAgIHRoaXMuc2l0U3RhcnRUaW1lID0gbm93XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNlZGVudGFyeUR1cmF0aW9uID0gbm93IC0gdGhpcy5zaXRTdGFydFRpbWVcbiAgICAgIGlmIChzZWRlbnRhcnlEdXJhdGlvbiA+IHRoaXMuc2VkZW50YXJ5VGhyZXNob2xkKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogUE9TVFVSRV9UWVBFLlNFREVOVEFSWSxcbiAgICAgICAgICBjb25maWRlbmNlOiBNYXRoLm1pbigwLjk1LCAwLjcgKyBzZWRlbnRhcnlEdXJhdGlvbiAvICh0aGlzLnNlZGVudGFyeVRocmVzaG9sZCAqIDUpKSxcbiAgICAgICAgICBkZXRhaWw6IGDlt7LpnZnlnZAgJHtNYXRoLmZsb29yKHNlZGVudGFyeUR1cmF0aW9uIC8gNjAwMDApfSDliIbpkp9gLFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIOa0u+WKqOeKtuaAge+8jOmHjee9ruiuoeaXtlxuICAgICAgaWYgKHRoaXMuc2l0U3RhcnRUaW1lKSB7XG4gICAgICAgIHRoaXMudG9kYXlTZWRlbnRhcnlNcyArPSBub3cgLSB0aGlzLnNpdFN0YXJ0VGltZVxuICAgICAgfVxuICAgICAgdGhpcy5zaXRTdGFydFRpbWUgPSBudWxsXG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdHlwZTogUE9TVFVSRV9UWVBFLk5PUk1BTCwgY29uZmlkZW5jZTogMS4wLCBkZXRhaWw6ICcnIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDkvY7lpLTliY3lgL7mo4DmtYtcbiAgICog5Y6f55CG77ya5q2j5bi456uZ56uL5pe2eui9tOe6pi0xZ++8jOS9juWktOaXtnrovbTnu53lr7nlgLzlh4/lsI9cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9kZXRlY3RIZWFkVGlsdChidWZmZXIpIHtcbiAgICBjb25zdCBhdmdaID0gdGhpcy5fY2FsY0F4aXNNZWFuKGJ1ZmZlciwgJ3onKVxuICAgIGNvbnN0IHZhcmlhbmNlID0gdGhpcy5fY2FsY1ZhcmlhbmNlKGJ1ZmZlcilcblxuICAgIC8vIOmdmeatouaIluW+ruWKqOaXtuaJjeajgOa1i++8iOi/kOWKqOS4rXrovbTlj5jljJblpKfvvIzkuI3lj6/pnaDvvIlcbiAgICBpZiAodmFyaWFuY2UgPiAwLjA1KSB7XG4gICAgICByZXR1cm4geyB0eXBlOiBQT1NUVVJFX1RZUEUuTk9STUFMLCBjb25maWRlbmNlOiAxLjAsIGRldGFpbDogJycgfVxuICAgIH1cblxuICAgIC8vIOato+W4uOermeeri3riiYgtMS4wLCDkvY7lpLTml7Z65ZyoLTAuNuWIsC0wLjnkuYvpl7RcbiAgICBjb25zdCBIRUFEX1RJTFRfWl9NSU4gPSAtMC45NVxuICAgIGNvbnN0IEhFQURfVElMVF9aX01BWCA9IC0wLjVcblxuICAgIGlmIChhdmdaID4gSEVBRF9USUxUX1pfTUlOICYmIGF2Z1ogPCBIRUFEX1RJTFRfWl9NQVgpIHtcbiAgICAgIC8vIHrotormjqXov5EtMC4177yM5L2O5aS06LaK5Lil6YeNXG4gICAgICBjb25zdCBzZXZlcml0eSA9IChhdmdaIC0gSEVBRF9USUxUX1pfTUlOKSAvIChIRUFEX1RJTFRfWl9NQVggLSBIRUFEX1RJTFRfWl9NSU4pXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBQT1NUVVJFX1RZUEUuSEVBRF9USUxULFxuICAgICAgICBjb25maWRlbmNlOiBNYXRoLm1pbigwLjg1LCAwLjUgKyBzZXZlcml0eSAqIDAuMzUpLFxuICAgICAgICBkZXRhaWw6IGDkvY7lpLTliY3lgL4gJHsoc2V2ZXJpdHkgKiAxMDApLnRvRml4ZWQoMCl9JWAsXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdHlwZTogUE9TVFVSRV9UWVBFLk5PUk1BTCwgY29uZmlkZW5jZTogMS4wLCBkZXRhaWw6ICcnIH1cbiAgfVxuXG4gIC8qKlxuICAgKiDot7fkuozpg47ohb/mo4DmtYtcbiAgICog5Y6f55CG77ya6Le35LqM6YOO6IW/5pe2eOi9tOacieaYjuaYvuWBj+enu++8jHnovbTlh7rnjrDlkajmnJ/mgKflvq7mjK9cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9kZXRlY3RMZWdDcm9zcyhidWZmZXIpIHtcbiAgICBjb25zdCBhdmdYID0gdGhpcy5fY2FsY0F4aXNNZWFuKGJ1ZmZlciwgJ3gnKVxuICAgIGNvbnN0IHZhcmlhbmNlID0gdGhpcy5fY2FsY1ZhcmlhbmNlKGJ1ZmZlcilcblxuICAgIC8vIOmcgOimgeS4gOWumua0u+WKqOmHj++8iOe6r+mdmeatouaXoOazleWIpOaWre+8iVxuICAgIGlmICh2YXJpYW5jZSA8IDAuMDA1IHx8IHZhcmlhbmNlID4gMC4xKSB7XG4gICAgICByZXR1cm4geyB0eXBlOiBQT1NUVVJFX1RZUEUuTk9STUFMLCBjb25maWRlbmNlOiAxLjAsIGRldGFpbDogJycgfVxuICAgIH1cblxuICAgIGNvbnN0IFhfT0ZGU0VUX1RIUkVTSE9MRCA9IDAuMjVcbiAgICBjb25zdCBoYXNYT2Zmc2V0ID0gTWF0aC5hYnMoYXZnWCkgPiBYX09GRlNFVF9USFJFU0hPTERcbiAgICBjb25zdCBoYXNZT3NjaWxsYXRpb24gPSB0aGlzLl9kZXRlY3RQZXJpb2RpY09zY2lsbGF0aW9uKGJ1ZmZlciwgJ3knKVxuXG4gICAgaWYgKGhhc1hPZmZzZXQgJiYgaGFzWU9zY2lsbGF0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBQT1NUVVJFX1RZUEUuTEVHX0NST1NTLFxuICAgICAgICBjb25maWRlbmNlOiAwLjY1LFxuICAgICAgICBkZXRhaWw6ICfnlpHkvLzot7fkuozpg47ohb8nLFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IHR5cGU6IFBPU1RVUkVfVFlQRS5OT1JNQUwsIGNvbmZpZGVuY2U6IDEuMCwgZGV0YWlsOiAnJyB9XG4gIH1cblxuICAvKipcbiAgICog6K6h566X5LiJ6L205pa55beuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2FsY1ZhcmlhbmNlKGJ1ZmZlcikge1xuICAgIGNvbnN0IG4gPSBidWZmZXIubGVuZ3RoXG4gICAgaWYgKG4gPCAyKSByZXR1cm4gMFxuXG4gICAgbGV0IHN1bSA9IDBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgY29uc3QgcyA9IGJ1ZmZlcltpXVxuICAgICAgY29uc3QgbWFnbml0dWRlID0gTWF0aC5zcXJ0KHMueCAqIHMueCArIHMueSAqIHMueSArIHMueiAqIHMueilcbiAgICAgIHN1bSArPSBtYWduaXR1ZGVcbiAgICB9XG4gICAgY29uc3QgbWVhbiA9IHN1bSAvIG5cblxuICAgIGxldCB2YXJpYW5jZSA9IDBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgY29uc3QgcyA9IGJ1ZmZlcltpXVxuICAgICAgY29uc3QgbWFnbml0dWRlID0gTWF0aC5zcXJ0KHMueCAqIHMueCArIHMueSAqIHMueSArIHMueiAqIHMueilcbiAgICAgIHZhcmlhbmNlICs9IChtYWduaXR1ZGUgLSBtZWFuKSAqIChtYWduaXR1ZGUgLSBtZWFuKVxuICAgIH1cbiAgICByZXR1cm4gdmFyaWFuY2UgLyBuXG4gIH1cblxuICAvKipcbiAgICog6K6h566X5oyH5a6a6L205Z2H5YC8XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2FsY0F4aXNNZWFuKGJ1ZmZlciwgYXhpcykge1xuICAgIGNvbnN0IG4gPSBidWZmZXIubGVuZ3RoXG4gICAgaWYgKG4gPT09IDApIHJldHVybiAwXG4gICAgbGV0IHN1bSA9IDBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgc3VtICs9IGJ1ZmZlcltpXVtheGlzXVxuICAgIH1cbiAgICByZXR1cm4gc3VtIC8gblxuICB9XG5cbiAgLyoqXG4gICAqIOajgOa1i+WRqOacn+aAp+W+ruaMr++8iOeugOWMlueJiO+8muajgOa1i+espuWPt+WPmOWMlumikeeOh++8iVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2RldGVjdFBlcmlvZGljT3NjaWxsYXRpb24oYnVmZmVyLCBheGlzKSB7XG4gICAgY29uc3QgbiA9IGJ1ZmZlci5sZW5ndGhcbiAgICBpZiAobiA8IDMwKSByZXR1cm4gZmFsc2VcblxuICAgIC8vIOiuoeeul+espuWPt+WPmOWMluasoeaVsFxuICAgIGxldCBzaWduQ2hhbmdlcyA9IDBcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IG47IGkrKykge1xuICAgICAgaWYgKChidWZmZXJbaV1bYXhpc10gPj0gMCAmJiBidWZmZXJbaSAtIDFdW2F4aXNdIDwgMCkgfHxcbiAgICAgICAgKGJ1ZmZlcltpXVtheGlzXSA8IDAgJiYgYnVmZmVyW2kgLSAxXVtheGlzXSA+PSAwKSkge1xuICAgICAgICBzaWduQ2hhbmdlcysrXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8g5ZGo5pyf5oCn5oyv6I2h77ya56ym5Y+35Y+Y5YyW6aKR546H5Zyo5ZCI55CG6IyD5Zu05YaFXG4gICAgY29uc3QgY2hhbmdlUmF0ZSA9IHNpZ25DaGFuZ2VzIC8gblxuICAgIHJldHVybiBjaGFuZ2VSYXRlID4gMC4xICYmIGNoYW5nZVJhdGUgPCAwLjVcbiAgfVxuXG4gIC8qKlxuICAgKiDojrflj5bku4rml6XkuYXlnZDmgLvml7bplb/vvIjmr6vnp5LvvIlcbiAgICovXG4gIGdldFRvZGF5U2VkZW50YXJ5TXMoKSB7XG4gICAgbGV0IHRvdGFsID0gdGhpcy50b2RheVNlZGVudGFyeU1zXG4gICAgaWYgKHRoaXMuc2l0U3RhcnRUaW1lKSB7XG4gICAgICB0b3RhbCArPSBEYXRlLm5vdygpIC0gdGhpcy5zaXRTdGFydFRpbWVcbiAgICB9XG4gICAgcmV0dXJuIHRvdGFsXG4gIH1cblxuICAvKipcbiAgICog6YeN572u5LuK5pel57uf6K6h77yI5q+P5pel6Zu254K56LCD55So77yJXG4gICAqL1xuICByZXNldERhaWx5U3RhdHMoKSB7XG4gICAgdGhpcy50b2RheVNlZGVudGFyeU1zID0gMFxuICAgIHRoaXMuc2l0U3RhcnRUaW1lID0gbnVsbFxuICB9XG5cbiAgLyoqXG4gICAqIOiOt+WPluS9k+aAgeexu+Wei+S4reaWh+WQjVxuICAgKi9cbiAgc3RhdGljIGdldFBvc3R1cmVOYW1lKHR5cGUpIHtcbiAgICByZXR1cm4gUE9TVFVSRV9OQU1FW3R5cGVdIHx8ICfmnKrnn6UnXG4gIH1cbn1cblxuLy8g5a+85Ye6XG5leHBvcnQgeyBQT1NUVVJFX1RZUEUsIFBPU1RVUkVfTkFNRSB9XG5leHBvcnQgZGVmYXVsdCBQb3N0dXJlRGV0ZWN0b3JcbiIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9ICgoKSA9PiB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ucnYgPSAoKSA9PiAoXCIxLjcuMTJcIikiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLnJ1aWQgPSBcImJ1bmRsZXI9cnNwYWNrQDEuNy4xMlwiOyIsIjx0ZW1wbGF0ZT5cbiAgPGRpdiBjbGFzcz1cInBhZ2VcIj5cbiAgICA8IS0tIOmhtumDqOeKtuaAgeagjyAtLT5cbiAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICA8dGV4dCBjbGFzcz1cInRpdGxlXCI+8J+UkiDkvZPmgIHlronlhajljavlo6s8L3RleHQ+XG4gICAgICA8dGV4dCBjbGFzcz1cInRpbWVcIj57eyBjdXJyZW50VGltZSB9fTwvdGV4dD5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5L2T5oCB5YGl5bq36K+E5YiG5Y2h54mHIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJzY29yZS1jYXJkXCI+XG4gICAgICA8dGV4dCBjbGFzcz1cInNjb3JlLWxhYmVsXCI+5L2T5oCB5YGl5bq36K+E5YiGPC90ZXh0PlxuICAgICAgPGRpdiBjbGFzcz1cInNjb3JlLWNpcmNsZVwiPlxuICAgICAgICA8dGV4dCBjbGFzcz1cInNjb3JlLXZhbHVlXCI+e3sgaGVhbHRoU2NvcmUgfX08L3RleHQ+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwic2NvcmUtdW5pdFwiPuWIhjwvdGV4dD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInNjb3JlLWJhclwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic2NvcmUtZmlsbFwiIHN0eWxlPVwid2lkdGg6IHt7IGhlYWx0aFNjb3JlIH19JTtcIj48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPHRleHQgY2xhc3M9XCJzY29yZS1kZXNjXCI+e3sgc2NvcmVEZXNjIH19PC90ZXh0PlxuICAgIDwvZGl2PlxuXG4gICAgPCEtLSDku4rml6XmlbDmja7mpoLop4ggLS0+XG4gICAgPGRpdiBjbGFzcz1cInN0YXRzLXJvd1wiPlxuICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaXRlbVwiPlxuICAgICAgICA8dGV4dCBjbGFzcz1cInN0YXQtdmFsdWVcIj57eyB0b2RheUFsZXJ0cyB9fTwvdGV4dD5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0LWxhYmVsXCI+5L2T5oCB5byC5bi4PC90ZXh0PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic3RhdC1kaXZpZGVyXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic3RhdC1pdGVtXCI+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwic3RhdC12YWx1ZVwiPnt7IHNlZGVudGFyeU1pbiB9fTwvdGV4dD5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0LWxhYmVsXCI+5LmF5Z2QKOWIhik8L3RleHQ+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWRpdmlkZXJcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWl0ZW1cIj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0LXZhbHVlXCI+e3sgcHJpdmFjeVN0YXR1cyB9fTwvdGV4dD5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0LWxhYmVsXCI+6ZqQ56eB6Ziy5oqkPC90ZXh0PlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG5cbiAgICA8IS0tIOW9k+WJjeS9k+aAgeeKtuaAgSAtLT5cbiAgICA8ZGl2IGNsYXNzPVwic3RhdHVzLWNhcmRcIj5cbiAgICAgIDx0ZXh0IGNsYXNzPVwic3RhdHVzLXRpdGxlXCI+5b2T5YmN5L2T5oCBPC90ZXh0PlxuICAgICAgPGRpdiBjbGFzcz1cInN0YXR1cy1yb3dcIj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0dXMtaWNvblwiPnt7IHBvc3R1cmVJY29uIH19PC90ZXh0PlxuICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHVzLWluZm9cIj5cbiAgICAgICAgICA8dGV4dCBjbGFzcz1cInN0YXR1cy10eXBlXCI+e3sgcG9zdHVyZVR5cGUgfX08L3RleHQ+XG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0dXMtZGV0YWlsXCI+e3sgcG9zdHVyZURldGFpbCB9fTwvdGV4dD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5Yqf6IO95YWl5Y+jIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJtZW51LWdyaWRcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtZW51LWl0ZW1cIiBvbmNsaWNrPVwiZ29Ub1Bvc3R1cmVcIj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJtZW51LWljb25cIj7wn5OKPC90ZXh0PlxuICAgICAgICA8dGV4dCBjbGFzcz1cIm1lbnUtdGV4dFwiPuS9k+aAgeebkea1izwvdGV4dD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm1lbnUtaXRlbVwiIG9uY2xpY2s9XCJnb1RvUHJpdmFjeVwiPlxuICAgICAgICA8dGV4dCBjbGFzcz1cIm1lbnUtaWNvblwiPvCfm6HvuI88L3RleHQ+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwibWVudS10ZXh0XCI+5a6J5YWo6K+m5oOFPC90ZXh0PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwibWVudS1pdGVtXCIgb25jbGljaz1cImdvVG9SZXBvcnRcIj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJtZW51LWljb25cIj7wn5OLPC90ZXh0PlxuICAgICAgICA8dGV4dCBjbGFzcz1cIm1lbnUtdGV4dFwiPuWBpeW6t+aKpeihqDwvdGV4dD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cIm1lbnUtaXRlbVwiIG9uY2xpY2s9XCJ0b2dnbGVNb25pdG9yXCI+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwibWVudS1pY29uXCI+e3sgbW9uaXRvclJ1bm5pbmcgPyAn4o+477iPJyA6ICfilrbvuI8nIH19PC90ZXh0PlxuICAgICAgICA8dGV4dCBjbGFzcz1cIm1lbnUtdGV4dFwiPnt7IG1vbml0b3JSdW5uaW5nID8gJ+aaguWBnOebkea1iycgOiAn5byA5ZCv55uR5rWLJyB9fTwvdGV4dD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5pbXBvcnQgcm91dGVyIGZyb20gJ0BzeXN0ZW0ucm91dGVyJ1xuaW1wb3J0IHNlbnNvciBmcm9tICdAc3lzdGVtLnNlbnNvcidcbmltcG9ydCBoZWFsdGggZnJvbSAnQHNlcnZpY2UuaGVhbHRoJ1xuaW1wb3J0IHZpYnJhdG9yIGZyb20gJ0BzeXN0ZW0udmlicmF0b3InXG5pbXBvcnQgcHJvbXB0IGZyb20gJ0BzeXN0ZW0ucHJvbXB0J1xuaW1wb3J0IFBvc3R1cmVEZXRlY3RvciwgeyBQT1NUVVJFX1RZUEUsIFBPU1RVUkVfTkFNRSB9IGZyb20gJy4uLy4uL2xpYi9wb3N0dXJlLWRldGVjdG9yJ1xuaW1wb3J0IEFub255bWl6ZXIgZnJvbSAnLi4vLi4vbGliL2Fub255bWl6ZXInXG5pbXBvcnQgRGF0YU1hbmFnZXIgZnJvbSAnLi4vLi4vbGliL2RhdGEtbWFuYWdlcidcblxuZXhwb3J0IGRlZmF1bHQge1xuICBwcml2YXRlOiB7XG4gICAgY3VycmVudFRpbWU6ICctLTotLScsXG4gICAgaGVhbHRoU2NvcmU6IDEwMCxcbiAgICBzY29yZURlc2M6ICfkvZPmgIHoia/lpb0nLFxuICAgIHRvZGF5QWxlcnRzOiAwLFxuICAgIHNlZGVudGFyeU1pbjogMCxcbiAgICBwcml2YWN5U3RhdHVzOiAn4pyTJyxcbiAgICBwb3N0dXJlSWNvbjogJ/CfmIonLFxuICAgIHBvc3R1cmVUeXBlOiAn5q2j5bi4JyxcbiAgICBwb3N0dXJlRGV0YWlsOiAn5L2T5oCB6Imv5aW977yM57un57ut5L+d5oyBJyxcbiAgICBtb25pdG9yUnVubmluZzogZmFsc2UsXG4gICAgLy8g5YaF6YOo54q25oCBXG4gICAgZGV0ZWN0b3I6IG51bGwsXG4gICAgYW5vbnltaXplcjogbnVsbCxcbiAgICBkYXRhTWFuYWdlcjogbnVsbCxcbiAgICB0aW1lVGltZXI6IG51bGwsXG4gICAgYWNjZWxCdWZmZXI6IFtdLFxuICB9LFxuXG4gIG9uUmVhZHkoKSB7XG4gICAgY29uc29sZS5sb2coJ1tJbmRleF0gb25SZWFkeScpXG4gICAgdGhpcy5faW5pdE1vZHVsZXMoKVxuICAgIHRoaXMuX3N0YXJ0VGltZXIoKVxuICAgIHRoaXMuX2xvYWRUb2RheURhdGEoKVxuICB9LFxuXG4gIG9uRGVzdHJveSgpIHtcbiAgICBjb25zb2xlLmxvZygnW0luZGV4XSBvbkRlc3Ryb3knKVxuICAgIHRoaXMuX3N0b3BNb25pdG9yKClcbiAgICBpZiAodGhpcy50aW1lVGltZXIpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lVGltZXIpXG4gICAgfVxuICB9LFxuXG4gIC8vIOWIneWni+WMluaooeWdl1xuICBfaW5pdE1vZHVsZXMoKSB7XG4gICAgdGhpcy5kZXRlY3RvciA9IG5ldyBQb3N0dXJlRGV0ZWN0b3Ioe1xuICAgICAgc2VkZW50YXJ5VGhyZXNob2xkOiAzMCAqIDYwICogMTAwMCxcbiAgICB9KVxuICAgIHRoaXMuYW5vbnltaXplciA9IG5ldyBBbm9ueW1pemVyKClcbiAgICB0aGlzLmRhdGFNYW5hZ2VyID0gbmV3IERhdGFNYW5hZ2VyKClcblxuICAgIC8vIOiuvue9ruajgOa1i+Wbnuiwg1xuICAgIHRoaXMuZGV0ZWN0b3Iub25EZXRlY3QgPSAocmVzdWx0KSA9PiB7XG4gICAgICB0aGlzLl9oYW5kbGVQb3N0dXJlUmVzdWx0KHJlc3VsdClcbiAgICB9XG4gIH0sXG5cbiAgLy8g5ZCv5Yqo5pe26Ze05pu05pawXG4gIF9zdGFydFRpbWVyKCkge1xuICAgIHRoaXMuX3VwZGF0ZVRpbWUoKVxuICAgIHRoaXMudGltZVRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdGhpcy5fdXBkYXRlVGltZSgpXG4gICAgfSwgMzAwMDApIC8vIOavjzMw56eS5pu05pawXG4gIH0sXG5cbiAgX3VwZGF0ZVRpbWUoKSB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKVxuICAgIGNvbnN0IGggPSBTdHJpbmcobm93LmdldEhvdXJzKCkpLnBhZFN0YXJ0KDIsICcwJylcbiAgICBjb25zdCBtID0gU3RyaW5nKG5vdy5nZXRNaW51dGVzKCkpLnBhZFN0YXJ0KDIsICcwJylcbiAgICB0aGlzLmN1cnJlbnRUaW1lID0gYCR7aH06JHttfWBcbiAgfSxcblxuICAvLyDliqDovb3ku4rml6XmlbDmja5cbiAgX2xvYWRUb2RheURhdGEoKSB7XG4gICAgdGhpcy5kYXRhTWFuYWdlci5sb2FkVG9kYXlQb3N0dXJlU3RhdHMoKHN0YXRzKSA9PiB7XG4gICAgICBpZiAoc3RhdHMpIHtcbiAgICAgICAgdGhpcy50b2RheUFsZXJ0cyA9IHN0YXRzLnRvdGFsQWxlcnRzIHx8IDBcbiAgICAgICAgdGhpcy5zZWRlbnRhcnlNaW4gPSBNYXRoLnJvdW5kKChzdGF0cy5zZWRlbnRhcnlNcyB8fCAwKSAvIDYwMDAwKVxuICAgICAgICB0aGlzLl91cGRhdGVIZWFsdGhTY29yZSgpXG4gICAgICB9XG4gICAgfSlcbiAgfSxcblxuICAvLyDlpITnkIbkvZPmgIHmo4DmtYvnu5PmnpxcbiAgX2hhbmRsZVBvc3R1cmVSZXN1bHQocmVzdWx0KSB7XG4gICAgdGhpcy5wb3N0dXJlSWNvbiA9IHRoaXMuX2dldFBvc3R1cmVJY29uKHJlc3VsdC50eXBlKVxuICAgIHRoaXMucG9zdHVyZVR5cGUgPSBQb3N0dXJlRGV0ZWN0b3IuZ2V0UG9zdHVyZU5hbWUocmVzdWx0LnR5cGUpXG4gICAgdGhpcy5wb3N0dXJlRGV0YWlsID0gcmVzdWx0LmRldGFpbFxuXG4gICAgaWYgKHJlc3VsdC50eXBlICE9PSBQT1NUVVJFX1RZUEUuTk9STUFMKSB7XG4gICAgICB0aGlzLnRvZGF5QWxlcnRzKytcblxuICAgICAgLy8g6ZyH5Yqo5o+Q6YaSXG4gICAgICB2aWJyYXRvci52aWJyYXRlKHsgbW9kZTogJ2xvbmcnIH0pXG5cbiAgICAgIC8vIOS/neWtmOW8guW4uOiusOW9lVxuICAgICAgdGhpcy5kYXRhTWFuYWdlci5zYXZlUG9zdHVyZUFsZXJ0KHtcbiAgICAgICAgdHlwZTogcmVzdWx0LnR5cGUsXG4gICAgICAgIGNvbmZpZGVuY2U6IHJlc3VsdC5jb25maWRlbmNlLFxuICAgICAgICBkZXRhaWw6IHJlc3VsdC5kZXRhaWwsXG4gICAgICB9KVxuXG4gICAgICAvLyBUb2FzdCDmj5DphpJcbiAgICAgIHByb21wdC5zaG93VG9hc3Qoe1xuICAgICAgICBtZXNzYWdlOiBg4pqg77iPIOajgOa1i+WIsCR7UG9zdHVyZURldGVjdG9yLmdldFBvc3R1cmVOYW1lKHJlc3VsdC50eXBlKX1gLFxuICAgICAgICBkdXJhdGlvbjogMSxcbiAgICAgIH0pXG5cbiAgICAgIHRoaXMuX3VwZGF0ZUhlYWx0aFNjb3JlKClcbiAgICB9XG5cbiAgICAvLyDmm7TmlrDkuYXlnZDml7bpl7RcbiAgICB0aGlzLnNlZGVudGFyeU1pbiA9IE1hdGgucm91bmQodGhpcy5kZXRlY3Rvci5nZXRUb2RheVNlZGVudGFyeU1zKCkgLyA2MDAwMClcbiAgfSxcblxuICAvLyDojrflj5bkvZPmgIHlm77moIdcbiAgX2dldFBvc3R1cmVJY29uKHR5cGUpIHtcbiAgICBjb25zdCBpY29ucyA9IHtcbiAgICAgIFtQT1NUVVJFX1RZUEUuTk9STUFMXTogJ/CfmIonLFxuICAgICAgW1BPU1RVUkVfVFlQRS5TRURFTlRBUlldOiAn8J+qkScsXG4gICAgICBbUE9TVFVSRV9UWVBFLkhFQURfVElMVF06ICfwn5OxJyxcbiAgICAgIFtQT1NUVVJFX1RZUEUuTEVHX0NST1NTXTogJ/CfprUnLFxuICAgIH1cbiAgICByZXR1cm4gaWNvbnNbdHlwZV0gfHwgJ+KdkydcbiAgfSxcblxuICAvLyDmm7TmlrDlgaXlurfor4TliIZcbiAgX3VwZGF0ZUhlYWx0aFNjb3JlKCkge1xuICAgIGNvbnN0IGFsZXJ0cyA9IHRoaXMudG9kYXlBbGVydHNcbiAgICBsZXQgc2NvcmUgPSAxMDBcbiAgICBzY29yZSAtPSBNYXRoLm1pbihhbGVydHMgKiA1LCAzMCkgLy8g5q+P5qyh5byC5bi45omjNeWIhu+8jOacgOWkmjMw5YiGXG4gICAgc2NvcmUgLT0gTWF0aC5taW4odGhpcy5zZWRlbnRhcnlNaW4gKiAwLjIsIDIwKSAvLyDkuYXlnZDmiaPliIZcbiAgICB0aGlzLmhlYWx0aFNjb3JlID0gTWF0aC5tYXgoMCwgTWF0aC5yb3VuZChzY29yZSkpXG5cbiAgICBpZiAodGhpcy5oZWFsdGhTY29yZSA+PSA4MCkge1xuICAgICAgdGhpcy5zY29yZURlc2MgPSAn5L2T5oCB6Imv5aW9J1xuICAgIH0gZWxzZSBpZiAodGhpcy5oZWFsdGhTY29yZSA+PSA2MCkge1xuICAgICAgdGhpcy5zY29yZURlc2MgPSAn6ZyA6KaB5rOo5oSPJ1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNjb3JlRGVzYyA9ICfkvZPmgIHorablkYonXG4gICAgfVxuICB9LFxuXG4gIC8vIOW8gOWni+ebkea1i1xuICBfc3RhcnRNb25pdG9yKCkge1xuICAgIGlmICh0aGlzLm1vbml0b3JSdW5uaW5nKSByZXR1cm5cblxuICAgIC8vIOiuoumYheWKoOmAn+W6puiuoVxuICAgIHNlbnNvci5zdWJzY3JpYmVBY2NlbGVyb21ldGVyKHtcbiAgICAgIGNhbGxiYWNrOiAoZGF0YSkgPT4ge1xuICAgICAgICB0aGlzLl9vbkFjY2VsZXJvbWV0ZXJEYXRhKGRhdGEpXG4gICAgICB9LFxuICAgICAgZmFpbDogKGRhdGEsIGNvZGUpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcignW0luZGV4XSBhY2NlbGVyb21ldGVyIGZhaWw6JywgY29kZSlcbiAgICAgIH0sXG4gICAgfSlcblxuICAgIC8vIOiuoumYheW/g+eOh1xuICAgIGhlYWx0aC5zdWJzY3JpYmVTYW1wbGUoe1xuICAgICAgZGF0YVR5cGU6IGhlYWx0aC5EQVRBX1RZUEVTLkhFQVJUX1JBVEUsXG4gICAgICBjYWxsYmFjazogKHNhbXBsZSkgPT4ge1xuICAgICAgICB0aGlzLl9vbkhlYXJ0UmF0ZURhdGEoc2FtcGxlKVxuICAgICAgfSxcbiAgICAgIGZhaWw6IChkYXRhLCBjb2RlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tJbmRleF0gaGVhbHRoIHN1YnNjcmliZSBmYWlsOicsIGNvZGUpXG4gICAgICB9LFxuICAgIH0pXG5cbiAgICB0aGlzLm1vbml0b3JSdW5uaW5nID0gdHJ1ZVxuICAgIHRoaXMucHJpdmFjeVN0YXR1cyA9ICfwn5+iJ1xuICAgIGNvbnNvbGUubG9nKCdbSW5kZXhdIG1vbml0b3Igc3RhcnRlZCcpXG4gIH0sXG5cbiAgLy8g5YGc5q2i55uR5rWLXG4gIF9zdG9wTW9uaXRvcigpIHtcbiAgICBpZiAoIXRoaXMubW9uaXRvclJ1bm5pbmcpIHJldHVyblxuXG4gICAgc2Vuc29yLnVuc3Vic2NyaWJlQWNjZWxlcm9tZXRlcigpXG4gICAgaGVhbHRoLnVuc3Vic2NyaWJlU2FtcGxlKHsgZGF0YVR5cGU6IGhlYWx0aC5EQVRBX1RZUEVTLkhFQVJUX1JBVEUgfSlcblxuICAgIHRoaXMubW9uaXRvclJ1bm5pbmcgPSBmYWxzZVxuICAgIHRoaXMucHJpdmFjeVN0YXR1cyA9ICfinJMnXG4gICAgY29uc29sZS5sb2coJ1tJbmRleF0gbW9uaXRvciBzdG9wcGVkJylcbiAgfSxcblxuICAvLyDliqDpgJ/luqborqHmlbDmja7lm57osINcbiAgX29uQWNjZWxlcm9tZXRlckRhdGEoZGF0YSkge1xuICAgIC8vIOi+k+WFpeWIsOS9k+aAgeajgOa1i+WZqFxuICAgIHRoaXMuZGV0ZWN0b3IuaW5wdXQoeyB4OiBkYXRhLngsIHk6IGRhdGEueSwgejogZGF0YS56IH0pXG5cbiAgICAvLyDmlLbpm4bmlbDmja7nlKjkuo7ohLHmlY9cbiAgICB0aGlzLmFjY2VsQnVmZmVyLnB1c2goeyB4OiBkYXRhLngsIHk6IGRhdGEueSwgejogZGF0YS56IH0pXG4gICAgaWYgKHRoaXMuYWNjZWxCdWZmZXIubGVuZ3RoID4gMTAwKSB7XG4gICAgICAvLyDohLHmlY/lpITnkIZcbiAgICAgIGNvbnN0IGZlYXR1cmUgPSB0aGlzLmFub255bWl6ZXIuYW5vbnltaXplQWNjZWxlcmF0aW9uKHRoaXMuYWNjZWxCdWZmZXIpXG4gICAgICBpZiAoZmVhdHVyZSkge1xuICAgICAgICB0aGlzLmRhdGFNYW5hZ2VyLnNhdmVIUkZlYXR1cmUoZmVhdHVyZSlcbiAgICAgIH1cbiAgICAgIHRoaXMuYWNjZWxCdWZmZXIgPSBbXVxuICAgIH1cbiAgfSxcblxuICAvLyDlv4PnjofmlbDmja7lm57osINcbiAgX29uSGVhcnRSYXRlRGF0YShzYW1wbGUpIHtcbiAgICAvLyDohLHmlY/lpITnkIZcbiAgICBjb25zdCBmZWF0dXJlID0gdGhpcy5hbm9ueW1pemVyLmFub255bWl6ZUhlYXJ0UmF0ZShzYW1wbGUpXG4gICAgaWYgKGZlYXR1cmUpIHtcbiAgICAgIHRoaXMuZGF0YU1hbmFnZXIuc2F2ZUhSRmVhdHVyZShmZWF0dXJlKVxuICAgIH1cbiAgfSxcblxuICAvLyDpobXpnaLlr7zoiKpcbiAgZ29Ub1Bvc3R1cmUoKSB7XG4gICAgcm91dGVyLnB1c2goeyB1cmk6ICcvcGFnZXMvcG9zdHVyZScgfSlcbiAgfSxcblxuICBnb1RvUHJpdmFjeSgpIHtcbiAgICByb3V0ZXIucHVzaCh7IHVyaTogJy9wYWdlcy9wcml2YWN5JyB9KVxuICB9LFxuXG4gIGdvVG9SZXBvcnQoKSB7XG4gICAgcm91dGVyLnB1c2goeyB1cmk6ICcvcGFnZXMvcmVwb3J0JyB9KVxuICB9LFxuXG4gIC8vIOWIh+aNouebkea1i+eKtuaAgVxuICB0b2dnbGVNb25pdG9yKCkge1xuICAgIGlmICh0aGlzLm1vbml0b3JSdW5uaW5nKSB7XG4gICAgICB0aGlzLl9zdG9wTW9uaXRvcigpXG4gICAgICBwcm9tcHQuc2hvd1RvYXN0KHsgbWVzc2FnZTogJ+ebkea1i+W3suaaguWBnCcgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RhcnRNb25pdG9yKClcbiAgICAgIHByb21wdC5zaG93VG9hc3QoeyBtZXNzYWdlOiAn55uR5rWL5bey5byA5ZCvJyB9KVxuICAgIH1cbiAgfSxcbn1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4ucGFnZSB7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHdpZHRoOiA0ODBweDtcbiAgaGVpZ2h0OiA0ODBweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzBhMGEwYTtcbn1cblxuLmhlYWRlciB7XG4gIHdpZHRoOiAxMDAlO1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHBhZGRpbmc6IDE1cHggMjBweDtcbiAgbWFyZ2luLXRvcDogMjBweDtcbn1cblxuLnRpdGxlIHtcbiAgZm9udC1zaXplOiAyNHB4O1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG5cbi50aW1lIHtcbiAgZm9udC1zaXplOiAyMHB4O1xuICBjb2xvcjogIzg4ODg4ODtcbn1cblxuLyog6K+E5YiG5Y2h54mHICovXG4uc2NvcmUtY2FyZCB7XG4gIHdpZHRoOiA0MjBweDtcbiAgcGFkZGluZzogMjBweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzFhMWEyZTtcbiAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cblxuLnNjb3JlLWxhYmVsIHtcbiAgZm9udC1zaXplOiAyMHB4O1xuICBjb2xvcjogI2FhYWFhYTtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbn1cblxuLnNjb3JlLWNpcmNsZSB7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGFsaWduLWl0ZW1zOiBiYXNlbGluZTtcbn1cblxuLnNjb3JlLXZhbHVlIHtcbiAgZm9udC1zaXplOiA3MnB4O1xuICBjb2xvcjogIzAwZDRhYTtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG5cbi5zY29yZS11bml0IHtcbiAgZm9udC1zaXplOiAyNHB4O1xuICBjb2xvcjogIzAwZDRhYTtcbiAgbWFyZ2luLWxlZnQ6IDVweDtcbn1cblxuLnNjb3JlLWJhciB7XG4gIHdpZHRoOiAzMDBweDtcbiAgaGVpZ2h0OiA4cHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzMzMzM7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgbWFyZ2luLXRvcDogMTBweDtcbn1cblxuLnNjb3JlLWZpbGwge1xuICBoZWlnaHQ6IDhweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwZDRhYTtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xufVxuXG4uc2NvcmUtZGVzYyB7XG4gIGZvbnQtc2l6ZTogMThweDtcbiAgY29sb3I6ICMwMGQ0YWE7XG4gIG1hcmdpbi10b3A6IDhweDtcbn1cblxuLyog5pWw5o2u57uf6K6h6KGMICovXG4uc3RhdHMtcm93IHtcbiAgd2lkdGg6IDQyMHB4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWFyb3VuZDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgcGFkZGluZzogMTVweCAwO1xuICBtYXJnaW4tdG9wOiAxNXB4O1xufVxuXG4uc3RhdC1pdGVtIHtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cblxuLnN0YXQtdmFsdWUge1xuICBmb250LXNpemU6IDI4cHg7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBmb250LXdlaWdodDogYm9sZDtcbn1cblxuLnN0YXQtbGFiZWwge1xuICBmb250LXNpemU6IDE0cHg7XG4gIGNvbG9yOiAjODg4ODg4O1xuICBtYXJnaW4tdG9wOiA0cHg7XG59XG5cbi5zdGF0LWRpdmlkZXIge1xuICB3aWR0aDogMXB4O1xuICBoZWlnaHQ6IDQwcHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICMzMzMzMzM7XG59XG5cbi8qIOeKtuaAgeWNoeeJhyAqL1xuLnN0YXR1cy1jYXJkIHtcbiAgd2lkdGg6IDQyMHB4O1xuICBwYWRkaW5nOiAxNXB4IDIwcHg7XG4gIGJhY2tncm91bmQtY29sb3I6ICMxYTFhMmU7XG4gIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gIG1hcmdpbi10b3A6IDE1cHg7XG59XG5cbi5zdGF0dXMtdGl0bGUge1xuICBmb250LXNpemU6IDE4cHg7XG4gIGNvbG9yOiAjODg4ODg4O1xuICBtYXJnaW4tYm90dG9tOiAxMHB4O1xufVxuXG4uc3RhdHVzLXJvdyB7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG5cbi5zdGF0dXMtaWNvbiB7XG4gIGZvbnQtc2l6ZTogMzZweDtcbiAgbWFyZ2luLXJpZ2h0OiAxNXB4O1xufVxuXG4uc3RhdHVzLWluZm8ge1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xufVxuXG4uc3RhdHVzLXR5cGUge1xuICBmb250LXNpemU6IDIycHg7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBmb250LXdlaWdodDogYm9sZDtcbn1cblxuLnN0YXR1cy1kZXRhaWwge1xuICBmb250LXNpemU6IDE2cHg7XG4gIGNvbG9yOiAjODg4ODg4O1xuICBtYXJnaW4tdG9wOiA0cHg7XG59XG5cbi8qIOWKn+iDveiPnOWNlSAqL1xuLm1lbnUtZ3JpZCB7XG4gIHdpZHRoOiA0MjBweDtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgZmxleC13cmFwOiB3cmFwO1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIG1hcmdpbi10b3A6IDIwcHg7XG59XG5cbi5tZW51LWl0ZW0ge1xuICB3aWR0aDogMTk1cHg7XG4gIGhlaWdodDogODBweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzFhMWEyZTtcbiAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XG59XG5cbi5tZW51LWljb24ge1xuICBmb250LXNpemU6IDI4cHg7XG59XG5cbi5tZW51LXRleHQge1xuICBmb250LXNpemU6IDE2cHg7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICBtYXJnaW4tdG9wOiA2cHg7XG59XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbIkFOT05fVFlQRSIsImV4cG9ydHMiLCJIUl9GRUFUVVJFIiwiQUNDRUxfRkVBVFVSRSIsIlNURVBfRkVBVFVSRSIsIlNUUkVTU19GRUFUVVJFIiwiUE9TVFVSRV9GRUFUVVJFIiwiSFJfWk9ORSIsIlJFU1QiLCJtaW4iLCJtYXgiLCJsYWJlbCIsIk5PUk1BTCIsIkVMRVZBVEVEIiwiSElHSCIsIkFub255bWl6ZXIiLCJjb25zdHJ1Y3RvciIsImhyQnVmZmVyIiwiaHJCdWZmZXJTdGFydFRpbWUiLCJzdHJlc3NCdWZmZXIiLCJzdHJlc3NCdWZmZXJTdGFydFRpbWUiLCJzdGVwQnVmZmVyIiwic3RlcEJ1ZmZlckhvdXIiLCJhbm9ueW1pemVIZWFydFJhdGUiLCJyYXdEYXRhIiwibm93IiwidGltZVN0YW1wIiwiaG91ckJ1Y2tldCIsIk1hdGgiLCJmbG9vciIsImVsYXBzZWQiLCJGSVZFX01JTlVURVMiLCJwdXNoIiwidmFsdWUiLCJ2YWx1ZXMiLCJmZWF0dXJlIiwidHlwZSIsImF2Z1ZhbHVlIiwicm91bmQiLCJfY2FsY01lYW4iLCJtaW5WYWx1ZSIsIm1heFZhbHVlIiwiem9uZSIsIl9jbGFzc2lmeUhSWm9uZSIsInNhbXBsZUNvdW50IiwibGVuZ3RoIiwiYW5vbnltaXplQWNjZWxlcmF0aW9uIiwic2FtcGxlcyIsIm4iLCJhdmdYIiwiX2NhbGNBeGlzTWVhbiIsImF2Z1kiLCJhdmdaIiwidmFyWCIsIl9jYWxjQXhpc1ZhcmlhbmNlIiwidmFyWSIsInZhcloiLCJkb21pbmFudEF4aXMiLCJfZ2V0RG9taW5hbnRBeGlzIiwidG90YWxWYXJpYW5jZSIsInRpbWVzdGFtcCIsIkRhdGUiLCJ0b0ZpeGVkIiwiaXNTdGF0aW9uYXJ5IiwiYW5vbnltaXplUG9zdHVyZVJlc3VsdCIsInBvc3R1cmVSZXN1bHQiLCJwb3N0dXJlVHlwZSIsImNvbmZpZGVuY2UiLCJhbm9ueW1pemVTdGVwIiwiaG91ciIsImdldEhvdXJzIiwidG90YWxTdGVwcyIsInJlZHVjZSIsImEiLCJiIiwiYW5vbnltaXplU3RyZXNzIiwiVEVOX01JTlVURVMiLCJrZXkiLCJPYmplY3QiLCJlbnRyaWVzIiwiYXJyIiwiYXhpcyIsInN1bSIsImkiLCJtZWFuIiwidmFyaWFuY2UiLCJkaWZmIiwiYWJzWCIsImFicyIsImFic1kiLCJhYnNaIiwiX2RlZmF1bHQiLCJfc3lzdGVtIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsIiRhcHBfcmVxdWlyZSQiLCJfc3lzdGVtMiIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsIm93bktleXMiLCJyIiwidCIsImtleXMiLCJnZXRPd25Qcm9wZXJ0eVN5bWJvbHMiLCJvIiwiZmlsdGVyIiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsImFwcGx5IiwiX29iamVjdFNwcmVhZCIsImFyZ3VtZW50cyIsImZvckVhY2giLCJfZGVmaW5lUHJvcGVydHkiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzIiwiZGVmaW5lUHJvcGVydGllcyIsImRlZmluZVByb3BlcnR5IiwiX3RvUHJvcGVydHlLZXkiLCJjb25maWd1cmFibGUiLCJ3cml0YWJsZSIsIl90b1ByaW1pdGl2ZSIsIlN5bWJvbCIsInRvUHJpbWl0aXZlIiwiY2FsbCIsIlR5cGVFcnJvciIsIlN0cmluZyIsIk51bWJlciIsIkNSWVBUT19MRVZFTCIsIkwxIiwiTDIiLCJMMyIsIktFWVMiLCJDcnlwdG9TdG9yZSIsInN0YXRzIiwiZW5jcnlwdENvdW50IiwiZGVjcnlwdENvdW50IiwiZXJyb3JDb3VudCIsInNhdmUiLCJsZXZlbCIsInN1Y2Nlc3MiLCJmYWlsIiwicGxhaW4iLCJKU09OIiwic3RyaW5naWZ5Iiwic3RvcmFnZSIsInNldCIsImNvbnNvbGUiLCJsb2ciLCJkYXRhIiwiY29kZSIsImVycm9yIiwiZW5jS2V5IiwiY3J5cHRvIiwiYnRvYSIsImVuY3J5cHQiLCJhbGdvIiwicmVzIiwibG9hZCIsImNhbGxiYWNrIiwiZ2V0IiwiZW5jcnlwdGVkIiwicGFyc2UiLCJkZWNyeXB0IiwicmVtb3ZlIiwiZGVsZXRlIiwiYmF0Y2hSZW1vdmUiLCJyZW1haW5pbmciLCJjbGVhckFsbCIsImNsZWFyIiwiZ2V0U3RhdHMiLCJfY3J5cHRvU3RvcmUiLCJfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCIsInJlcXVpcmUiLCJXZWFrTWFwIiwiZiIsIl9fcHJvdG9fXyIsImhhcyIsImhhc093blByb3BlcnR5IiwiREFUQV9UWVBFIiwiUE9TVFVSRV9EQUlMWSIsIlBPU1RVUkVfQUxFUlQiLCJTRVRUSU5HUyIsIkVYUElSWSIsIkxFVkVMX01BUCIsIkRhdGFNYW5hZ2VyIiwiY3J5cHRvU3RvcmUiLCJrZXlSZWdpc3RyeSIsIl9tYWtlS2V5IiwiZGF0ZSIsImRhdGVTdHIiLCJfZ2V0RGF0ZVN0ciIsInRzIiwiZCIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJwYWRTdGFydCIsImdldERhdGUiLCJzYXZlUG9zdHVyZVN0YXRzIiwiX3JlZ2lzdGVyS2V5Iiwic2F2ZVBvc3R1cmVBbGVydCIsImFsZXJ0IiwidG9kYXkiLCJzYXZlSFJGZWF0dXJlIiwic2F2ZVN0cmVzc0ZlYXR1cmUiLCJsb2FkVG9kYXlQb3N0dXJlU3RhdHMiLCJsb2FkVG9kYXlBbGVydHMiLCJ0b2RheVByZWZpeCIsInRvZGF5S2V5cyIsImsiLCJzdGFydHNXaXRoIiwiYWxlcnRzIiwic29ydCIsImxvYWRIUkZlYXR1cmVzIiwiZGF5cyIsImZlYXR1cmVzIiwic2V0RGF0ZSIsImdldFRpbWUiLCJwcmVmaXgiLCJzYXZlU2V0dGluZ3MiLCJzZXR0aW5ncyIsImxvYWRTZXR0aW5ncyIsInNlZGVudGFyeVRocmVzaG9sZCIsInZpYnJhdGlvbkVuYWJsZWQiLCJhbGVydEVuYWJsZWQiLCJjbGVhbkV4cGlyZWQiLCJleHBpcmVkS2V5cyIsImV4cGlyeU1zIiwiaW5jbHVkZXMiLCJkYXRlTWF0Y2giLCJtYXRjaCIsImRhdGFEYXRlIiwiY2xlYXJBbGxQcml2YWN5RGF0YSIsInByaXZhY3lLZXlzIiwiZ2V0U3VtbWFyeSIsInN1bW1hcnkiLCJ0b3RhbEtleXMiLCJwb3N0dXJlRGFpbHkiLCJwb3N0dXJlQWxlcnRzIiwiaHJGZWF0dXJlcyIsInN0cmVzc0ZlYXR1cmVzIiwiY3J5cHRvU3RhdHMiLCJQT1NUVVJFX1RZUEUiLCJTRURFTlRBUlkiLCJIRUFEX1RJTFQiLCJMRUdfQ1JPU1MiLCJQT1NUVVJFX05BTUUiLCJQb3N0dXJlRGV0ZWN0b3IiLCJvcHRpb25zIiwid2luZG93U2l6ZSIsImJ1ZmZlciIsInNpdFN0YXJ0VGltZSIsInRvZGF5U2VkZW50YXJ5TXMiLCJsYXN0RGV0ZWN0VGltZSIsIm9uRGV0ZWN0Iiwib25TdGF0ZUNoYW5nZSIsImlucHV0Iiwic2FtcGxlIiwieCIsInkiLCJ6Iiwic2hpZnQiLCJkZXRhaWwiLCJyZXN1bHQiLCJfZGV0ZWN0Iiwic2VkZW50YXJ5UmVzdWx0IiwiX2RldGVjdFNlZGVudGFyeSIsImhlYWRUaWx0UmVzdWx0IiwiX2RldGVjdEhlYWRUaWx0IiwibGVnQ3Jvc3NSZXN1bHQiLCJfZGV0ZWN0TGVnQ3Jvc3MiLCJfY2FsY1ZhcmlhbmNlIiwiVkFSSUFOQ0VfVEhSRVNIT0xEIiwic2VkZW50YXJ5RHVyYXRpb24iLCJIRUFEX1RJTFRfWl9NSU4iLCJIRUFEX1RJTFRfWl9NQVgiLCJzZXZlcml0eSIsIlhfT0ZGU0VUX1RIUkVTSE9MRCIsImhhc1hPZmZzZXQiLCJoYXNZT3NjaWxsYXRpb24iLCJfZGV0ZWN0UGVyaW9kaWNPc2NpbGxhdGlvbiIsInMiLCJtYWduaXR1ZGUiLCJzcXJ0Iiwic2lnbkNoYW5nZXMiLCJjaGFuZ2VSYXRlIiwiZ2V0VG9kYXlTZWRlbnRhcnlNcyIsInRvdGFsIiwicmVzZXREYWlseVN0YXRzIiwiZ2V0UG9zdHVyZU5hbWUiLCJfX3dlYnBhY2tfcmVxdWlyZV9fIiwiZ2xvYmFsVGhpcyIsIkZ1bmN0aW9uIiwid2luZG93IiwiX3NlcnZpY2UiLCJfc3lzdGVtMyIsIl9zeXN0ZW00IiwiX3Bvc3R1cmVEZXRlY3RvciIsIl9hbm9ueW1pemVyIiwiX2RhdGFNYW5hZ2VyIiwicHJpdmF0ZSIsImN1cnJlbnRUaW1lIiwiaGVhbHRoU2NvcmUiLCJzY29yZURlc2MiLCJ0b2RheUFsZXJ0cyIsInNlZGVudGFyeU1pbiIsInByaXZhY3lTdGF0dXMiLCJwb3N0dXJlSWNvbiIsInBvc3R1cmVEZXRhaWwiLCJtb25pdG9yUnVubmluZyIsImRldGVjdG9yIiwiYW5vbnltaXplciIsImRhdGFNYW5hZ2VyIiwidGltZVRpbWVyIiwiYWNjZWxCdWZmZXIiLCJvblJlYWR5IiwiX2luaXRNb2R1bGVzIiwiX3N0YXJ0VGltZXIiLCJfbG9hZFRvZGF5RGF0YSIsIm9uRGVzdHJveSIsIl9zdG9wTW9uaXRvciIsImNsZWFySW50ZXJ2YWwiLCJfaGFuZGxlUG9zdHVyZVJlc3VsdCIsIl91cGRhdGVUaW1lIiwic2V0SW50ZXJ2YWwiLCJoIiwibSIsImdldE1pbnV0ZXMiLCJ0b3RhbEFsZXJ0cyIsInNlZGVudGFyeU1zIiwiX3VwZGF0ZUhlYWx0aFNjb3JlIiwiX2dldFBvc3R1cmVJY29uIiwidmlicmF0b3IiLCJ2aWJyYXRlIiwibW9kZSIsInByb21wdCIsInNob3dUb2FzdCIsIm1lc3NhZ2UiLCJkdXJhdGlvbiIsImljb25zIiwic2NvcmUiLCJfc3RhcnRNb25pdG9yIiwic2Vuc29yIiwic3Vic2NyaWJlQWNjZWxlcm9tZXRlciIsIl9vbkFjY2VsZXJvbWV0ZXJEYXRhIiwiaGVhbHRoIiwic3Vic2NyaWJlU2FtcGxlIiwiZGF0YVR5cGUiLCJEQVRBX1RZUEVTIiwiSEVBUlRfUkFURSIsIl9vbkhlYXJ0UmF0ZURhdGEiLCJ1bnN1YnNjcmliZUFjY2VsZXJvbWV0ZXIiLCJ1bnN1YnNjcmliZVNhbXBsZSIsImdvVG9Qb3N0dXJlIiwicm91dGVyIiwidXJpIiwiZ29Ub1ByaXZhY3kiLCJnb1RvUmVwb3J0IiwidG9nZ2xlTW9uaXRvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBYUEsTUFBTUEsWUFBU0MsUUFBQUEsU0FBQSxHQUFHOzRCQUNoQkMsWUFBWTs0QkFDWkMsZUFBZTs0QkFDZkMsY0FBYzs0QkFDZEMsZ0JBQWdCOzRCQUNoQkMsaUJBQWlCO3dCQUNuQjt3QkFHQSxNQUFNQyxVQUFPTixRQUFBQSxPQUFBLEdBQUc7NEJBQ2RPLE1BQU07Z0NBQUVDLEtBQUs7Z0NBQUdDLEtBQUs7Z0NBQUlDLE9BQU87NEJBQUs7NEJBQ3JDQyxRQUFRO2dDQUFFSCxLQUFLO2dDQUFJQyxLQUFLO2dDQUFLQyxPQUFPOzRCQUFLOzRCQUN6Q0UsVUFBVTtnQ0FB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