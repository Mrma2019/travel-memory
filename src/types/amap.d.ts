// 扩展 @types/amap-js-api 中缺失的插件和实例方法类型
declare namespace AMap {
  // --- 插件类型 ---

  /** 地理编码/逆地理编码 */
  class Geocoder {
    constructor(options?: { city?: string; radius?: number; batch?: boolean; extensions?: string })
    getAddress(location: LocationValue, callback: (status: string, result: { regeocode: { formattedAddress: string } }) => void): void
    getLocation(address: string, callback: (status: string, result: { geocodes: Array<{ location: LngLat }> }) => void): void
  }

  /** 自动补全搜索 */
  class AutoComplete {
    constructor(options?: { city?: string; citylimit?: boolean; datatype?: string })
    search(keyword: string, callback: (status: string, result: { info: string; tips?: Array<{ location: { lng: number; lat: number }; name: string }> }) => void): void
  }

  // --- 实例方法补充 (JSAPI v2.0 实例有这些方法, 但 @types 没有) ---

  interface Marker<ExtraData = any> {
    /** 将覆盖物添加到地图 */
    addTo(map: Map): this
    /** 从地图上移除覆盖物 */
    removeFrom(map: Map): this
  }

  interface Polyline<ExtraData = any> {
    addTo(map: Map): this
    removeFrom(map: Map): this
  }

  interface InfoWindow<ExtraData = any> {
    addTo(map: Map): this
    removeFrom(map: Map): this
  }
}
