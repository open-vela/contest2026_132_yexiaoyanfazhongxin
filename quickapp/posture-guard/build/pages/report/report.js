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
                var __webpack_modules__ = {};
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
                                "date-text"
                            ]
                        ],
                        {
                            fontSize: "16px",
                            color: "#888888"
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
                            paddingTop: "12px",
                            paddingRight: "12px",
                            paddingBottom: "12px",
                            paddingLeft: "12px",
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
                            fontSize: "16px",
                            color: "#888888",
                            marginBottom: "8px"
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
                            width: "396px",
                            height: "100px"
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
                            width: "396px",
                            height: "100px"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "chart-labels"
                            ]
                        ],
                        {
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: "6px"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "label-item"
                            ]
                        ],
                        {
                            fontSize: "12px",
                            color: "#666666"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "bar-legend"
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
                            fontSize: "13px",
                            marginTop: "0",
                            marginRight: "8px",
                            marginBottom: "0",
                            marginLeft: "8px"
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
                            paddingTop: "12px",
                            paddingRight: "12px",
                            paddingBottom: "12px",
                            paddingLeft: "12px",
                            backgroundColor: "#1a1a2e",
                            borderRadius: "12px",
                            marginTop: "10px"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "stat-row"
                            ]
                        ],
                        {
                            flexDirection: "row",
                            justifyContent: "space-around"
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
                            fontSize: "24px",
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
                            fontSize: "12px",
                            color: "#888888",
                            marginTop: "4px"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "summary-section"
                            ]
                        ],
                        {
                            width: "420px",
                            marginTop: "10px"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "summary-card"
                            ]
                        ],
                        {
                            backgroundColor: "#1a1a2e",
                            borderRadius: "12px",
                            paddingTop: "12px",
                            paddingRight: "15px",
                            paddingBottom: "12px",
                            paddingLeft: "15px"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "summary-title"
                            ]
                        ],
                        {
                            fontSize: "16px",
                            color: "#ffffff",
                            fontWeight: "bold",
                            marginBottom: "10px"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "summary-item"
                            ]
                        ],
                        {
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginBottom: "6px"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "summary-label"
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
                                "summary-value"
                            ]
                        ],
                        {
                            fontSize: "14px",
                            color: "#ffffff",
                            fontWeight: "bold"
                        }
                    ],
                    [
                        [
                            [
                                0,
                                "summary-value"
                            ],
                            [
                                0,
                                "highlight"
                            ]
                        ],
                        {
                            color: "#00d4aa"
                        }
                    ]
                ];
                var $app_script$ = function __scriptModule__(module, exports, $app_require$1) {
                    "use strict";
                    Object.defineProperty(exports, "__esModule", {
                        value: true
                    });
                    exports.default = void 0;
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
                    var _default = exports.default = {
                        private: {
                            todayDate: '',
                            scoreChartData: [
                                {
                                    strokeColor: '#00d4aa',
                                    fillColor: 'rgba(0,212,170,0.2)',
                                    data: [
                                        100,
                                        95,
                                        92,
                                        88,
                                        85,
                                        90,
                                        95,
                                        100,
                                        98,
                                        95,
                                        92,
                                        88
                                    ],
                                    gradient: true
                                }
                            ],
                            scoreChartOpts: {
                                xAxis: {
                                    min: 0,
                                    max: 11,
                                    display: false,
                                    axisTick: 12
                                },
                                yAxis: {
                                    min: 0,
                                    max: 100,
                                    display: false,
                                    axisTick: 11
                                },
                                series: {
                                    lineStyle: {
                                        width: '2px'
                                    }
                                }
                            },
                            barChartData: [
                                {
                                    fillColor: '#ff6b6b',
                                    data: [
                                        3,
                                        1,
                                        0,
                                        2,
                                        0,
                                        0,
                                        1,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0
                                    ]
                                },
                                {
                                    fillColor: '#ffd93d',
                                    data: [
                                        0,
                                        1,
                                        2,
                                        1,
                                        3,
                                        2,
                                        1,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0
                                    ]
                                },
                                {
                                    fillColor: '#4ecdc4',
                                    data: [
                                        0,
                                        0,
                                        1,
                                        0,
                                        1,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0
                                    ]
                                }
                            ],
                            barChartOpts: {
                                xAxis: {
                                    min: 0,
                                    max: 11,
                                    display: false,
                                    axisTick: 12
                                },
                                yAxis: {
                                    min: 0,
                                    max: 5,
                                    display: false,
                                    axisTick: 6
                                }
                            },
                            totalSamples: 0,
                            anonymizedCount: 0,
                            encryptedCount: 0
                        },
                        onReady () {
                            this._updateDate();
                            this._loadStats();
                        },
                        _updateDate () {
                            const now = new Date();
                            const month = now.getMonth() + 1;
                            const day = now.getDate();
                            this.todayDate = `${month}月${day}日`;
                        },
                        _loadStats () {
                            this.totalSamples = 12580;
                            this.anonymizedCount = 12580;
                            this.encryptedCount = 8420;
                            this._generateMockData();
                        },
                        _generateMockData () {
                            const now = new Date();
                            const hour = now.getHours();
                            const scoreData = [];
                            for(let i = 0; i < 12; i++){
                                const h = 2 * i;
                                let score = 100;
                                score = h < 8 ? 95 + 5 * Math.random() : h < 12 ? 85 + 10 * Math.random() : h < 14 ? 80 + 10 * Math.random() : h < 18 ? 85 + 10 * Math.random() : 90 + 10 * Math.random();
                                scoreData.push(Math.round(score));
                            }
                            this.scoreChartData = [
                                _objectSpread(_objectSpread({}, this.scoreChartData[0]), {}, {
                                    data: scoreData
                                })
                            ];
                            this.barChartData = [
                                {
                                    fillColor: '#ff6b6b',
                                    data: [
                                        1,
                                        2,
                                        0,
                                        3,
                                        1,
                                        0,
                                        2,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0
                                    ]
                                },
                                {
                                    fillColor: '#ffd93d',
                                    data: [
                                        0,
                                        1,
                                        2,
                                        1,
                                        2,
                                        3,
                                        1,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0
                                    ]
                                },
                                {
                                    fillColor: '#4ecdc4',
                                    data: [
                                        0,
                                        0,
                                        1,
                                        0,
                                        1,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0,
                                        0
                                    ]
                                }
                            ];
                        },
                        back (event) {
                            if (!event || 'right' === event.direction) Promise.resolve().then(()=>_interopRequireWildcard($app_require$1("@app-module/system.router"))).then((router)=>{
                                router.back();
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
                                    value: "健康报表"
                                }
                            }, []),
                            aiot.__ce__("text", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "date-text"
                                    ],
                                    value: function() {
                                        return _vm_.todayDate;
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
                                    value: "今日体态评分趋势"
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
                                            return _vm_.scoreChartOpts;
                                        },
                                        datasets: function() {
                                            return _vm_.scoreChartData;
                                        }
                                    }
                                }, [])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "chart-labels"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "label-item"
                                        ],
                                        value: "6:00"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "label-item"
                                        ],
                                        value: "12:00"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "label-item"
                                        ],
                                        value: "18:00"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "label-item"
                                        ],
                                        value: "24:00"
                                    }
                                }, [])
                            ])
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
                                    value: "体态异常分布"
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
                                        type: "bar",
                                        options: function() {
                                            return _vm_.barChartOpts;
                                        },
                                        datasets: function() {
                                            return _vm_.barChartData;
                                        }
                                    }
                                }, [])
                            ]),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "bar-legend"
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
                                        value: "🪑 久坐"
                                    }
                                }, []),
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "legend-item"
                                        ],
                                        style: {
                                            color: "#ffd93d"
                                        },
                                        value: "📱 低头"
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
                                        value: "🦵 跷腿"
                                    }
                                }, [])
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
                            aiot.__ce__("text", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "section-title"
                                    ],
                                    value: "数据处理统计"
                                }
                            }, []),
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "stat-row"
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
                                                return _vm_.totalSamples;
                                            }
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-label"
                                            ],
                                            value: "传感器采样"
                                        }
                                    }, [])
                                ]),
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
                                                return _vm_.anonymizedCount;
                                            }
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-label"
                                            ],
                                            value: "脱敏处理"
                                        }
                                    }, [])
                                ]),
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
                                                return _vm_.encryptedCount;
                                            }
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "stat-label"
                                            ],
                                            value: "加密存储"
                                        }
                                    }, [])
                                ])
                            ])
                        ]),
                        aiot.__ce__("div", {
                            __vm__: _vm_,
                            __opts__: {
                                classList: [
                                    "summary-section"
                                ]
                            }
                        }, [
                            aiot.__ce__("div", {
                                __vm__: _vm_,
                                __opts__: {
                                    classList: [
                                        "summary-card"
                                    ]
                                }
                            }, [
                                aiot.__ce__("text", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "summary-title"
                                        ],
                                        value: "🛡️ 安全摘要"
                                    }
                                }, []),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "summary-item"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "summary-label"
                                            ],
                                            value: "数据本地化率"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "summary-value",
                                                "highlight"
                                            ],
                                            value: "100%"
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "summary-item"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "summary-label"
                                            ],
                                            value: "网络请求数"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "summary-value"
                                            ],
                                            value: "0"
                                        }
                                    }, [])
                                ]),
                                aiot.__ce__("div", {
                                    __vm__: _vm_,
                                    __opts__: {
                                        classList: [
                                            "summary-item"
                                        ]
                                    }
                                }, [
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "summary-label"
                                            ],
                                            value: "加密覆盖率"
                                        }
                                    }, []),
                                    aiot.__ce__("text", {
                                        __vm__: _vm_,
                                        __opts__: {
                                            classList: [
                                                "summary-value",
                                                "highlight"
                                            ],
                                            value: "100%"
                                        }
                                    }, [])
                                ])
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
        };
        return createPageHandler();
    })(global, globalThis, window, $app_exports$, $app_evaluate$);
}

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZXMvcmVwb3J0L3JlcG9ydC5qcyIsInNvdXJjZXMiOlsid2VicGFjazovL3Bvc3R1cmUtZ3VhcmQvd2VicGFjay9ydW50aW1lL3JzcGFja192ZXJzaW9uIiwid2VicGFjazovL3Bvc3R1cmUtZ3VhcmQvd2VicGFjay9ydW50aW1lL3JzcGFja191bmlxdWVfaWQiLCJ3ZWJwYWNrOi8vcG9zdHVyZS1ndWFyZC9zcmMvcGFnZXMvcmVwb3J0L3JlcG9ydC51eCJdLCJzb3VyY2VzQ29udGVudCI6WyJfX3dlYnBhY2tfcmVxdWlyZV9fLnJ2ID0gKCkgPT4gKFwiMS43LjEyXCIpIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5ydWlkID0gXCJidW5kbGVyPXJzcGFja0AxLjcuMTJcIjsiLCI8dGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJwYWdlXCIgQHN3aXBlPVwiYmFja1wiPlxuICAgIDwhLS0g6aG26YOo5a+86IiqIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgIDx0ZXh0IGNsYXNzPVwiYmFjay1idG5cIiBvbmNsaWNrPVwiYmFja1wiPuKAuTwvdGV4dD5cbiAgICAgIDx0ZXh0IGNsYXNzPVwidGl0bGVcIj7lgaXlurfmiqXooag8L3RleHQ+XG4gICAgICA8dGV4dCBjbGFzcz1cImRhdGUtdGV4dFwiPnt7IHRvZGF5RGF0ZSB9fTwvdGV4dD5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5LuK5pel5L2T5oCB6K+E5YiG6LaL5Yq/IC0tPlxuICAgIDxkaXYgY2xhc3M9XCJjaGFydC1zZWN0aW9uXCI+XG4gICAgICA8dGV4dCBjbGFzcz1cInNlY3Rpb24tdGl0bGVcIj7ku4rml6XkvZPmgIHor4TliIbotovlir88L3RleHQ+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2hhcnQtd3JhcFwiPlxuICAgICAgICA8Y2hhcnRcbiAgICAgICAgICBjbGFzcz1cImNoYXJ0XCJcbiAgICAgICAgICB0eXBlPVwibGluZVwiXG4gICAgICAgICAgb3B0aW9ucz1cInt7IHNjb3JlQ2hhcnRPcHRzIH19XCJcbiAgICAgICAgICBkYXRhc2V0cz1cInt7IHNjb3JlQ2hhcnREYXRhIH19XCJcbiAgICAgICAgPjwvY2hhcnQ+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjaGFydC1sYWJlbHNcIj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJsYWJlbC1pdGVtXCI+NjowMDwvdGV4dD5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJsYWJlbC1pdGVtXCI+MTI6MDA8L3RleHQ+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwibGFiZWwtaXRlbVwiPjE4OjAwPC90ZXh0PlxuICAgICAgICA8dGV4dCBjbGFzcz1cImxhYmVsLWl0ZW1cIj4yNDowMDwvdGV4dD5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPCEtLSDkvZPmgIHlvILluLjnsbvlnovliIbluIMgLS0+XG4gICAgPGRpdiBjbGFzcz1cImNoYXJ0LXNlY3Rpb25cIj5cbiAgICAgIDx0ZXh0IGNsYXNzPVwic2VjdGlvbi10aXRsZVwiPuS9k+aAgeW8guW4uOWIhuW4gzwvdGV4dD5cbiAgICAgIDxkaXYgY2xhc3M9XCJjaGFydC13cmFwXCI+XG4gICAgICAgIDxjaGFydFxuICAgICAgICAgIGNsYXNzPVwiY2hhcnRcIlxuICAgICAgICAgIHR5cGU9XCJiYXJcIlxuICAgICAgICAgIG9wdGlvbnM9XCJ7eyBiYXJDaGFydE9wdHMgfX1cIlxuICAgICAgICAgIGRhdGFzZXRzPVwie3sgYmFyQ2hhcnREYXRhIH19XCJcbiAgICAgICAgPjwvY2hhcnQ+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJiYXItbGVnZW5kXCI+XG4gICAgICAgIDx0ZXh0IGNsYXNzPVwibGVnZW5kLWl0ZW1cIiBzdHlsZT1cImNvbG9yOiAjZmY2YjZiO1wiPvCfqpEg5LmF5Z2QPC90ZXh0PlxuICAgICAgICA8dGV4dCBjbGFzcz1cImxlZ2VuZC1pdGVtXCIgc3R5bGU9XCJjb2xvcjogI2ZmZDkzZDtcIj7wn5OxIOS9juWktDwvdGV4dD5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJsZWdlbmQtaXRlbVwiIHN0eWxlPVwiY29sb3I6ICM0ZWNkYzQ7XCI+8J+mtSDot7fohb88L3RleHQ+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5pWw5o2u5aSE55CG57uf6K6hIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJzdGF0cy1zZWN0aW9uXCI+XG4gICAgICA8dGV4dCBjbGFzcz1cInNlY3Rpb24tdGl0bGVcIj7mlbDmja7lpITnkIbnu5/orqE8L3RleHQ+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LXJvd1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1pdGVtXCI+XG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0LXZhbHVlXCI+e3sgdG90YWxTYW1wbGVzIH19PC90ZXh0PlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwic3RhdC1sYWJlbFwiPuS8oOaEn+WZqOmHh+agtzwvdGV4dD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWl0ZW1cIj5cbiAgICAgICAgICA8dGV4dCBjbGFzcz1cInN0YXQtdmFsdWVcIj57eyBhbm9ueW1pemVkQ291bnQgfX08L3RleHQ+XG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJzdGF0LWxhYmVsXCI+6ISx5pWP5aSE55CGPC90ZXh0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaXRlbVwiPlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwic3RhdC12YWx1ZVwiPnt7IGVuY3J5cHRlZENvdW50IH19PC90ZXh0PlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwic3RhdC1sYWJlbFwiPuWKoOWvhuWtmOWCqDwvdGV4dD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cblxuICAgIDwhLS0g5a6J5YWo5pGY6KaBIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJzdW1tYXJ5LXNlY3Rpb25cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJzdW1tYXJ5LWNhcmRcIj5cbiAgICAgICAgPHRleHQgY2xhc3M9XCJzdW1tYXJ5LXRpdGxlXCI+8J+boe+4jyDlronlhajmkZjopoE8L3RleHQ+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzdW1tYXJ5LWl0ZW1cIj5cbiAgICAgICAgICA8dGV4dCBjbGFzcz1cInN1bW1hcnktbGFiZWxcIj7mlbDmja7mnKzlnLDljJbnjoc8L3RleHQ+XG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJzdW1tYXJ5LXZhbHVlIGhpZ2hsaWdodFwiPjEwMCU8L3RleHQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwic3VtbWFyeS1pdGVtXCI+XG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJzdW1tYXJ5LWxhYmVsXCI+572R57uc6K+35rGC5pWwPC90ZXh0PlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwic3VtbWFyeS12YWx1ZVwiPjA8L3RleHQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwic3VtbWFyeS1pdGVtXCI+XG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJzdW1tYXJ5LWxhYmVsXCI+5Yqg5a+G6KaG55uW546HPC90ZXh0PlxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwic3VtbWFyeS12YWx1ZSBoaWdobGlnaHRcIj4xMDAlPC90ZXh0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvdGVtcGxhdGU+XG5cbjxzY3JpcHQ+XG5leHBvcnQgZGVmYXVsdCB7XG4gIHByaXZhdGU6IHtcbiAgICB0b2RheURhdGU6ICcnLFxuICAgIC8vIOivhOWIhui2i+WKv+WbvlxuICAgIHNjb3JlQ2hhcnREYXRhOiBbXG4gICAgICB7XG4gICAgICAgIHN0cm9rZUNvbG9yOiAnIzAwZDRhYScsXG4gICAgICAgIGZpbGxDb2xvcjogJ3JnYmEoMCwyMTIsMTcwLDAuMiknLFxuICAgICAgICBkYXRhOiBbMTAwLCA5NSwgOTIsIDg4LCA4NSwgOTAsIDk1LCAxMDAsIDk4LCA5NSwgOTIsIDg4XSxcbiAgICAgICAgZ3JhZGllbnQ6IHRydWUsXG4gICAgICB9LFxuICAgIF0sXG4gICAgc2NvcmVDaGFydE9wdHM6IHtcbiAgICAgIHhBeGlzOiB7XG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxMSxcbiAgICAgICAgZGlzcGxheTogZmFsc2UsXG4gICAgICAgIGF4aXNUaWNrOiAxMixcbiAgICAgIH0sXG4gICAgICB5QXhpczoge1xuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogMTAwLFxuICAgICAgICBkaXNwbGF5OiBmYWxzZSxcbiAgICAgICAgYXhpc1RpY2s6IDExLFxuICAgICAgfSxcbiAgICAgIHNlcmllczoge1xuICAgICAgICBsaW5lU3R5bGU6IHsgd2lkdGg6ICcycHgnIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8g5byC5bi45YiG5biD5p+x54q25Zu+XG4gICAgYmFyQ2hhcnREYXRhOiBbXG4gICAgICB7XG4gICAgICAgIGZpbGxDb2xvcjogJyNmZjZiNmInLFxuICAgICAgICBkYXRhOiBbMywgMSwgMCwgMiwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMF0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBmaWxsQ29sb3I6ICcjZmZkOTNkJyxcbiAgICAgICAgZGF0YTogWzAsIDEsIDIsIDEsIDMsIDIsIDEsIDAsIDAsIDAsIDAsIDBdLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgZmlsbENvbG9yOiAnIzRlY2RjNCcsXG4gICAgICAgIGRhdGE6IFswLCAwLCAxLCAwLCAxLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBiYXJDaGFydE9wdHM6IHtcbiAgICAgIHhBeGlzOiB7XG4gICAgICAgIG1pbjogMCxcbiAgICAgICAgbWF4OiAxMSxcbiAgICAgICAgZGlzcGxheTogZmFsc2UsXG4gICAgICAgIGF4aXNUaWNrOiAxMixcbiAgICAgIH0sXG4gICAgICB5QXhpczoge1xuICAgICAgICBtaW46IDAsXG4gICAgICAgIG1heDogNSxcbiAgICAgICAgZGlzcGxheTogZmFsc2UsXG4gICAgICAgIGF4aXNUaWNrOiA2LFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIOe7n+iuoeaVsOaNrlxuICAgIHRvdGFsU2FtcGxlczogMCxcbiAgICBhbm9ueW1pemVkQ291bnQ6IDAsXG4gICAgZW5jcnlwdGVkQ291bnQ6IDAsXG4gIH0sXG5cbiAgb25SZWFkeSgpIHtcbiAgICB0aGlzLl91cGRhdGVEYXRlKClcbiAgICB0aGlzLl9sb2FkU3RhdHMoKVxuICB9LFxuXG4gIF91cGRhdGVEYXRlKCkge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKClcbiAgICBjb25zdCBtb250aCA9IG5vdy5nZXRNb250aCgpICsgMVxuICAgIGNvbnN0IGRheSA9IG5vdy5nZXREYXRlKClcbiAgICB0aGlzLnRvZGF5RGF0ZSA9IGAke21vbnRofeaciCR7ZGF5feaXpWBcbiAgfSxcblxuICBfbG9hZFN0YXRzKCkge1xuICAgIC8vIOaooeaLn+e7n+iuoeaVsOaNru+8iOWunumZheW6lOS7jiBEYXRhTWFuYWdlciDliqDovb3vvIlcbiAgICB0aGlzLnRvdGFsU2FtcGxlcyA9IDEyNTgwXG4gICAgdGhpcy5hbm9ueW1pemVkQ291bnQgPSAxMjU4MFxuICAgIHRoaXMuZW5jcnlwdGVkQ291bnQgPSA4NDIwXG5cbiAgICAvLyDnlJ/miJDmqKHmi5/otovlir/mlbDmja5cbiAgICB0aGlzLl9nZW5lcmF0ZU1vY2tEYXRhKClcbiAgfSxcblxuICBfZ2VuZXJhdGVNb2NrRGF0YSgpIHtcbiAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgY29uc3QgaG91ciA9IG5vdy5nZXRIb3VycygpXG5cbiAgICAvLyDnlJ/miJDku4rml6Xor4TliIbotovlir/vvIjmqKHmi5/vvIlcbiAgICBjb25zdCBzY29yZURhdGEgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTI7IGkrKykge1xuICAgICAgY29uc3QgaCA9IGkgKiAyXG4gICAgICBsZXQgc2NvcmUgPSAxMDBcbiAgICAgIGlmIChoIDwgOCkgc2NvcmUgPSA5NSArIE1hdGgucmFuZG9tKCkgKiA1XG4gICAgICBlbHNlIGlmIChoIDwgMTIpIHNjb3JlID0gODUgKyBNYXRoLnJhbmRvbSgpICogMTBcbiAgICAgIGVsc2UgaWYgKGggPCAxNCkgc2NvcmUgPSA4MCArIE1hdGgucmFuZG9tKCkgKiAxMFxuICAgICAgZWxzZSBpZiAoaCA8IDE4KSBzY29yZSA9IDg1ICsgTWF0aC5yYW5kb20oKSAqIDEwXG4gICAgICBlbHNlIHNjb3JlID0gOTAgKyBNYXRoLnJhbmRvbSgpICogMTBcblxuICAgICAgc2NvcmVEYXRhLnB1c2goTWF0aC5yb3VuZChzY29yZSkpXG4gICAgfVxuXG4gICAgdGhpcy5zY29yZUNoYXJ0RGF0YSA9IFtcbiAgICAgIHtcbiAgICAgICAgLi4udGhpcy5zY29yZUNoYXJ0RGF0YVswXSxcbiAgICAgICAgZGF0YTogc2NvcmVEYXRhLFxuICAgICAgfSxcbiAgICBdXG5cbiAgICAvLyDnlJ/miJDlvILluLjliIbluIPmlbDmja7vvIjmqKHmi5/vvIlcbiAgICB0aGlzLmJhckNoYXJ0RGF0YSA9IFtcbiAgICAgIHtcbiAgICAgICAgZmlsbENvbG9yOiAnI2ZmNmI2YicsXG4gICAgICAgIGRhdGE6IFsxLCAyLCAwLCAzLCAxLCAwLCAyLCAwLCAwLCAwLCAwLCAwXSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGZpbGxDb2xvcjogJyNmZmQ5M2QnLFxuICAgICAgICBkYXRhOiBbMCwgMSwgMiwgMSwgMiwgMywgMSwgMCwgMCwgMCwgMCwgMF0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBmaWxsQ29sb3I6ICcjNGVjZGM0JyxcbiAgICAgICAgZGF0YTogWzAsIDAsIDEsIDAsIDEsIDAsIDAsIDAsIDAsIDAsIDAsIDBdLFxuICAgICAgfSxcbiAgICBdXG4gIH0sXG5cbiAgYmFjayhldmVudCkge1xuICAgIGlmICghZXZlbnQgfHwgZXZlbnQuZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XG4gICAgICBpbXBvcnQoJ0BzeXN0ZW0ucm91dGVyJykudGhlbigocm91dGVyKSA9PiB7XG4gICAgICAgIHJvdXRlci5iYWNrKClcbiAgICAgIH0pXG4gICAgfVxuICB9LFxufVxuPC9zY3JpcHQ+XG5cbjxzdHlsZT5cbi5wYWdlIHtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgd2lkdGg6IDQ4MHB4O1xuICBoZWlnaHQ6IDQ4MHB4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMGEwYTBhO1xufVxuXG4uaGVhZGVyIHtcbiAgd2lkdGg6IDEwMCU7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgcGFkZGluZzogMTVweCAyMHB4O1xuICBtYXJnaW4tdG9wOiAxNXB4O1xufVxuXG4uYmFjay1idG4ge1xuICBmb250LXNpemU6IDMycHg7XG4gIGNvbG9yOiAjZmZmZmZmO1xuICB3aWR0aDogNDBweDtcbn1cblxuLnRpdGxlIHtcbiAgZm9udC1zaXplOiAyNHB4O1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG5cbi5kYXRlLXRleHQge1xuICBmb250LXNpemU6IDE2cHg7XG4gIGNvbG9yOiAjODg4ODg4O1xufVxuXG4vKiDlm77ooajljLrln58gKi9cbi5jaGFydC1zZWN0aW9uIHtcbiAgd2lkdGg6IDQyMHB4O1xuICBwYWRkaW5nOiAxMnB4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMWExYTJlO1xuICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICBtYXJnaW4tdG9wOiAxMHB4O1xufVxuXG4uc2VjdGlvbi10aXRsZSB7XG4gIGZvbnQtc2l6ZTogMTZweDtcbiAgY29sb3I6ICM4ODg4ODg7XG4gIG1hcmdpbi1ib3R0b206IDhweDtcbn1cblxuLmNoYXJ0LXdyYXAge1xuICB3aWR0aDogMzk2cHg7XG4gIGhlaWdodDogMTAwcHg7XG59XG5cbi5jaGFydCB7XG4gIHdpZHRoOiAzOTZweDtcbiAgaGVpZ2h0OiAxMDBweDtcbn1cblxuLmNoYXJ0LWxhYmVscyB7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgbWFyZ2luLXRvcDogNnB4O1xufVxuXG4ubGFiZWwtaXRlbSB7XG4gIGZvbnQtc2l6ZTogMTJweDtcbiAgY29sb3I6ICM2NjY2NjY7XG59XG5cbi5iYXItbGVnZW5kIHtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIG1hcmdpbi10b3A6IDhweDtcbn1cblxuLmxlZ2VuZC1pdGVtIHtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBtYXJnaW46IDAgOHB4O1xufVxuXG4vKiDnu5/orqHljLrln58gKi9cbi5zdGF0cy1zZWN0aW9uIHtcbiAgd2lkdGg6IDQyMHB4O1xuICBwYWRkaW5nOiAxMnB4O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMWExYTJlO1xuICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICBtYXJnaW4tdG9wOiAxMHB4O1xufVxuXG4uc3RhdC1yb3cge1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWFyb3VuZDtcbn1cblxuLnN0YXQtaXRlbSB7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG59XG5cbi5zdGF0LXZhbHVlIHtcbiAgZm9udC1zaXplOiAyNHB4O1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG59XG5cbi5zdGF0LWxhYmVsIHtcbiAgZm9udC1zaXplOiAxMnB4O1xuICBjb2xvcjogIzg4ODg4ODtcbiAgbWFyZ2luLXRvcDogNHB4O1xufVxuXG4vKiDlronlhajmkZjopoEgKi9cbi5zdW1tYXJ5LXNlY3Rpb24ge1xuICB3aWR0aDogNDIwcHg7XG4gIG1hcmdpbi10b3A6IDEwcHg7XG59XG5cbi5zdW1tYXJ5LWNhcmQge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMWExYTJlO1xuICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICBwYWRkaW5nOiAxMnB4IDE1cHg7XG59XG5cbi5zdW1tYXJ5LXRpdGxlIHtcbiAgZm9udC1zaXplOiAxNnB4O1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIG1hcmdpbi1ib3R0b206IDEwcHg7XG59XG5cbi5zdW1tYXJ5LWl0ZW0ge1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gIG1hcmdpbi1ib3R0b206IDZweDtcbn1cblxuLnN1bW1hcnktbGFiZWwge1xuICBmb250LXNpemU6IDE0cHg7XG4gIGNvbG9yOiAjODg4ODg4O1xufVxuXG4uc3VtbWFyeS12YWx1ZSB7XG4gIGZvbnQtc2l6ZTogMTRweDtcbiAgY29sb3I6ICNmZmZmZmY7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xufVxuXG4uc3VtbWFyeS12YWx1ZS5oaWdobGlnaHQge1xuICBjb2xvcjogIzAwZDRhYTtcbn1cbjwvc3R5bGU+XG4iXSwibmFtZXMiOlsiX193ZWJwYWNrX3JlcXVpcmVfXyIsIiIsInByaXZhdGUiLCJ0b2RheURhdGUiLCJzY29yZUNoYXJ0RGF0YSIsInN0cm9rZUNvbG9yIiwiZmlsbENvbG9yIiwiZGF0YSIsImdyYWRpZW50Iiwic2NvcmVDaGFydE9wdHMiLCJ4QXhpcyIsIm1pbiIsIm1heCIsImRpc3BsYXkiLCJheGlzVGljayIsInlBeGlzIiwic2VyaWVzIiwibGluZVN0eWxlIiwid2lkdGgiLCJiYXJDaGFydERhdGEiLCJiYXJDaGFydE9wdHMiLCJ0b3RhbFNhbXBsZXMiLCJhbm9ueW1pemVkQ291bnQiLCJlbmNyeXB0ZWRDb3VudCIsIm9uUmVhZHkiLCJfdXBkYXRlRGF0ZSIsIl9sb2FkU3RhdHMiLCJub3ciLCJEYXRlIiwibW9udGgiLCJnZXRNb250aCIsImRheSIsImdldERhdGUiLCJfZ2VuZXJhdGVNb2NrRGF0YSIsImhvdXIiLCJnZXRIb3VycyIsInNjb3JlRGF0YSIsImkiLCJoIiwic2NvcmUiLCJNYXRoIiwicmFuZG9tIiwicHVzaCIsInJvdW5kIiwiX29iamVjdFNwcmVhZCIsImJhY2siLCJldmVudCIsImRpcmVjdGlvbiIsIlByb21pc2UiLCJyZXNvbHZlIiwidGhlbiIsIl9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkIiwiJGFwcF9yZXF1aXJlJCIsInJvdXRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFBQUEsb0JBQW9CLEVBQUUsR0FBRyxJQUFPOzs7b0JDQWhDQSxvQkFBb0IsSUFBSSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkN3RjNCQyxJQUFBQSxXQUFBQSxRQUFBQSxPQUFBQSxHQUFlO3dCQUNiQyxTQUFTOzRCQUNQQyxXQUFXOzRCQUVYQyxnQkFBZ0I7Z0NBQ2Q7b0NBQ0VDLGFBQWE7b0NBQ2JDLFdBQVc7b0NBQ1hDLE1B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