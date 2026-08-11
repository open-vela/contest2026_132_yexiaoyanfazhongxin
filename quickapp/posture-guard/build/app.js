export default function(global, globalThis, window, $app_exports$, $app_evaluate$) {
    var org_app_require = $app_require$;
    (function(global, globalThis, window, $app_exports$, $app_evaluate$) {
        var setTimeout = global.setTimeout;
        var setInterval = global.setInterval;
        var clearTimeout = global.clearTimeout;
        var clearInterval = global.clearInterval;
        var $app_require$1 = global.$app_require$ || org_app_require;
        var createAppHandler = function() {
            return (()=>{
                var __webpack_modules__ = {
                    "./src/manifest.json" (module) {
                        "use strict";
                        module.exports = JSON.parse('{"package":"com.openvela.posture.guard","name":"体态安全卫士","versionName":"1.0.0","versionCode":1,"minPlatformVersion":1000,"icon":"/common/logo.png","deviceTypeList":["watch"],"features":[{"name":"system.sensor"},{"name":"system.storage"},{"name":"system.crypto"},{"name":"system.vibrator"},{"name":"system.prompt"},{"name":"system.router"},{"name":"service.health"}],"permissions":[{"name":"hapjs.permission.HEALTH"}],"config":{"logLevel":"log","designWidth":480,"background":{"features":["system.sensor","service.health"]}},"router":{"entry":"pages/index","pages":{"pages/index":{"component":"index"},"pages/posture":{"component":"posture"},"pages/privacy":{"component":"privacy"},"pages/report":{"component":"report"}}}}');
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
                (()=>{
                    var $app_style$ = [
                        [
                            [
                                [
                                    2,
                                    "div"
                                ]
                            ],
                            {
                                flexDirection: "column"
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
                        var _service = _interopRequireDefault($app_require$1("@app-module/service.health"));
                        var _system2 = _interopRequireDefault($app_require$1("@app-module/system.storage"));
                        function _interopRequireDefault(e) {
                            return e && e.__esModule ? e : {
                                default: e
                            };
                        }
                        var _default = exports.default = {
                            globalData: {
                                postureState: {
                                    current: 'normal',
                                    confidence: 1.0,
                                    lastAlertTime: 0,
                                    dailyAlertCount: 0
                                },
                                cryptoStore: null,
                                dataManager: null,
                                bgMonitorStarted: false
                            },
                            onCreate () {
                                console.log('[App] onCreate - 体态安全卫士启动');
                                this.globalData.postureState = {
                                    current: 'normal',
                                    confidence: 1.0,
                                    lastAlertTime: 0,
                                    dailyAlertCount: 0
                                };
                                this.globalData.bgMonitorStarted = false;
                            },
                            onDestroy () {
                                console.log('[App] onDestroy - 清理资源');
                                _system.default.unsubscribeAccelerometer();
                                _service.default.unsubscribeSample({
                                    dataType: _service.default.DATA_TYPES.HEART_RATE
                                });
                                this.globalData.bgMonitorStarted = false;
                            }
                        };
                    };
                    $app_script$({}, $app_exports$, $app_require$1);
                    $app_exports$.default.style = $app_style$;
                    $app_exports$.default.manifest = __webpack_require__("./src/manifest.json");
                    var $translateStyle$ = function(value) {
                        if ('string' == typeof value) return Object.fromEntries(value.split(';').filter((item)=>Boolean(item && item.trim())).map((item)=>{
                            const matchs = item.match(/([^:]+):(.*)/);
                            if (matchs && matchs.length > 2) return [
                                matchs[1].trim().replace(/-([a-z])/g, (_, match)=>match.toUpperCase()),
                                matchs[2].trim()
                            ];
                            return [];
                        }));
                        return value;
                    };
                    __webpack_require__.g.$translateStyle$ = $translateStyle$;
                })();
            })();
        };
        return createAppHandler();
    })(global, globalThis, window, $app_exports$, $app_evaluate$);
}

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcG9zdHVyZS1ndWFyZC9qc29ufC9ob21lL29wZW52ZWxhLWRldi9vcGVudmVsYS9jb250ZXN0MjAyNl8xMzJfeWV4aWFveWFuZmF6aG9uZ3hpbi9xdWlja2FwcC8udGVtcF9wb3N0dXJlLWd1YXJkL3NyYy9tYW5pZmVzdC5qc29uIiwid2VicGFjazovL3Bvc3R1cmUtZ3VhcmQvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9wb3N0dXJlLWd1YXJkL3dlYnBhY2svcnVudGltZS9yc3BhY2tfdmVyc2lvbiIsIndlYnBhY2s6Ly9wb3N0dXJlLWd1YXJkL3dlYnBhY2svcnVudGltZS9yc3BhY2tfdW5pcXVlX2lkIiwid2VicGFjazovL3Bvc3R1cmUtZ3VhcmQvc3JjL2FwcC51eCJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IEpTT04ucGFyc2UoJ3tcInBhY2thZ2VcIjpcImNvbS5vcGVudmVsYS5wb3N0dXJlLmd1YXJkXCIsXCJuYW1lXCI6XCLkvZPmgIHlronlhajljavlo6tcIixcInZlcnNpb25OYW1lXCI6XCIxLjAuMFwiLFwidmVyc2lvbkNvZGVcIjoxLFwibWluUGxhdGZvcm1WZXJzaW9uXCI6MTAwMCxcImljb25cIjpcIi9jb21tb24vbG9nby5wbmdcIixcImRldmljZVR5cGVMaXN0XCI6W1wid2F0Y2hcIl0sXCJmZWF0dXJlc1wiOlt7XCJuYW1lXCI6XCJzeXN0ZW0uc2Vuc29yXCJ9LHtcIm5hbWVcIjpcInN5c3RlbS5zdG9yYWdlXCJ9LHtcIm5hbWVcIjpcInN5c3RlbS5jcnlwdG9cIn0se1wibmFtZVwiOlwic3lzdGVtLnZpYnJhdG9yXCJ9LHtcIm5hbWVcIjpcInN5c3RlbS5wcm9tcHRcIn0se1wibmFtZVwiOlwic3lzdGVtLnJvdXRlclwifSx7XCJuYW1lXCI6XCJzZXJ2aWNlLmhlYWx0aFwifV0sXCJwZXJtaXNzaW9uc1wiOlt7XCJuYW1lXCI6XCJoYXBqcy5wZXJtaXNzaW9uLkhFQUxUSFwifV0sXCJjb25maWdcIjp7XCJsb2dMZXZlbFwiOlwibG9nXCIsXCJkZXNpZ25XaWR0aFwiOjQ4MCxcImJhY2tncm91bmRcIjp7XCJmZWF0dXJlc1wiOltcInN5c3RlbS5zZW5zb3JcIixcInNlcnZpY2UuaGVhbHRoXCJdfX0sXCJyb3V0ZXJcIjp7XCJlbnRyeVwiOlwicGFnZXMvaW5kZXhcIixcInBhZ2VzXCI6e1wicGFnZXMvaW5kZXhcIjp7XCJjb21wb25lbnRcIjpcImluZGV4XCJ9LFwicGFnZXMvcG9zdHVyZVwiOntcImNvbXBvbmVudFwiOlwicG9zdHVyZVwifSxcInBhZ2VzL3ByaXZhY3lcIjp7XCJjb21wb25lbnRcIjpcInByaXZhY3lcIn0sXCJwYWdlcy9yZXBvcnRcIjp7XCJjb21wb25lbnRcIjpcInJlcG9ydFwifX19fScpIiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKCgpID0+IHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5ydiA9ICgpID0+IChcIjEuNy4xMlwiKSIsIl9fd2VicGFja19yZXF1aXJlX18ucnVpZCA9IFwiYnVuZGxlcj1yc3BhY2tAMS43LjEyXCI7IiwiXG5cbjxzY3JpcHQ+XG4vKipcbiAqIOS9k+aAgeWuieWFqOWNq+WjqyAtIOW6lOeUqOWFpeWPo1xuICpcbiAqIOWFqOWxgOeUn+WRveWRqOacn+euoeeQhu+8mlxuICogLSBvbkNyZWF0ZTog5Yid5aeL5YyW5YWo5bGA5pWw5o2u44CB5ZCv5Yqo5ZCO5Y+w55uR5rWL5pyN5YqhXG4gKiAtIG9uRGVzdHJveTog5riF55CG6LWE5rqQ44CB5YGc5q2i5Lyg5oSf5Zmo6K6i6ZiFXG4gKi9cbmltcG9ydCBzZW5zb3IgZnJvbSAnQHN5c3RlbS5zZW5zb3InXG5pbXBvcnQgaGVhbHRoIGZyb20gJ0BzZXJ2aWNlLmhlYWx0aCdcbmltcG9ydCBzdG9yYWdlIGZyb20gJ0BzeXN0ZW0uc3RvcmFnZSdcblxuZXhwb3J0IGRlZmF1bHQge1xuICAvLyDlhajlsYDmlbDmja5cbiAgZ2xvYmFsRGF0YToge1xuICAgIC8vIOS9k+aAgeivhuWIq+eKtuaAgVxuICAgIHBvc3R1cmVTdGF0ZToge1xuICAgICAgY3VycmVudDogJ25vcm1hbCcsICAgICAgICAvLyDlvZPliY3kvZPmgIE6IG5vcm1hbC9zZWRlbnRhcnkvaGVhZF90aWx0L2xlZ19jcm9zc1xuICAgICAgY29uZmlkZW5jZTogMS4wLFxuICAgICAgbGFzdEFsZXJ0VGltZTogMCxcbiAgICAgIGRhaWx5QWxlcnRDb3VudDogMCxcbiAgICB9LFxuICAgIC8vIOWKoOWvhuWtmOWCqOWunuS+i++8iOW7tui/n+WIneWni+WMlu+8iVxuICAgIGNyeXB0b1N0b3JlOiBudWxsLFxuICAgIC8vIOaVsOaNrueuoeeQhuWZqOWunuS+i1xuICAgIGRhdGFNYW5hZ2VyOiBudWxsLFxuICAgIC8vIOWQjuWPsOebkea1i+aYr+WQpuW3suWQr+WKqFxuICAgIGJnTW9uaXRvclN0YXJ0ZWQ6IGZhbHNlLFxuICB9LFxuXG4gIG9uQ3JlYXRlKCkge1xuICAgIGNvbnNvbGUubG9nKCdbQXBwXSBvbkNyZWF0ZSAtIOS9k+aAgeWuieWFqOWNq+Wjq+WQr+WKqCcpXG4gICAgLy8g5Yid5aeL5YyW5YWo5bGA54q25oCBXG4gICAgdGhpcy5nbG9iYWxEYXRhLnBvc3R1cmVTdGF0ZSA9IHtcbiAgICAgIGN1cnJlbnQ6ICdub3JtYWwnLFxuICAgICAgY29uZmlkZW5jZTogMS4wLFxuICAgICAgbGFzdEFsZXJ0VGltZTogMCxcbiAgICAgIGRhaWx5QWxlcnRDb3VudDogMCxcbiAgICB9XG4gICAgdGhpcy5nbG9iYWxEYXRhLmJnTW9uaXRvclN0YXJ0ZWQgPSBmYWxzZVxuICB9LFxuXG4gIG9uRGVzdHJveSgpIHtcbiAgICBjb25zb2xlLmxvZygnW0FwcF0gb25EZXN0cm95IC0g5riF55CG6LWE5rqQJylcbiAgICAvLyDlgZzmraLkvKDmhJ/lmajorqLpmIVcbiAgICBzZW5zb3IudW5zdWJzY3JpYmVBY2NlbGVyb21ldGVyKClcbiAgICBoZWFsdGgudW5zdWJzY3JpYmVTYW1wbGUoeyBkYXRhVHlwZTogaGVhbHRoLkRBVEFfVFlQRVMuSEVBUlRfUkFURSB9KVxuICAgIHRoaXMuZ2xvYmFsRGF0YS5iZ01vbml0b3JTdGFydGVkID0gZmFsc2VcbiAgfSxcbn1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4vKiDlhajlsYDmoLflvI8gKi9cbmRpdiB7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG59XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbIm1vZHVsZSIsIkpTT04iLCJfX3dlYnBhY2tfcmVxdWlyZV9fIiwiZ2xvYmFsVGhpcyIsIkZ1bmN0aW9uIiwiZSIsIndpbmRvdyIsIl9zeXN0ZW0iLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwiJGFwcF9yZXF1aXJlJCIsIl9zZXJ2aWNlIiwiX3N5c3RlbTIiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsImdsb2JhbERhdGEiLCJwb3N0dXJlU3RhdGUiLCJjdXJyZW50IiwiY29uZmlkZW5jZSIsImxhc3RBbGVydFRpbWUiLCJkYWlseUFsZXJ0Q291bnQiLCJjcnlwdG9TdG9yZSIsImRhdGFNYW5hZ2VyIiwiYmdNb25pdG9yU3RhcnRlZCIsIm9uQ3JlYXRlIiwiY29uc29sZSIsImxvZyIsIm9uRGVzdHJveSIsInNlbnNvciIsInVuc3Vic2NyaWJlQWNjZWxlcm9tZXRlciIsImhlYWx0aCIsInVuc3Vic2NyaWJlU2FtcGxlIiwiZGF0YVR5cGUiLCJEQVRBX1RZUEVTIiwiSEVBUlRfUkFURSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozt3QkFBQUEsT0FBTyxPQUFPLEdBQUdDLEtBQUssS0FBSyxDQUFDOzs7Ozs7Ozs7Ozs7OztvQkNBNUJDLG9CQUFvQixDQUFDLEdBQUcsQUFBQzt3QkFDeEIsSUFBSSxBQUFzQixZQUF0QixPQUFPQyxZQUF5QixPQUFPQTt3QkFDM0MsSUFBSTs0QkFDSCxPQUFPLElBQUksSUFBSSxJQUFJQyxTQUFTO3dCQUM3QixFQUFFLE9BQU9DLEdBQUc7NEJBQ1gsSUFBSSxBQUFrQixZQUFsQixPQUFPQyxRQUFxQixPQUFPQTt3QkFDeEM7b0JBQ0Q7OztvQkNQQUosb0JBQW9CLEVBQUUsR0FBRyxJQUFPOzs7b0JDQWhDQSxvQkFBb0IsSUFBSSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3dCQ1UzQixJQUFBSyxVQUFBQyx1QkFBQUMsZUFBQTt3QkFDQSxJQUFBQyxXQUFBRix1QkFBQUMsZUFBQTt3QkFDQSxJQUFBRSxXQUFBSCx1QkFBQUMsZUFBQTt3QkFBcUMsU0FBQUQsdUJBQUFILENBQUE7NEJBQUEsT0FBQUEsS0FBQUEsRUFBQU8sVUFBQSxHQUFBUCxJQUFBO2dDQUFBUSxTQUFBUjs0QkFBQTt3QkFBQTt3QkFUckMsSUFBQVMsV0FBQUMsUUFBQUYsT0FBQSxHQVdlOzRCQUViRyxZQUFZO2dDQUVWQyxjQUFjO29DQUNaQyxTQUFTO29DQUNUQyxZQUFZO29DQUNaQyxlQUFlO29DQUNmQyxpQkFBaUI7Z0NBQ25CO2dDQUVBQyxhQUFhO2dDQUViQyxhQUFhO2dDQUViQyxrQkFBa0I7NEJBQ3BCOzRCQUVBQztnQ0FDRUMsUUFBUUMsR0FBRyxDQUFDO2dDQUVaLElBQUksQ0FBQ1gsVUFBVSxDQUFDQyxZQUFZLEdBQUc7b0NBQzdCQyxTQUFTO29DQUNUQyxZQUFZO29DQUNaQyxlQUFlO29DQUNmQyxpQkFBaUI7Z0NBQ25CO2dDQUNBLElBQUksQ0FBQ0wsVUFBVSxDQUFDUSxnQkFBZ0IsR0FBRzs0QkFDckM7NEJBRUFJO2dDQUNFRixRQUFRQyxHQUFHLENBQUM7Z0NBRVpFLFFBQUFBLE9BQU0sQ0FBQ0Msd0JBQXdCO2dDQUMvQkMsU0FBQUEsT0FBTSxDQUFDQyxpQkFBaUIsQ0FBQztvQ0FBRUMsVUFBVUYsU0FBQUEsT0FBTSxDQUFDRyxVQUFVLENBQUNDLFVBQVU7Z0NBQUM7Z0NBQ2xFLElBQUksQ0FBQ25CLFVBQVUsQ0FBQ1EsZ0JBQWdCLEdBQUc7NEJBQ3JDO3dCQUNGIn0=